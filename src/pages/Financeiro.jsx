import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TrendingUp, Plus, X, Check, ChevronDown } from 'lucide-react'

const CATEGORIAS_DESPESA = ['Compras/Ingredientes', 'Combustível', 'Embalagens', 'Manutenção', 'Salários', 'Outros']

const CATEGORIA_COR = {
  'Compras/Ingredientes': 'bg-green-100 text-green-800',
  'Combustível': 'bg-blue-100 text-blue-800',
  'Embalagens': 'bg-purple-100 text-purple-800',
  'Manutenção': 'bg-orange-100 text-orange-800',
  'Salários': 'bg-indigo-100 text-indigo-800',
  'Outros': 'bg-gray-100 text-gray-700',
}

const FORM_VAZIO = {
  categoria: 'Compras/Ingredientes',
  descricao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
  pago: true,
}

export default function Financeiro() {
  const { despesas, adicionarDespesa, editarDespesa, removerDespesa, pagarDespesa, pedidos } = useApp()
  const [aba, setAba] = useState('despesas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [editandoId, setEditandoId] = useState(null)

  function salvar() {
    if (!form.descricao.trim() || !form.valor) return
    const dados = { ...form, valor: Number(form.valor) }
    if (editandoId) {
      editarDespesa(editandoId, dados)
      setEditandoId(null)
    } else {
      adicionarDespesa(dados)
    }
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(d) {
    setForm({
      categoria: d.categoria,
      descricao: d.descricao,
      valor: String(d.valor),
      data: d.data,
      pago: d.pago,
    })
    setEditandoId(d.id)
    setMostrarForm(true)
  }

  function cancelar() {
    setForm(FORM_VAZIO)
    setMostrarForm(false)
    setEditandoId(null)
  }

  const despesasFiltradas = despesas
    .filter(d => filtroCategoria === 'todas' || d.categoria === filtroCategoria)
    .filter(d => filtroPago === 'todos' || (filtroPago === 'pago' ? d.pago : !d.pago))
    .sort((a, b) => b.data.localeCompare(a.data))

  // Fluxo do dia
  const hoje = new Date().toISOString().split('T')[0]
  const pedidosHoje = pedidos.filter(p => p.criadoEm?.startsWith(hoje) && p.status !== 'cancelado')
  const receitasHoje = pedidosHoje
    .filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista'))
    .reduce((acc, p) => acc + Number(p.total), 0)
  const despesasHoje = despesas
    .filter(d => d.data === hoje && d.pago)
    .reduce((acc, d) => acc + Number(d.valor), 0)
  const liquidoHoje = receitasHoje - despesasHoje

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Financeiro</h1>
          <p className="text-sm text-gray-500">Controle de despesas e fluxo de caixa</p>
        </div>
        {aba === 'despesas' && (
          <button
            onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nova Despesa
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-6">
        {[['despesas', 'Despesas'], ['fluxo', 'Fluxo do Dia']].map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === key ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Aba Despesas */}
      {aba === 'despesas' && (
        <div>
          {mostrarForm && (
            <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
              <h2 className="font-semibold text-amber-900 mb-4">{editandoId ? 'Editar Despesa' : 'Nova Despesa'}</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                  <select value={form.categoria} onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                  <input type="date" value={form.data}
                    onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                  <input type="text" value={form.descricao}
                    onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: Compra de frango..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.valor}
                    onChange={e => setForm(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0,00" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setForm(prev => ({ ...prev, pago: !prev.pago }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${form.pago ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {form.pago ? <><Check size={12} /> Pago</> : 'Não pago'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={salvar}
                  disabled={!form.descricao.trim() || !form.valor}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Check size={15} /> {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
                <button onClick={cancelar}
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <X size={15} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none">
              <option value="todas">Todas categorias</option>
              {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none">
              <option value="todos">Pago e não pago</option>
              <option value="pago">Somente pagos</option>
              <option value="pendente">Somente pendentes</option>
            </select>
          </div>

          {/* Totais filtrados */}
          {despesasFiltradas.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <p className="text-xs text-gray-500">Total filtrado</p>
                <p className="text-lg font-bold text-gray-800">
                  R$ {despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 shadow-sm">
                <p className="text-xs text-green-600">Pagos</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {despesasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 shadow-sm">
                <p className="text-xs text-orange-600">Pendentes</p>
                <p className="text-lg font-bold text-orange-700">
                  R$ {despesasFiltradas.filter(d => !d.pago).reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          )}

          {despesasFiltradas.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma despesa encontrada</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {despesasFiltradas.map(d => (
                <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORIA_COR[d.categoria] || 'bg-gray-100 text-gray-700'}`}>
                        {d.categoria}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{d.descricao}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">R$ {Number(d.valor).toFixed(2).replace('.', ',')}</span>
                    <button
                      onClick={() => pagarDespesa(d.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${d.pago ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'}`}>
                      {d.pago ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                    <button onClick={() => iniciarEdicao(d)} className="text-gray-400 hover:text-amber-600 text-xs">Editar</button>
                    <button onClick={() => removerDespesa(d.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba Fluxo */}
      {aba === 'fluxo' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Receitas</p>
              <p className="text-3xl font-bold text-green-800">R$ {receitasHoje.toFixed(2).replace('.', ',')}</p>
              <p className="text-xs text-green-600 mt-1">{pedidosHoje.filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista')).length} pedido(s) pago(s)</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Despesas</p>
              <p className="text-3xl font-bold text-red-800">R$ {despesasHoje.toFixed(2).replace('.', ',')}</p>
              <p className="text-xs text-red-600 mt-1">{despesas.filter(d => d.data === hoje && d.pago).length} lançamento(s)</p>
            </div>
            <div className={`border rounded-2xl p-5 ${liquidoHoje >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${liquidoHoje >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Líquido</p>
              <p className={`text-3xl font-bold ${liquidoHoje >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                R$ {Math.abs(liquidoHoje).toFixed(2).replace('.', ',')}
              </p>
              <p className={`text-xs mt-1 ${liquidoHoje >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {liquidoHoje >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </div>
          </div>

          {/* Barra visual */}
          {(receitasHoje + despesasHoje) > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-600 mb-3">Proporção Receitas vs Despesas</p>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                {receitasHoje > 0 && (
                  <div
                    className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold transition-all"
                    style={{ width: `${(receitasHoje / (receitasHoje + despesasHoje)) * 100}%` }}>
                    {receitasHoje > 0 && ((receitasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0) > 15 ? `${((receitasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0)}%` : ''}
                  </div>
                )}
                {despesasHoje > 0 && (
                  <div
                    className="bg-red-400 h-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${(despesasHoje / (receitasHoje + despesasHoje)) * 100}%` }}>
                    {despesasHoje > 0 && ((despesasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0) > 15 ? `${((despesasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0)}%` : ''}
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-green-600 flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Receitas</span>
                <span className="text-xs text-red-600 flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-full inline-block"></span> Despesas</span>
              </div>
            </div>
          )}

          {/* Despesas de hoje */}
          {despesas.filter(d => d.data === hoje).length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Despesas de Hoje</h3>
              <div className="grid gap-2">
                {despesas.filter(d => d.data === hoje).map(d => (
                  <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mr-2 ${CATEGORIA_COR[d.categoria] || 'bg-gray-100 text-gray-700'}`}>
                        {d.categoria}
                      </span>
                      <span className="text-sm text-gray-700">{d.descricao}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">R$ {Number(d.valor).toFixed(2).replace('.', ',')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
