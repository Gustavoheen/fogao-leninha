import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart3, TrendingUp, ShoppingBag, AlertCircle, Banknote, Smartphone, CreditCard, CircleDollarSign, Bike } from 'lucide-react'

const ICONE_PAGAMENTO = {
  'Dinheiro': Banknote,
  'PIX': Smartphone,
  'Cartão de Débito': CreditCard,
  'Cartão de Crédito': CreditCard,
  'Mensalista': CircleDollarSign,
  'Pendente': AlertCircle,
}

const COR_PAGAMENTO = {
  'Dinheiro': 'bg-green-50 border-green-200 text-green-800',
  'PIX': 'bg-blue-50 border-blue-200 text-blue-800',
  'Cartão de Débito': 'bg-purple-50 border-purple-200 text-purple-800',
  'Cartão de Crédito': 'bg-indigo-50 border-indigo-200 text-indigo-800',
  'Mensalista': 'bg-orange-50 border-orange-200 text-orange-800',
  'Pendente': 'bg-red-50 border-red-200 text-red-800',
}

function dataInicioPeriodo(periodo, dataCustom) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (periodo === 'hoje') return hoje
  if (periodo === 'semana') {
    const d = new Date(hoje)
    d.setDate(d.getDate() - d.getDay())
    return d
  }
  if (periodo === 'mes') {
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  }
  if (periodo === 'custom' && dataCustom.inicio) {
    const d = new Date(dataCustom.inicio + 'T00:00:00')
    return d
  }
  return hoje
}

function dataFimPeriodo(periodo, dataCustom) {
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 999)
  if (periodo === 'hoje') return hoje
  if (periodo === 'semana') {
    const d = new Date(hoje)
    d.setDate(d.getDate() + (6 - d.getDay()))
    d.setHours(23, 59, 59, 999)
    return d
  }
  if (periodo === 'mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    d.setHours(23, 59, 59, 999)
    return d
  }
  if (periodo === 'custom' && dataCustom.fim) {
    const d = new Date(dataCustom.fim + 'T23:59:59')
    return d
  }
  return hoje
}

export default function Dashboard() {
  const { pedidos, despesas, funcionarios, clientes, quitarPedido, debitoPendente } = useApp()
  const [periodo, setPeriodo] = useState('hoje')
  const [dataCustom, setDataCustom] = useState({ inicio: '', fim: '' })

  const inicio = dataInicioPeriodo(periodo, dataCustom)
  const fim = dataFimPeriodo(periodo, dataCustom)

  const pedidosPeriodo = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    return d >= inicio && d <= fim && p.status !== 'cancelado'
  })

  const pedidosPagos = pedidosPeriodo.filter(p =>
    p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista')
  )
  const totalReceitas = pedidosPagos.reduce((acc, p) => acc + Number(p.total), 0)

  const despesasPeriodo = despesas.filter(d => {
    const dt = new Date(d.data + 'T12:00:00')
    return dt >= inicio && dt <= fim && d.pago
  })
  const totalDespesas = despesasPeriodo.reduce((acc, d) => acc + Number(d.valor), 0)

  // Salários proporcionais (para o mês)
  const funcionariosAtivos = funcionarios.filter(f => f.ativo !== false)
  const totalSalarios = funcionariosAtivos.reduce((acc, f) => acc + Number(f.salario || 0), 0)
  let salarioProporcional = totalSalarios
  if (periodo === 'hoje') {
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    salarioProporcional = totalSalarios / diasNoMes
  } else if (periodo === 'semana') {
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    salarioProporcional = (totalSalarios / diasNoMes) * 7
  }

  const lucroLiquido = totalReceitas - totalDespesas - (periodo === 'mes' ? totalSalarios : salarioProporcional)

  // Por forma de pagamento
  const porForma = pedidosPagos.reduce((acc, p) => {
    acc[p.pagamento] = (acc[p.pagamento] || 0) + Number(p.total)
    return acc
  }, {})

  // Pedidos pendentes de pagamento
  const pedidosPendentes = pedidos.filter(p =>
    (p.statusPagamento === 'pendente' || p.statusPagamento === 'mensalista') && p.status !== 'cancelado'
  )
  const totalPendente = pedidosPendentes.reduce((acc, p) => acc + Number(p.total), 0)

  // Motoboys hoje
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const pedidosHojeEntregues = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === hoje.getTime() && p.status === 'entregue' && p.motoboy
  })
  const porMotoboy = pedidosHojeEntregues.reduce((acc, p) => {
    const key = p.motoboy
    if (!acc[key]) acc[key] = { entregas: 0, valor: 0 }
    acc[key].entregas++
    acc[key].valor += Number(p.total)
    return acc
  }, {})

  // Clientes com pendente
  const clientesComPendente = pedidosPendentes.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) acc[key] = { nome: p.clienteNome, total: 0, pedidos: [] }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    return acc
  }, {})

  // Mensalistas com débito
  const mensalistasComDebito = clientes
    .filter(c => c.tipo === 'mensalista')
    .map(c => ({ ...c, debito: debitoPendente(c.id) }))
    .filter(c => c.debito > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Seletor de período */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {[['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['custom', 'Personalizado']].map(([key, label]) => (
          <button key={key} onClick={() => setPeriodo(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodo === key ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400'}`}>
            {label}
          </button>
        ))}
        {periodo === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={dataCustom.inicio}
              onChange={e => setDataCustom(prev => ({ ...prev, inicio: e.target.value }))}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={dataCustom.fim}
              onChange={e => setDataCustom(prev => ({ ...prev, fim: e.target.value }))}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none" />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <TrendingUp size={14} />
            <span className="text-xs">Receitas</span>
          </div>
          <p className="text-2xl font-bold">R$ {totalReceitas.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs opacity-70 mt-1">{pedidosPagos.length} pedido(s)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-red-500">
            <TrendingUp size={14} className="rotate-180" />
            <span className="text-xs text-gray-500">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-700">R$ {totalDespesas.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-gray-400 mt-1">{despesasPeriodo.length} lançamento(s)</p>
        </div>
        <div className={`border rounded-2xl p-4 shadow-sm ${lucroLiquido >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">Lucro Líquido</span>
          </div>
          <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            R$ {Math.abs(lucroLiquido).toFixed(2).replace('.', ',')}
          </p>
          <p className={`text-xs mt-1 ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
          </p>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm border ${totalPendente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className={totalPendente > 0 ? 'text-orange-600' : 'text-gray-400'} />
            <span className="text-xs text-gray-500">Pendente</span>
          </div>
          <p className={`text-2xl font-bold ${totalPendente > 0 ? 'text-orange-700' : 'text-gray-800'}`}>
            R$ {totalPendente.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{pedidosPendentes.length} pedido(s)</p>
        </div>
      </div>

      {/* Por forma de pagamento */}
      {Object.keys(porForma).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Por Forma de Pagamento</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => {
              const Icon = ICONE_PAGAMENTO[forma] || CreditCard
              const percent = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0
              return (
                <div key={forma} className={`rounded-xl border p-4 shadow-sm ${COR_PAGAMENTO[forma] || 'bg-white border-gray-100 text-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} />
                    <span className="text-sm font-medium">{forma}</span>
                  </div>
                  <p className="text-xl font-bold">R$ {valor.toFixed(2).replace('.', ',')}</p>
                  <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-current rounded-full opacity-40" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-xs opacity-60 mt-1">{percent.toFixed(0)}% do total</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motoboys hoje */}
      {Object.keys(porMotoboy).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Bike size={13} /> Motoboys Hoje
          </h2>
          <div className="grid gap-2">
            {Object.entries(porMotoboy).map(([nome, info]) => (
              <div key={nome} className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike size={16} className="text-indigo-500" />
                  <span className="font-medium text-gray-800">{nome}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">{info.entregas} entrega(s)</span>
                  <span className="font-bold text-green-700">R$ {info.valor.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagamentos pendentes */}
      {Object.keys(clientesComPendente).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <AlertCircle size={13} /> Pagamentos Pendentes
          </h2>
          <div className="grid gap-2">
            {Object.values(clientesComPendente).map((c, idx) => (
              <ClientePendenteCard key={idx} cliente={c} onQuitar={quitarPedido} />
            ))}
          </div>
        </div>
      )}

      {/* Mensalistas com débito */}
      {mensalistasComDebito.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Mensalistas com Débito</h2>
          <div className="grid gap-2">
            {mensalistasComDebito.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{c.nome}</p>
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">Mensalista</span>
                </div>
                <span className="font-bold text-orange-700 text-lg">R$ {c.debito.toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fechamento mensal */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fechamento do Mês</h2>
        <FechamentoMensal pedidos={pedidos} despesas={despesas} funcionarios={funcionariosAtivos} />
      </div>
    </div>
  )
}

function FechamentoMensal({ pedidos, despesas, funcionarios }) {
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59)

  const pedidosMes = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    return d >= inicioMes && d <= fimMes && p.status !== 'cancelado'
  })

  const receitasMes = pedidosMes
    .filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista'))
    .reduce((acc, p) => acc + Number(p.total), 0)

  const despesasMes = despesas
    .filter(d => {
      const dt = new Date(d.data + 'T12:00:00')
      return dt >= inicioMes && dt <= fimMes && d.pago
    })
    .reduce((acc, d) => acc + Number(d.valor), 0)

  const salarios = funcionarios.reduce((acc, f) => acc + Number(f.salario || 0), 0)
  const lucro = receitasMes - despesasMes - salarios
  const positivo = lucro >= 0

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${positivo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Receitas totais</p>
          <p className="text-xl font-bold text-green-700">R$ {receitasMes.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Despesas operacionais</p>
          <p className="text-xl font-bold text-red-600">R$ {despesasMes.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Salários</p>
          <p className="text-xl font-bold text-orange-600">R$ {salarios.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Resultado</p>
          <p className={`text-2xl font-bold ${positivo ? 'text-green-800' : 'text-red-800'}`}>
            {positivo ? '+' : '-'} R$ {Math.abs(lucro).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
      <div className={`text-center py-2 rounded-xl font-bold text-sm ${positivo ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
        {positivo ? 'Mês com LUCRO' : 'Mês com PREJUÍZO'}
      </div>
    </div>
  )
}

function ClientePendenteCard({ cliente, onQuitar }) {
  const [aberto, setAberto] = useState(false)
  const [formaPagto, setFormaPagto] = useState('Dinheiro')
  const [, forceUpdate] = useState(0)

  return (
    <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setAberto(!aberto)}>
        <div>
          <p className="font-semibold text-gray-800">{cliente.nome}</p>
          <p className="text-xs text-gray-400">{cliente.pedidos.length} pedido(s) pendente(s)</p>
        </div>
        <span className="font-bold text-orange-700">R$ {cliente.total.toFixed(2).replace('.', ',')}</span>
      </div>
      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {cliente.pedidos.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-700">{new Date(p.criadoEm).toLocaleDateString('pt-BR')} — {p.itens?.length} item(s)</p>
                <p className="text-xs text-gray-400">{new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
                <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none">
                  {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(f => <option key={f}>{f}</option>)}
                </select>
                <button onClick={() => { onQuitar(p.id, formaPagto); forceUpdate(n => n + 1) }}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
