import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

const STORAGE_KEYS = {
  clientes: 'fogao_clientes',
  pedidos: 'fogao_pedidos',
  cardapio: 'fogao_cardapio',
}

function load(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function AppProvider({ children }) {
  const [clientes, setClientes] = useState(() => load(STORAGE_KEYS.clientes, []))
  const [pedidos, setPedidos] = useState(() => load(STORAGE_KEYS.pedidos, []))
  const [cardapio, setCardapio] = useState(() => load(STORAGE_KEYS.cardapio, []))

  useEffect(() => save(STORAGE_KEYS.clientes, clientes), [clientes])
  useEffect(() => save(STORAGE_KEYS.pedidos, pedidos), [pedidos])
  useEffect(() => save(STORAGE_KEYS.cardapio, cardapio), [cardapio])

  // Clientes
  function adicionarCliente(dados) {
    const novo = { id: Date.now(), ...dados, criadoEm: new Date().toISOString() }
    setClientes(prev => [novo, ...prev])
    return novo
  }

  function editarCliente(id, dados) {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c))
  }

  function removerCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  // Pedidos
  function adicionarPedido(dados) {
    const novo = {
      id: Date.now(),
      ...dados,
      status: 'aberto',
      criadoEm: new Date().toISOString(),
    }
    setPedidos(prev => [novo, ...prev])
    return novo
  }

  function atualizarStatusPedido(id, status) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  function removerPedido(id) {
    setPedidos(prev => prev.filter(p => p.id !== id))
  }

  // Cardápio
  function adicionarItemCardapio(dados) {
    const novo = { id: Date.now(), ...dados, disponivel: true }
    setCardapio(prev => [novo, ...prev])
  }

  function toggleDisponibilidade(id) {
    setCardapio(prev => prev.map(i => i.id === id ? { ...i, disponivel: !i.disponivel } : i))
  }

  function removerItemCardapio(id) {
    setCardapio(prev => prev.filter(i => i.id !== id))
  }

  return (
    <AppContext.Provider value={{
      clientes, adicionarCliente, editarCliente, removerCliente,
      pedidos, adicionarPedido, atualizarStatusPedido, removerPedido,
      cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
