import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ClipboardList, Plus, X, Check, ChevronDown, User, MapPin, UtensilsCrossed, GlassWater, Package, Clock, Bike, Printer } from 'lucide-react'
import { formatarEndereco, ENDERECO_VAZIO } from '../utils/endereco'

function imprimirComanda(pedido, autoImprimir, onImpresso) {
  const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const data = new Date(pedido.criadoEm).toLocaleDateString('pt-BR')
  const num = String(pedido.id).slice(-4)
  const endereco = formatarEndereco(pedido)

  let itemIdx = 0
  const linhasItens = (pedido.itens || [])
    .filter(i => i.tipo !== 'refrigerante' && i.tipo !== 'embalagem')
    .map(item => {
      itemIdx++
      const todosAcomp = item.acompanhamentos || []
      const retirados = item.retirados || []

      let acompHtml = ''
      if (todosAcomp.length > 0) {
        acompHtml = todosAcomp.map(a => {
          const sem = retirados.includes(a)
          return sem
            ? `<div class="acomp sem">✗ SEM ${a.toUpperCase()}</div>`
            : `<div class="acomp ok">· ${a}</div>`
        }).join('')
      }

      let html = `<div class="item ${itemIdx > 1 ? 'item-sep' : ''}">
        <div class="item-titulo">${itemIdx}. ${item.nome} (${item.tamanho || 'Combo'})${item.proteina ? ` — ${item.proteina}` : ''}</div>
        ${acompHtml}`
      if (item.extras) html += `<div class="adicionar">+ ${item.extras}</div>`
      if (item.adicionais) html += `<div class="adicionar">+ ${item.adicionais}</div>`
      if (item.remover) html += `<div class="acomp sem">✗ SEM ${item.remover}</div>`
      html += `</div>`
      return html
    }).join('')

  const bebs = (pedido.itens || []).filter(i => i.tipo === 'refrigerante')
  const linhasBebidas = bebs.length > 0
    ? `<div class="secao">BEBIDAS</div>` + bebs.map(i => `<div class="item"><div class="item-titulo">${i.qtd}x ${i.nome} (${i.subtipo})</div></div>`).join('')
    : ''

  const emb = (pedido.itens || []).find(i => i.tipo === 'embalagem')
  const linhaEmbalagem = emb ? `<div class="item"><div class="acomp ok">· ${emb.qtd}x Embalagem adicional</div></div>` : ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Comanda #${num}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; width: 300px; padding: 10px; }
  .restaurante { text-align:center; font-size:16px; font-weight:bold; margin-bottom:2px; }
  .subtitulo { text-align:center; font-size:11px; margin-bottom:6px; letter-spacing:2px; }
  .linha { border-top:1px dashed #000; margin:6px 0; }
  .num { text-align:center; font-size:28px; font-weight:bold; margin:4px 0; letter-spacing:2px; }
  .info { display:flex; justify-content:space-between; font-size:11px; margin:2px 0; }
  .cliente { font-size:15px; font-weight:bold; margin:4px 0 2px; }
  .endereco { font-size:11px; color:#333; margin-bottom:3px; }
  .horario { font-size:13px; font-weight:bold; margin:2px 0; }
  .secao { font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-top:8px; margin-bottom:4px; border-bottom:1px solid #000; padding-bottom:2px; }
  .item { margin:4px 0 8px; }
  .item-sep { border-top:1px dotted #999; padding-top:6px; }
  .item-titulo { font-size:15px; font-weight:bold; margin-bottom:3px; }
  .acomp { font-size:12px; padding-left:8px; line-height:1.6; }
  .acomp.ok { color:#000; }
  .acomp.sem { font-weight:bold; color:#000; }
  .adicionar { font-size:12px; padding-left:8px; }
  .obs { font-size:12px; font-style:italic; margin-top:6px; border-left:3px solid #000; padding-left:6px; }
  .total { text-align:right; font-size:17px; font-weight:bold; margin-top:8px; }
  @media print { body { width:auto; } }
</style>
</head>
<body>
  <div class="restaurante">Fogão a Lenha da Leninha</div>
  <div class="subtitulo">— COZINHA —</div>
  <div class="linha"></div>
  <div class="num">#${num}</div>
  <div class="info"><span>${data}</span><span>${hora}</span></div>
  <div class="linha"></div>
  <div class="cliente">${pedido.clienteNome}</div>
  ${endereco ? `<div class="endereco">${endereco}</div>` : ''}
  ${pedido.horarioEntrega ? `<div class="horario">⏰ Entrega: ${pedido.horarioEntrega}</div>` : ''}
  <div class="linha"></div>
  ${linhasItens ? `<div class="secao">PEDIDO (${itemIdx} marmitex)</div>${linhasItens}` : ''}
  ${linhasBebidas}
  ${linhaEmbalagem}
  ${pedido.observacoes ? `<div class="obs">OBS: ${pedido.observacoes}</div>` : ''}
  <div class="linha"></div>
  <div class="total">TOTAL: R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}</div>
</body>
</html>`

  const w = window.open('', '_blank', 'width=360,height=700')
  w.document.write(html)
  w.document.close()
  w.focus()
  if (onImpresso) onImpresso()
  if (autoImprimir) {
    setTimeout(() => { w.print() }, 400)
  }
}

export const STATUS_LABELS = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  entregue: { label: 'Entregue', color: 'bg-gray-100 text-gray-600' },
}

const FORMAS_PAGAMENTO_OPCOES = [
  { value: 'Dinheiro',          label: 'Dinheiro',          cor: 'bg-green-100 text-green-800' },
  { value: 'PIX',               label: 'PIX',               cor: 'bg-blue-100 text-blue-800' },
  { value: 'Cartão de Débito',  label: 'Cartão Débito',     cor: 'bg-purple-100 text-purple-800' },
  { value: 'Cartão de Crédito', label: 'Cartão Crédito',    cor: 'bg-indigo-100 text-indigo-800' },
  { value: 'Mensalista',        label: 'Mensalista',        cor: 'bg-orange-100 text-orange-800' },
  { value: 'Pendente',          label: 'Pendente',          cor: 'bg-red-100 text-red-700' },
]

const PAGAMENTO_STATUS = {
  pago: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: '✓' },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  mensalista: { label: 'Mensalista', color: 'bg-orange-100 text-orange-700', icon: '📋' },
}

const FORM_VAZIO = {
  clienteNome: '',
  clienteTelefone: '',
  clienteRua: '',
  clienteBairro: '',
  clienteNumero: '',
  clienteReferencia: '',
  itensMarmitex: [],
  itensRefrigerante: [],
  itensCombo: [],
  pagamento: 'Dinheiro',
  observacoes: '',
  horarioEntrega: '',
  embalagensAdicionais: 0,
}

let _uid = 0
function uid() { return ++_uid }

export default function Pedidos() {
  const {
    clientes, pedidos, cardapio, cardapioHoje,
    adicionarPedido, atualizarStatusPedido, atualizarPagamentoPedido,
    atribuirMotoboy, quitarPedido, removerPedido, motoboys, marcarComandaImpressa,
  } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [form, setForm] = useState(FORM_VAZIO)
  const [sugestoes, setSugestoes] = useState([])
  const [autoImprimir, setAutoImprimir] = useState(true)

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
      clienteTelefone: c.telefone || prev.clienteTelefone,
      clienteRua: c.rua || prev.clienteRua,
      clienteBairro: c.bairro || prev.clienteBairro,
      clienteNumero: c.numero || prev.clienteNumero,
      clienteReferencia: c.referencia || prev.clienteReferencia,
      pagamento: c.tipo === 'mensalista' ? 'Mensalista' : prev.pagamento,
    }))
    setSugestoes([])
  }

  const opcoesAlmoco = (cardapioHoje?.opcoes || []).filter(o => o.disponivel)
  const carnesGlobais = (cardapioHoje?.carnes || []).filter(c => c.trim())
  const precoP = Number(cardapioHoje?.precoP || 0)
  const precoG = Number(cardapioHoje?.precoG || 0)
  const combos = cardapio.filter(i => i.disponivel && i.categoria === 'Combo')
  const refrigerantes = cardapio.filter(i => i.disponivel && i.categoria === 'Refrigerante')

  function adicionarMarmitex(opcao, proteina, tamanho, retirados, extras, qtd = 1) {
    const preco = tamanho === 'P' ? precoP : precoG
    const novas = Array.from({ length: qtd }, () => ({
      uid: uid(), opcaoId: opcao.id, nome: opcao.nome,
      proteina, tamanho, preco, adicionais: extras || '', remover: '', qtd: 1,
      retirados: retirados || [], extras: extras || '',
      acompanhamentos: opcao.acompanhamentos || [],
    }))
    setForm(prev => ({ ...prev, itensMarmitex: [...prev.itensMarmitex, ...novas] }))
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

  function atualizarItemMarmitex(itemUid, campo, valor) {
    setForm(prev => ({
      ...prev,
      itensMarmitex: prev.itensMarmitex.map(i => i.uid === itemUid ? { ...i, [campo]: valor } : i)
    }))
  }

  function atualizarItemCombo(itemUid, campo, valor) {
    setForm(prev => ({
      ...prev,
      itensCombo: prev.itensCombo.map(i => i.uid === itemUid ? { ...i, [campo]: valor } : i)
    }))
  }

  function alterarQtdRefrigerante(itemUid, delta) {
    setForm(prev => ({
      ...prev,
      itensRefrigerante: prev.itensRefrigerante
        .map(i => i.uid === itemUid ? { ...i, qtd: i.qtd + delta } : i)
        .filter(i => i.qtd > 0)
    }))
  }

  function removerMarmitex(itemUid) {
    setForm(prev => ({ ...prev, itensMarmitex: prev.itensMarmitex.filter(i => i.uid !== itemUid) }))
  }
  function removerRefrigerante(itemUid) {
    setForm(prev => ({ ...prev, itensRefrigerante: prev.itensRefrigerante.filter(i => i.uid !== itemUid) }))
  }
  function removerCombo(itemUid) {
    setForm(prev => ({ ...prev, itensCombo: prev.itensCombo.filter(i => i.uid !== itemUid) }))
  }

  const totalMarmitex = form.itensMarmitex.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalRefrigerante = form.itensRefrigerante.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalCombo = form.itensCombo.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalEmbalagens = (form.embalagensAdicionais || 0) * 1
  const total = totalMarmitex + totalRefrigerante + totalCombo + totalEmbalagens

  const temItens = form.itensMarmitex.length > 0 || form.itensRefrigerante.length > 0 || form.itensCombo.length > 0 || form.embalagensAdicionais > 0

  function salvar() {
    if (!temItens) return
    const todosItens = [
      ...form.itensMarmitex.map(i => ({ ...i, tipo: 'marmitex' })),
      ...form.itensCombo.map(i => ({ ...i, tipo: 'combo' })),
      ...form.itensRefrigerante.map(i => ({ ...i, tipo: 'refrigerante' })),
    ]
    if (form.embalagensAdicionais > 0) {
      todosItens.push({
        uid: uid(), tipo: 'embalagem', nome: 'Embalagem adicional',
        qtd: form.embalagensAdicionais, preco: 1,
      })
    }
    adicionarPedido({
      clienteNome: form.clienteNome || 'Cliente não identificado',
      clienteTelefone: form.clienteTelefone,
      rua: form.clienteRua,
      bairro: form.clienteBairro,
      numero: form.clienteNumero,
      referencia: form.clienteReferencia,
      itens: todosItens,
      pagamento: form.pagamento,
      observacoes: form.observacoes,
      horarioEntrega: form.horarioEntrega,
      embalagensAdicionais: form.embalagensAdicionais,
      total,
    })
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus)

  const emAberto = pedidos.filter(p => p.status === 'aberto').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Pedidos</h1>
          <p className="text-sm text-gray-500">{emAberto} em aberto</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoImprimir(v => !v)}
            title={autoImprimir ? 'Impressão automática ativada' : 'Impressão manual'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
              autoImprimir
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-gray-50 border-gray-300 text-gray-500'
            }`}
          >
            <Printer size={13} />
            {autoImprimir ? 'Impressão automática' : 'Impressão manual'}
          </button>
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.nome}</span>
                          {c.tipo === 'mensalista' && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Mensalista</span>}
                        </div>
                        {(c.rua || c.bairro) && (
                          <span className="text-gray-400 text-xs">{formatarEndereco(c)}</span>
                        )}
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
                <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin size={11} /> Endereço de Entrega
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Rua</label>
                    <input type="text" value={form.clienteRua}
                      onChange={e => setForm(prev => ({ ...prev, clienteRua: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      placeholder="Nome da rua" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Bairro</label>
                    <input type="text" value={form.clienteBairro}
                      onChange={e => setForm(prev => ({ ...prev, clienteBairro: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      placeholder="Bairro" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Número</label>
                    <input type="text" value={form.clienteNumero}
                      onChange={e => setForm(prev => ({ ...prev, clienteNumero: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      placeholder="Ex: 123" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Referência</label>
                    <input type="text" value={form.clienteReferencia}
                      onChange={e => setForm(prev => ({ ...prev, clienteReferencia: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      placeholder="Próximo ao..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marmitex */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-1">
              <UtensilsCrossed size={13} /> Marmitex
            </p>

            {opcoesAlmoco.length === 0 || !precoG ? (
              <p className="text-xs text-gray-400">Configure as opções e preços em Cardápio.</p>
            ) : (
              <SeletorMarmitex
                opcoesAlmoco={opcoesAlmoco}
                carnesGlobais={carnesGlobais}
                precoP={precoP}
                precoG={precoG}
                onAdicionar={adicionarMarmitex}
              />
            )}

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
                {item.retirados && item.retirados.length > 0 && (
                  <p className="text-xs text-red-500 mb-1">Sem: {item.retirados.join(', ')}</p>
                )}
                {item.extras && (
                  <p className="text-xs text-green-600 mb-1">+ {item.extras}</p>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Observação</label>
                  <input type="text" value={item.adicionais}
                    onChange={e => atualizarItemMarmitex(item.uid, 'adicionais', e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="Observação adicional..." />
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
              <p className="text-xs text-gray-400">Nenhum refrigerante cadastrado.</p>
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

          {/* Embalagens Adicionais */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Package size={13} /> Embalagens Adicionais (R$ 1,00 cada)
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(prev => ({ ...prev, embalagensAdicionais: Math.max(0, (prev.embalagensAdicionais || 0) - 1) }))}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >-</button>
              <span className="text-lg font-bold text-gray-800 w-8 text-center">{form.embalagensAdicionais}</span>
              <button
                onClick={() => setForm(prev => ({ ...prev, embalagensAdicionais: (prev.embalagensAdicionais || 0) + 1 }))}
                className="w-8 h-8 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >+</button>
              {form.embalagensAdicionais > 0 && (
                <span className="text-sm font-bold text-green-700">R$ {(form.embalagensAdicionais * 1).toFixed(2).replace('.', ',')}</span>
              )}
            </div>
          </div>

          {/* Pagamento */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Forma de Pagamento</label>
            <div className="flex flex-wrap gap-2">
              {FORMAS_PAGAMENTO_OPCOES.map(f => (
                <button key={f.value} onClick={() => setForm(prev => ({ ...prev, pagamento: f.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                    form.pagamento === f.value
                      ? `${f.cor} border-current shadow-sm scale-105`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            {(form.pagamento === 'Pendente' || form.pagamento === 'Mensalista') && (
              <p className="text-xs text-orange-600 mt-2">Pagamento registrado como pendente</p>
            )}
          </div>

          {/* Horário de Entrega */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Clock size={12} /> Horário de Entrega (opcional)
            </label>
            <input type="time" value={form.horarioEntrega}
              onChange={e => setForm(prev => ({ ...prev, horarioEntrega: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações gerais</label>
            <input type="text" value={form.observacoes}
              onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Observações adicionais..." />
          </div>

          {/* Resumo total */}
          {temItens && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              {totalMarmitex > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Marmitex</span><span>R$ {totalMarmitex.toFixed(2).replace('.', ',')}</span></div>}
              {totalCombo > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Combos</span><span>R$ {totalCombo.toFixed(2).replace('.', ',')}</span></div>}
              {totalRefrigerante > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Refrigerantes</span><span>R$ {totalRefrigerante.toFixed(2).replace('.', ',')}</span></div>}
              {totalEmbalagens > 0 && <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Embalagens</span><span>R$ {totalEmbalagens.toFixed(2).replace('.', ',')}</span></div>}
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
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onStatus={atualizarStatusPedido}
              onPagamentoStatus={atualizarPagamentoPedido}
              onAtribuirMotoboy={atribuirMotoboy}
              onQuitar={quitarPedido}
              onRemover={removerPedido}
              motoboys={motoboys}
              autoImprimir={autoImprimir}
              onImpresso={() => marcarComandaImpressa(pedido.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Seletor de Marmitex ──────────────────────────────────────────────────────
function SeletorMarmitex({ opcoesAlmoco, carnesGlobais, precoP, precoG, onAdicionar }) {
  const [opcaoSel, setOpcaoSel] = useState(null)
  const [carneSel, setCarneSel] = useState('')
  const [acompSel, setAcompSel] = useState([])
  const [extras, setExtras] = useState('')
  const [qtd, setQtd] = useState(1)
  const [feedback, setFeedback] = useState('')

  const COR_BADGE = ['bg-orange-500', 'bg-amber-600']

  function selecionarOpcao(opcao) {
    setOpcaoSel(opcao)
    setCarneSel('')
    setAcompSel(opcao.acompanhamentos || [])
    setExtras('')
    setQtd(1)
  }

  function toggleAcomp(item) {
    setAcompSel(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    )
  }

  function confirmar(tamanho) {
    if (!opcaoSel) return
    const todosAcomp = opcaoSel.acompanhamentos || []
    const retirados = todosAcomp.filter(a => !acompSel.includes(a))
    onAdicionar(opcaoSel, carneSel, tamanho, retirados, extras, qtd)
    const msg = `✓ ${qtd}x ${opcaoSel.nome} (${tamanho}) adicionada${qtd > 1 ? 's' : ''}!`
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 2000)
    setOpcaoSel(null)
    setCarneSel('')
    setAcompSel([])
    setExtras('')
    setQtd(1)
  }

  const temCarnes = carnesGlobais.length > 0
  const prontoParaTamanho = opcaoSel && (!temCarnes || carneSel !== '')

  return (
    <div>
      {feedback && (
        <div className="mb-2 px-3 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-lg">
          {feedback}
        </div>
      )}
      {/* Passo 1 – escolher opção */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {opcoesAlmoco.map((opcao, idx) => (
          <button key={opcao.id}
            onClick={() => selecionarOpcao(opcao)}
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

      {/* Passo 2 – acompanhamentos toggleáveis */}
      {opcaoSel && (opcaoSel.acompanhamentos || []).length > 0 && (
        <div className="bg-white border border-orange-100 rounded-xl p-3 mb-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">Acompanhamentos (clique para retirar)</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(opcaoSel.acompanhamentos || []).map((a, i) => {
              const selecionado = acompSel.includes(a)
              return (
                <button key={i} onClick={() => toggleAcomp(a)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    selecionado
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                  }`}>
                  {a}
                </button>
              )
            })}
          </div>
          <div>
            <input type="text" value={extras} onChange={e => setExtras(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              placeholder="Adicionar extra (ex: batata frita extra)" />
          </div>
        </div>
      )}

      {/* Passo 3 – escolher carne */}
      {opcaoSel && temCarnes && (
        <div className="bg-white border border-red-100 rounded-xl p-3 mb-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Escolha a carne <span className="text-red-400">*</span>
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

      {/* Passo 4 – quantidade + tamanho */}
      {opcaoSel && (
        <div className="space-y-2">
          {/* Contador de quantidade */}
          <div className="flex items-center gap-2 bg-white border border-amber-100 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-gray-600 mr-auto">Quantidade:</span>
            <button onClick={() => setQtd(q => Math.max(1, q - 1))}
              className="w-7 h-7 bg-gray-100 border rounded font-bold text-gray-600 hover:bg-gray-200">-</button>
            <span className="text-base font-bold text-gray-800 w-6 text-center">{qtd}</span>
            <button onClick={() => setQtd(q => q + 1)}
              className="w-7 h-7 bg-gray-100 border rounded font-bold text-gray-600 hover:bg-gray-200">+</button>
            <span className="text-xs text-gray-400 ml-1">{qtd > 1 ? `(${qtd} itens iguais)` : ''}</span>
          </div>
          <div className="flex gap-2">
            {precoP > 0 && (
              <button onClick={() => prontoParaTamanho && confirmar('P')} disabled={!prontoParaTamanho}
                className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors ${prontoParaTamanho ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                + {qtd > 1 ? `${qtd}x ` : ''}Marmitex P — R$ {(precoP * qtd).toFixed(2).replace('.', ',')}
              </button>
            )}
            <button onClick={() => prontoParaTamanho && confirmar('G')} disabled={!prontoParaTamanho}
              className={`flex-1 font-bold py-2.5 rounded-lg text-sm transition-colors ${prontoParaTamanho ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              + {qtd > 1 ? `${qtd}x ` : ''}Marmitex G — R$ {(precoG * qtd).toFixed(2).replace('.', ',')}
            </button>
            <button onClick={() => { setOpcaoSel(null); setCarneSel(''); setQtd(1) }} className="p-2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PedidoCard({ pedido, onStatus, onPagamentoStatus, onAtribuirMotoboy, onQuitar, onRemover, motoboys, autoImprimir, onImpresso }) {
  const [aberto, setAberto] = useState(false)
  const [mostrarEntrega, setMostrarEntrega] = useState(false)
  const [motoboyInput, setMotoboyInput] = useState('')

  const statusInfo = STATUS_LABELS[pedido.status] || STATUS_LABELS.aberto
  const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endFormatado = formatarEndereco(pedido)
  const pagStatus = PAGAMENTO_STATUS[pedido.statusPagamento] || PAGAMENTO_STATUS.pago
  const BADGE_PAGTO = FORMAS_PAGAMENTO_OPCOES.find(f => f.value === pedido.pagamento)

  function confirmarEntrega() {
    if (motoboyInput.trim()) {
      onAtribuirMotoboy(pedido.id, motoboyInput.trim())
    }
    onStatus(pedido.id, 'entregue')
    setMostrarEntrega(false)
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${pedido.statusPagamento === 'pendente' || pedido.statusPagamento === 'mensalista' ? 'border-orange-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between p-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{pedido.clienteNome}</p>
            {BADGE_PAGTO && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${BADGE_PAGTO.cor}`}>
                {BADGE_PAGTO.label}
              </span>
            )}
            {pedido.horarioEntrega && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <Clock size={10} /> {pedido.horarioEntrega}
              </span>
            )}
            {pedido.comandaImpressaEm
              ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Printer size={9} /> Impressa</span>
              : <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Printer size={9} /> Não impressa</span>
            }
          </div>
          {endFormatado && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={10} />{endFormatado}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">{hora}</p>
            {pedido.motoboy && (
              <span className="text-xs text-indigo-600 flex items-center gap-0.5">
                <Bike size={10} /> {pedido.motoboy}
              </span>
            )}
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
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {/* Status de pagamento */}
          <div className="flex gap-1.5 mb-3">
            {Object.entries(PAGAMENTO_STATUS).map(([key, info]) => (
              <button key={key}
                onClick={() => onPagamentoStatus(pedido.id, key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                  pedido.statusPagamento === key
                    ? `${info.color} border-current`
                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
                }`}>
                {info.icon} {info.label}
              </button>
            ))}
          </div>

          {/* Itens */}
          {pedido.itens?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-0.5">
              <div>
                <span className="text-gray-600">
                  {item.qtd}x {item.nome}
                  {item.tamanho && <span className="font-bold text-amber-700"> ({item.tamanho})</span>}
                  {item.subtipo && <span className="text-blue-600"> [{item.subtipo}]</span>}
                </span>
                {item.retirados && item.retirados.length > 0 && (
                  <p className="text-xs text-red-500 ml-3">Sem: {item.retirados.join(', ')}</p>
                )}
                {item.extras && <p className="text-xs text-green-600 ml-3">+ {item.extras}</p>}
                {item.adicionais && <p className="text-xs text-green-600 ml-3">+ {item.adicionais}</p>}
                {item.remover && <p className="text-xs text-red-500 ml-3">- {item.remover}</p>}
              </div>
              <span className="text-gray-500 shrink-0">R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          {pedido.observacoes && <p className="text-xs text-amber-600 mt-2">Obs: {pedido.observacoes}</p>}

          {/* Ações */}
          <div className="flex gap-2 flex-wrap mt-3">
            <button onClick={() => imprimirComanda(pedido, autoImprimir, onImpresso)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1">
              <Printer size={12} /> {pedido.comandaImpressaEm ? 'Reimprimir' : 'Imprimir Comanda'}
            </button>
            {pedido.status !== 'entregue' && (
              <>
                {!mostrarEntrega ? (
                  <button onClick={() => setMostrarEntrega(true)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    Marcar como Entregue
                  </button>
                ) : (
                  <div className="w-full mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <Bike size={12} /> Atribuir Motoboy
                    </p>
                    <div className="flex gap-2">
                      {motoboys && motoboys.length > 0 ? (
                        <select value={motoboyInput} onChange={e => setMotoboyInput(e.target.value)}
                          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none">
                          <option value="">Selecionar motoboy...</option>
                          {motoboys.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={motoboyInput} onChange={e => setMotoboyInput(e.target.value)}
                          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none"
                          placeholder="Nome do motoboy (opcional)" />
                      )}
                      <button onClick={confirmarEntrega}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1">
                        <Check size={12} /> Confirmar Entrega
                      </button>
                      <button onClick={() => setMostrarEntrega(false)}
                        className="text-gray-400 hover:text-gray-600 px-2">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
