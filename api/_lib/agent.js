/**
 * Agente OpenAI com function calling — Fogão a Lenha da Leninha
 * Migra a lógica do fogao-bot/handlers/customer.js para Vercel Serverless.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const HISTORICO_MAX = 16
const MAX_TOOL_LOOPS = 6

function fmtR(v) {
  return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`
}

// ── Heurística de handover (regex determinístico) ───────────────────────────
const RX_PEDIDO_HUMANO = /\b(atendente|humano|gerente|falar\s+com\s+(uma\s+)?(pessoa|gente|alguem|alguém|atendente)|atende\s+ai|atende\s+a[ií])\b/i
const RX_RECLAMACAO    = /\b(lixo|porcaria|pessima|péssima|pessimo|péssimo|horr[ií]vel|absurdo|nunca\s+mais|ningu[eé]m\s+(entrega|atende|responde)|cad[eê]\s+meu\s+pedido|n[aã]o\s+chegou)\b/i
const RX_XINGAMENTO    = /\b(merda|caralho|porra|fdp|filho\s+da|babaca|idiota|otario|otário)\b/i

function detectarHandover(mensagem) {
  if (!mensagem) return null
  if (RX_PEDIDO_HUMANO.test(mensagem)) return 'pedido_explicito'
  if (RX_XINGAMENTO.test(mensagem))    return 'xingamento'
  if (RX_RECLAMACAO.test(mensagem))    return 'reclamacao'
  return null
}

const RESPOSTA_HANDOVER = {
  pedido_explicito: 'Tudo bem! Já chamei nossa atendente, ela vai assumir a conversa em instantes. 🙋‍♀️',
  reclamacao:       'Sinto muito pelo ocorrido. Já chamei nossa atendente para resolver isso com você agora.',
  xingamento:       'Entendo seu desconforto. Já chamei nossa atendente para te ajudar.',
}

// ── Formatação de contexto ──────────────────────────────────────────────────
function fmtCardapio(c) {
  if (!c) return 'CARDÁPIO INDISPONÍVEL HOJE.'
  const ops = (c.opcoes || []).filter(o => o.disponivel !== false)
  if (!ops.length) return 'NENHUMA OPÇÃO DISPONÍVEL HOJE.'
  const carnes = (c.carnes || []).filter(Boolean)
  let t = `Tamanhos: P (500ml) ${fmtR(c.precoP)} · G (750ml) ${fmtR(c.precoG)}\n`
  ops.forEach((op, i) => {
    t += `Opção ${i + 1} — ${op.nome}: ${(op.acompanhamentos || []).join(', ')}`
    if (op.tipoCarnes === 'especial' && op.pratoEspecial) t += ` [carne inclusa: ${op.pratoEspecial}]`
    t += '\n'
  })
  if (carnes.length) t += `Carnes para opções sem carne inclusa: ${carnes.join(', ')}\n`
  if (c.imagem_flyer) t += `Imagem do flyer disponível: SIM\n`
  return t
}

function fmtModificacoes(modifs) {
  if (!modifs?.length) return 'Nenhuma modificação cadastrada.'
  return modifs.map(m => `- ${m.nome}${m.preco_extra > 0 ? ` (+${fmtR(m.preco_extra)})` : ''}`).join('\n')
}

function fmtCliente(cliente) {
  if (!cliente) return 'Cliente NÃO cadastrado (primeiro contato).'
  const tipoRaw = (cliente.tipo || 'avulso').toLowerCase()
  const tipo = ['mensalista', 'fiado', 'quinzenal'].includes(tipoRaw) ? tipoRaw : 'avulso'
  const enderecoCadastrado = [cliente.rua, cliente.numero, cliente.bairro].filter(Boolean).join(', ')
  let t = `Cliente cadastrado: ${cliente.nome || '(sem nome)'} | tipo: ${tipo}`
  if (cliente.pagamento_padrao) t += ` | pagamento padrão: ${cliente.pagamento_padrao}`
  if (enderecoCadastrado) t += `\nEndereço padrão: ${enderecoCadastrado}`
  if (cliente.complemento) t += ` (${cliente.complemento})`
  if (cliente.referencia) t += ` — ref: ${cliente.referencia}`
  if (cliente.observacoes) t += `\nObs do cliente: ${cliente.observacoes}`
  return t
}

function buildSystemPrompt({ cardapio, modificacoes, cliente }) {
  return `Você é a *assistente virtual oficial do Fogão a Lenha da Leninha* (restaurante delivery em Visconde do Rio Branco - MG).
Tom: simpático, direto, em português brasileiro coloquial. Use *negrito* (markdown do WhatsApp) para destacar.
Sempre que for a primeira mensagem da conversa, se apresente como "assistente virtual do Fogão a Lenha da Leninha".

# CARDÁPIO DE HOJE
${fmtCardapio(cardapio)}

# MODIFICAÇÕES PERMITIDAS
${fmtModificacoes(modificacoes)}

# CLIENTE
${fmtCliente(cliente)}

# REGRAS DE NEGÓCIO (NUNCA QUEBRAR)
1. *Não remontamos pratos.* Se cliente pedir para tirar item da opção 1 e colocar na opção 2, recuse educadamente: "infelizmente com a demanda atual não conseguimos remontar pratos entre opções, mas posso aplicar modificações simples como 'sem arroz'".
2. *Sempre confirme o pedido inteiro* (opção, tamanho, modificações, endereço, pagamento, total) antes de chamar registrar_pedido.
3. *Mensalistas, quinzenais e fiados*: NUNCA pergunte forma de pagamento. Registre com pagamento "mensalidade" (mensalista/quinzenal) ou "fiado".
4. *Avulsos*: pergunte forma de pagamento — Pix, Dinheiro ou Cartão (máquina na entrega).
5. *Pagamento Pix*: chame enviar_chave_pix com o valor total. Quando cliente disser "paguei", "pago", "enviei o pix", "fiz o pix", ou enviar uma imagem (presumido comprovante), chame registrar_pedido IMEDIATAMENTE — não fique esperando.
6. *Endereço*:
   - Cliente recorrente com endereço cadastrado: confirme "entrego no [rua], [bairro]?". Se confirmar, use esse endereço.
   - Endereço novo ou cliente novo: peça rua, número, bairro, complemento (se houver) e ponto de referência.
7. *Somos só delivery* — não tem retirada no balcão. Sempre coletar endereço.
8. *Modificações* (ex: "sem arroz"): só aceite as listadas na seção MODIFICAÇÕES PERMITIDAS. Some o preço extra ao total.
9. *Pedido de humano OU reclamação*: se cliente pedir "atendente"/"humano"/"pessoa", reclamar de pedido anterior, xingar, ou demonstrar irritação clara, OBRIGATORIAMENTE chame solicitar_atendente NO MESMO TURNO. Sua resposta em texto deve ser a empatia. NÃO PROMETA chamar — chame de fato.
10. *Cliente recorrente direto*: se mensalista/fiado fornecer opção+tamanho e (se for o caso) confirmar endereço padrão, registre IMEDIATAMENTE sem pedir confirmação extra.
11. *Mensagens das tools são auto-suficientes* — quando uma tool já enviou conteúdo (enviar_imagem_cardapio, enviar_chave_pix), NÃO repita o conteúdo. Pode complementar com 1 frase curta ou ficar em silêncio.
12. *Resposta vaga ("vou querer 1 dessa")*: chame enviar_imagem_cardapio para garantir que cliente tem a referência, e pergunte qual opção quer.

# CÁLCULO DO TOTAL
Para cada item: preço base (P ou G) + soma dos preço_extra das modificações aplicadas.
Total do pedido = soma dos itens.

# FORMATO DE RESPOSTA
Curta. Direto. No máximo 4-5 linhas em geral. Confirmação de pedido pode ser maior.`
}

function buildTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'enviar_imagem_cardapio',
        description: 'Envia ao cliente a imagem do flyer/cardápio do dia. Use quando o cliente pedir para ver o cardápio.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
      },
    },
    {
      type: 'function',
      function: {
        name: 'enviar_chave_pix',
        description: 'Envia chave PIX, valor e mensagem pedindo comprovante. Use quando cliente escolher pagamento Pix.',
        parameters: {
          type: 'object',
          properties: { valor: { type: 'number', description: 'Valor total em reais' } },
          required: ['valor'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'registrar_pedido',
        description: 'Grava pedido no sistema e dispara impressão. Só use após cliente CONFIRMAR.',
        parameters: {
          type: 'object',
          properties: {
            itens: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  opcao: { type: 'string' },
                  tamanho: { type: 'string', enum: ['P', 'G'] },
                  carne: { type: 'string' },
                  modificacoes: { type: 'array', items: { type: 'string' } },
                  obs: { type: 'string' },
                  preco: { type: 'number' },
                },
                required: ['opcao', 'tamanho', 'preco'],
              },
            },
            endereco: {
              type: 'object',
              properties: {
                rua: { type: 'string' },
                numero: { type: 'string' },
                bairro: { type: 'string' },
                complemento: { type: 'string' },
                referencia: { type: 'string' },
              },
            },
            pagamento: { type: 'string', enum: ['pix', 'dinheiro', 'cartao', 'mensalidade', 'fiado'] },
            total: { type: 'number' },
            observacoes: { type: 'string' },
          },
          required: ['itens', 'endereco', 'pagamento', 'total'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'salvar_cliente',
        description: 'Cadastra/atualiza nome e endereço padrão do cliente.',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            rua: { type: 'string' },
            numero: { type: 'string' },
            bairro: { type: 'string' },
            complemento: { type: 'string' },
            referencia: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'solicitar_atendente',
        description: 'Transfere para atendente humano.',
        parameters: {
          type: 'object',
          properties: { motivo: { type: 'string' } },
          required: ['motivo'],
        },
      },
    },
  ]
}

// ── Chamada OpenAI ──────────────────────────────────────────────────────────
async function openaiChat(messages, tools) {
  const body = {
    model: OPENAI_MODEL,
    messages,
    max_tokens: 600,
    temperature: 0.2,
  }
  if (tools?.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[Agent] OpenAI', res.status, err.slice(0, 300))
    return null
  }
  const data = await res.json()
  return data?.choices?.[0]?.message || null
}

// ── Implementação das tools ─────────────────────────────────────────────────
async function executarTool(name, args, ctx) {
  const { evo, sb, telefone, cliente, config, cardapio, pushName } = ctx

  switch (name) {
    case 'enviar_imagem_cardapio': {
      if (cardapio?.imagem_flyer) {
        await evo.enviarImagem(telefone, cardapio.imagem_flyer, '🍽️ Cardápio de hoje!')
        return { ok: true, info: 'Imagem do flyer enviada. NÃO repita em texto.' }
      }
      const txt = `🍖 *Cardápio de Hoje*\n\n${fmtCardapio(cardapio)}`
      await evo.enviarTexto(telefone, txt)
      return { ok: true, info: 'Cardápio em texto enviado (sem flyer).' }
    }

    case 'enviar_chave_pix': {
      const valor = Number(args.valor || 0)
      const chave = config?.pixChave || 'fogaoalenhadaleninha@gmail.com'
      const nome  = config?.pixNome || 'Fogão a Lenha da Leninha'
      const txt =
        `💳 *Pagamento via Pix*\n\n` +
        `Chave (e-mail): *${chave}*\n` +
        `Beneficiário: ${nome}\n` +
        `Valor: *${fmtR(valor)}*\n\n` +
        `Após pagar, *envie o comprovante* aqui pra liberar a entrega. 🙏`
      await evo.enviarTexto(telefone, txt)
      return { ok: true, info: `Chave Pix de ${fmtR(valor)} enviada. Aguarde "paguei" ou imagem.` }
    }

    case 'salvar_cliente': {
      let id = cliente?.id
      if (!id) {
        const { data } = await sb.from('clientes').select('id').order('id', { ascending: false }).limit(1)
        id = (data?.[0]?.id || 0) + 1
      }
      const data = {
        id,
        telefone,
        nome: args.nome || cliente?.nome || pushName || '',
        rua: args.rua ?? cliente?.rua ?? null,
        numero: args.numero ?? cliente?.numero ?? null,
        bairro: args.bairro ?? cliente?.bairro ?? null,
        complemento: args.complemento ?? cliente?.complemento ?? null,
        referencia: args.referencia ?? cliente?.referencia ?? null,
        tipo: cliente?.tipo || 'avulso',
      }
      await sb.from('clientes').upsert(data, { onConflict: 'id' })
      ctx.cliente = { ...(cliente || {}), ...data }
      return { ok: true, info: 'Cliente salvo.' }
    }

    case 'registrar_pedido': {
      const numeroPedido = (await sb.from('pedidos').select('id', { count: 'exact', head: true }).gte('criadoEm', new Date().toISOString().slice(0, 10))).count || 0
      const id = Date.now()
      const itensFmt = (args.itens || []).map(it => ({
        nome: it.opcao,
        tamanho: it.tamanho,
        carne: it.carne || null,
        modificacoes: it.modificacoes || [],
        obs: it.obs || '',
        preco: it.preco,
      }))

      // Garante cliente salvo
      let idCliente = cliente?.id
      if (!idCliente) {
        const { data } = await sb.from('clientes').select('id').order('id', { ascending: false }).limit(1)
        idCliente = (data?.[0]?.id || 0) + 1
      }
      const enderecoFinal = args.endereco || {}
      await sb.from('clientes').upsert({
        id: idCliente,
        telefone,
        nome: cliente?.nome || pushName || '',
        rua: enderecoFinal.rua || cliente?.rua || null,
        numero: enderecoFinal.numero || cliente?.numero || null,
        bairro: enderecoFinal.bairro || cliente?.bairro || null,
        complemento: enderecoFinal.complemento || cliente?.complemento || null,
        referencia: enderecoFinal.referencia || cliente?.referencia || null,
        tipo: cliente?.tipo || 'avulso',
      }, { onConflict: 'id' })

      const pedido = {
        id,
        clienteId: idCliente,
        clienteNome: cliente?.nome || pushName || '',
        clienteTelefone: telefone.replace(/^55/, ''),
        rua: enderecoFinal.rua || '',
        numero: enderecoFinal.numero || '',
        bairro: enderecoFinal.bairro || '',
        referencia: enderecoFinal.referencia || '',
        itens: itensFmt,
        total: Number(args.total || 0),
        pagamento: args.pagamento,
        status: 'aberto',
        statusPagamento: ['mensalidade', 'fiado'].includes(args.pagamento) ? 'pendente' : 'pago',
        observacoes: args.observacoes || '',
        origem: 'whatsapp',
      }
      await sb.from('pedidos').insert(pedido)
      ctx.ultimoPedidoId = id
      return {
        ok: true,
        info: `Pedido #${numeroPedido + 1} registrado. Total ${fmtR(pedido.total)}. Pagamento: ${args.pagamento}.`,
      }
    }

    case 'solicitar_atendente': {
      await sb.from('fogao_alertas').insert({
        telefone,
        nome_contato: cliente?.nome || pushName || null,
        tipo: 'handover',
        mensagem: args.motivo || 'Cliente solicitou atendente',
        status: 'aberto',
      })
      ctx.handoverSolicitado = true
      return { ok: true, info: 'Atendente notificado.' }
    }

    default:
      return { ok: false, error: `Tool desconhecida: ${name}` }
  }
}

async function rodarLoop(messages, ctx) {
  const tools = buildTools()
  let respostaTexto = null

  for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
    const msg = await openaiChat(messages, tools)
    if (!msg) break

    messages.push({
      role: 'assistant',
      content: msg.content || '',
      tool_calls: msg.tool_calls || undefined,
    })

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      respostaTexto = msg.content || ''
      break
    }

    for (const tc of msg.tool_calls) {
      let args = {}
      try { args = JSON.parse(tc.function?.arguments || '{}') } catch {}
      const resultado = await executarTool(tc.function?.name, args, ctx)
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(resultado),
      })
    }
  }

  return respostaTexto || ''
}

// ── Entry point ─────────────────────────────────────────────────────────────
async function processarMensagem({ telefone, pushName, mensagem, sessao, sb, evo }) {
  const historico = sessao?.ia_historico || []

  // 1) Cliente do banco
  const telLimpo = telefone.replace(/^55/, '')
  const { data: clientes } = await sb.from('clientes').select('*').or(`telefone.eq.${telefone},telefone.eq.${telLimpo}`).limit(1)
  const cliente = clientes?.[0] || null

  // 2) Cardápio + config + modificações
  const [{ data: cardArr }, { data: confArr }, { data: modifArr }] = await Promise.all([
    sb.from('cardapio_hoje').select('*').eq('id', 1).limit(1),
    sb.from('configuracoes').select('*').eq('id', 1).limit(1),
    sb.from('cardapio_modificacoes').select('id,nome,preco_extra,tipo').eq('ativa', true),
  ])
  const cardapio = cardArr?.[0] || null
  const config = confArr?.[0] || {}
  const modificacoes = modifArr || []

  // 3) Atalho determinístico de handover
  const motivoHandover = detectarHandover(mensagem)
  if (motivoHandover) {
    const txt = RESPOSTA_HANDOVER[motivoHandover]
    await evo.enviarTexto(telefone, txt)
    await sb.from('fogao_alertas').insert({
      telefone,
      nome_contato: cliente?.nome || pushName || null,
      tipo: 'handover',
      mensagem: `[${motivoHandover}] ${mensagem}`,
      status: 'aberto',
    }).catch(() => {})
    return {
      respostaTexto: txt,
      novoHistorico: [...historico, { role: 'user', text: mensagem }, { role: 'model', text: txt }].slice(-HISTORICO_MAX),
      handoverSolicitado: true,
    }
  }

  // 4) Monta mensagens pro modelo (converte historico do schema antigo {role:user/model, text} → openai)
  const histOpenAI = historico.slice(-HISTORICO_MAX).map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.text || h.content || '',
  })).filter(h => h.content)

  const messages = [
    { role: 'system', content: buildSystemPrompt({ cardapio, modificacoes, cliente }) },
    ...histOpenAI,
    { role: 'user', content: mensagem },
  ]

  const ctx = {
    sb, evo,
    telefone, pushName,
    cliente, config, cardapio,
    handoverSolicitado: false,
    ultimoPedidoId: null,
  }
  const resposta = await rodarLoop(messages, ctx)

  if (resposta) {
    await evo.enviarTexto(telefone, resposta)
  }

  const novoHistorico = [
    ...historico,
    { role: 'user', text: mensagem },
    { role: 'model', text: resposta || '' },
  ].slice(-HISTORICO_MAX)

  return {
    respostaTexto: resposta,
    novoHistorico,
    handoverSolicitado: ctx.handoverSolicitado,
    ultimoPedidoId: ctx.ultimoPedidoId,
  }
}

module.exports = { processarMensagem, detectarHandover }
