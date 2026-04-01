import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  MessageSquare, User, Bot, Phone, Send, UserCheck,
  RefreshCw, Circle, AlertCircle, CheckCircle, Clock,
  Mic, Image, Plus, X,
} from 'lucide-react'

const BOT_URL = import.meta.env.VITE_BOT_URL || 'https://fogao-bot.up.railway.app'
const API_KEY = 'fogao2024'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function fmtData(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoje = new Date()
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1)
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function tempoAtras(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

const MODO_CONFIG = {
  bot:        { cor: '#16a34a', bg: 'rgba(22,163,74,0.1)',   label: 'Bot',       icon: Bot },
  humano:     { cor: '#2563eb', bg: 'rgba(37,99,235,0.1)',   label: 'Humano',    icon: UserCheck },
  aguardando: { cor: '#d97706', bg: 'rgba(217,119,6,0.1)',   label: 'Aguardando', icon: AlertCircle },
}

function BadgeModo({ modo }) {
  const cfg = MODO_CONFIG[modo] || MODO_CONFIG.bot
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: cfg.cor, background: cfg.bg,
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

// ── Card de conversa na lista ──────────────────────────────────────────────
function CardConversa({ sessao, ativa, onClick, ultimaMensagem }) {
  const aguardando = sessao.modo === 'aguardando'
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px',
        background: ativa ? 'rgba(200,34,26,0.1)' : aguardando ? 'rgba(217,119,6,0.05)' : 'transparent',
        borderLeft: ativa ? '3px solid #C8221A' : aguardando ? '3px solid #d97706' : '3px solid transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: aguardando ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: aguardando ? '#d97706' : 'rgba(255,255,255,0.6)',
        }}>
          {(sessao.nome || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: aguardando ? '#d97706' : 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {sessao.nome || sessao.telefone}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {tempoAtras(sessao.atualizado_em)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
              {ultimaMensagem?.conteudo?.slice(0, 40) || sessao.etapa}
            </span>
            <BadgeModo modo={sessao.modo} />
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Bolha de mensagem ──────────────────────────────────────────────────────
function Bolha({ msg }) {
  const isEntrada = msg.direcao === 'entrada'
  const isHumano  = msg.remetente === 'humano'
  const isAudio   = msg.tipo === 'audio'
  const isImagem  = msg.tipo === 'imagem'

  return (
    <div style={{
      display: 'flex', flexDirection: isEntrada ? 'row' : 'row-reverse',
      gap: 6, marginBottom: 6, alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: isEntrada ? 'rgba(249,115,22,0.2)' : isHumano ? 'rgba(37,99,235,0.2)' : 'rgba(22,163,74,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isEntrada ? <User size={12} color="#f97316" /> : isHumano ? <UserCheck size={12} color="#3b82f6" /> : <Bot size={12} color="#16a34a" />}
      </div>

      {/* Conteúdo */}
      <div style={{
        maxWidth: '75%',
        background: isEntrada ? 'rgba(255,255,255,0.07)' : isHumano ? 'rgba(37,99,235,0.2)' : 'rgba(22,163,74,0.15)',
        borderRadius: isEntrada ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
        padding: '8px 12px',
        border: `1px solid ${isEntrada ? 'rgba(255,255,255,0.06)' : isHumano ? 'rgba(37,99,235,0.2)' : 'rgba(22,163,74,0.2)'}`,
      }}>
        {isAudio && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: msg.transcricao ? 6 : 0 }}>
            <Mic size={14} color="#f97316" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Áudio</span>
          </div>
        )}
        {isImagem && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: msg.conteudo ? 4 : 0 }}>
            <Image size={14} color="#a78bfa" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Imagem</span>
          </div>
        )}
        {msg.transcricao && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginBottom: 4 }}>
            🎤 &ldquo;{msg.transcricao}&rdquo;
          </div>
        )}
        {msg.conteudo && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.conteudo}
          </p>
        )}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0', textAlign: isEntrada ? 'left' : 'right' }}>
          {fmtHora(msg.criado_em)} · {msg.remetente}
        </p>
      </div>
    </div>
  )
}

// ── Modal pedido manual ────────────────────────────────────────────────────
function ModalPedidoManual({ sessao, cardapio, onClose, onConfirmar }) {
  const ops = cardapio?.opcoes?.filter(o => o.disponivel !== false) || []
  const carnes = cardapio?.carnes?.filter(Boolean) || []
  const [opcaoIdx, setOpcaoIdx] = useState(0)
  const [tamanho, setTamanho] = useState('P')
  const [carne, setCarne] = useState('')
  const [nome, setNome] = useState(sessao?.nome || '')
  const [pagamento, setPagamento] = useState('Dinheiro')
  const [obs, setObs] = useState('')

  const op = ops[opcaoIdx]
  const precisaCarne = op?.tipoCarnes === 'globais' && carnes.length > 0
  const preco = Number(tamanho === 'P' ? cardapio?.precoP : cardapio?.precoG) || 0

  function confirmar() {
    if (!op) return
    if (precisaCarne && !carne) return alert('Selecione a carne')
    onConfirmar({ op, tamanho, carne: precisaCarne ? carne : (op?.pratoEspecial || ''), nome, pagamento, obs, preco })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: '#1a1008', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Registrar pedido manual</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Nome do cliente</label>
            <input data-nocase value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" style={{ width: '100%', background: '#0f0a07', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Opção</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ops.map((op, i) => (
                <button key={i} onClick={() => { setOpcaoIdx(i); setCarne('') }} style={{ padding: '10px', borderRadius: 10, border: `2px solid ${opcaoIdx === i ? '#f97316' : 'rgba(255,255,255,0.08)'}`, background: opcaoIdx === i ? 'rgba(249,115,22,0.12)' : '#0f0a07', color: opcaoIdx === i ? '#f97316' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {op.nome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Tamanho</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['P', 'Pequena', cardapio?.precoP], ['G', 'Grande', cardapio?.precoG]].map(([v, l, p]) => (
                <button key={v} onClick={() => setTamanho(v)} style={{ padding: '10px', borderRadius: 10, border: `2px solid ${tamanho === v ? '#f97316' : 'rgba(255,255,255,0.08)'}`, background: tamanho === v ? 'rgba(249,115,22,0.12)' : '#0f0a07', color: tamanho === v ? '#f97316' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {l} — R${p}
                </button>
              ))}
            </div>
          </div>

          {precisaCarne && (
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Carne</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {carnes.map(c => (
                  <button key={c} onClick={() => setCarne(c)} style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${carne === c ? '#f97316' : 'rgba(255,255,255,0.1)'}`, background: carne === c ? '#f97316' : '#0f0a07', color: carne === c ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Dinheiro', 'Pix'].map(p => (
                <button key={p} onClick={() => setPagamento(p)} style={{ padding: '9px', borderRadius: 10, border: `2px solid ${pagamento === p ? '#f97316' : 'rgba(255,255,255,0.08)'}`, background: pagamento === p ? 'rgba(249,115,22,0.12)' : '#0f0a07', color: pagamento === p ? '#f97316' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Observação</label>
            <input data-nocase value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" style={{ width: '100%', background: '#0f0a07', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <button onClick={confirmar} style={{ padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 4 }}>
            Confirmar pedido — R${preco.toFixed(2).replace('.', ',')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Atendimento() {
  const [sessoes, setSessoes]         = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [mensagens, setMensagens]     = useState([])
  const [texto, setTexto]             = useState('')
  const [enviando, setEnviando]       = useState(false)
  const [cardapio, setCardapio]       = useState(null)
  const [modalPedido, setModalPedido] = useState(false)
  const [filtro, setFiltro]           = useState('todos') // todos | aguardando | humano | bot
  const msgEndRef = useRef(null)

  // ── Carga inicial ──────────────────────────────────────────────────────
  useEffect(() => {
    carregarSessoes()
    carregarCardapio()

    // Realtime: sessões
    const canalSessoes = supabase
      .channel('atendimento-sessoes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_sessoes' }, payload => {
        carregarSessoes()
        // Notificação de aguardando
        if (payload.new?.modo === 'aguardando') {
          try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
        }
      })
      .subscribe()

    // Realtime: mensagens
    const canalMsgs = supabase
      .channel('atendimento-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_mensagens' }, payload => {
        if (payload.new?.telefone === selecionadaRef.current) {
          setMensagens(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canalSessoes)
      supabase.removeChannel(canalMsgs)
    }
  }, [])

  const selecionadaRef = useRef(selecionada)
  useEffect(() => { selecionadaRef.current = selecionada }, [selecionada])

  // Scroll automático ao receber mensagem
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function carregarSessoes() {
    const { data } = await supabase
      .from('whatsapp_sessoes')
      .select('*')
      .order('atualizado_em', { ascending: false })
    setSessoes(data || [])
  }

  async function carregarCardapio() {
    const { data } = await supabase.from('cardapio_hoje').select('*').eq('id', 1).single()
    setCardapio(data)
  }

  async function selecionarConversa(telefone) {
    setSelecionada(telefone)
    const { data } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('telefone', telefone)
      .order('criado_em', { ascending: true })
      .limit(100)
    setMensagens(data || [])
  }

  // ── Assumir / devolver atendimento ────────────────────────────────────
  async function setModo(modo) {
    if (!selecionada) return
    try {
      await fetch(`${BOT_URL}/admin/modo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: selecionada, modo, apiKey: API_KEY }),
      })
      await supabase.from('whatsapp_sessoes').update({ modo }).eq('telefone', selecionada)
      setSessoes(prev => prev.map(s => s.telefone === selecionada ? { ...s, modo } : s))
    } catch (e) {
      alert('Erro ao mudar modo: ' + e.message)
    }
  }

  // ── Enviar mensagem como humano ───────────────────────────────────────
  async function enviarMensagem(e) {
    e.preventDefault()
    if (!texto.trim() || !selecionada || enviando) return
    setEnviando(true)
    try {
      await fetch(`${BOT_URL}/admin/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: selecionada, texto: texto.trim(), apiKey: API_KEY }),
      })
      setTexto('')
    } catch (e) {
      alert('Erro ao enviar: ' + e.message)
    } finally {
      setEnviando(false)
    }
  }

  // ── Registrar pedido manual ───────────────────────────────────────────
  async function confirmarPedidoManual({ op, tamanho, carne, nome, pagamento, obs, preco }) {
    const sessao = sessoes.find(s => s.telefone === selecionada)
    const id = Date.now()
    await supabase.from('pedidos').insert({
      id,
      clienteNome: nome || sessao?.nome || 'Cliente',
      clienteTelefone: selecionada?.replace(/\D/g, '') || '',
      itens: [{ tipo: 'marmitex', opcaoId: op.id, opcaoNome: op.nome, tamanho, semItens: [], proteina: carne, obs, preco }],
      total: preco,
      pagamento,
      status: 'aberto',
      statusPagamento: 'pendente',
      origem: 'manual',
      observacoes: obs || '',
      criadoEm: new Date().toISOString(),
    })
    setModalPedido(false)
    alert(`✅ Pedido registrado!\n${op.nome} — ${tamanho === 'P' ? 'Pequena' : 'Grande'}\nR$ ${preco.toFixed(2)}`)
  }

  // ── Listas filtradas ──────────────────────────────────────────────────
  const sessoesFiltradas = sessoes.filter(s => {
    if (filtro === 'todos') return true
    return s.modo === filtro
  })

  const contadores = {
    todos:      sessoes.length,
    aguardando: sessoes.filter(s => s.modo === 'aguardando').length,
    humano:     sessoes.filter(s => s.modo === 'humano').length,
    bot:        sessoes.filter(s => s.modo === 'bot').length,
  }

  const sessaoAtiva = sessoes.find(s => s.telefone === selecionada)
  const ultimasPorTel = {}
  mensagens.forEach(m => { ultimasPorTel[m.telefone] = m })

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#0f0a07', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>

      {modalPedido && selecionada && (
        <ModalPedidoManual
          sessao={sessaoAtiva}
          cardapio={cardapio}
          onClose={() => setModalPedido(false)}
          onConfirmar={confirmarPedidoManual}
        />
      )}

      {/* ── Lista de conversas ──────────────────────────────────────── */}
      <div style={{ width: 280, minWidth: 280, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#110704' }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>WhatsApp</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {contadores.aguardando > 0 && (
                <span style={{ background: '#d97706', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '2px 7px' }}>
                  {contadores.aguardando} aguardando
                </span>
              )}
              <button onClick={carregarSessoes} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[['todos','Todos'],['aguardando','⚠️'],['humano','👤'],['bot','🤖']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)} style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: filtro === k ? '#C8221A' : 'rgba(255,255,255,0.06)',
                color: filtro === k ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
                {l} {contadores[k] > 0 && <span style={{ marginLeft: 2 }}>({contadores[k]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessoesFiltradas.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              Nenhuma conversa
            </div>
          ) : (
            sessoesFiltradas.map(s => (
              <CardConversa
                key={s.telefone}
                sessao={s}
                ativa={s.telefone === selecionada}
                onClick={() => selecionarConversa(s.telefone)}
                ultimaMensagem={null}
              />
            ))
          )}
        </div>

        {/* Pedido manual sem conversa selecionada */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => { setSelecionada(null); setModalPedido(true) }}
            style={{ width: '100%', padding: '9px', borderRadius: 10, background: 'rgba(249,115,22,0.1)', border: '1px dashed rgba(249,115,22,0.3)', color: '#f97316', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Plus size={14} /> Pedido manual (ligação)
          </button>
        </div>
      </div>

      {/* ── Painel direito ──────────────────────────────────────────── */}
      {!selecionada ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.2)' }}>
          <MessageSquare size={48} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: 14 }}>Selecione uma conversa</p>
          {contadores.aguardando > 0 && (
            <p style={{ fontSize: 12, color: '#d97706' }}>⚠️ {contadores.aguardando} {contadores.aguardando === 1 ? 'cliente aguardando' : 'clientes aguardando'} atendimento</p>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header da conversa */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, background: '#110704' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#f97316', flexShrink: 0 }}>
              {(sessaoAtiva?.nome || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{sessaoAtiva?.nome || selecionada}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{selecionada}</span>
                {sessaoAtiva && <BadgeModo modo={sessaoAtiva.modo} />}
                {sessaoAtiva && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>etapa: {sessaoAtiva.etapa}</span>}
              </div>
            </div>
            {/* Ações */}
            <div style={{ display: 'flex', gap: 8 }}>
              {sessaoAtiva?.modo !== 'humano' ? (
                <button onClick={() => setModo('humano')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserCheck size={13} /> Assumir
                </button>
              ) : (
                <button onClick={() => setModo('bot')} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Bot size={13} /> Devolver ao bot
                </button>
              )}
              <button onClick={() => setModalPedido(true)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                + Pedido
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
            {mensagens.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', paddingTop: 40, fontSize: 13 }}>
                Nenhuma mensagem ainda
              </div>
            ) : (
              <>
                {mensagens.map((m, i) => {
                  const showDate = i === 0 || fmtData(mensagens[i-1]?.criado_em) !== fmtData(m.criado_em)
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 99 }}>
                            {fmtData(m.criado_em)}
                          </span>
                        </div>
                      )}
                      <Bolha msg={m} />
                    </div>
                  )
                })}
                <div ref={msgEndRef} />
              </>
            )}
          </div>

          {/* Input de mensagem */}
          <form onSubmit={enviarMensagem} style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input
              data-nocase
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={sessaoAtiva?.modo === 'humano' ? 'Digite uma mensagem...' : 'Assuma o atendimento para enviar mensagens'}
              disabled={sessaoAtiva?.modo !== 'humano'}
              style={{
                flex: 1, background: '#1a1008', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none',
                opacity: sessaoAtiva?.modo !== 'humano' ? 0.4 : 1,
              }}
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando || sessaoAtiva?.modo !== 'humano'}
              style={{ padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, opacity: !texto.trim() || sessaoAtiva?.modo !== 'humano' ? 0.4 : 1 }}
            >
              <Send size={14} /> {enviando ? '...' : 'Enviar'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
