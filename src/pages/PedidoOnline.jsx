import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, Plus, Trash2, ChevronLeft,
  Copy, Check, X, ChevronRight, UtensilsCrossed, User, Settings, Flame,
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0600' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#F97316' }} />
        <p className="text-sm font-medium" style={{ color: '#6B5040' }}>Carregando cardápio...</p>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 text-center" style={{ background: '#0D0600' }}>
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(120,40,0,0.35) 0%, transparent 100%)' }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
        >
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-black text-white mb-1">Pedido confirmado!</h1>
        <p className="text-sm mb-6" style={{ color: '#C4A882' }}>Seu número de pedido</p>

        <div
          className="text-white text-5xl font-black rounded-2xl px-10 py-5 mb-8"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 8px 32px rgba(249,115,22,0.35)' }}
        >
          #{String(pedido.numeroPedido).padStart(2, '0')}
        </div>

        <div
          className="w-full mb-5 rounded-2xl overflow-hidden text-left"
          style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#6B5040' }}>Resumo do pedido</p>
          </div>
          <div className="p-5 space-y-2.5">
            {pedido.itens.map((item, i) => (
              <div key={i} className="flex justify-between text-sm gap-3">
                <span style={{ color: '#C4A882' }}>
                  {item.opcaoNome}
                  <span className="ml-1" style={{ color: '#6B5040' }}>({item.tamanho === 'P' ? 'Pequena' : 'Grande'})</span>
                  {item.nome ? <span className="ml-1" style={{ color: '#F97316' }}>· {item.nome}</span> : null}
                  {item.semItens?.length > 0 && (
                    <span className="block text-xs mt-0.5" style={{ color: '#6B5040' }}>sem: {item.semItens.join(', ')}</span>
                  )}
                </span>
                <span className="font-semibold text-white shrink-0">{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 flex justify-between font-bold text-white text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span>Total</span>
            <span style={{ color: '#F97316' }}>{fmtR$(pedido.total)}</span>
          </div>
          <div className="px-5 pb-4">
            <p className="text-xs" style={{ color: '#6B5040' }}>Pagamento: {pedido.pagamento}</p>
          </div>
        </div>

        {isPix && config.pixChave && (
          <div
            className="w-full mb-5 rounded-2xl overflow-hidden text-left"
            style={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
              <p className="text-sm font-semibold text-blue-400">Pagamento via Pix</p>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm" style={{ color: '#C4A882' }}>
                Faça o Pix e envie o comprovante pelo WhatsApp para confirmar seu pedido.
              </p>
              <div className="rounded-xl p-3" style={{ background: '#0D0600', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs mb-1" style={{ color: '#6B5040' }}>Chave Pix</p>
                <p className="text-white font-mono text-sm break-all">{config.pixChave}</p>
                {config.pixNome && <p className="text-xs mt-1" style={{ color: '#C4A882' }}>{config.pixNome}</p>}
              </div>
              <button
                onClick={copiarPix}
                className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-white text-sm transition-colors"
                style={{ background: copiado ? '#1d4ed8' : '#2563eb' }}
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
                  style={{ background: '#16a34a', display: 'flex' }}
                >
                  Enviar comprovante no WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onNovoPedido}
          className="text-sm mt-2 transition-colors underline underline-offset-4"
          style={{ color: '#6B5040' }}
          onMouseOver={e => e.currentTarget.style.color = '#C4A882'}
          onMouseOut={e => e.currentTarget.style.color = '#6B5040'}
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
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto"
        style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -8px 48px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#1C0E06', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">Monte sua marmitex</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B5040' }}>Personalize do seu jeito</p>
          </div>
          <button
            onClick={() => setConfigurando(null)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#C4A882' }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e => e.currentTarget.style.color = '#C4A882'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-7">
          {/* Nome */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2.5" style={{ color: '#C4A882' }}>
              <User size={13} />
              Nome nessa marmitex
              <span className="text-xs font-normal" style={{ color: '#6B5040' }}>(opcional)</span>
            </label>
            <input
              type="text"
              data-nocase
              placeholder="Ex: João, Maria, Filha..."
              value={configurando.nome}
              onChange={e => setConfigurando(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-700 focus:outline-none text-sm transition-colors"
              style={{ background: '#0D0600', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => e.target.style.borderColor = '#F97316'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Tamanho */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: '#C4A882' }}>Tamanho</p>
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
                    border: `2px solid ${configurando.tamanho === value ? '#F97316' : 'rgba(255,255,255,0.08)'}`,
                    background: configurando.tamanho === value ? 'rgba(249,115,22,0.12)' : '#0D0600',
                  }}
                >
                  <p className="text-white font-bold text-sm">{label}</p>
                  {p ? <p className="text-sm font-bold mt-1" style={{ color: '#F97316' }}>{fmtR$(p)}</p> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Opção */}
          {opcoes.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#C4A882' }}>Opção</p>
              <div className="space-y-2">
                {opcoes.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setConfigurando(prev => ({ ...prev, opcaoId: op.id, semItens: [] }))}
                    className="w-full rounded-2xl p-4 text-left transition-all"
                    style={{
                      border: `2px solid ${configurando.opcaoId === op.id ? '#F97316' : 'rgba(255,255,255,0.08)'}`,
                      background: configurando.opcaoId === op.id ? 'rgba(249,115,22,0.12)' : '#0D0600',
                    }}
                  >
                    <p className="text-white font-semibold text-sm">{op.nome}</p>
                    {op.acompanhamentos?.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: '#6B5040' }}>
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
              <p className="text-sm font-medium mb-1" style={{ color: '#C4A882' }}>Acompanhamentos</p>
              <p className="text-xs mb-3" style={{ color: '#6B5040' }}>Toque para remover o que não quiser</p>
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
                        background: removido ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${removido ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: removido ? '#f87171' : '#C4A882',
                        textDecoration: removido ? 'line-through' : 'none',
                        opacity: removido ? 0.65 : 1,
                      }}
                    >
                      {removido && <X size={10} className="inline mr-1" />}
                      {item}
                    </button>
                  )
                })}
              </div>
              {configurando.semItens.length > 0 && (
                <p className="text-xs mt-2.5" style={{ color: '#f87171' }}>
                  Sem: {configurando.semItens.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Proteína especial */}
          {opcaoAtual?.tipoCarnes === 'especial' && opcaoAtual?.pratoEspecial && (
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: '#F97316' }}>Prato especial</p>
              <p className="text-white font-bold">{opcaoAtual.pratoEspecial}</p>
              <p className="text-xs mt-1" style={{ color: '#6B5040' }}>Proteína já inclusa</p>
            </div>
          )}

          {/* Escolha de carne */}
          {tipoCarnes === 'globais' && carnesDisponiveis.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: '#C4A882' }}>
                Escolha a carne <span className="text-red-400">*</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {carnesDisponiveis.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setConfigurando(prev => ({ ...prev, proteina: c }))}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: configurando.proteina === c ? '#F97316' : '#0D0600',
                      border: `2px solid ${configurando.proteina === c ? '#F97316' : 'rgba(255,255,255,0.12)'}`,
                      color: configurando.proteina === c ? '#fff' : '#C4A882',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {!configurando.proteina && (
                <p className="text-xs mt-2" style={{ color: '#f87171' }}>Selecione a carne para continuar</p>
              )}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div
          className="sticky bottom-0 p-5"
          style={{ background: '#1C0E06', borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={onAdicionar}
            disabled={!podeAdicionar}
            className="w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: podeAdicionar ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#251508',
              boxShadow: podeAdicionar ? '0 4px 24px rgba(249,115,22,0.3)' : 'none',
            }}
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
      style={{ background: '#251508', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
      >
        {numero}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-snug">
          {item.opcao.nome}
          <span className="font-normal ml-1" style={{ color: '#6B5040' }}>
            · {item.tamanho === 'P' ? 'Pequena' : 'Grande'}
          </span>
        </p>
        {item.proteina && (
          <p className="text-xs mt-0.5 font-semibold" style={{ color: '#F97316' }}>{item.proteina}</p>
        )}
        {item.nome && (
          <p className="text-xs mt-0.5" style={{ color: '#C4A882' }}>para: {item.nome}</p>
        )}
        {item.semItens.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>sem: {item.semItens.join(', ')}</p>
        )}
        <p className="text-sm font-bold mt-1.5" style={{ color: '#F97316' }}>{fmtR$(item.preco)}</p>
      </div>
      <button
        onClick={onRemover}
        className="p-1.5 rounded-lg transition-colors shrink-0"
        style={{ color: '#6B5040' }}
        onMouseOver={e => e.currentTarget.style.color = '#f87171'}
        onMouseOut={e => e.currentTarget.style.color = '#6B5040'}
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
      style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)' }}
    >
      <div
        className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(249,115,22,0.1)', borderBottom: '1px solid rgba(249,115,22,0.15)' }}
      >
        <Flame size={14} style={{ color: '#F97316' }} />
        <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#F97316' }}>Carnes do dia</p>
      </div>
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {carnesAtivas.map((c, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)', color: '#F97316' }}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP — 2 colunas
  // ─────────────────────────────────────────────────────────────────────────────
  const ColunaCatalogo = (
    <div className="space-y-6">
      {/* Hero compacto desktop */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ background: 'linear-gradient(160deg, #2D1200 0%, #0D0600 70%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-4">
          <img src="/logo-vertical.png" alt="Fogão a Lenha da Leninha" className="h-14 w-auto rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#F97316' }}>Cardápio de hoje</p>
            <h1 className="text-white font-black text-xl leading-tight">Fogão a Lenha da Leninha</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {lojaFechada ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Encerrado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Aberto agora
                </span>
              )}
              {cardapioHoje?.precoP && (
                <span className="text-sm font-medium" style={{ color: '#C4A882' }}>
                  Pequena {fmtR$(cardapioHoje.precoP)}
                  {cardapioHoje?.precoG && <span> · Grande {fmtR$(cardapioHoje.precoG)}</span>}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            title="Painel admin"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#6B5040' }}
            onMouseOver={e => e.currentTarget.style.color = '#C4A882'}
            onMouseOut={e => e.currentTarget.style.color = '#6B5040'}
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {SecaoCarnes}

      {/* Opções */}
      {opcoes.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto mb-4" style={{ color: '#6B5040' }} />
          <p style={{ color: '#6B5040' }}>Cardápio não disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest font-semibold px-1" style={{ color: '#6B5040' }}>Escolha sua opção</p>
          {opcoes.map((op, idx) => (
            <div
              key={op.id}
              className="rounded-2xl overflow-hidden transition-colors"
              style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="p-5 flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg leading-tight">{op.nome}</h3>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#6B5040' }}>
                      {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { label: 'Pequena', size: 'P', preco: cardapioHoje?.precoP },
                  { label: 'Grande', size: 'G', preco: cardapioHoje?.precoG },
                ].map(({ label, size, preco: p }, i) => (
                  <button
                    key={size}
                    disabled={lojaFechada}
                    onClick={() => abrirModal(op.id)}
                    className="py-4 flex flex-col items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      background: 'transparent',
                    }}
                    onMouseOver={e => { if (!lojaFechada) e.currentTarget.style.background = 'rgba(249,115,22,0.06)' }}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="text-sm font-semibold" style={{ color: '#C4A882' }}>{label}</span>
                    {p && <span className="font-bold text-base" style={{ color: '#F97316' }}>{fmtR$(p)}</span>}
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center mt-1"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                    >
                      <Plus size={16} className="text-white" />
                    </span>
                  </button>
                ))}
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
      style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <ShoppingCart size={17} style={{ color: '#F97316' }} />
        <h2 className="text-white font-bold">Seu pedido</h2>
        {carrinho.length > 0 && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: '#F97316' }}
          >
            {carrinho.length}
          </span>
        )}
      </div>

      {carrinho.length === 0 ? (
        <div className="py-12 text-center px-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <ShoppingCart size={28} style={{ color: '#6B5040' }} />
          </div>
          <p className="text-sm" style={{ color: '#6B5040' }}>Nenhuma marmitex adicionada</p>
          <p className="text-xs mt-1" style={{ color: '#4a3020' }}>Escolha uma opção ao lado</p>
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
            className="w-full border-dashed border-2 rounded-xl py-3 text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            style={{ borderColor: 'rgba(249,115,22,0.25)', color: '#6B5040' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'; e.currentTarget.style.color = '#6B5040' }}
          >
            <Plus size={14} /> Adicionar outra marmitex
          </button>

          {/* Total */}
          <div
            className="flex justify-between font-bold text-white text-lg pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span>Total</span>
            <span style={{ color: '#F97316' }}>{fmtR$(total)}</span>
          </div>

          {/* Dados do cliente */}
          <div className="space-y-3">
            <div>
              <input
                type="text"
                data-nocase
                placeholder="Seu nome *"
                value={form.clienteNome}
                onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-700 focus:outline-none text-sm transition-colors"
                style={{
                  background: '#0D0600',
                  border: `1px solid ${erros.clienteNome ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                }}
              />
              {erros.clienteNome && <p className="text-red-400 text-xs mt-1">{erros.clienteNome}</p>}
              {mensalista && <p className="text-xs mt-1" style={{ color: '#22C55E' }}>✓ Cliente mensalista identificado</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Seu telefone *"
                value={form.clienteTelefone}
                onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-700 focus:outline-none text-sm transition-colors"
                style={{
                  background: '#0D0600',
                  border: `1px solid ${erros.clienteTelefone ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                }}
              />
              {erros.clienteTelefone && <p className="text-red-400 text-xs mt-1">{erros.clienteTelefone}</p>}
            </div>

            {!mensalista && (
              <div className="grid grid-cols-2 gap-2">
                {['Pix', 'Dinheiro'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                    className="py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      border: `2px solid ${form.pagamento === p ? '#F97316' : 'rgba(255,255,255,0.08)'}`,
                      background: form.pagamento === p ? 'rgba(249,115,22,0.12)' : '#0D0600',
                      color: form.pagamento === p ? '#F97316' : '#6B5040',
                    }}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            )}

            {mensalista && (
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>Conta mensalista</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(34,197,94,0.6)' }}>Cobrado no fechamento mensal</p>
              </div>
            )}

            <textarea
              data-nocase
              placeholder="Observações (opcional)"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-700 focus:outline-none resize-none text-sm"
              style={{ background: '#0D0600', border: '1px solid rgba(255,255,255,0.08)' }}
            />

            <button
              onClick={confirmarPedido}
              disabled={enviando}
              className="w-full font-bold py-4 rounded-2xl text-white text-sm transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}
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
      style={{ background: '#1C0E06', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#C4A882' }}
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <img src="/logo-vertical.png" alt="Logo" className="h-10 w-auto rounded-lg shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base leading-tight truncate">{titulo}</p>
        {!onBack && <p className="text-xs" style={{ color: '#F97316' }}>Monte seu pedido</p>}
      </div>
      {direita}
    </div>
  )

  const MobileCardapio = (
    <div className="min-h-screen pb-32" style={{ background: '#0D0600' }}>
      <MobileHeader
        titulo="Fogão a Lenha da Leninha"
        direita={
          <button
            onClick={() => navigate('/login')}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#6B5040' }}
          >
            <Settings size={16} />
          </button>
        }
      />

      {/* Hero banner */}
      <div
        className="px-4 py-6 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(160deg, #2D1200 0%, #0D0600 60%)' }}
      >
        <span style={{ fontSize: 40, lineHeight: 1 }}>🍖</span>
        <p className="text-xs uppercase tracking-widest font-bold mt-2 mb-1.5" style={{ color: '#F97316' }}>Cardápio de hoje</p>
        {lojaFechada ? (
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-2"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Encerrado
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-2"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Aberto agora
          </span>
        )}
        {(cardapioHoje?.precoP || cardapioHoje?.precoG) && (
          <p className="text-sm font-medium" style={{ color: '#C4A882' }}>
            {cardapioHoje?.precoP && <>Pequena {fmtR$(cardapioHoje.precoP)}</>}
            {cardapioHoje?.precoP && cardapioHoje?.precoG && ' · '}
            {cardapioHoje?.precoG && <>Grande {fmtR$(cardapioHoje.precoG)}</>}
          </p>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {SecaoCarnes}

        {opcoes.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed size={52} className="mx-auto mb-4" style={{ color: '#6B5040' }} />
            <p style={{ color: '#6B5040' }}>Cardápio não disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-semibold px-1" style={{ color: '#6B5040' }}>Escolha sua opção</p>
            {opcoes.map((op, idx) => (
              <div
                key={op.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="px-5 pt-5 pb-4 flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-xl leading-tight">{op.nome}</h3>
                    {op.acompanhamentos?.length > 0 && (
                      <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#6B5040' }}>
                        {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { label: 'Pequena', size: 'P', preco: cardapioHoje?.precoP },
                    { label: 'Grande', size: 'G', preco: cardapioHoje?.precoG },
                  ].map(({ label, size, preco: p }, i) => (
                    <button
                      key={size}
                      disabled={lojaFechada}
                      onClick={() => {
                        abrirModal(op.id)
                        setTimeout(() => setConfigurando(prev => prev ? { ...prev, tamanho: size, opcaoId: op.id } : null), 0)
                      }}
                      className="py-5 flex flex-col items-center gap-1 active:opacity-70 transition-opacity disabled:opacity-40"
                      style={{ borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
                    >
                      <span className="font-semibold text-base" style={{ color: '#C4A882' }}>{label}</span>
                      {p && <span className="font-bold text-lg" style={{ color: '#F97316' }}>{fmtR$(p)}</span>}
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center mt-1"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                      >
                        <Plus size={18} className="text-white" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {carrinho.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4"
          style={{ background: 'linear-gradient(to top, #0D0600 65%, transparent)' }}
        >
          <button
            onClick={() => setStep('carrinho')}
            className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 8px 32px rgba(249,115,22,0.4)' }}
          >
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: 'rgba(0,0,0,0.22)' }}
            >
              {carrinho.length}
            </span>
            <span className="text-base">Ver carrinho</span>
            <span className="font-bold text-base">{fmtR$(total)}</span>
          </button>
        </div>
      )}
    </div>
  )

  const MobileCarrinho = (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0600' }}>
      <MobileHeader
        titulo="Carrinho"
        onBack={() => setStep('cardapio')}
        direita={
          <span
            className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: '#F97316' }}
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
          className="w-full border-dashed border-2 rounded-2xl py-5 text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ borderColor: 'rgba(249,115,22,0.2)', color: '#6B5040' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; e.currentTarget.style.color = '#6B5040' }}
        >
          <Plus size={15} /> Adicionar outra marmitex
        </button>
      </div>

      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex justify-between text-white font-bold text-xl mb-4">
          <span>Total</span>
          <span style={{ color: '#F97316' }}>{fmtR$(total)}</span>
        </div>
        <button
          onClick={() => setStep('checkout')}
          className="w-full text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-base transition-all"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 6px 24px rgba(249,115,22,0.3)' }}
        >
          Ir para pagamento <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const MobileCheckout = (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0600' }}>
      <MobileHeader titulo="Finalizar pedido" onBack={() => setStep('carrinho')} />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Resumo */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#6B5040' }}>Resumo</p>
          </div>
          <div className="p-5 space-y-2.5">
            {carrinho.map(item => (
              <div key={item.uid} className="flex justify-between text-sm gap-2">
                <span className="flex-1" style={{ color: '#C4A882' }}>
                  {item.opcao.nome}
                  <span className="ml-1" style={{ color: '#6B5040' }}>({item.tamanho === 'P' ? 'Pequena' : 'Grande'})</span>
                  {item.nome && <span className="ml-1" style={{ color: '#F97316' }}>· {item.nome}</span>}
                  {item.semItens?.length > 0 && (
                    <span className="block text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>sem: {item.semItens.join(', ')}</span>
                  )}
                </span>
                <span className="font-semibold text-white shrink-0">{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div
            className="px-5 py-3 flex justify-between font-bold text-white text-base"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span>Total</span>
            <span style={{ color: '#F97316' }}>{fmtR$(total)}</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#6B5040' }}>Seus dados</p>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#C4A882' }}>Nome *</label>
            <input
              type="text"
              data-nocase
              placeholder="Nome completo"
              value={form.clienteNome}
              onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-700 focus:outline-none text-base transition-colors"
              style={{ background: '#1C0E06', border: `1px solid ${erros.clienteNome ? '#ef4444' : 'rgba(255,255,255,0.08)'}` }}
            />
            {erros.clienteNome && <p className="text-red-400 text-sm mt-1.5">{erros.clienteNome}</p>}
            {mensalista && <p className="text-sm mt-1.5 font-medium" style={{ color: '#22C55E' }}>✓ Cliente mensalista identificado</p>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#C4A882' }}>Telefone *</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.clienteTelefone}
              onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-700 focus:outline-none text-base transition-colors"
              style={{ background: '#1C0E06', border: `1px solid ${erros.clienteTelefone ? '#ef4444' : 'rgba(255,255,255,0.08)'}` }}
            />
            {erros.clienteTelefone && <p className="text-red-400 text-sm mt-1.5">{erros.clienteTelefone}</p>}
          </div>

          {!mensalista && (
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: '#C4A882' }}>Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {['Pix', 'Dinheiro'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                    className="py-4 rounded-2xl text-base font-semibold transition-all"
                    style={{
                      border: `2px solid ${form.pagamento === p ? '#F97316' : 'rgba(255,255,255,0.08)'}`,
                      background: form.pagamento === p ? 'rgba(249,115,22,0.12)' : '#1C0E06',
                      color: form.pagamento === p ? '#F97316' : '#6B5040',
                    }}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <p className="font-bold" style={{ color: '#22C55E' }}>Conta mensalista</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(34,197,94,0.6)' }}>O valor será cobrado no fechamento mensal</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: '#C4A882' }}>
              Observações <span className="font-normal" style={{ color: '#6B5040' }}>(opcional)</span>
            </label>
            <textarea
              data-nocase
              placeholder="Alguma observação especial?"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={3}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-700 focus:outline-none resize-none text-base"
              style={{ background: '#1C0E06', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={confirmarPedido}
          disabled={enviando}
          className="w-full font-bold py-5 rounded-2xl text-base text-white transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 6px 24px rgba(249,115,22,0.3)' }}
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
      <div className="hidden md:block min-h-screen" style={{ background: '#0D0600' }}>
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
