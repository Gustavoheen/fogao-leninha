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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0a07' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Carregando cardápio...</p>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center" style={{ background: '#0f0a07' }}>
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
        <Check size={44} className="text-white" strokeWidth={3} />
      </div>

      <h1 className="text-3xl font-black text-white mb-2">Pedido confirmado!</h1>
      <p className="text-stone-400 mb-8">Seu número de pedido</p>

      <div className="text-white text-6xl font-black rounded-3xl px-12 py-6 mb-8 shadow-2xl shadow-orange-500/30" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
        #{String(pedido.numeroPedido).padStart(2, '0')}
      </div>

      <div className="w-full max-w-sm mb-6 text-left rounded-2xl overflow-hidden border border-stone-800" style={{ background: '#1a1008' }}>
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold">Resumo do pedido</p>
        </div>
        <div className="p-5 space-y-2">
          {pedido.itens.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-stone-300">
              <span>
                {item.opcaoNome} <span className="text-stone-500">({item.tamanho})</span>
                {item.nome ? <span className="text-orange-400"> · {item.nome}</span> : null}
                {item.semItens?.length > 0 && (
                  <span className="block text-xs text-stone-500 mt-0.5">sem: {item.semItens.join(', ')}</span>
                )}
              </span>
              <span className="font-semibold text-white ml-4 shrink-0">{fmtR$(item.preco)}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex justify-between font-bold text-white text-base border-t border-stone-800 pt-3">
          <span>Total</span>
          <span className="text-orange-400">{fmtR$(pedido.total)}</span>
        </div>
        <div className="px-5 pb-4">
          <p className="text-xs text-stone-500">Pagamento: {pedido.pagamento}</p>
        </div>
      </div>

      {isPix && config.pixChave && (
        <div className="w-full max-w-sm mb-4 rounded-2xl overflow-hidden border border-blue-900/60" style={{ background: '#0a1628' }}>
          <div className="px-5 py-3 border-b border-blue-900/40">
            <p className="text-blue-400 font-semibold text-sm">Pagamento via Pix</p>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-stone-300 text-sm">
              Faça o Pix e envie o comprovante pelo WhatsApp para confirmar seu pedido.
            </p>
            <div className="rounded-xl p-3 border border-stone-800" style={{ background: '#0f0a07' }}>
              <p className="text-xs text-stone-500 mb-1">Chave Pix</p>
              <p className="text-white font-mono text-sm break-all">{config.pixChave}</p>
              {config.pixNome && <p className="text-xs text-stone-400 mt-1">{config.pixNome}</p>}
            </div>
            <button
              onClick={copiarPix}
              className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors text-white text-sm"
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
                className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors text-white text-sm"
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
        className="text-stone-500 hover:text-stone-300 text-sm mt-2 transition-colors underline underline-offset-4"
      >
        Fazer novo pedido
      </button>
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl" style={{ background: '#1a1008', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#1a1008' }}>
          <h2 className="text-white font-bold text-lg">Montar marmitex</h2>
          <button
            onClick={() => setConfigurando(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-stone-400 hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="flex items-center gap-1.5 text-stone-400 text-sm mb-2">
              <User size={13} />
              Nome nessa marmitex
              <span className="text-stone-600 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              data-nocase
              placeholder="Ex: João, Maria, Filha..."
              value={configurando.nome}
              onChange={e => setConfigurando(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none text-sm border transition-colors"
              style={{ background: '#0f0a07', borderColor: 'rgba(255,255,255,0.08)' }}
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Tamanho */}
          <div>
            <p className="text-stone-400 text-sm mb-3">Tamanho</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'P', label: 'Pequena', preco: cardapioHoje?.precoP },
                { value: 'G', label: 'Grande', preco: cardapioHoje?.precoG },
              ].map(({ value, label, preco: p }) => (
                <button
                  key={value}
                  onClick={() => setConfigurando(prev => ({ ...prev, tamanho: value }))}
                  className="rounded-2xl p-4 text-left border-2 transition-all"
                  style={{
                    borderColor: configurando.tamanho === value ? '#f97316' : 'rgba(255,255,255,0.08)',
                    background: configurando.tamanho === value ? 'rgba(249,115,22,0.12)' : '#0f0a07',
                  }}
                >
                  <p className="text-white font-bold">{label}</p>
                  {p ? <p className="text-orange-400 text-sm font-semibold mt-0.5">{fmtR$(p)}</p> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Opção */}
          {opcoes.length > 1 && (
            <div>
              <p className="text-stone-400 text-sm mb-3">Opção</p>
              <div className="space-y-2">
                {opcoes.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setConfigurando(prev => ({ ...prev, opcaoId: op.id, semItens: [] }))}
                    className="w-full rounded-2xl p-4 text-left border-2 transition-all"
                    style={{
                      borderColor: configurando.opcaoId === op.id ? '#f97316' : 'rgba(255,255,255,0.08)',
                      background: configurando.opcaoId === op.id ? 'rgba(249,115,22,0.12)' : '#0f0a07',
                    }}
                  >
                    <p className="text-white font-semibold">{op.nome}</p>
                    {op.acompanhamentos?.length > 0 && (
                      <p className="text-stone-500 text-xs mt-0.5">
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
              <p className="text-stone-400 text-sm mb-1">Acompanhamentos</p>
              <p className="text-stone-600 text-xs mb-3">Toque para remover o que não quiser</p>
              <div className="flex flex-wrap gap-2">
                {opcaoAtual.acompanhamentos.map((rawItem, idx) => {
                  const item = strAcomp(rawItem)
                  if (!item) return null
                  const removido = configurando.semItens.includes(item)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleAcomp(item)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                      style={{
                        background: removido ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                        borderColor: removido ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
                        color: removido ? '#f87171' : '#d6d3d1',
                        textDecoration: removido ? 'line-through' : 'none',
                        opacity: removido ? 0.6 : 1,
                      }}
                    >
                      {removido && <X size={10} className="inline mr-1" />}
                      {item}
                    </button>
                  )
                })}
              </div>
              {configurando.semItens.length > 0 && (
                <p className="text-red-400 text-xs mt-2">
                  Sem: {configurando.semItens.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Proteína especial */}
          {opcaoAtual?.tipoCarnes === 'especial' && opcaoAtual?.pratoEspecial && (
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.25)' }}>
              <p className="text-orange-400 text-xs uppercase tracking-wide mb-1">Prato especial</p>
              <p className="text-white font-bold">{opcaoAtual.pratoEspecial}</p>
              <p className="text-stone-500 text-xs mt-1">Proteína já inclusa</p>
            </div>
          )}

          {/* Escolha de carne */}
          {tipoCarnes === 'globais' && carnesDisponiveis.length > 0 && (
            <div>
              <p className="text-stone-400 text-sm mb-1">
                Escolha a carne <span className="text-red-400">*</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {carnesDisponiveis.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setConfigurando(prev => ({ ...prev, proteina: c }))}
                    className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all"
                    style={{
                      background: configurando.proteina === c ? '#f97316' : '#0f0a07',
                      borderColor: configurando.proteina === c ? '#f97316' : 'rgba(255,255,255,0.12)',
                      color: configurando.proteina === c ? '#fff' : '#a8a29e',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {!configurando.proteina && (
                <p className="text-red-400 text-xs mt-2">Selecione a carne para continuar</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-5 border-t" style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={onAdicionar}
            disabled={!podeAdicionar}
            className="w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-orange-500/20"
            style={{ background: podeAdicionar ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#374151' }}
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
    <div className="rounded-2xl p-4 flex items-start gap-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
        {numero}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">
          {item.opcao.nome}
          <span className="text-stone-500 font-normal"> · {item.tamanho === 'P' ? 'Pequena' : 'Grande'}</span>
        </p>
        {item.proteina && <p className="text-orange-400 text-xs mt-0.5">{item.proteina}</p>}
        {item.nome && <p className="text-stone-500 text-xs mt-0.5">para: {item.nome}</p>}
        {item.semItens.length > 0 && (
          <p className="text-red-400/70 text-xs mt-0.5">sem: {item.semItens.join(', ')}</p>
        )}
        <p className="text-orange-400 font-bold text-sm mt-1.5">{fmtR$(item.preco)}</p>
      </div>
      <button onClick={onRemover} className="text-stone-700 hover:text-red-400 transition-colors p-1 shrink-0">
        <Trash2 size={16} />
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
    <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.2)' }}>
      <div className="px-5 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.08)' }}>
        <Flame size={15} className="text-orange-400" />
        <p className="text-orange-400 text-xs uppercase tracking-widest font-bold">Carnes do dia</p>
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {carnesAtivas.map((c, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full text-sm font-semibold text-orange-300 border" style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.25)' }}>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <img src="/logo-vertical.png" alt="Fogão a Lenha da Leninha" className="h-16 w-auto rounded-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-black text-xl leading-tight">Fogão a Lenha da Leninha</h1>
          <p className="text-orange-400 text-sm mt-0.5">Peça agora e retire na hora!</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          title="Painel admin"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-stone-600 hover:text-stone-400"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Settings size={17} />
        </button>
      </div>

      {lojaFechada && (
        <div className="rounded-2xl p-4 text-center border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <p className="text-red-400 font-semibold">Pedidos encerrados no momento</p>
          <p className="text-red-500/70 text-sm mt-1">Tente novamente mais tarde</p>
        </div>
      )}

      {SecaoCarnes}

      {/* Opções */}
      {opcoes.length === 0 ? (
        <div className="text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto text-stone-700 mb-4" />
          <p className="text-stone-500">Cardápio não disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-stone-600 text-xs uppercase tracking-widest font-semibold px-1">Escolha sua opção</p>
          {opcoes.map(op => (
            <div
              key={op.id}
              className="rounded-2xl overflow-hidden border transition-colors"
              style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg leading-tight">{op.nome}</h3>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                      {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {cardapioHoje?.precoP && (
                      <div className="text-center">
                        <p className="text-stone-600 text-xs">Pequena</p>
                        <p className="text-orange-400 font-bold text-base">{fmtR$(cardapioHoje.precoP)}</p>
                      </div>
                    )}
                    {cardapioHoje?.precoG && (
                      <div className="text-center">
                        <p className="text-stone-600 text-xs">Grande</p>
                        <p className="text-orange-400 font-bold text-base">{fmtR$(cardapioHoje.precoG)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  disabled={lojaFechada}
                  onClick={() => abrirModal(op.id)}
                  className="shrink-0 flex items-center gap-2 font-bold px-5 py-3 rounded-xl transition-all text-white text-sm shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                >
                  <Plus size={17} /> Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const ColunaCarrinho = (
    <div className="rounded-2xl overflow-hidden border sticky top-6" style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <ShoppingCart size={18} className="text-orange-400" />
        <h2 className="text-white font-bold">Seu pedido</h2>
        {carrinho.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#f97316' }}>
            {carrinho.length}
          </span>
        )}
      </div>

      {carrinho.length === 0 ? (
        <div className="py-12 text-center px-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <ShoppingCart size={28} className="text-stone-700" />
          </div>
          <p className="text-stone-600 text-sm">Nenhuma marmitex adicionada</p>
          <p className="text-stone-700 text-xs mt-1">Escolha uma opção ao lado</p>
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
            style={{ borderColor: 'rgba(249,115,22,0.3)', color: '#9ca3af' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <Plus size={14} /> Adicionar outra marmitex
          </button>

          {/* Total */}
          <div className="flex justify-between font-bold text-white text-lg pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span>Total</span>
            <span className="text-orange-400">{fmtR$(total)}</span>
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
                className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none text-sm border transition-colors"
                style={{
                  background: '#0f0a07',
                  borderColor: erros.clienteNome ? '#ef4444' : 'rgba(255,255,255,0.08)',
                }}
              />
              {erros.clienteNome && <p className="text-red-400 text-xs mt-1">{erros.clienteNome}</p>}
              {mensalista && <p className="text-green-400 text-xs mt-1">✓ Cliente mensalista identificado</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Seu telefone *"
                value={form.clienteTelefone}
                onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none text-sm border transition-colors"
                style={{
                  background: '#0f0a07',
                  borderColor: erros.clienteTelefone ? '#ef4444' : 'rgba(255,255,255,0.08)',
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
                    className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                    style={{
                      borderColor: form.pagamento === p ? '#f97316' : 'rgba(255,255,255,0.08)',
                      background: form.pagamento === p ? 'rgba(249,115,22,0.12)' : '#0f0a07',
                      color: form.pagamento === p ? '#fb923c' : '#9ca3af',
                    }}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            )}

            {mensalista && (
              <div className="rounded-xl p-3 border" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <p className="text-green-400 text-sm font-semibold">Conta mensalista</p>
                <p className="text-green-600 text-xs mt-0.5">Cobrado no fechamento mensal</p>
              </div>
            )}

            <textarea
              data-nocase
              placeholder="Observações (opcional)"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-white placeholder-stone-600 focus:outline-none resize-none text-sm border"
              style={{ background: '#0f0a07', borderColor: 'rgba(255,255,255,0.08)' }}
            />

            <button
              onClick={confirmarPedido}
              disabled={enviando}
              className="w-full font-bold py-4 rounded-2xl transition-all text-white text-sm shadow-lg shadow-orange-500/20 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
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
    <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}>
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 transition-colors shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ChevronLeft size={20} />
        </button>
      )}
      {!onBack && (
        <img src="/logo-vertical.png" alt="Logo" className="h-10 w-auto rounded-lg shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base leading-tight truncate">{titulo}</p>
        {!onBack && <p className="text-orange-400 text-xs">Monte seu pedido</p>}
      </div>
      {direita}
    </div>
  )

  const MobileCardapio = (
    <div className="min-h-screen pb-32" style={{ background: '#0f0a07' }}>
      <MobileHeader
        titulo="Fogão a Lenha da Leninha"
        direita={
          <button
            onClick={() => navigate('/login')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Settings size={16} />
          </button>
        }
      />

      <div className="px-4 py-5 space-y-4">
        {lojaFechada && (
          <div className="rounded-2xl p-4 text-center border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <p className="text-red-400 font-bold">Pedidos encerrados no momento</p>
            <p className="text-red-500/70 text-sm mt-1">Tente novamente mais tarde</p>
          </div>
        )}

        {SecaoCarnes}

        {opcoes.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed size={52} className="mx-auto text-stone-800 mb-4" />
            <p className="text-stone-600">Cardápio não disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-stone-700 text-xs uppercase tracking-widest font-semibold px-1">Escolha sua opção</p>
            {opcoes.map(op => (
              <div
                key={op.id}
                className="rounded-2xl overflow-hidden border"
                style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="px-5 pt-5 pb-4">
                  <h3 className="text-white font-bold text-xl">{op.nome}</h3>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                      {op.acompanhamentos.map(strAcomp).filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {[
                    { label: 'Pequena', size: 'P', preco: cardapioHoje?.precoP },
                    { label: 'Grande', size: 'G', preco: cardapioHoje?.precoG },
                  ].map(({ label, size, preco: p }, idx) => (
                    <button
                      key={size}
                      disabled={lojaFechada}
                      onClick={() => {
                        abrirModal(op.id)
                        setTimeout(() => setConfigurando(prev => prev ? { ...prev, tamanho: size, opcaoId: op.id } : null), 0)
                      }}
                      className="py-5 flex flex-col items-center gap-1 active:opacity-70 transition-opacity disabled:opacity-40"
                      style={{ borderRight: idx === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    >
                      <span className="text-stone-300 font-semibold text-base">{label}</span>
                      {p && <span className="text-orange-400 font-bold text-lg">{fmtR$(p)}</span>}
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center mt-1" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
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

      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, #0f0a07 70%, transparent)' }}>
          <button
            onClick={() => setStep('carrinho')}
            className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 transition-all shadow-2xl shadow-orange-500/30"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: 'rgba(0,0,0,0.2)' }}>
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0a07' }}>
      <MobileHeader
        titulo="Seu carrinho"
        onBack={() => setStep('cardapio')}
        direita={
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: '#f97316' }}>
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
          style={{ borderColor: 'rgba(249,115,22,0.25)', color: '#6b7280' }}
        >
          <Plus size={15} /> Adicionar outra marmitex
        </button>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex justify-between text-white font-bold text-xl mb-4">
          <span>Total</span>
          <span className="text-orange-400">{fmtR$(total)}</span>
        </div>
        <button
          onClick={() => setStep('checkout')}
          className="w-full text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl shadow-orange-500/25 transition-all"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          Finalizar pedido <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const MobileCheckout = (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0a07' }}>
      <MobileHeader titulo="Finalizar pedido" onBack={() => setStep('carrinho')} />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Resumo */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold">Resumo</p>
          </div>
          <div className="p-5 space-y-2">
            {carrinho.map(item => (
              <div key={item.uid} className="flex justify-between text-sm text-stone-300 gap-2">
                <span className="flex-1">
                  {item.opcao.nome} <span className="text-stone-600">({item.tamanho === 'P' ? 'Pequena' : 'Grande'})</span>
                  {item.nome && <span className="text-orange-400"> · {item.nome}</span>}
                  {item.semItens?.length > 0 && (
                    <span className="block text-xs text-red-400/70 mt-0.5">sem: {item.semItens.join(', ')}</span>
                  )}
                </span>
                <span className="font-semibold text-white shrink-0">{fmtR$(item.preco)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 flex justify-between font-bold text-white text-base border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span>Total</span>
            <span className="text-orange-400">{fmtR$(total)}</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-4">
          <p className="text-stone-600 text-xs uppercase tracking-widest font-semibold">Seus dados</p>

          <div>
            <label className="text-stone-400 text-sm font-medium block mb-1.5">Nome *</label>
            <input
              type="text"
              data-nocase
              placeholder="Nome completo"
              value={form.clienteNome}
              onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-600 focus:outline-none text-base border transition-colors"
              style={{ background: '#1a1008', borderColor: erros.clienteNome ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
            />
            {erros.clienteNome && <p className="text-red-400 text-sm mt-1.5">{erros.clienteNome}</p>}
            {mensalista && <p className="text-green-400 text-sm mt-1.5 font-medium">✓ Cliente mensalista identificado</p>}
          </div>

          <div>
            <label className="text-stone-400 text-sm font-medium block mb-1.5">Telefone *</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.clienteTelefone}
              onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-600 focus:outline-none text-base border transition-colors"
              style={{ background: '#1a1008', borderColor: erros.clienteTelefone ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
            />
            {erros.clienteTelefone && <p className="text-red-400 text-sm mt-1.5">{erros.clienteTelefone}</p>}
          </div>

          {!mensalista && (
            <div>
              <label className="text-stone-400 text-sm font-medium block mb-2">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {['Pix', 'Dinheiro'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                    className="py-4 rounded-2xl text-base font-semibold border-2 transition-all"
                    style={{
                      borderColor: form.pagamento === p ? '#f97316' : 'rgba(255,255,255,0.08)',
                      background: form.pagamento === p ? 'rgba(249,115,22,0.12)' : '#1a1008',
                      color: form.pagamento === p ? '#fb923c' : '#6b7280',
                    }}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }}>
              <p className="text-green-400 font-bold">Conta mensalista</p>
              <p className="text-green-600 text-sm mt-1">O valor será cobrado no fechamento mensal</p>
            </div>
          )}

          <div>
            <label className="text-stone-400 text-sm font-medium block mb-1.5">
              Observações <span className="text-stone-700 font-normal">(opcional)</span>
            </label>
            <textarea
              data-nocase
              placeholder="Alguma observação especial?"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={3}
              className="w-full rounded-xl px-4 py-4 text-white placeholder-stone-600 focus:outline-none resize-none text-base border"
              style={{ background: '#1a1008', borderColor: 'rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={confirmarPedido}
          disabled={enviando}
          className="w-full font-bold py-5 rounded-2xl text-base text-white shadow-xl shadow-orange-500/25 transition-all disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
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
      <div className="hidden md:block min-h-screen" style={{ background: '#0f0a07' }}>
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
