const EVO_URL = () => (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const EVO_KEY = () => process.env.EVOLUTION_API_KEY || ''
const EVO_INST = () => (process.env.EVOLUTION_INSTANCE || 'fogao').trim()

function evoFetch(path, options = {}) {
  if (!EVO_URL()) return Promise.resolve({})
  return fetch(`${EVO_URL()}${path}`, { ...options, headers: { apikey: EVO_KEY(), ...options.headers } })
    .then(r => r.json().catch(() => ({}))).catch(() => ({}))
}

module.exports = async function handler(req, res) {
  const instance = EVO_INST()
  const sr = await evoFetch(`/instance/connectionState/${instance}`)
  const state = sr?.instance?.state || sr?.state || 'unknown'
  const connected = state === 'open'
  let qr = null
  if (!connected) { const r = await evoFetch(`/instance/connect/${instance}`); qr = r?.base64 || r?.qrcode?.base64 || r?.qrCode?.base64 || null }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WhatsApp — Fogão a Lenha</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.card{background:#1a1a1a;border-radius:20px;padding:40px;text-align:center;max-width:450px;width:100%;border:1px solid #333}h1{color:#f97316;font-size:1.5rem;margin-bottom:8px}.status{display:inline-block;padding:6px 16px;border-radius:20px;font-size:.85rem;font-weight:600;margin:16px 0}.connected{background:#22c55e20;color:#22c55e;border:1px solid #22c55e40}.disconnected{background:#ef444420;color:#ef4444;border:1px solid #ef444440}.qr{background:#fff;border-radius:16px;padding:20px;display:inline-block;margin:20px 0}.qr img{width:280px;height:280px}.info{color:#999;font-size:.85rem;margin-top:12px}.refresh{display:inline-block;margin-top:20px;padding:10px 24px;background:#f97316;color:#111;border:none;border-radius:10px;font-weight:600;cursor:pointer;text-decoration:none;font-size:.9rem}</style></head><body><div class="card"><h1>🍲 Fogão a Lenha da Leninha</h1><p style="color:#999">WhatsApp Bot</p>${connected ? '<div style="font-size:3rem;margin:20px 0">✅</div><div class="status connected">Conectado</div><p class="info">Bot online! Instância: '+instance+'</p>' : qr ? '<div class="status disconnected">Desconectado</div><div class="qr"><img src="'+qr+'" alt="QR"/></div><p class="info">Abra WhatsApp > Dispositivos conectados > Escanear</p>' : '<div class="status disconnected">Desconectado</div><p class="info" style="margin:20px 0">Clique em atualizar pra gerar QR Code</p>'}<a href="/api/whatsapp/qrcode" class="refresh">🔄 Atualizar</a></div></body></html>`)
}
