import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Clientes from './pages/Clientes'
import Pedidos from './pages/Pedidos'
import Cardapio from './pages/Cardapio'
import Pagamentos from './pages/Pagamentos'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/pedidos" replace />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  )
}
