import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, ToggleLeft, ToggleRight, X, Check,
  UtensilsCrossed, GlassWater, Package, Flame, Beef
} from 'lucide-react'

const SUBTIPOS_REFRIGERANTE = ['Lata', 'Mini', '2 Litros']
const FORM_REFRIG_VAZIO = { nome: '', subtipo: 'Lata', preco: '' }
const FORM_COMBO_VAZIO = { nome: '', descricao: '', preco: '' }

export default function Cardapio() {
  const {
    cardapioHoje,
    salvarCarnes, salvarPrecos, salvarAcompanhamentos, salvarNomeOpcao, toggleOpcaoAlmoco,
    cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
  } = useApp()

  const refrigerantes = cardapio.filter(i => i.categoria === 'Refrigerante')
  const combos = cardapio.filter(i => i.categoria === 'Combo')

  // Formulários inline
  const [formRefrig, setFormRefrig] = useState(FORM_REFRIG_VAZIO)
  const [addRefrig, setAddRefrig] = useState(false)
  const [formCombo, setFormCombo] = useState(FORM_COMBO_VAZIO)
  const [addCombo, setAddCombo] = useState(false)

  function salvarRefrig() {
    if (!formRefrig.nome.trim() || !formRefrig.preco) return
    adicionarItemCardapio({ nome: formRefrig.nome, categoria: 'Refrigerante', subtipo: formRefrig.subtipo, preco: parseFloat(formRefrig.preco) })
    setFormRefrig(FORM_REFRIG_VAZIO); setAddRefrig(false)
  }

  function salvarCombo() {
    if (!formCombo.nome.trim() || !formCombo.preco) return
    adicionarItemCardapio({ nome: formCombo.nome, categoria: 'Combo', descricao: formCombo.descricao, preco: parseFloat(formCombo.preco) })
    setFormCombo(FORM_COMBO_VAZIO); setAddCombo(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-amber-900">Cardápio do Dia</h1>
        <p className="text-sm text-gray-500">Configure as opções, acompanhamentos, carnes e bebidas</p>
      </div>

      {/* ── PREÇOS e CARNES (globais) ────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="flex items-center gap-2 font-bold text-red-800 mb-4">
          <Beef size={18} /> Carnes e Tamanhos
          <span className="text-xs font-normal text-gray-400 ml-1">(valem para as duas opções)</span>
        </h2>

        {/* Preços */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Preço Pequena (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={cardapioHoje.precoP}
              onChange={e => salvarPrecos(e.target.value, cardapioHoje.precoG)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Ex: 17,00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Preço Grande (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={cardapioHoje.precoG}
              onChange={e => salvarPrecos(cardapioHoje.precoP, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="Ex: 20,00"
            />
          </div>
        </div>

        {/* 3 carnes */}
        <p className="text-xs font-medium text-gray-500 mb-2">Opções de carne (até 3)</p>
        <div className="space-y-2">
          {[0, 1, 2].map(idx => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 text-right">{idx + 1}.</span>
              <input
                type="text"
                value={cardapioHoje.carnes?.[idx] || ''}
                onChange={e => {
                  const novas = [...(cardapioHoje.carnes || ['', '', ''])]
                  novas[idx] = e.target.value
                  salvarCarnes(novas)
                }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder={`Carne ${idx + 1} — ex: Filé de Frango a Parmegiana`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── OPÇÕES DE ALMOÇO ────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {cardapioHoje.opcoes.map((opcao, idx) => (
          <OpcaoCard
            key={opcao.id}
            opcao={opcao}
            cor={idx === 0 ? 'orange' : 'amber'}
            onNome={nome => salvarNomeOpcao(opcao.id, nome)}
            onAcomp={lista => salvarAcompanhamentos(opcao.id, lista)}
            onToggle={() => toggleOpcaoAlmoco(opcao.id)}
          />
        ))}
      </div>

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
              placeholder="Nome (ex: Coca-Cola)" />
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

        {refrigerantes.length === 0
          ? <p className="text-xs text-gray-400 italic">Nenhum refrigerante cadastrado</p>
          : <div className="grid gap-2">
              {refrigerantes.map(item => (
                <ItemLine key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} cor="blue" />
              ))}
            </div>
        }
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

        {combos.length === 0
          ? <p className="text-xs text-gray-400 italic">Nenhum combo cadastrado</p>
          : <div className="grid gap-2">
              {combos.map(item => (
                <ItemLine key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} cor="purple" />
              ))}
            </div>
        }
      </section>
    </div>
  )
}

// ── Card de cada opção de almoço ─────────────────────────────
function OpcaoCard({ opcao, cor, onNome, onAcomp, onToggle }) {
  const [novoItem, setNovoItem] = useState('')
  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(opcao.nome)

  const BG_HEADER = cor === 'orange' ? 'bg-orange-500' : 'bg-amber-600'
  const RING = cor === 'orange' ? 'focus:ring-orange-300' : 'focus:ring-amber-400'

  function adicionarItem() {
    const val = novoItem.trim()
    if (!val) return
    onAcomp([...opcao.acompanhamentos, val])
    setNovoItem('')
  }

  function removerItem(item) {
    onAcomp(opcao.acompanhamentos.filter(a => a !== item))
  }

  function confirmarNome() {
    if (nomeTemp.trim()) onNome(nomeTemp.trim())
    setEditandoNome(false)
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!opcao.disponivel ? 'opacity-60' : 'border-gray-100'}`}>
      {/* Header */}
      <div className={`${BG_HEADER} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-white/80" />
          {editandoNome ? (
            <input
              autoFocus
              value={nomeTemp}
              onChange={e => setNomeTemp(e.target.value)}
              onBlur={confirmarNome}
              onKeyDown={e => e.key === 'Enter' && confirmarNome()}
              className="bg-white/20 border border-white/40 rounded px-2 py-0.5 text-sm font-bold text-white w-28"
            />
          ) : (
            <button onClick={() => { setNomeTemp(opcao.nome); setEditandoNome(true) }}
              className="font-bold text-white hover:underline text-sm">{opcao.nome}</button>
          )}
        </div>
        <button onClick={onToggle} className="text-white/80 hover:text-white">
          {opcao.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
      </div>

      {/* Acompanhamentos */}
      <div className="p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Acompanhamentos</p>

        {/* Chips existentes */}
        <div className="flex flex-wrap gap-1.5 mb-3 min-h-6">
          {opcao.acompanhamentos.length === 0 && (
            <p className="text-xs text-gray-300 italic">Nenhum item ainda</p>
          )}
          {opcao.acompanhamentos.map(a => (
            <span key={a} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
              {a}
              <button onClick={() => removerItem(a)} className="text-gray-400 hover:text-red-500 ml-0.5">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>

        {/* Input para adicionar */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={novoItem}
            onChange={e => setNovoItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarItem()}
            className={`flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 ${RING}`}
            placeholder="Ex: Arroz, Feijão, Farofa..."
          />
          <button onClick={adicionarItem}
            className={`${BG_HEADER} text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity`}>
            <Plus size={13} />
          </button>
        </div>

        {/* Tag: usa carnes globais? */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            🥩 Carnes: <span className="font-medium text-gray-600">globais (configuradas acima)</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Item de linha (refrigerante / combo) ─────────────────────
function ItemLine({ item, onToggle, onRemover, cor }) {
  const BADGE = cor === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg border ${item.disponivel ? `border-${cor}-100 bg-${cor}-50` : 'border-gray-100 bg-gray-50 opacity-50'}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800">{item.nome}</span>
        {item.subtipo && <span className={`text-xs px-1.5 py-0.5 rounded-full ${BADGE}`}>{item.subtipo}</span>}
        {item.descricao && <span className="text-xs text-gray-400">{item.descricao}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-green-700">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</span>
        <button onClick={() => onToggle(item.id)} className={item.disponivel ? 'text-green-600' : 'text-gray-400'}>
          {item.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
        <button onClick={() => onRemover(item.id)} className="text-gray-400 hover:text-red-600">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
