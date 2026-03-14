import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

const STORAGE_KEYS = {
  clientes: 'fogao_clientes',
  pedidos: 'fogao_pedidos',
  cardapio: 'fogao_cardapio',         // refrigerantes e combos
  cardapioHoje: 'fogao_cardapio_hoje', // estrutura do almoço do dia
}

// Carnes são globais (valem para ambas as opções)
// Acompanhamentos são por opção
const CARDAPIO_HOJE_PADRAO = {
  carnes: ['', '', ''],   // até 3 proteínas (compartilhadas)
  precoP: '',             // preço único para tamanho P
  precoG: '',             // preço único para tamanho G
  opcoes: [
    { id: 1, nome: 'Opção 1', acompanhamentos: [], disponivel: true },
    { id: 2, nome: 'Opção 2', acompanhamentos: [], disponivel: true },
  ],
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
  const [cardapioHoje, setCardapioHoje] = useState(() => {
    const saved = load(STORAGE_KEYS.cardapioHoje, null)
    // Migração: se tinha estrutura antiga (com proteínas por opção), reseta
    if (saved && saved.opcoes?.[0]?.proteinas !== undefined) return CARDAPIO_HOJE_PADRAO
    return saved || CARDAPIO_HOJE_PADRAO
  })

  useEffect(() => save(STORAGE_KEYS.clientes, clientes), [clientes])
  useEffect(() => save(STORAGE_KEYS.pedidos, pedidos), [pedidos])
  useEffect(() => save(STORAGE_KEYS.cardapio, cardapio), [cardapio])
  useEffect(() => save(STORAGE_KEYS.cardapioHoje, cardapioHoje), [cardapioHoje])

  // ── Clientes ──────────────────────────────────────────────
  function adicionarCliente(dados) {
    const novo = {
      id: Date.now(), nome: '', telefone: '', endereco: '',
      observacoes: '', tipo: 'normal',
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

  function autoRegistrarCliente(nome, endereco, telefone = '') {
    if (!nome.trim()) return null
    const jaExiste = clientes.find(c => c.nome.toLowerCase().trim() === nome.toLowerCase().trim())
    if (jaExiste) {
      if (endereco && !jaExiste.endereco) editarCliente(jaExiste.id, { endereco })
      return jaExiste
    }
    return adicionarCliente({ nome: nome.trim(), endereco, telefone })
  }

  // ── Pedidos ───────────────────────────────────────────────
  function adicionarPedido(dados) {
    const cliente = autoRegistrarCliente(dados.clienteNome, dados.clienteEndereco, dados.clienteTelefone)
    const statusInicial = dados.pagamento === 'Pendente' ? 'pendente' : 'aberto'
    const novo = {
      id: Date.now(), ...dados,
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

  // ── Cardápio Hoje ─────────────────────────────────────────
  // Carnes globais
  function salvarCarnes(carnes) {
    setCardapioHoje(prev => ({ ...prev, carnes }))
  }

  // Preços globais
  function salvarPrecos(precoP, precoG) {
    setCardapioHoje(prev => ({ ...prev, precoP, precoG }))
  }

  // Acompanhamentos por opção
  function salvarAcompanhamentos(opcaoId, lista) {
    setCardapioHoje(prev => ({
      ...prev,
      opcoes: prev.opcoes.map(o => o.id === opcaoId ? { ...o, acompanhamentos: lista } : o),
    }))
  }

  function salvarNomeOpcao(opcaoId, nome) {
    setCardapioHoje(prev => ({
      ...prev,
      opcoes: prev.opcoes.map(o => o.id === opcaoId ? { ...o, nome } : o),
    }))
  }

  function toggleOpcaoAlmoco(id) {
    setCardapioHoje(prev => ({
      ...prev,
      opcoes: prev.opcoes.map(o => o.id === id ? { ...o, disponivel: !o.disponivel } : o),
    }))
  }

  // ── Cardápio geral (refrigerantes / combos) ───────────────
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

  // ── Financeiro ────────────────────────────────────────────
  function debitoPendente(clienteId) {
    return pedidos
      .filter(p => p.clienteId === clienteId && (p.pagamento === 'Pendente' || p.status === 'pendente') && p.status !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.total), 0)
  }

  return (
    <AppContext.Provider value={{
      clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente,
      pedidos, adicionarPedido, atualizarStatusPedido, quitarPedido, removerPedido,
      cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
      cardapioHoje, salvarCarnes, salvarPrecos, salvarAcompanhamentos, salvarNomeOpcao, toggleOpcaoAlmoco,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
