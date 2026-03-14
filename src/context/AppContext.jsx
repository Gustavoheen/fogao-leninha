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
    const novo = {
      id: Date.now(),
      nome: '',
      telefone: '',
      endereco: '',
      observacoes: '',
      tipo: 'normal', // 'normal' | 'mensalista'
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setClientes(prev => [novo, ...prev])
    return novo
  }

  function editarCliente(id, dados) {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c))
  }

  function removerCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  // Auto-registra cliente ao fazer pedido se não existir
  function autoRegistrarCliente(nome, endereco, telefone = '') {
    if (!nome.trim()) return null
    const jaExiste = clientes.find(
      c => c.nome.toLowerCase().trim() === nome.toLowerCase().trim()
    )
    if (jaExiste) {
      if (endereco && !jaExiste.endereco) {
        editarCliente(jaExiste.id, { endereco })
      }
      return jaExiste
    }
    return adicionarCliente({ nome: nome.trim(), endereco, telefone })
  }

  // Pedidos
  function adicionarPedido(dados) {
    const cliente = autoRegistrarCliente(
      dados.clienteNome,
      dados.clienteEndereco,
      dados.clienteTelefone
    )
    // Se mensalista, pagamento começa como pendente
    const statusInicial = dados.pagamento === 'Pendente' ? 'pendente' : 'aberto'
    const novo = {
      id: Date.now(),
      ...dados,
      clienteId: cliente?.id || null,
      status: statusInicial,
      criadoEm: new Date().toISOString(),
    }
    setPedidos(prev => [novo, ...prev])
    return novo
  }

  function atualizarStatusPedido(id, status) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  function quitarPedido(id, formaPagamento) {
    setPedidos(prev => prev.map(p =>
      p.id === id ? { ...p, pagamento: formaPagamento, status: 'entregue', quitadoEm: new Date().toISOString() } : p
    ))
  }

  function removerPedido(id) {
    setPedidos(prev => prev.filter(p => p.id !== id))
  }

  // Cardápio
  function adicionarItemCardapio(dados) {
    const novo = { id: Date.now(), ...dados, disponivel: true }
    setCardapio(prev => [novo, ...prev])
  }

  function editarItemCardapio(id, dados) {
    setCardapio(prev => prev.map(i => i.id === id ? { ...i, ...dados } : i))
  }

  function toggleDisponibilidade(id) {
    setCardapio(prev => prev.map(i => i.id === id ? { ...i, disponivel: !i.disponivel } : i))
  }

  function removerItemCardapio(id) {
    setCardapio(prev => prev.filter(i => i.id !== id))
  }

  // Calcula débito pendente de um cliente
  function debitoPendente(clienteId) {
    return pedidos
      .filter(p => p.clienteId === clienteId && (p.pagamento === 'Pendente' || p.status === 'pendente') && p.status !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.total), 0)
  }

  return (
    <AppContext.Provider value={{
      clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente,
      pedidos, adicionarPedido, atualizarStatusPedido, quitarPedido, removerPedido,
      cardapio, adicionarItemCardapio, editarItemCardapio, toggleDisponibilidade, removerItemCardapio,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
