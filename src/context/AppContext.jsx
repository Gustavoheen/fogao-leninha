import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

const STORAGE_KEYS = {
  clientes: 'fogao_clientes',
  pedidos: 'fogao_pedidos',
  cardapio: 'fogao_cardapio',
  cardapioHoje: 'fogao_cardapio_hoje',
  despesas: 'fogao_despesas',
  estoque: 'fogao_estoque',
  fornecedores: 'fogao_fornecedores',
  funcionarios: 'fogao_funcionarios',
  motoboys: 'fogao_motoboys',
}

const CARDAPIO_HOJE_PADRAO = {
  carnes: ['', '', ''],
  precoP: '',
  precoG: '',
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
    if (saved && saved.opcoes?.[0]?.proteinas !== undefined) return CARDAPIO_HOJE_PADRAO
    return saved || CARDAPIO_HOJE_PADRAO
  })
  const [despesas, setDespesas] = useState(() => load(STORAGE_KEYS.despesas, []))
  const [estoque, setEstoque] = useState(() => load(STORAGE_KEYS.estoque, []))
  const [fornecedores, setFornecedores] = useState(() => load(STORAGE_KEYS.fornecedores, []))
  const [funcionarios, setFuncionarios] = useState(() => load(STORAGE_KEYS.funcionarios, []))
  const [motoboys, setMotoboys] = useState(() => load(STORAGE_KEYS.motoboys, []))

  useEffect(() => save(STORAGE_KEYS.clientes, clientes), [clientes])
  useEffect(() => save(STORAGE_KEYS.pedidos, pedidos), [pedidos])
  useEffect(() => save(STORAGE_KEYS.cardapio, cardapio), [cardapio])
  useEffect(() => save(STORAGE_KEYS.cardapioHoje, cardapioHoje), [cardapioHoje])
  useEffect(() => save(STORAGE_KEYS.despesas, despesas), [despesas])
  useEffect(() => save(STORAGE_KEYS.estoque, estoque), [estoque])
  useEffect(() => save(STORAGE_KEYS.fornecedores, fornecedores), [fornecedores])
  useEffect(() => save(STORAGE_KEYS.funcionarios, funcionarios), [funcionarios])
  useEffect(() => save(STORAGE_KEYS.motoboys, motoboys), [motoboys])

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

  function autoRegistrarCliente(nome, end = {}, telefone = '') {
    if (!nome.trim()) return null
    const jaExiste = clientes.find(c => c.nome.toLowerCase().trim() === nome.toLowerCase().trim())
    if (jaExiste) {
      if (!jaExiste.rua && end.rua) editarCliente(jaExiste.id, end)
      return jaExiste
    }
    return adicionarCliente({ nome: nome.trim(), ...end, telefone })
  }

  // ── Pedidos ───────────────────────────────────────────────
  function adicionarPedido(dados) {
    const enderecoObj = { rua: dados.rua, bairro: dados.bairro, numero: dados.numero, referencia: dados.referencia }
    const cliente = autoRegistrarCliente(dados.clienteNome, enderecoObj, dados.clienteTelefone)

    let statusPagamento = 'pago'
    if (dados.pagamento === 'Mensalista') statusPagamento = 'mensalista'
    else if (dados.pagamento === 'Pendente') statusPagamento = 'pendente'

    const novo = {
      id: Date.now(), ...dados,
      clienteId: cliente?.id || null,
      status: 'aberto',
      statusPagamento,
      horarioEntrega: dados.horarioEntrega || '',
      embalagensAdicionais: dados.embalagensAdicionais || 0,
      motoboy: dados.motoboy || '',
      criadoEm: new Date().toISOString(),
    }
    setPedidos(prev => [novo, ...prev])
    return novo
  }

  function atualizarStatusPedido(id, status) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  function atualizarPagamentoPedido(id, statusPagamento) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, statusPagamento } : p))
  }

  function atribuirMotoboy(id, motoboy) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, motoboy } : p))
  }

  function quitarPedido(id, formaPagamento) {
    setPedidos(prev => prev.map(p =>
      p.id === id ? { ...p, pagamento: formaPagamento, status: 'entregue', statusPagamento: 'pago', quitadoEm: new Date().toISOString() } : p
    ))
  }

  function removerPedido(id) {
    setPedidos(prev => prev.filter(p => p.id !== id))
  }

  // ── Cardápio Hoje ─────────────────────────────────────────
  function salvarCarnes(carnes) {
    setCardapioHoje(prev => ({ ...prev, carnes }))
  }

  function salvarPrecos(precoP, precoG) {
    setCardapioHoje(prev => ({ ...prev, precoP, precoG }))
  }

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
      .filter(p => p.clienteId === clienteId && (p.pagamento === 'Pendente' || p.statusPagamento === 'pendente') && p.status !== 'cancelado')
      .reduce((acc, p) => acc + Number(p.total), 0)
  }

  // ── Despesas ──────────────────────────────────────────────
  function adicionarDespesa(dados) {
    const nova = {
      id: Date.now(),
      categoria: '',
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      pago: false,
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setDespesas(prev => [nova, ...prev])
    return nova
  }

  function editarDespesa(id, dados) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d))
  }

  function removerDespesa(id) {
    setDespesas(prev => prev.filter(d => d.id !== id))
  }

  function pagarDespesa(id) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, pago: !d.pago, pagadoEm: new Date().toISOString() } : d))
  }

  // ── Estoque ───────────────────────────────────────────────
  function adicionarEstoque(dados) {
    const novo = {
      id: Date.now(),
      nome: '',
      categoria: '',
      quantidade: 0,
      unidade: 'un',
      qtdMinima: 0,
      preco: 0,
      fornecedorId: null,
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setEstoque(prev => [novo, ...prev])
    return novo
  }

  function editarEstoque(id, dados) {
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, ...dados } : e))
  }

  function removerEstoque(id) {
    setEstoque(prev => prev.filter(e => e.id !== id))
  }

  function atualizarQuantidade(id, delta) {
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, quantidade: Math.max(0, Number(e.quantidade) + delta) } : e))
  }

  // ── Fornecedores ──────────────────────────────────────────
  function adicionarFornecedor(dados) {
    const novo = {
      id: Date.now(),
      nome: '',
      contato: '',
      telefone: '',
      produtos: '',
      valorMensal: 0,
      diaPagamento: 1,
      pago: false,
      observacoes: '',
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setFornecedores(prev => [novo, ...prev])
    return novo
  }

  function editarFornecedor(id, dados) {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ...dados } : f))
  }

  function removerFornecedor(id) {
    setFornecedores(prev => prev.filter(f => f.id !== id))
  }

  function pagarFornecedor(id) {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, pago: !f.pago, pagadoEm: new Date().toISOString() } : f))
  }

  // ── Funcionários ──────────────────────────────────────────
  function adicionarFuncionario(dados) {
    const novo = {
      id: Date.now(),
      nome: '',
      cargo: '',
      salario: 0,
      dataAdmissao: '',
      ativo: true,
      observacoes: '',
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setFuncionarios(prev => [novo, ...prev])
    return novo
  }

  function editarFuncionario(id, dados) {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...dados } : f))
  }

  function removerFuncionario(id) {
    setFuncionarios(prev => prev.filter(f => f.id !== id))
  }

  // ── Motoboys ──────────────────────────────────────────────
  function adicionarMotoboy(nome) {
    if (!nome.trim()) return
    setMotoboys(prev => prev.includes(nome.trim()) ? prev : [...prev, nome.trim()])
  }

  function removerMotoboy(nome) {
    setMotoboys(prev => prev.filter(m => m !== nome))
  }

  return (
    <AppContext.Provider value={{
      // Clientes
      clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente,
      // Pedidos
      pedidos, adicionarPedido, atualizarStatusPedido, atualizarPagamentoPedido, atribuirMotoboy, quitarPedido, removerPedido,
      // Cardápio
      cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
      cardapioHoje, salvarCarnes, salvarPrecos, salvarAcompanhamentos, salvarNomeOpcao, toggleOpcaoAlmoco,
      // Despesas
      despesas, adicionarDespesa, editarDespesa, removerDespesa, pagarDespesa,
      // Estoque
      estoque, adicionarEstoque, editarEstoque, removerEstoque, atualizarQuantidade,
      // Fornecedores
      fornecedores, adicionarFornecedor, editarFornecedor, removerFornecedor, pagarFornecedor,
      // Funcionários
      funcionarios, adicionarFuncionario, editarFuncionario, removerFuncionario,
      // Motoboys
      motoboys, adicionarMotoboy, removerMotoboy,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
