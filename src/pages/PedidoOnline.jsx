import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronLeft,
  Copy, Check, X, ChevronRight, UtensilsCrossed, User, Settings,
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

// ── Sub-componentes ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

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
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <Check size={40} className="text-white" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Pedido confirmado!</h1>
      <p className="text-stone-400 mb-6">Seu número de pedido é</p>

      <div className="bg-orange-500 text-white text-5xl font-black rounded-2xl px-10 py-5 mb-8">
        #{String(pedido.numeroPedido).padStart(2, '0')}
      </div>

      {/* Resumo */}
      <div className="bg-stone-900 rounded-2xl p-5 w-full max-w-sm mb-6 text-left">
        <p className="text-stone-400 text-xs uppercase tracking-wide mb-3">Resumo do pedido</p>
        {pedido.itens.map((item, i) => (
          <div key={i} className="flex justify-between text-sm text-stone-300 mb-2">
            <span>
              {item.opcaoNome} {item.tamanho}
              {item.nome ? <span className="text-orange-400"> ({item.nome})</span> : null}
              {item.semItens?.length > 0 && (
                <span className="block text-xs text-stone-500">sem: {item.semItens.join(', ')}</span>
              )}
            </span>
            <span className="font-semibold text-white">{fmtR$(item.preco)}</span>
          </div>
        ))}
        <div className="border-t border-stone-700 mt-3 pt-3 flex justify-between font-bold text-white">
          <span>Total</span>
          <span className="text-orange-400">{fmtR$(pedido.total)}</span>
        </div>
        <p className="text-xs text-stone-400 mt-2">Pagamento: {pedido.pagamento}</p>
      </div>

      {/* Instrução Pix */}
      {isPix && config.pixChave && (
        <div className="bg-blue-950 border border-blue-700 rounded-2xl p-5 w-full max-w-sm mb-4 text-left">
          <p className="text-blue-300 font-semibold mb-3">Pagamento via Pix</p>
          <p className="text-stone-300 text-sm mb-3">
            Faça o Pix e envie o comprovante pelo WhatsApp para confirmar seu pedido.
          </p>
          <div className="bg-stone-900 rounded-xl p-3 mb-3">
            <p className="text-xs text-stone-500 mb-1">Chave Pix</p>
            <p className="text-white font-mono text-sm break-all">{config.pixChave}</p>
            {config.pixNome && <p className="text-xs text-stone-400 mt-1">{config.pixNome}</p>}
          </div>
          <button
            onClick={copiarPix}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? 'Chave copiada!' : 'Copiar chave Pix'}
          </button>
          {whatsRestaurante && (
            <a
              href={`https://wa.me/${whatsRestaurante}?text=Comprovante%20pedido%20%23${String(pedido.numeroPedido).padStart(2, '0')}%20-%20${encodeURIComponent(pedido.clienteNome)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors mt-3"
            >
              Enviar comprovante no WhatsApp
            </a>
          )}
        </div>
      )}

      <button
        onClick={onNovoPedido}
        className="text-stone-400 hover:text-white text-sm underline mt-2 transition-colors"
      >
        Fazer novo pedido
      </button>
    </div>
  )
}

// Modal de configuração de marmitex
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

  const podeAdicionar = !!configurando.opcaoId

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-stone-900 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <h2 className="text-white font-bold text-lg">Montar marmitex</h2>
          <button onClick={() => setConfigurando(null)} className="text-stone-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Nome da marmitex */}
          <div>
            <label className="block text-stone-400 text-sm mb-2">
              <User size={14} className="inline mr-1" />
              Nome nessa marmitex <span className="text-stone-600">(opcional — para identificar na entrega)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: João, Maria, Filha..."
              value={configurando.nome}
              onChange={e => setConfigurando(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
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
                  className={`rounded-xl p-4 text-left border-2 transition-colors ${
                    configurando.tamanho === value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-stone-700 bg-stone-800 hover:border-stone-600'
                  }`}
                >
                  <p className="text-white font-bold">{label}</p>
                  {p ? <p className="text-orange-400 text-sm font-semibold">{fmtR$(p)}</p> : null}
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
                    className={`w-full rounded-xl p-4 text-left border-2 transition-colors ${
                      configurando.opcaoId === op.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-stone-700 bg-stone-800 hover:border-stone-600'
                    }`}
                  >
                    <p className="text-white font-semibold">{op.nome}</p>
                    {op.acompanhamentos?.length > 0 && (
                      <p className="text-stone-400 text-xs mt-0.5">{op.acompanhamentos.join(', ')}</p>
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
                {opcaoAtual.acompanhamentos.map(item => {
                  const removido = configurando.semItens.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => toggleAcomp(item)}
                      className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                        removido
                          ? 'bg-red-950 border-red-700 text-red-400 line-through opacity-60'
                          : 'bg-stone-800 border-stone-600 text-white hover:border-orange-500'
                      }`}
                    >
                      {removido && <X size={11} className="inline mr-1" />}
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

          {/* Carnes do dia */}
          {cardapioHoje?.carnes?.some(c => c) && (
            <div className="bg-stone-800 rounded-xl p-4">
              <p className="text-stone-400 text-xs uppercase tracking-wide mb-2">Carnes do dia</p>
              {cardapioHoje.carnes.filter(c => c).map((c, i) => (
                <p key={i} className="text-stone-300 text-sm">• {c}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-stone-900 border-t border-stone-800 p-5">
          <button
            onClick={onAdicionar}
            disabled={!podeAdicionar}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <Plus size={20} />
            Adicionar ao carrinho — {fmtR$(preco)}
          </button>
        </div>
      </div>
    </div>
  )
}

// Card de item no carrinho
function CarrinhoItem({ item, onRemover, numero }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0">
        {numero}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-base leading-tight">
          {item.opcao.nome} <span className="text-orange-400 font-semibold">({item.tamanho})</span>
        </p>
        {item.nome && <p className="text-stone-400 text-sm mt-0.5">para: {item.nome}</p>}
        {item.semItens.length > 0 && (
          <p className="text-red-400 text-sm mt-0.5">sem: {item.semItens.join(', ')}</p>
        )}
        <p className="text-orange-400 font-bold text-base mt-1.5">{fmtR$(item.preco)}</p>
      </div>
      <button onClick={onRemover} className="text-stone-600 hover:text-red-400 transition-colors shrink-0 p-1">
        <Trash2 size={18} />
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
  const [configurando, setConfigurando] = useState(null) // null = modal fechado
  const [step, setStep] = useState('cardapio') // cardapio | carrinho | checkout | confirmado
  const [form, setForm] = useState({ clienteNome: '', clienteTelefone: '', pagamento: 'Pix', troco: '', obs: '' })
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensalista, setMensalista] = useState(null)
  const [erros, setErros] = useState({})

  // Detectar se é mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

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
      } catch { /* sem Supabase, mostra cardápio vazio */ }
      finally { setLoading(false) }
    }
    carregar()

    // Realtime: atualiza cardápio e config quando o admin editar
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

  // Detectar mensalista
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
    })
  }

  function adicionarAoCarrinho() {
    if (!configurando?.opcaoId) return
    const opcao = cardapioHoje.opcoes.find(o => o.id === configurando.opcaoId)
    const preco = configurando.tamanho === 'P' ? Number(cardapioHoje.precoP) : Number(cardapioHoje.precoG)
    setCarrinho(prev => [...prev, { ...configurando, opcao, preco }])
    setConfigurando(null)
  }

  function remover(uid) {
    setCarrinho(prev => prev.filter(m => m.uid !== uid))
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

      // Número sequencial do dia
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

  // ── Renders ──────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // DESKTOP — 2 colunas
  // ─────────────────────────────────────────────────────────────────────────
  const ColunaCatalogo = (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <img src="/logo-vertical.png" alt="Fogão a Lenha da Leninha" className="h-16 w-auto" />
        <div className="flex-1">
          <h1 className="text-white font-black text-xl leading-tight">Fogão a Lenha da Leninha</h1>
          <p className="text-orange-400 text-sm">Peça agora e retire na hora!</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          title="Painel admin"
          className="text-stone-600 hover:text-stone-400 transition-colors p-1"
        >
          <Settings size={18} />
        </button>
      </div>

      {lojaFechada && (
        <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-center">
          <p className="text-red-400 font-semibold">🔒 Pedidos encerrados no momento</p>
          <p className="text-red-500 text-sm mt-1">Tente novamente mais tarde</p>
        </div>
      )}

      {/* Carnes do dia */}
      {cardapioHoje?.carnes?.some(c => c) && (
        <div className="bg-stone-800/60 border border-stone-700 rounded-2xl p-5">
          <p className="text-orange-400 text-xs uppercase tracking-widest font-bold mb-3">
            🔥 Carnes do dia
          </p>
          {cardapioHoje.carnes.filter(c => c).map((c, i) => (
            <p key={i} className="text-stone-200 font-medium">• {c}</p>
          ))}
        </div>
      )}

      {/* Opções */}
      {opcoes.length === 0 ? (
        <div className="text-center py-10">
          <UtensilsCrossed size={48} className="mx-auto text-stone-600 mb-4" />
          <p className="text-stone-400">Cardápio não disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-stone-400 text-sm uppercase tracking-wide">Escolha sua opção</p>
          {opcoes.map(op => (
            <div key={op.id} className="bg-stone-800 border border-stone-700 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{op.nome}</h3>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-stone-400 text-sm mt-1">{op.acompanhamentos.join(', ')}</p>
                  )}
                  <div className="flex gap-4 mt-3">
                    {cardapioHoje?.precoP && (
                      <span className="text-orange-400 text-sm font-semibold">
                        Pequena {fmtR$(cardapioHoje.precoP)}
                      </span>
                    )}
                    {cardapioHoje?.precoG && (
                      <span className="text-orange-400 text-sm font-semibold">
                        Grande {fmtR$(cardapioHoje.precoG)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  disabled={lojaFechada}
                  onClick={() => abrirModal(op.id)}
                  className="shrink-0 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const ColunaCarrinho = (
    <div className="bg-stone-900 rounded-2xl p-5 sticky top-6 space-y-5">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">
        <ShoppingCart size={20} className="text-orange-400" />
        Seu pedido
      </h2>

      {carrinho.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart size={40} className="mx-auto text-stone-700 mb-3" />
          <p className="text-stone-500 text-sm">Nenhuma marmitex adicionada</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {carrinho.map((item, i) => (
              <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
            ))}
          </div>

          <button
            onClick={() => abrirModal()}
            disabled={lojaFechada}
            className="w-full border-2 border-dashed border-stone-700 hover:border-orange-500 text-stone-500 hover:text-orange-400 rounded-xl py-3 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Plus size={15} /> Adicionar outra marmitex
          </button>

          <div className="border-t border-stone-700 pt-4">
            <div className="flex justify-between text-white font-bold text-lg mb-4">
              <span>Total</span>
              <span className="text-orange-400">{fmtR$(total)}</span>
            </div>

            {/* Dados do cliente */}
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Seu nome *"
                  value={form.clienteNome}
                  onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
                  className={`w-full bg-stone-800 border rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-colors ${erros.clienteNome ? 'border-red-500' : 'border-stone-700'}`}
                />
                {erros.clienteNome && <p className="text-red-400 text-xs mt-1">{erros.clienteNome}</p>}
                {mensalista && (
                  <p className="text-green-400 text-xs mt-1">✓ Cliente mensalista identificado</p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Seu telefone *"
                  value={form.clienteTelefone}
                  onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
                  className={`w-full bg-stone-800 border rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-colors ${erros.clienteTelefone ? 'border-red-500' : 'border-stone-700'}`}
                />
                {erros.clienteTelefone && <p className="text-red-400 text-xs mt-1">{erros.clienteTelefone}</p>}
              </div>

              {/* Pagamento */}
              {!mensalista && (
                <div>
                  <p className="text-stone-400 text-sm mb-2">Pagamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Pix', 'Dinheiro'].map(p => (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                          form.pagamento === p
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-stone-700 text-stone-400 hover:border-stone-600'
                        }`}
                      >
                        {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensalista && (
                <div className="bg-green-950 border border-green-800 rounded-xl p-3">
                  <p className="text-green-400 text-sm font-semibold">Conta mensalista</p>
                  <p className="text-green-600 text-xs">O valor será cobrado no fechamento mensal</p>
                </div>
              )}

              {/* Obs */}
              <textarea
                placeholder="Observações (opcional)"
                value={form.obs}
                onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 resize-none text-sm"
              />

              <button
                onClick={confirmarPedido}
                disabled={enviando}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base"
              >
                {enviando ? 'Confirmando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE — steps
  // ─────────────────────────────────────────────────────────────────────────
  const MobileCardapio = (
    <div className="min-h-screen bg-stone-950 pb-32">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
        <img src="/logo-vertical.png" alt="Logo" className="h-14 w-auto" />
        <div className="flex-1">
          <h1 className="text-white font-black text-lg leading-tight">Fogão a Lenha da Leninha</h1>
          <p className="text-orange-400 text-sm font-medium">Monte seu pedido</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          title="Painel admin"
          className="text-stone-700 hover:text-stone-500 transition-colors p-2"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="px-4 py-6 space-y-5">
        {lojaFechada && (
          <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-center">
            <p className="text-red-400 font-bold text-base">🔒 Pedidos encerrados no momento</p>
            <p className="text-red-500 text-sm mt-1">Tente novamente mais tarde</p>
          </div>
        )}

        {/* Carnes */}
        {cardapioHoje?.carnes?.some(c => c) && (
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5">
            <p className="text-orange-400 text-xs uppercase tracking-widest font-bold mb-3">🔥 Carnes do dia</p>
            {cardapioHoje.carnes.filter(c => c).map((c, i) => (
              <p key={i} className="text-stone-100 font-medium text-base leading-relaxed">• {c}</p>
            ))}
          </div>
        )}

        {/* Opções */}
        {opcoes.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed size={56} className="mx-auto text-stone-700 mb-4" />
            <p className="text-stone-400 text-base">Cardápio não disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold">Escolha sua opção e tamanho</p>
            {opcoes.map(op => (
              <div key={op.id} className="bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 pt-5 pb-4">
                  <h3 className="text-white font-bold text-xl leading-tight">{op.nome}</h3>
                  {op.acompanhamentos?.length > 0 && (
                    <p className="text-stone-400 text-sm mt-2 leading-relaxed">{op.acompanhamentos.join(' · ')}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 divide-x divide-stone-700 border-t border-stone-700">
                  <button
                    disabled={lojaFechada}
                    onClick={() => {
                      abrirModal(op.id)
                      setTimeout(() => setConfigurando(prev => prev ? { ...prev, tamanho: 'P', opcaoId: op.id } : null), 0)
                    }}
                    className="py-5 flex flex-col items-center gap-1.5 hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    <span className="text-white font-bold text-base">Pequena</span>
                    {cardapioHoje?.precoP && (
                      <span className="text-orange-400 font-bold text-base">{fmtR$(cardapioHoje.precoP)}</span>
                    )}
                    <span className="bg-orange-500 rounded-lg w-8 h-8 flex items-center justify-center mt-1">
                      <Plus size={18} className="text-white" />
                    </span>
                  </button>
                  <button
                    disabled={lojaFechada}
                    onClick={() => {
                      abrirModal(op.id)
                      setTimeout(() => setConfigurando(prev => prev ? { ...prev, tamanho: 'G', opcaoId: op.id } : null), 0)
                    }}
                    className="py-5 flex flex-col items-center gap-1.5 hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-40"
                  >
                    <span className="text-white font-bold text-base">Grande</span>
                    {cardapioHoje?.precoG && (
                      <span className="text-orange-400 font-bold text-base">{fmtR$(cardapioHoje.precoG)}</span>
                    )}
                    <span className="bg-orange-500 rounded-lg w-8 h-8 flex items-center justify-center mt-1">
                      <Plus size={18} className="text-white" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão fixo de carrinho */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-stone-950/95 backdrop-blur-sm border-t border-stone-800">
          <button
            onClick={() => setStep('carrinho')}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-5 rounded-2xl flex items-center justify-between px-5 transition-colors shadow-xl shadow-orange-500/20"
          >
            <span className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center text-base font-black">
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
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
        <button onClick={() => setStep('cardapio')} className="text-stone-400 hover:text-white p-1">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-white font-bold text-lg">Seu carrinho</h2>
        <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {carrinho.map((item, i) => (
          <CarrinhoItem key={item.uid} item={item} numero={i + 1} onRemover={() => remover(item.uid)} />
        ))}
        <button
          onClick={() => setStep('cardapio')}
          className="w-full border-2 border-dashed border-stone-700 hover:border-orange-500 text-stone-500 hover:text-orange-400 rounded-2xl py-5 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} /> Adicionar outra marmitex
        </button>
      </div>

      <div className="p-4 border-t border-stone-800">
        <div className="flex justify-between text-white font-bold text-xl mb-4">
          <span>Total</span>
          <span className="text-orange-400">{fmtR$(total)}</span>
        </div>
        <button
          onClick={() => setStep('checkout')}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-orange-500/20 transition-colors"
        >
          Finalizar pedido <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  const MobileCheckout = (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
        <button onClick={() => setStep('carrinho')} className="text-stone-400 hover:text-white p-1">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-white font-bold text-lg">Finalizar pedido</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {/* Resumo compacto */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <p className="text-stone-400 text-xs uppercase tracking-widest font-semibold mb-3">Resumo do pedido</p>
          {carrinho.map((item) => (
            <div key={item.uid} className="flex justify-between text-sm text-stone-300 mb-2 gap-2">
              <span className="flex-1">
                {item.opcao.nome} <span className="text-stone-500">({item.tamanho})</span>
                {item.nome && <span className="text-orange-400"> · {item.nome}</span>}
                {item.semItens?.length > 0 && (
                  <span className="block text-xs text-red-400 mt-0.5">sem: {item.semItens.join(', ')}</span>
                )}
              </span>
              <span className="font-semibold text-white shrink-0">{fmtR$(item.preco)}</span>
            </div>
          ))}
          <div className="border-t border-stone-700 mt-3 pt-3 flex justify-between font-bold text-white text-base">
            <span>Total</span>
            <span className="text-orange-400">{fmtR$(total)}</span>
          </div>
        </div>

        {/* Dados */}
        <div className="space-y-4">
          <p className="text-stone-400 text-xs uppercase tracking-widest font-semibold">Seus dados</p>

          <div>
            <label className="text-stone-300 text-sm font-medium block mb-1.5">Seu nome *</label>
            <input
              type="text"
              placeholder="Nome completo"
              value={form.clienteNome}
              onChange={e => setForm(f => ({ ...f, clienteNome: e.target.value }))}
              className={`w-full bg-stone-800 border rounded-xl px-4 py-4 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-base transition-colors ${erros.clienteNome ? 'border-red-500' : 'border-stone-700'}`}
            />
            {erros.clienteNome && <p className="text-red-400 text-sm mt-1.5">{erros.clienteNome}</p>}
            {mensalista && (
              <p className="text-green-400 text-sm mt-1.5 font-medium">✓ Cliente mensalista identificado</p>
            )}
          </div>

          <div>
            <label className="text-stone-300 text-sm font-medium block mb-1.5">Telefone *</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.clienteTelefone}
              onChange={e => setForm(f => ({ ...f, clienteTelefone: fmtTel(e.target.value) }))}
              className={`w-full bg-stone-800 border rounded-xl px-4 py-4 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-base transition-colors ${erros.clienteTelefone ? 'border-red-500' : 'border-stone-700'}`}
            />
            {erros.clienteTelefone && <p className="text-red-400 text-sm mt-1.5">{erros.clienteTelefone}</p>}
          </div>

          {!mensalista && (
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {['Pix', 'Dinheiro'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, pagamento: p }))}
                    className={`py-5 rounded-2xl text-base font-semibold border-2 transition-colors ${
                      form.pagamento === p
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-stone-700 bg-stone-800 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    {p === 'Pix' ? '💠 Pix' : '💵 Dinheiro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div className="bg-green-950 border border-green-800 rounded-2xl p-4">
              <p className="text-green-400 font-bold text-base">Conta mensalista</p>
              <p className="text-green-600 text-sm mt-1">O valor será cobrado no fechamento mensal</p>
            </div>
          )}

          <div>
            <label className="text-stone-300 text-sm font-medium block mb-1.5">Observações <span className="text-stone-500 font-normal">(opcional)</span></label>
            <textarea
              placeholder="Alguma observação especial?"
              value={form.obs}
              onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              rows={3}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-4 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 resize-none text-base transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={confirmarPedido}
          disabled={enviando}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-5 rounded-2xl text-base transition-colors shadow-lg shadow-orange-500/20"
        >
          {enviando ? 'Confirmando...' : `Confirmar pedido · ${fmtR$(total)}`}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Modal de configurar marmitex */}
      {configurando && (
        <ModalMarmitex
          cardapioHoje={cardapioHoje}
          configurando={configurando}
          setConfigurando={setConfigurando}
          onAdicionar={adicionarAoCarrinho}
        />
      )}

      {/* Desktop */}
      <div className="hidden md:flex min-h-screen bg-stone-950">
        <div className="max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-[1fr_380px] gap-8">
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
