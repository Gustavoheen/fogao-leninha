import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import PedidoOnline from './pages/PedidoOnline'
import PedidoEquipe from './pages/PedidoEquipe'
import Login from './pages/Login'
import Clientes from './pages/Clientes'
import Pedidos from './pages/Pedidos'
import Cardapio from './pages/Cardapio'
import Financeiro from './pages/Financeiro'
import Estoque from './pages/Estoque'
import Fornecedores from './pages/Fornecedores'
import Funcionarios from './pages/Funcionarios'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Atendimento from './pages/Atendimento'
import { supabase } from './lib/supabase'

function RequireAuth({ children }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'authed' | 'unauthed'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'authed' : 'unauthed')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authed' : 'unauthed')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') return null
  if (status === 'unauthed') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Página pública de pedidos online para clientes */}
          <Route path="/" element={<PedidoOnline />} />

          {/* Área da equipe — coleta rápida de pedidos via celular */}
          <Route path="/equipe" element={<PedidoEquipe />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Sistema de gestão — protegido por senha */}
          <Route path="/*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/pedidos" element={<Pedidos />} />
                  <Route path="/atendimento" element={<Atendimento />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/cardapio" element={<Cardapio />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/fornecedores" element={<Fornecedores />} />
                  <Route path="/funcionarios" element={<Funcionarios />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<Navigate to="/pedidos" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
