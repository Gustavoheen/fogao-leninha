import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import {
  Save, Check, Copy, ExternalLink, Settings, Smartphone,
  Lock, ToggleLeft, ToggleRight, QrCode, Link, Eye, EyeOff,
} from 'lucide-react'

const ABAS = [
  { key: 'pix',      label: 'Pix',       cor: '#EA580C' },
  { key: 'whatsapp', label: 'WhatsApp',  cor: '#16A34A' },
  { key: 'status',   label: 'Status',    cor: '#2563EB' },
  { key: 'equipe',   label: 'Equipe',    cor: '#7C3AED' },
  { key: 'links',    label: 'Links',     cor: '#44403C' },
]

function BotaoSalvar({ onClick, salvo, salvando }) {
  return (
    <button
      onClick={onClick}
      disabled={salvando}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%', padding: '14px 0', borderRadius: 12,
        fontSize: 15, fontWeight: 800, border: 'none', cursor: salvando ? 'default' : 'pointer',
        transition: 'all 0.2s',
        background: salvo ? '#16A34A' : salvando ? '#CFC4BB' : '#EA580C',
        color: '#fff',
        boxShadow: salvo ? '0 4px 14px rgba(22,163,74,0.3)' : '0 4px 14px rgba(234,88,12,0.3)',
      }}
    >
      {salvo ? <><Check size={18} /> Salvo com sucesso!</> : salvando ? 'Salvando...' : <><Save size={18} /> Salvar</>}
    </button>
  )
}

function Campo({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#44403C' }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#9D8878', marginTop: -4 }}>{hint}</p>}
      {children}
    </div>
  )
}

const INPUT_ST = {
  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 15,
  border: '1.5px solid #E6DDD5', outline: 'none', background: '#FAFAF8',
  color: '#1A0E08', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function Configuracoes() {
  const { config, salvarConfig } = useApp()
  const [aba, setAba] = useState('pix')

  const [form, setForm] = useState({
    pixChave: '', pixNome: 'Fogão a Lenha da Leninha', pixBanco: '',
    restauranteWhatsapp: '', lojaAberta: true,
    equipePIN: '1234', senhaAdmin: 'fogao2024',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarPIN, setMostrarPIN] = useState(false)
  const [copiado, setCopiado] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (config) setForm(prev => ({ ...prev, ...config }))
  }, [config])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function salvar(campos) {
    setSalvando(true)
    const ts = new Date().toISOString()
    const payload = { ...campos, atualizadoEm: ts }
    const { error } = await supabase.from('configuracoes').update(payload).eq('id', 1)
    setSalvando(false)
    if (!error) {
      // Mantém AppContext em sync
      salvarConfig({ ...form, ...campos })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  function copiar(texto, key) {
    navigator.clipboard.writeText(texto)
    setCopiado(key)
    setTimeout(() => setCopiado(null), 2000)
  }

  const urlBase = window.location.origin
  const urlPublica = urlBase + '/'
  const urlEquipe  = urlBase + '/equipe'
  const urlAdmin   = urlBase + '/login'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
          Configurações
        </h1>
        <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>Ajustes do restaurante e do sistema</p>
      </div>

      {/* Abas */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 24,
        background: '#F7F3EF', borderRadius: 12, padding: 5,
        overflowX: 'auto',
      }}>
        {ABAS.map(a => (
          <button
            key={a.key}
            onClick={() => { setAba(a.key); setSalvo(false) }}
            style={{
              flex: 1, minWidth: 72, padding: '9px 14px',
              borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
              background: aba === a.key ? a.cor : 'transparent',
              color: aba === a.key ? '#fff' : '#6B5A4E',
              boxShadow: aba === a.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA PIX ── */}
      {aba === 'pix' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
          <div style={{ background: '#EA580C', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={20} color="#fff" />
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>Pagamento via Pix</h2>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Campo label="Chave Pix" hint="CPF, CNPJ, e-mail, telefone ou chave aleatória">
              <input value={form.pixChave} onChange={e => set('pixChave', e.target.value)}
                placeholder="Ex: 55321234-5678 ou chave@email.com" style={INPUT_ST} data-nocase />
            </Campo>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo label="Nome do favorecido">
                <input value={form.pixNome} onChange={e => set('pixNome', e.target.value)}
                  placeholder="Nome no Pix" style={INPUT_ST} />
              </Campo>
              <Campo label="Banco">
                <input value={form.pixBanco} onChange={e => set('pixBanco', e.target.value)}
                  placeholder="Ex: Nubank, Caixa..." style={INPUT_ST} />
              </Campo>
            </div>
            {form.pixChave && (
              <div style={{ background: '#FFF7ED', border: '2px solid #FDBA74', borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prévia — como o cliente verá</p>
                <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#7C2D12', margin: 0 }}>{form.pixChave}</p>
                {form.pixNome && <p style={{ fontSize: 13, color: '#C2410C', margin: '4px 0 0' }}>{form.pixNome}</p>}
                {form.pixBanco && <p style={{ fontSize: 12, color: '#EA580C', margin: '2px 0 0' }}>{form.pixBanco}</p>}
              </div>
            )}
            <BotaoSalvar
              onClick={() => salvar({ pixChave: form.pixChave, pixNome: form.pixNome, pixBanco: form.pixBanco })}
              salvo={salvo} salvando={salvando}
            />
          </div>
        </div>
      )}

      {/* ── ABA WHATSAPP ── */}
      {aba === 'whatsapp' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
          <div style={{ background: '#16A34A', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={20} color="#fff" />
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>WhatsApp do restaurante</h2>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Campo label="Número do WhatsApp" hint="Digite DDD + número. O +55 já está incluído automaticamente.">
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E6DDD5', borderRadius: 10, background: '#FAFAF8', overflow: 'hidden' }}>
                <span style={{ padding: '12px 14px', fontSize: 15, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', borderRight: '1.5px solid #E6DDD5', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  +55
                </span>
                <input
                  type="tel"
                  value={form.restauranteWhatsapp.startsWith('55') ? form.restauranteWhatsapp.slice(2) : form.restauranteWhatsapp}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '')
                    set('restauranteWhatsapp', '55' + digits)
                  }}
                  placeholder="32912345678"
                  style={{ ...INPUT_ST, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                />
              </div>
            </Campo>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 13, color: '#166534', fontWeight: 600, margin: 0 }}>
                Clientes que pagaram via Pix enviam o comprovante para este número.
              </p>
            </div>
            <BotaoSalvar
              onClick={() => salvar({ restauranteWhatsapp: form.restauranteWhatsapp })}
              salvo={salvo} salvando={salvando}
            />
          </div>
        </div>
      )}

      {/* ── ABA STATUS ── */}
      {aba === 'status' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
          <div style={{ background: '#2563EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} color="#fff" />
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>Status da loja</h2>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F7F3EF', borderRadius: 12, padding: '16px 20px' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1A0E08', margin: 0 }}>Loja aberta para pedidos online</p>
                <p style={{ fontSize: 12, color: '#9D8878', margin: '4px 0 0' }}>Quando fechada, exibe mensagem de encerramento</p>
              </div>
              <button
                onClick={() => set('lojaAberta', !form.lojaAberta)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.lojaAberta ? '#16A34A' : '#9D8878', flexShrink: 0 }}
              >
                {form.lojaAberta ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
              </button>
            </div>
            <div style={{
              borderRadius: 12, padding: '16px 20px', textAlign: 'center',
              fontSize: 15, fontWeight: 800, letterSpacing: '0.03em',
              background: form.lojaAberta ? '#16A34A' : '#DC2626',
              color: '#fff',
              boxShadow: form.lojaAberta ? '0 4px 14px rgba(22,163,74,0.3)' : '0 4px 14px rgba(220,38,38,0.3)',
            }}>
              {form.lojaAberta ? '✅ ABERTA — clientes podem fazer pedidos' : '🔒 FECHADA — pedidos bloqueados'}
            </div>
            <BotaoSalvar
              onClick={() => salvar({ lojaAberta: form.lojaAberta })}
              salvo={salvo} salvando={salvando}
            />
          </div>
        </div>
      )}

      {/* ── ABA EQUIPE ── */}
      {aba === 'equipe' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* PIN */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
            <div style={{ background: '#7C3AED', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={20} color="#fff" />
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>PIN da equipe</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Campo label="PIN de acesso" hint="Código que a equipe digita para acessar /equipe">
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarPIN ? 'text' : 'password'}
                    data-nocase
                    value={form.equipePIN}
                    onChange={e => set('equipePIN', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="1234"
                    style={{ ...INPUT_ST, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setMostrarPIN(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878' }}>
                    {mostrarPIN ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Campo>
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600, margin: 0 }}>
                  Mínimo 4 dígitos. Padrão: <strong>1234</strong>
                </p>
              </div>
              <BotaoSalvar
                onClick={() => salvar({ equipePIN: form.equipePIN })}
                salvo={salvo} salvando={salvando}
              />
            </div>
          </div>

          {/* Senha admin */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
            <div style={{ background: '#44403C', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={20} color="#fff" />
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>Senha do painel admin</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Campo label="Senha de acesso ao painel" hint="Senha usada para entrar no painel de gestão (/login)">
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    data-nocase
                    value={form.senhaAdmin}
                    onChange={e => set('senhaAdmin', e.target.value)}
                    placeholder="fogao2024"
                    style={{ ...INPUT_ST, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878' }}>
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Campo>
              <div style={{ background: '#F7F3EF', border: '1px solid #E6DDD5', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 13, color: '#6B5A4E', fontWeight: 600, margin: 0 }}>
                  Padrão: <strong>fogao2024</strong> — altere para algo seguro.
                </p>
              </div>
              <BotaoSalvar
                onClick={() => salvar({ senhaAdmin: form.senhaAdmin })}
                salvo={salvo} salvando={salvando}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ABA LINKS ── */}
      {aba === 'links' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E6DDD5', overflow: 'hidden' }}>
          <div style={{ background: '#44403C', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link size={20} color="#fff" />
            <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>Links do sistema</h2>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Cardápio público — clientes',    url: urlPublica, key: 'pub',  bg: '#EFF6FF', border: '#BFDBFE', cor: '#1D4ED8' },
              { label: 'Área da equipe — coleta pedidos', url: urlEquipe,  key: 'eq',   bg: '#F5F3FF', border: '#DDD6FE', cor: '#5B21B6' },
              { label: 'Painel admin — gestão',          url: urlAdmin,   key: 'adm',  bg: '#FFF7ED', border: '#FDBA74', cor: '#C2410C' },
            ].map(({ label, url, key, bg, border, cor }) => (
              <div key={key} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: cor, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: cor, margin: 0, wordBreak: 'break-all' }}>{url}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => copiar(url, key)}
                    style={{ padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', background: copiado === key ? '#16A34A' : `${border}`, color: copiado === key ? '#fff' : cor, display: 'flex' }}>
                    {copiado === key ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: 8, borderRadius: 8, background: border, color: cor, display: 'flex', textDecoration: 'none' }}>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
