/**
 * Gerenciamento da instância Evolution API — Fogão a Lenha.
 */
const EVO_URL = () => (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const EVO_KEY = () => process.env.EVOLUTION_API_KEY || ''
const EVO_INST = () => (process.env.EVOLUTION_INSTANCE || 'fogao').trim()

function evoFetch(path, options = {}, timeoutMs = 8000) {
  const url = `${EVO_URL()}${path}`
  if (!EVO_URL()) return Promise.resolve({ _nourl: true })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, headers: { apikey: EVO_KEY(), ...options.headers }, signal: controller.signal })
    .then(r => r.json().catch(() => ({}))).catch(() => ({ _fetch_error: true })).finally(() => clearTimeout(timer))
}
function evoError(r) { return !r || r._nourl || r._fetch_error || r._parse_error }
async function evoGet(p) { return evoFetch(p) }
async function evoPost(p, b) { return evoFetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }) }
async function evoDel(p) { return evoFetch(p, { method: 'DELETE' }) }

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const instance = EVO_INST()
  const webhookUrl = 'https://fogaoleninha2.vercel.app/api/whatsapp/webhook'
  try {
    if (req.method === 'GET') {
      if (!EVO_URL()) return res.status(200).json({ connected: false, exists: false, instance, error: 'EVOLUTION_API_URL não configurada' })
      const sr = await evoGet(`/instance/connectionState/${instance}`)
      if (evoError(sr)) return res.status(200).json({ connected: false, exists: false, instance, error: 'Evolution API indisponível' })
      if (sr?.error || sr?.statusCode === 404 || sr?.statusCode === 400) {
        if (req.query.qr === '1') { const cr = await evoPost('/instance/create', { instanceName: instance, integration: 'WHATSAPP-BAILEYS', qrcode: true }); return res.status(200).json({ connected: false, exists: true, state: 'close', instance, qrcode: cr?.qrcode?.base64 || cr?.base64 || null }) }
        return res.status(200).json({ connected: false, exists: false, instance })
      }
      const state = sr?.instance?.state || sr?.state || 'close'; const connected = state === 'open'
      let qrcode = null
      if (!connected && req.query.qr === '1') {
        let qr = await evoGet(`/instance/connect/${instance}`)
        const fq = qr?.base64 || qr?.qrcode?.base64 || qr?.qrCode?.base64 || null
        if (!fq || evoError(qr)) { await evoDel(`/instance/logout/${instance}`).catch(() => {}); await new Promise(r => setTimeout(r, 1500)); qr = await evoGet(`/instance/connect/${instance}`) }
        if (!evoError(qr)) qrcode = qr?.base64 || qr?.qrcode?.base64 || qr?.qrCode?.base64 || qr?.data?.base64 || null
        qrcode = typeof qrcode === 'string' && qrcode.length > 10 ? qrcode : null
      }
      return res.status(200).json({ connected, exists: true, state, instance, qrcode })
    }
    if (req.method === 'POST') {
      let cr; try { cr = await evoPost('/instance/create', { instanceName: instance, integration: 'WHATSAPP-BAILEYS', qrcode: true, webhook: { url: webhookUrl, byEvents: false, base64: false, events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'] } }) } catch { cr = await evoGet(`/instance/connect/${instance}`) }
      await evoPost(`/webhook/set/${instance}`, { webhook: { url: webhookUrl, webhookByEvents: false, webhookBase64: false, events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'], enabled: true } }).catch(() => {})
      return res.status(200).json({ ok: true, instance, qrcode: cr?.qrcode?.base64 || cr?.base64 || null, webhookUrl })
    }
    if (req.method === 'DELETE') { const action = req.query.action || 'logout'; const r = action === 'delete' ? await evoDel(`/instance/delete/${instance}`) : await evoDel(`/instance/logout/${instance}`); return res.status(200).json({ ok: true, action, result: r }) }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) { return res.status(500).json({ error: err.message }) }
}
