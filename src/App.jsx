import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Clientes from './pages/Clientes'
import Pedidos from './pages/Pedidos'
import Cardapio from './pages/Cardapio'
import Financeiro from './pages/Financeiro'
import Estoque from './pages/Estoque'
import Fornecedores from './pages/Fornecedores'
import Funcionarios from './pages/Funcionarios'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing page — sem sidebar */}
          <Route path="/" element={<Landing />} />

          {/* Sistema de gestão — com sidebar */}
          <Route path="/*" element={
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
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
