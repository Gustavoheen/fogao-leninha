/**
 * PedidoEquipe — Interface rápida de coleta de pedidos para a equipe via celular.
 * Protegida por PIN. Fluxo ultra-simplificado para agilizar o atendimento.
 * Rota: /equipe
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Check, Plus, X, Zap } from 'lucide-react'

function fmtR$(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function uid() { return Math.random().toString(36).slice(2, 9) }

// ── Tela de PIN ────────────────────────────────────────────────────────────────
function TelaPIN({ onEntrar }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function verificar() {
    const pinSalvo = sessionStorage.getItem('fogao_equipe_pin') || '1234'
    if (pin === pinSalvo) {
      onEntrar()
    } else {
      setErro(true)
      setPin('')
      setTimeout(() => setErro(false), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
        <Zap size={32} className="text-white" />
      </div>
      <h1 className="text-white font-black text-2xl mb-1">Área da Equipe</h1>
      <p className="text-stone-400 text-sm mb-8">Digite o PIN para acessar</p>

      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        maxLength={6}
        value={pin}
        onChange={e => setPin(e.target.value.slice(0, 6))}
        onKeyDown={e => e.key === 'Enter' && verificar()}
        placeholder="••••"
        className={`w-40 text-center text-3xl font-black tracking-[0.5em] bg-stone-800 border-2 rounded-2xl px-4 py-4 text-white focus:outline-none transition-colors ${
          erro ? 'border-red-500 text-red-400' : 'border-stone-700 focus:border-orange-500'
        }`}
      />
      {erro && <p className="text-red-400 text-sm mt-3">PIN incorreto</p>}

      <button
        onClick={verificar}
        className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-3 rounded-xl transition-colors"
      >
        Entrar
      </button>
    </div>
  )
}

// ── Interface principal ────────────────────────────────────────────────────────
export default function PedidoEquipe() {
  const [autenticado, setAutenticado] = useState(
    () => !!sessionStorage.getItem('fogao_equipe_ok')
  )
  const [cardapioHoje, setCardapioHoje] = useState(null)
  const [clientes, setClientes] = useState([])
  const [config, setConfig] = useState({ pixChave: '', equipePIN: '1234' })
  const [loading, setLoading] = useState(true)

  // Estado do pedido em construção
  const [nomeCliente, setNomeCliente] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [mensalista, setMensalista] = useState(null)
  const [carrinho, setCarrinho] = useState([]) // [{uid, opcao, tamanho, semItens, nome, preco}]
  const [step, setStep] = useState('cliente') // cliente | montando | revisao | confirmado
  const [marmitexAtual, setMarmitexAtual] = useState(null) // marmitex sendo configurada
  const [numeroPedido, setNumeroPedido] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [pagamento, setPagamento] = useState('Dinheiro')

  const nomeRef = useRef(null)

  useEffect(() => {
    if (!autenticado) return
    async function carregar() {
      try {
        const [{ data: ch }, { data: cl }, { data: cf }] = await Promise.all([
          supabase.from('cardapio_hoje').select('*').eq('id', 1).single(),
          supabase.from('clientes').select('id,nome,tipo,telefone'),
          supabase.from('configuracoes').select('*').eq('id', 1).single(),
        ])
        if (ch) setCardapioHoje(ch)
        if (cl) setClientes(cl)
        if (cf) {
          setConfig(prev => ({ ...prev, ...cf }))
          // Sincroniza PIN com sessionStorage
          if (cf.equipePIN) sessionStorage.setItem('fogao_equipe_pin', cf.equipePIN)
        }
      } catch { /* offline */ }
      finally { setLoading(false) }
    }
    carregar()
  }, [autenticado])

  // Autocomplete de clientes
  useEffect(() => {
    if (!nomeCliente.trim() || nomeCliente.length < 2) { setSugestoes([]); setMensalista(null); return }
    const q = nomeCliente.toLowerCase().trim()
    const matches = clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 5)
    setSugestoes(matches)
    const exato = clientes.find(c => c.nome.toLowerCase().trim() === q)
    setMensalista(exato?.tipo === 'mensalista' ? exato : null)
  }, [nomeCliente, clientes])

  function entrar() {
    sessionStorage.setItem('fogao_equipe_ok', '1')
    setAutenticado(true)
  }

  const opcoes = cardapioHoje?.opcoes?.filter(o => o.disponivel) || []
  const total = carrinho.reduce((acc, m) => acc + m.preco, 0)

  function iniciarMarmitex(opcaoId, tamanho) {
    const opcao = opcoes.find(o => o.id === opcaoId)
    const preco = tamanho === 'P' ? Number(cardapioHoje?.precoP || 0) : Number(cardapioHoje?.precoG || 0)
    setMarmitexAtual({ uid: uid(), opcao, tamanho, semItens: [], nome: '', preco })
    setStep('montando')
  }

  function toggleSemItem(item) {
    setMarmitexAtual(prev => ({
      ...prev,
      semItens: prev.semItens.includes(item)
        ? prev.semItens.filter(i => i !== item)
        : [...prev.semItens, item],
    }))
  }

  function adicionarMarmitex() {
    setCarrinho(prev => [...prev, marmitexAtual])
    setMarmitexAtual(null)
    setStep('revisao')
  }

  function novaMarmitex() {
    setStep('montando')
    setMarmitexAtual(null)
  }

  async function confirmar() {
    if (enviando) return
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
      const pg = mensalista ? 'Mensalista' : pagamento
      const statusPg = mensalista ? 'mensalista' : 'pendente'

      const { error: insertError } = await supabase.from('pedidos').insert({
        id,
        clienteNome: nomeCliente.trim(),
        itens,
        total,
        pagamento: pg,
        status: 'aberto',
        statusPagamento: statusPg,
        origem: 'equipe',
        criadoEm: new Date().toISOString(),
      })

      if (insertError) throw insertError

      const hoje = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('pedidos')
        .select('*', { count: 'exact', head: true })
        .gte('criadoEm', hoje)

      setNumeroPedido(count || Math.floor(Math.random() * 90 + 10))
      setStep('confirmado')
    } catch (err) {
      console.error('Erro ao salvar pedido:', err)
      alert('Erro ao salvar pedido: ' + (err?.message || 'verifique a conexão.'))
    } finally {
      setEnviando(false)
    }
  }

  function novoPedido() {
    setNomeCliente('')
    setCarrinho([])
    setMensalista(null)
    setPagamento('Dinheiro')
    setNumeroPedido(null)
    setStep('cliente')
    setTimeout(() => nomeRef.current?.focus(), 100)
  }

  if (!autenticado) return <TelaPIN onEntrar={entrar} />
  if (loading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── STEP: confirmado ─────────────────────────────────────────────────────────
  if (step === 'confirmado') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
          <Check size={32} className="text-white" />
        </div>
        <p className="text-stone-400 mb-1">Pedido salvo!</p>
        <div className="bg-orange-500 text-white text-5xl font-black rounded-2xl px-8 py-4 mb-2">
          #{String(numeroPedido).padStart(2, '0')}
        </div>
        <p className="text-stone-300 font-semibold mb-0.5">{nomeCliente}</p>
        <p className="text-orange-400 font-bold text-lg mb-6">{fmtR$(total)}</p>

        {carrinho.map((m, i) => (
          <p key={i} className="text-stone-400 text-sm">
            {m.opcao.nome} ({m.tamanho}){m.nome && ` · ${m.nome}`}
          </p>
        ))}

        <button
          onClick={novoPedido}
          className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-4 rounded-2xl transition-colors"
        >
          Próximo pedido
        </button>
      </div>
    )
  }

  // ── STEP: montando marmitex ──────────────────────────────────────────────────
  if (step === 'montando' && !marmitexAtual) {
    // Escolher opção + tamanho
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col">
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setStep(carrinho.length > 0 ? 'revisao' : 'cliente')} className="text-stone-400 hover:text-white">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-white font-bold">Nova marmitex</h2>
            <p className="text-stone-400 text-xs">Cliente: {nomeCliente}</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-5 space-y-5">
          {/* Carnes */}
          {cardapioHoje?.carnes?.some(c => c) && (
            <div className="bg-stone-800 rounded-xl p-4">
              <p className="text-orange-400 text-xs font-bold uppercase mb-2">🔥 Carnes</p>
              {cardapioHoje.carnes.filter(c => c).map((c, i) => (
                <p key={i} className="text-stone-300 text-sm">• {c}</p>
              ))}
            </div>
          )}

          {opcoes.map(op => (
            <div key={op.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-white font-bold">{op.nome}</h3>
                {op.acompanhamentos?.length > 0 && (
                  <p className="text-stone-500 text-xs mt-0.5">{op.acompanhamentos.join(', ')}</p>
                )}
              </div>
              <div className="grid grid-cols-2 divide-x divide-stone-800 border-t border-stone-800">
                <button
                  onClick={() => iniciarMarmitex(op.id, 'P')}
                  className="py-4 flex flex-col items-center hover:bg-stone-800 active:bg-stone-700 transition-colors"
                >
                  <span className="text-white font-bold">Pequena</span>
                  <span className="text-orange-400 text-sm">{fmtR$(cardapioHoje?.precoP)}</span>
                  <Plus size={16} className="text-orange-400 mt-1" />
                </button>
                <button
                  onClick={() => iniciarMarmitex(op.id, 'G')}
                  className="py-4 flex flex-col items-center hover:bg-stone-800 active:bg-stone-700 transition-colors"
                >
                  <span className="text-white font-bold">Grande</span>
                  <span className="text-orange-400 text-sm">{fmtR$(cardapioHoje?.precoG)}</span>
                  <Plus size={16} className="text-orange-400 mt-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── STEP: configurar acompanhamentos ─────────────────────────────────────────
  if (step === 'montando' && marmitexAtual) {
    const acomp = marmitexAtual.opcao?.acompanhamentos || []
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col">
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
          <button onClick={() => setMarmitexAtual(null)} className="text-stone-400 hover:text-white">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-white font-bold">
              {marmitexAtual.opcao?.nome} ({marmitexAtual.tamanho}) · {fmtR$(marmitexAtual.preco)}
            </h2>
            <p className="text-stone-400 text-xs">Toque nos itens que o cliente NÃO quer</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-5 space-y-5">
          {/* Nome da marmitex */}
          <div>
            <label className="text-stone-400 text-sm block mb-2">Nome nessa marmitex (opcional)</label>
            <input
              type="text"
              placeholder="Ex: João, criança, sogra..."
              value={marmitexAtual.nome}
              onChange={e => setMarmitexAtual(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-base"
            />
          </div>

          {/* Acompanhamentos */}
          {acomp.length > 0 && (
            <div>
              <p className="text-stone-400 text-sm mb-3">Acompanhamentos — toque para remover</p>
              <div className="flex flex-wrap gap-3">
                {acomp.map(item => {
                  const removido = marmitexAtual.semItens.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => toggleSemItem(item)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        removido
                          ? 'bg-red-950 border-red-700 text-red-400 line-through opacity-60'
                          : 'bg-stone-800 border-stone-600 text-white'
                      }`}
                    >
                      {removido && <X size={12} className="inline mr-1" />}
                      {item}
                    </button>
                  )
                })}
              </div>
              {marmitexAtual.semItens.length > 0 && (
                <p className="text-red-400 text-sm mt-3">
                  Sem: {marmitexAtual.semItens.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-800">
          <button
            onClick={adicionarMarmitex}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-base transition-colors"
          >
            Adicionar marmitex
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: revisão do carrinho ────────────────────────────────────────────────
  if (step === 'revisao') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col">
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('cliente')} className="text-stone-400 hover:text-white">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-white font-bold">{nomeCliente}</h2>
              {mensalista && <span className="text-xs text-green-400">Mensalista</span>}
            </div>
          </div>
          <span className="text-orange-400 font-bold">{fmtR$(total)}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {carrinho.map((item, i) => (
            <div key={item.uid} className="bg-stone-800 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.opcao.nome} ({item.tamanho})
                    {item.nome && <span className="text-orange-400"> · {item.nome}</span>}
                  </p>
                  {item.semItens.length > 0 && (
                    <p className="text-red-400 text-xs">sem: {item.semItens.join(', ')}</p>
                  )}
                  <p className="text-orange-400 text-sm font-bold mt-0.5">{fmtR$(item.preco)}</p>
                </div>
              </div>
              <button
                onClick={() => setCarrinho(prev => prev.filter(m => m.uid !== item.uid))}
                className="text-stone-600 hover:text-red-400 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {/* Pagamento */}
          {!mensalista && (
            <div>
              <p className="text-stone-400 text-sm mb-2">Pagamento</p>
              <div className="grid grid-cols-3 gap-2">
                {['Dinheiro', 'Pix', 'Cartão'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPagamento(p)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      pagamento === p
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-stone-700 text-stone-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div className="bg-green-950 border border-green-800 rounded-xl p-3">
              <p className="text-green-400 font-semibold text-sm">Mensalista</p>
              <p className="text-green-600 text-xs">Cobrado no fechamento mensal</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-800 space-y-3">
          <button
            onClick={novaMarmitex}
            className="w-full border-2 border-dashed border-stone-700 text-stone-400 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Adicionar outra marmitex
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || carrinho.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors"
          >
            {enviando ? 'Salvando...' : `Confirmar pedido · ${fmtR$(total)}`}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: identificar cliente ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold">Pedido rápido</h1>
          <p className="text-stone-400 text-xs">Equipe Fogão a Lenha</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        {/* Cardápio rápido */}
        {cardapioHoje?.carnes?.some(c => c) && (
          <div className="bg-stone-800 rounded-xl p-3">
            <p className="text-orange-400 text-xs font-bold mb-1">🔥 Carnes de hoje</p>
            {cardapioHoje.carnes.filter(c => c).map((c, i) => (
              <p key={i} className="text-stone-300 text-xs">• {c}</p>
            ))}
          </div>
        )}

        <div>
          <label className="text-stone-400 text-sm block mb-2">Nome do cliente</label>
          <div className="relative">
            <input
              ref={nomeRef}
              type="text"
              placeholder="Digite o nome..."
              value={nomeCliente}
              onChange={e => setNomeCliente(e.target.value)}
              autoFocus
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-4 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-lg"
            />
            {mensalista && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-green-800 text-green-300 px-2 py-1 rounded-full">
                Mensalista
              </span>
            )}
          </div>

          {/* Sugestões */}
          {sugestoes.length > 0 && (
            <div className="bg-stone-800 border border-stone-700 rounded-xl mt-1 overflow-hidden">
              {sugestoes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setNomeCliente(c.nome); setSugestoes([]) }}
                  className="w-full text-left px-4 py-3 hover:bg-stone-700 transition-colors border-b border-stone-700 last:border-0"
                >
                  <span className="text-white text-sm">{c.nome}</span>
                  {c.tipo === 'mensalista' && (
                    <span className="ml-2 text-xs text-green-400">mensalista</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={() => { if (nomeCliente.trim()) setStep('montando') }}
          disabled={!nomeCliente.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-base transition-colors"
        >
          Montar pedido →
        </button>
      </div>
    </div>
  )
}
