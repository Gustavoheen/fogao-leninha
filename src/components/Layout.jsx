import { NavLink } from 'react-router-dom'
import { Users, ClipboardList, BookOpen, TrendingUp, Package, Truck, UserCheck, BarChart3, Flame } from 'lucide-react'

const navItems = [
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cardapio', label: 'Cardápio', icon: BookOpen },
  { to: '/financeiro', label: 'Financeiro', icon: TrendingUp },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/funcionarios', label: 'Funcionários', icon: UserCheck },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
]

export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-amber-50">
      {/* Sidebar */}
      <aside className="w-56 bg-amber-900 text-amber-50 flex flex-col shadow-xl">
        <div className="p-5 border-b border-amber-700">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="text-orange-400" size={24} />
            <span className="font-bold text-lg leading-tight">Fogão a Lenha</span>
          </div>
          <span className="text-amber-300 text-xs">da Leninha</span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-amber-200 hover:bg-amber-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-amber-500 text-center border-t border-amber-700">
          v2.0 — Sistema PDV
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
