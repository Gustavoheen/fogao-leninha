import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ClipboardList, Plus, X, Check, ChevronDown, User, MapPin, UtensilsCrossed, GlassWater, Package } from 'lucide-react'

export const STATUS_LABELS = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  preparando: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700' },
  pronto: { label: 'Pronto', color: 'bg-green-100 text-green-700' },
  entregue: { label: 'Entregue', color: 'bg-gray-100 text-gray-600' },
  pendente: { label: 'Pend. Pagto', color: 'bg-orange-100 text-orange-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
}

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Pendente']

const FORM_VAZIO = {
  clienteNome: '',
  clienteEndereco: '',
  clienteTelefone: '',
  itensMarmitex: [],
  itensRefrigerante: [],
  itensCombo: [],
  pagamento: 'Dinheiro',
  observacoes: '',
}

// Gera UID único por item no pedido (mesmo prato pode entrar 2x com tamanhos diferentes)
let _uid = 0
function uid() { return ++_uid }

export default function Pedidos() {
  const { clientes, pedidos, cardapio, cardapioHoje, adicionarPedido, atualizarStatusPedido, quitarPedido, removerPedido } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [form, setForm] = useState(FORM_VAZIO)
  const [sugestoes, setSugestoes] = useState([])

  // Autocomplete de clientes
  function onNomeChange(valor) {
    setForm(prev => ({ ...prev, clienteNome: valor }))
    if (valor.length < 2) { setSugestoes([]); return }
    const found = clientes.filter(c => c.nome.toLowerCase().includes(valor.toLowerCase()))
    setSugestoes(found.slice(0, 5))
  }

  function selecionarCliente(c) {
    setForm(prev => ({
      ...prev,
      clienteNome: c.nome,
      clienteEndereco: c.endereco || prev.clienteEndereco,
      clienteTelefone: c.telefone || prev.clienteTelefone,
    }))
    setSugestoes([])
  }

  // Cardápio do dia
  const opcoesAlmoco = (cardapioHoje?.opcoes || []).filter(o => o.disponivel)
  const carnesGlobais = (cardapioHoje?.carnes || []).filter(c => c.trim())
  const precoP = Number(cardapioHoje?.precoP || 0)
  const precoG = Number(cardapioHoje?.precoG || 0)
  const combos = cardapio.filter(i => i.disponivel && i.categoria === 'Combo')
  const refrigerantes = cardapio.filter(i => i.disponivel && i.categoria === 'Refrigerante')

  // Adicionar marmitex ao pedido (via cardapioHoje)
  function adicionarMarmitex(opcao, proteina, tamanho) {
    const preco = tamanho === 'P' ? precoP : precoG
    setForm(prev => ({
      ...prev,
      itensMarmitex: [...prev.itensMarmitex, {
        uid: uid(), opcaoId: opcao.id, nome: opcao.nome,
        proteina, tamanho, preco, adicionais: '', remover: '', qtd: 1,
      }]
    }))
  }

  function adicionarRefrigerante(item) {
    setForm(prev => ({
      ...prev,
      itensRefrigerante: [...prev.itensRefrigerante, {
        uid: uid(), cardapioId: item.id, nome: item.nome,
        subtipo: item.subtipo, preco: Number(item.preco), qtd: 1,
      }]
    }))
  }

  function adicionarCombo(item) {
    setForm(prev => ({
      ...prev,
      itensCombo: [...prev.itensCombo, {
        uid: uid(), cardapioId: item.id, nome: item.nome,
        preco: Number(item.preco), adicionais: '', remover: '', qtd: 1,
      }]
    }))
  }

  function atualizarItemMarmitex(uid, campo, valor) {
    setForm(prev => ({
      ...prev,
      itensMarmitex: prev.itensMarmitex.map(i => i.uid === uid ? { ...i, [campo]: valor } : i)
    }))
  }

  function atualizarItemCombo(uid, campo, valor) {
    setForm(prev => ({
      ...prev,
      itensCombo: prev.itensCombo.map(i => i.uid === uid ? { ...i, [campo]: valor } : i)
    }))
  }

  function alterarQtdRefrigerante(uid, delta) {
    setForm(prev => ({
      ...prev,
      itensRefrigerante: prev.itensRefrigerante
        .map(i => i.uid === uid ? { ...i, qtd: i.qtd + delta } : i)
        .filter(i => i.qtd > 0)
    }))
  }

  function removerMarmitex(uid) {
    setForm(prev => ({ ...prev, itensMarmitex: prev.itensMarmitex.filter(i => i.uid !== uid) }))
  }
  function removerRefrigerante(uid) {
    setForm(prev => ({ ...prev, itensRefrigerante: prev.itensRefrigerante.filter(i => i.uid !== uid) }))
  }
  function removerCombo(uid) {
    setForm(prev => ({ ...prev, itensCombo: prev.itensCombo.filter(i => i.uid !== uid) }))
  }

  const totalMarmitex = form.itensMarmitex.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalRefrigerante = form.itensRefrigerante.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalCombo = form.itensCombo.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const total = totalMarmitex + totalRefrigerante + totalCombo

  const temItens = form.itensMarmitex.length > 0 || form.itensRefrigerante.length > 0 || form.itensCombo.length > 0

  function salvar() {
    if (!temItens) return
    const todosItens = [
      ...form.itensMarmitex.map(i => ({ ...i, tipo: 'marmitex' })),
      ...form.itensCombo.map(i => ({ ...i, tipo: 'combo' })),
      ...form.itensRefrigerante.map(i => ({ ...i, tipo: 'refrigerante' })),
    ]
    adicionarPedido({
      clienteNome: form.clienteNome || 'Cliente não identificado',
      clienteEndereco: form.clienteEndereco,
      clienteTelefone: form.clienteTelefone,
      itens: todosItens,
      pagamento: form.pagamento,
      observacoes: form.observacoes,
      total,
    })
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus)

  const emAberto = pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{emAberto} em aberto hoje</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['todos', 'Todos'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFiltroStatus(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroStatus === key ? 'bg-amber-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4 text-lg">Novo Pedido</h2>

          {/* Dados do cliente */}
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1">
              <User size={13} /> Dados do Cliente
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.clienteNome}
                  onChange={e => onNomeChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  placeholder="Nome do cliente..."
                  autoComplete="off"
                />
                {sugestoes.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                    {sugestoes.map(c => (
                      <button key={c.id} onClick={() => selecionarCliente(c)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b border-gray-50 last:border-0">
                        <span className="font-medium">{c.nome}</span>
                        {c.endereco && <span className="text-gray-400 text-xs ml-2">{c.endereco}</span>}
                        {c.tipo === 'mensalista' && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Mensalista</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.clienteTelefone}
                  onChange={e => setForm(prev => ({ ...prev, clienteTelefone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  placeholder="(32) 99999-9999"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin size={11} /> Endereço
                </label>
                <input
                  type="text"
                  value={form.clienteEndereco}
                  onChange={e => setForm(prev => ({ ...prev, clienteEndereco: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  placeholder="Rua, número, bairro..."
                />
              </div>
            </div>
          </div>

          {/* Marmitex — opções do cardápio do dia */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-1">
              <UtensilsCrossed size={13} /> Marmitex
            </p>

            {/* Acompanhamentos do dia */}
            {cardapioHoje?.acompanhamentos?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs text-gray-500 mr-1">Acomp.:</span>
                {cardapioHoje.acompanhamentos.map(a => (
                  <span key={a} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            )}

            {opcoesAlmoco.length === 0 || !precoG ? (
              <p className="text-xs text-gray-400">Configure as opções e preços em Cardápio do Dia.</p>
            ) : (
              <SeletorMarmitex
                opcoesAlmoco={opcoesAlmoco}
                carnesGlobais={carnesGlobais}
                precoP={precoP}
                precoG={precoG}
                onAdicionar={adicionarMarmitex}
              />
            )}

            {/* Itens de marmitex adicionados */}
            {form.itensMarmitex.map(item => (
              <div key={item.uid} className="bg-white border border-amber-200 rounded-lg p-3 mb-2 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {item.nome} <span className="text-amber-700 font-bold">({item.tamanho})</span>
                    {item.proteina && <span className="text-gray-500 font-normal"> · {item.proteina}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-700">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
                    <button onClick={() => removerMarmitex(item.uid)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Adicionar</label>
                    <input type="text" value={item.adicionais}
                      onChange={e => atualizarItemMarmitex(item.uid, 'adicionais', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      placeholder="Ex: bacon, queijo..." />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Retirar</label>
                    <input type="text" value={item.remover}
                      onChange={e => atualizarItemMarmitex(item.uid, 'remover', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      placeholder="Ex: cebola, pimenta..." />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Combos */}
          {combos.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Package size={13} /> Combos
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {combos.map(item => (
                  <button key={item.id} onClick={() => adicionarCombo(item)}
                    className="bg-white border border-purple-100 hover:border-purple-400 rounded-lg p-3 text-left transition-colors">
                    <p className="text-xs font-semibold text-gray-800">{item.nome}</p>
                    {item.descricao && <p className="text-xs text-gray-400 mt-0.5">{item.descricao}</p>}
                    <p className="text-xs font-bold text-green-700 mt-1">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
              {form.itensCombo.map(item => (
                <div key={item.uid} className="bg-white border border-purple-200 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{item.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-700">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
                      <button onClick={() => removerCombo(item.uid)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Adicionar</label>
                      <input type="text" value={item.adicionais}
                        onChange={e => atualizarItemCombo(item.uid, 'adicionais', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="Ex: bacon..." />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Retirar</label>
                      <input type="text" value={item.remover}
                        onChange={e => atualizarItemCombo(item.uid, 'remover', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                        placeholder="Ex: cebola..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refrigerantes */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1">
              <GlassWater size={13} /> Refrigerantes
            </p>
            {refrigerantes.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum refrigerante cadastrado. Adicione em Cardápio do Dia.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {refrigerantes.map(item => (
                  <button key={item.id} onClick={() => adicionarRefrigerante(item)}
                    className="bg-white border border-blue-100 hover:border-blue-400 rounded-lg p-2.5 text-left transition-colors">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.nome}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{item.subtipo}</span>
                    <p className="text-xs font-bold text-green-700 mt-1">R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
            )}
            {form.itensRefrigerante.length > 0 && (
              <div className="space-y-1">
                {form.itensRefrigerante.map(item => (
                  <div key={item.uid} className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{item.nome} <span className="text-xs text-blue-600">({item.subtipo})</span></span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => alterarQtdRefrigerante(item.uid, -1)} className="w-6 h-6 bg-gray-100 border rounded text-sm font-bold hover:bg-gray-200">-</button>
                      <span className="text-sm font-semibold w-4 text-center">{item.qtd}</span>
                      <button onClick={() => alterarQtdRefrigerante(item.uid, 1)} className="w-6 h-6 bg-gray-100 border rounded text-sm font-bold hover:bg-gray-200">+</button>
                      <span className="text-xs font-bold text-green-700 w-14 text-right">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
                      <button onClick={() => removerRefrigerante(item.uid)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagamento e total */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
              <select value={form.pagamento} onChange={e => setForm(prev => ({ ...prev, pagamento: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações gerais</label>
              <input type="text" value={form.observacoes}
                onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Observações adicionais..." />
            </div>
          </div>

          {/* Resumo total */}
          {temItens && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              {totalMarmitex > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Marmitex</span><span>R$ {totalMarmitex.toFixed(2).replace('.', ',')}</span></div>}
              {totalCombo > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Combos</span><span>R$ {totalCombo.toFixed(2).replace('.', ',')}</span></div>}
              {totalRefrigerante > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Refrigerantes</span><span>R$ {totalRefrigerante.toFixed(2).replace('.', ',')}</span></div>}
              <div className="flex justify-between font-bold text-green-800 text-base border-t border-green-200 mt-2 pt-2">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={salvar} disabled={!temItens}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={15} /> Confirmar Pedido
            </button>
            <button onClick={() => { setForm(FORM_VAZIO); setMostrarForm(false); setSugestoes([]) }}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pedidosFiltrados.map(pedido => (
            <PedidoCard key={pedido.id} pedido={pedido} onStatus={atualizarStatusPedido} onQuitar={quitarPedido} onRemover={removerPedido} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Seletor de Marmitex ──────────────────────────────────────────────────────
// Fluxo A (tem carnes globais): Opção → Carne → Tamanho
// Fluxo B (sem carnes / prato completo): Opção → Tamanho direto
function SeletorMarmitex({ opcoesAlmoco, carnesGlobais, precoP, precoG, onAdicionar }) {
  const [opcaoSel, setOpcaoSel] = useState(null)
  const [carneSel, setCarneSel] = useState('')

  const COR_BADGE = ['bg-orange-500', 'bg-amber-600']

  function confirmar(tamanho) {
    if (!opcaoSel) return
    onAdicionar(opcaoSel, carneSel, tamanho)
    setOpcaoSel(null)
    setCarneSel('')
  }

  const temCarnes = carnesGlobais.length > 0
  const prontoParaTamanho = opcaoSel && (!temCarnes || carneSel !== '')

  return (
    <div>
      {/* Passo 1 – escolher opção */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {opcoesAlmoco.map((opcao, idx) => (
          <button key={opcao.id}
            onClick={() => { setOpcaoSel(opcao); setCarneSel('') }}
            className={`rounded-xl p-3 text-left border-2 transition-all ${opcaoSel?.id === opcao.id ? 'border-amber-600 bg-white shadow-md' : 'border-transparent bg-white hover:border-amber-300'}`}
          >
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white inline-block mb-1.5 ${COR_BADGE[idx] || 'bg-gray-500'}`}>
              {opcao.nome}
            </span>
            <div className="space-y-0.5">
              {(opcao.acompanhamentos || []).length > 0
                ? opcao.acompanhamentos.map((a, i) => (
                    <p key={i} className="text-xs text-gray-600 leading-tight">· {a}</p>
                  ))
                : <p className="text-xs text-gray-300 italic">Sem acompanhamentos</p>
              }
            </div>
            <div className="flex gap-2 mt-2">
              {precoP > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">P R$ {precoP.toFixed(2).replace('.', ',')}</span>}
              {precoG > 0 && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold">G R$ {precoG.toFixed(2).replace('.', ',')}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Passo 2 – escolher carne (só se houver carnes globais) */}
      {opcaoSel && temCarnes && (
        <div className="bg-white border border-red-100 rounded-xl p-3 mb-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            🥩 Escolha a carne <span className="text-red-400">*</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {carnesGlobais.map((c, i) => (
              <button key={i} onClick={() => setCarneSel(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  carneSel === c ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                }`}>
                {c}
              </button>
            ))}
          </div>
          {!carneSel && <p className="text-xs text-red-400 mt-2">Selecione a carne para continuar</p>}
        </div>
      )}

      {/* Passo 3 – tamanho */}
      {opcaoSel && (
        <div className="flex gap-2">
          {precoP > 0 && (
            <button onClick={() => prontoParaTamanho && confirmar('P')} disabled={!prontoParaTamanho}
              className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors ${prontoParaTamanho ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              + Marmitex P — R$ {precoP.toFixed(2).replace('.', ',')}
            </button>
          )}
          <button onClick={() => prontoParaTamanho && confirmar('G')} disabled={!prontoParaTamanho}
            className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors ${prontoParaTamanho ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            + Marmitex G — R$ {precoG.toFixed(2).replace('.', ',')}
          </button>
          <button onClick={() => { setOpcaoSel(null); setCarneSel('') }} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function PedidoCard({ pedido, onStatus, onQuitar, onRemover }) {
  const [aberto, setAberto] = useState(false)
  const [formaPagtoQuitar, setFormaPagtoQuitar] = useState('Dinheiro')
  const statusInfo = STATUS_LABELS[pedido.status] || STATUS_LABELS.aberto
  const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isPendente = pedido.pagamento === 'Pendente' || pedido.status === 'pendente'

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isPendente ? 'border-orange-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-800">{pedido.clienteNome}</p>
            {isPendente && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Pendente</span>}
          </div>
          {pedido.clienteEndereco && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{pedido.clienteEndereco}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{hora} · {pedido.pagamento}</p>
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
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {pedido.itens?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-0.5">
              <div>
                <span className="text-gray-600">
                  {item.qtd}x {item.nome}
                  {item.tamanho && <span className="font-bold text-amber-700"> ({item.tamanho})</span>}
                  {item.subtipo && <span className="text-blue-600"> [{item.subtipo}]</span>}
                </span>
                {item.adicionais && <p className="text-xs text-green-600 ml-3">+ {item.adicionais}</p>}
                {item.remover && <p className="text-xs text-red-500 ml-3">- {item.remover}</p>}
              </div>
              <span className="text-gray-500 shrink-0">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          {pedido.observacoes && <p className="text-xs text-amber-600 mt-2">Obs: {pedido.observacoes}</p>}

          {/* Quitar pagamento pendente */}
          {isPendente && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg">
              <p className="text-xs font-semibold text-orange-700 mb-2">Quitar pagamento</p>
              <div className="flex gap-2">
                <select value={formaPagtoQuitar} onChange={e => setFormaPagtoQuitar(e.target.value)}
                  className="flex-1 border border-orange-200 rounded px-2 py-1.5 text-xs focus:outline-none">
                  {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(f => <option key={f}>{f}</option>)}
                </select>
                <button onClick={() => onQuitar(pedido.id, formaPagtoQuitar)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                  Quitar R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap mt-3">
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
              pedido.status !== key && key !== 'pendente' && (
                <button key={key} onClick={() => onStatus(pedido.id, key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${color} opacity-80 hover:opacity-100 transition-opacity`}>
                  → {label}
                </button>
              )
            ))}
            <button onClick={() => onRemover(pedido.id)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-auto">
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
