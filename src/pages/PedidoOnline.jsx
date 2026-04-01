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

// Garante que um item de acompanhamento seja sempre string
function strAcomp(a) {
  if (!a) return ''
  if (typeof a === 'string') return a
  return a.nome || a.name || a.label || a.value || ''
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF6EF' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '3px solid rgba(232,66,10,0.15)', borderTopColor: '#E8420A' }}
        />
        <p className="text-sm font-medium" style={{ color: '#7A5040' }}>Carregando cardápio...</p>
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center"
      style={{ background: '#FFF6EF' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Ícone check */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#16A34A', boxShadow: '0 8px 32px rgba(22,163,74,0.25)' }}
        >
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-black mb-1" style={{ color: '#1C0A02' }}>Pedido confirmado!</h1>
        <p className="text-sm mb-6" style={{ color: '#B09080' }}>Seu número de pedido</p>

        {/* Badge número */}
        <div
          className="text-white rounded-2xl px-10 py-6 mb-8"
          style={{
            background: '#E8420A',
            boxShadow: '0 8px 32px rgba(232,66,10,0.35)',
          }}
        >
          <span className="font-black" style={{ fontSize: '5rem', lineHeight: 1 }}>
            #{String(pedido.numeroPedido).padStart(2, '0')}
          </span>
        </div>

        {/* Resumo */}
        <div
          className="w-full mb-5 rounded-2xl overflow-hidden text-left"
          style={{ background: '#FFFFFF', border: '1px solid #F0E0D0', boxShadow: '0 2px 12px rgba(28,10,2,0.08)' }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #F0E0D0' }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#B09080' }}>Resumo do pedido</p>
          </div>
          <div className="p-5 space-y-2.5">
            {pedido.itens.map((item, i) => (
              <div key={i} className="flex justify-between text-sm gap-3">
                <span style={{ color: '#7A5040' }}>
                  {item.opcaoNome}
                  <span className="ml-1" style={{ color: '#B09080' }}>
                    ({item.tamanho === 'P' ? 'Pequena' : 'Grande'})
                  </span>
                  {item.nome ? (
                    <span className="ml-1" style={{ color: '#E8420A' }}>· {item.nome}</span>
                  ) : null}
                  {item.semItens?.length > 0 && (
                    <span className="block text-xs mt-0.5" style={{ color: '#B09080' }}>
                      sem: {item.semItens.join(', ')}
                    </span>
                  )}
                </span>
                <span className="font-semibold shrink-0" style={{ color: '#1C0A02' }}>{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div
            className="px-5 py-3 flex justify-between font-bold text-sm"
            style={{ borderTop: '1px solid #F0E0D0', color: '#1C0A02' }}
          >
            <span>Total</span>
            <span style={{ color: '#E8420A' }}>{fmtR$(pedido.total)}</span>
          </div>
          <div className="px-5 pb-4">
            <p className="text-xs" style={{ color: '#B09080' }}>Pagamento: {pedido.pagamento}</p>
          </div>
        </div>

        {/* Card Pix */}
        {isPix && config.pixChave && (
          <div
            className="w-full mb-5 rounded-2xl overflow-hidden text-left"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
          >
            <div className="px-5 py-3" style={{ borderBottom: '1px solid #BFDBFE' }}>
              <p className="text-sm font-semibold text-blue-600">Pagamento via Pix</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm" style={{ color: '#7A5040' }}>
                Faça o Pix e envie o comprovante pelo WhatsApp para confirmar seu pedido.
              </p>
              <div className="rounded-xl p-3" style={{ background: '#DBEAFE', border: '1px solid #BFDBFE' }}>
                <p className="text-xs mb-1 text-blue-500">Chave Pix</p>
                <p className="font-mono text-sm break-all text-blue-900">{config.pixChave}</p>
                {config.pixNome && <p className="text-xs mt-1 text-blue-700">{config.pixNome}</p>}
              </div>
              <button
                onClick={copiarPix}
                className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-white text-sm transition-all"
                style={{
                  background: copiado ? '#1d4ed8' : '#2563eb',
                  transition: 'all 0.15s',
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
                  className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-white text-sm"
                  style={{ background: '#16A34A', display: 'flex' }}
                >
                  Enviar comprovante no WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onNovoPedido}
          className="text-sm mt-2 underline underline-offset-4 transition-colors"
          style={{ color: '#B09080' }}
          onMouseOver={e => e.currentTarget.style.color = '#7A5040'}
          onMouseOut={e => e.currentTarget.style.color = '#B09080'}
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(28,10,2,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto"
        style={{
          background: '#FFFFFF',
          border: '1px solid #F0E0D0',
          boxShadow: '0 -8px 48px rgba(28,10,2,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #F0E0D0' }}
        >
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1C0A02' }}>Monte sua marmitex</h2>
            <p className="text-xs mt-0.5" style={{ color: '#B09080' }}>Personalize do seu jeito</p>
          </div>
          <button
            onClick={() => setConfigurando(null)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#FFF0E8', color: '#7A5040', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.background = '#F0E0D0' }}
            onMouseOut={e => { e.currentTarget.style.background = '#FFF0E8' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Nome */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs uppercase tracking-wide font-semibold mb-2.5"
              style={{ color: '#B09080' }}
            >
              <User size={13} />
              Nome nessa marmitex
              <span className="normal-case font-normal ml-1">(opcional)</span>
            </label>
            <input
              type="text"
              data-nocase
              placeholder="Ex: João, Maria, Filha..."
              value={configurando.nome}
              onChange={e => setConfigurando(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 focus:outline-none text-sm transition-all"
              style={{
                background: '#FFFBF8',
                border: '1px solid #E8D0C0',
                color: '#1C0A02',
                transition: 'all 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#E8420A'}
              onBlur={e => e.target.style.borderColor = '#E8D0C0'}
            />
          </div>

          {/* Tamanho */}
          <div>
            <p
              className="text-xs uppercase tracking-wide font-semibold mb-3"
              style={{ color: '#B09080' }}
            >
              Tamanho
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'P', label: 'Pequena', preco: cardapioHoje?.precoP },
                { value: 'G', label: 'Grande', preco: cardapioHoje?.precoG },
              ].map(({ value, label, preco: p }) => (
                <button
                  key={value}
                  onClick={() => setConfigurando(prev => ({ ...prev, tamanho: value }))}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    border: `2px solid ${configurando.tamanho === value ? '#E8420A' : '#E8D0C0'}`,
                    background: configurando.tamanho === value ? '#FFF0E8' : '#FFFFFF',
                    transition: 'all 0.15s',
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: '#1C0A02' }}>{label}</p>
                  {p ? (
                    <p className="text-sm font-bold mt-1" style={{ color: '#E8420A' }}>{fmtR$(p)}</p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Opção */}
          {opcoes.length > 1 && (
            <div>
              <p
                className="text-xs uppercase tracking-wide font-semibold mb-3"
                style={{ color: '#B09080' }}
              >
                Opção
              </p>
              <div className="space-y-2">
                {opcoes.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setConfigurando(prev => ({ ...prev, opcaoId: op.id, semItens: [] }))}
                    className="w-full rounded-2xl p-4 text-left transition-all"
                    style={{
                      border: `2px solid ${configurando.opcaoId === op.id ? '#E8420A' : '#E8D0C0'}`,
                      background: configurando.opcaoId === op.id ? '#FFF0E8' : '#FFFFFF',
                      transition: 'all 0.15s',
                    }}
                  >
                    <p className="font-semibold text-sm" style={{ color: '#1C0A02' }}>{op.nome}</p>
                    {op.acompanhamentos?.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: '#B09080' }}>
                        {op.acompanhamentos.map(strAcomp).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acompanhamentos */}
          {opcaoAtual?.acompanhamentos?.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-wide font-semibold mb-1"
                style={{ color: '#B09080' }}
              >
                Acompanhamentos
              </p>
              <p className="text-xs mb-3" style={{ color: '#B09080' }}>Toque para remover o que não quiser</p>
              <div className="flex flex-wrap gap-2">
                {opcaoAtual.acompanhamentos.map((rawItem, idx) => {
                  const item = strAcomp(rawItem)
                  if (!item) return null
                  const removido = configurando.semItens.includes(item)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleAcomp(item)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background: removido ? '#FEE2E2' : '#FFF0E8',
                        border: `1px solid ${removido ? '#FCA5A5' : '#F0C0A0'}`,
                        color: removido ? '#DC2626' : '#7A5040',
                        textDecoration: removido ? 'line-through' : 'none',
                        opacity: removido ? 0.8 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      {removido && <X size={10} className="inline mr-1" />}
                      {item}
                    </button>
                  )
                })}
              </div>
              {configurando.semItens.length > 0 && (
                <p className="text-xs mt-2.5" style={{ color: '#DC2626' }}>
                  Sem: {configurando.semItens.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Proteína especial */}
          {opcaoAtual?.tipoCarnes === 'especial' && opcaoAtual?.pratoEspecial && (
            <div
              className="rounded-2xl p-4"
              style={{ background: '#FFF0E8', border: '1px solid #F0C0A0' }}
            >
              <p
                className="text-xs uppercase tracking-wide font-bold mb-1"
                style={{ color: '#E8420A' }}
              >
                Prato especial
              </p>
              <p className="font-bold" style={{ color: '#1C0A02' }}>{opcaoAtual.pratoEspecial}</p>
              <p className="text-xs mt-1" style={{ color: '#B09080' }}>Proteína já inclusa</p>
            </div>
          )}

          {/* Escolha de carne */}
          {tipoCarnes === 'globais' && carnesDisponiveis.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-wide font-semibold mb-1"
                style={{ color: '#B09080' }}
              >
                Escolha a carne <span style={{ color: '#DC2626' }}>*</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {carnesDisponiveis.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setConfigurando(prev => ({ ...prev, proteina: c }))}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: configurando.proteina === c ? '#E8420A' : '#FFFFFF',
                      border: `2px solid ${configurando.proteina === c ? '#E8420A' : '#E8D0C0'}`,
                      color: configurando.proteina === c ? '#FFFFFF' : '#7A5040',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {!configurando.proteina && (
                <p className="text-xs mt-2" style={{ color: '#DC2626' }}>Selecione a carne para continuar</p>
              )}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div
          className="sticky bottom-0 p-5"
          style={{ background: '#FFFFFF', borderTop: '1px solid #F0E0D0' }}
        >
          <button
            onClick={onAdicionar}
            disabled={!podeAdicionar}
            className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: podeAdicionar ? '#E8420A' : '#D0B8A8',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => { if (podeAdicionar) e.currentTarget.style.background = '#D13A07' }}
            onMouseOut={e => { if (podeAdicionar) e.currentTarget.style.background = '#E8420A' }}
          >
            <Plus size={20} />
            Adicionar ao carrinho — {fmtR$(preco)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Item do Carrinho ───────────────────────────────────────────────────────────
function CarrinhoItem({ item, onRemover, numero }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0E0D0',
        boxShadow: '0 2px 12px rgba(28,10,2,0.08)',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
        style={{ background: '#E8420A' }}
      >
        {numero}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug" style={{ color: '#1C0A02' }}>
          {item.opcao.nome}
          <span className="font-normal ml-1" style={{ color: '#7A5040' }}>
            · {item.tamanho === 'P' ? 'Pequena' : 'Grande'}
          </span>
        </p>
        {item.proteina && (
          <p className="text-xs mt-0.5 font-semibold" style={{ color: '#E8420A' }}>{item.proteina}</p>
        )}
        {item.nome && (
          <p className="text-xs mt-0.5" style={{ color: '#B09080' }}>para: {item.nome}</p>
        )}
        {item.semItens.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: '#DC2626', opacity: 0.8 }}>
            sem: {item.semItens.join(', ')}
          </p>
        )}
        <p className="text-sm font-bold mt-1.5" style={{ color: '#1C0A02' }}>{fmtR$(item.preco)}</p>
      </div>
      <button
        onClick={onRemover}
        className="p-1.5 rounded-lg transition-colors shrink-0"
        style={{ color: '#B09080', transition: 'all 0.15s' }}
        onMouseOver={e => e.currentTarget.style.color = '#DC2626'}
        onMouseOut={e => e.currentTarget.style.color = '#B09080'}
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

  // ── Seção de carnes ──────────────────────────────────────────────────────────
  const carnesAtivas = cardapioHoje?.carnes?.filter(c => c) || []

  const SecaoCarnes = carnesAtivas.length > 0 && (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0E0D0',
        boxShadow: '0 2px 12px rgba(28,10,2,0.08)',
      }}
    >
      <div
        className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: '#FFF0E8', borderBottom: '1px solid #F0D0B8' }}
      >
        <Flame size={14} style={{ color: '#E8420A' }} />
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#E8420A' }}>Carnes do dia</p>
      </div>
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {carnesAtivas.map((c, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: '#FFF0E8',
              border: '1px solid #F0C0A0',
              color: '#1C0A02',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )

  // ── Data por extenso ─────────────────────────────────────────────────────────
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP — 2 colunas
  // ─────────────────────────────────────────────────────────────────────────────

  const ColunaCatalogo = (
    <div className="space-y-5">
      {/* Header do restaurante */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center gap-4"
        style={{ background: '#1C0A02' }}
      >
        <img
          src="/logo-vertical.png"
          alt="Fogão a Lenha da Leninha"
          className="h-12 w-auto rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-xl leading-tight text-white">Fogão a Lenha da Leninha</h1>
          <p className="text-sm mt-0.5" style={{ color: '#E8420A' }}>Marmitas artesanais com amor</p>
          <div className="mt-2">
            {lojaFechada ? (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Encerrado
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#DCFCE7', color: '#16A34A' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Aberto agora
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          title="Painel admin"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}
          onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <Settings size={17} />
        </button>
      </div>

      {/* Hero banner */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, #FFF0E8 0%, #FFE4D0 100%)',
          borderBottom: '2px solid #F0D0B8',
          border: '1px solid #F0D0B8',
        }}
      >
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 36, lineHeight: 1 }}>🍱</span>
          <div>
            <p className="font-black text-2xl" style={{ color: '#1C0A02' }}>Cardápio de hoje</p>
            <p className="text-sm mt-0.5" style={{ color: '#B09080' }}>{dataHoje}</p>
            {(cardapioHoje?.precoP || cardapioHoje?.precoG) && (
              <p className="text-sm font-semibold mt-1.5" style={{ color: '#7A5040' }}>
                {cardapioHoje?.precoP && <>Pequena {fmtR$(cardapioHoje.precoP)}</>}
                {cardapioHoje?.precoP && cardapioHoje?.precoG && (
                  <span style={{ color: '#B09080' }}> · </span>
                )}
                {cardapioHoje?.precoG && <>Grande {fmtR$(cardapioHoje.precoG)}</>}
              </p>
            )}
          </div>
        </div>
      </div>

      {SecaoCarnes}

      {/* Opções */}
      {opcoes.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto mb-4" style={{ color: '#D0B8A8' }} />
          <p style={{ color: '#B09080' }}>Cardápio não disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p
            className="text-xs uppercase tracking-widest font-semibold px-1"
            style={{ color: '#B09080' }}
          >
            Escolha sua opção
          </p>
          {opcoes.map((op, idx) => (
            <div
              key={op.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid #F0E0D0',
                boxShadow: '0 2px 12px rgba(28,10,2,0.08)',
              }}
            >
              <div className="p-6">
                {/* Linha 1: badge + nome */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center text-white font-black text-sm shrink-0 rounded-lg"
                    style={{ background: '#E8420A', height: 28, width: 28, fontSize: '0.75rem' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-bold text-xl" style={{ color: '#1C0A02' }}>{op.nome}</h3>
                </div>
                {/* Linha 2: acompanhamentos */}
                {op.acompanhamentos?.length > 0 && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: '#7A5040' }}>
                    {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                  </p>
                )}

                <div className="border-t mt-4 mb-4" style={{ borderColor: '#F0E0D0' }} />

                {/* Grid tamanhos */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Pequena', size: 'P', preco: cardapioHoje?.precoP },
                    { label: 'Grande', size: 'G', preco: cardapioHoje?.precoG },
                  ].map(({ label, size, preco: p }) => (
                    <button
                      key={size}
                      disabled={lojaFechada}
                      onClick={() => abrirModal(op.id)}
                      className="rounded-2xl p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: '#FFF8F5',
                        border: '1px solid #E8C0A8',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => {
                        if (!lojaFechada) {
                          e.currentTarget.style.borderColor = '#E8420A'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(232,66,10,0.12)'
                        }
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = '#E8C0A8'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#B09080' }}>
                        {label}
                      </p>
                      {p && (
                        <p className="font-bold text-lg mt-1" style={{ color: '#E8420A' }}>{fmtR$(p)}</p>
                      )}
                      <span
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#E8420A', color: '#FFFFFF' }}
                      >
                        <Plus size={12} /> Adicionar
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const ColunaCarrinho = (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0E0D0',
        boxShadow: '0 4px 24px rgba(28,10,2,0.10)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ background: '#1C0A02' }}
      >
        <ShoppingCart size={17} className="text-white" />
        <h2 className="font-bold text-white flex-1">Seu pedido</h2>
        {carrinho.length > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: '#E8420A' }}
          >
            {carrinho.length}
          </span>
        )}
      </div>

      {carrinho.length === 0 ? (
        <div className="py-12 text-center px-5">
          <ShoppingCart size={36} className="mx-auto mb-3" style={{ color: '#D0B8A8' }} />
          <p className="text-sm font-medium" style={{ color: '#7A5040' }}>Nenhuma marmitex ainda</p>
          <p className="text-xs mt-1" style={{ color: '#B09080' }}>Escolha uma opção ao lado</p>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {carrinho.map((item, i) => (
              <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
            ))}
          </div>

          <button
            onClick={() => abrirModal()}
            disabled={lojaFechada}
            className="w-full border-dashed border-2 rounded-xl py-3 text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            style={{
              borderColor: '#F0C0A0',
              color: '#B09080',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#E8420A'
              e.currentTarget.style.color = '#E8420A'
              e.currentTarget.style.background = '#FFF8F5'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = '#F0C0A0'
              e.currentTarget.style.color = '#B09080'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Plus size={14} /> Adicionar outra marmitex
          </button>

          {/* Total */}
          <div
            className="flex justify-between font-bold text-xl pt-3"
            style={{ borderTop: '1px solid #F0E0D0', color: '#1C0A02' }}
          >
            <span>Total</span>
            <span style={{ color: '#E8420A' }}>{fmtR$(total)}</span>
          </div>

          <div style={{ borderTop: '1px solid #F0E0D0', paddingTop: '1rem' }} />

          {/* Formulário inline */}
          <div className="space-y-3">
            {/* Nome */}
            <div>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#B09080' }}
                />
                <input
                  type="text"
                  data-nocase
                  placeholder="Seu nome"
                  value={form.clienteNome}
                  onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
                  className="w-full rounded-xl pl-9 pr-4 py-3 focus:outline-none text-sm transition-all"
                  style={{
                    background: '#FFFBF8',
                    border: `1px solid ${erros.clienteNome ? '#DC2626' : '#E8D0C0'}`,
                    color: '#1C0A02',
                    transition: 'all 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#E8420A'}
                  onBlur={e => e.target.style.borderColor = erros.clienteNome ? '#DC2626' : '#E8D0C0'}
                />
              </div>
              {erros.clienteNome && (
                <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{erros.clienteNome}</p>
              )}
              {mensalista && (
                <p className="text-xs mt-1 font-semibold" style={{ color: '#16A34A' }}>
                  <Check size={11} className="inline mr-1" />
                  Cliente mensalista identificado
                </p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#B09080' }}
                />
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={form.clienteTelefone}
                  onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
                  className="w-full rounded-xl pl-9 pr-4 py-3 focus:outline-none text-sm transition-all"
                  style={{
                    background: '#FFFBF8',
                    border: `1px solid ${erros.clienteTelefone ? '#DC2626' : '#E8D0C0'}`,
                    color: '#1C0A02',
                    transition: 'all 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#E8420A'}
                  onBlur={e => e.target.style.borderColor = erros.clienteTelefone ? '#DC2626' : '#E8D0C0'}
                />
              </div>
              {erros.clienteTelefone && (
                <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{erros.clienteTelefone}</p>
              )}
            </div>

            {/* Pagamento */}
            {!mensalista && (
              <div className="grid grid-cols-2 gap-2">
                {['Pix', 'Dinheiro'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                    className="py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      border: `2px solid ${form.pagamento === p ? '#E8420A' : '#E8D0C0'}`,
                      background: form.pagamento === p ? '#FFF0E8' : '#FFFFFF',
                      color: form.pagamento === p ? '#E8420A' : '#7A5040',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            )}

            {/* Badge mensalista */}
            {mensalista && (
              <div
                className="rounded-xl p-3"
                style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>Conta mensalista</p>
                <p className="text-xs mt-0.5" style={{ color: '#4ADE80' }}>Cobrado no fechamento mensal</p>
              </div>
            )}

            {/* Observações */}
            <textarea
              data-nocase
              placeholder="Observações (opcional)"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-4 py-3 focus:outline-none resize-none text-sm"
              style={{
                background: '#FFFBF8',
                border: '1px solid #E8D0C0',
                color: '#1C0A02',
                transition: 'all 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#E8420A'}
              onBlur={e => e.target.style.borderColor = '#E8D0C0'}
            />

            {/* Botão confirmar */}
            <button
              onClick={confirmarPedido}
              disabled={enviando}
              className="w-full font-bold py-4 rounded-2xl text-white text-sm transition-all disabled:opacity-60"
              style={{
                background: '#E8420A',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => { if (!enviando) e.currentTarget.style.background = '#D13A07' }}
              onMouseOut={e => { if (!enviando) e.currentTarget.style.background = '#E8420A' }}
            >
              {enviando ? 'Confirmando...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE — steps
  // ─────────────────────────────────────────────────────────────────────────────
  const MobileHeader = ({ titulo, onBack, direita }) => (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ background: '#1C0A02' }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <img src="/logo-vertical.png" alt="Logo" className="h-9 w-auto rounded-lg shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base leading-tight truncate">{titulo}</p>
      </div>
      {direita}
    </div>
  )

  const MobileCardapio = (
    <div className="min-h-screen pb-32" style={{ background: '#FFF6EF' }}>
      <MobileHeader
        titulo="Fogão a Lenha da Leninha"
        direita={
          <button
            onClick={() => navigate('/login')}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            <Settings size={16} />
          </button>
        }
      />

      {/* Hero banner */}
      <div
        className="px-5 py-6 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(135deg, #FFF0E8 0%, #FFE4D0 100%)',
          borderBottom: '2px solid #F0D0B8',
        }}
      >
        <span style={{ fontSize: 40, lineHeight: 1 }}>🍱</span>
        <p className="font-black text-xl mt-2 mb-1" style={{ color: '#1C0A02' }}>Cardápio de hoje</p>
        <p className="text-xs mb-2" style={{ color: '#B09080' }}>{dataHoje}</p>
        {lojaFechada ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-2"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Encerrado
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-2"
            style={{ background: '#DCFCE7', color: '#16A34A' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Aberto agora
          </span>
        )}
        {(cardapioHoje?.precoP || cardapioHoje?.precoG) && (
          <p className="text-sm font-semibold" style={{ color: '#7A5040' }}>
            {cardapioHoje?.precoP && <>Pequena {fmtR$(cardapioHoje.precoP)}</>}
            {cardapioHoje?.precoP && cardapioHoje?.precoG && (
              <span style={{ color: '#B09080' }}> · </span>
            )}
            {cardapioHoje?.precoG && <>Grande {fmtR$(cardapioHoje.precoG)}</>}
          </p>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {SecaoCarnes}

        {opcoes.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed size={52} className="mx-auto mb-4" style={{ color: '#D0B8A8' }} />
            <p style={{ color: '#B09080' }}>Cardápio não disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p
              className="text-xs uppercase tracking-widest font-semibold px-1"
              style={{ color: '#B09080' }}
            >
              Escolha sua opção
            </p>
            {opcoes.map((op, idx) => (
              <div
                key={op.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #F0E0D0',
                  boxShadow: '0 2px 12px rgba(28,10,2,0.08)',
                }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center text-white font-black shrink-0 rounded-lg"
                      style={{ background: '#E8420A', height: 28, width: 28, fontSize: '0.75rem' }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-bold text-xl" style={{ color: '#1C0A02' }}>{op.nome}</h3>
                  </div>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: '#7A5040' }}>
                      {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <div className="border-t mt-4 mb-4" style={{ borderColor: '#F0E0D0' }} />

                  <div className="grid grid-cols-2 gap-3">
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
                        className="rounded-2xl p-4 text-left active:opacity-70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: '#FFF8F5',
                          border: '1px solid #E8C0A8',
                          transition: 'all 0.15s',
                        }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#B09080' }}>
                          {label}
                        </p>
                        {p && (
                          <p className="font-bold text-lg mt-1" style={{ color: '#E8420A' }}>{fmtR$(p)}</p>
                        )}
                        <span
                          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: '#E8420A', color: '#FFFFFF' }}
                        >
                          <Plus size={12} /> Adicionar
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, #FFF6EF 65%, transparent)' }}>
          <button
            onClick={() => setStep('carrinho')}
            className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5"
            style={{
              background: '#E8420A',
              boxShadow: '0 8px 32px rgba(232,66,10,0.4)',
            }}
          >
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'rgba(0,0,0,0.15)', color: '#FFFFFF' }}
            >
              {carrinho.length}
            </span>
            <span className="text-base">Ver carrinho</span>
            <span className="font-bold text-base">{fmtR$(total)} →</span>
          </button>
        </div>
      )}
    </div>
  )

  const MobileCarrinho = (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF6EF' }}>
      <MobileHeader
        titulo="Carrinho"
        onBack={() => setStep('cardapio')}
        direita={
          <span
            className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: '#E8420A' }}
          >
            {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {carrinho.map((item, i) => (
          <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
        ))}
        <button
          onClick={() => setStep('cardapio')}
          className="w-full border-dashed border-2 rounded-2xl py-5 text-sm flex items-center justify-center gap-2 transition-all"
          style={{ borderColor: '#F0C0A0', color: '#B09080', transition: 'all 0.15s' }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = '#E8420A'
            e.currentTarget.style.color = '#E8420A'
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = '#F0C0A0'
            e.currentTarget.style.color = '#B09080'
          }}
        >
          <Plus size={15} /> Adicionar outra marmitex
        </button>
      </div>

      <div
        className="p-4"
        style={{ borderTop: '1px solid #F0E0D0', background: '#FFFFFF' }}
      >
        <div className="flex justify-between font-bold text-xl mb-4" style={{ color: '#1C0A02' }}>
          <span>Total</span>
          <span style={{ color: '#E8420A' }}>{fmtR$(total)}</span>
        </div>
        <button
          onClick={() => setStep('checkout')}
          className="w-full text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-base transition-all"
          style={{
            background: '#E8420A',
            boxShadow: '0 6px 24px rgba(232,66,10,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#D13A07'}
          onMouseOut={e => e.currentTarget.style.background = '#E8420A'}
        >
          Finalizar pedido <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const MobileCheckout = (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF6EF' }}>
      <MobileHeader titulo="Finalizar pedido" onBack={() => setStep('carrinho')} />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Resumo colapsado */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid #F0E0D0',
            boxShadow: '0 2px 12px rgba(28,10,2,0.08)',
          }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #F0E0D0' }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#B09080' }}>Resumo</p>
          </div>
          <div className="p-5 space-y-2.5">
            {carrinho.map(item => (
              <div key={item.uid} className="flex justify-between text-sm gap-2">
                <span className="flex-1" style={{ color: '#7A5040' }}>
                  {item.opcao.nome}
                  <span className="ml-1" style={{ color: '#B09080' }}>
                    ({item.tamanho === 'P' ? 'Pequena' : 'Grande'})
                  </span>
                  {item.nome && (
                    <span className="ml-1" style={{ color: '#E8420A' }}>· {item.nome}</span>
                  )}
                  {item.semItens?.length > 0 && (
                    <span className="block text-xs mt-0.5" style={{ color: '#DC2626', opacity: 0.8 }}>
                      sem: {item.semItens.join(', ')}
                    </span>
                  )}
                </span>
                <span className="font-semibold shrink-0" style={{ color: '#1C0A02' }}>{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div
            className="px-5 py-3 flex justify-between font-bold text-base"
            style={{ borderTop: '1px solid #F0E0D0', color: '#1C0A02' }}
          >
            <span>Total</span>
            <span style={{ color: '#E8420A' }}>{fmtR$(total)}</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <div className="relative">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#B09080' }}
              />
              <input
                type="text"
                data-nocase
                placeholder="Seu nome"
                value={form.clienteNome}
                onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
                className="w-full rounded-xl pl-11 pr-4 py-4 focus:outline-none text-base transition-all"
                style={{
                  background: '#FFFBF8',
                  border: `1px solid ${erros.clienteNome ? '#DC2626' : '#E8D0C0'}`,
                  color: '#1C0A02',
                  transition: 'all 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#E8420A'}
                onBlur={e => e.target.style.borderColor = erros.clienteNome ? '#DC2626' : '#E8D0C0'}
              />
            </div>
            {erros.clienteNome && (
              <p className="text-sm mt-1.5" style={{ color: '#DC2626' }}>{erros.clienteNome}</p>
            )}
            {mensalista && (
              <p className="text-sm mt-1.5 font-medium" style={{ color: '#16A34A' }}>
                <Check size={13} className="inline mr-1" />
                Cliente mensalista identificado
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#B09080' }}
              />
              <input
                type="tel"
                placeholder="(00) 00000-0000"
                value={form.clienteTelefone}
                onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
                className="w-full rounded-xl pl-11 pr-4 py-4 focus:outline-none text-base transition-all"
                style={{
                  background: '#FFFBF8',
                  border: `1px solid ${erros.clienteTelefone ? '#DC2626' : '#E8D0C0'}`,
                  color: '#1C0A02',
                  transition: 'all 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#E8420A'}
                onBlur={e => e.target.style.borderColor = erros.clienteTelefone ? '#DC2626' : '#E8D0C0'}
              />
            </div>
            {erros.clienteTelefone && (
              <p className="text-sm mt-1.5" style={{ color: '#DC2626' }}>{erros.clienteTelefone}</p>
            )}
          </div>

          {/* Pagamento */}
          {!mensalista && (
            <div className="grid grid-cols-2 gap-3">
              {['Pix', 'Dinheiro'].map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                  className="py-4 rounded-2xl text-base font-semibold transition-all"
                  style={{
                    border: `2px solid ${form.pagamento === p ? '#E8420A' : '#E8D0C0'}`,
                    background: form.pagamento === p ? '#FFF0E8' : '#FFFFFF',
                    color: form.pagamento === p ? '#E8420A' : '#7A5040',
                    transition: 'all 0.15s',
                  }}
                >
                  {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                </button>
              ))}
            </div>
          )}

          {/* Badge mensalista */}
          {mensalista && (
            <div
              className="rounded-2xl p-4"
              style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}
            >
              <p className="font-bold" style={{ color: '#16A34A' }}>Conta mensalista</p>
              <p className="text-sm mt-1" style={{ color: '#4ADE80' }}>O valor será cobrado no fechamento mensal</p>
            </div>
          )}

          {/* Observações */}
          <div>
            <textarea
              data-nocase
              placeholder="Observações (opcional)"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-4 py-4 focus:outline-none resize-none text-base"
              style={{
                background: '#FFFBF8',
                border: '1px solid #E8D0C0',
                color: '#1C0A02',
                transition: 'all 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#E8420A'}
              onBlur={e => e.target.style.borderColor = '#E8D0C0'}
            />
          </div>
        </div>
      </div>

      {/* Footer sticky */}
      <div
        className="p-4"
        style={{ borderTop: '1px solid #F0E0D0', background: '#FFFFFF' }}
      >
        <button
          onClick={confirmarPedido}
          disabled={enviando}
          className="w-full font-bold py-5 rounded-2xl text-base text-white transition-all disabled:opacity-60"
          style={{
            background: '#E8420A',
            boxShadow: '0 6px 24px rgba(232,66,10,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { if (!enviando) e.currentTarget.style.background = '#D13A07' }}
          onMouseOut={e => { if (!enviando) e.currentTarget.style.background = '#E8420A' }}
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

      {/* Desktop */}
      <div className="hidden md:block min-h-screen" style={{ background: '#FFF6EF' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 grid gap-8" style={{ gridTemplateColumns: '1fr 380px' }}>
          {ColunaCatalogo}
          {ColunaCarrinho}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {step === 'cardapio' && MobileCardapio}
        {step === 'carrinho' && MobileCarrinho}
        {step === 'checkout' && MobileCheckout}
      </div>
    </>
  )
}
