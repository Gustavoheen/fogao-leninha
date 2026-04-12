/**
 * Webhook principal do bot WhatsApp — Fogão a Lenha da Leninha
 * Fluxo: site-primeiro → WhatsApp como plano B → IA anota pedido → injeta no sistema
 */

const { createClient } = require('@supabase/supabase-js')
const { enviarTexto, enviarBotoes, enviarLista, enviarImagem } = require('../_lib/evolution')
const { gerarPixCopiaCola } = require('../_lib/pix')
const { chatComIA, buscarCardapioEConfig, formatarCardapioDoDia } = require('../_lib/gemini')
const { transcreverAudio } = require('../_lib/whisper')

// Schema fogao = dados do restaurante (pedidos, clientes, configuracoes, cardapio_hoje)
// Schema public = tabelas do bot (fogao_whatsapp_sessions, fogao_alertas)
// Tudo no schema public (fogao schema não está exposto no Supabase)
function getSupabaseFogao() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}
function getSupabasePublic() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

const LINK_SITE = 'https://fogaoleninha2.vercel.app'
const NOME_LOJA = 'Fogão a Lenha da Leninha'
const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000

// ─── Helpers ───────────────────────────────────────────────

function limparTelefone(jid) { return (jid || '').replace(/@.*$/, '').replace(/\D/g, '') }

function extrairTextoMensagem(msg) {
  if (!msg) return ''
  return (msg.conversation || msg.extendedTextMessage?.text || msg.buttonsResponseMessage?.selectedButtonId || msg.buttonsResponseMessage?.selectedDisplayText || msg.listResponseMessage?.singleSelectReply?.selectedRowId || msg.listResponseMessage?.title || msg.templateButtonReplyMessage?.selectedId || msg.templateButtonReplyMessage?.selectedDisplayText || '').trim()
}

function extrairImagem(msg) { return !!(msg?.imageMessage) }

function extrairAudioInfo(msg) {
  const audio = msg?.audioMessage
  if (!audio) return null
  return { mimetype: audio.mimetype || 'audio/ogg', url: audio.url || null }
}

function limparNome(nome) {
  if (!nome) return null
  const limpo = nome.replace(/^(me chamo|meu nome [eé]|sou o|sou a|pode me chamar de|eu sou|nome:?)\s*/i, '').replace(/[.!,]+$/, '').trim()
  if (!limpo || limpo.length < 2 || /^\d+$/.test(limpo)) return null
  return limpo
}

// ─── Supabase session helpers ──────────────────────────────

async function buscarSessao(sbPublic, telefone) {
  const { data } = await sbPublic.from('fogao_whatsapp_sessions').select('*').eq('telefone', telefone).single()
  return data
}

async function upsertSessao(sbPublic, telefone, updates) {
  const { data } = await sbPublic.from('fogao_whatsapp_sessions').upsert({ telefone, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'telefone' }).select().single()
  return data
}

async function salvarBotMsgId(sbPublic, telefone, msgId) {
  if (!msgId) return
  const sessao = await buscarSessao(sbPublic, telefone)
  const ids = (sessao?.bot_msg_ids || []).slice(-20)
  ids.push(msgId)
  await sbPublic.from('fogao_whatsapp_sessions').update({ bot_msg_ids: ids, updated_at: new Date().toISOString() }).eq('telefone', telefone)
}

async function enviarBot(sbPublic, telefone, texto) {
  const result = await enviarTexto(telefone, texto)
  const msgId = result?.key?.id || result?.messageId || null
  await salvarBotMsgId(sbPublic, telefone, msgId)
  return result
}

async function buscarCliente(supabase, telefone) {
  const telLimpo = telefone.replace(/^55/, '')
  const { data } = await supabase.from('clientes').select('*').or(`telefone.eq.${telefone},telefone.eq.${telLimpo}`).limit(1).single()
  return data
}

async function injetarPedido(supabase, sessao, config) {
  const pedido = sessao.ia_pedido
  const dados = sessao.dados_cliente || {}
  const telefone = sessao.telefone
  const telLimpo = telefone.replace(/^55/, '')

  const agora = new Date()
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dataRef = new Date(agora)
  if (dataRef.getHours() < 5) dataRef.setDate(dataRef.getDate() - 1)

  const total = (pedido.subtotal || 0) + (pedido.embalagens_adicionais || 0)

  // Buscar ou criar cliente
  let clienteId = null
  const clienteExistente = await buscarCliente(sbFogao, telefone)
  if (clienteExistente) {
    clienteId = clienteExistente.id
  } else {
    const novoId = Date.now()
    await supabase.from('clientes').insert({
      id: novoId, nome: dados.nome || 'Cliente WhatsApp', telefone: telLimpo,
      rua: dados.rua || '', bairro: dados.bairro || '', numero: dados.numero || '',
      referencia: dados.referencia || '', tipo: 'normal',
    })
    clienteId = novoId
  }

  const itens = (pedido.itens || []).map(i => ({
    tipo: i.tipo || 'marmitex',
    opcaoNome: i.opcaoNome || i.nome || 'Marmitex',
    tamanho: i.tamanho || 'G',
    proteina: i.proteina || '',
    semItens: i.semItens || [],
    preco: i.preco || 0,
    nome: i.nome || i.opcaoNome || '',
  }))

  const id = Date.now()
  await sbFogao.from('pedidos').insert({
    id,
    clienteId,
    clienteNome: dados.nome || sessao.nome_contato || 'Cliente WhatsApp',
    clienteTelefone: telLimpo,
    rua: dados.rua || '', bairro: dados.bairro || '', numero: dados.numero || '', referencia: dados.referencia || '',
    itens,
    total,
    pagamento: dados.pagamento || 'Pix',
    status: 'aberto',
    statusPagamento: dados.pagamento === 'Mensalista' ? 'mensalista' : dados.pagamento === 'Dinheiro' ? 'pago' : 'pendente',
    embalagensAdicionais: pedido.embalagens_adicionais || 0,
    observacoes: pedido.observacao || '',
    horarioEntrega: pedido.horario_entrega || dados.horario_entrega || '',
    motoboy: '',
    origem: 'whatsapp',
  })

  // Salvar/atualizar cliente no banco
  if (dados.nome || dados.rua) {
    const telCliente = telLimpo
    const existente = clienteExistente
    await sbFogao.from('clientes').upsert({
      id: existente?.id || Date.now(),
      nome: dados.nome || existente?.nome || 'Cliente WhatsApp',
      telefone: telCliente,
      rua: dados.rua || existente?.rua || '',
      bairro: dados.bairro || existente?.bairro || '',
      numero: dados.numero || existente?.numero || '',
      referencia: dados.referencia || existente?.referencia || '',
    }, { onConflict: 'id' }).catch(() => {})
  }

  return { id, total, numeroPedido: id }
}

// ─── Main handler ──────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const body = req.body
    const eventNorm = ((body.event || '') + '').toUpperCase().replace(/\./g, '_')
    if (eventNorm !== 'MESSAGES_UPSERT') return res.status(200).json({ ok: true, skip: body.event })

    const data = body.data
    if (!data?.key?.remoteJid || data.key.remoteJid.includes('@g.us')) return res.status(200).json({ ok: true, skip: 'no jid or group' })

    const sbFogao = getSupabaseFogao()   // pedidos, clientes, configuracoes
    const sbPublic = getSupabasePublic() // sessões, alertas do bot
    const telefone = limparTelefone(data.key.remoteJid)
    const fromMe = data.key.fromMe === true
    const msgId = data.key.id
    const nomeContato = data.pushName || ''

    // Human takeover detection
    if (fromMe) {
      const sessao = await buscarSessao(sbPublic, telefone)
      const botIds = sessao?.bot_msg_ids || []
      if (!botIds.includes(msgId)) await upsertSessao(sbPublic, telefone, { humano_ativo: true, estado: 'humano' })
      return res.status(200).json({ ok: true, handled: 'outgoing' })
    }

    // Extrair texto ou transcrever áudio
    let texto = extrairTextoMensagem(data.message)
    const audioInfo = extrairAudioInfo(data.message)
    if (!texto && audioInfo) {
      // Evolution API pode enviar a URL do áudio em vários campos
      const mediaUrl = data.message?.audioMessage?.url
        || data.message?.mediaUrl
        || data.media?.url
        || body.media?.url
        || data.message?.audioMessage?.directPath
        || null
      const base64 = data.message?.audioMessage?.base64
        || data.message?.base64
        || body.base64
        || data.body?.base64
        || null

      console.log('[Audio] mediaUrl:', mediaUrl ? 'SIM' : 'NAO', '| base64:', base64 ? `SIM (${String(base64).length} chars)` : 'NAO')

      if (mediaUrl || base64) {
        texto = await transcreverAudio(mediaUrl, base64, audioInfo.mimetype)
        if (texto) console.log('[Audio] Transcrito:', texto.substring(0, 100))
        else console.log('[Audio] Transcrição vazia')
      } else {
        console.log('[Audio] Sem URL nem base64 — áudio não acessível')
        // Tentar baixar via Evolution API
        try {
          const evoUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
          const evoKey = process.env.EVOLUTION_API_KEY || ''
          const evoInst = process.env.EVOLUTION_INSTANCE || 'fogao'
          const mediaRes = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${evoInst}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: evoKey },
            body: JSON.stringify({ message: data }),
          })
          const mediaData = await mediaRes.json()
          if (mediaData?.base64) {
            texto = await transcreverAudio(null, mediaData.base64, audioInfo.mimetype)
            if (texto) console.log('[Audio] Transcrito via getBase64:', texto.substring(0, 100))
          }
        } catch (e) {
          console.error('[Audio] Erro ao buscar base64 via Evolution:', e.message)
        }
      }
    }
    if (!texto) return res.status(200).json({ ok: true, skip: 'no text' })

    let sessao = await buscarSessao(sbPublic, telefone)
    const { config } = await buscarCardapioEConfig()

    const modoBot = config.bot_ativo || 'auto'
    if (modoBot === 'desligado') return res.status(200).json({ ok: true, skip: 'bot_desligado' })

    // Timeout
    if (sessao?.updated_at && (Date.now() - new Date(sessao.updated_at).getTime() > SESSION_TIMEOUT_MS)) {
      sessao = await upsertSessao(sbPublic, telefone, { estado: 'novo', humano_ativo: false, nome_contato: nomeContato, bot_msg_ids: [], ia_historico: [], ia_pedido: null, dados_cliente: null })
    }
    if (!sessao) sessao = await upsertSessao(sbPublic, telefone, { estado: 'novo', humano_ativo: false, nome_contato: nomeContato, bot_msg_ids: [], ia_historico: [], ia_pedido: null, dados_cliente: null })
    if (sessao.humano_ativo) return res.status(200).json({ ok: true, skip: 'humano_ativo' })

    // Fora do horário
    const aberto = modoBot === 'ligado' ? true : (config.lojaAberta !== false)
    if (!aberto) {
      if (sessao.estado !== 'fora_horario') {
        await enviarBot(sbPublic, telefone, `Olá${nomeContato ? `, ${nomeContato}` : ''}! 👋\n\nO *${NOME_LOJA}* está *fechado* no momento.\n\nConfira nosso cardápio:\n👉 ${LINK_SITE}\n\nVolte amanhã! 🍲`)
        await upsertSessao(sbPublic, telefone, { estado: 'fora_horario', nome_contato: nomeContato })
      } else {
        await enviarBot(sbPublic, telefone, `Ainda estamos fechados! ⏰\nCardápio: 👉 ${LINK_SITE}`)
      }
      return res.status(200).json({ ok: true, action: 'fora_horario' })
    }

    const textoLower = texto.toLowerCase()
    const estado = sessao.estado

    switch (estado) {
      // ═══ PRIMEIRO CONTATO — já manda cardápio do dia ═══
      case 'novo': {
        const { cardapio: cardHoje, bebidas } = await buscarCardapioEConfig()
        const cardapioTexto = formatarCardapioDoDia(cardHoje, bebidas)
        const opcoes = (cardHoje.opcoes || []).filter(o => o.disponivel !== false)

        await enviarBot(sbPublic, telefone,
          `Olá${nomeContato ? `, ${nomeContato}` : ''}! 👋\n\n` +
          `Bem-vindo ao *${NOME_LOJA}*! 🍲\n\n` +
          `${cardapioTexto}`
        )

        // Botões pra escolher opção
        const botoes = opcoes.map((o, i) => ({
          id: `btn_op${i + 1}`,
          text: `${o.nome || 'Opção ' + (i + 1)}${o.tipoCarnes === 'especial' && o.pratoEspecial ? ' — ' + o.pratoEspecial : ''}`,
        }))
        if (botoes.length > 0) {
          await enviarBotoes(telefone, `Qual opção vai ser hoje?`, botoes, NOME_LOJA)
        }

        await upsertSessao(sbPublic, telefone, {
          estado: 'escolhendo_opcao', nome_contato: nomeContato,
          ia_historico: [], ia_pedido: null, dados_cliente: null,
        })
        return res.status(200).json({ ok: true, action: 'saudacao_cardapio' })
      }

      // ═══ ESCOLHENDO OPÇÃO ═══
      case 'escolhendo_opcao': {
        const { cardapio: cardHoje3, bebidas: beb3 } = await buscarCardapioEConfig()
        const opcoes3 = (cardHoje3.opcoes || []).filter(o => o.disponivel !== false)
        const carnes3 = (cardHoje3.carnes || []).filter(c => c && c.trim())

        // Detectar qual opção escolheu
        let opcaoIdx = -1
        if (/btn_op1|op.*1|opção.*1|primeira|1/i.test(textoLower)) opcaoIdx = 0
        else if (/btn_op2|op.*2|opção.*2|segunda|2/i.test(textoLower)) opcaoIdx = 1
        else if (/btn_op3|op.*3|opção.*3|terceira|3/i.test(textoLower)) opcaoIdx = 2

        if (opcaoIdx < 0 || opcaoIdx >= opcoes3.length) {
          // Não entendeu — pode ser um pedido direto, manda pra IA
          const { cardapio: ch, bebidas: bb } = await buscarCardapioEConfig()
          await enviarBot(sbPublic, telefone, `${formatarCardapioDoDia(ch, bb)}\nMe diga o que deseja ou escolha a opção! 📝`)
          await upsertSessao(sbPublic, telefone, { estado: 'pedindo_ia', ia_historico: [], ia_pedido: null, dados_cliente: null })
          // Passar a mensagem original pra IA processar
          const { texto: respostaIA, pedido: pedidoIA } = await chatComIA([], texto)
          if (respostaIA) await enviarBot(sbPublic, telefone, respostaIA)
          await upsertSessao(sbPublic, telefone, { ia_historico: [{ role: 'user', text: texto }, { role: 'model', text: respostaIA }] })
          return res.status(200).json({ ok: true, action: 'ia_direto' })
        }

        const opcaoEscolhida = opcoes3[opcaoIdx]
        const isEspecial = opcaoEscolhida.tipoCarnes === 'especial'

        if (isEspecial) {
          // Opção especial — não tem escolha de carne, perguntar tamanho direto
          await enviarBot(sbPublic, telefone,
            `🍽️ *${opcaoEscolhida.nome}* — ${opcaoEscolhida.pratoEspecial || 'Prato especial'} ✅\n\n` +
            `Qual tamanho?`
          )
          await enviarBotoes(telefone, `Escolha o tamanho:`, [
            { id: 'btn_P', text: `📦 Pequena (P) — R$ ${cardHoje3.precoP}` },
            { id: 'btn_G', text: `📦 Grande (G) — R$ ${cardHoje3.precoG}` },
          ], 'Tamanho')
          await upsertSessao(sbPublic, telefone, {
            estado: 'pedindo_ia',
            ia_historico: [{ role: 'user', text: `Quero ${opcaoEscolhida.nome} (${opcaoEscolhida.pratoEspecial})` }],
            ia_pedido: null, dados_cliente: null,
          })
        } else {
          // Opção padrão — precisa escolher carne
          if (carnes3.length > 0) {
            const botoesCarnes = carnes3.map((c, i) => ({ id: `btn_carne${i + 1}`, text: `🥩 ${c}` }))
            await enviarBot(sbPublic, telefone, `🍽️ *${opcaoEscolhida.nome}* ✅\n\nQual carne?`)
            await enviarBotoes(telefone, `Escolha a carne:`, botoesCarnes.slice(0, 3), 'Carne')
          } else {
            await enviarBot(sbPublic, telefone, `🍽️ *${opcaoEscolhida.nome}* ✅\n\nQual tamanho?`)
            await enviarBotoes(telefone, `Escolha:`, [
              { id: 'btn_P', text: `📦 Pequena (P) — R$ ${cardHoje3.precoP}` },
              { id: 'btn_G', text: `📦 Grande (G) — R$ ${cardHoje3.precoG}` },
            ], 'Tamanho')
          }
          await upsertSessao(sbPublic, telefone, {
            estado: 'pedindo_ia',
            ia_historico: [{ role: 'user', text: `Quero ${opcaoEscolhida.nome}` }],
            ia_pedido: null, dados_cliente: null,
          })
        }
        return res.status(200).json({ ok: true, action: 'opcao_escolhida' })
      }

      case 'saudacao':
      case 'insistiu_site':
      case 'ofereceu_whatsapp':
      case 'perguntou_duvida': {
        const querAtendente = /atendente|humano|pessoa|falar com/i.test(textoLower)
        if (querAtendente) {
          await enviarBot(sbPublic, telefone, `Vou te direcionar para um atendente! 🙋‍♂️\nAguarde. 🙏`)
          await upsertSessao(sbPublic, telefone, { estado: 'humano', humano_ativo: true })
          return res.status(200).json({ ok: true, action: 'humano' })
        }

        // Manda cardápio + botões de opção
        const { cardapio: cardHoje2, bebidas: beb2 } = await buscarCardapioEConfig()
        const cardTexto2 = formatarCardapioDoDia(cardHoje2, beb2)
        const opcoes2 = (cardHoje2.opcoes || []).filter(o => o.disponivel !== false)
        await enviarBot(sbPublic, telefone, `Nosso cardápio de hoje:\n\n${cardTexto2}`)
        const botoes2 = opcoes2.map((o, i) => ({
          id: `btn_op${i + 1}`,
          text: `${o.nome || 'Opção ' + (i + 1)}${o.tipoCarnes === 'especial' && o.pratoEspecial ? ' — ' + o.pratoEspecial : ''}`,
        }))
        if (botoes2.length > 0) await enviarBotoes(telefone, `Qual opção?`, botoes2, NOME_LOJA)
        await upsertSessao(sbPublic, telefone, { estado: 'escolhendo_opcao', ia_historico: [], ia_pedido: null, dados_cliente: null })
        return res.status(200).json({ ok: true, action: 'cardapio_opcoes' })
      }

      case 'fora_horario': {
        await enviarBot(sbPublic, telefone, `Ainda estamos fechados! ⏰\n👉 ${LINK_SITE}`)
        return res.status(200).json({ ok: true })
      }

      // ═══ PEDINDO VIA IA ═══
      case 'pedindo_ia': {
        const historico = sessao.ia_historico || []
        const { texto: respostaIA, pedido } = await chatComIA(historico, texto)
        const novoHistorico = [...historico, { role: 'user', text: texto }, { role: 'model', text: respostaIA }].slice(-30)

        if (pedido) {
          await enviarBot(sbPublic, telefone, respostaIA)
          const ext = pedido.dados_extraidos || {}
          const clienteCadastrado = await buscarCliente(sbFogao, telefone)
          const dados = {}
          dados.nome = limparNome(ext.nome) || limparNome(clienteCadastrado?.nome) || limparNome(sessao.nome_contato) || limparNome(nomeContato) || null
          if (ext.endereco) { dados.rua = ext.endereco; dados.bairro = '' }
          else if (clienteCadastrado?.rua) { dados.rua = clienteCadastrado.rua; dados.bairro = clienteCadastrado.bairro; dados.numero = clienteCadastrado.numero }
          if (ext.pagamento) dados.pagamento = ext.pagamento

          let prox = 'coletando_nome'
          if (dados.nome) { prox = 'coletando_endereco'; if (dados.rua) { prox = 'coletando_pagamento'; if (dados.pagamento) prox = 'confirmando_pedido' } }

          await upsertSessao(sbPublic, telefone, { estado: prox, ia_historico: novoHistorico, ia_pedido: pedido, dados_cliente: dados })

          if (prox === 'coletando_nome') await enviarBot(sbPublic, telefone, `Qual seu *nome*? 😊`)
          else if (prox === 'coletando_endereco') {
            if (clienteCadastrado?.rua) {
              const endSalvo = `${clienteCadastrado.rua}${clienteCadastrado.numero ? ', ' + clienteCadastrado.numero : ''}${clienteCadastrado.bairro ? ' — ' + clienteCadastrado.bairro : ''}`
              await enviarBot(sbPublic, telefone, `Perfeito, *${dados.nome}*! 🎉\n\n📍 Último endereço:\n*${endSalvo}*`)
              await enviarBotoes(telefone, `Entrega nesse endereço?`, [{ id: 'btn_mesmo_end', text: '✅ Sim, esse mesmo' }, { id: 'btn_outro_end', text: '📍 Outro endereço' }], 'Endereço')
              await upsertSessao(sbPublic, telefone, { estado: 'confirmando_endereco', dados_cliente: { ...dados, _enderecoSugerido: endSalvo, rua: clienteCadastrado.rua, bairro: clienteCadastrado.bairro, numero: clienteCadastrado.numero } })
            } else {
              await enviarBot(sbPublic, telefone, `Perfeito, *${dados.nome}*! 🎉\n\nQual o *endereço* de entrega?\n_(Rua, número, bairro)_`)
            }
          }
          else if (prox === 'coletando_pagamento') {
            await enviarLista(telefone, `Como deseja pagar?`, '💳 Pagamento', [{ titulo: 'Pagamento', itens: [
              { id: 'btn_pix', titulo: '💰 Pix', descricao: 'QR Code + copia e cola' },
              { id: 'btn_dinheiro', titulo: '💵 Dinheiro', descricao: 'Pague na entrega' },
              { id: 'btn_cartao', titulo: '💳 Cartão', descricao: 'Motoboy cobra na entrega' },
              { id: 'btn_mensalista', titulo: '📋 Mensalista', descricao: 'Cliente mensal/quinzenal' },
            ]}], 'Forma de pagamento')
          }
          else if (prox === 'confirmando_pedido') {
            const total = (pedido.subtotal || 0) + (pedido.embalagens_adicionais || 0)
            const linhas = pedido.itens.map(i => `  ${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''}) — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`)
            let resumo = `📋 *RESUMO*\n\n👤 ${dados.nome}\n📍 ${dados.rua || 'Retirar no local'}\n💳 ${dados.pagamento}\n\n🛒 *Itens:*\n${linhas.join('\n')}\n\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`
            await enviarBot(sbPublic, telefone, resumo)
            await enviarBotoes(telefone, `Tudo certo?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }], 'Confirmação')
          }
          return res.status(200).json({ ok: true, action: 'pedido_ia', estado: prox })
        }

        await enviarBot(sbPublic, telefone, respostaIA)
        await upsertSessao(sbPublic, telefone, { ia_historico: novoHistorico })
        return res.status(200).json({ ok: true, action: 'ia_conversando' })
      }

      case 'coletando_nome': {
        const nome = limparNome(texto) || texto.trim()
        await enviarBot(sbPublic, telefone, `Perfeito, *${nome}*! 🎉\n\nQual o *endereço* de entrega?\n_(Rua, número, bairro)_`)
        await upsertSessao(sbPublic, telefone, { estado: 'coletando_endereco', dados_cliente: { ...(sessao.dados_cliente || {}), nome } })
        return res.status(200).json({ ok: true })
      }

      case 'confirmando_endereco': {
        const dados = sessao.dados_cliente || {}
        if (/sim|mesmo|esse|btn_mesmo_end|ok/i.test(textoLower) && dados._enderecoSugerido) {
          const { _enderecoSugerido, ...dl } = dados
          await enviarBot(sbPublic, telefone, `📍 Endereço confirmado!`)
          await enviarBotoes(telefone, `Como deseja pagar?`, [{ id: 'btn_pix', text: '💰 Pix' }, { id: 'btn_dinheiro', text: '💵 Dinheiro' }, { id: 'btn_mensalista', text: '📋 Mensalista' }], 'Pagamento')
          await upsertSessao(sbPublic, telefone, { estado: 'coletando_pagamento', dados_cliente: dl })
          return res.status(200).json({ ok: true })
        }
        await enviarBot(sbPublic, telefone, `Me passe o *novo endereço*:\n_(Rua, número, bairro)_`)
        const { _enderecoSugerido: _, ...ds } = dados
        await upsertSessao(sbPublic, telefone, { estado: 'coletando_endereco', dados_cliente: { ...ds, rua: '', bairro: '', numero: '' } })
        return res.status(200).json({ ok: true })
      }

      case 'coletando_endereco': {
        const dados = sessao.dados_cliente || {}
        await enviarBot(sbPublic, telefone, `📍 Anotado!`)
        await enviarBotoes(telefone, `Como deseja pagar?`, [{ id: 'btn_pix', text: '💰 Pix' }, { id: 'btn_dinheiro', text: '💵 Dinheiro' }, { id: 'btn_mensalista', text: '📋 Mensalista' }], 'Pagamento')
        await upsertSessao(sbPublic, telefone, { estado: 'coletando_pagamento', dados_cliente: { ...dados, rua: texto.trim() } })
        return res.status(200).json({ ok: true })
      }

      case 'coletando_pagamento': {
        const dados = sessao.dados_cliente || {}

        // Auto-detectar mensalista/quinzenal do banco
        const clienteDB = await buscarCliente(sbFogao, telefone)
        if (clienteDB?.tipo === 'mensalista' || clienteDB?.tipo === 'quinzenal') {
          const pagAuto = clienteDB.tipo === 'quinzenal' ? 'Quinzenal' : 'Mensalista'
          await enviarBot(sbPublic, telefone, `📋 Identifiquei que você é cliente *${pagAuto}*! Pagamento registrado automaticamente. 😊`)
          // Pular direto pro resumo
          const pedido = sessao.ia_pedido
          const total = (pedido?.subtotal || 0) + (pedido?.embalagens_adicionais || 0)
          const linhas = (pedido?.itens || []).map(i => {
            let d = `${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''})`
            if (i.emArroz) d += ' 🍚'
            if (i.semItens?.length) d += ` sem ${i.semItens.join(', ')}`
            return `  ${d} — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`
          })
          const horario = pedido?.horario_entrega ? `\n⏰ Horário: ${pedido.horario_entrega}` : ''
          let resumo = `📋 *RESUMO*\n\n👤 ${dados.nome}\n📍 ${dados.rua || 'Retirar no local'}\n💳 ${pagAuto}${horario}\n\n🛒 *Itens:*\n${linhas.join('\n')}\n\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`
          await enviarBot(sbPublic, telefone, resumo)
          await enviarBotoes(telefone, `Tudo certo?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }], 'Confirmação')
          await upsertSessao(sbPublic, telefone, { estado: 'confirmando_pedido', dados_cliente: { ...dados, pagamento: pagAuto } })
          return res.status(200).json({ ok: true, action: 'mensalista_auto' })
        }

        let pagamento = ''
        if (/pix|btn_pix/i.test(textoLower)) pagamento = 'Pix'
        else if (/dinheiro|btn_dinheiro/i.test(textoLower)) pagamento = 'Dinheiro'
        else if (/cart[aã]o|btn_cartao/i.test(textoLower)) pagamento = 'Cartão'
        else if (/mensalista|mensal|btn_mensalista|quinzenal/i.test(textoLower)) pagamento = 'Mensalista'

        if (!pagamento) {
          await enviarLista(telefone, `Como deseja pagar?`, '💳 Pagamento', [{ titulo: 'Pagamento', itens: [
            { id: 'btn_pix', titulo: '💰 Pix', descricao: 'QR Code + copia e cola' },
            { id: 'btn_dinheiro', titulo: '💵 Dinheiro', descricao: 'Pague na entrega' },
            { id: 'btn_cartao', titulo: '💳 Cartão', descricao: 'Motoboy cobra na entrega' },
            { id: 'btn_mensalista', titulo: '📋 Mensalista', descricao: 'Cliente mensal/quinzenal' },
          ]}], 'Forma de pagamento')
          return res.status(200).json({ ok: true })
        }

        // Se dinheiro → perguntar troco
        if (pagamento === 'Dinheiro') {
          await enviarBot(sbPublic, telefone, `💵 *Dinheiro* selecionado!\n\nPrecisa de *troco*? Se sim, troco pra quanto?\n_(Ex: "troco pra 50" ou "não precisa")_`)
          await upsertSessao(sbPublic, telefone, { estado: 'coletando_troco', dados_cliente: { ...dados, pagamento } })
          return res.status(200).json({ ok: true })
        }

        // Se cartão → informar que motoboy cobra
        if (pagamento === 'Cartão') {
          await enviarBot(sbPublic, telefone, `💳 *Cartão* — o motoboy levará a maquininha! 😊`)
        }

        // Ir pro resumo
        const pedido = sessao.ia_pedido
        const total = (pedido?.subtotal || 0) + (pedido?.embalagens_adicionais || 0)
        const linhas = (pedido?.itens || []).map(i => {
          let d = `${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''})`
          if (i.emArroz) d += ' 🍚'
          if (i.semItens?.length) d += ` sem ${i.semItens.join(', ')}`
          return `  ${d} — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`
        })
        const horario = pedido?.horario_entrega ? `\n⏰ Horário: ${pedido.horario_entrega}` : '\n⏰ Prazo: 30 a 60 min (a partir das 10:30)'
        let resumo = `📋 *RESUMO DO PEDIDO*\n\n👤 ${dados.nome}\n📍 ${dados.rua || 'Retirar no local'}\n💳 ${pagamento}${horario}\n\n🛒 *Itens:*\n${linhas.join('\n')}\n\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`
        await enviarBot(sbPublic, telefone, resumo)
        await enviarBotoes(telefone, `Tudo certo?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }], 'Confirmação')
        await upsertSessao(sbPublic, telefone, { estado: 'confirmando_pedido', dados_cliente: { ...dados, pagamento } })
        return res.status(200).json({ ok: true })
      }

      // ═══ TROCO (só pra dinheiro) ═══
      case 'coletando_troco': {
        const dados = sessao.dados_cliente || {}
        const trocoMatch = texto.match(/(\d+)/)
        const troco = /não|nao|sem|zero/i.test(textoLower) ? '' : (trocoMatch ? `R$ ${trocoMatch[1]}` : texto.trim())

        const pedido = sessao.ia_pedido
        const total = (pedido?.subtotal || 0) + (pedido?.embalagens_adicionais || 0)
        const linhas = (pedido?.itens || []).map(i => {
          let d = `${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''})`
          if (i.emArroz) d += ' 🍚'
          if (i.semItens?.length) d += ` sem ${i.semItens.join(', ')}`
          return `  ${d} — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`
        })
        const horario = pedido?.horario_entrega ? `\n⏰ Horário: ${pedido.horario_entrega}` : '\n⏰ Prazo: 30 a 60 min (a partir das 10:30)'
        let resumo = `📋 *RESUMO DO PEDIDO*\n\n👤 ${dados.nome}\n📍 ${dados.rua || 'Retirar no local'}\n💳 Dinheiro${troco ? ` (troco p/ ${troco})` : ''}${horario}\n\n🛒 *Itens:*\n${linhas.join('\n')}\n\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`
        await enviarBot(sbPublic, telefone, resumo)
        await enviarBotoes(telefone, `Tudo certo?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }], 'Confirmação')
        await upsertSessao(sbPublic, telefone, { estado: 'confirmando_pedido', dados_cliente: { ...dados, troco } })
        return res.status(200).json({ ok: true })
      }

      case 'confirmando_pedido': {
        if (/btn_alterar|não|nao|alterar|mudar/i.test(textoLower)) {
          await enviarBot(sbPublic, telefone, `Sem problemas! Me diga o que quer mudar. 😊`)
          await upsertSessao(sbPublic, telefone, { estado: 'pedindo_ia' })
          return res.status(200).json({ ok: true })
        }
        if (!/sim|confirma|isso|pode|ok|btn_confirmar|beleza|manda|fecha/i.test(textoLower)) {
          await enviarBotoes(telefone, `Confirma?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }])
          return res.status(200).json({ ok: true })
        }

        const resultado = await injetarPedido(sbFogao, sessao, config)
        const dados = sessao.dados_cliente || {}

        let msg = `✅ *Pedido confirmado!*\n\nValor: *R$ ${resultado.total.toFixed(2).replace('.', ',')}*\n\n`

        if (dados.pagamento === 'Pix') {
          const pixChave = config.pixChave || ''
          const pixNome = config.pixNome || 'FOGAO A LENHA LENINHA'
          msg += `────────────────────\n🏦 *Dados PIX:*\nChave: *${pixChave}*\n\n`
          if (pixChave && resultado.total > 0) {
            const copiaCola = gerarPixCopiaCola({ chave: pixChave, nome: pixNome, cidade: 'Visconde do Rio Branco', valor: resultado.total, txid: `PED${resultado.id}` })
            msg += `📋 *Copia e Cola:*\n${copiaCola}\n\n`
            // Enviar QR Code como imagem depois
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(copiaCola)}`
            setTimeout(() => enviarImagem(telefone, qrUrl, `📱 *QR Code PIX*\nEscaneie com o app do banco! 💰`), 1500)
          }
          msg += `⚠️ *Envie o comprovante aqui!* 🧾\n\n`
        }

        msg += `Obrigado pela preferência! 🍲❤️`
        await enviarBot(sbPublic, telefone, msg)
        await upsertSessao(sbPublic, telefone, { estado: 'pedido_feito', ultimo_pedido_id: resultado.id, ia_pedido: null, ia_historico: [], dados_cliente: null })
        return res.status(200).json({ ok: true, action: 'pedido_injetado' })
      }

      case 'pedido_feito': {
        const temImagem = extrairImagem(data.message)
        const pedidoId = sessao.ultimo_pedido_id
        if (temImagem && pedidoId) {
          await sbFogao.from('pedidos').update({ statusPagamento: 'comprovante_recebido' }).eq('id', pedidoId)
          await enviarBot(sbPublic, telefone, `✅ *Comprovante recebido!*\nEstamos conferindo. Obrigado! 🙏`)
          return res.status(200).json({ ok: true, action: 'comprovante' })
        }

        // Reclamações
        if (/atras|demor|cadê|cade|não chegou|esperando/i.test(textoLower)) {
          await sbPublic.from('fogao_alertas').insert({ telefone, nome_contato: sessao.nome_contato, tipo: 'atraso', mensagem: texto, pedido_id: pedidoId, status: 'aberto' })
          await enviarBot(sbPublic, telefone, `Entendo sua preocupação! 😊\nJá estamos verificando. Qualquer novidade te aviso! 🍲`)
          return res.status(200).json({ ok: true, action: 'reclamacao_atraso' })
        }
        if (/ruim|horrível|péssimo|frio|errado|trocado|reclamar/i.test(textoLower)) {
          await sbPublic.from('fogao_alertas').insert({ telefone, nome_contato: sessao.nome_contato, tipo: 'qualidade', mensagem: texto, pedido_id: pedidoId, status: 'aberto' })
          await enviarBot(sbPublic, telefone, `Lamento muito! 😔\nSua reclamação foi registrada. Um atendente vai te contatar. 🙏`)
          await upsertSessao(sbPublic, telefone, { humano_ativo: true, estado: 'humano' })
          return res.status(200).json({ ok: true, action: 'reclamacao_qualidade' })
        }

        if (/pedir|outro|mais|quero/i.test(textoLower)) {
          const { cardapio, bebidas } = await buscarCardapioEConfig()
          await enviarBot(sbPublic, telefone, `${formatarCardapioDoDia(cardapio, bebidas)}\n_O que vai ser? 📝_`)
          await upsertSessao(sbPublic, telefone, { estado: 'pedindo_ia', ia_historico: [], ia_pedido: null, dados_cliente: null })
          return res.status(200).json({ ok: true })
        }

        await enviarBot(sbPublic, telefone, `Obrigado pela mensagem! 😊\nPra novo pedido, digite *"quero pedir"*.\nDúvidas? Um atendente vai responder! 🙋‍♂️`)
        return res.status(200).json({ ok: true })
      }

      case 'humano': return res.status(200).json({ ok: true, skip: 'humano' })

      default: {
        await upsertSessao(sbPublic, telefone, { estado: 'novo', humano_ativo: false, bot_msg_ids: [], ia_historico: [], ia_pedido: null, dados_cliente: null })
        return res.status(200).json({ ok: true, action: 'reset' })
      }
    }
  } catch (err) {
    console.error('[Webhook]', err)
    return res.status(200).json({ ok: false, error: err.message })
  }
}
