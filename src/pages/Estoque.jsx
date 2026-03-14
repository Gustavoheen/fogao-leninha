import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Package, Plus, X, Check, AlertTriangle } from 'lucide-react'

const CATEGORIAS = ['Carnes', 'Temperos', 'Bebidas', 'Embalagens', 'Limpeza', 'Outros']
const UNIDADES = ['kg', 'g', 'L', 'ml', 'un', 'cx']

const CATEGORIA_COR = {
  'Carnes': 'bg-red-100 text-red-800',
  'Temperos': 'bg-yellow-100 text-yellow-800',
  'Bebidas': 'bg-blue-100 text-blue-800',
  'Embalagens': 'bg-purple-100 text-purple-800',
  'Limpeza': 'bg-cyan-100 text-cyan-800',
  'Outros': 'bg-gray-100 text-gray-700',
}

const FORM_VAZIO = {
  nome: '',
  categoria: 'Carnes',
  quantidade: '',
  unidade: 'kg',
  qtdMinima: '',
  preco: '',
}

export default function Estoque() {
  const { estoque, adicionarEstoque, editarEstoque, removerEstoque, atualizarQuantidade } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  function salvar() {
    if (!form.nome.trim()) return
    const dados = {
      ...form,
      quantidade: Number(form.quantidade) || 0,
      qtdMinima: Number(form.qtdMinima) || 0,
      preco: Number(form.preco) || 0,
    }
    if (editandoId) {
      editarEstoque(editandoId, dados)
      setEditandoId(null)
    } else {
      adicionarEstoque(dados)
    }
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(item) {
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: String(item.quantidade),
      unidade: item.unidade,
      qtdMinima: String(item.qtdMinima),
      preco: String(item.preco),
    })
    setEditandoId(item.id)
    setMostrarForm(true)
  }

  function cancelar() {
    setForm(FORM_VAZIO)
    setMostrarForm(false)
    setEditandoId(null)
  }

  const estoqueFiltrado = estoque
    .filter(e => filtroCategoria === 'todas' || e.categoria === filtroCategoria)
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const totalCusto = estoque.reduce((acc, e) => acc + Number(e.quantidade) * Number(e.preco), 0)
  const abaixoMinimo = estoque.filter(e => Number(e.quantidade) <= Number(e.qtdMinima) && Number(e.qtdMinima) > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Estoque</h1>
          <p className="text-sm text-gray-500">{estoque.length} item(s) • Custo estimado: R$ {totalCusto.toFixed(2).replace('.', ',')}</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Alertas de estoque baixo */}
      {abaixoMinimo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} /> {abaixoMinimo.length} item(s) abaixo do mínimo
          </p>
          <div className="flex flex-wrap gap-2">
            {abaixoMinimo.map(e => (
              <span key={e.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {e.nome}: {e.quantidade} {e.unidade}
              </span>
            ))}
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">{editandoId ? 'Editar Item' : 'Novo Item de Estoque'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
              <input type="text" value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: Frango, Arroz..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
              <select value={form.unidade} onChange={e => setForm(prev => ({ ...prev, unidade: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade atual</label>
              <input type="number" min="0" step="0.01" value={form.quantidade}
                onChange={e => setForm(prev => ({ ...prev, quantidade: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Qtd. Mínima (alerta)</label>
              <input type="number" min="0" step="0.01" value={form.qtdMinima}
                onChange={e => setForm(prev => ({ ...prev, qtdMinima: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preço de custo (R$)</label>
              <input type="number" min="0" step="0.01" value={form.preco}
                onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0,00" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={salvar} disabled={!form.nome.trim()}
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

      {/* Filtro de categoria */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['todas', 'Todas'], ...CATEGORIAS.map(c => [c, c])].map(([key, label]) => (
          <button key={key} onClick={() => setFiltroCategoria(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroCategoria === key ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {estoqueFiltrado.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum item no estoque</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {estoqueFiltrado.map(item => {
            const abaixo = Number(item.qtdMinima) > 0 && Number(item.quantidade) <= Number(item.qtdMinima)
            return (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-4 ${abaixo ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{item.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CATEGORIA_COR[item.categoria] || 'bg-gray-100 text-gray-700'}`}>
                        {item.categoria}
                      </span>
                      {abaixo && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <AlertTriangle size={10} /> Estoque baixo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-lg font-bold ${abaixo ? 'text-red-700' : 'text-gray-800'}`}>
                        {item.quantidade} {item.unidade}
                      </span>
                      {Number(item.qtdMinima) > 0 && (
                        <span className="text-xs text-gray-400">mín: {item.qtdMinima} {item.unidade}</span>
                      )}
                      {Number(item.preco) > 0 && (
                        <span className="text-xs text-gray-500">
                          R$ {(Number(item.quantidade) * Number(item.preco)).toFixed(2).replace('.', ',')} em estoque
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => atualizarQuantidade(item.id, -1)}
                      className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">-</button>
                    <button onClick={() => atualizarQuantidade(item.id, 1)}
                      className="w-8 h-8 bg-green-100 border border-green-200 rounded-lg font-bold text-green-700 hover:bg-green-200 transition-colors">+</button>
                    <button onClick={() => iniciarEdicao(item)} className="text-xs text-gray-400 hover:text-amber-600 px-1">Editar</button>
                    <button onClick={() => removerEstoque(item.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
