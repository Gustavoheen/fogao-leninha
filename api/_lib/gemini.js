/**
 * IA atendente — Fogão a Lenha da Leninha.
 * Cardápio muda todo dia. Busca do Supabase antes de cada conversa.
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

  let texto = `═══ CARDÁPIO DE HOJE ═══\n`
  texto += `*Fogão a Lenha da Leninha* 🍲\n\n`

  if (carnes.length > 0) {
    texto += `🥩 *CARNES DO DIA:*\n`
    carnes.forEach((c, i) => { texto += `  ${i + 1}. ${c}\n` })
    texto += `\n`
  }

  texto += `📦 *TAMANHOS:*\n`
  texto += `  • Pequena (P) — R$ ${precoP}\n`
  texto += `  • Grande (G) — R$ ${precoG}\n\n`

  if (opcoes.length > 0) {
    opcoes.forEach((o, i) => {
      texto += `🍽️ *${o.nome || 'Opção ' + (i + 1)}:*\n`
      if (o.tipoCarnes === 'especial' && o.pratoEspecial) {
        texto += `  🥩 ${o.pratoEspecial}\n`
      }
      if (o.acompanhamentos && o.acompanhamentos.length > 0) {
        texto += `  Acompanha: ${o.acompanhamentos.join(', ')}\n`
      }
      texto += `\n`
    })
  }

  if (salada && salada.disponivel) {
    texto += `🥗 *SALADA:* R$ ${salada.preco || '?'}\n`
    if (salada.ingredientes?.length > 0) texto += `  ${salada.ingredientes.join(', ')}\n`
    texto += `\n`
  }

  const refrigerantes = bebidas.filter(b => b.categoria === 'Refrigerante')
  const combos = bebidas.filter(b => b.categoria === 'Combo')

  if (refrigerantes.length > 0) {
    texto += `🥤 *BEBIDAS:*\n`
    refrigerantes.forEach(b => { texto += `  • ${b.nome}${b.subtipo ? ` (${b.subtipo})` : ''} — R$ ${Number(b.preco).toFixed(2).replace('.', ',')}\n` })
    texto += `\n`
  }

  if (combos.length > 0) {
    texto += `🎉 *COMBOS:*\n`
    combos.forEach(b => { texto += `  • ${b.nome} — R$ ${Number(b.preco).toFixed(2).replace('.', ',')}${b.descricao ? ` (${b.descricao})` : ''}\n` })
    texto += `\n`
  }

  return texto
}

// ─── SYSTEM PROMPT ──────────────────────────────────────────

function montarSystemPrompt(cardapioTexto, config, dicasDono) {
  let prompt = `Você é a atendente virtual do *Fogão a Lenha da Leninha*, restaurante de comida caseira mineira em Visconde do Rio Branco, MG.

PERSONALIDADE:
- Simpática, acolhedora, tom de comida de vó mineira 🍲
- Emojis com moderação (1-2 por mensagem)
- Respostas CURTAS — conversa de WhatsApp, não redação
- Natural, como atendente real

═══════════════════════════════════════════
REGRAS DO CARDÁPIO (MUITO IMPORTANTE):
═══════════════════════════════════════════

1. O CARDÁPIO MUDA TODO DIA. Use APENAS o que está listado abaixo.
2. MARMITEX tem 2 tamanhos: P (Pequena) e G (Grande). SEMPRE pergunte o tamanho se não disse.
3. O cliente escolhe uma OPÇÃO (Opção 1 ou Opção 2). Cada opção tem seus acompanhamentos.
4. NÃO PODE misturar itens da Opção 1 com Opção 2. Cada opção é um prato fechado.
5. O cliente pode apenas RETIRAR acompanhamentos que não quer ("sem feijão", "tira o macarrão").
6. Se perguntar "o que tem hoje?", mande o cardápio completo.
7. Assuma 1 marmitex se não disse quantidade.

═══════════════════════════════════════════
ADICIONAIS (COBRAM EXTRA):
═══════════════════════════════════════════
• Comida em ARROZ (marmitex de arroz) = +R$ 5,00 no preço
• Carne ADICIONAL = +R$ 7,00
• Ovo ADICIONAL = +R$ 4,00
Informe o cliente sobre os adicionais quando pedir.

═══════════════════════════════════════════
SALADA:
═══════════════════════════════════════════
Se tiver salada disponível hoje, SEMPRE pergunte se quer antes de confirmar:
"Vai querer salada também?" (informar preço)

═══════════════════════════════════════════
BEBIDAS:
═══════════════════════════════════════════
Sempre sugira bebida: "Vai querer uma bebida?"

═══════════════════════════════════════════
HORÁRIOS DE ENTREGA:
═══════════════════════════════════════════
• Entregas começam às 10:30
• Prazo: 30 a 60 minutos
• Se o cliente pedir ANTES das 10h, informar que a entrega será após as 10:30
• Se o cliente quiser horário específico, anotar na observação
• Exemplo: "quero pra 12h" → anotar "Entregar às 12h"

═══════════════════════════════════════════
COMO ENTENDER PEDIDOS:
═══════════════════════════════════════════
- "marmita" / "marmitex" / "quentinha" = Marmitex
- "grande" / "G" / "a grande" = tamanho Grande
- "pequena" / "P" / "a pequena" = tamanho Pequeno
- "opção 1" / "a primeira" / "1" / "op1" = Opção 1
- "opção 2" / "a segunda" / "2" / "op2" = Opção 2
- "sem arroz" / "tira o feijão" = remover acompanhamento
- "em arroz" / "marmitex de arroz" / "no arroz" = comida em arroz (+R$5)
- "com ovo" / "adiciona ovo" = ovo adicional (+R$4)
- "carne extra" / "mais carne" = carne adicional (+R$7)
- "mensalista" / "sou mensal" / "quinzenal" = pagamento Mensalista
- "coca" / "refri" = pergunte o tamanho/tipo
- "troco pra 50" = anotar troco

═══════════════════════════════════════════
FORMATO DE PEDIDO FINALIZADO:
═══════════════════════════════════════════
Quando o cliente CONFIRMAR ("isso", "só isso", "manda", "fecha", "pode ser"), responda com JSON:

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
      "emArroz": false,
      "adicionais": [],
      "preco": 25.00,
      "qtd": 1
    }
  ],
  "subtotal": 25.00,
  "embalagens_adicionais": 0,
  "observacao": "",
  "horario_entrega": null,
  "dados_extraidos": {
    "nome": null,
    "endereco": null,
    "pagamento": null,
    "troco": null
  }
}
\`\`\`

REGRAS DO JSON:
- "tipo": "marmitex" ou "bebida" ou "combo" ou "salada"
- "opcaoNome": nome da opção escolhida
- "tamanho": "P" ou "G" (só marmitex)
- "proteina": carne escolhida se especificou
- "semItens": array de acompanhamentos removidos
- "emArroz": true se pediu comida em arroz (+R$5 já somado no preco)
- "adicionais": ["ovo", "carne extra"] — cada um com preço já somado
- "preco": preço CORRETO (tamanho + adicionais)
- "horario_entrega": "12:00" se pediu horário específico, null se não
- "dados_extraidos": extraia o que puder do contexto (nome, endereço, pagamento, troco)
- IMPORTANTE: Se pediu "em arroz", some +R$5 ao preço. Se pediu ovo, some +R$4. Carne extra +R$7.

${cardapioTexto}

➕ ADICIONAIS:
• Comida em arroz: +R$ 5,00
• Carne adicional: +R$ 7,00
• Ovo adicional: +R$ 4,00
• Embalagem adicional: +R$ 1,00

📦 Entrega: a partir das 10:30 | Prazo: 30 a 60 min
💳 Pagamento: Pix, Dinheiro, Cartão (motoboy cobra), Mensalista`

  if (dicasDono && dicasDono.trim()) {
    prompt += `\n\n━━━ INSTRUÇÕES DO DONO ━━━\n${dicasDono.trim()}`
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
      if (r.ok && d?.choices?.[0]?.message?.content) { resposta = d.choices[0].message.content }
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
      if (r.ok && d?.choices?.[0]?.message?.content) { resposta = d.choices[0].message.content }
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
      if (r.ok) resposta = d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
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

  // Validar preços
  if (pedido) {
    const precoP = Number(cardapio.precoP) || 0
    const precoG = Number(cardapio.precoG) || 0
    let subtotal = 0
    for (const item of pedido.itens) {
      if (item.tipo === 'marmitex') {
        let precoBase = item.tamanho === 'G' ? precoG : precoP
        if (item.emArroz) precoBase += 5
        if (item.adicionais?.includes('ovo')) precoBase += 4
        if (item.adicionais?.includes('carne extra') || item.adicionais?.includes('carne')) precoBase += 7
        item.preco = precoBase
      } else if (item.tipo === 'salada') {
        const saladaPreco = Number(cardapio.salada?.preco) || 0
        item.preco = saladaPreco
      } else {
        const found = bebidas.find(b => b.nome.toLowerCase() === (item.opcaoNome || item.nome || '').toLowerCase())
        if (found) item.preco = Number(found.preco)
      }
      subtotal += (item.preco || 0) * (item.qtd || 1)
    }
    subtotal += (pedido.embalagens_adicionais || 0)
    pedido.subtotal = Math.round(subtotal * 100) / 100
  }

  let textoLimpo = resposta.replace(/```json[\s\S]*?```/g, '').trim()
  if (!textoLimpo && pedido) {
    const linhas = pedido.itens.map(i => {
      let desc = `${i.qtd || 1}x ${i.opcaoNome || i.nome} (${i.tamanho || ''})`
      if (i.emArroz) desc += ' 🍚 em arroz'
      if (i.semItens?.length) desc += ` sem ${i.semItens.join(', ')}`
      if (i.adicionais?.length) desc += ` + ${i.adicionais.join(', ')}`
      desc += ` — R$ ${((i.preco || 0) * (i.qtd || 1)).toFixed(2).replace('.', ',')}`
      return `  ${desc}`
    })
    textoLimpo = `Anotado! ✅\n\n${linhas.join('\n')}\n\n💰 Subtotal: R$ ${pedido.subtotal.toFixed(2).replace('.', ',')}`
  }

  return { texto: textoLimpo, pedido }
}

module.exports = { chatComIA, buscarCardapioEConfig, formatarCardapioDoDia }
