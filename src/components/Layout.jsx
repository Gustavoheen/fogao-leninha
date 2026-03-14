import { NavLink, useLocation } from 'react-router-dom'
import {
  Users, ClipboardList, BookOpen, TrendingUp,
  Package, Truck, UserCheck, BarChart3,
  ChevronRight
} from 'lucide-react'

const NAV = [
  { to: '/pedidos',      label: 'Pedidos',      icon: ClipboardList, desc: 'Novos e em aberto' },
  { to: '/clientes',     label: 'Clientes',      icon: Users,         desc: 'Cadastros e mensalistas' },
  { to: '/cardapio',     label: 'Cardápio',      icon: BookOpen,      desc: 'Cardápio do dia' },
  { to: '/financeiro',   label: 'Financeiro',    icon: TrendingUp,    desc: 'Caixa e despesas' },
  { to: '/estoque',      label: 'Estoque',       icon: Package,       desc: 'Inventário' },
  { to: '/fornecedores', label: 'Fornecedores',  icon: Truck,         desc: 'Pagamentos' },
  { to: '/funcionarios', label: 'Funcionários',  icon: UserCheck,     desc: 'Equipe e salários' },
  { to: '/dashboard',    label: 'Dashboard',     icon: BarChart3,     desc: 'Relatórios' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const current = NAV.find(n => location.pathname.startsWith(n.to))

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--surface-2)' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: 224,
        minWidth: 224,
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.4)',
        zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <img
            src="/logo-vertical.png"
            alt="Fogão a Lenha da Leninha"
            style={{ width: '100%', maxWidth: 140, display: 'block', margin: '0 auto', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
          />
        </div>

        {/* Label seção */}
        <div style={{ padding: '16px 16px 6px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Menu principal
          </span>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 9,
                textDecoration: 'none',
                transition: 'all 0.15s',
                position: 'relative',
                background: isActive ? 'rgba(200,34,26,0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #C8221A' : '3px solid transparent',
              })}
              onMouseOver={e => {
                if (!e.currentTarget.dataset.active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseOut={e => {
                if (!e.currentTarget.dataset.active) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    width: 32, height: 32,
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(200,34,26,0.35)' : 'rgba(255,255,255,0.06)',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color={isActive ? '#FF7B74' : 'rgba(255,255,255,0.55)'} />
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                    letterSpacing: '-0.01em',
                  }}>
                    {label}
                  </span>
                  {isActive && (
                    <ChevronRight size={13} style={{ marginLeft: 'auto', color: 'rgba(255,150,144,0.7)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer da sidebar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C8221A, #8B1510)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>L</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Leninha</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Administrador</p>
            </div>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>
            v2.0 — Sistema PDV
          </p>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 8,
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>Gestão</span>
            <ChevronRight size={12} color="var(--text-muted)" />
            {current && (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {current.label}
              </span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#16A34A',
              boxShadow: '0 0 0 3px rgba(22,163,74,0.2)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Online</span>
          </div>
        </header>

        {/* Página */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
