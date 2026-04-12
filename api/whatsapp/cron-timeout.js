const { createClient } = require('@supabase/supabase-js')
const { enviarTexto } = require('../_lib/evolution')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  const secret = req.query.key || req.headers['x-cron-key'] || (req.headers['authorization'] || '').replace('Bearer ', '')
  if (secret !== (process.env.CRON_SECRET || 'fogao-cron-2024')) return res.status(401).json({ error: 'unauthorized' })

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  try {
    // Follow-up: sessões em saudacao há +3min
    const limite3min = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const { data: sessoes } = await supabase.from('fogao_whatsapp_sessions').select('telefone, nome_contato').eq('estado', 'saudacao').eq('humano_ativo', false).lt('updated_at', limite3min).limit(20)
    const enviados = []
    for (const s of (sessoes || [])) {
      try {
        await enviarTexto(s.telefone, `Ei${s.nome_contato ? `, ${s.nome_contato}` : ''}! 😊\n\nNosso cardápio de hoje:\n👉 https://fogaoleninha2.vercel.app\n\nSe tiver dificuldade, responda *"quero pedir"* que anoto por aqui! 📱`)
        await supabase.from('fogao_whatsapp_sessions').update({ estado: 'insistiu_site', updated_at: new Date().toISOString() }).eq('telefone', s.telefone)
        enviados.push(s.telefone)
      } catch {}
    }

    // Timeout humano 5min
    const limite5min = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: humanos } = await supabase.from('fogao_whatsapp_sessions').select('telefone').eq('humano_ativo', true).lt('updated_at', limite5min).limit(20)
    const devolvidos = []
    for (const s of (humanos || [])) {
      await supabase.from('fogao_whatsapp_sessions').update({ humano_ativo: false, estado: 'saudacao', updated_at: new Date().toISOString() }).eq('telefone', s.telefone)
      devolvidos.push(s.telefone)
    }

    return res.status(200).json({ ok: true, followups: enviados.length, humanosDevolvidos: devolvidos.length })
  } catch (err) { return res.status(500).json({ error: err.message }) }
}
