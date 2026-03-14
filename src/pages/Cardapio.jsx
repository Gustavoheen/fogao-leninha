import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BookOpen, Plus, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react'

const CATEGORIAS = ['Marmitex', 'Combo', 'Refrigerante', 'Acompanhamento', 'Sobremesa', 'Entrada']
const SUBTIPOS_REFRIGERANTE = ['Lata', 'Mini', '2 Litros']

const VAZIO = { nome: '', categoria: 'Marmitex', descricao: '', preco: '', precoP: '', subtipo: 'Lata' }

export default function Cardapio() {
  const { cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio } = useApp()
  const [form, setForm] = useState(VAZIO)
  const [mostrarForm, setMostrarForm] = useState(false)

  const disponiveis = cardapio.filter(i => i.disponivel)
  const indisponiveis = cardapio.filter(i => !i.disponivel)

  function salvar() {
    if (!form.nome.trim() || !form.preco) return
    const dados = {
      nome: form.nome,
      categoria: form.categoria,
      descricao: form.descricao,
      preco: parseFloat(form.preco),
    }
    if (form.categoria === 'Marmitex' && form.precoP) {
      dados.precoP = parseFloat(form.precoP)
    }
    if (form.categoria === 'Refrigerante') {
      dados.subtipo = form.subtipo
    }
    adicionarItemCardapio(dados)
    setForm(VAZIO)
    setMostrarForm(false)
  }

  // Agrupa por categoria
  const porCategoria = CATEGORIAS.reduce((acc, cat) => {
    const itens = disponiveis.filter(i => i.categoria === cat)
    if (itens.length > 0) acc[cat] = itens
    return acc
  }, {})

  const COR_CATEGORIA = {
    'Marmitex': 'text-orange-700 border-orange-200',
    'Combo': 'text-purple-700 border-purple-200',
    'Refrigerante': 'text-blue-700 border-blue-200',
    'Acompanhamento': 'text-green-700 border-green-200',
    'Sobremesa': 'text-pink-700 border-pink-200',
    'Entrada': 'text-yellow-700 border-yellow-200',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Cardápio do Dia</h1>
          <p className="text-sm text-gray-500">{disponiveis.length} item(s) disponível(is)</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Adicionar Item
        </button>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">Novo Item</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: Frango com quiabo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Preço G (ou único) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {form.categoria === 'Marmitex' ? 'Preço G (R$) *' : 'Preço (R$) *'}
              </label>
              <input type="number" min="0" step="0.01" value={form.preco}
                onChange={e => setForm({ ...form, preco: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0,00" />
            </div>

            {/* Preço P — só para marmitex */}
            {form.categoria === 'Marmitex' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço P (R$)</label>
                <input type="number" min="0" step="0.01" value={form.precoP}
                  onChange={e => setForm({ ...form, precoP: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="0,00 (opcional)" />
              </div>
            )}

            {/* Subtipo refrigerante */}
            {form.categoria === 'Refrigerante' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tamanho</label>
                <select value={form.subtipo} onChange={e => setForm({ ...form, subtipo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  {SUBTIPOS_REFRIGERANTE.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div className={form.categoria === 'Marmitex' || form.categoria === 'Refrigerante' ? '' : 'col-span-1'}>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
              <input type="text" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ingredientes, detalhes..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={15} /> Salvar
            </button>
            <button onClick={() => { setForm(VAZIO); setMostrarForm(false) }}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista por categoria */}
      {Object.keys(porCategoria).length === 0 && indisponiveis.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum item no cardápio ainda</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(porCategoria).map(([cat, itens]) => (
            <div key={cat}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 ${COR_CATEGORIA[cat] || 'text-gray-600'}`}>{cat}</h2>
              <div className="grid gap-2">
                {itens.map(item => (
                  <ItemCard key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} />
                ))}
              </div>
            </div>
          ))}

          {indisponiveis.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Indisponíveis hoje</h2>
              <div className="grid gap-2">
                {indisponiveis.map(item => (
                  <ItemCard key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, onToggle, onRemover }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${!item.disponivel ? 'opacity-50' : 'border-gray-100'}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800">{item.nome}</p>
          {item.subtipo && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{item.subtipo}</span>
          )}
        </div>
        {item.descricao && <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>}
        <div className="flex items-center gap-3 mt-1">
          {item.precoP && (
            <p className="text-sm text-amber-700 font-semibold">
              P: R$ {Number(item.precoP).toFixed(2).replace('.', ',')}
            </p>
          )}
          <p className="text-sm font-bold text-green-700">
            {item.precoP ? 'G: ' : ''}R$ {Number(item.preco).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onToggle(item.id)}
          className={`p-1.5 rounded-lg transition-colors ${item.disponivel ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
          title={item.disponivel ? 'Marcar indisponível' : 'Marcar disponível'}>
          {item.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
        <button onClick={() => onRemover(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
