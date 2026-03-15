import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Users, ClipboardList, BookOpen, TrendingUp,
  Package, Truck, UserCheck, BarChart3,
  ChevronRight, LogOut, Settings, X, Check,
} from 'lucide-react'

const NAV = [
  { to: '/pedidos',       label: 'Pedidos',      icon: ClipboardList },
  { to: '/clientes',      label: 'Clientes',     icon: Users },
  { to: '/cardapio',      label: 'Cardápio',     icon: BookOpen },
  { to: '/financeiro',    label: 'Financeiro',   icon: TrendingUp },
  { to: '/estoque',       label: 'Estoque',      icon: Package },
  { to: '/fornecedores',  label: 'Fornecedores', icon: Truck },
  { to: '/funcionarios',  label: 'Funcionários', icon: UserCheck },
  { to: '/dashboard',     label: 'Dashboard',    icon: BarChart3 },
  { to: '/configuracoes', label: 'Config',       icon: Settings },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const current = NAV.find(n => location.pathname.startsWith(n.to))
  const [modalSenha, setModalSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConf, setSenhaConf] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [okSenha, setOkSenha] = useState(false)

  function sair() {
    sessionStorage.removeItem('fogao_logado')
    navigate('/login', { replace: true })
  }

  function trocarSenha(e) {
    e.preventDefault()
    const atual = localStorage.getItem('fogao_senha') || 'fogao2024'
    if (senhaAtual !== atual) { setErroSenha('Senha atual incorreta'); return }
    if (senhaNova.length < 4) { setErroSenha('Mínimo 4 caracteres'); return }
    if (senhaNova !== senhaConf) { setErroSenha('As senhas não coincidem'); return }
    localStorage.setItem('fogao_senha', senhaNova)
    setOkSenha(true); setErroSenha('')
    setSenhaAtual(''); setSenhaNova(''); setSenhaConf('')
    setTimeout(() => { setModalSenha(false); setOkSenha(false) }, 1500)
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--surface-2)', flexDirection: 'column' }}>

      {/* ══════════════════════════════════════════════════════════
          MOBILE — header + abas horizontais com scroll
      ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col" style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Topbar mobile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-vertical.png" alt="Fogão a Lenha" style={{ height: 32, width: 'auto' }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>Fogão a Lenha</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Painel de gestão</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setModalSenha(true)} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}>
              🔑
            </button>
            <button onClick={sair} style={{
              background: 'rgba(200,34,26,0.2)', border: '1px solid rgba(200,34,26,0.3)',
              borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600,
              color: '#FF7B74', cursor: 'pointer',
            }}>
              Sair
            </button>
          </div>
        </div>

        {/* Abas com scroll horizontal */}
        <div style={{
          display: 'flex', overflowX: 'auto', gap: 0,
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          padding: '0 8px',
        }}
          className="no-scrollbar"
        >
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              {({ isActive }) => (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 14px 10px',
                  borderBottom: isActive ? '3px solid #C8221A' : '3px solid transparent',
                  transition: 'all 0.15s',
                  opacity: isActive ? 1 : 0.55,
                }}>
                  <Icon size={18} color={isActive ? '#FF7B74' : 'rgba(255,255,255,0.7)'} />
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FF7B74' : 'rgba(255,255,255,0.6)',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP — layout de duas colunas (sidebar + conteúdo)
      ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside style={{
          width: 224, minWidth: 224,
          background: 'var(--sidebar-bg)',
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          boxShadow: '2px 0 20px rgba(0,0,0,0.4)', zIndex: 10,
        }}>
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <img src="/logo-vertical.png" alt="Fogão a Lenha da Leninha"
              style={{ width: '100%', maxWidth: 140, display: 'block', margin: '0 auto', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          </div>

          <div style={{ padding: '16px 16px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
              Menu principal
            </span>
          </div>

          <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
                transition: 'all 0.15s', position: 'relative',
                background: isActive ? 'rgba(200,34,26,0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #C8221A' : '3px solid transparent',
              })}
                onMouseOver={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseOut={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = 'transparent' }}
              >
                {({ isActive }) => (
                  <>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'rgba(200,34,26,0.35)' : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.15s', flexShrink: 0,
                    }}>
                      <Icon size={15} color={isActive ? '#FF7B74' : 'rgba(255,255,255,0.55)'} />
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                      letterSpacing: '-0.01em',
                    }}>{label}</span>
                    {isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'rgba(255,150,144,0.7)' }} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #C8221A, #8B1510)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>L</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Leninha</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Administrador</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setModalSenha(true)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              }}>
                <Settings size={12} /> Senha
              </button>
              <button onClick={sair} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: 'rgba(200,34,26,0.18)', color: 'rgba(255,120,114,0.85)',
                border: '1px solid rgba(200,34,26,0.25)', cursor: 'pointer',
              }}>
                <LogOut size={12} /> Sair
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>v2.0 — Sistema PDV</p>
          </div>
        </aside>

        {/* Conteúdo desktop */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header style={{
            height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 28px', gap: 8,
            boxShadow: 'var(--shadow-sm)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gestão</span>
              <ChevronRight size={12} color="var(--text-muted)" />
              {current && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{current.label}</span>}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Online</span>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {children}
          </main>
        </div>
      </div>

      {/* Conteúdo mobile (abaixo das abas) */}
      <div className="md:hidden flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        {children}
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL SENHA
      ══════════════════════════════════════════════════════════ */}
      {modalSenha && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 360, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A0E08' }}>Alterar Senha</h3>
              <button onClick={() => { setModalSenha(false); setErroSenha(''); setOkSenha(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878' }}>
                <X size={18} />
              </button>
            </div>
            {okSenha ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#16A34A' }}>
                <Check size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: 600 }}>Senha alterada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={trocarSenha}>
                {[
                  ['Senha atual', senhaAtual, setSenhaAtual],
                  ['Nova senha', senhaNova, setSenhaNova],
                  ['Confirmar nova senha', senhaConf, setSenhaConf],
                ].map(([label, val, set]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>{label}</label>
                    <input type="password" value={val}
                      onChange={e => { set(e.target.value); setErroSenha('') }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1.5px solid #CFC4BB', outline: 'none', color: '#1A0E08', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                {erroSenha && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{erroSenha}</p>}
                <button type="submit" style={{
                  width: '100%', padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: '#C8221A', color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                  Salvar Nova Senha
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
