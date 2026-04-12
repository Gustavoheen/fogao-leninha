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
function getSupabaseFogao() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { db: { schema: 'fogao' } })
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
    origem: 'whatsapp',
  })

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
    if (!texto && extrairAudioInfo(data.message)) {
      const mediaUrl = data.message?.audioMessage?.url || data.media?.url || null
      const base64 = data.message?.base64 || null
      texto = await transcreverAudio(mediaUrl, base64, extrairAudioInfo(data.message)?.mimetype)
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
      case 'novo': {
        await enviarBot(sbPublic, telefone, `Olá${nomeContato ? `, ${nomeContato}` : ''}! 👋\n\nBem-vindo ao *${NOME_LOJA}*! 🍲\n\nFaça seu pedido pelo nosso cardápio:\n👉 ${LINK_SITE}\n\nÉ rápido e fácil! 😋`)
        await upsertSessao(sbPublic, telefone, { estado: 'saudacao', nome_contato: nomeContato })
        return res.status(200).json({ ok: true, action: 'saudacao' })
      }

      case 'saudacao': {
        await enviarBot(sbPublic, telefone, `Nosso cardápio de hoje:\n👉 ${LINK_SITE}\n\nSe tiver dificuldade, posso anotar por aqui! 😊`)
        await upsertSessao(sbPublic, telefone, { estado: 'insistiu_site' })
        return res.status(200).json({ ok: true, action: 'reforco_site' })
      }

      case 'insistiu_site':
      case 'ofereceu_whatsapp': {
        const querPedir = /sim|quero|pode|bora|pedir|pedido|aqui|por aqui|cardapio|menu|pedir_aqui|nao consigo|não consigo|dificuldade/i.test(textoLower)
        const querSite = /site|pedir_site/i.test(textoLower)

        if (querSite) {
          await enviarBot(sbPublic, telefone, `👉 ${LINK_SITE}\n\nBom apetite! 🍲`)
          return res.status(200).json({ ok: true, action: 'enviou_link' })
        }

        if (querPedir) {
          const { cardapio, bebidas } = await buscarCardapioEConfig()
          const cardapioTexto = formatarCardapioDoDia(cardapio, bebidas)
          await enviarBot(sbPublic, telefone, `Sem problemas! Aqui está o cardápio de hoje:\n\n${cardapioTexto}\n_Me diga o que deseja! 📝_`)
          await upsertSessao(sbPublic, telefone, { estado: 'pedindo_ia', ia_historico: [], ia_pedido: null, dados_cliente: null })
          return res.status(200).json({ ok: true, action: 'cardapio_enviado' })
        }

        await enviarBotoes(supabase, telefone, `Como posso te ajudar?`, [
          { id: 'pedir_aqui', text: '📱 Pedir por aqui' },
          { id: 'pedir_site', text: '🌐 Ir pro site' },
          { id: 'atendente', text: '👤 Falar c/ atendente' },
        ], 'Escolha')
        await upsertSessao(sbPublic, telefone, { estado: 'perguntou_duvida' })
        return res.status(200).json({ ok: true, action: 'ofereceu_opcoes' })
      }

      case 'perguntou_duvida': {
        if (/pedir_aqui|sim|quero|pode|pedir/i.test(textoLower)) {
          const { cardapio, bebidas } = await buscarCardapioEConfig()
          await enviarBot(sbPublic, telefone, `${formatarCardapioDoDia(cardapio, bebidas)}\n_Me diga o que deseja! 📝_`)
          await upsertSessao(sbPublic, telefone, { estado: 'pedindo_ia', ia_historico: [], ia_pedido: null, dados_cliente: null })
          return res.status(200).json({ ok: true, action: 'cardapio_enviado' })
        }
        if (/site|pedir_site/i.test(textoLower)) {
          await enviarBot(sbPublic, telefone, `👉 ${LINK_SITE}\n\nBom apetite! 🍲`)
          return res.status(200).json({ ok: true })
        }
        await enviarBot(sbPublic, telefone, `Vou te direcionar para um atendente! 🙋‍♂️\nAguarde. 🙏`)
        await upsertSessao(sbPublic, telefone, { estado: 'humano', humano_ativo: true })
        return res.status(200).json({ ok: true, action: 'humano' })
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
            await enviarBotoes(telefone, `Como deseja pagar?`, [{ id: 'btn_pix', text: '💰 Pix' }, { id: 'btn_dinheiro', text: '💵 Dinheiro' }, { id: 'btn_mensalista', text: '📋 Mensalista' }], 'Pagamento')
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
        let pagamento = ''
        if (/pix|btn_pix/i.test(textoLower)) pagamento = 'Pix'
        else if (/dinheiro|btn_dinheiro/i.test(textoLower)) pagamento = 'Dinheiro'
        else if (/mensalista|mensal|btn_mensalista/i.test(textoLower)) pagamento = 'Mensalista'
        if (!pagamento) {
          await enviarBotoes(telefone, `Escolha:`, [{ id: 'btn_pix', text: '💰 Pix' }, { id: 'btn_dinheiro', text: '💵 Dinheiro' }, { id: 'btn_mensalista', text: '📋 Mensalista' }], 'Pagamento')
          return res.status(200).json({ ok: true })
        }

        const pedido = sessao.ia_pedido
        const total = (pedido?.subtotal || 0) + (pedido?.embalagens_adicionais || 0)
        const linhas = (pedido?.itens || []).map(i => `  ${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''}) — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`)
        let resumo = `📋 *RESUMO*\n\n👤 ${dados.nome}\n📍 ${dados.rua || 'Retirar no local'}\n💳 ${pagamento}\n\n🛒 *Itens:*\n${linhas.join('\n')}\n\n💵 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`
        await enviarBot(sbPublic, telefone, resumo)
        await enviarBotoes(telefone, `Tudo certo?`, [{ id: 'btn_confirmar', text: '✅ Confirmar' }, { id: 'btn_alterar', text: '✏️ Alterar' }], 'Confirmação')
        await upsertSessao(sbPublic, telefone, { estado: 'confirmando_pedido', dados_cliente: { ...dados, pagamento } })
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
