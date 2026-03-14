import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, ToggleLeft, ToggleRight, X, Check,
  UtensilsCrossed, GlassWater, Package, Salad, Flame
} from 'lucide-react'

const SUBTIPOS_REFRIGERANTE = ['Lata', 'Mini', '2 Litros']
const FORM_REFRIG_VAZIO = { nome: '', subtipo: 'Lata', preco: '' }
const FORM_COMBO_VAZIO = { nome: '', descricao: '', preco: '' }

export default function Cardapio() {
  const {
    cardapioHoje, salvarAcompanhamentos, salvarOpcaoAlmoco, toggleOpcaoAlmoco,
    cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
  } = useApp()

  // Acompanhamentos
  const [novoAcomp, setNovoAcomp] = useState('')

  function adicionarAcomp() {
    const val = novoAcomp.trim()
    if (!val || cardapioHoje.acompanhamentos.includes(val)) return
    salvarAcompanhamentos([...cardapioHoje.acompanhamentos, val])
    setNovoAcomp('')
  }

  function removerAcomp(item) {
    salvarAcompanhamentos(cardapioHoje.acompanhamentos.filter(a => a !== item))
  }

  // Refrigerante
  const [formRefrig, setFormRefrig] = useState(FORM_REFRIG_VAZIO)
  const [addRefrig, setAddRefrig] = useState(false)
  const refrigerantes = cardapio.filter(i => i.categoria === 'Refrigerante')

  function salvarRefrig() {
    if (!formRefrig.nome.trim() || !formRefrig.preco) return
    adicionarItemCardapio({ nome: formRefrig.nome, categoria: 'Refrigerante', subtipo: formRefrig.subtipo, preco: parseFloat(formRefrig.preco) })
    setFormRefrig(FORM_REFRIG_VAZIO)
    setAddRefrig(false)
  }

  // Combo
  const [formCombo, setFormCombo] = useState(FORM_COMBO_VAZIO)
  const [addCombo, setAddCombo] = useState(false)
  const combos = cardapio.filter(i => i.categoria === 'Combo')

  function salvarCombo() {
    if (!formCombo.nome.trim() || !formCombo.preco) return
    adicionarItemCardapio({ nome: formCombo.nome, categoria: 'Combo', descricao: formCombo.descricao, preco: parseFloat(formCombo.preco) })
    setFormCombo(FORM_COMBO_VAZIO)
    setAddCombo(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-900">Cardápio do Dia</h1>
        <p className="text-sm text-gray-500">Configure o almoço, acompanhamentos, refrigerantes e combos</p>
      </div>

      {/* ── ACOMPANHAMENTOS ─────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="flex items-center gap-2 font-bold text-green-800 mb-4">
          <Salad size={18} /> Acompanhamentos do Dia
        </h2>

        <div className="flex flex-wrap gap-2 mb-3 min-h-8">
          {cardapioHoje.acompanhamentos.length === 0 && (
            <p className="text-xs text-gray-400 italic">Nenhum acompanhamento cadastrado</p>
          )}
          {cardapioHoje.acompanhamentos.map(a => (
            <span key={a} className="flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
              {a}
              <button onClick={() => removerAcomp(a)} className="text-green-600 hover:text-red-500 ml-1">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={novoAcomp}
            onChange={e => setNovoAcomp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarAcomp()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Ex: Arroz, Feijão, Macarrão, Batata Frita..."
          />
          <button onClick={adicionarAcomp}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </section>

      {/* ── OPÇÕES DE ALMOÇO ────────────────────────── */}
      <section>
        <h2 className="flex items-center gap-2 font-bold text-orange-800 mb-3">
          <UtensilsCrossed size={18} /> Opções de Almoço
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {cardapioHoje.opcoes.map(opcao => (
            <OpcaoAlmoco
              key={opcao.id}
              opcao={opcao}
              onSalvar={dados => salvarOpcaoAlmoco(opcao.id, dados)}
              onToggle={() => toggleOpcaoAlmoco(opcao.id)}
            />
          ))}
        </div>
      </section>

      {/* ── REFRIGERANTES ───────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-bold text-blue-800">
            <GlassWater size={18} /> Refrigerantes
          </h2>
          <button onClick={() => setAddRefrig(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {addRefrig && (
          <div className="bg-blue-50 rounded-xl p-3 mb-3 grid grid-cols-3 gap-2">
            <input type="text" value={formRefrig.nome} onChange={e => setFormRefrig({ ...formRefrig, nome: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nome (Ex: Coca-Cola)" />
            <select value={formRefrig.subtipo} onChange={e => setFormRefrig({ ...formRefrig, subtipo: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {SUBTIPOS_REFRIGERANTE.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-1">
              <input type="number" min="0" step="0.01" value={formRefrig.preco}
                onChange={e => setFormRefrig({ ...formRefrig, preco: e.target.value })}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="R$ 0,00" />
              <button onClick={salvarRefrig} className="bg-green-600 hover:bg-green-700 text-white px-2.5 rounded-lg"><Check size={15} /></button>
              <button onClick={() => { setFormRefrig(FORM_REFRIG_VAZIO); setAddRefrig(false) }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2.5 rounded-lg"><X size={15} /></button>
            </div>
          </div>
        )}

        {refrigerantes.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhum refrigerante cadastrado</p>
        ) : (
          <div className="grid gap-2">
            {refrigerantes.map(item => (
              <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-lg border ${item.disponivel ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">{item.subtipo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-green-700">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</span>
                  <button onClick={() => toggleDisponibilidade(item.id)}
                    className={item.disponivel ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}>
                    {item.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => removerItemCardapio(item.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMBOS ──────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-bold text-purple-800">
            <Package size={18} /> Combos
          </h2>
          <button onClick={() => setAddCombo(true)}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {addCombo && (
          <div className="bg-purple-50 rounded-xl p-3 mb-3 grid grid-cols-3 gap-2">
            <input type="text" value={formCombo.nome} onChange={e => setFormCombo({ ...formCombo, nome: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Nome do combo" />
            <input type="text" value={formCombo.descricao} onChange={e => setFormCombo({ ...formCombo, descricao: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Descrição" />
            <div className="flex gap-1">
              <input type="number" min="0" step="0.01" value={formCombo.preco}
                onChange={e => setFormCombo({ ...formCombo, preco: e.target.value })}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="R$ 0,00" />
              <button onClick={salvarCombo} className="bg-green-600 hover:bg-green-700 text-white px-2.5 rounded-lg"><Check size={15} /></button>
              <button onClick={() => { setFormCombo(FORM_COMBO_VAZIO); setAddCombo(false) }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2.5 rounded-lg"><X size={15} /></button>
            </div>
          </div>
        )}

        {combos.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhum combo cadastrado</p>
        ) : (
          <div className="grid gap-2">
            {combos.map(item => (
              <div key={item.id} className={`flex items-center justify-between py-2 px-3 rounded-lg border ${item.disponivel ? 'border-purple-100 bg-purple-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                <div>
                  <span className="text-sm font-medium text-gray-800">{item.nome}</span>
                  {item.descricao && <span className="text-xs text-gray-500 ml-2">{item.descricao}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-green-700">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</span>
                  <button onClick={() => toggleDisponibilidade(item.id)}
                    className={item.disponivel ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}>
                    {item.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => removerItemCardapio(item.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Componente de cada opção de almoço ──────────────────────
function OpcaoAlmoco({ opcao, onSalvar, onToggle }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nome: opcao.nome,
    proteinas: [...opcao.proteinas],
    precoP: opcao.precoP,
    precoG: opcao.precoG,
  })

  function salvar() {
    // Filtra proteínas vazias
    const proteinas = form.proteinas.map(p => p.trim())
    onSalvar({ ...form, proteinas })
    setEditando(false)
  }

  function setProteina(idx, val) {
    const nova = [...form.proteinas]
    nova[idx] = val
    setForm(prev => ({ ...prev, proteinas: nova }))
  }

  const proteinasAtivas = opcao.proteinas.filter(p => p.trim())
  const temPrecos = opcao.precoG

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!opcao.disponivel ? 'opacity-60' : opcao.id === 1 ? 'border-orange-200' : 'border-amber-200'}`}>
      {/* Cabeçalho */}
      <div className={`px-5 py-3 flex items-center justify-between ${opcao.id === 1 ? 'bg-orange-500' : 'bg-amber-600'} text-white`}>
        <div className="flex items-center gap-2">
          <Flame size={16} />
          {editando ? (
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              className="bg-white/20 border border-white/40 rounded px-2 py-0.5 text-sm font-bold text-white placeholder-white/70 w-32"
            />
          ) : (
            <span className="font-bold">{opcao.nome}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="opacity-80 hover:opacity-100">
            {opcao.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={() => setEditando(!editando)}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-medium transition-colors">
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {editando ? (
          // ── Modo edição ──
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Opções de Proteína</p>
              {[0, 1, 2].map(idx => (
                <div key={idx} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={form.proteinas[idx] || ''}
                    onChange={e => setProteina(idx, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder={`Proteína ${idx + 1} (Ex: Frango grelhado)`}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço P (R$)</label>
                <input type="number" min="0" step="0.01" value={form.precoP}
                  onChange={e => setForm(prev => ({ ...prev, precoP: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="0,00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço G (R$) *</label>
                <input type="number" min="0" step="0.01" value={form.precoG}
                  onChange={e => setForm(prev => ({ ...prev, precoG: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="0,00" />
              </div>
            </div>
            <button onClick={salvar}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
              <Check size={15} /> Salvar
            </button>
          </div>
        ) : (
          // ── Modo visualização ──
          <div>
            {/* Proteínas */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Proteínas</p>
            {proteinasAtivas.length === 0 ? (
              <p className="text-xs text-gray-400 italic mb-3">Nenhuma proteína cadastrada. Clique em Editar.</p>
            ) : (
              <div className="space-y-1 mb-3">
                {proteinasAtivas.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white ${opcao.id === 1 ? 'bg-orange-500' : 'bg-amber-600'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-700">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preços */}
            {temPrecos ? (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                {opcao.precoP && (
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Tamanho P</p>
                    <p className="text-base font-bold text-green-700">R$ {Number(opcao.precoP).toFixed(2).replace('.', ',')}</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-gray-400">Tamanho G</p>
                  <p className="text-base font-bold text-green-700">R$ {Number(opcao.precoG).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600 italic">Preços não definidos</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
