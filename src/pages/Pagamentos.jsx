import { useApp } from '../context/AppContext'
import { CreditCard, TrendingUp, Banknote, Smartphone, CircleDollarSign } from 'lucide-react'

const ICONE_PAGAMENTO = {
  'Dinheiro': Banknote,
  'PIX': Smartphone,
  'Cartão de Débito': CreditCard,
  'Cartão de Crédito': CreditCard,
  'Fiado': CircleDollarSign,
}

export default function Pagamentos() {
  const { pedidos } = useApp()

  const hoje = new Date().toDateString()
  const pedidosHoje = pedidos.filter(p =>
    new Date(p.criadoEm).toDateString() === hoje &&
    p.status !== 'cancelado'
  )

  const totalHoje = pedidosHoje.reduce((acc, p) => acc + Number(p.total), 0)

  // Resumo por forma de pagamento
  const porForma = pedidosHoje.reduce((acc, p) => {
    acc[p.pagamento] = (acc[p.pagamento] || 0) + Number(p.total)
    return acc
  }, {})

  // Pedidos em fiado
  const fiados = pedidos.filter(p => p.pagamento === 'Fiado' && p.status !== 'cancelado' && p.status !== 'entregue')

  const totalFiado = fiados.reduce((acc, p) => acc + Number(p.total), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-amber-900">Pagamentos</h1>
        <p className="text-sm text-gray-500">Resumo financeiro do dia</p>
      </div>

      {/* Card total do dia */}
      <div className="bg-gradient-to-br from-amber-700 to-amber-900 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <TrendingUp size={16} />
          <span className="text-sm">Total Arrecadado Hoje</span>
        </div>
        <p className="text-4xl font-bold">R$ {totalHoje.toFixed(2).replace('.', ',')}</p>
        <p className="text-sm opacity-70 mt-1">{pedidosHoje.length} pedido(s) finalizado(s)</p>
      </div>

      {/* Por forma de pagamento */}
      <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Por Forma de Pagamento</h2>
      {Object.keys(porForma).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm mb-6">
          Nenhum pagamento registrado hoje
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(porForma).map(([forma, valor]) => {
            const Icon = ICONE_PAGAMENTO[forma] || CreditCard
            const percent = totalHoje > 0 ? (valor / totalHoje) * 100 : 0
            return (
              <div key={forma} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <Icon size={16} className="text-amber-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{forma}</span>
                </div>
                <p className="text-xl font-bold text-gray-800">R$ {valor.toFixed(2).replace('.', ',')}</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{percent.toFixed(0)}% do total</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Fiados */}
      <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
        Fiado Pendente
        {fiados.length > 0 && (
          <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs normal-case font-semibold">
            R$ {totalFiado.toFixed(2).replace('.', ',')}
          </span>
        )}
      </h2>
      {fiados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
          Nenhum fiado pendente
        </div>
      ) : (
        <div className="grid gap-2">
          {fiados.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-red-100 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{p.clienteNome}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.criadoEm).toLocaleDateString('pt-BR')} · {p.itens.length} item(s)
                </p>
              </div>
              <span className="font-bold text-red-600">R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
