/**
 * Verificação de horário de funcionamento.
 * Schema esperado em configuracoes.horario_funcionamento (jsonb):
 *   { "seg": ["07:00","14:00"], ..., "sab": null, "dom": null }
 */

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const DIAS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function agoraBR() {
  const utc = new Date()
  return new Date(utc.getTime() - 3 * 60 * 60 * 1000)
}

function hhmm(d) {
  return d.toUTCString().slice(17, 22)
}

function dentroDoHorario(schedule) {
  if (!schedule || typeof schedule !== 'object') return true
  const d = agoraBR()
  const dia = DIAS[d.getUTCDay()]
  const janela = schedule[dia]
  if (!janela || !Array.isArray(janela) || janela.length !== 2) return false
  const [abre, fecha] = janela
  const agora = hhmm(d)
  return agora >= abre && agora <= fecha
}

function proximaAbertura(schedule) {
  if (!schedule) return null
  const d = agoraBR()
  for (let i = 0; i < 7; i++) {
    const idx = (d.getUTCDay() + i) % 7
    const dia = DIAS[idx]
    const janela = schedule[dia]
    if (!janela || !Array.isArray(janela) || janela.length !== 2) continue
    if (i === 0) {
      const agora = hhmm(d)
      if (agora <= janela[1]) {
        return agora < janela[0] ? `hoje às ${janela[0]}` : null
      }
    }
    const nomeDia = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DIAS_PT[idx]
    return `${nomeDia} às ${janela[0]}`
  }
  return null
}

function mensagemFechado(schedule) {
  const prox = proximaAbertura(schedule)
  if (prox) return `😔 No momento estamos fechados.\nAbrimos *${prox}*. Te espero!`
  return '😔 No momento estamos fechados. Volte mais tarde!'
}

module.exports = { dentroDoHorario, proximaAbertura, mensagemFechado }
