/**
 * Transcrição de áudio via Groq Whisper API (free tier).
 * Env: GROQ_API_KEY
 */
const GROQ_KEY = () => process.env.GROQ_API_KEY || ''

async function transcreverAudio(audioUrl, base64, mimetype) {
  const key = GROQ_KEY()
  if (!key) return ''
  let audioBuffer, filename = 'audio.ogg'
  if (base64) {
    audioBuffer = Buffer.from(base64, 'base64')
    if (mimetype?.includes('mp4') || mimetype?.includes('m4a')) filename = 'audio.m4a'
    else if (mimetype?.includes('mp3') || mimetype?.includes('mpeg')) filename = 'audio.mp3'
  } else if (audioUrl) {
    const res = await fetch(audioUrl, { timeout: 15000 })
    if (!res.ok) return ''
    audioBuffer = Buffer.from(await res.arrayBuffer())
  } else return ''
  if (!audioBuffer || audioBuffer.length === 0) return ''
  const boundary = '----FormBoundary' + Date.now().toString(36)
  const parts = []
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo`)
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt`)
  const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/ogg\r\n\r\n`)
  const fileFooter = Buffer.from(`\r\n--${boundary}--\r\n`)
  const textParts = Buffer.from(parts.join('\r\n') + '\r\n')
  const bodyBuffer = Buffer.concat([textParts, fileHeader, audioBuffer, fileFooter])
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: bodyBuffer,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { console.error('[Whisper]', res.status); return '' }
  return (data.text || '').trim()
}
module.exports = { transcreverAudio }
