import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function RequireAuth({ children }) {
  const logado = sessionStorage.getItem('fogao_logado')
  if (!logado) return <Navigate to="/login" replace />
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
