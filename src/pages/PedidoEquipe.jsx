/**
 * PedidoEquipe — Interface rápida de coleta de pedidos para a equipe via celular.
 * Rota: /equipe
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Check, Plus, X, Zap, User, ShoppingBag, CreditCard } from 'lucide-react'

function fmtR$(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function uid() { return Math.random().toString(36).slice(2, 9) }

// ── Tela de PIN ────────────────────────────────────────────────────────────────
function TelaPIN({ onEntrar }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

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
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: 72, height: 72, background: '#EA580C', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Zap size={36} color="#fff" />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A0E08', margin: '0 0 6px' }}>Área da Equipe</h1>
      <p style={{ fontSize: 16, color: '#9D8878', margin: '0 0 36px' }}>Digite o PIN para acessar</p>

      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        maxLength={6}
        value={pin}
        onChange={e => setPin(e.target.value.slice(0, 6))}
        onKeyDown={e => e.key === 'Enter' && verificar()}
        placeholder="••••"
        style={{
          width: 180, textAlign: 'center', fontSize: 32, fontWeight: 900,
          letterSpacing: '0.4em', background: erro ? '#FEF2F2' : '#FFF7ED',
          border: `3px solid ${erro ? '#EF4444' : '#FED7AA'}`,
          borderRadius: 16, padding: '16px 12px', color: erro ? '#EF4444' : '#1A0E08',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      {erro && <p style={{ color: '#EF4444', fontSize: 15, fontWeight: 600, marginTop: 12 }}>PIN incorreto</p>}

      <button
        onClick={verificar}
        style={{
          marginTop: 24, background: '#EA580C', color: '#fff', fontWeight: 900,
          fontSize: 18, border: 'none', borderRadius: 16, padding: '18px 48px',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,88,12,0.35)',
        }}
      >
        Entrar
      </button>
    </div>
  )
}

// ── Badge de step ──────────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = [
    { key: 'cliente', icon: <User size={16} />, label: 'Cliente' },
    { key: 'montando', icon: <ShoppingBag size={16} />, label: 'Pedido' },
    { key: 'revisao', icon: <CreditCard size={16} />, label: 'Confirmar' },
  ]
  const idx = steps.findIndex(s => s.key === step)
  return (
    <div style={{ display: 'flex', background: '#FFF7ED', borderBottom: '2px solid #FED7AA' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 4px',
          borderBottom: i <= idx ? '3px solid #EA580C' : '3px solid transparent',
          color: i <= idx ? '#EA580C' : '#CFC4BB',
        }}>
          {s.icon}
          <span style={{ fontSize: 11, fontWeight: 700, marginTop: 3 }}>{s.label}</span>
        </div>
      ))}
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
  const [loading, setLoading] = useState(true)

  const [nomeCliente, setNomeCliente] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [mensalista, setMensalista] = useState(null)
  const [clienteCadastrado, setClienteCadastrado] = useState(false)
  const [endereco, setEndereco] = useState({ rua: '', numero: '', bairro: '', referencia: '' })
  const [tipoEntrega, setTipoEntrega] = useState('retirada')
  const [carrinho, setCarrinho] = useState([])
  const [step, setStep] = useState('cliente')
  const [marmitexAtual, setMarmitexAtual] = useState(null)
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
        if (cf?.equipePIN) sessionStorage.setItem('fogao_equipe_pin', cf.equipePIN)
      } catch { /* offline */ }
      finally { setLoading(false) }
    }
    carregar()
  }, [autenticado])

  useEffect(() => {
    if (!nomeCliente.trim() || nomeCliente.length < 2) { setSugestoes([]); setMensalista(null); setClienteCadastrado(false); return }
    const q = nomeCliente.toLowerCase().trim()
    const matches = clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 5)
    setSugestoes(matches)
    const exato = clientes.find(c => c.nome.toLowerCase().trim() === q)
    setMensalista(exato?.tipo === 'mensalista' ? exato : null)
    setClienteCadastrado(!!exato)
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
        tipoEntrega,
        ...(tipoEntrega === 'entrega' ? {
          clienteRua: endereco.rua,
          clienteNumero: endereco.numero,
          clienteBairro: endereco.bairro,
          clienteReferencia: endereco.referencia,
        } : {}),
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
    setClienteCadastrado(false)
    setEndereco({ rua: '', numero: '', bairro: '', referencia: '' })
    setTipoEntrega('retirada')
    setPagamento('Dinheiro')
    setNumeroPedido(null)
    setStep('cliente')
    setTimeout(() => nomeRef.current?.focus(), 100)
  }

  if (!autenticado) return <TelaPIN onEntrar={entrar} />

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '4px solid #FED7AA', borderTopColor: '#EA580C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#9D8878', fontSize: 16, fontWeight: 600 }}>Carregando cardápio...</p>
    </div>
  )

  // ── CONFIRMADO ───────────────────────────────────────────────────────────────
  if (step === 'confirmado') {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Check size={36} color="#fff" />
        </div>
        <p style={{ fontSize: 16, color: '#9D8878', fontWeight: 600, margin: '0 0 8px' }}>Pedido salvo!</p>
        <div style={{ background: '#EA580C', color: '#fff', fontSize: 64, fontWeight: 900, borderRadius: 20, padding: '12px 36px', margin: '0 0 16px', lineHeight: 1 }}>
          #{String(numeroPedido).padStart(2, '0')}
        </div>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#1A0E08', margin: '0 0 4px' }}>{nomeCliente}</p>
        <p style={{ fontSize: 26, fontWeight: 900, color: '#EA580C', margin: '0 0 20px' }}>{fmtR$(total)}</p>

        <div style={{ background: '#FFF7ED', borderRadius: 16, padding: '16px 24px', marginBottom: 32, width: '100%', maxWidth: 320 }}>
          {carrinho.map((m, i) => (
            <p key={i} style={{ fontSize: 15, color: '#6B5A4E', fontWeight: 600, margin: '4px 0' }}>
              {m.opcao.nome} ({m.tamanho}){m.nome && ` · ${m.nome}`}
            </p>
          ))}
        </div>

        <button
          onClick={novoPedido}
          style={{
            background: '#EA580C', color: '#fff', fontWeight: 900, fontSize: 20,
            border: 'none', borderRadius: 16, padding: '20px 48px',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,88,12,0.35)',
            width: '100%', maxWidth: 320,
          }}
        >
          Próximo pedido
        </button>
      </div>
    )
  }

  // ── MONTANDO: escolher opção ─────────────────────────────────────────────────
  if (step === 'montando' && !marmitexAtual) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#EA580C', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setStep(carrinho.length > 0 ? 'revisao' : 'cliente')}
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={24} color="#fff" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, margin: 0 }}>Nova marmitex para</p>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeCliente}</h2>
          </div>
          {carrinho.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '6px 12px' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{carrinho.length} no pedido</span>
            </div>
          )}
        </div>

        <StepBar step="montando" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Carnes do dia */}
          {cardapioHoje?.carnes?.some(c => c) && (
            <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: 16, padding: '14px 18px' }}>
              <p style={{ color: '#EA580C', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>🔥 Carnes do dia</p>
              {cardapioHoje.carnes.filter(c => c).map((c, i) => (
                <p key={i} style={{ fontSize: 17, color: '#1A0E08', fontWeight: 600, margin: '4px 0', lineHeight: 1.4 }}>• {c}</p>
              ))}
            </div>
          )}

          <p style={{ fontSize: 13, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Escolha a opção e o tamanho
          </p>

          {opcoes.length === 0 && (
            <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: '#9D8878', fontWeight: 600 }}>Nenhuma opção disponível no cardápio de hoje.</p>
              <p style={{ fontSize: 14, color: '#CFC4BB', marginTop: 8 }}>Configure o cardápio no painel admin.</p>
            </div>
          )}

          {opcoes.map(op => (
            <div key={op.id} style={{ background: '#fff', border: '2px solid #E6DDD5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {/* Nome da opção */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '1.5px solid #F3F0ED' }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1A0E08', margin: '0 0 6px' }}>{op.nome}</h3>
                {op.acompanhamentos?.length > 0 && (
                  <p style={{ fontSize: 14, color: '#9D8878', margin: 0, lineHeight: 1.5 }}>
                    {op.acompanhamentos.join(' · ')}
                  </p>
                )}
              </div>
              {/* Botões P / G */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {cardapioHoje?.precoP > 0 && (
                  <button
                    onClick={() => iniciarMarmitex(op.id, 'P')}
                    style={{
                      padding: '22px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: '#fff', border: 'none', borderRight: '1.5px solid #F3F0ED', cursor: 'pointer',
                    }}
                    onTouchStart={e => e.currentTarget.style.background = '#FFF7ED'}
                    onTouchEnd={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pequena</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#EA580C' }}>{fmtR$(cardapioHoje?.precoP)}</span>
                    <div style={{ width: 44, height: 44, background: '#EA580C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={22} color="#fff" />
                    </div>
                  </button>
                )}
                {cardapioHoje?.precoG > 0 && (
                  <button
                    onClick={() => iniciarMarmitex(op.id, 'G')}
                    style={{
                      padding: '22px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: '#fff', border: 'none', cursor: 'pointer',
                    }}
                    onTouchStart={e => e.currentTarget.style.background = '#FFF7ED'}
                    onTouchEnd={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grande</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#EA580C' }}>{fmtR$(cardapioHoje?.precoG)}</span>
                    <div style={{ width: 44, height: 44, background: '#1A0E08', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={22} color="#fff" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── MONTANDO: acompanhamentos ─────────────────────────────────────────────────
  if (step === 'montando' && marmitexAtual) {
    const acomp = marmitexAtual.opcao?.acompanhamentos || []
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#EA580C', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setMarmitexAtual(null)}
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={24} color="#fff" />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, margin: 0 }}>Configurando</p>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0 }}>
              {marmitexAtual.opcao?.nome} · {marmitexAtual.tamanho}
            </h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '6px 12px' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>{fmtR$(marmitexAtual.preco)}</span>
          </div>
        </div>

        <StepBar step="montando" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Para quem */}
          <div>
            <label style={{ fontSize: 16, fontWeight: 800, color: '#1A0E08', display: 'block', marginBottom: 8 }}>
              Para quem é essa marmitex?
              <span style={{ fontSize: 14, fontWeight: 500, color: '#9D8878', marginLeft: 6 }}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: João, criança, sogra..."
              value={marmitexAtual.nome}
              onChange={e => setMarmitexAtual(prev => ({ ...prev, nome: e.target.value }))}
              style={{
                width: '100%', background: '#FFF7ED', border: '2px solid #FED7AA',
                borderRadius: 14, padding: '16px 18px', fontSize: 18, fontWeight: 600,
                color: '#1A0E08', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Acompanhamentos */}
          {acomp.length > 0 && (
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A0E08', margin: '0 0 4px' }}>Acompanhamentos</p>
              <p style={{ fontSize: 14, color: '#9D8878', fontWeight: 500, margin: '0 0 14px' }}>
                Toque para remover o que o cliente <strong>NÃO</strong> quer
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {acomp.map(item => {
                  const removido = marmitexAtual.semItens.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() => toggleSemItem(item)}
                      style={{
                        padding: '12px 18px', borderRadius: 40, fontSize: 16, fontWeight: 700,
                        border: `2px solid ${removido ? '#EF4444' : '#E6DDD5'}`,
                        background: removido ? '#FEF2F2' : '#F7F3EF',
                        color: removido ? '#EF4444' : '#1A0E08',
                        textDecoration: removido ? 'line-through' : 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        minHeight: 48,
                      }}
                    >
                      {removido && <X size={14} />}
                      {item}
                    </button>
                  )
                })}
              </div>
              {marmitexAtual.semItens.length > 0 && (
                <div style={{ marginTop: 14, background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ color: '#EF4444', fontWeight: 700, fontSize: 15, margin: 0 }}>
                    ✗ Sem: {marmitexAtual.semItens.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 16px', borderTop: '2px solid #F3F0ED', background: '#fff', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={adicionarMarmitex}
            style={{
              width: '100%', background: '#EA580C', color: '#fff', fontWeight: 900,
              fontSize: 20, border: 'none', borderRadius: 16, padding: '20px 0',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,88,12,0.35)',
            }}
          >
            Adicionar ao pedido ✓
          </button>
        </div>
      </div>
    )
  }

  // ── REVISÃO ──────────────────────────────────────────────────────────────────
  if (step === 'revisao') {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#EA580C', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setStep('cliente')}
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={24} color="#fff" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, margin: 0 }}>Revisar pedido</p>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeCliente}</h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 12, padding: '8px 14px' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{fmtR$(total)}</span>
          </div>
        </div>

        <StepBar step="revisao" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Itens */}
          <p style={{ fontSize: 13, fontWeight: 800, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Itens do pedido
          </p>

          {carrinho.map((item, i) => (
            <div key={item.uid} style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: '#EA580C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#1A0E08', margin: '0 0 4px' }}>
                  {item.opcao.nome}
                  <span style={{ color: '#EA580C', fontWeight: 700 }}> · {item.tamanho}</span>
                </p>
                {item.nome && <p style={{ fontSize: 14, color: '#6B5A4E', margin: '2px 0', fontWeight: 600 }}>para: {item.nome}</p>}
                {item.semItens.length > 0 && (
                  <p style={{ fontSize: 13, color: '#EF4444', margin: '2px 0', fontWeight: 600 }}>✗ sem: {item.semItens.join(', ')}</p>
                )}
                <p style={{ fontSize: 20, fontWeight: 900, color: '#EA580C', margin: '8px 0 0' }}>{fmtR$(item.preco)}</p>
              </div>
              <button
                onClick={() => setCarrinho(prev => prev.filter(m => m.uid !== item.uid))}
                style={{ background: '#FECACA', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#EF4444', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>
          ))}

          {/* Pagamento */}
          {!mensalista && (
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A0E08', margin: '0 0 12px' }}>Forma de pagamento</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Dinheiro', emoji: '💵' },
                  { label: 'Pix', emoji: '💠' },
                  { label: 'Cartão', emoji: '💳' },
                ].map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => setPagamento(label)}
                    style={{
                      padding: '18px 8px', borderRadius: 16, fontWeight: 800,
                      border: `2.5px solid ${pagamento === label ? '#EA580C' : '#E6DDD5'}`,
                      background: pagamento === label ? '#FFF7ED' : '#fff',
                      color: pagamento === label ? '#EA580C' : '#9D8878',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{emoji}</span>
                    <span style={{ fontSize: 14 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensalista && (
            <div style={{ background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 16, padding: '16px 20px' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#16A34A', margin: '0 0 4px' }}>📋 Conta mensalista</p>
              <p style={{ fontSize: 14, color: '#4ADE80', fontWeight: 600, margin: 0 }}>Cobrado no fechamento mensal</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 16px', borderTop: '2px solid #F3F0ED', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => { setMarmitexAtual(null); setStep('montando') }}
            style={{
              width: '100%', border: '2px dashed #FED7AA', background: '#fff',
              color: '#EA580C', fontWeight: 800, fontSize: 16,
              borderRadius: 16, padding: '16px 0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Plus size={18} /> Adicionar outra marmitex
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || carrinho.length === 0}
            style={{
              width: '100%', background: enviando || carrinho.length === 0 ? '#E6DDD5' : '#16A34A',
              color: '#fff', fontWeight: 900, fontSize: 20,
              border: 'none', borderRadius: 16, padding: '20px 0',
              cursor: enviando || carrinho.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: carrinho.length > 0 ? '0 4px 16px rgba(22,163,74,0.35)' : 'none',
            }}
          >
            {enviando ? 'Salvando...' : `✓ Confirmar · ${fmtR$(total)}`}
          </button>
        </div>
      </div>
    )
  }

  // ── CLIENTE ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#EA580C', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: 0, lineHeight: 1.1 }}>Pedido rápido</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, margin: 0 }}>Equipe Fogão a Lenha</p>
        </div>
      </div>

      <StepBar step="cliente" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Carnes do dia */}
        {cardapioHoje?.carnes?.some(c => c) && (
          <div style={{ background: '#FFF7ED', border: '2px solid #FED7AA', borderRadius: 16, padding: '14px 18px' }}>
            <p style={{ color: '#EA580C', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>🔥 Carnes de hoje</p>
            {cardapioHoje.carnes.filter(c => c).map((c, i) => (
              <p key={i} style={{ fontSize: 17, color: '#1A0E08', fontWeight: 600, margin: '4px 0', lineHeight: 1.4 }}>• {c}</p>
            ))}
          </div>
        )}

        {/* Input nome */}
        <div>
          <label style={{ fontSize: 18, fontWeight: 800, color: '#1A0E08', display: 'block', marginBottom: 10 }}>
            Nome do cliente
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={nomeRef}
              type="text"
              placeholder="Digite o nome..."
              value={nomeCliente}
              onChange={e => setNomeCliente(e.target.value)}
              autoFocus
              style={{
                width: '100%', background: '#FFF7ED', border: '2.5px solid #FED7AA',
                borderRadius: 16, padding: '20px 18px', fontSize: 22, fontWeight: 700,
                color: '#1A0E08', outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(234,88,12,0.10)',
              }}
              onFocus={e => e.target.style.borderColor = '#EA580C'}
              onBlur={e => e.target.style.borderColor = '#FED7AA'}
            />
            {mensalista && (
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: '#DCFCE7', color: '#16A34A', fontSize: 13, fontWeight: 800,
                padding: '6px 12px', borderRadius: 20, border: '1.5px solid #BBF7D0',
              }}>
                ✓ Mensalista
              </span>
            )}
          </div>

          {/* Sugestões */}
          {sugestoes.length > 0 && (
            <div style={{ background: '#fff', border: '2px solid #FED7AA', borderRadius: 16, marginTop: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(234,88,12,0.15)' }}>
              {sugestoes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setNomeCliente(c.nome); setSugestoes([]) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 18px',
                    background: '#fff', border: 'none', borderBottom: '1px solid #FFF7ED',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#1A0E08' }}>{c.nome}</span>
                  {c.tipo === 'mensalista' && (
                    <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '4px 10px', borderRadius: 20 }}>mensalista</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tipo de entrega — mostra sempre */}
        <div>
          <label style={{ fontSize: 18, fontWeight: 800, color: '#1A0E08', display: 'block', marginBottom: 10 }}>
            Tipo de entrega
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ value: 'retirada', emoji: '🏠', label: 'Retirar no local' }, { value: 'entrega', emoji: '🛵', label: 'Entrega' }].map(op => (
              <button key={op.value} onClick={() => setTipoEntrega(op.value)}
                style={{
                  padding: '18px 10px', borderRadius: 16, fontWeight: 800, fontSize: 16,
                  border: `2.5px solid ${tipoEntrega === op.value ? '#EA580C' : '#E6DDD5'}`,
                  background: tipoEntrega === op.value ? '#FFF7ED' : '#fff',
                  color: tipoEntrega === op.value ? '#EA580C' : '#9D8878',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <span style={{ fontSize: 26 }}>{op.emoji}</span>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Endereço — só para entrega e cliente não cadastrado */}
        {tipoEntrega === 'entrega' && !clienteCadastrado && (
          <div style={{ background: '#F0F9FF', border: '2px solid #BFDBFE', borderRadius: 16, padding: '16px 18px' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8', margin: '0 0 14px' }}>📍 Endereço de entrega</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'rua', label: 'Rua', placeholder: 'Nome da rua' },
                { key: 'numero', label: 'Número', placeholder: 'Ex: 123' },
                { key: 'bairro', label: 'Bairro', placeholder: 'Nome do bairro' },
                { key: 'referencia', label: 'Referência', placeholder: 'Ex: próximo ao mercado' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={endereco[f.key]}
                    onChange={e => setEndereco(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', background: '#fff', border: '2px solid #BFDBFE',
                      borderRadius: 12, padding: '14px 16px', fontSize: 16, fontWeight: 600,
                      color: '#1A0E08', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {tipoEntrega === 'entrega' && clienteCadastrado && (
          <div style={{ background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 16, padding: '14px 18px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#16A34A', margin: 0 }}>
              ✓ Cliente cadastrado — endereço já salvo no sistema
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 16px', borderTop: '2px solid #F3F0ED', background: '#fff', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => { if (nomeCliente.trim()) setStep('montando') }}
          disabled={!nomeCliente.trim()}
          style={{
            width: '100%', background: nomeCliente.trim() ? '#EA580C' : '#E6DDD5',
            color: '#fff', fontWeight: 900, fontSize: 22,
            border: 'none', borderRadius: 16, padding: '22px 0',
            cursor: nomeCliente.trim() ? 'pointer' : 'not-allowed',
            boxShadow: nomeCliente.trim() ? '0 4px 16px rgba(234,88,12,0.35)' : 'none',
          }}
        >
          Montar pedido →
        </button>
      </div>
    </div>
  )
}
