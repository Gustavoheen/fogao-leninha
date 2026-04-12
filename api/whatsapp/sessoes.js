const { createClient } = require('@supabase/supabase-js')
const { enviarTexto } = require('../_lib/evolution')
const supabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const sb = supabase()
  try {
    if (req.method === 'GET') { const { data } = await sb.from('fogao_whatsapp_sessions').select('*').order('updated_at', { ascending: false }).limit(50); return res.status(200).json(data || []) }
    if (req.method === 'PATCH') {
      const { telefone, humano_ativo, mensagem } = req.body
      if (!telefone) return res.status(400).json({ error: 'telefone obrigatório' })
      if (mensagem) { await enviarTexto(telefone, mensagem); await sb.from('fogao_whatsapp_sessions').update({ humano_ativo: true, estado: 'humano', updated_at: new Date().toISOString() }).eq('telefone', telefone); return res.status(200).json({ ok: true }) }
      if (humano_ativo !== undefined) { const u = { humano_ativo: !!humano_ativo, updated_at: new Date().toISOString() }; if (!humano_ativo) u.estado = 'saudacao'; await sb.from('fogao_whatsapp_sessions').update(u).eq('telefone', telefone); return res.status(200).json({ ok: true }) }
      return res.status(400).json({ error: 'Nenhuma ação' })
    }
    if (req.method === 'DELETE') { const { telefone } = req.query; await sb.from('fogao_whatsapp_sessions').delete().eq('telefone', telefone); return res.status(200).json({ ok: true }) }
    return res.status(405).end()
  } catch (err) { return res.status(500).json({ error: err.message }) }
}
