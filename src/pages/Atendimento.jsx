import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MessageSquare, Bot, UserCheck, RefreshCw, Send, Power, Settings, AlertTriangle, X } from 'lucide-react'

export default function Atendimento() {
  const [sessoes, setSessoes] = useState([])
  const [alertas, setAlertas] = useState([])
  const [selecionada, setSelecionada] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [botStatus, setBotStatus] = useState(null)
  const [botModo, setBotModo] = useState('auto')
  const [botDicas, setBotDicas] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msgStatus, setMsgStatus] = useState('')
  const [tab, setTab] = useState('conversas') // conversas | config
  const chatRef = useRef(null)

  // ── Carga inicial + polling ─────────────────────────────
  useEffect(() => {
    carregarTudo()
    const poll = setInterval(carregarTudo, 10000)
    return () => clearInterval(poll)
  }, [])

  async function carregarTudo() {
    try {
      const [sessRes, alertRes, statusRes, configRes] = await Promise.all([
        fetch('/api/whatsapp/sessoes').then(r => r.json()).catch(() => []),
        fetch('/api/whatsapp/alertas?status=aberto').then(r => r.json()).catch(() => []),
        fetch('/api/whatsapp/instance').then(r => r.json()).catch(() => null),
        supabase.from('configuracoes').select('bot_ativo, bot_dicas').eq('id', 1).single(),
      ])
      setSessoes(sessRes)
      setAlertas(alertRes)
      setBotStatus(statusRes)
      if (configRes.data) {
        setBotModo(configRes.data.bot_ativo || 'auto')
        setBotDicas(configRes.data.bot_dicas || '')
      }
    } catch {}
  }

  // ── Scroll chat ─────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [selecionada, sessoes])

  const sessaoAtiva = sessoes.find(s => s.telefone === selecionada)
  const historico = sessaoAtiva?.ia_historico || []

  // ── Ações ───────────────────────────────────────────────
  async function toggleHumano(tel, ativar) {
    await fetch('/api/whatsapp/sessoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: tel, humano_ativo: ativar }),
    })
    carregarTudo()
  }

  async function enviarMsg(e) {
    e.preventDefault()
    if (!texto.trim() || !selecionada || enviando) return
    setEnviando(true)
    await fetch('/api/whatsapp/sessoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: selecionada, mensagem: texto.trim() }),
    })
    setTexto('')
    setEnviando(false)
    setTimeout(carregarTudo, 1000)
  }

  async function deletarSessao(tel) {
    await fetch(`/api/whatsapp/sessoes?telefone=${tel}`, { method: 'DELETE' })
    if (selecionada === tel) setSelecionada(null)
    carregarTudo()
  }

  async function resolverAlerta(id) {
    await fetch('/api/whatsapp/alertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resposta: 'Resolvido', respondido_por: 'admin' }),
    })
    carregarTudo()
  }

  async function salvarConfig() {
    setSalvando(true)
    await supabase.from('configuracoes').update({ bot_ativo: botModo, bot_dicas: botDicas }).eq('id', 1)
    setMsgStatus('Salvo!')
    setTimeout(() => setMsgStatus(''), 2000)
    setSalvando(false)
  }

  // ── Render ──────────────────────────────────────────────
  const S = { card: { background: '#1a1008', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: '#0f0a07' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessageSquare size={18} color="#f97316" />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>WhatsApp Bot</h2>
          {botStatus && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: botStatus.connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: botStatus.connected ? '#22c55e' : '#ef4444',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              {botStatus.connected ? 'Conectado' : 'Desconectado'}
            </span>
          )}
          {alertas.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>
              {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['conversas', 'config'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t ? '#f97316' : 'rgba(255,255,255,0.06)',
              color: tab === t ? '#000' : '#999',
            }}>
              {t === 'conversas' ? '💬 Conversas' : '⚙️ Configurações'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA CONVERSAS ──────────────────────────────── */}
      {tab === 'conversas' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Lista lateral */}
          <div style={{ width: 300, minWidth: 300, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#110704' }}>

            {/* Alertas */}
            {alertas.length > 0 && (
              <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {alertas.map(a => (
                  <div key={a.id} style={{
                    background: a.tipo === 'atraso' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${a.tipo === 'atraso' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 8, padding: '6px 10px', marginBottom: 4, fontSize: 11,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: a.tipo === 'atraso' ? '#eab308' : '#ef4444', fontWeight: 600 }}>
                        {a.tipo === 'atraso' ? '⏰' : '👎'} {a.nome_contato || a.telefone}
                      </span>
                      <button onClick={() => resolverAlerta(a.id)} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 11 }}>✓</button>
                    </div>
                    <p style={{ color: '#999', fontSize: 10, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{a.mensagem}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Botão liga/desliga rápido */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: botModo !== 'desligado' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {botModo !== 'desligado' ? '🟢 Bot ativo' : '🔴 Bot desligado'}
              </span>
              <button onClick={async () => {
                const novo = botModo === 'desligado' ? 'auto' : 'desligado'
                setBotModo(novo)
                await supabase.from('configuracoes').update({ bot_ativo: novo }).eq('id', 1)
              }} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: botModo !== 'desligado' ? '#ef4444' : '#22c55e', color: '#fff',
              }}>
                {botModo !== 'desligado' ? 'Desligar' : 'Ligar'}
              </button>
            </div>

            {/* Lista de sessões */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sessoes.length === 0 ? (
                <p style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 20 }}>Nenhuma conversa</p>
              ) : sessoes.map(s => (
                <div key={s.telefone} onClick={() => setSelecionada(s.telefone)} style={{
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: selecionada === s.telefone ? 'rgba(249,115,22,0.1)' : 'transparent',
                  borderLeft: selecionada === s.telefone ? '3px solid #f97316' : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{s.nome_contato || s.telefone}</span>
                    <span style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                      background: s.humano_ativo ? 'rgba(147,51,234,0.2)' : s.estado === 'pedindo_ia' ? 'rgba(59,130,246,0.2)' : 'rgba(107,114,128,0.2)',
                      color: s.humano_ativo ? '#a78bfa' : s.estado === 'pedindo_ia' ? '#60a5fa' : '#9ca3af',
                    }}>
                      {s.humano_ativo ? '👤 Humano' : s.estado === 'pedindo_ia' ? '🤖 IA' : s.estado}
                    </span>
                  </div>
                  <p style={{ color: '#666', fontSize: 10, margin: '2px 0 0' }}>
                    {s.telefone} · {s.updated_at ? new Date(s.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Conexão */}
            {botStatus && !botStatus.connected && (
              <a href="/api/whatsapp/qrcode" target="_blank" style={{
                display: 'block', padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700,
                background: '#ef4444', color: '#fff', textDecoration: 'none',
              }}>
                ⚠️ WhatsApp desconectado — Conectar
              </a>
            )}
          </div>

          {/* Painel do chat */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b0705' }}>
            {!selecionada ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#444', fontSize: 14 }}>Selecione uma conversa</p>
              </div>
            ) : (
              <>
                {/* Header do chat */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{sessaoAtiva?.nome_contato || selecionada}</span>
                    <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>{selecionada}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {sessaoAtiva?.humano_ativo ? (
                      <button onClick={() => toggleHumano(selecionada, false)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#3b82f6', color: '#fff' }}>
                        🤖 Devolver pro bot
                      </button>
                    ) : (
                      <button onClick={() => toggleHumano(selecionada, true)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#7c3aed', color: '#fff' }}>
                        👤 Assumir
                      </button>
                    )}
                    <button onClick={() => deletarSessao(selecionada)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#991b1b', color: '#fff' }}>
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Mensagens */}
                <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {historico.length === 0 ? (
                    <p style={{ color: '#444', fontSize: 12, textAlign: 'center', marginTop: 40 }}>Sem mensagens na conversa</p>
                  ) : historico.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                      <div style={{
                        maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: m.role === 'user' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                        color: m.role === 'user' ? '#bbf7d0' : '#d1d5db',
                        borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                        borderBottomLeftRadius: m.role === 'user' ? 12 : 4,
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={enviarMsg} style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                  <input
                    type="text" value={texto} onChange={e => setTexto(e.target.value)}
                    placeholder={sessaoAtiva?.humano_ativo ? 'Digite uma mensagem...' : 'Assuma a conversa pra enviar'}
                    disabled={!sessaoAtiva?.humano_ativo}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', fontSize: 13,
                      background: 'rgba(255,255,255,0.06)', color: '#fff', outline: 'none',
                      opacity: !sessaoAtiva?.humano_ativo ? 0.4 : 1,
                    }}
                  />
                  <button type="submit" disabled={!texto.trim() || enviando || !sessaoAtiva?.humano_ativo} style={{
                    padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: '#f97316', color: '#fff', fontWeight: 600, fontSize: 13,
                    opacity: !texto.trim() || !sessaoAtiva?.humano_ativo ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Send size={14} /> Enviar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ABA CONFIGURAÇÕES ──────────────────────────── */}
      {tab === 'config' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 600, margin: '0 auto', width: '100%' }}>

          {/* Status da conexão */}
          <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#f97316', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📱 Conexão WhatsApp</h3>
            {botStatus?.connected ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>Conectado — {botStatus.instance}</span>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>Desconectado</span>
                <a href="/api/whatsapp/qrcode" target="_blank" style={{
                  display: 'block', marginTop: 12, padding: '10px 20px', borderRadius: 10,
                  background: '#f97316', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                }}>
                  📷 Escanear QR Code
                </a>
              </div>
            )}
          </div>

          {/* Modo do bot */}
          <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#f97316', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚙️ Modo do Bot</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'auto', label: '⏰ Auto', desc: 'Responde quando loja aberta' },
                { id: 'ligado', label: '🟢 Ligado', desc: 'Responde 24h' },
                { id: 'desligado', label: '🔴 Desligado', desc: 'Bot silenciado' },
              ].map(m => (
                <button key={m.id} onClick={() => setBotModo(m.id)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${botModo === m.id ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
                  background: botModo === m.id ? 'rgba(249,115,22,0.1)' : 'transparent',
                  color: botModo === m.id ? '#f97316' : '#999', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  {m.label}
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dicas pra IA */}
          <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#f97316', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🧠 Dicas para a IA</h3>
            <p style={{ color: '#666', fontSize: 11, marginBottom: 12 }}>
              Instruções que a IA vai seguir ao atender. Ela melhora com suas dicas!
            </p>
            <textarea
              value={botDicas} onChange={e => setBotDicas(e.target.value)}
              placeholder={"Ex:\n- Sugira a feijoada quando tiver\n- Pergunte se quer sobremesa\n- Avise que temos entrega grátis pra Barreiro"}
              style={{
                width: '100%', minHeight: 120, padding: 12, borderRadius: 10, fontSize: 13,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Botão salvar */}
          <button onClick={salvarConfig} disabled={salvando} style={{
            width: '100%', padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 14,
            opacity: salvando ? 0.5 : 1,
          }}>
            {salvando ? 'Salvando...' : '💾 Salvar configurações'}
          </button>
          {msgStatus && <p style={{ color: '#22c55e', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: 600 }}>{msgStatus}</p>}

          {/* Info */}
          <div style={{ ...S.card, padding: 16, marginTop: 16, fontSize: 11, color: '#666', lineHeight: 1.6 }}>
            🤖 O bot usa IA (GPT-4o Mini) para atender clientes pelo WhatsApp.<br />
            📱 Transcreve áudios automaticamente.<br />
            🧠 As dicas que você salvar ajudam a IA a atender melhor!<br />
            ⏰ Timeout humano: 5min sem interação → bot retoma.<br />
            🚨 Reclamações geram alertas na aba Conversas.
          </div>
        </div>
      )}
    </div>
  )
}
