const { createClient } = require('@supabase/supabase-js')
const supabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const sb = supabase()
  try {
    if (req.method === 'GET') { const { data } = await sb.from('fogao_alertas').select('*').eq('status', req.query.status || 'aberto').order('created_at', { ascending: false }).limit(50); return res.status(200).json(data || []) }
    if (req.method === 'PATCH') { const { id, resposta, respondido_por } = req.body; await sb.from('fogao_alertas').update({ status: 'resolvido', resposta: resposta || '', respondido_por: respondido_por || 'admin', resolved_at: new Date().toISOString() }).eq('id', id); return res.status(200).json({ ok: true }) }
    if (req.method === 'DELETE') { await sb.from('fogao_alertas').delete().eq('id', req.query.id); return res.status(200).json({ ok: true }) }
    return res.status(405).end()
  } catch (err) { return res.status(500).json({ error: err.message }) }
}
