import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ClipboardList, Plus, Trash2, X, Check, ChevronDown } from 'lucide-react'

const STATUS_LABELS = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700' },
  pronto: { label: 'Pronto', color: 'bg-green-100 text-green-700' },
  entregue: { label: 'Entregue', color: 'bg-gray-100 text-gray-600' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
}

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Fiado']

export default function Pedidos() {
  const { clientes, pedidos, cardapio, adicionarPedido, atualizarStatusPedido, removerPedido } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const [form, setForm] = useState({
    clienteId: '',
    clienteNome: '',
    itens: [],
    pagamento: 'Dinheiro',
    observacoes: '',
  })

  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus)

  function adicionarItem(item) {
    setForm(prev => {
      const existe = prev.itens.find(i => i.id === item.id)
      if (existe) {
        return { ...prev, itens: prev.itens.map(i => i.id === item.id ? { ...i, qtd: i.qtd + 1 } : i) }
      }
      return { ...prev, itens: [...prev.itens, { ...item, qtd: 1 }] }
    })
  }

  function removerItem(itemId) {
    setForm(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== itemId) }))
  }

  function alterarQtd(itemId, delta) {
    setForm(prev => ({
      ...prev,
      itens: prev.itens
        .map(i => i.id === itemId ? { ...i, qtd: i.qtd + delta } : i)
        .filter(i => i.qtd > 0)
    }))
  }

  const total = form.itens.reduce((acc, i) => acc + i.preco * i.qtd, 0)

  function salvar() {
    if (form.itens.length === 0) return
    const clienteSelecionado = clientes.find(c => c.id === Number(form.clienteId))
    adicionarPedido({
      ...form,
      clienteNome: clienteSelecionado?.nome || form.clienteNome || 'Cliente não identificado',
      total,
    })
    setForm({ clienteId: '', clienteNome: '', itens: [], pagamento: 'Dinheiro', observacoes: '' })
    setMostrarForm(false)
  }

  const cardapioDisponivel = cardapio.filter(i => i.disponivel)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado').length} pedido(s) em aberto</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['todos', 'Todos'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroStatus === key ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Formulário novo pedido */}
      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">Novo Pedido</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
              <select
                value={form.clienteId}
                onChange={e => setForm({ ...form, clienteId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Selecionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ou nome avulso</label>
              <input
                type="text"
                value={form.clienteNome}
                onChange={e => setForm({ ...form, clienteNome: e.target.value, clienteId: '' })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome do cliente..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
              <select
                value={form.pagamento}
                onChange={e => setForm({ ...form, pagamento: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <input
                type="text"
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Sem cebola, ponto da carne..."
              />
            </div>
          </div>

          {/* Seleção de itens */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Itens do Cardápio</p>
            {cardapioDisponivel.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum item disponível no cardápio hoje.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cardapioDisponivel.map(item => (
                  <button
                    key={item.id}
                    onClick={() => adicionarItem(item)}
                    className="text-left p-2 border border-gray-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors"
                  >
                    <p className="text-xs font-medium text-gray-800 truncate">{item.nome}</p>
                    <p className="text-xs text-green-700 font-bold">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Itens selecionados */}
          {form.itens.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Itens selecionados:</p>
              {form.itens.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-800">{item.nome}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => alterarQtd(item.id, -1)} className="w-6 h-6 bg-white border rounded text-sm font-bold text-gray-600 hover:bg-gray-100">-</button>
                    <span className="text-sm font-semibold w-4 text-center">{item.qtd}</span>
                    <button onClick={() => alterarQtd(item.id, 1)} className="w-6 h-6 bg-white border rounded text-sm font-bold text-gray-600 hover:bg-gray-100">+</button>
                    <span className="text-xs text-green-700 font-bold w-16 text-right">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
                    <button onClick={() => removerItem(item.id)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                  </div>
                </div>
              ))}
              <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-sm font-bold text-green-700">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={salvar} disabled={form.itens.length === 0} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={15} /> Confirmar Pedido
            </button>
            <button onClick={() => { setForm({ clienteId: '', clienteNome: '', itens: [], pagamento: 'Dinheiro', observacoes: '' }); setMostrarForm(false) }} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pedidosFiltrados.map(pedido => (
            <PedidoCard key={pedido.id} pedido={pedido} onStatus={atualizarStatusPedido} onRemover={removerPedido} />
          ))}
        </div>
      )}
    </div>
  )
}

function PedidoCard({ pedido, onStatus, onRemover }) {
  const [aberto, setAberto] = useState(false)
  const statusInfo = STATUS_LABELS[pedido.status]
  const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-gray-800">{pedido.clienteNome}</p>
            <p className="text-xs text-gray-400">{hora} · {pedido.pagamento}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-green-700 text-sm">R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          <button onClick={() => setAberto(!aberto)} className="text-gray-400 hover:text-gray-600">
            <ChevronDown size={16} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {aberto && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="mt-3 mb-3">
            {pedido.itens.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-0.5">
                <span className="text-gray-600">{item.qtd}x {item.nome}</span>
                <span className="text-gray-500">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
          </div>
          {pedido.observacoes && (
            <p className="text-xs text-amber-600 mb-3">Obs: {pedido.observacoes}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
              pedido.status !== key && (
                <button
                  key={key}
                  onClick={() => onStatus(pedido.id, key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${color} opacity-80 hover:opacity-100 transition-opacity`}
                >
                  → {label}
                </button>
              )
            ))}
            <button onClick={() => onRemover(pedido.id)} className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-auto">
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
