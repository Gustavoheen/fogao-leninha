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
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 border-b border-stone-800 px-5 py-4 flex items-center gap-4">
          <button onClick={() => setStep(carrinho.length > 0 ? 'revisao' : 'cliente')}
            className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-white active:bg-stone-800 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">Nova marmitex</h2>
            <p className="text-orange-400 text-sm font-medium truncate">{nomeCliente}</p>
          </div>
          {carrinho.length > 0 && (
            <span className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              {carrinho.length} no pedido
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {/* Carnes do dia */}
          {cardapioHoje?.carnes?.some(c => c) && (
            <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5">
              <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">🔥 Carnes do dia</p>
              {cardapioHoje.carnes.filter(c => c).map((c, i) => (
                <p key={i} className="text-stone-100 font-medium text-base leading-relaxed">• {c}</p>
              ))}
            </div>
          )}

          <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold">Escolha a opção e o tamanho</p>

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
                  onClick={() => iniciarMarmitex(op.id, 'P')}
                  className="py-6 flex flex-col items-center gap-2 hover:bg-stone-800 active:bg-stone-700 transition-colors"
                >
                  <span className="text-white font-bold text-lg">Pequena</span>
                  <span className="text-orange-400 font-bold text-lg">{fmtR$(cardapioHoje?.precoP)}</span>
                  <span className="bg-orange-500 rounded-xl w-10 h-10 flex items-center justify-center mt-1">
                    <Plus size={20} className="text-white" />
                  </span>
                </button>
                <button
                  onClick={() => iniciarMarmitex(op.id, 'G')}
                  className="py-6 flex flex-col items-center gap-2 hover:bg-stone-800 active:bg-stone-700 transition-colors"
                >
                  <span className="text-white font-bold text-lg">Grande</span>
                  <span className="text-orange-400 font-bold text-lg">{fmtR$(cardapioHoje?.precoG)}</span>
                  <span className="bg-orange-500 rounded-xl w-10 h-10 flex items-center justify-center mt-1">
                    <Plus size={20} className="text-white" />
                  </span>
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
        {/* Header */}
        <div className="bg-stone-900 border-b border-stone-800 px-5 py-4 flex items-center gap-4">
          <button onClick={() => setMarmitexAtual(null)}
            className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-white active:bg-stone-800 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight">
              {marmitexAtual.opcao?.nome}
              <span className="text-orange-400"> · {marmitexAtual.tamanho}</span>
            </h2>
            <p className="text-green-400 font-bold text-base">{fmtR$(marmitexAtual.preco)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Nome da marmitex */}
          <div>
            <label className="text-stone-300 text-base font-semibold block mb-2">
              Para quem é essa marmitex? <span className="text-stone-500 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: João, criança, sogra..."
              value={marmitexAtual.nome}
              onChange={e => setMarmitexAtual(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full bg-stone-800 border border-stone-700 rounded-2xl px-5 py-4 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-lg transition-colors"
            />
          </div>

          {/* Acompanhamentos */}
          {acomp.length > 0 && (
            <div>
              <p className="text-stone-300 text-base font-semibold mb-1">Acompanhamentos</p>
              <p className="text-stone-500 text-sm mb-4">Toque para remover o que o cliente NÃO quer</p>
              <div className="flex flex-wrap gap-3">
                {acomp.map(item => {
                  const removido = marmitexAtual.semItens.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => toggleSemItem(item)}
                      className={`px-5 py-3 rounded-2xl text-base font-semibold border-2 transition-all flex items-center gap-2 ${
                        removido
                          ? 'bg-red-950 border-red-600 text-red-400 opacity-70'
                          : 'bg-stone-800 border-stone-600 text-white active:bg-stone-700'
                      }`}
                    >
                      {removido ? <X size={15} /> : null}
                      <span className={removido ? 'line-through' : ''}>{item}</span>
                    </button>
                  )
                })}
              </div>
              {marmitexAtual.semItens.length > 0 && (
                <div className="mt-4 bg-red-950/60 border border-red-800 rounded-xl px-4 py-3">
                  <p className="text-red-400 font-semibold text-sm">
                    ✗ Sem: {marmitexAtual.semItens.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-stone-800">
          <button
            onClick={adicionarMarmitex}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-5 rounded-2xl text-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            Adicionar ao pedido
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: revisão do carrinho ────────────────────────────────────────────────
  if (step === 'revisao') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 border-b border-stone-800 px-5 py-4 flex items-center gap-4">
          <button onClick={() => setStep('cliente')}
            className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-white active:bg-stone-800 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">{nomeCliente}</h2>
            {mensalista
              ? <span className="text-green-400 text-sm font-semibold">✓ Mensalista</span>
              : <span className="text-stone-400 text-sm">{carrinho.length} {carrinho.length === 1 ? 'marmitex' : 'marmitex'}</span>
            }
          </div>
          <span className="text-orange-400 font-black text-xl">{fmtR$(total)}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {/* Itens */}
          <p className="text-stone-500 text-xs uppercase tracking-widest font-semibold">Itens do pedido</p>
          {carrinho.map((item, i) => (
            <div key={item.uid} className="bg-stone-900 border border-stone-700 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base leading-tight">
                  {item.opcao.nome}
                  <span className="text-orange-400"> · {item.tamanho}</span>
                </p>
                {item.nome && <p className="text-stone-400 text-sm mt-1">para: {item.nome}</p>}
                {item.semItens.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">✗ sem: {item.semItens.join(', ')}</p>
                )}
                <p className="text-orange-400 font-bold text-lg mt-2">{fmtR$(item.preco)}</p>
              </div>
              <button
                onClick={() => setCarrinho(prev => prev.filter(m => m.uid !== item.uid))}
                className="text-stone-600 hover:text-red-400 transition-colors p-2 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          ))}

          {/* Pagamento */}
          {!mensalista && (
            <div>
              <p className="text-stone-300 text-base font-semibold mb-3">Forma de pagamento</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Dinheiro', emoji: '💵' },
                  { label: 'Pix', emoji: '💠' },
                  { label: 'Cartão', emoji: '💳' },
                ].map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => setPagamento(label)}
                    className={`py-5 rounded-2xl font-bold border-2 transition-colors flex flex-col items-center gap-1 ${
                      pagamento === label
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-stone-700 bg-stone-800 text-stone-400 active:bg-stone-700'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div className="bg-green-950 border border-green-800 rounded-2xl p-5">
              <p className="text-green-400 font-bold text-lg">📋 Conta mensalista</p>
              <p className="text-green-600 text-sm mt-1">Cobrado no fechamento mensal</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-stone-800 space-y-3">
          <button
            onClick={novaMarmitex}
            className="w-full border-2 border-dashed border-stone-600 hover:border-orange-500 text-stone-400 hover:text-orange-400 py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} /> Adicionar outra marmitex
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || carrinho.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-black py-5 rounded-2xl text-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            {enviando ? 'Salvando...' : `✓ Confirmar · ${fmtR$(total)}`}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: identificar cliente ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
          <Zap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-black text-lg leading-tight">Pedido rápido</h1>
          <p className="text-stone-400 text-sm">Equipe Fogão a Lenha</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Carnes do dia */}
        {cardapioHoje?.carnes?.some(c => c) && (
          <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5">
            <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">🔥 Carnes de hoje</p>
            {cardapioHoje.carnes.filter(c => c).map((c, i) => (
              <p key={i} className="text-stone-100 font-medium text-base leading-relaxed">• {c}</p>
            ))}
          </div>
        )}

        <div>
          <label className="text-stone-300 text-base font-semibold block mb-3">Nome do cliente</label>
          <div className="relative">
            <input
              ref={nomeRef}
              type="text"
              placeholder="Digite o nome..."
              value={nomeCliente}
              onChange={e => setNomeCliente(e.target.value)}
              autoFocus
              className="w-full bg-stone-800 border border-stone-700 rounded-2xl px-5 py-5 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 text-xl font-semibold transition-colors"
            />
            {mensalista && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm bg-green-800 text-green-300 px-3 py-1.5 rounded-full font-semibold">
                Mensalista
              </span>
            )}
          </div>

          {/* Sugestões */}
          {sugestoes.length > 0 && (
            <div className="bg-stone-800 border border-stone-700 rounded-2xl mt-2 overflow-hidden shadow-xl">
              {sugestoes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setNomeCliente(c.nome); setSugestoes([]) }}
                  className="w-full text-left px-5 py-4 hover:bg-stone-700 active:bg-stone-600 transition-colors border-b border-stone-700 last:border-0 flex items-center justify-between"
                >
                  <span className="text-white font-semibold text-base">{c.nome}</span>
                  {c.tipo === 'mensalista' && (
                    <span className="text-sm text-green-400 font-semibold bg-green-950 px-2 py-0.5 rounded-full">mensalista</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 border-t border-stone-800">
        <button
          onClick={() => { if (nomeCliente.trim()) setStep('montando') }}
          disabled={!nomeCliente.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 text-white font-black py-5 rounded-2xl text-xl transition-colors shadow-lg shadow-orange-500/20"
        >
          Montar pedido →
        </button>
      </div>
    </div>
  )
}
