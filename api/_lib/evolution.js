/**
 * Evolution API client — envia mensagens via WhatsApp
 * Env vars: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

const API_URL = () => (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const API_KEY = () => process.env.EVOLUTION_API_KEY || ''
const INSTANCE = () => (process.env.EVOLUTION_INSTANCE || 'fogao').trim()

async function evoFetch(path, body) {
  const url = `${API_URL()}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY() },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) console.error('[Evolution]', res.status, data)
  return data
}

async function enviarTexto(telefone, texto) {
  const numero = String(telefone).replace(/\D/g, '')
  return evoFetch(`/message/sendText/${INSTANCE()}`, { number: numero, text: texto })
}

async function enviarBotoes(telefone, texto, botoes, titulo, rodape) {
  const numero = String(telefone).replace(/\D/g, '')
  try {
    const result = await evoFetch(`/message/sendButtons/${INSTANCE()}`, {
      number: numero, title: titulo || '', description: texto, footer: rodape || '',
      buttons: botoes.map(b => ({ buttonId: b.id, buttonText: { displayText: b.text } })),
    })
    if (result?.error || result?.status === 400) throw new Error('buttons not supported')
    return result
  } catch {
    const opcoes = botoes.map((b, i) => `*${i + 1}.* ${b.text}`).join('\n')
    const msg = (titulo ? `*${titulo}*\n\n` : '') + texto + '\n\n' + opcoes + (rodape ? `\n\n_${rodape}_` : '')
    return enviarTexto(telefone, msg)
  }
}

async function enviarLista(telefone, texto, textoBotao, secoes, titulo, rodape) {
  const numero = String(telefone).replace(/\D/g, '')
  try {
    const result = await evoFetch(`/message/sendList/${INSTANCE()}`, {
      number: numero, title: titulo || '', description: texto, footer: rodape || '',
      buttonText: textoBotao,
      sections: secoes.map(s => ({
        title: s.titulo,
        rows: s.itens.map(item => ({ rowId: item.id, title: item.titulo.substring(0, 24), description: (item.descricao || '').substring(0, 72) })),
      })),
    })
    if (result?.error || result?.status === 400) throw new Error('list not supported')
    return result
  } catch {
    let msg = (titulo ? `*${titulo}*\n\n` : '') + texto + '\n\n'
    for (const secao of secoes) {
      msg += `── *${secao.titulo}* ──\n`
      for (const item of secao.itens) { msg += `▸ *${item.titulo}*`; if (item.descricao) msg += ` — ${item.descricao}`; msg += '\n' }
      msg += '\n'
    }
    return enviarTexto(telefone, msg)
  }
}

async function enviarImagem(telefone, imageUrl, caption) {
  const numero = String(telefone).replace(/\D/g, '')
  try {
    return await evoFetch(`/message/sendMedia/${INSTANCE()}`, { number: numero, mediatype: 'image', media: imageUrl, caption: caption || '' })
  } catch {
    if (caption) return enviarTexto(telefone, caption)
    return null
  }
}

module.exports = { enviarTexto, enviarBotoes, enviarLista, enviarImagem, API_URL, API_KEY, INSTANCE }
