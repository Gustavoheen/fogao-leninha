import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Converte valores digitados para maiúsculas (exceto senhas, números, e-mails, tel e datas)
// Roda na fase capture (antes do React) → React já lê o valor em maiúsculo no bubble
const TIPOS_EXCLUIDOS = new Set(['password', 'number', 'email', 'tel', 'date', 'time', 'datetime-local'])
document.addEventListener('input', e => {
  const el = e.target
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return
  if (TIPOS_EXCLUIDOS.has(el.type)) return
  const upper = el.value.toUpperCase()
  if (upper === el.value) return
  const { selectionStart, selectionEnd } = el
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, upper)
  try { el.setSelectionRange(selectionStart, selectionEnd) } catch {}
}, true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
