/**
 * Webhook do bot WhatsApp — Fogão a Lenha da Leninha
 * Delega lógica de conversação ao agente OpenAI (api/_lib/agent.js).
 */

const { createClient } = require('@supabase/supabase-js')
const evo = require('../_lib/evolution')
const { transcreverAudio } = require('../_lib/whisper')
const { processarMensagem } = require('../_lib/agent')
const { dentroDoHorario, mensagemFechado } = require('../_lib/horario')

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000
const NOME_LOJA = 'Fogão a Lenha da Leninha'
const LINK_SITE = 'https://fogaoleninha2.vercel.app'

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

function limparTelefone(jid) {
  let tel = (jid || '').replace(/@.*$/, '').replace(/\D/g, '')
  if (tel.startsWith('55') && tel.length === 12) tel = tel.slice(0, 4) + '9' + tel.slice(4)
  return tel
}

function extrairTextoMensagem(msg) {
  if (!msg) return ''
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.listResponseMessage?.title ||
    msg.templateButtonReplyMessage?.selectedId ||
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    msg.imageMessage?.caption ||
    ''
  ).trim()
}

function extrairAudioInfo(msg) {
  const audio = msg?.audioMessage
  if (!audio) return null
  return { mimetype: audio.mimetype || 'audio/ogg' }
}

async function buscarSessao(sb, telefone) {
  const { data } = await sb.from('fogao_whatsapp_sessions').select('*').eq('telefone', telefone).single()
  return data
}

async function upsertSessao(sb, telefone, updates) {
  await sb.from('fogao_whatsapp_sessions').upsert(
    { telefone, ...updates, updated_at: new Date().toISOString() },
    { onConflict: 'telefone' }
  )
}

module.exports = async function handler(req, res) {
  const allowed = ['https://fogaoleninha2.vercel.app', 'http://localhost:5173']
  const origin = req.headers?.origin
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET
  if (webhookSecret && req.headers['x-webhook-secret'] !== webhookSecret) {
    return res.status(401).json({ error: 'Invalid webhook' })
  }

  try {
    const body = req.body
    const eventNorm = ((body.event || '') + '').toUpperCase().replace(/\./g, '_')
    if (eventNorm !== 'MESSAGES_UPSERT') return res.status(200).json({ ok: true, skip: body.event })

    const data = body.data
    if (!data?.key?.remoteJid || data.key.remoteJid.includes('@g.us')) {
      return res.status(200).json({ ok: true, skip: 'no jid or group' })
    }

    const sb = getSupabase()
    const telefone = limparTelefone(data.key.remoteJid)
    const fromMe = data.key.fromMe === true
    const msgId = data.key.id
    const nomeContato = data.pushName || ''

    // ── HUMAN TAKEOVER: atendente digita e envia → ativa modo humano ──────
    if (fromMe) {
      const msgTexto = extrairTextoMensagem(data.message)
      if (msgTexto) {
        const sessao = await buscarSessao(sb, telefone)
        const botIds = sessao?.bot_msg_ids || []
        // Se a msg NÃO foi mandada pelo bot, é atendente assumindo
        if (!botIds.includes(msgId)) {
          const hist = (sessao?.ia_historico || []).slice(-40)
          hist.push({ role: 'model', text: '👤 ' + msgTexto })
          await upsertSessao(sb, telefone, {
            humano_ativo: true,
            estado: 'humano',
            ia_historico: hist,
          })
        }
      }
      return res.status(200).json({ ok: true, handled: 'outgoing' })
    }

    // ── Texto ou transcrição de áudio ─────────────────────────────────────
    let texto = extrairTextoMensagem(data.message)
    const audioInfo = extrairAudioInfo(data.message)
    if (!texto && audioInfo) {
      const base64 = data.message?.audioMessage?.base64 || body.base64 || data.base64 || null
      if (base64) {
        texto = await transcreverAudio(null, base64, audioInfo.mimetype)
      } else {
        try {
          const evoUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
          const evoKey = process.env.EVOLUTION_API_KEY || ''
          const evoInst = process.env.EVOLUTION_INSTANCE || 'fogao'
          const mediaRes = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${evoInst}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: evoKey },
            body: JSON.stringify({ message: { key: data.key, message: data.message } }),
          })
          const mediaData = await mediaRes.json()
          if (mediaData?.base64) {
            texto = await transcreverAudio(null, mediaData.base64, mediaData.mimetype || audioInfo.mimetype)
          }
        } catch (e) {
          console.error('[Webhook] audio fallback erro:', e.message)
        }
      }

      if (!texto) {
        const fb = '🎤 Não consegui entender o áudio. Pode digitar a mensagem? 😊'
        await evo.enviarTexto(telefone, fb)
        return res.status(200).json({ ok: true, action: 'audio_nao_transcrito' })
      }
      texto = texto.trim()
    }

    // Imagem sem caption: presumir comprovante de Pix
    if (!texto && data.message?.imageMessage) {
      texto = '[cliente enviou uma imagem — possivelmente comprovante de Pix]'
    }
    if (!texto) return res.status(200).json({ ok: true, skip: 'no text' })

    // ── Sessão ─────────────────────────────────────────────────────────────
    let sessao = await buscarSessao(sb, telefone)
    if (sessao?.updated_at && Date.now() - new Date(sessao.updated_at).getTime() > SESSION_TIMEOUT_MS) {
      // Reset por timeout
      await upsertSessao(sb, telefone, {
        estado: 'novo',
        humano_ativo: false,
        nome_contato: nomeContato,
        bot_msg_ids: [],
        ia_historico: [],
        ia_pedido: null,
        dados_cliente: null,
      })
      sessao = await buscarSessao(sb, telefone)
    }
    if (!sessao) {
      await upsertSessao(sb, telefone, {
        estado: 'novo',
        humano_ativo: false,
        nome_contato: nomeContato,
        bot_msg_ids: [],
        ia_historico: [],
      })
      sessao = await buscarSessao(sb, telefone)
    }

    // Se modo humano, salva mensagem do cliente no histórico mas não responde
    if (sessao.humano_ativo) {
      const hist = (sessao.ia_historico || []).slice(-40)
      hist.push({ role: 'user', text: texto })
      await upsertSessao(sb, telefone, { ia_historico: hist, nome_contato: nomeContato || sessao.nome_contato })
      return res.status(200).json({ ok: true, skip: 'humano_ativo' })
    }

    // ── Config / horário ───────────────────────────────────────────────────
    const { data: confArr } = await sb.from('configuracoes').select('*').eq('id', 1).limit(1)
    const config = confArr?.[0] || {}
    const modoBot = config.bot_ativo || 'auto'
    if (modoBot === 'desligado') return res.status(200).json({ ok: true, skip: 'bot_desligado' })

    const aberto = modoBot === 'ligado'
      ? true
      : (config.lojaAberta !== false && dentroDoHorario(config.horario_funcionamento))
    if (!aberto) {
      const txt = mensagemFechado(config.horario_funcionamento) + `\n\nCardápio: 👉 ${LINK_SITE}`
      const result = await evo.enviarTexto(telefone, txt)
      const sentMsgId = result?.key?.id || result?.messageId
      const ids = (sessao.bot_msg_ids || []).slice(-20)
      if (sentMsgId) ids.push(sentMsgId)
      await upsertSessao(sb, telefone, {
        estado: 'fora_horario',
        nome_contato: nomeContato,
        bot_msg_ids: ids,
      })
      return res.status(200).json({ ok: true, action: 'fora_horario' })
    }

    // ── AGENTE OpenAI ──────────────────────────────────────────────────────
    const evoWrapper = {
      enviarTexto: async (tel, t) => {
        const r = await evo.enviarTexto(tel, t)
        const id = r?.key?.id || r?.messageId
        if (id) {
          // Salva async, não bloqueia
          buscarSessao(sb, telefone).then(s => {
            const ids = (s?.bot_msg_ids || []).slice(-20)
            ids.push(id)
            return sb.from('fogao_whatsapp_sessions').update({ bot_msg_ids: ids, updated_at: new Date().toISOString() }).eq('telefone', telefone)
          }).catch(() => {})
        }
        return r
      },
      enviarImagem: evo.enviarImagem || (async (tel, url, cap) => evo.enviarTexto(tel, `${cap}\n${url}`)),
    }

    const resultado = await processarMensagem({
      telefone, pushName: nomeContato, mensagem: texto, sessao, sb, evo: evoWrapper,
    })

    // ── Persiste sessão ────────────────────────────────────────────────────
    await upsertSessao(sb, telefone, {
      estado: resultado.handoverSolicitado ? 'humano' : 'em_atendimento',
      humano_ativo: !!resultado.handoverSolicitado,
      nome_contato: nomeContato || sessao.nome_contato,
      ia_historico: resultado.novoHistorico,
      ultimo_pedido_id: resultado.ultimoPedidoId || sessao.ultimo_pedido_id || null,
    })

    return res.status(200).json({
      ok: true,
      handover: resultado.handoverSolicitado || false,
      pedido: resultado.ultimoPedidoId || null,
    })
  } catch (err) {
    console.error('[Webhook]', err)
    return res.status(200).json({ ok: false, error: err.message })
  }
}
