/**
 * IA atendente — Fogão a Lenha da Leninha.
 * Cardápio muda todo dia (marmitex), busca do Supabase antes de cada conversa.
 * Env: OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const OPENAI_KEY = () => process.env.OPENAI_API_KEY || ''
const GROQ_KEY = () => process.env.GROQ_API_KEY || ''
const GEMINI_KEY = () => process.env.GEMINI_API_KEY || ''

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

// ─── BUSCAR CARDÁPIO DO DIA + CONFIG ────────────────────────

async function buscarCardapioEConfig() {
  const supabase = getSupabase()
  const [{ data: cardapio }, { data: config }, { data: bebidas }] = await Promise.all([
    supabase.from('cardapio_hoje').select('*').eq('id', 1).single(),
    supabase.from('configuracoes').select('*').eq('id', 1).single(),
    supabase.from('cardapio').select('*').eq('disponivel', true),
  ])
  return { cardapio: cardapio || {}, config: config || {}, bebidas: bebidas || [] }
}

function formatarCardapioDoDia(cardapio, bebidas) {
  const carnes = (cardapio.carnes || []).filter(c => c && c.trim())
  const opcoes = (cardapio.opcoes || []).filter(o => o.disponivel !== false)
  const precoP = cardapio.precoP || '?'
  const precoG = cardapio.precoG || '?'
  const salada = cardapio.salada

  let texto = `═══ CARDÁPIO DE HOJE — FOGÃO A LENHA DA LENINHA ═══\n\n`

  if (carnes.length > 0) {
    texto += `🥩 CARNES DO DIA:\n`
    carnes.forEach((c, i) => { texto += `  ${i + 1}. ${c}\n` })
    texto += `\n`
  }

  texto += `📦 MARMITEX:\n`
  texto += `  • Pequena (P) — R$ ${precoP}\n`
  texto += `  • Grande (G) — R$ ${precoG}\n\n`

  if (opcoes.length > 0) {
    texto += `🍽️ OPÇÕES:\n`
    opcoes.forEach((o, i) => {
      texto += `  ${i + 1}. ${o.nome}`
      if (o.tipoCarnes === 'especial' && o.pratoEspecial) {
        texto += ` — ${o.pratoEspecial}`
      }
      if (o.acompanhamentos && o.acompanhamentos.length > 0) {
        texto += `\n     Acompanha: ${o.acompanhamentos.join(', ')}`
      }
      texto += `\n`
    })
    texto += `\n`
  }

  if (salada && salada.disponivel) {
    texto += `🥗 SALADA: R$ ${salada.preco || '?'}\n`
    if (salada.ingredientes?.length > 0) texto += `   ${salada.ingredientes.join(', ')}\n`
    texto += `\n`
  }

  // Bebidas
  const refrigerantes = bebidas.filter(b => b.categoria === 'Refrigerante')
  const combos = bebidas.filter(b => b.categoria === 'Combo')

  if (refrigerantes.length > 0) {
    texto += `🥤 BEBIDAS:\n`
    refrigerantes.forEach(b => { texto += `  • ${b.nome}${b.subtipo ? ` (${b.subtipo})` : ''} — R$ ${Number(b.preco).toFixed(2).replace('.', ',')}\n` })
    texto += `\n`
  }

  if (combos.length > 0) {
    texto += `🎉 COMBOS:\n`
    combos.forEach(b => { texto += `  • ${b.nome} — R$ ${Number(b.preco).toFixed(2).replace('.', ',')}${b.descricao ? ` (${b.descricao})` : ''}\n` })
    texto += `\n`
  }

  texto += `📦 EMBALAGEM ADICIONAL: +R$ 1,00 cada\n`
  texto += `💳 PAGAMENTO: Pix ou Dinheiro\n`

  return texto
}

// ─── SYSTEM PROMPT ──────────────────────────────────────────

function montarSystemPrompt(cardapioTexto, config, dicasDono) {
  let prompt = `Você é a atendente virtual do *Fogão a Lenha da Leninha*, um restaurante de comida caseira mineira em Visconde do Rio Branco, MG.

PERSONALIDADE:
- Simpática, acolhedora, tom de comida de vó 🍲
- Emojis com moderação (1-2 por mensagem)
- Respostas CURTAS e objetivas — WhatsApp, não redação
- Natural, como atendente de restaurante de verdade

REGRAS DE ATENDIMENTO:
1. O CARDÁPIO MUDA TODO DIA. Use APENAS o cardápio abaixo. Se não tiver o item hoje, diga educadamente.
2. MARMITEX tem 2 tamanhos: P (pequena) e G (grande). SEMPRE pergunte o tamanho se não disse.
3. O cliente escolhe a OPÇÃO (1, 2, 3...) e pode REMOVER acompanhamentos que não quer.
4. Pode escolher a CARNE entre as disponíveis do dia.
5. MENSALISTA: se o cliente disser que é mensalista, marque pagamento como "Mensalista".
6. NUNCA invente pratos ou preços.
7. Se perguntar "o que tem hoje?", mande o cardápio do dia.
8. Sempre sugira bebida ("Vai querer uma bebida?").
9. Embalagem adicional: +R$1 cada.
10. Quando listar itens, NUMERE eles. Cliente pode mandar o número.
11. Assuma que é 1 marmitex se não disse quantidade.

COMO ENTENDER PEDIDOS INFORMAIS:
- "marmita" / "marmitex" / "quentinha" = Marmitex
- "grande" / "G" = tamanho Grande
- "pequena" / "P" = tamanho Pequeno
- "opção 1" / "a primeira" / "1" = primeira opção do cardápio
- "sem arroz" / "tira o feijão" = remover acompanhamento
- "coca" / "refri" = pergunte o tamanho/tipo
- "mensalista" / "sou mensal" = pagamento Mensalista

FORMATO DE PEDIDO FINALIZADO:
Quando o cliente CONFIRMAR, responda com JSON:

\`\`\`json
{
  "pedido_pronto": true,
  "itens": [
    {
      "tipo": "marmitex",
      "opcaoNome": "Opção 1",
      "tamanho": "G",
      "proteina": "Frango caipira",
      "semItens": ["feijão tropeiro"],
      "preco": 25.00
    }
  ],
  "subtotal": 25.00,
  "embalagens_adicionais": 0,
  "observacao": "",
  "dados_extraidos": {
    "nome": null,
    "endereco": null,
    "pagamento": null
  }
}
\`\`\`

REGRAS DO JSON:
- "tipo": "marmitex" ou "bebida" ou "combo"
- "opcaoNome": nome da opção do cardápio
- "tamanho": "P" ou "G" (só pra marmitex)
- "proteina": carne escolhida (se especificou)
- "semItens": acompanhamentos removidos (array vazio se nenhum)
- "preco": preço correto do tamanho escolhido
- "embalagens_adicionais": número de embalagens extras
- "dados_extraidos": extraia nome, endereço e pagamento se o cliente já disse (null se não)
- Só gere JSON quando confirmar. "só isso", "manda", "fecha" = confirmar.

${cardapioTexto}`

  if (dicasDono && dicasDono.trim()) {
    prompt += `\n\n━━━ INSTRUÇÕES ESPECIAIS DO DONO ━━━\n${dicasDono.trim()}`
  }

  return prompt
}

// ─── CHAT COM IA ────────────────────────────────────────────

async function chatComIA(historico, mensagemAtual) {
  const { cardapio, config, bebidas } = await buscarCardapioEConfig()
  const cardapioTexto = formatarCardapioDoDia(cardapio, bebidas)
  const dicasDono = config.bot_dicas || ''
  const systemPrompt = montarSystemPrompt(cardapioTexto, config, dicasDono)

  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...historico.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: mensagemAtual },
  ]

  let resposta = ''

  // 1. GPT-4o Mini
  const openaiKey = OPENAI_KEY()
  if (!resposta && openaiKey) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: openaiMessages, temperature: 0.3, max_tokens: 1024 }),
      })
      const d = await r.json()
      if (r.ok && d?.choices?.[0]?.message?.content) { resposta = d.choices[0].message.content; console.log('[IA] GPT-4o-mini OK') }
      else console.warn('[IA] OpenAI erro:', r.status)
    } catch (e) { console.error('[IA] OpenAI falhou:', e.message) }
  }

  // 2. Groq fallback
  const groqKey = GROQ_KEY()
  if (!resposta && groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: openaiMessages, temperature: 0.4, max_tokens: 1024 }),
      })
      const d = await r.json()
      if (r.ok && d?.choices?.[0]?.message?.content) { resposta = d.choices[0].message.content; console.log('[IA] Groq OK') }
    } catch (e) { console.error('[IA] Groq falhou:', e.message) }
  }

  // 3. Gemini fallback
  const geminiKey = GEMINI_KEY()
  if (!resposta && geminiKey) {
    try {
      const contents = historico.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }))
      contents.push({ role: 'user', parts: [{ text: mensagemAtual }] })
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { temperature: 0.4, maxOutputTokens: 1024 } }),
      })
      const d = await r.json()
      if (r.ok) { resposta = d?.candidates?.[0]?.content?.parts?.[0]?.text || '' }
    } catch {}
  }

  if (!resposta) return { texto: 'Desculpe, estou com problemas técnicos. Tente novamente! 😅', pedido: null }

  // Extrair JSON
  let pedido = null
  const jsonMatch = resposta.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      if (parsed.pedido_pronto === true && Array.isArray(parsed.itens)) pedido = parsed
    } catch {}
  }

  // Validar preços contra cardápio real
  if (pedido) {
    const precoP = Number(cardapio.precoP) || 0
    const precoG = Number(cardapio.precoG) || 0
    let subtotal = 0
    for (const item of pedido.itens) {
      if (item.tipo === 'marmitex') {
        const precoReal = item.tamanho === 'G' ? precoG : precoP
        if (precoReal > 0) item.preco = precoReal
      } else if (item.tipo === 'bebida' || item.tipo === 'combo') {
        const found = bebidas.find(b => b.nome.toLowerCase() === (item.nome || item.opcaoNome || '').toLowerCase())
        if (found) item.preco = Number(found.preco)
      }
      subtotal += (item.preco || 0) * (item.qtd || 1)
    }
    subtotal += (pedido.embalagens_adicionais || 0)
    pedido.subtotal = Math.round(subtotal * 100) / 100
  }

  let textoLimpo = resposta.replace(/```json[\s\S]*?```/g, '').trim()
  if (!textoLimpo && pedido) {
    const linhas = pedido.itens.map(i => `  ${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''}) — R$ ${(i.preco * (i.qtd || 1)).toFixed(2).replace('.', ',')}`)
    textoLimpo = `Anotado! ✅\n\n${linhas.join('\n')}\n\n💰 Subtotal: R$ ${pedido.subtotal.toFixed(2).replace('.', ',')}`
  }

  return { texto: textoLimpo, pedido }
}

module.exports = { chatComIA, buscarCardapioEConfig, formatarCardapioDoDia }
