import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, Plus, Trash2, ChevronLeft,
  Copy, Check, X, ChevronRight, UtensilsCrossed, User, Settings, Flame, Phone,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9) }

function fmtTel(v) {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
}

function fmtR$(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function strAcomp(a) {
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.nome || a.name || a.label || a.value || ''
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF7F4',
  bgCard: '#FFFFFF',
  dark: '#1A0E06',
  mid: '#6B5040',
  muted: '#A89080',
  border: '#EDE5DC',
  borderLight: '#F5EFE8',
  primary: '#E8420A',
  primaryHover: '#D13A07',
  primaryBg: '#FFF3EE',
  primaryBorder: '#FFDDD0',
  heroBg: '#1C0900',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  greenBorder: '#BBF7D0',
  red: '#DC2626',
}
const F = { fontFamily: "'Nunito', system-ui, sans-serif" }
const FH = { fontFamily: "'Playfair Display', Georgia, serif" }

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ ...F, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `3px solid ${C.primaryBorder}`,
          borderTopColor: C.primary,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontSize: 14, color: C.mid, fontWeight: 600 }}>Carregando cardápio...</p>
      </div>
    </div>
  )
}

// ── Tela Confirmado ────────────────────────────────────────────────────────────
function TelaConfirmado({ pedido, config, onNovoPedido }) {
  const [copiado, setCopiado] = useState(false)

  function copiarPix() {
    navigator.clipboard.writeText(config.pixChave || '')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const isPix = pedido.pagamento === 'Pix'
  const whatsRestaurante = config.restauranteWhatsapp?.replace(/\D/g, '')

  return (
    <div style={{ ...F, minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Ícone check */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: C.green,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, boxShadow: '0 12px 40px rgba(22,163,74,0.3)',
        }}>
          <Check size={40} color="white" strokeWidth={2.5} />
        </div>

        <h1 style={{ ...FH, fontSize: 32, fontWeight: 700, color: C.dark, margin: 0, marginBottom: 6 }}>
          Pedido confirmado!
        </h1>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
          Seu número de pedido
        </p>

        {/* Número */}
        <div style={{
          background: C.primary, borderRadius: 20, padding: '28px 56px',
          marginBottom: 32, boxShadow: '0 12px 40px rgba(232,66,10,0.35)',
        }}>
          <span style={{ ...FH, fontWeight: 700, fontSize: 72, lineHeight: 1, color: '#FFFFFF' }}>
            #{String(pedido.numeroPedido).padStart(2, '0')}
          </span>
        </div>

        {/* Resumo */}
        <div style={{
          width: '100%', marginBottom: 16, borderRadius: 16, overflow: 'hidden',
          background: C.bgCard, border: `1px solid ${C.border}`,
          boxShadow: '0 2px 16px rgba(26,14,6,0.07)', textAlign: 'left',
        }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.muted, margin: 0 }}>
              Resumo do pedido
            </p>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pedido.itens.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: C.mid, fontSize: 14 }}>
                  {item.opcaoNome}
                  <span style={{ color: C.muted }}> ({item.tamanho === 'P' ? 'Pequena' : 'Grande'})</span>
                  {item.nome && <span style={{ color: C.primary }}> · {item.nome}</span>}
                  {item.semItens?.length > 0 && (
                    <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>
                      sem: {item.semItens.join(', ')}
                    </span>
                  )}
                </span>
                <span style={{ fontWeight: 700, color: C.dark, whiteSpace: 'nowrap', fontSize: 14 }}>{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span style={{ color: C.dark }}>Total</span>
            <span style={{ color: C.primary }}>{fmtR$(pedido.total)}</span>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Pagamento: {pedido.pagamento}</p>
          </div>
        </div>

        {/* Card Pix */}
        {isPix && config.pixChave && (
          <div style={{
            width: '100%', marginBottom: 16, borderRadius: 16, overflow: 'hidden',
            background: '#EFF6FF', border: '1px solid #BFDBFE', textAlign: 'left',
          }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #BFDBFE' }}>
              <p style={{ fontWeight: 700, color: '#2563EB', fontSize: 14, margin: 0 }}>Pagamento via Pix</p>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 14, color: C.mid, margin: 0 }}>
                Faça o Pix e envie o comprovante pelo WhatsApp para confirmar seu pedido.
              </p>
              <div style={{ background: '#DBEAFE', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, color: '#3B82F6', marginBottom: 4, fontWeight: 600 }}>Chave Pix</p>
                <p style={{ fontFamily: 'monospace', fontSize: 14, color: '#1E3A8A', wordBreak: 'break-all', margin: 0 }}>{config.pixChave}</p>
                {config.pixNome && <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 4, margin: '4px 0 0' }}>{config.pixNome}</p>}
              </div>
              <button
                onClick={copiarPix}
                style={{
                  background: copiado ? '#1D4ED8' : '#2563EB', color: '#FFFFFF',
                  border: 'none', borderRadius: 12, padding: '12px 20px',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  ...F,
                }}
              >
                {copiado ? <Check size={16} /> : <Copy size={16} />}
                {copiado ? 'Chave copiada!' : 'Copiar chave Pix'}
              </button>
              {whatsRestaurante && (
                <a
                  href={`https://wa.me/${whatsRestaurante}?text=Comprovante%20pedido%20%23${String(pedido.numeroPedido).padStart(2, '0')}%20-%20${encodeURIComponent(pedido.clienteNome)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: C.green, color: '#FFFFFF', textDecoration: 'none',
                    borderRadius: 12, padding: '12px 20px',
                    fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  Enviar comprovante no WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onNovoPedido}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, ...F, textDecoration: 'underline', textUnderlineOffset: 4, marginTop: 8 }}
        >
          Fazer novo pedido
        </button>
      </div>
    </div>
  )
}

// ── Modal de configuração ──────────────────────────────────────────────────────
function ModalMarmitex({ cardapioHoje, configurando, setConfigurando, onAdicionar }) {
  const opcoes = cardapioHoje?.opcoes?.filter(o => o.disponivel) || []
  const opcaoAtual = opcoes.find(o => o.id === configurando.opcaoId)

  function toggleAcomp(item) {
    setConfigurando(prev => ({
      ...prev,
      semItens: prev.semItens.includes(item)
        ? prev.semItens.filter(i => i !== item)
        : [...prev.semItens, item],
    }))
  }

  const preco = configurando.tamanho === 'P'
    ? Number(cardapioHoje?.precoP || 0)
    : Number(cardapioHoje?.precoG || 0)

  const tipoCarnes = opcaoAtual?.tipoCarnes || 'globais'
  const carnesDisponiveis = cardapioHoje?.carnes?.filter(c => c) || []
  const precisaProteina = tipoCarnes === 'globais' && carnesDisponiveis.length > 0
  const podeAdicionar = !!configurando.opcaoId && (!precisaProteina || !!configurando.proteina)

  const inputStyle = {
    ...F, width: '100%', borderRadius: 12, padding: '12px 16px',
    border: `1.5px solid ${C.border}`, background: '#FDFBF9', color: C.dark,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(26,14,6,0.72)', backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) setConfigurando(null) }}
    >
      <style>{`
        @media (min-width: 768px) {
          .modal-inner { border-radius: 20px !important; max-width: 520px !important; margin: auto !important; }
          .modal-wrap { align-items: center !important; padding: 20px !important; }
        }
      `}</style>
      <div className="modal-wrap" style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div className="modal-inner" style={{
          width: '100%', borderRadius: '20px 20px 0 0',
          maxHeight: '92vh', overflowY: 'auto',
          background: C.bgCard,
          boxShadow: '0 -8px 60px rgba(26,14,6,0.2)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, background: C.bgCard, zIndex: 10,
          }}>
            <div>
              <h2 style={{ ...FH, fontSize: 20, fontWeight: 700, color: C.dark, margin: 0 }}>Monte sua marmitex</h2>
              <p style={{ color: C.muted, fontSize: 13, margin: '2px 0 0', ...F }}>Personalize do seu jeito</p>
            </div>
            <button
              onClick={() => setConfigurando(null)}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: C.primaryBg, color: C.mid, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = C.primaryBorder}
              onMouseOut={e => e.currentTarget.style.background = C.primaryBg}
            >
              <X size={17} />
            </button>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Nome */}
            <div>
              <label style={{ ...F, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.muted, marginBottom: 10 }}>
                <User size={12} />
                Nome nessa marmitex
                <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(opcional)</span>
              </label>
              <input
                type="text" data-nocase placeholder="Ex: João, Maria, Filha..."
                value={configurando.nome}
                onChange={e => setConfigurando(prev => ({ ...prev, nome: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Tamanho */}
            <div>
              <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.muted, marginBottom: 12 }}>Tamanho</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { value: 'P', label: 'Pequena', preco: cardapioHoje?.precoP },
                  { value: 'G', label: 'Grande', preco: cardapioHoje?.precoG },
                ].map(({ value, label, preco: p }) => {
                  const sel = configurando.tamanho === value
                  return (
                    <button
                      key={value}
                      onClick={() => setConfigurando(prev => ({ ...prev, tamanho: value }))}
                      style={{
                        ...F, borderRadius: 14, padding: '16px', textAlign: 'left', cursor: 'pointer',
                        border: `2px solid ${sel ? C.primary : C.border}`,
                        background: sel ? C.primaryBg : C.bgCard,
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontWeight: 800, fontSize: 15, color: C.dark, margin: 0 }}>{label}</p>
                      {p && <p style={{ fontWeight: 800, fontSize: 18, color: C.primary, margin: '4px 0 0' }}>{fmtR$(p)}</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Opção */}
            {opcoes.length > 1 && (
              <div>
                <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.muted, marginBottom: 12 }}>Opção</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {opcoes.map(op => {
                    const sel = configurando.opcaoId === op.id
                    return (
                      <button
                        key={op.id}
                        onClick={() => setConfigurando(prev => ({ ...prev, opcaoId: op.id, semItens: [] }))}
                        style={{
                          ...F, borderRadius: 14, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                          border: `2px solid ${sel ? C.primary : C.border}`,
                          background: sel ? C.primaryBg : C.bgCard,
                          transition: 'all 0.15s',
                        }}
                      >
                        <p style={{ fontWeight: 700, fontSize: 14, color: C.dark, margin: 0 }}>{op.nome}</p>
                        {op.acompanhamentos?.length > 0 && (
                          <p style={{ fontSize: 13, color: C.muted, margin: '3px 0 0' }}>
                            {op.acompanhamentos.map(strAcomp).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Acompanhamentos */}
            {opcaoAtual?.acompanhamentos?.length > 0 && (
              <div>
                <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.muted, marginBottom: 4 }}>Acompanhamentos</p>
                <p style={{ ...F, fontSize: 13, color: C.muted, marginBottom: 12 }}>Toque para remover o que não quiser</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {opcaoAtual.acompanhamentos.map((rawItem, idx) => {
                    const item = strAcomp(rawItem)
                    if (!item) return null
                    const removido = configurando.semItens.includes(item)
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleAcomp(item)}
                        style={{
                          ...F, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: removido ? '#FEE2E2' : C.primaryBg,
                          border: `1px solid ${removido ? '#FECACA' : C.primaryBorder}`,
                          color: removido ? C.red : C.mid,
                          textDecoration: removido ? 'line-through' : 'none',
                        }}
                      >
                        {removido && <X size={10} style={{ display: 'inline', marginRight: 4 }} />}
                        {item}
                      </button>
                    )
                  })}
                </div>
                {configurando.semItens.length > 0 && (
                  <p style={{ ...F, fontSize: 12, color: C.red, marginTop: 10 }}>
                    Sem: {configurando.semItens.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Proteína especial */}
            {opcaoAtual?.tipoCarnes === 'especial' && opcaoAtual?.pratoEspecial && (
              <div style={{ background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, borderRadius: 14, padding: 16 }}>
                <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.primary, marginBottom: 4 }}>Prato especial</p>
                <p style={{ ...F, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>{opcaoAtual.pratoEspecial}</p>
                <p style={{ ...F, fontSize: 12, color: C.muted, margin: 0 }}>Proteína já inclusa</p>
              </div>
            )}

            {/* Escolha de carne */}
            {tipoCarnes === 'globais' && carnesDisponiveis.length > 0 && (
              <div>
                <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: C.muted, marginBottom: 4 }}>
                  Escolha a carne <span style={{ color: C.red }}>*</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {carnesDisponiveis.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setConfigurando(prev => ({ ...prev, proteina: c }))}
                      style={{
                        ...F, padding: '9px 18px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: configurando.proteina === c ? C.primary : C.bgCard,
                        border: `2px solid ${configurando.proteina === c ? C.primary : C.border}`,
                        color: configurando.proteina === c ? '#FFFFFF' : C.mid,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {!configurando.proteina && (
                  <p style={{ ...F, fontSize: 12, color: C.red, marginTop: 8 }}>Selecione a carne para continuar</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, background: C.bgCard, position: 'sticky', bottom: 0 }}>
            <button
              onClick={onAdicionar}
              disabled={!podeAdicionar}
              style={{
                ...F, width: '100%', fontWeight: 800, padding: '16px', borderRadius: 14,
                border: 'none', fontSize: 16, cursor: podeAdicionar ? 'pointer' : 'not-allowed',
                color: '#FFFFFF', background: podeAdicionar ? C.primary : '#C8B5A8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
                opacity: podeAdicionar ? 1 : 0.6,
              }}
              onMouseOver={e => { if (podeAdicionar) e.currentTarget.style.background = C.primaryHover }}
              onMouseOut={e => { if (podeAdicionar) e.currentTarget.style.background = C.primary }}
            >
              <Plus size={20} />
              Adicionar ao carrinho — {fmtR$(preco)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Item do Carrinho ───────────────────────────────────────────────────────────
function CarrinhoItem({ item, onRemover, numero }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
      background: C.bgCard, borderRadius: 14, border: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: C.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#FFFFFF', fontWeight: 800, fontSize: 13, flexShrink: 0,
      }}>
        {numero}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...F, fontWeight: 700, fontSize: 14, color: C.dark, margin: 0, lineHeight: 1.3 }}>
          {item.opcao.nome}
          <span style={{ fontWeight: 500, color: C.mid }}> · {item.tamanho === 'P' ? 'Pequena' : 'Grande'}</span>
        </p>
        {item.proteina && (
          <p style={{ ...F, fontSize: 12, color: C.primary, fontWeight: 700, margin: '3px 0 0' }}>{item.proteina}</p>
        )}
        {item.nome && (
          <p style={{ ...F, fontSize: 12, color: C.muted, margin: '2px 0 0' }}>para: {item.nome}</p>
        )}
        {item.semItens.length > 0 && (
          <p style={{ ...F, fontSize: 12, color: C.red, margin: '2px 0 0', opacity: 0.85 }}>
            sem: {item.semItens.join(', ')}
          </p>
        )}
        <p style={{ ...F, fontSize: 14, fontWeight: 800, color: C.dark, margin: '6px 0 0' }}>{fmtR$(item.preco)}</p>
      </div>
      <button
        onClick={onRemover}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.muted, padding: 4, display: 'flex', alignItems: 'center',
          transition: 'color 0.15s', flexShrink: 0,
        }}
        onMouseOver={e => e.currentTarget.style.color = C.red}
        onMouseOut={e => e.currentTarget.style.color = C.muted}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────────
export default function PedidoOnline() {
  const navigate = useNavigate()
  const [cardapioHoje, setCardapioHoje] = useState(null)
  const [clientes, setClientes] = useState([])
  const [config, setConfig] = useState({ pixChave: '', pixNome: '', restauranteWhatsapp: '', lojaAberta: true })
  const [carrinho, setCarrinho] = useState([])
  const [configurando, setConfigurando] = useState(null)
  const [step, setStep] = useState('cardapio')
  const [form, setForm] = useState({ clienteNome: '', clienteTelefone: '', pagamento: 'Pix', troco: '', obs: '' })
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensalista, setMensalista] = useState(null)
  const [erros, setErros] = useState({})

  useEffect(() => {
    async function carregar() {
      try {
        const [{ data: ch }, { data: cl }, { data: cf }] = await Promise.all([
          supabase.from('cardapio_hoje').select('*').eq('id', 1).single(),
          supabase.from('clientes').select('id,nome,tipo,telefone'),
          supabase.from('configuracoes').select('*').eq('id', 1).single(),
        ])
        if (ch) setCardapioHoje(ch)
        if (cl) setClientes(cl)
        if (cf) setConfig(prev => ({ ...prev, ...cf }))
      } catch { /* sem Supabase */ }
      finally { setLoading(false) }
    }
    carregar()

    const canal = supabase
      .channel('online-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cardapio_hoje' }, payload => {
        if (payload.new) setCardapioHoje(payload.new)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracoes' }, payload => {
        if (payload.new) setConfig(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  useEffect(() => {
    if (!form.clienteNome.trim()) { setMensalista(null); return }
    const match = clientes.find(c =>
      c.nome.toLowerCase().trim() === form.clienteNome.toLowerCase().trim() && c.tipo === 'mensalista'
    )
    setMensalista(match || null)
  }, [form.clienteNome, clientes])

  const opcoes = cardapioHoje?.opcoes?.filter(o => o.disponivel) || []
  const total = carrinho.reduce((acc, m) => acc + m.preco, 0)

  function abrirModal(opcaoId = null) {
    setConfigurando({
      uid: uid(),
      opcaoId: opcaoId || (opcoes.length === 1 ? opcoes[0].id : null),
      semItens: [],
      nome: '',
      tamanho: 'P',
      proteina: '',
    })
  }

  function adicionarAoCarrinho() {
    if (!configurando?.opcaoId) return
    const opcao = cardapioHoje.opcoes.find(o => o.id === configurando.opcaoId)
    const tipoCarnes = opcao?.tipoCarnes || 'globais'
    const proteina = tipoCarnes === 'especial' ? (opcao?.pratoEspecial || '') : configurando.proteina
    const carnesDisponiveis = (cardapioHoje?.carnes || []).filter(c => c)
    if (tipoCarnes === 'globais' && carnesDisponiveis.length > 0 && !proteina) return
    const preco = configurando.tamanho === 'P' ? Number(cardapioHoje.precoP) : Number(cardapioHoje.precoG)
    setCarrinho(prev => [...prev, { ...configurando, opcao, preco, proteina }])
    setConfigurando(null)
  }

  function remover(id) {
    setCarrinho(prev => prev.filter(m => m.uid !== id))
  }

  function validarCheckout() {
    const e = {}
    if (!form.clienteNome.trim()) e.clienteNome = 'Informe seu nome'
    if (!form.clienteTelefone.trim() || form.clienteTelefone.replace(/\D/g, '').length < 10)
      e.clienteTelefone = 'Informe um telefone válido'
    setErros(e)
    return Object.keys(e).length === 0
  }

  async function confirmarPedido() {
    if (!validarCheckout() || enviando) return
    setEnviando(true)
    try {
      const id = Date.now()
      const itens = carrinho.map(m => ({
        tipo: 'marmitex',
        opcaoId: m.opcao.id,
        opcaoNome: m.opcao.nome,
        tamanho: m.tamanho,
        semItens: m.semItens,
        nome: m.nome,
        preco: m.preco,
      }))

      const pagamento = mensalista ? 'Mensalista' : form.pagamento
      const statusPagamento = mensalista ? 'mensalista' : 'pendente'

      const pedido = {
        id,
        clienteNome: form.clienteNome.trim(),
        clienteTelefone: form.clienteTelefone.replace(/\D/g, ''),
        itens,
        total,
        pagamento,
        status: 'aberto',
        statusPagamento,
        origem: 'online',
        observacoes: form.obs.trim(),
        criadoEm: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('pedidos').insert(pedido)
      if (insertError) throw insertError

      const hoje = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('pedidos')
        .select('*', { count: 'exact', head: true })
        .gte('criadoEm', hoje)

      setPedidoConfirmado({ ...pedido, numeroPedido: count || Math.floor(Math.random() * 90 + 10) })
      setStep('confirmado')
      setCarrinho([])
    } catch (err) {
      console.error('Erro ao confirmar pedido:', err)
      alert('Erro ao confirmar pedido: ' + (err?.message || 'verifique a conexão.'))
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <Spinner />

  if (step === 'confirmado' && pedidoConfirmado) {
    return (
      <TelaConfirmado
        pedido={pedidoConfirmado}
        config={config}
        onNovoPedido={() => {
          setPedidoConfirmado(null)
          setStep('cardapio')
          setForm({ clienteNome: '', clienteTelefone: '', pagamento: 'Pix', troco: '', obs: '' })
        }}
      />
    )
  }

  const lojaFechada = config.lojaAberta === false
  const carnesAtivas = cardapioHoje?.carnes?.filter(c => c) || []
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // ─── Input styles reutilizáveis ────────────────────────────────────────────
  const inputBase = {
    ...F, width: '100%', borderRadius: 12, padding: '13px 16px',
    border: `1.5px solid ${C.border}`, background: '#FDFBF9', color: C.dark,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
  const inputWithIcon = { ...inputBase, paddingLeft: 44 }

  // ─── Seção carnes ──────────────────────────────────────────────────────────
  const SecaoCarnes = carnesAtivas.length > 0 && (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Flame size={15} color={C.primary} />
        <span style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 800, color: C.primary }}>
          Carnes do dia
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {carnesAtivas.map((c, i) => (
          <span key={i} style={{
            ...F, padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700,
            background: C.primaryBg, border: `1px solid ${C.primaryBorder}`, color: C.dark,
          }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )

  // ─── Formulário de checkout ────────────────────────────────────────────────
  const FormularioCheckout = ({ isMobile }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Nome */}
      <div>
        <div style={{ position: 'relative' }}>
          <User size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text" data-nocase placeholder="Seu nome completo"
            value={form.clienteNome}
            onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
            style={{ ...inputWithIcon, borderColor: erros.clienteNome ? C.red : C.border, fontSize: isMobile ? 16 : 14 }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = erros.clienteNome ? C.red : C.border}
          />
        </div>
        {erros.clienteNome && <p style={{ ...F, fontSize: 12, color: C.red, marginTop: 6 }}>{erros.clienteNome}</p>}
        {mensalista && (
          <p style={{ ...F, fontSize: 12, color: C.green, marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} /> Cliente mensalista identificado
          </p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <div style={{ position: 'relative' }}>
          <Phone size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="tel" placeholder="(00) 00000-0000"
            value={form.clienteTelefone}
            onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
            style={{ ...inputWithIcon, borderColor: erros.clienteTelefone ? C.red : C.border, fontSize: isMobile ? 16 : 14 }}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e => e.target.style.borderColor = erros.clienteTelefone ? C.red : C.border}
          />
        </div>
        {erros.clienteTelefone && <p style={{ ...F, fontSize: 12, color: C.red, marginTop: 6 }}>{erros.clienteTelefone}</p>}
      </div>

      {/* Forma de pagamento */}
      {!mensalista && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['Pix', 'Dinheiro'].map(p => {
            const sel = form.pagamento === p
            return (
              <button
                key={p}
                onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                style={{
                  ...F, padding: '13px', borderRadius: 12, fontWeight: 700,
                  fontSize: isMobile ? 15 : 14, cursor: 'pointer', transition: 'all 0.15s',
                  border: `2px solid ${sel ? C.primary : C.border}`,
                  background: sel ? C.primaryBg : C.bgCard,
                  color: sel ? C.primary : C.mid,
                }}
              >
                {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
              </button>
            )
          })}
        </div>
      )}

      {/* Badge mensalista */}
      {mensalista && (
        <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ ...F, fontWeight: 800, color: C.green, margin: 0 }}>Conta mensalista</p>
          <p style={{ ...F, fontSize: 13, color: '#4ADE80', margin: '2px 0 0' }}>Cobrado no fechamento mensal</p>
        </div>
      )}

      {/* Observações */}
      <textarea
        data-nocase placeholder="Observações (opcional)"
        value={form.obs}
        onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
        rows={2}
        style={{
          ...inputBase, resize: 'none', padding: '12px 16px',
          fontSize: isMobile ? 16 : 14, lineHeight: 1.5,
        }}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Cards do menu ────────────────────────────────────────────────────────────
  const MenuCards = ({ isMobile }) => (
    opcoes.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <UtensilsCrossed size={48} color={C.muted} />
        <p style={{ ...F, color: C.muted, fontSize: 15 }}>Cardápio não disponível no momento</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {opcoes.map((op, idx) => (
          <div
            key={op.id}
            style={{
              background: C.bgCard, borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${C.border}`,
              boxShadow: '0 1px 8px rgba(26,14,6,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* Visual accent */}
              <div style={{
                width: isMobile ? 80 : 96, flexShrink: 0,
                background: `linear-gradient(160deg, #2D1200 0%, ${C.primary} 100%)`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 6,
              }}>
                <span style={{
                  ...FH, fontWeight: 700, fontSize: 26, color: 'rgba(255,255,255,0.15)',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: isMobile ? 20 : 24, lineHeight: 1 }}>🍱</span>
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, padding: isMobile ? '16px 14px' : '18px 20px' }}>
                <h3 style={{ ...FH, fontSize: isMobile ? 17 : 19, fontWeight: 700, color: C.dark, margin: '0 0 6px' }}>
                  {op.nome}
                </h3>
                {op.acompanhamentos?.length > 0 && (
                  <p style={{ ...F, fontSize: 13, color: C.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
                    {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Botões P/G */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Pequena', size: 'P', preco: cardapioHoje?.precoP },
                    { label: 'Grande', size: 'G', preco: cardapioHoje?.precoG },
                  ].map(({ label, size, preco: p }) => (
                    <button
                      key={size}
                      disabled={lojaFechada}
                      onClick={() => {
                        abrirModal(op.id)
                        setTimeout(() => setConfigurando(prev => prev ? { ...prev, tamanho: size, opcaoId: op.id } : null), 0)
                      }}
                      style={{
                        ...F, borderRadius: 10, padding: '9px 16px',
                        border: `1.5px solid ${C.primaryBorder}`,
                        background: C.primaryBg, cursor: lojaFechada ? 'not-allowed' : 'pointer',
                        opacity: lojaFechada ? 0.45 : 1, transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                      onMouseOver={e => {
                        if (!lojaFechada) {
                          e.currentTarget.style.background = C.primary
                          e.currentTarget.style.borderColor = C.primary
                          e.currentTarget.querySelector('.btn-label').style.color = '#FFF'
                          e.currentTarget.querySelector('.btn-price').style.color = 'rgba(255,255,255,0.85)'
                        }
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = C.primaryBg
                        e.currentTarget.style.borderColor = C.primaryBorder
                        e.currentTarget.querySelector('.btn-label').style.color = C.mid
                        e.currentTarget.querySelector('.btn-price').style.color = C.primary
                      }}
                    >
                      <Plus size={13} color={C.primary} />
                      <span className="btn-label" style={{ fontSize: 13, fontWeight: 700, color: C.mid, transition: 'color 0.15s' }}>{label}</span>
                      {p && <span className="btn-price" style={{ fontSize: 13, fontWeight: 800, color: C.primary, transition: 'color 0.15s' }}>{fmtR$(p)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  )

  // ── Desktop ────────────────────────────────────────────────────────────────
  const DesktopLayout = (
    <div style={{ ...F, minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(250,247,244,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo-vertical.png" alt="Logo" style={{ height: 38, width: 'auto', borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <span style={{ ...FH, fontSize: 18, fontWeight: 700, color: C.dark }}>Fogão a Lenha da Leninha</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lojaFechada ? (
              <span style={{
                ...F, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
                background: '#FEE2E2', color: C.red,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, display: 'inline-block' }} />
                Encerrado
              </span>
            ) : (
              <span style={{
                ...F, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
                background: C.greenBg, color: C.green,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                Aberto agora
              </span>
            )}
            <button
              onClick={() => navigate('/login')}
              title="Painel admin"
              style={{
                width: 36, height: 36, borderRadius: 9, border: 'none',
                background: C.borderLight, color: C.muted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.mid }}
              onMouseOut={e => { e.currentTarget.style.background = C.borderLight; e.currentTarget.style.color = C.muted }}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.heroBg} 0%, #2D1200 50%, #4A1E08 100%)`,
        padding: '48px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ ...F, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            {dataHoje}
          </p>
          <h1 style={{ ...FH, fontSize: 48, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px', lineHeight: 1.1 }}>
            Cardápio do dia
          </h1>
          <p style={{ ...F, color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: '0 0 24px' }}>
            Marmitas artesanais feitas com amor — pedido direto, sem complicação
          </p>
          {(cardapioHoje?.precoP || cardapioHoje?.precoG) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {cardapioHoje?.precoP && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: '10px 20px', backdropFilter: 'blur(8px)',
                }}>
                  <p style={{ ...F, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>Pequena</p>
                  <p style={{ ...FH, color: '#FFFFFF', fontSize: 22, fontWeight: 700, margin: 0 }}>{fmtR$(cardapioHoje.precoP)}</p>
                </div>
              )}
              {cardapioHoje?.precoG && (
                <div style={{
                  background: `rgba(232,66,10,0.25)`, border: `1px solid rgba(232,66,10,0.4)`,
                  borderRadius: 12, padding: '10px 20px', backdropFilter: 'blur(8px)',
                }}>
                  <p style={{ ...F, color: 'rgba(255,200,160,0.8)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>Grande</p>
                  <p style={{ ...FH, color: '#FFFFFF', fontSize: 22, fontWeight: 700, margin: 0 }}>{fmtR$(cardapioHoje.precoG)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 60px', display: 'grid', gap: 32, gridTemplateColumns: '1fr 380px', alignItems: 'start' }}>
        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {carnesAtivas.length > 0 && (
            <div style={{ background: C.bgCard, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}` }}>
              {SecaoCarnes}
            </div>
          )}

          <div>
            <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 800, color: C.muted, marginBottom: 16 }}>
              Escolha sua opção
            </p>
            <MenuCards isMobile={false} />
          </div>
        </div>

        {/* Coluna direita — Carrinho */}
        <div style={{
          background: C.bgCard, borderRadius: 20, overflow: 'hidden',
          border: `1px solid ${C.border}`,
          boxShadow: '0 4px 32px rgba(26,14,6,0.08)',
          position: 'sticky', top: 76,
        }}>
          {/* Header carrinho */}
          <div style={{
            background: C.heroBg, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ShoppingCart size={18} color="#FFFFFF" />
            <h2 style={{ ...F, fontWeight: 800, color: '#FFFFFF', margin: 0, flex: 1, fontSize: 15 }}>Seu pedido</h2>
            {carrinho.length > 0 && (
              <span style={{
                background: C.primary, color: '#FFF', borderRadius: 99,
                fontSize: 12, fontWeight: 800, padding: '2px 8px',
              }}>
                {carrinho.length}
              </span>
            )}
          </div>

          {carrinho.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <ShoppingCart size={40} color={C.muted} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
              <p style={{ ...F, fontWeight: 700, color: C.mid, margin: '0 0 4px' }}>Nenhuma marmitex ainda</p>
              <p style={{ ...F, fontSize: 13, color: C.muted, margin: 0 }}>Escolha uma opção ao lado</p>
            </div>
          ) : (
            <div style={{ padding: '16px 16px 0' }}>
              {/* Lista de itens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {carrinho.map((item, i) => (
                  <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
                ))}
              </div>

              <button
                onClick={() => abrirModal()}
                disabled={lojaFechada}
                style={{
                  ...F, width: '100%', marginTop: 10,
                  border: `1.5px dashed ${C.primaryBorder}`, borderRadius: 12,
                  padding: '11px', background: 'none', cursor: 'pointer',
                  color: C.muted, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s', opacity: lojaFechada ? 0.4 : 1,
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.primaryBg }}
                onMouseOut={e => { e.currentTarget.style.borderColor = C.primaryBorder; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none' }}
              >
                <Plus size={14} /> Adicionar outra marmitex
              </button>

              <div style={{ borderTop: `1px solid ${C.border}`, margin: '16px 0', display: 'flex', justifyContent: 'space-between', paddingTop: 16, fontWeight: 800, fontSize: 18 }}>
                <span style={{ color: C.dark }}>Total</span>
                <span style={{ color: C.primary }}>{fmtR$(total)}</span>
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FormularioCheckout isMobile={false} />
                <button
                  onClick={confirmarPedido}
                  disabled={enviando}
                  style={{
                    ...F, width: '100%', fontWeight: 800, padding: '15px',
                    borderRadius: 14, border: 'none', fontSize: 15,
                    color: '#FFFFFF', background: C.primary, cursor: enviando ? 'not-allowed' : 'pointer',
                    opacity: enviando ? 0.65 : 1, transition: 'background 0.15s',
                    marginTop: 4,
                  }}
                  onMouseOver={e => { if (!enviando) e.currentTarget.style.background = C.primaryHover }}
                  onMouseOut={e => { if (!enviando) e.currentTarget.style.background = C.primary }}
                >
                  {enviando ? 'Confirmando...' : 'Confirmar pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE
  // ─────────────────────────────────────────────────────────────────────────────

  const MobileHeader = ({ titulo, onBack, direita }) => (
    <div style={{
      ...F, display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: C.heroBg,
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <img src="/logo-vertical.png" alt="Logo" style={{ height: 38, width: 'auto', borderRadius: 8, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...FH, color: '#FFFFFF', fontWeight: 700, fontSize: 17, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {titulo}
        </p>
      </div>
      {direita}
    </div>
  )

  const MobileCardapio = (
    <div style={{ ...F, minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>
      <MobileHeader
        titulo="Fogão a Lenha da Leninha"
        direita={
          <button
            onClick={() => navigate('/login')}
            style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={16} />
          </button>
        }
      />

      {/* Hero mobile */}
      <div style={{
        background: `linear-gradient(160deg, #2D1200 0%, #4A1E08 100%)`,
        padding: '28px 20px 24px',
        textAlign: 'center',
      }}>
        <p style={{ ...F, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 8px' }}>
          {dataHoje}
        </p>
        <h1 style={{ ...FH, fontSize: 30, fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px', lineHeight: 1.15 }}>
          Cardápio de hoje
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {lojaFechada ? (
            <span style={{ ...F, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99, background: '#FEE2E2', color: C.red, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, display: 'inline-block' }} />
              Encerrado
            </span>
          ) : (
            <span style={{ ...F, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99, background: C.greenBg, color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
              Aberto agora
            </span>
          )}
        </div>
        {(cardapioHoje?.precoP || cardapioHoje?.precoG) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {cardapioHoje?.precoP && (
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px' }}>
                <p style={{ ...F, color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 1px' }}>Pequena</p>
                <p style={{ ...FH, color: '#FFF', fontSize: 18, fontWeight: 700, margin: 0 }}>{fmtR$(cardapioHoje.precoP)}</p>
              </div>
            )}
            {cardapioHoje?.precoG && (
              <div style={{ background: 'rgba(232,66,10,0.3)', borderRadius: 10, padding: '8px 16px' }}>
                <p style={{ ...F, color: 'rgba(255,200,160,0.8)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 1px' }}>Grande</p>
                <p style={{ ...FH, color: '#FFF', fontSize: 18, fontWeight: 700, margin: 0 }}>{fmtR$(cardapioHoje.precoG)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menu */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {carnesAtivas.length > 0 && (
          <div style={{ background: C.bgCard, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            {SecaoCarnes}
          </div>
        )}
        <div>
          <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 800, color: C.muted, marginBottom: 14, paddingLeft: 2 }}>
            Escolha sua opção
          </p>
          <MenuCards isMobile={true} />
        </div>
      </div>

      {/* Floating cart */}
      {carrinho.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px 16px',
          background: 'linear-gradient(to top, #FAF7F4 60%, transparent)',
        }}>
          <button
            onClick={() => setStep('carrinho')}
            style={{
              ...F, width: '100%', color: '#FFFFFF', fontWeight: 800, padding: '16px 20px',
              borderRadius: 16, border: 'none', cursor: 'pointer',
              background: C.primary, boxShadow: '0 8px 32px rgba(232,66,10,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15,
            }}
          >
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
              {carrinho.length}
            </span>
            <span>Ver carrinho</span>
            <span style={{ fontWeight: 900 }}>{fmtR$(total)} →</span>
          </button>
        </div>
      )}
    </div>
  )

  const MobileCarrinho = (
    <div style={{ ...F, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <MobileHeader
        titulo="Carrinho"
        onBack={() => setStep('cardapio')}
        direita={
          <span style={{ ...F, background: C.primary, color: '#FFF', borderRadius: 99, fontSize: 12, fontWeight: 800, padding: '3px 10px' }}>
            {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
          </span>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {carrinho.map((item, i) => (
          <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
        ))}
        <button
          onClick={() => setStep('cardapio')}
          style={{
            ...F, border: `1.5px dashed ${C.primaryBorder}`, borderRadius: 14, padding: '18px',
            background: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary }}
          onMouseOut={e => { e.currentTarget.style.borderColor = C.primaryBorder; e.currentTarget.style.color = C.muted }}
        >
          <Plus size={15} /> Adicionar outra marmitex
        </button>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, background: C.bgCard }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, marginBottom: 16, color: C.dark }}>
          <span>Total</span>
          <span style={{ color: C.primary }}>{fmtR$(total)}</span>
        </div>
        <button
          onClick={() => setStep('checkout')}
          style={{
            ...F, width: '100%', color: '#FFFFFF', fontWeight: 800, padding: '18px',
            borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16,
            background: C.primary, boxShadow: '0 6px 24px rgba(232,66,10,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = C.primaryHover}
          onMouseOut={e => e.currentTarget.style.background = C.primary}
        >
          Finalizar pedido <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const MobileCheckout = (
    <div style={{ ...F, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <MobileHeader titulo="Finalizar pedido" onBack={() => setStep('carrinho')} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Resumo */}
        <div style={{ background: C.bgCard, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.muted, margin: 0 }}>Resumo</p>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {carrinho.map(item => (
              <div key={item.uid} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                <span style={{ flex: 1, color: C.mid }}>
                  {item.opcao.nome}
                  <span style={{ color: C.muted }}> ({item.tamanho === 'P' ? 'Pequena' : 'Grande'})</span>
                  {item.nome && <span style={{ color: C.primary }}> · {item.nome}</span>}
                  {item.semItens?.length > 0 && (
                    <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>sem: {item.semItens.join(', ')}</span>
                  )}
                </span>
                <span style={{ fontWeight: 700, color: C.dark, whiteSpace: 'nowrap' }}>{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 }}>
            <span style={{ color: C.dark }}>Total</span>
            <span style={{ color: C.primary }}>{fmtR$(total)}</span>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ background: C.bgCard, borderRadius: 16, padding: '20px 16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ ...F, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.muted, margin: '0 0 4px' }}>Seus dados</p>
          <FormularioCheckout isMobile={true} />
        </div>
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, background: C.bgCard }}>
        <button
          onClick={confirmarPedido}
          disabled={enviando}
          style={{
            ...F, width: '100%', fontWeight: 800, padding: '18px',
            borderRadius: 16, border: 'none', fontSize: 16, cursor: enviando ? 'not-allowed' : 'pointer',
            color: '#FFFFFF', background: C.primary, opacity: enviando ? 0.65 : 1,
            boxShadow: '0 6px 24px rgba(232,66,10,0.3)',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => { if (!enviando) e.currentTarget.style.background = C.primaryHover }}
          onMouseOut={e => { if (!enviando) e.currentTarget.style.background = C.primary }}
        >
          {enviando ? 'Confirmando...' : `Confirmar pedido · ${fmtR$(total)}`}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {configurando && (
        <ModalMarmitex
          cardapioHoje={cardapioHoje}
          configurando={configurando}
          setConfigurando={setConfigurando}
          onAdicionar={adicionarAoCarrinho}
        />
      )}
      <div className="hidden md:block">{DesktopLayout}</div>
      <div className="md:hidden">
        {step === 'cardapio' && MobileCardapio}
        {step === 'carrinho' && MobileCarrinho}
        {step === 'checkout' && MobileCheckout}
      </div>
    </>
  )
}
