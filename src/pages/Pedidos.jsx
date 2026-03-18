import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ClipboardList, Plus, X, Check, ChevronDown, User, MapPin, UtensilsCrossed, GlassWater, Package, Clock, Bike, Printer, CreditCard } from 'lucide-react'
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
  { value: 'Quinzenal',         label: 'Quinzenal',         cor: 'bg-violet-100 text-violet-800' },
  { value: 'Semanal',           label: 'Semanal',           cor: 'bg-sky-100 text-sky-800' },
  { value: 'Pendente',          label: 'Pendente',          cor: 'bg-red-100 text-red-700' },
]

const PAGAMENTO_STATUS = {
  pago:        { label: 'Pago',        color: 'bg-green-100 text-green-700',  icon: '✓' },
  pendente:    { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  mensalista:  { label: 'Mensalista',  color: 'bg-orange-100 text-orange-700', icon: '📋' },
}

const FORM_VAZIO = {
  clienteNome: '',
  clienteTelefone: '',
  clienteRua: '',
  clienteBairro: '',
  clienteNumero: '',
  clienteReferencia: '',
  tipoEntrega: 'entrega', // 'entrega' | 'retirada'
  itensMarmitex: [],
  itensRefrigerante: [],
  itensCombo: [],
  saladaIngredientes: null, // null = sem salada, [] = salada sem ingredientes, [...] = com ingredientes selecionados
  pagamento: 'Dinheiro',
  trocoPara: '',
  observacoes: '',
  horarioEntrega: '',
  embalagensAdicionais: 0,
}

let _uid = 0
function uid() { return ++_uid }

// Normaliza acompanhamentos: aceita string[] ou {nome,grupo}[] → string[]
function toNomes(arr) { return (arr || []).map(a => typeof a === 'string' ? a : a.nome) }

// ── Estilos compartilhados ────────────────────────────────────────────────────
const INPUT_BASE = {
  background: '#fff',
  border: '1.5px solid #CFC4BB',
  borderRadius: 10,
  padding: '14px 16px',
  fontSize: 16,
  width: '100%',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  color: '#1A0E08',
  boxSizing: 'border-box',
}

const SECTION_LABEL = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 12,
}

export default function Pedidos() {
  const {
    clientes, pedidos, cardapio, cardapioHoje,
    adicionarPedido, atualizarStatusPedido, atualizarPagamentoPedido, atualizarFormaPagamento,
    atribuirMotoboy, quitarPedido, removerPedido, motoboys, marcarComandaImpressa, editarCliente,
  } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroData, setFiltroData] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [form, setForm] = useState(FORM_VAZIO)
  const [sugestoes, setSugestoes] = useState([])
  const [autoImprimir, setAutoImprimir] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fogao_autoImprimir') ?? 'true') }
    catch { return true }
  })
  const [precoP, setPrecoP] = useState(0)
  const [precoG, setPrecoG] = useState(0)

  // Sincroniza preços com cardapioHoje quando não há cliente fiado selecionado
  useEffect(() => {
    if (!form.clienteNome) {
      setPrecoP(Number(cardapioHoje?.precoP || 0))
      setPrecoG(Number(cardapioHoje?.precoG || 0))
    }
  }, [cardapioHoje, form.clienteNome])

  function onNomeChange(valor) {
    setForm(prev => ({ ...prev, clienteNome: valor }))
    if (valor.length < 2) { setSugestoes([]); return }
    const found = clientes.filter(c => c.nome.toLowerCase().includes(valor.toLowerCase()))
    setSugestoes(found.slice(0, 5))
  }

  function selecionarCliente(c) {
    // Aplica preços personalizados se cliente fiado tiver preços definidos
    const isFiado = ['mensalista', 'semanal', 'quinzenal'].includes(c.tipo)
    const precoEspecial = isFiado && c.precosMarmitex?.length > 0 ? Number(c.precosMarmitex[0].preco) : null
    setPrecoP(precoEspecial ?? (isFiado && c.precoMarmitexP ? Number(c.precoMarmitexP) : Number(cardapioHoje?.precoP || 0)))
    setPrecoG(precoEspecial ?? (isFiado && c.precoMarmitexG ? Number(c.precoMarmitexG) : Number(cardapioHoje?.precoG || 0)))
    setForm(prev => ({
      ...prev,
      clienteNome: c.nome,
      clienteTelefone: c.telefone || prev.clienteTelefone,
      clienteRua: c.rua || prev.clienteRua,
      clienteBairro: c.bairro || prev.clienteBairro,
      clienteNumero: c.numero || prev.clienteNumero,
      clienteReferencia: c.referencia || prev.clienteReferencia,
      pagamento: c.tipo === 'mensalista' ? 'Mensalista' : c.tipo === 'quinzenal' ? 'Quinzenal' : c.tipo === 'semanal' ? 'Semanal' : prev.pagamento,
    }))
    setSugestoes([])
  }

  const opcoesAlmoco = (cardapioHoje?.opcoes || []).filter(o => o.disponivel)
  const carnesGlobais = (cardapioHoje?.carnes || []).filter(c => c.trim())
  const combos = cardapio.filter(i => i.disponivel && i.categoria === 'Combo')
  const refrigerantes = cardapio.filter(i => i.disponivel && i.categoria === 'Refrigerante')

  function adicionarMarmitex(opcao, proteina, tamanho, retirados, extras, qtd = 1) {
    const preco = tamanho === 'P' ? precoP : precoG
    const novas = Array.from({ length: qtd }, () => ({
      uid: uid(), opcaoId: opcao.id, nome: opcao.nome,
      proteina, tamanho, preco, adicionais: extras || '', remover: '', qtd: 1,
      retirados: retirados || [], extras: extras || '',
      acompanhamentos: toNomes(opcao.acompanhamentos),
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

  const saladaRaw = cardapioHoje?.salada || {}
  const saladaConfig = {
    disponivel: saladaRaw.disponivel ?? false,
    preco: saladaRaw.preco ?? '',
    ingredientes: saladaRaw.ingredientes ?? [],
  }
  const precoSalada = Number(saladaConfig.preco || 0)

  const totalMarmitex = form.itensMarmitex.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalRefrigerante = form.itensRefrigerante.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalCombo = form.itensCombo.reduce((acc, i) => acc + i.preco * i.qtd, 0)
  const totalEmbalagens = (form.embalagensAdicionais || 0) * 1
  const totalSalada = form.saladaIngredientes !== null ? precoSalada : 0
  const total = totalMarmitex + totalRefrigerante + totalCombo + totalEmbalagens + totalSalada

  const temItens = form.itensMarmitex.length > 0 || form.itensRefrigerante.length > 0 || form.itensCombo.length > 0 || form.embalagensAdicionais > 0 || form.saladaIngredientes !== null

  function salvar() {
    if (!temItens) return
    const todosItens = [
      ...form.itensMarmitex.map(i => ({ ...i, tipo: 'marmitex' })),
      ...form.itensCombo.map(i => ({ ...i, tipo: 'combo' })),
      ...form.itensRefrigerante.map(i => ({ ...i, tipo: 'refrigerante' })),
    ]
    if (form.saladaIngredientes !== null) {
      todosItens.push({ uid: uid(), tipo: 'salada', nome: 'Salada', ingredientes: form.saladaIngredientes, preco: precoSalada, qtd: 1 })
    }
    if (form.embalagensAdicionais > 0) {
      todosItens.push({
        uid: uid(), tipo: 'embalagem', nome: 'Embalagem adicional',
        qtd: form.embalagensAdicionais, preco: 1,
      })
    }
    const troco = form.pagamento === 'Dinheiro' && form.trocoPara ? Number(form.trocoPara) : null
    // Troco salvo dentro de itens (JSONB existente) para persistir no Supabase sem coluna nova
    if (troco) {
      todosItens.push({ tipo: 'troco', valorPago: troco, troco: troco - total })
    }
    // Auto-atualiza tipo do cliente quando pagamento é fiado
    const FIADO_MAP = { 'Mensalista': 'mensalista', 'Quinzenal': 'quinzenal', 'Semanal': 'semanal' }
    if (FIADO_MAP[form.pagamento] && form.clienteNome) {
      const clienteExistente = clientes.find(c => c.nome.toLowerCase().trim() === form.clienteNome.toLowerCase().trim())
      if (clienteExistente && clienteExistente.tipo !== FIADO_MAP[form.pagamento]) {
        editarCliente(clienteExistente.id, { ...clienteExistente, tipo: FIADO_MAP[form.pagamento] })
      }
    }

    adicionarPedido({
      clienteNome: form.clienteNome || 'Cliente não identificado',
      clienteTelefone: form.clienteTelefone,
      rua: form.tipoEntrega === 'retirada' ? '' : form.clienteRua,
      bairro: form.tipoEntrega === 'retirada' ? '' : form.clienteBairro,
      numero: form.tipoEntrega === 'retirada' ? '' : form.clienteNumero,
      referencia: form.tipoEntrega === 'retirada' ? '' : form.clienteReferencia,
      tipoEntrega: form.tipoEntrega,
      motoboy: form.tipoEntrega === 'retirada' ? 'Retirar no local' : '',
      itens: todosItens,
      pagamento: form.pagamento,
      trocoPara: troco,
      observacoes: form.observacoes,
      horarioEntrega: form.horarioEntrega,
      embalagensAdicionais: form.embalagensAdicionais,
      total,
    })
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function toDateStr(iso) {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  const pedidosFiltrados = pedidos.filter(p => {
    const statusOk = filtroStatus === 'todos' || p.status === filtroStatus
    const dataOk = !filtroData || toDateStr(p.criadoEm) === filtroData
    return statusOk && dataOk
  })

  const emAberto = pedidos.filter(p => p.status === 'aberto').length

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0, lineHeight: 1.2 }}>
            Pedidos
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
            {emAberto} em aberto
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Toggle impressão — icon only on mobile */}
          <button
            onClick={() => setAutoImprimir(v => {
              const next = !v
              localStorage.setItem('fogao_autoImprimir', JSON.stringify(next))
              return next
            })}
            title={autoImprimir ? 'Impressão automática ativada' : 'Impressão manual'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              border: autoImprimir ? '1.5px solid #16A34A' : '1.5px solid #CFC4BB',
              background: autoImprimir ? '#F0FDF4' : '#F7F3EF',
              color: autoImprimir ? '#15803D' : '#6B5A4E',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">{autoImprimir ? 'Impressão automática' : 'Impressão manual'}</span>
          </button>
          {/* Botão Novo Pedido */}
          <button
            onClick={() => setMostrarForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#C8221A', color: '#fff',
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(200,34,26,0.35)',
              transition: 'background 0.15s',
            }}
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtro de data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '6px 12px' }}>
          <span style={{ fontSize: 13, color: '#6B5A4E', fontWeight: 600 }}>📅</span>
          <input
            type="date"
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1A0E08', fontFamily: 'Inter, sans-serif', background: 'transparent', cursor: 'pointer' }}
          />
          {filtroData !== (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })() && (
            <button
              onClick={() => { const d = new Date(); setFiltroData(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C8221A', fontSize: 11, fontWeight: 700, padding: '0 2px' }}
              title="Voltar para hoje"
            >Hoje</button>
          )}
        </div>
        {/* Filtro de status */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['todos', 'Todos'], ...Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.label])].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltroStatus(key)}
              style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: filtroStatus === key ? 'none' : '1.5px solid #E6DDD5',
                background: filtroStatus === key ? '#C8221A' : '#fff',
                color: filtroStatus === key ? '#fff' : '#6B5A4E',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: filtroStatus === key ? '0 2px 6px rgba(200,34,26,0.25)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário de Novo Pedido */}
      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end',
        }} className="md:relative md:inset-auto md:z-auto md:bg-transparent md:block">
        <div style={{
          background: '#fff', width: '100%', maxHeight: '92dvh',
          borderRadius: '20px 20px 0 0', overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }} className="md:rounded-xl md:max-h-none md:border md:border-stone-200 md:mb-5 md:shadow-lg">
          {/* Drag handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#D1C4BB' }} />
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
              Novo Pedido
            </h2>
            <button onClick={() => { setForm(FORM_VAZIO); setMostrarForm(false); setSugestoes([]) }}
              style={{ background: '#F7F3EF', border: '1.5px solid #E6DDD5', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#6B5A4E', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <X size={15} /> Fechar
            </button>
          </div>

          {/* ── Seção: Tipo de entrega ── */}
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
            borderRadius: 10, padding: 12, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#1D4ED8', marginBottom: 10 }}>
              <Bike size={13} /> Tipo de entrega
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'entrega', label: '🛵  Entrega' },
                { value: 'retirada', label: '🏠  Retirar no local' },
              ].map(op => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipoEntrega: op.value }))}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: form.tipoEntrega === op.value ? '2px solid #1D4ED8' : '1.5px solid #CFC4BB',
                    background: form.tipoEntrega === op.value ? '#DBEAFE' : '#fff',
                    color: form.tipoEntrega === op.value ? '#1D4ED8' : '#6B5A4E',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Seção: Dados do Cliente ── */}
          <div style={{
            background: '#F0FDF4', border: '1.5px solid #BBF7D0',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#16A34A' }}>
              <User size={13} /> Dados do Cliente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Nome</label>
                <input
                  type="text"
                  value={form.clienteNome}
                  onChange={e => onNomeChange(e.target.value)}
                  style={INPUT_BASE}
                  placeholder="Nome do cliente..."
                  autoComplete="off"
                />
                {sugestoes.length > 0 && (
                  <div style={{
                    position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0,
                    background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.10)', marginTop: 4, overflow: 'hidden',
                  }}>
                    {sugestoes.map(c => (
                      <button key={c.id} onClick={() => selecionarCliente(c)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px',
                          background: 'none', border: 'none', borderBottom: '1px solid #F7F3EF',
                          cursor: 'pointer', fontSize: 13,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#1A0E08' }}>{c.nome}</span>
                          {c.tipo === 'mensalista' && (
                            <span style={{ fontSize: 10, background: '#FED7AA', color: '#9A3412', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                              Mensalista
                            </span>
                          )}
                          {c.tipo === 'quinzenal' && (
                            <span style={{ fontSize: 10, background: '#EDE9FE', color: '#5B21B6', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                              Quinzenal
                            </span>
                          )}
                          {c.tipo === 'semanal' && (
                            <span style={{ fontSize: 10, background: '#E0F2FE', color: '#0369A1', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
                              Semanal
                            </span>
                          )}
                        </div>
                        {(c.rua || c.bairro) && (
                          <span style={{ color: '#9D8878', fontSize: 13 }}>{formatarEndereco(c)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Telefone</label>
                <input
                  type="text"
                  value={form.clienteTelefone}
                  onChange={e => setForm(prev => ({ ...prev, clienteTelefone: e.target.value }))}
                  style={INPUT_BASE}
                  placeholder="(32) 99999-9999"
                />
              </div>
              {form.tipoEntrega !== 'retirada' && <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 8 }}>
                  <MapPin size={11} /> Endereço de Entrega
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Rua</label>
                    <input type="text" value={form.clienteRua}
                      onChange={e => setForm(prev => ({ ...prev, clienteRua: e.target.value }))}
                      style={INPUT_BASE} placeholder="Nome da rua" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Bairro</label>
                    <input type="text" value={form.clienteBairro}
                      onChange={e => setForm(prev => ({ ...prev, clienteBairro: e.target.value }))}
                      style={INPUT_BASE} placeholder="Bairro" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Número</label>
                    <input type="text" value={form.clienteNumero}
                      onChange={e => setForm(prev => ({ ...prev, clienteNumero: e.target.value }))}
                      style={INPUT_BASE} placeholder="Ex: 123" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Referência</label>
                    <input type="text" value={form.clienteReferencia}
                      onChange={e => setForm(prev => ({ ...prev, clienteReferencia: e.target.value }))}
                      style={INPUT_BASE} placeholder="Próximo ao..." />
                  </div>
                </div>
              </div>}
            </div>
          </div>

          {/* ── Seção: Marmitex ── */}
          <div style={{
            background: '#FFF7ED', border: '1.5px solid #FED7AA',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#EA580C' }}>
              <UtensilsCrossed size={13} /> Marmitex
            </p>
            {opcoesAlmoco.length === 0 || !precoG ? (
              <p style={{ fontSize: 12, color: '#9D8878' }}>Configure as opções e preços em Cardápio.</p>
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
              <div key={item.uid} style={{
                background: '#fff', border: '1.5px solid #FED7AA',
                borderRadius: 8, padding: 12, marginTop: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A0E08' }}>
                    {item.nome}{' '}
                    <span style={{ color: '#EA580C', fontWeight: 700 }}>({item.tamanho})</span>
                    {item.proteina && <span style={{ color: '#6B5A4E', fontWeight: 400 }}> · {item.proteina}</span>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                      R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}
                    </span>
                    <button onClick={() => removerMarmitex(item.uid)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
                {item.retirados && item.retirados.length > 0 && (
                  <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 4 }}>Sem: {item.retirados.join(', ')}</p>
                )}
                {item.extras && (
                  <p style={{ fontSize: 13, color: '#16A34A', marginBottom: 4 }}>+ {item.extras}</p>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Observação</label>
                  <input type="text" value={item.adicionais}
                    onChange={e => atualizarItemMarmitex(item.uid, 'adicionais', e.target.value)}
                    style={{ ...INPUT_BASE }}
                    placeholder="Observação adicional..." />
                </div>
              </div>
            ))}
          </div>

          {/* ── Seção: Combos ── */}
          {combos.length > 0 && (
            <div style={{
              background: '#FAF5FF', border: '1.5px solid #E9D5FF',
              borderRadius: 10, padding: 16, marginBottom: 12,
            }}>
              <p style={{ ...SECTION_LABEL, color: '#7C3AED' }}>
                <Package size={13} /> Combos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {combos.map(item => (
                  <button key={item.id} onClick={() => adicionarCombo(item)}
                    style={{
                      background: '#fff', border: '1.5px solid #E9D5FF',
                      borderRadius: 8, padding: 12, textAlign: 'left', cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A0E08' }}>{item.nome}</p>
                    {item.descricao && <p style={{ fontSize: 13, color: '#9D8878', marginTop: 2 }}>{item.descricao}</p>}
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#16A34A', marginTop: 6 }}>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
              {form.itensCombo.map(item => (
                <div key={item.uid} style={{
                  background: '#fff', border: '1.5px solid #E9D5FF',
                  borderRadius: 8, padding: 12, marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A0E08' }}>{item.nome}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}</span>
                      <button onClick={() => removerCombo(item.uid)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Adicionar</label>
                      <input type="text" value={item.adicionais}
                        onChange={e => atualizarItemCombo(item.uid, 'adicionais', e.target.value)}
                        style={{ ...INPUT_BASE }}
                        placeholder="Ex: bacon..." />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#9D8878', marginBottom: 4 }}>Retirar</label>
                      <input type="text" value={item.remover}
                        onChange={e => atualizarItemCombo(item.uid, 'remover', e.target.value)}
                        style={{ ...INPUT_BASE }}
                        placeholder="Ex: cebola..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Seção: Salada ── */}
          {saladaConfig.disponivel && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ ...SECTION_LABEL, color: '#16A34A', margin: 0 }}>
                  🥗 Salada personalizada {precoSalada > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>— R$ {precoSalada.toFixed(2).replace('.', ',')}</span>}
                </p>
                <button
                  onClick={() => setForm(prev => ({ ...prev, saladaIngredientes: prev.saladaIngredientes !== null ? null : [...(saladaConfig.ingredientes || [])] }))}
                  style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: form.saladaIngredientes !== null ? '#16A34A' : '#fff',
                    color: form.saladaIngredientes !== null ? '#fff' : '#16A34A',
                    border: '1.5px solid #16A34A' }}
                >
                  {form.saladaIngredientes !== null ? '✓ Adicionada' : '+ Adicionar salada'}
                </button>
              </div>
              {form.saladaIngredientes !== null && (
                <div>
                  <p style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 6 }}>Clique nos ingredientes para remover:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {(saladaConfig.ingredientes || []).map(ingr => {
                      const selecionado = form.saladaIngredientes.includes(ingr)
                      return (
                        <button key={ingr}
                          onClick={() => setForm(prev => ({
                            ...prev,
                            saladaIngredientes: selecionado
                              ? prev.saladaIngredientes.filter(i => i !== ingr)
                              : [...prev.saladaIngredientes, ingr]
                          }))}
                          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600,
                            background: selecionado ? '#DCFCE7' : '#F3F4F6',
                            color: selecionado ? '#166534' : '#9D8878',
                            textDecoration: selecionado ? 'none' : 'line-through' }}
                        >
                          {ingr}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Seção: Refrigerantes ── */}
          <div style={{
            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#2563EB' }}>
              <GlassWater size={13} /> Refrigerantes
            </p>
            {refrigerantes.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9D8878' }}>Nenhum refrigerante cadastrado.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {refrigerantes.map(item => (
                  <button key={item.id} onClick={() => adicionarRefrigerante(item)}
                    style={{
                      background: '#fff', border: '1.5px solid #BFDBFE',
                      borderRadius: 8, padding: 10, textAlign: 'left', cursor: 'pointer',
                    }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A0E08', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.nome}
                    </p>
                    <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                      {item.subtipo}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#16A34A', marginTop: 4 }}>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</p>
                  </button>
                ))}
              </div>
            )}
            {form.itensRefrigerante.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.itensRefrigerante.map(item => (
                  <div key={item.uid} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', border: '1.5px solid #BFDBFE',
                    borderRadius: 8, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 13, color: '#1A0E08' }}>
                      {item.nome}{' '}
                      <span style={{ fontSize: 13, color: '#2563EB' }}>({item.subtipo})</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => alterarQtdRefrigerante(item.uid, -1)}
                        style={{ width: 26, height: 26, background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        -
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 16, textAlign: 'center' }}>{item.qtd}</span>
                      <button onClick={() => alterarQtdRefrigerante(item.uid, 1)}
                        style={{ width: 26, height: 26, background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                        +
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A', minWidth: 56, textAlign: 'right' }}>
                        R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}
                      </span>
                      <button onClick={() => removerRefrigerante(item.uid)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Seção: Embalagens ── */}
          <div style={{
            background: '#F8FAFC', border: '1.5px solid #CBD5E1',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#475569' }}>
              <Package size={13} /> Embalagens Adicionais (R$ 1,00 cada)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setForm(prev => ({ ...prev, embalagensAdicionais: Math.max(0, (prev.embalagensAdicionais || 0) - 1) }))}
                style={{
                  width: 34, height: 34, background: '#fff', border: '1.5px solid #CBD5E1',
                  borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer', color: '#475569',
                }}>
                -
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1A0E08', minWidth: 28, textAlign: 'center' }}>
                {form.embalagensAdicionais}
              </span>
              <button
                onClick={() => setForm(prev => ({ ...prev, embalagensAdicionais: (prev.embalagensAdicionais || 0) + 1 }))}
                style={{
                  width: 34, height: 34, background: '#fff', border: '1.5px solid #CBD5E1',
                  borderRadius: 8, fontWeight: 700, fontSize: 18, cursor: 'pointer', color: '#475569',
                }}>
                +
              </button>
              {form.embalagensAdicionais > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                  R$ {(form.embalagensAdicionais * 1).toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </div>

          {/* ── Seção: Pagamento ── */}
          <div style={{
            background: '#FFFBEB', border: '1.5px solid #FDE68A',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#D97706' }}>
              <CreditCard size={13} /> Forma de Pagamento
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FORMAS_PAGAMENTO_OPCOES.map(f => (
                <button key={f.value} onClick={() => setForm(prev => ({ ...prev, pagamento: f.value }))}
                  style={{
                    padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: form.pagamento === f.value ? '2px solid currentColor' : '1.5px solid #E6DDD5',
                    background: form.pagamento === f.value ? undefined : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s',
                    ...(form.pagamento === f.value ? {
                      boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                      transform: 'scale(1.03)',
                    } : {}),
                  }}
                  className={form.pagamento === f.value ? f.cor : ''}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {form.pagamento === 'Dinheiro' && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#6B5A4E', whiteSpace: 'nowrap' }}>Troco para:</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9D8878', fontWeight: 600 }}>R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.trocoPara}
                      onChange={e => setForm(prev => ({ ...prev, trocoPara: e.target.value }))}
                      placeholder="0,00"
                      style={{ width: 110, padding: '8px 10px 8px 30px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: '1.5px solid #CFC4BB', outline: 'none', color: '#1A0E08', fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>
                {form.trocoPara && Number(form.trocoPara) >= total && (
                  <div style={{ background: '#16A34A', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 14, fontWeight: 800 }}>
                    Troco: R$ {(Number(form.trocoPara) - total).toFixed(2).replace('.', ',')}
                  </div>
                )}
                {form.trocoPara && Number(form.trocoPara) < total && (
                  <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
                    Valor insuficiente — faltam R$ {(total - Number(form.trocoPara)).toFixed(2).replace('.', ',')}
                  </div>
                )}
              </div>
            )}
            {['Pendente', 'Mensalista', 'Quinzenal', 'Semanal'].includes(form.pagamento) && (
              <p style={{ fontSize: 13, color: '#D97706', marginTop: 8, fontWeight: 600 }}>
                Pagamento registrado como pendente
              </p>
            )}
          </div>

          {/* ── Seção: Horário de Entrega ── */}
          <div style={{
            background: '#FFFBEB', border: '1.5px solid #FDE68A',
            borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <p style={{ ...SECTION_LABEL, color: '#D97706' }}>
              <Clock size={13} /> Horário de Entrega (opcional)
            </p>
            <input type="time" value={form.horarioEntrega}
              onChange={e => setForm(prev => ({ ...prev, horarioEntrega: e.target.value }))}
              style={{ ...INPUT_BASE, width: 'auto', minWidth: 140 }} />
          </div>

          {/* Observações */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>
              Observações gerais
            </label>
            <input type="text" value={form.observacoes}
              onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              style={INPUT_BASE}
              placeholder="Observações adicionais..." />
          </div>

          {/* Resumo total */}
          {temItens && (
            <div style={{
              background: '#F0FDF4', border: '1.5px solid #BBF7D0',
              borderRadius: 10, padding: 16, marginBottom: 16,
            }}>
              {totalMarmitex > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B5A4E', marginBottom: 4 }}>
                  <span>Marmitex</span><span>R$ {totalMarmitex.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {totalCombo > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B5A4E', marginBottom: 4 }}>
                  <span>Combos</span><span>R$ {totalCombo.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {totalRefrigerante > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B5A4E', marginBottom: 4 }}>
                  <span>Refrigerantes</span><span>R$ {totalRefrigerante.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {totalEmbalagens > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B5A4E', marginBottom: 4 }}>
                  <span>Embalagens</span><span>R$ {totalEmbalagens.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontWeight: 700, fontSize: 16, color: '#15803D',
                borderTop: '1.5px solid #BBF7D0', marginTop: 8, paddingTop: 8,
              }}>
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={salvar} disabled={!temItens}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: temItens ? '#16A34A' : '#CFC4BB',
                color: '#fff', padding: '14px 20px', borderRadius: 12,
                fontSize: 15, fontWeight: 700, border: 'none', cursor: temItens ? 'pointer' : 'not-allowed',
                boxShadow: temItens ? '0 2px 8px rgba(22,163,74,0.35)' : 'none',
                transition: 'all 0.15s',
              }}>
              <Check size={17} /> Confirmar Pedido
            </button>
          </div>
          </div>
        </div>
        </div>
      )}

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9D8878' }}>
          <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block' }} />
          <p style={{ fontSize: 13 }}>Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pedidosFiltrados.map(pedido => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onStatus={atualizarStatusPedido}
              onPagamentoStatus={atualizarPagamentoPedido}
              onFormaPagamento={atualizarFormaPagamento}
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

  const COR_BADGE = ['#EA580C', '#B45309']

  // Retorna itens normalizados com grupo
  function acompsComGrupo(opcao) {
    return (opcao?.acompanhamentos || []).map(a => typeof a === 'string' ? { nome: a, grupo: null } : a)
  }

  // Grupos únicos de uma opção
  function gruposDaOpcao(opcao) {
    return [...new Set(acompsComGrupo(opcao).map(a => a.grupo).filter(Boolean))]
  }

  // Verifica se todos os grupos têm uma seleção
  function gruposCompletos(opcao, sel) {
    return gruposDaOpcao(opcao).every(g => {
      const nomes = acompsComGrupo(opcao).filter(a => a.grupo === g).map(a => a.nome)
      return nomes.some(n => sel.includes(n))
    })
  }

  function selecionarOpcao(opcao) {
    setOpcaoSel(opcao)
    setCarneSel('')
    // Pré-seleciona apenas itens SEM grupo; com grupo ficam em branco (obrigatório escolher)
    setAcompSel(acompsComGrupo(opcao).filter(a => !a.grupo).map(a => a.nome))
    setExtras('')
    setQtd(1)
  }

  function toggleAcomp(item, grupo) {
    setAcompSel(prev => {
      if (grupo) {
        // Comportamento rádio: remove outros do grupo, adiciona este
        const grupoNomes = acompsComGrupo(opcaoSel).filter(a => a.grupo === grupo).map(a => a.nome)
        const semGrupo = prev.filter(n => !grupoNomes.includes(n))
        return prev.includes(item) ? semGrupo : [...semGrupo, item]
      }
      return prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    })
  }

  function confirmar(tamanho) {
    if (!opcaoSel) return
    // Bloquear se algum grupo não foi escolhido
    if (!gruposCompletos(opcaoSel, acompSel)) return
    const todosAcomp = toNomes(opcaoSel.acompanhamentos)
    const retirados = todosAcomp.filter(a => !acompSel.includes(a))
    const proteinaFinal = tipoCarnesAtual === 'especial' ? (opcaoSel.pratoEspecial || '') : carneSel
    onAdicionar(opcaoSel, proteinaFinal, tamanho, retirados, extras, qtd)
    const msg = `✓ ${qtd}x ${opcaoSel.nome} (${tamanho}) adicionada${qtd > 1 ? 's' : ''}!`
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 2000)
    setOpcaoSel(null)
    setCarneSel('')
    setAcompSel([])
    setExtras('')
    setQtd(1)
  }

  const tipoCarnesAtual = opcaoSel?.tipoCarnes || 'globais'
  const temCarnesLivres = tipoCarnesAtual === 'globais' && carnesGlobais.length > 0
  const prontoParaTamanho = opcaoSel && (!temCarnesLivres || carneSel !== '') && gruposCompletos(opcaoSel, acompSel)

  return (
    <div>
      {feedback && (
        <div style={{
          marginBottom: 12, padding: '12px 16px',
          background: '#DCFCE7', color: '#15803D',
          fontSize: 15, fontWeight: 700, borderRadius: 10,
          border: '1.5px solid #BBF7D0',
        }}>
          {feedback}
        </div>
      )}

      {/* Passo 1 – escolher opção */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {opcoesAlmoco.map((opcao, idx) => (
          <button key={opcao.id}
            onClick={() => selecionarOpcao(opcao)}
            style={{
              borderRadius: 12, padding: '14px 12px', textAlign: 'left',
              border: opcaoSel?.id === opcao.id ? `2.5px solid ${COR_BADGE[idx] || '#EA580C'}` : '1.5px solid #FED7AA',
              background: opcaoSel?.id === opcao.id ? '#FFF7ED' : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: opcaoSel?.id === opcao.id ? `0 4px 12px rgba(234,88,12,0.18)` : '0 1px 3px rgba(0,0,0,0.06)',
              minHeight: 80,
            }}
          >
            <span style={{
              fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
              background: COR_BADGE[idx] || '#EA580C', color: '#fff', display: 'inline-block', marginBottom: 8,
            }}>
              {opcao.nome}
            </span>
            <div style={{ marginTop: 2 }}>
              {toNomes(opcao.acompanhamentos).length > 0
                ? toNomes(opcao.acompanhamentos).map((a, i) => (
                    <p key={i} style={{ fontSize: 12, color: '#6B5A4E', lineHeight: 1.6 }}>· {a}</p>
                  ))
                : <p style={{ fontSize: 12, color: '#9D8878', fontStyle: 'italic' }}>Sem acompanhamentos</p>
              }
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {precoP > 0 && (
                <span style={{ fontSize: 12, background: '#FFF7ED', color: '#C2410C', padding: '3px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #FED7AA' }}>
                  P R$ {precoP.toFixed(2).replace('.', ',')}
                </span>
              )}
              {precoG > 0 && (
                <span style={{ fontSize: 12, background: '#F0FDF4', color: '#15803D', padding: '3px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid #BBF7D0' }}>
                  G R$ {precoG.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Passo 2 – acompanhamentos */}
      {opcaoSel && toNomes(opcaoSel.acompanhamentos).length > 0 && (
        <div style={{
          background: '#fff', border: '1.5px solid #FED7AA',
          borderRadius: 12, padding: '14px 14px', marginBottom: 10,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#6B5A4E', marginBottom: 10 }}>
            Acompanhamentos — clique para retirar
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {/* Itens sem grupo — toggle normal */}
            {(() => {
              const semGrupo = acompsComGrupo(opcaoSel).filter(a => !a.grupo)
              const grupos = gruposDaOpcao(opcaoSel)
              return <>
                {semGrupo.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {semGrupo.map((a, i) => {
                      const sel = acompSel.includes(a.nome)
                      return (
                        <button key={i} onClick={() => toggleAcomp(a.nome, null)}
                          style={{
                            padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                            border: sel ? '1.5px solid #16A34A' : '1.5px solid #CBD5E1',
                            background: sel ? '#DCFCE7' : '#F1F5F9',
                            color: sel ? '#15803D' : '#94A3B8',
                            textDecoration: sel ? 'none' : 'line-through',
                            cursor: 'pointer', minHeight: 40,
                          }}>
                          {a.nome}
                        </button>
                      )
                    })}
                  </div>
                )}
                {/* Grupos — escolha obrigatória (rádio) */}
                {grupos.map(grupo => {
                  const itens = acompsComGrupo(opcaoSel).filter(a => a.grupo === grupo)
                  const temSelecao = itens.some(a => acompSel.includes(a.nome))
                  return (
                    <div key={grupo} style={{
                      background: temSelecao ? '#F0FDF4' : '#FEF2F2',
                      border: `1.5px solid ${temSelecao ? '#BBF7D0' : '#FECACA'}`,
                      borderRadius: 10, padding: '10px 12px',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: temSelecao ? '#15803D' : '#991B1B', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {temSelecao ? '✓' : '⚠️'} Escolha um — {grupo}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {itens.map((a, i) => {
                          const sel = acompSel.includes(a.nome)
                          return (
                            <button key={i} onClick={() => toggleAcomp(a.nome, grupo)}
                              style={{
                                padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                                border: sel ? '2px solid #16A34A' : '1.5px solid #CBD5E1',
                                background: sel ? '#DCFCE7' : '#fff',
                                color: sel ? '#15803D' : '#6B5A4E',
                                cursor: 'pointer', minHeight: 40,
                              }}>
                              {sel ? '● ' : '○ '}{a.nome}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            })()}
          </div>
          <input type="text" value={extras} onChange={e => setExtras(e.target.value)}
            style={{ ...INPUT_BASE }}
            placeholder="Adicionar extra (ex: batata frita extra)" />
        </div>
      )}

      {/* Passo 3 – proteína */}
      {opcaoSel && tipoCarnesAtual === 'especial' && opcaoSel.pratoEspecial && (
        <div style={{
          background: '#FFF7ED', border: '1.5px solid #FED7AA',
          borderRadius: 12, padding: '14px 14px', marginBottom: 10,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9D8878', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🍲 Prato especial
          </p>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#1A0E08', margin: 0 }}>
            {opcaoSel.pratoEspecial}
          </p>
          <p style={{ fontSize: 12, color: '#9D8878', marginTop: 4 }}>Proteína já inclusa no prato</p>
        </div>
      )}
      {opcaoSel && temCarnesLivres && (
        <div style={{
          background: '#fff', border: '1.5px solid #FECACA',
          borderRadius: 12, padding: '14px 14px', marginBottom: 10,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#6B5A4E', marginBottom: 10 }}>
            Escolha a carne <span style={{ color: '#EF4444' }}>*</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {carnesGlobais.map((c, i) => (
              <button key={i} onClick={() => setCarneSel(c)}
                style={{
                  padding: '10px 18px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  border: carneSel === c ? 'none' : '1.5px solid #E6DDD5',
                  background: carneSel === c ? '#C8221A' : '#fff',
                  color: carneSel === c ? '#fff' : '#6B5A4E',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: carneSel === c ? '0 3px 8px rgba(200,34,26,0.25)' : 'none',
                  minHeight: 44,
                }}>
                {c}
              </button>
            ))}
          </div>
          {!carneSel && (
            <p style={{ fontSize: 13, color: '#EF4444', marginTop: 8 }}>Selecione a carne para continuar</p>
          )}
        </div>
      )}

      {/* Passo 4 – quantidade + tamanho */}
      {opcaoSel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff', border: '1.5px solid #FED7AA',
            borderRadius: 12, padding: '10px 16px',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#6B5A4E', marginRight: 'auto' }}>Quantidade:</span>
            <button onClick={() => setQtd(q => Math.max(1, q - 1))}
              style={{ width: 44, height: 44, background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              −
            </button>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#1A0E08', minWidth: 32, textAlign: 'center' }}>{qtd}</span>
            <button onClick={() => setQtd(q => q + 1)}
              style={{ width: 44, height: 44, background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              +
            </button>
            {qtd > 1 && (
              <span style={{ fontSize: 13, color: '#9D8878', marginLeft: 4 }}>
                {qtd} iguais
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {precoP > 0 && (
              <button onClick={() => prontoParaTamanho && confirmar('P')} disabled={!prontoParaTamanho}
                style={{
                  flex: 1, fontWeight: 800, padding: '16px 0', borderRadius: 12, fontSize: 15,
                  cursor: prontoParaTamanho ? 'pointer' : 'not-allowed',
                  background: prontoParaTamanho ? '#FFF7ED' : '#F1F5F9',
                  color: prontoParaTamanho ? '#C2410C' : '#9D8878',
                  border: prontoParaTamanho ? '2px solid #FED7AA' : '1.5px solid #E2E8F0',
                  transition: 'all 0.15s', lineHeight: 1.3,
                }}>
                + {qtd > 1 ? `${qtd}×` : ''} P{'\n'}
                <span style={{ fontSize: 17, fontWeight: 900 }}>
                  R$ {(precoP * qtd).toFixed(2).replace('.', ',')}
                </span>
              </button>
            )}
            <button onClick={() => prontoParaTamanho && confirmar('G')} disabled={!prontoParaTamanho}
              style={{
                flex: 1, fontWeight: 800, padding: '16px 0', borderRadius: 12, fontSize: 15,
                cursor: prontoParaTamanho ? 'pointer' : 'not-allowed',
                background: prontoParaTamanho ? '#EA580C' : '#E2E8F0',
                color: prontoParaTamanho ? '#fff' : '#9D8878',
                border: 'none',
                boxShadow: prontoParaTamanho ? '0 4px 12px rgba(234,88,12,0.35)' : 'none',
                transition: 'all 0.15s', lineHeight: 1.3,
              }}>
              + {qtd > 1 ? `${qtd}×` : ''} G{'\n'}
              <span style={{ fontSize: 17, fontWeight: 900 }}>
                R$ {(precoG * qtd).toFixed(2).replace('.', ',')}
              </span>
            </button>
            <button onClick={() => { setOpcaoSel(null); setCarneSel(''); setQtd(1) }}
              style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878' }}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PedidoCard ────────────────────────────────────────────────────────────────
function PedidoCard({ pedido, onStatus, onPagamentoStatus, onFormaPagamento, onAtribuirMotoboy, onQuitar, onRemover, motoboys, autoImprimir, onImpresso }) {
  const [aberto, setAberto] = useState(false)
  const [mostrarMotoboy, setMostrarMotoboy] = useState(false)
  const [motoboyInput, setMotoboyInput] = useState('')
  const [mostrarAlterarPagto, setMostrarAlterarPagto] = useState(false)

  const statusInfo = STATUS_LABELS[pedido.status] || STATUS_LABELS.aberto
  const hora = new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endFormatado = formatarEndereco(pedido)
  const pagStatus = PAGAMENTO_STATUS[pedido.statusPagamento] || PAGAMENTO_STATUS.pago
  const BADGE_PAGTO = FORMAS_PAGAMENTO_OPCOES.find(f => f.value === pedido.pagamento)

  const isEntregue = pedido.status === 'entregue'
  const isPendente = pedido.statusPagamento === 'pendente' || pedido.statusPagamento === 'mensalista'

  // Cor do card baseada no status
  const accentColor = isEntregue ? '#9CA3AF' : isPendente ? '#F59E0B' : '#3B82F6'
  const accentBg    = isEntregue ? '#F8FAFC'  : isPendente ? '#FFFBEB'  : '#EFF6FF'

  const PAG_STATUS_STYLE = {
    pago:       { background: '#16A34A', color: '#fff', border: 'none' },
    pendente:   { background: '#CA8A04', color: '#fff', border: 'none' },
    mensalista: { background: '#EA580C', color: '#fff', border: 'none' },
  }

  function confirmarMotoboy() {
    if (motoboyInput) onAtribuirMotoboy(pedido.id, motoboyInput)
    setMostrarMotoboy(false)
    setMotoboyInput('')
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1.5px solid #E6DDD5',
      borderLeft: `5px solid ${accentColor}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      overflow: 'hidden',
    }}>

      {/* ── Cabeçalho do card (sempre visível) ── */}
      <div
        onClick={() => setAberto(v => !v)}
        style={{ padding: '16px 16px 0', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Linha 1: Nome + Total */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#1A0E08', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {pedido.clienteNome}
            </p>
            <p style={{ fontSize: 12, color: '#9D8878', marginTop: 2 }}>{hora}{pedido.horarioEntrega ? ` · entrega ${pedido.horarioEntrega}` : ''}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 22, color: '#16A34A', lineHeight: 1 }}>
              R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
            </span>
            <ChevronDown size={18} color="#9D8878" style={{ transition: 'transform 0.2s', transform: aberto ? 'rotate(180deg)' : 'none' }} />
          </div>
        </div>

        {/* Linha 2: Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {/* Status pedido */}
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: isEntregue ? '#F1F5F9' : '#DBEAFE',
            color: isEntregue ? '#64748B' : '#1D4ED8',
          }}>
            {statusInfo.label}
          </span>

          {/* Forma de pagamento */}
          {BADGE_PAGTO && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${BADGE_PAGTO.cor}`} style={{ fontSize: 12 }}>
              {BADGE_PAGTO.label}
            </span>
          )}
          {(() => {
            const itemTroco = pedido.itens?.find(i => i.tipo === 'troco')
            const trocoVal = itemTroco ? itemTroco.troco : (pedido.trocoPara > 0 ? pedido.trocoPara - pedido.total : null)
            return trocoVal > 0 ? (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#DCFCE7', color: '#166534' }}>
                💵 Troco: R$ {Number(trocoVal).toFixed(2).replace('.', ',')}
              </span>
            ) : null
          })()}

          {/* Status pagamento */}
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            ...PAG_STATUS_STYLE[pedido.statusPagamento] || PAG_STATUS_STYLE.pago,
          }}>
            {pagStatus.icon} {pagStatus.label}
          </span>

          {/* Motoboy */}
          {pedido.motoboy && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bike size={12} /> {pedido.motoboy}
            </span>
          )}

          {/* Comanda */}
          {pedido.comandaImpressaEm ? (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Printer size={11} /> Impressa
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Printer size={11} /> Não impressa
            </span>
          )}
        </div>

        {/* Endereço */}
        {endFormatado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MapPin size={13} color="#9D8878" />
            <p style={{ fontSize: 13, color: '#6B5A4E' }}>{endFormatado}</p>
          </div>
        )}
      </div>

      {/* ── Painel expandido ── */}
      {aberto && (
        <div style={{ borderTop: '1.5px solid #F0EBE5' }}>

          {/* Itens do pedido */}
          {pedido.itens?.length > 0 && (
            <div style={{ padding: '14px 16px', background: '#FAFAF9', borderBottom: '1.5px solid #F0EBE5' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Itens do pedido
              </p>
              {pedido.itens.map((item, idx) => (
                <div key={idx} style={{
                  background: '#fff', borderRadius: 10, padding: '10px 14px',
                  marginBottom: 8, border: '1.5px solid #EDE8E3',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#1A0E08' }}>
                      {item.qtd && item.qtd > 1 ? `${item.qtd}x ` : ''}{item.nome || item.opcaoNome}
                      {item.tamanho && <span style={{ fontWeight: 800, color: '#EA580C' }}> · {item.tamanho}</span>}
                      {item.subtipo && <span style={{ color: '#2563EB', fontWeight: 600 }}> [{item.subtipo}]</span>}
                    </p>
                    {item.retirados?.length > 0 && (
                      <p style={{ fontSize: 13, color: '#DC2626', marginTop: 3 }}>✗ sem: {item.retirados.join(', ')}</p>
                    )}
                    {item.semItens?.length > 0 && (
                      <p style={{ fontSize: 13, color: '#DC2626', marginTop: 3 }}>✗ sem: {item.semItens.join(', ')}</p>
                    )}
                    {item.extras && <p style={{ fontSize: 13, color: '#16A34A', marginTop: 3 }}>+ {item.extras}</p>}
                    {item.adicionais && <p style={{ fontSize: 13, color: '#16A34A', marginTop: 3 }}>+ {item.adicionais}</p>}
                    {item.remover && <p style={{ fontSize: 13, color: '#DC2626', marginTop: 3 }}>✗ {item.remover}</p>}
                    {item.nome && item.tipo === 'marmitex' && (
                      <p style={{ fontSize: 12, color: '#9D8878', marginTop: 2 }}>para: {item.nome}</p>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#1A0E08', flexShrink: 0 }}>
                    R$ {((item.preco || 0) * (item.qtd || 1)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              {pedido.observacoes && (
                <div style={{ background: '#FFFBEB', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #FDE68A' }}>
                  <p style={{ fontSize: 13, color: '#92400E', fontStyle: 'italic' }}>📝 {pedido.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Status de pagamento */}
          <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #F0EBE5' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Status do pagamento
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PAGAMENTO_STATUS).map(([key, info]) => {
                const ativo = pedido.statusPagamento === key
                const st = PAG_STATUS_STYLE[key]
                return (
                  <button key={key}
                    onClick={() => onPagamentoStatus(pedido.id, key)}
                    style={{
                      padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      border: ativo ? 'none' : '1.5px solid #E6DDD5',
                      background: ativo ? st.background : '#F7F3EF',
                      color: ativo ? st.color : '#9D8878',
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: ativo ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}>
                    <span style={{ fontSize: 18 }}>{info.icon}</span>
                    {info.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Forma de pagamento */}
          <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #F0EBE5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mostrarAlterarPagto ? 10 : 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Forma de pagamento: <span style={{ color: '#1A0E08' }}>{pedido.pagamento || '—'}</span>
              </p>
              <button onClick={() => setMostrarAlterarPagto(v => !v)}
                style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid #E6DDD5', background: '#fff', color: '#6B5A4E', cursor: 'pointer' }}>
                {mostrarAlterarPagto ? 'Cancelar' : 'Alterar'}
              </button>
            </div>
            {mostrarAlterarPagto && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {FORMAS_PAGAMENTO_OPCOES.map(f => (
                  <button key={f.value}
                    onClick={() => { onFormaPagamento(pedido.id, f.value); setMostrarAlterarPagto(false) }}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s',
                      border: pedido.pagamento === f.value ? '2px solid currentColor' : '1.5px solid #E6DDD5',
                      background: pedido.pagamento === f.value ? undefined : '#fff',
                    }}
                    className={pedido.pagamento === f.value ? f.cor : ''}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Ações
            </p>

            {/* Imprimir comanda */}
            <button onClick={() => imprimirComanda(pedido, autoImprimir, onImpresso)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: '#FFF7ED', color: '#C2410C',
                border: '1.5px solid #FED7AA', cursor: 'pointer',
              }}>
              <Printer size={16} /> {pedido.comandaImpressaEm ? 'Reimprimir Comanda' : 'Imprimir Comanda'}
            </button>

            {pedido.status !== 'entregue' && (
              <>
                {/* Motoboy */}
                <button onClick={() => setMostrarMotoboy(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: pedido.motoboy ? '#EEF2FF' : '#F8FAFC',
                    color: pedido.motoboy ? '#4338CA' : '#475569',
                    border: pedido.motoboy ? '1.5px solid #C7D2FE' : '1.5px solid #CBD5E1',
                    cursor: 'pointer',
                  }}>
                  <Bike size={16} />
                  {pedido.motoboy ? `🛵 ${pedido.motoboy}` : 'Atribuir Motoboy / Retirada'}
                </button>

                {/* Painel seleção motoboy */}
                {mostrarMotoboy && (
                  <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Bike size={14} /> Selecionar entrega
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <button
                        onClick={() => { onAtribuirMotoboy(pedido.id, 'Retirar no local'); setMostrarMotoboy(false) }}
                        style={{
                          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                          background: pedido.motoboy === 'Retirar no local' ? '#DBEAFE' : '#fff',
                          color: pedido.motoboy === 'Retirar no local' ? '#1D4ED8' : '#475569',
                          border: pedido.motoboy === 'Retirar no local' ? '1.5px solid #93C5FD' : '1.5px solid #CBD5E1',
                          cursor: 'pointer',
                        }}>
                        🏠 Retirar no local
                      </button>
                      {(motoboys || []).map(m => (
                        <button key={m}
                          onClick={() => { onAtribuirMotoboy(pedido.id, m); setMostrarMotoboy(false) }}
                          style={{
                            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: pedido.motoboy === m ? '#EEF2FF' : '#fff',
                            color: pedido.motoboy === m ? '#4338CA' : '#475569',
                            border: pedido.motoboy === m ? '1.5px solid #C7D2FE' : '1.5px solid #CBD5E1',
                            cursor: 'pointer',
                          }}>
                          🛵 {m}
                        </button>
                      ))}
                    </div>
                    {(!motoboys || motoboys.length === 0) && (
                      <p style={{ fontSize: 13, color: '#9D8878', marginBottom: 10 }}>Nenhum motoboy cadastrado. Cadastre em Funcionários.</p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={motoboyInput} onChange={e => setMotoboyInput(e.target.value)}
                        style={{ ...INPUT_BASE, flex: 1, padding: '12px 14px', fontSize: 15 }}
                        placeholder="Ou digite o nome..." />
                      <button onClick={confirmarMotoboy}
                        style={{
                          background: '#16A34A', color: '#fff',
                          padding: '12px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        }}>
                        <Check size={14} /> OK
                      </button>
                      <button onClick={() => setMostrarMotoboy(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', padding: 4 }}>
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Marcar Entregue */}
                <button onClick={() => onStatus(pedido.id, 'entregue')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: '#F0FDF4', color: '#16A34A',
                    border: '1.5px solid #BBF7D0', cursor: 'pointer',
                  }}>
                  <Check size={16} /> Marcar como Entregue
                </button>
              </>
            )}

            {/* Excluir */}
            <button onClick={() => onRemover(pedido.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: '#FEF2F2', color: '#DC2626',
                border: '1.5px solid #FECACA', cursor: 'pointer',
              }}>
              <X size={15} /> Excluir pedido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
