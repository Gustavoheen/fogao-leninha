import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AppContext = createContext()

const CARDAPIO_HOJE_PADRAO = {
  carnes: ['', '', ''],
  precoP: '',
  precoG: '',
  opcoes: [
    { id: 1, nome: 'Opção 1', acompanhamentos: [], disponivel: true },
    { id: 2, nome: 'Opção 2', acompanhamentos: [], disponivel: true },
  ],
}

// ── Helpers de localStorage (cache local) ─────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function AppProvider({ children }) {
  // Quando Supabase está configurado, começa com estado vazio e aguarda o banco.
  // Quando não está configurado (dev local), usa localStorage como fallback.
  const [clientes, setClientes] = useState(() => supabaseConfigured ? [] : lsGet('clientes', []))
  const [pedidos, setPedidos] = useState(() => supabaseConfigured ? [] : lsGet('pedidos', []))
  const [cardapio, setCardapio] = useState(() => supabaseConfigured ? [] : lsGet('cardapio', []))
  const [cardapioHoje, setCardapioHoje] = useState(() => lsGet('cardapioHoje', CARDAPIO_HOJE_PADRAO))
  const [despesas, setDespesas] = useState(() => supabaseConfigured ? [] : lsGet('despesas', []))
  const [estoque, setEstoque] = useState(() => supabaseConfigured ? [] : lsGet('estoque', []))
  const [fornecedores, setFornecedores] = useState(() => supabaseConfigured ? [] : lsGet('fornecedores', []))
  const [funcionarios, setFuncionarios] = useState(() => supabaseConfigured ? [] : lsGet('funcionarios', []))
  const [motoboys, setMotoboys] = useState(() => supabaseConfigured ? [] : lsGet('motoboys', []))
  const [config, setConfig] = useState(() => lsGet('fogao_config', {
    whatsapp: '',
    pixChave: '',
    pixNome: 'Fogão a Lenha da Leninha',
    pixBanco: '',
  }))

  // ── Persistir no localStorage como cache ───────────────────
  useEffect(() => { lsSet('clientes', clientes) }, [clientes])
  useEffect(() => { lsSet('pedidos', pedidos) }, [pedidos])
  useEffect(() => { lsSet('cardapio', cardapio) }, [cardapio])
  useEffect(() => { lsSet('cardapioHoje', cardapioHoje) }, [cardapioHoje])
  useEffect(() => { lsSet('despesas', despesas) }, [despesas])
  useEffect(() => { lsSet('estoque', estoque) }, [estoque])
  useEffect(() => { lsSet('fornecedores', fornecedores) }, [fornecedores])
  useEffect(() => { lsSet('funcionarios', funcionarios) }, [funcionarios])
  useEffect(() => { lsSet('motoboys', motoboys) }, [motoboys])
  useEffect(() => { lsSet('fogao_config', config) }, [config])

  // ── Loading do Supabase — banco é a única fonte de verdade ─
  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('clientes').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setClientes(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('cardapio').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setCardapio(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('cardapio_hoje').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setCardapioHoje(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('despesas').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setDespesas(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('estoque').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setEstoque(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('fornecedores').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setFornecedores(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('funcionarios').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setFuncionarios(data) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('motoboys').select('nome')
      .then(({ data }) => { if (data) setMotoboys(data.map(m => m.nome)) })
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('configuracoes').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setConfig(data) })
  }, [])

  // ── Pedidos: loading + real-time ───────────────────────────
  useEffect(() => {
    if (!supabaseConfigured) return
    supabase.from('pedidos').select('*').order('"criadoEm"', { ascending: false })
      .then(({ data }) => { if (data) setPedidos(data) })

    const channel = supabase
      .channel('pedidos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
        if (payload.eventType === 'INSERT') setPedidos(prev => [payload.new, ...prev])
        if (payload.eventType === 'UPDATE') setPedidos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        if (payload.eventType === 'DELETE') setPedidos(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ── Clientes ──────────────────────────────────────────────
  function adicionarCliente(dados) {
    const novo = {
      id: Date.now(), nome: '', telefone: '', rua: '', bairro: '', numero: '',
      referencia: '', observacoes: '', tipo: 'normal',
      ...dados,
      criadoEm: new Date().toISOString(),
    }
    setClientes(prev => [novo, ...prev])
    supabase.from('clientes').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar cliente:', error)
        setClientes(prev => prev.filter(c => c.id !== novo.id))
        alert('Erro ao salvar cliente. Tente novamente.')
      }
    })
    return novo
  }

  function editarCliente(id, dados) {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c))
    supabase.from('clientes').update(dados).eq('id', id)
  }

  function removerCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
    supabase.from('clientes').delete().eq('id', id)
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
    supabase.from('pedidos').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar pedido:', error)
        setPedidos(prev => prev.filter(p => p.id !== novo.id))
        alert('Erro ao salvar pedido. Tente novamente.')
      }
    })
    return novo
  }

  function atualizarStatusPedido(id, status) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    supabase.from('pedidos').update({ status }).eq('id', id)
  }

  function atualizarPagamentoPedido(id, statusPagamento) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, statusPagamento } : p))
    supabase.from('pedidos').update({ statusPagamento }).eq('id', id)
  }

  function atribuirMotoboy(id, motoboy) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, motoboy } : p))
    supabase.from('pedidos').update({ motoboy }).eq('id', id)
  }

  function quitarPedido(id, formaPagamento) {
    const updates = {
      pagamento: formaPagamento,
      status: 'entregue',
      statusPagamento: 'pago',
      quitadoEm: new Date().toISOString(),
    }
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    supabase.from('pedidos').update(updates).eq('id', id)
  }

  function removerPedido(id) {
    setPedidos(prev => prev.filter(p => p.id !== id))
    supabase.from('pedidos').delete().eq('id', id)
  }

  function marcarComandaImpressa(id) {
    const ts = new Date().toISOString()
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, comandaImpressaEm: ts } : p))
    supabase.from('pedidos').update({ comandaImpressaEm: ts }).eq('id', id)
  }

  // ── Cardápio Hoje ─────────────────────────────────────────
  function salvarCarnes(carnes) {
    const ts = new Date().toISOString()
    setCardapioHoje(prev => ({ ...prev, carnes, atualizadoEm: ts }))
    supabase.from('cardapio_hoje').upsert({ id: 1, carnes, atualizadoEm: ts })
  }

  function salvarPrecos(precoP, precoG) {
    const ts = new Date().toISOString()
    setCardapioHoje(prev => ({ ...prev, precoP, precoG, atualizadoEm: ts }))
    supabase.from('cardapio_hoje').update({ precoP, precoG, atualizadoEm: ts }).eq('id', 1)
  }

  function salvarAcompanhamentos(opcaoId, lista) {
    const ts = new Date().toISOString()
    setCardapioHoje(prev => {
      const opcoes = prev.opcoes.map(o => o.id === opcaoId ? { ...o, acompanhamentos: lista } : o)
      setTimeout(() => {
        supabase.from('cardapio_hoje').update({ opcoes, atualizadoEm: ts }).eq('id', 1)
      }, 0)
      return { ...prev, opcoes, atualizadoEm: ts }
    })
  }

  function salvarNomeOpcao(opcaoId, nome) {
    const ts = new Date().toISOString()
    setCardapioHoje(prev => {
      const opcoes = prev.opcoes.map(o => o.id === opcaoId ? { ...o, nome } : o)
      setTimeout(() => {
        supabase.from('cardapio_hoje').update({ opcoes, atualizadoEm: ts }).eq('id', 1)
      }, 0)
      return { ...prev, opcoes, atualizadoEm: ts }
    })
  }

  function toggleOpcaoAlmoco(id) {
    const ts = new Date().toISOString()
    setCardapioHoje(prev => {
      const opcoes = prev.opcoes.map(o => o.id === id ? { ...o, disponivel: !o.disponivel } : o)
      setTimeout(() => {
        supabase.from('cardapio_hoje').update({ opcoes, atualizadoEm: ts }).eq('id', 1)
      }, 0)
      return { ...prev, opcoes, atualizadoEm: ts }
    })
  }

  // ── Cardápio geral (refrigerantes / combos) ───────────────
  function adicionarItemCardapio(dados) {
    const novo = { id: Date.now(), ...dados, disponivel: true }
    setCardapio(prev => [novo, ...prev])
    supabase.from('cardapio').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar item do cardápio:', error)
        setCardapio(prev => prev.filter(i => i.id !== novo.id))
        alert('Erro ao salvar item. Tente novamente.')
      }
    })
  }

  function toggleDisponibilidade(id) {
    setCardapio(prev => prev.map(i => {
      if (i.id === id) {
        supabase.from('cardapio').update({ disponivel: !i.disponivel }).eq('id', id)
        return { ...i, disponivel: !i.disponivel }
      }
      return i
    }))
  }

  function removerItemCardapio(id) {
    setCardapio(prev => prev.filter(i => i.id !== id))
    supabase.from('cardapio').delete().eq('id', id)
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
    supabase.from('despesas').insert(nova).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar despesa:', error)
        setDespesas(prev => prev.filter(d => d.id !== nova.id))
        alert('Erro ao salvar despesa. Tente novamente.')
      }
    })
    return nova
  }

  function editarDespesa(id, dados) {
    setDespesas(prev => prev.map(d => d.id === id ? { ...d, ...dados } : d))
    supabase.from('despesas').update(dados).eq('id', id)
  }

  function removerDespesa(id) {
    setDespesas(prev => prev.filter(d => d.id !== id))
    supabase.from('despesas').delete().eq('id', id)
  }

  function pagarDespesa(id) {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        const novo = { ...d, pago: !d.pago, pagadoEm: new Date().toISOString() }
        supabase.from('despesas').update({ pago: novo.pago, pagadoEm: novo.pagadoEm }).eq('id', id)
        return novo
      }
      return d
    }))
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
    supabase.from('estoque').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar estoque:', error)
        setEstoque(prev => prev.filter(e => e.id !== novo.id))
        alert('Erro ao salvar item de estoque. Tente novamente.')
      }
    })
    return novo
  }

  function editarEstoque(id, dados) {
    setEstoque(prev => prev.map(e => e.id === id ? { ...e, ...dados } : e))
    supabase.from('estoque').update(dados).eq('id', id)
  }

  function removerEstoque(id) {
    setEstoque(prev => prev.filter(e => e.id !== id))
    supabase.from('estoque').delete().eq('id', id)
  }

  function atualizarQuantidade(id, delta) {
    setEstoque(prev => prev.map(e => {
      if (e.id === id) {
        const quantidade = Math.max(0, Number(e.quantidade) + delta)
        supabase.from('estoque').update({ quantidade }).eq('id', id)
        return { ...e, quantidade }
      }
      return e
    }))
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
    supabase.from('fornecedores').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar fornecedor:', error)
        setFornecedores(prev => prev.filter(f => f.id !== novo.id))
        alert('Erro ao salvar fornecedor. Tente novamente.')
      }
    })
    return novo
  }

  function editarFornecedor(id, dados) {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ...dados } : f))
    supabase.from('fornecedores').update(dados).eq('id', id)
  }

  function removerFornecedor(id) {
    setFornecedores(prev => prev.filter(f => f.id !== id))
    supabase.from('fornecedores').delete().eq('id', id)
  }

  function pagarFornecedor(id) {
    setFornecedores(prev => prev.map(f => {
      if (f.id === id) {
        const novo = { ...f, pago: !f.pago, pagadoEm: new Date().toISOString() }
        supabase.from('fornecedores').update({ pago: novo.pago, pagadoEm: novo.pagadoEm }).eq('id', id)
        return novo
      }
      return f
    }))
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
    supabase.from('funcionarios').insert(novo).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar funcionário:', error)
        setFuncionarios(prev => prev.filter(f => f.id !== novo.id))
        alert('Erro ao salvar funcionário. Tente novamente.')
      }
    })
    return novo
  }

  function editarFuncionario(id, dados) {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...dados } : f))
    supabase.from('funcionarios').update(dados).eq('id', id)
  }

  function removerFuncionario(id) {
    setFuncionarios(prev => prev.filter(f => f.id !== id))
    supabase.from('funcionarios').delete().eq('id', id)
  }

  // ── Motoboys ──────────────────────────────────────────────
  function adicionarMotoboy(nome) {
    if (!nome.trim()) return
    setMotoboys(prev => prev.includes(nome.trim()) ? prev : [...prev, nome.trim()])
    supabase.from('motoboys').insert({ nome: nome.trim() }).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar motoboy:', error)
        setMotoboys(prev => prev.filter(m => m !== nome.trim()))
        alert('Erro ao salvar motoboy. Tente novamente.')
      }
    })
  }

  function removerMotoboy(nome) {
    setMotoboys(prev => prev.filter(m => m !== nome))
    supabase.from('motoboys').delete().eq('nome', nome)
  }

  function salvarConfig(dados) {
    const ts = new Date().toISOString()
    setConfig(prev => ({ ...prev, ...dados }))
    supabase.from('configuracoes').upsert({ id: 1, ...dados, atualizadoEm: ts })
  }

  return (
    <AppContext.Provider value={{
      // Clientes
      clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente,
      // Pedidos
      pedidos, adicionarPedido, atualizarStatusPedido, atualizarPagamentoPedido, atribuirMotoboy, quitarPedido, removerPedido, marcarComandaImpressa,
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
      // Config
      config, salvarConfig,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
