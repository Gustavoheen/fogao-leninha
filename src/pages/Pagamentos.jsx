import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CreditCard, TrendingUp, Banknote, Smartphone, CircleDollarSign, Clock, ShoppingBag, AlertCircle } from 'lucide-react'

const ICONE_PAGAMENTO = {
  'Dinheiro': Banknote,
  'PIX': Smartphone,
  'Cartão de Débito': CreditCard,
  'Cartão de Crédito': CreditCard,
  'Fiado': CircleDollarSign,
  'Pendente': AlertCircle,
}

const COR_PAGAMENTO = {
  'Dinheiro': 'bg-green-50 border-green-200 text-green-800',
  'PIX': 'bg-blue-50 border-blue-200 text-blue-800',
  'Cartão de Débito': 'bg-purple-50 border-purple-200 text-purple-800',
  'Cartão de Crédito': 'bg-indigo-50 border-indigo-200 text-indigo-800',
  'Fiado': 'bg-orange-50 border-orange-200 text-orange-800',
  'Pendente': 'bg-red-50 border-red-200 text-red-800',
}

export default function Pagamentos() {
  const { pedidos, clientes, quitarPedido, debitoPendente } = useApp()

  const hoje = new Date().toDateString()
  const pedidosHoje = pedidos.filter(p =>
    new Date(p.criadoEm).toDateString() === hoje && p.status !== 'cancelado'
  )
  const pedidosPagosHoje = pedidosHoje.filter(p => p.pagamento !== 'Pendente' && p.status !== 'pendente')
  const totalHoje = pedidosPagosHoje.reduce((acc, p) => acc + Number(p.total), 0)
  const totalPedidosHoje = pedidosHoje.length

  // Por forma de pagamento (só pagos)
  const porForma = pedidosPagosHoje.reduce((acc, p) => {
    acc[p.pagamento] = (acc[p.pagamento] || 0) + Number(p.total)
    return acc
  }, {})

  // Pedidos pendentes de pagamento
  const pedidosPendentes = pedidos.filter(p =>
    (p.pagamento === 'Pendente' || p.status === 'pendente') && p.status !== 'cancelado'
  )
  const totalPendente = pedidosPendentes.reduce((acc, p) => acc + Number(p.total), 0)

  // Pedidos por hora (timeline do dia)
  const porHora = pedidosHoje.reduce((acc, p) => {
    const hora = new Date(p.criadoEm).getHours()
    const chave = `${hora.toString().padStart(2, '0')}:00`
    acc[chave] = (acc[chave] || 0) + 1
    return acc
  }, {})
  const maxPorHora = Math.max(...Object.values(porHora), 1)

  // Clientes mensalistas com débito
  const mensalistasComDebito = clientes
    .filter(c => c.tipo === 'mensalista')
    .map(c => ({ ...c, debito: debitoPendente(c.id) }))
    .filter(c => c.debito > 0)

  // Clientes normais com pendente
  const clientesComPendente = pedidosPendentes.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) acc[key] = { nome: p.clienteNome, total: 0, pedidos: [] }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <TrendingUp size={15} />
            <span className="text-xs">Arrecadado Hoje</span>
          </div>
          <p className="text-3xl font-bold">R$ {totalHoje.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs opacity-70 mt-1">{pedidosPagosHoje.length} pedido(s) pago(s)</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-gray-500">
            <ShoppingBag size={15} />
            <span className="text-xs">Total de Pedidos</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalPedidosHoje}</p>
          <p className="text-xs text-gray-400 mt-1">pedidos hoje</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm border ${totalPendente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
          <div className={`flex items-center gap-2 mb-1 ${totalPendente > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
            <AlertCircle size={15} />
            <span className="text-xs">Pendente de Pagto</span>
          </div>
          <p className={`text-3xl font-bold ${totalPendente > 0 ? 'text-orange-700' : 'text-gray-800'}`}>
            R$ {totalPendente.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{pedidosPendentes.length} pedido(s)</p>
        </div>
      </div>

      {/* Formas de pagamento */}
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Por Forma de Pagamento</h2>
      {Object.keys(porForma).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center text-gray-400 text-sm mb-6">
          Nenhum pagamento registrado hoje
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => {
            const Icon = ICONE_PAGAMENTO[forma] || CreditCard
            const percent = totalHoje > 0 ? (valor / totalHoje) * 100 : 0
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
      )}

      {/* Timeline de horários */}
      {Object.keys(porHora).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Clock size={13} /> Pedidos por Horário
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-end gap-2 h-20">
              {Object.entries(porHora).sort().map(([hora, qtd]) => (
                <div key={hora} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-bold text-amber-700">{qtd}</span>
                  <div
                    className="w-full bg-amber-500 rounded-t"
                    style={{ height: `${(qtd / maxPorHora) * 56}px` }}
                  />
                  <span className="text-xs text-gray-400">{hora}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagamentos pendentes por cliente */}
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

      {/* Mensalistas */}
      {mensalistasComDebito.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Mensalistas com Débito
          </h2>
          <div className="grid gap-2">
            {mensalistasComDebito.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{c.nome}</p>
                  {c.endereco && <p className="text-xs text-gray-400">{c.endereco}</p>}
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block">Mensalista</span>
                </div>
                <span className="font-bold text-orange-700 text-lg">R$ {c.debito.toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
