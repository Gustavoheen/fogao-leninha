import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart3, TrendingUp, ShoppingBag, AlertCircle, Banknote, Smartphone, CreditCard, CircleDollarSign, Bike, HandCoins, ChevronDown, ChevronUp, Printer, FileText } from 'lucide-react'

const ICONE_PAGAMENTO = {
  'Dinheiro': Banknote,
  'PIX': Smartphone,
  'Cartão de Débito': CreditCard,
  'Cartão de Crédito': CreditCard,
  'Mensalista': CircleDollarSign,
  'Pendente': AlertCircle,
}

const COR_PAGAMENTO = {
  'Dinheiro': { bg: '#16A34A', light: '#F0FDF4', border: '#BBF7D0', text: '#14532D' },
  'PIX': { bg: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', text: '#1E3A8A' },
  'Cartão de Débito': { bg: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95' },
  'Cartão de Crédito': { bg: '#4338CA', light: '#EEF2FF', border: '#C7D2FE', text: '#312E81' },
  'Mensalista': { bg: '#EA580C', light: '#FFF7ED', border: '#FED7AA', text: '#7C2D12' },
  'Pendente': { bg: '#C8221A', light: '#FEF2F2', border: '#FECACA', text: '#7F1D1D' },
}

const INPUT_BASE = {
  background: '#fff',
  border: '1.5px solid #CFC4BB',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  color: '#1A0E08',
}

function dataInicioPeriodo(periodo, dataCustom) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (periodo === 'hoje') return hoje
  if (periodo === 'semana') {
    const d = new Date(hoje)
    d.setDate(d.getDate() - d.getDay())
    return d
  }
  if (periodo === 'mes') {
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  }
  if (periodo === 'custom' && dataCustom.inicio) {
    const d = new Date(dataCustom.inicio + 'T00:00:00')
    return d
  }
  return hoje
}

function dataFimPeriodo(periodo, dataCustom) {
  const hoje = new Date()
  hoje.setHours(23, 59, 59, 999)
  if (periodo === 'hoje') return hoje
  if (periodo === 'semana') {
    const d = new Date(hoje)
    d.setDate(d.getDate() + (6 - d.getDay()))
    d.setHours(23, 59, 59, 999)
    return d
  }
  if (periodo === 'mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    d.setHours(23, 59, 59, 999)
    return d
  }
  if (periodo === 'custom' && dataCustom.fim) {
    const d = new Date(dataCustom.fim + 'T23:59:59')
    return d
  }
  return hoje
}

export default function Dashboard() {
  const { pedidos, despesas, funcionarios, clientes, quitarPedido, debitoPendente } = useApp()
  const [periodo, setPeriodo] = useState('hoje')
  const [dataCustom, setDataCustom] = useState({ inicio: '', fim: '' })
  const [mostrarCaderneta, setMostrarCaderneta] = useState(false)

  const inicio = dataInicioPeriodo(periodo, dataCustom)
  const fim = dataFimPeriodo(periodo, dataCustom)

  const pedidosPeriodo = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    return d >= inicio && d <= fim && p.status !== 'cancelado'
  })

  const pedidosPagos = pedidosPeriodo.filter(p =>
    p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista')
  )
  const totalReceitas = pedidosPagos.reduce((acc, p) => acc + Number(p.total), 0)

  const despesasPeriodo = despesas.filter(d => {
    const dt = new Date(d.data + 'T12:00:00')
    return dt >= inicio && dt <= fim && d.pago
  })
  const totalDespesas = despesasPeriodo.reduce((acc, d) => acc + Number(d.valor), 0)

  const funcionariosAtivos = funcionarios.filter(f => f.ativo !== false)
  const totalSalarios = funcionariosAtivos.reduce((acc, f) => acc + Number(f.salario || 0), 0)
  let salarioProporcional = totalSalarios
  if (periodo === 'hoje') {
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    salarioProporcional = totalSalarios / diasNoMes
  } else if (periodo === 'semana') {
    const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    salarioProporcional = (totalSalarios / diasNoMes) * 7
  }

  const lucroLiquido = totalReceitas - totalDespesas - (periodo === 'mes' ? totalSalarios : salarioProporcional)

  const porForma = pedidosPagos.reduce((acc, p) => {
    acc[p.pagamento] = (acc[p.pagamento] || 0) + Number(p.total)
    return acc
  }, {})

  const pedidosPendentes = pedidos.filter(p =>
    (p.statusPagamento === 'pendente' || p.statusPagamento === 'mensalista') && p.status !== 'cancelado'
  )
  const totalPendente = pedidosPendentes.reduce((acc, p) => acc + Number(p.total), 0)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const pedidosHojeEntregues = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === hoje.getTime() && p.status === 'entregue' && p.motoboy
  })
  const porMotoboy = pedidosHojeEntregues.reduce((acc, p) => {
    const key = p.motoboy
    if (!acc[key]) acc[key] = { entregas: 0, valor: 0 }
    acc[key].entregas++
    acc[key].valor += Number(p.total)
    return acc
  }, {})

  // Clientes fiado com débito pendente
  const pedidosFiado = pedidos.filter(p =>
    p.statusPagamento === 'mensalista' && p.status !== 'cancelado'
  )
  const fiadoPorCliente = pedidosFiado.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) {
      const reg = clientes.find(c => c.id === p.clienteId)
      acc[key] = {
        nome: p.clienteNome, clienteId: p.clienteId,
        tipo: reg?.tipo || (p.pagamento === 'Semanal' ? 'semanal' : p.pagamento === 'Quinzenal' ? 'quinzenal' : 'mensalista'),
        total: 0, pedidos: [],
      }
    }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    return acc
  }, {})
  const fiadoLista = Object.values(fiadoPorCliente).sort((a, b) => b.total - a.total)
  const totalFiado = fiadoLista.reduce((a, c) => a + c.total, 0)

  // Itens vendidos
  const contagemItens = pedidosPeriodo.reduce((acc, p) => {
    ;(p.itens || []).forEach(item => {
      if (item.tipo === 'marmitex') {
        const key = item.opcaoId === 1 ? 'op1' : item.opcaoId === 2 ? 'op2' : 'op1'
        acc[key] = (acc[key] || 0) + (item.qtd || 1)
        acc.marmitex = (acc.marmitex || 0) + (item.qtd || 1)
        acc[`nome_${key}`] = item.nome || (item.opcaoId === 1 ? 'Opção 1' : 'Opção 2')
      } else if (item.tipo === 'refrigerante') {
        acc.refrigerante = (acc.refrigerante || 0) + (item.qtd || 1)
      } else if (item.tipo === 'salada') {
        acc.salada = (acc.salada || 0) + (item.qtd || 1)
      } else if (item.tipo === 'combo') {
        acc.combo = (acc.combo || 0) + (item.qtd || 1)
      }
    })
    return acc
  }, {})

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {/* Botão Caderneta */}
        <button
          onClick={() => setMostrarCaderneta(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: fiadoLista.length > 0 ? '#FEF2F2' : '#fff',
            border: fiadoLista.length > 0 ? '1.5px solid #FECACA' : '1.5px solid #E6DDD5',
            color: fiadoLista.length > 0 ? '#991B1B' : '#6B5A4E',
            borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
          <HandCoins size={15} />
          Caderneta
          {fiadoLista.length > 0 && (
            <span style={{ background: '#C8221A', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
              {fiadoLista.length}
            </span>
          )}
        </button>
      </div>

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['hoje', 'Hoje'], ['semana', 'Esta semana'], ['mes', 'Este mês'], ['custom', 'Personalizado']].map(([key, label]) => (
          <button key={key} onClick={() => setPeriodo(key)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: periodo === key ? '#C8221A' : '#fff',
              color: periodo === key ? '#fff' : '#6B5A4E',
              border: periodo === key ? 'none' : '1.5px solid #E6DDD5',
            }}>
            {label}
          </button>
        ))}
        {periodo === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <input type="date" value={dataCustom.inicio}
              onChange={e => setDataCustom(prev => ({ ...prev, inicio: e.target.value }))}
              style={INPUT_BASE} />
            <span style={{ fontSize: 12, color: '#9D8878' }}>até</span>
            <input type="date" value={dataCustom.fim}
              onChange={e => setDataCustom(prev => ({ ...prev, fim: e.target.value }))}
              style={INPUT_BASE} />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        <div style={{ background: 'linear-gradient(135deg, #C8221A 0%, #7F1D1D 100%)', borderRadius: 12, padding: 16, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, opacity: 0.8 }}>
            <TrendingUp size={13} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Receitas</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>R$ {totalReceitas.toFixed(2).replace('.', ',')}</p>
          <p style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>{pedidosPagos.length} pedido(s)</p>
        </div>
        <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, color: '#9D8878' }}>
            <TrendingUp size={13} style={{ transform: 'rotate(180deg)' }} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Despesas</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#C8221A', margin: 0 }}>R$ {totalDespesas.toFixed(2).replace('.', ',')}</p>
          <p style={{ fontSize: 11, color: '#9D8878', marginTop: 3 }}>{despesasPeriodo.length} lançamento(s)</p>
        </div>
        <div style={{ background: lucroLiquido >= 0 ? '#F0FDF4' : '#FEF2F2', border: lucroLiquido >= 0 ? '1.5px solid #BBF7D0' : '1.5px solid #FECACA', borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D8878' }}>Lucro Líquido</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: lucroLiquido >= 0 ? '#15803D' : '#991B1B', margin: 0 }}>
            R$ {Math.abs(lucroLiquido).toFixed(2).replace('.', ',')}
          </p>
          <p style={{ fontSize: 11, color: lucroLiquido >= 0 ? '#16A34A' : '#C8221A', marginTop: 3 }}>
            {lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
          </p>
        </div>
        <div style={{ background: totalPendente > 0 ? '#FFFBEB' : '#fff', border: totalPendente > 0 ? '1.5px solid #FDE68A' : '1.5px solid #E6DDD5', borderRadius: 12, padding: 16, cursor: totalPendente > 0 ? 'pointer' : 'default' }}
          onClick={() => totalPendente > 0 && setMostrarCaderneta(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <AlertCircle size={13} style={{ color: totalPendente > 0 ? '#CA8A04' : '#9D8878' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D8878' }}>A Receber</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: totalPendente > 0 ? '#92400E' : '#1A0E08', margin: 0 }}>
            R$ {totalFiado.toFixed(2).replace('.', ',')}
          </p>
          <p style={{ fontSize: 11, color: '#9D8878', marginTop: 3 }}>{fiadoLista.length} cliente(s)</p>
        </div>
      </div>

      {/* Itens Vendidos */}
      {contagemItens.marmitex > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={13} /> Itens Vendidos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {contagemItens.op1 > 0 && (
              <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#EA580C', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>🍱 {contagemItens.nome_op1 || 'Opção 1'}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#C2410C', margin: 0, lineHeight: 1 }}>{contagemItens.op1}</p>
              </div>
            )}
            {contagemItens.op2 > 0 && (
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#B45309', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>🍱 {contagemItens.nome_op2 || 'Opção 2'}</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#92400E', margin: 0, lineHeight: 1 }}>{contagemItens.op2}</p>
              </div>
            )}
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: '#C8221A', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>🍱 Total</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#991B1B', margin: 0, lineHeight: 1 }}>{contagemItens.marmitex || 0}</p>
            </div>
            {contagemItens.refrigerante > 0 && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>🥤 Bebidas</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#1D4ED8', margin: 0, lineHeight: 1 }}>{contagemItens.refrigerante}</p>
              </div>
            )}
            {contagemItens.salada > 0 && (
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>🥗 Saladas</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#15803D', margin: 0, lineHeight: 1 }}>{contagemItens.salada}</p>
              </div>
            )}
            {contagemItens.combo > 0 && (
              <div style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>📦 Combos</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#6D28D9', margin: 0, lineHeight: 1 }}>{contagemItens.combo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Por Forma de Pagamento */}
      {Object.keys(porForma).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12 }}>
            Por Forma de Pagamento
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => {
              const Icon = ICONE_PAGAMENTO[forma] || CreditCard
              const percent = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0
              const cor = COR_PAGAMENTO[forma] || { bg: '#6B7280', light: '#F9FAFB', border: '#E5E7EB', text: '#111827' }
              return (
                <div key={forma} style={{ background: cor.light, border: `1.5px solid ${cor.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ background: cor.bg, borderRadius: 7, padding: 5, display: 'flex', alignItems: 'center' }}>
                      <Icon size={13} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: cor.text }}>{forma}</span>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: cor.text, margin: 0 }}>R$ {valor.toFixed(2).replace('.', ',')}</p>
                  <div style={{ marginTop: 6, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: cor.bg, borderRadius: 10, width: `${percent}%` }} />
                  </div>
                  <p style={{ fontSize: 10, color: cor.text, opacity: 0.6, marginTop: 3 }}>{percent.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motoboys hoje */}
      {Object.keys(porMotoboy).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bike size={13} /> Motoboys Hoje
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(porMotoboy).map(([nome, info]) => (
              <div key={nome} style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 7, padding: 6, display: 'flex' }}>
                    <Bike size={14} style={{ color: '#2563EB' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#1A0E08', fontSize: 13 }}>{nome}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12, color: '#9D8878' }}>{info.entregas} entrega(s)</span>
                  <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 13 }}>R$ {info.valor.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fechamento mensal */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12 }}>
          Fechamento do Mês
        </h2>
        <FechamentoMensal pedidos={pedidos} despesas={despesas} funcionarios={funcionariosAtivos} />
      </div>

      {/* Painel Caderneta (fullscreen overlay) */}
      {mostrarCaderneta && (
        <CadernetaPanel
          pedidos={pedidos}
          clientes={clientes}
          debitoPendente={debitoPendente}
          quitarPedido={quitarPedido}
          onFechar={() => setMostrarCaderneta(false)}
        />
      )}
    </div>
  )
}

function CadernetaPanel({ pedidos, clientes, debitoPendente, quitarPedido, onFechar }) {
  const [mesCaderneta, setMesCaderneta] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [busca, setBusca] = useState('')

  // Ontem e hoje (para destacar)
  const agora = new Date()
  agora.setHours(0, 0, 0, 0)
  const ontem = new Date(agora)
  ontem.setDate(ontem.getDate() - 1)

  function isRecenteFiado(pedido) {
    const d = new Date(pedido.criadoEm)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === agora.getTime() || d.getTime() === ontem.getTime()
  }

  // Clientes com qualquer pedido mensalista pendente (todo histórico)
  const pedidosFiado = pedidos.filter(p =>
    p.statusPagamento === 'mensalista' && p.status !== 'cancelado'
  )
  const fiadoPorCliente = pedidosFiado.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) {
      const reg = clientes.find(c => c.id === p.clienteId)
      acc[key] = {
        nome: p.clienteNome, clienteId: p.clienteId,
        tipo: reg?.tipo || (p.pagamento === 'Semanal' ? 'semanal' : p.pagamento === 'Quinzenal' ? 'quinzenal' : 'mensalista'),
        total: 0, pedidos: [],
        temRecente: false,
      }
    }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    if (isRecenteFiado(p)) acc[key].temRecente = true
    return acc
  }, {})

  // Pedidos mensalistas de ontem+hoje (independente de quitação)
  const pedidosRecentesFiado = pedidos.filter(p =>
    isRecenteFiado(p) &&
    (p.statusPagamento === 'mensalista' || ['Mensalista', 'Semanal', 'Quinzenal'].includes(p.pagamento)) &&
    p.status !== 'cancelado'
  )
  const clientesRecentesNovos = pedidosRecentesFiado.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) {
      const reg = clientes.find(c => c.id === p.clienteId)
      acc[key] = {
        nome: p.clienteNome, clienteId: p.clienteId,
        tipo: reg?.tipo || (p.pagamento === 'Semanal' ? 'semanal' : p.pagamento === 'Quinzenal' ? 'quinzenal' : 'mensalista'),
        pedidos: [], total: 0,
      }
    }
    acc[key].pedidos.push(p)
    acc[key].total += Number(p.total)
    return acc
  }, {})
  const clientesRecentesLista = Object.values(clientesRecentesNovos).sort((a, b) => a.nome.localeCompare(b.nome))

  // Caderneta do mês
  const [anoMes, mesMes] = mesCaderneta.split('-').map(Number)
  const inicioCaderneta = new Date(anoMes, mesMes - 1, 1, 0, 0, 0)
  const fimCaderneta = new Date(anoMes, mesMes, 0, 23, 59, 59)
  const pedidosCaderneta = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    return d >= inicioCaderneta && d <= fimCaderneta &&
      p.status !== 'cancelado' &&
      (p.statusPagamento === 'mensalista' || ['Mensalista', 'Semanal', 'Quinzenal'].includes(p.pagamento))
  })
  const caderneta = pedidosCaderneta.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) {
      const reg = clientes.find(c => c.id === p.clienteId)
      acc[key] = {
        nome: p.clienteNome, clienteId: p.clienteId,
        tipo: reg?.tipo || (p.pagamento === 'Semanal' ? 'semanal' : p.pagamento === 'Quinzenal' ? 'quinzenal' : 'mensalista'),
        pedidos: [], totalMes: 0,
        debitoAtual: debitoPendente(p.clienteId || p.clienteNome),
      }
    }
    acc[key].pedidos.push(p)
    acc[key].totalMes += Number(p.total)
    return acc
  }, {})
  const cadernetaLista = Object.values(caderneta)
    .filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.debitoAtual - a.debitoAtual)

  const totalDebitoGeral = Object.values(fiadoPorCliente).reduce((a, c) => a + c.total, 0)
  const qtdClientesDebito = Object.keys(fiadoPorCliente).length

  const badge = (tipo) => ({ mensalista: { bg: '#EA580C', label: 'Mensalista' }, semanal: { bg: '#2563EB', label: 'Semanal' }, quinzenal: { bg: '#7C3AED', label: 'Quinzenal' } }[tipo] || { bg: '#EA580C', label: 'Fiado' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: '#F9F6F3', width: '100%', maxWidth: 780, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header do painel */}
        <div style={{ background: '#1A0E08', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              📒 Caderneta de Débitos
            </p>
            <p style={{ fontSize: 12, color: '#9D8878', margin: '2px 0 0' }}>
              {qtdClientesDebito} cliente(s) — Total a receber: R$ {totalDebitoGeral.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <button onClick={onFechar} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ✕ Fechar
          </button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          {/* Resumo rápido */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#fff', border: '1.5px solid #FECACA', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: '#9D8878', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Total em Débito</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#991B1B', margin: 0 }}>R$ {totalDebitoGeral.toFixed(2).replace('.', ',')}</p>
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: '#9D8878', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Clientes</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#1A0E08', margin: 0 }}>{qtdClientesDebito}</p>
            </div>
            <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: '#9D8878', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Pendentes ontem/hoje</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#EA580C', margin: 0 }}>{clientesRecentesLista.length}</p>
            </div>
          </div>

          {/* Recentes — ontem e hoje */}
          {clientesRecentesLista.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} style={{ color: '#EA580C' }} /> Lançamentos de Ontem e Hoje
              </h3>
              <div style={{ background: '#fff', border: '1.5px solid #FED7AA', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, padding: '8px 16px', background: '#FFF7ED', fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                  <span>Cliente</span><span>Tipo</span><span>Pedidos</span><span style={{ textAlign: 'right' }}>Valor</span>
                </div>
                {clientesRecentesLista.map((c, i) => {
                  const bd = badge(c.tipo)
                  return (
                    <div key={c.clienteId || c.nome + i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, padding: '10px 16px', borderTop: '1px solid #FEF3C7', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1A0E08', fontSize: 13 }}>{c.nome}</span>
                      <span style={{ fontSize: 11, background: bd.bg, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>{bd.label}</span>
                      <span style={{ fontSize: 12, color: '#6B5A4E', textAlign: 'center' }}>{c.pedidos.length}x</span>
                      <span style={{ fontWeight: 700, color: '#EA580C', fontSize: 13, textAlign: 'right' }}>R$ {c.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Caderneta do mês */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', margin: 0 }}>
                Caderneta Mensal
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="month" value={mesCaderneta} onChange={e => setMesCaderneta(e.target.value)}
                  style={{ border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08', background: '#fff' }} />
                <input type="text" placeholder="🔍 Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08', width: 160, background: '#fff' }} />
              </div>
            </div>
            {cadernetaLista.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9D8878', fontSize: 13 }}>
                Nenhum lançamento fiado no período
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cadernetaLista.map((c, idx) => (
                  <CadernetaCard key={c.clienteId || c.nome + idx} cliente={c} mes={mesCaderneta} onQuitar={quitarPedido} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CadernetaCard({ cliente, mes, onQuitar }) {
  const [aberto, setAberto] = useState(false)
  const [formaPagto, setFormaPagto] = useState('Dinheiro')
  const [, forceUpdate] = useState(0)
  const badge = { mensalista: { bg: '#EA580C', label: 'Mensalista' }, semanal: { bg: '#2563EB', label: 'Semanal' }, quinzenal: { bg: '#7C3AED', label: 'Quinzenal' } }[cliente.tipo] || { bg: '#EA580C', label: 'Fiado' }

  const pedidosOrdenados = [...cliente.pedidos].sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
  const qtdMarmitex = cliente.pedidos.reduce((acc, p) => acc + (p.itens || []).filter(i => i.tipo === 'marmitex').reduce((s, i) => s + (i.qtd || 1), 0), 0)
  const pendentes = cliente.pedidos.filter(p => p.statusPagamento === 'mensalista').length
  const [anoMes, mesMes] = mes.split('-').map(Number)
  const nomeMes = new Date(anoMes, mesMes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ background: '#fff', border: cliente.debitoAtual > 0 ? '1.5px solid #FECACA' : '1.5px solid #E6DDD5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }} onClick={() => setAberto(!aberto)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontWeight: 700, color: '#1A0E08', fontSize: 15, margin: 0 }}>{cliente.nome}</p>
            <span style={{ fontSize: 11, background: badge.bg, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{badge.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#9D8878' }}>🍱 {qtdMarmitex} marmitex em {nomeMes}</span>
            <span style={{ fontSize: 11, color: '#9D8878' }}>{cliente.pedidos.length} pedido(s)</span>
            {pendentes > 0 && <span style={{ fontSize: 11, color: '#C8221A', fontWeight: 700 }}>⏳ {pendentes} pendente(s)</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginLeft: 12 }}>
          <span style={{ fontSize: 12, color: '#9D8878' }}>Mês: R$ {cliente.totalMes.toFixed(2).replace('.', ',')}</span>
          {cliente.debitoAtual > 0 && (
            <span style={{ fontSize: 14, fontWeight: 800, color: '#C8221A' }}>Deve: R$ {cliente.debitoAtual.toFixed(2).replace('.', ',')}</span>
          )}
          {cliente.debitoAtual === 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>✓ Quitado</span>}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: '1px solid #F3F0ED' }}>
          {/* Quitar tudo */}
          {cliente.debitoAtual > 0 && (
            <div style={{ padding: '10px 16px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Quitar todos os pendentes</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)}
                  style={{ border: '1.5px solid #CFC4BB', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', background: '#fff', color: '#1A0E08', fontFamily: 'Inter, sans-serif' }}>
                  {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(f => <option key={f}>{f}</option>)}
                </select>
                <button
                  onClick={() => { cliente.pedidos.filter(p => p.statusPagamento === 'mensalista').forEach(p => onQuitar(p.id, formaPagto)); forceUpdate(n => n + 1) }}
                  style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Quitar Tudo
                </button>
              </div>
            </div>
          )}
          {/* Tabela de pedidos por dia */}
          <div style={{ padding: '0 0 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto 80px', gap: 8, padding: '8px 16px', background: '#FAFAF8', fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase' }}>
              <span>Dia</span><span>Pedido</span><span style={{ textAlign: 'right' }}>Valor</span><span style={{ textAlign: 'center' }}>Status</span>
            </div>
            {pedidosOrdenados.map((p, i) => {
              const marmitexP = p.itens.filter(i => i.tipo === 'marmitex' && i.tamanho === 'P')
              const marmitexG = p.itens.filter(i => i.tipo === 'marmitex' && i.tamanho === 'G')
              const isPendente = p.statusPagamento === 'mensalista'
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto 80px', gap: 8, padding: '10px 16px', borderTop: '1px solid #F3F0ED', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
                      {new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p style={{ fontSize: 11, color: '#9D8878', margin: 0 }}>
                      {new Date(p.criadoEm).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                  </div>
                  <div>
                    {marmitexP.length > 0 && <p style={{ fontSize: 12, color: '#1A0E08', margin: '0 0 2px' }}>🍱 {marmitexP.length}x P {marmitexP[0]?.nome || ''}</p>}
                    {marmitexG.length > 0 && <p style={{ fontSize: 12, color: '#1A0E08', margin: '0 0 2px' }}>🍱 {marmitexG.length}x G {marmitexG[0]?.nome || ''}</p>}
                    {marmitexP.length === 0 && marmitexG.length === 0 && <p style={{ fontSize: 12, color: '#9D8878', margin: 0, fontStyle: 'italic' }}>—</p>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A0E08', textAlign: 'right' }}>R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isPendente ? (
                      <button
                        onClick={() => { onQuitar(p.id, formaPagto); forceUpdate(n => n + 1) }}
                        style={{ background: '#EA580C', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Quitar
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>✓ Pago</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FechamentoMensal({ pedidos, despesas, funcionarios }) {
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59)

  const pedidosMes = pedidos.filter(p => {
    const d = new Date(p.criadoEm)
    return d >= inicioMes && d <= fimMes && p.status !== 'cancelado'
  })

  const receitasMes = pedidosMes
    .filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista'))
    .reduce((acc, p) => acc + Number(p.total), 0)

  const despesasMes = despesas
    .filter(d => {
      const dt = new Date(d.data + 'T12:00:00')
      return dt >= inicioMes && dt <= fimMes && d.pago
    })
    .reduce((acc, d) => acc + Number(d.valor), 0)

  const salarios = funcionarios.reduce((acc, f) => acc + Number(f.salario || 0), 0)
  const lucro = receitasMes - despesasMes - salarios
  const positivo = lucro >= 0

  return (
    <div style={{
      background: positivo ? '#F0FDF4' : '#FEF2F2',
      border: positivo ? '1.5px solid #BBF7D0' : '1.5px solid #FECACA',
      borderRadius: 14, padding: 22,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Receitas totais</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#15803D', margin: 0 }}>R$ {receitasMes.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Despesas operacionais</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#C8221A', margin: 0 }}>R$ {despesasMes.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Salários</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#CA8A04', margin: 0 }}>R$ {salarios.toFixed(2).replace('.', ',')}</p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Resultado</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: positivo ? '#14532D' : '#7F1D1D', margin: 0 }}>
            {positivo ? '+' : '-'} R$ {Math.abs(lucro).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
      <div style={{
        textAlign: 'center', padding: '10px 0', borderRadius: 10, fontWeight: 700, fontSize: 13,
        background: positivo ? '#BBF7D0' : '#FECACA',
        color: positivo ? '#14532D' : '#7F1D1D',
      }}>
        {positivo ? 'Mês com LUCRO' : 'Mês com PREJUÍZO'}
      </div>
    </div>
  )
}

function imprimirExtrato(cliente, inicio, fim) {
  const periodoStr = inicio.toLocaleDateString('pt-BR') === fim.toLocaleDateString('pt-BR')
    ? inicio.toLocaleDateString('pt-BR')
    : `${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`

  const linhasPedidos = cliente.pedidos
    .slice()
    .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
    .map((p, i) => {
      const data = new Date(p.criadoEm).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
      const hora = new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const itens = (p.itens || []).filter(it => it.tipo === 'marmitex' || it.tipo === 'combo' || it.tipo === 'refrigerante' || it.tipo === 'salada')
      const descItens = itens.map(it => {
        if (it.tipo === 'marmitex') return `${it.tamanho || ''} ${it.nome || ''}${it.proteina ? ' — ' + it.proteina : ''}`.trim()
        if (it.tipo === 'salada') return 'Salada personalizada'
        if (it.tipo === 'refrigerante') return `${it.qtd || 1}x ${it.nome} (${it.subtipo || ''})`
        return it.nome || ''
      }).join(', ') || '—'
      return `<tr>
        <td>${i + 1}</td>
        <td>${data} ${hora}</td>
        <td>${descItens}</td>
        <td style="text-align:right;font-weight:bold">R$ ${Number(p.total).toFixed(2).replace('.', ',')}</td>
      </tr>`
    }).join('')

  const tipoBadge = { mensalista: 'MENSALISTA', semanal: 'SEMANAL', quinzenal: 'QUINZENAL' }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Extrato — ${cliente.nome}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; max-width: 600px; margin: 0 auto; padding: 20px; }
  .restaurante { text-align:center; font-size:18px; font-weight:bold; margin-bottom:4px; }
  .subtitulo { text-align:center; font-size:11px; letter-spacing:2px; margin-bottom:16px; }
  .linha { border-top:1px dashed #000; margin:10px 0; }
  .cliente-nome { font-size:17px; font-weight:bold; margin-bottom:4px; }
  .badge { display:inline-block; font-size:10px; font-weight:bold; background:#000; color:#fff; padding:2px 8px; border-radius:4px; margin-bottom:4px; }
  .periodo { font-size:12px; color:#555; margin-bottom:12px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { font-size:10px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #000; padding:6px 4px; text-align:left; }
  td { padding:7px 4px; border-bottom:1px solid #ddd; font-size:12px; vertical-align:top; }
  tr:nth-child(even) td { background:#f9f9f9; }
  .total-row td { border-top:2px solid #000; border-bottom:none; font-size:15px; font-weight:bold; padding-top:10px; }
  .rodape { text-align:center; font-size:11px; margin-top:20px; color:#555; }
  @media print { body { padding:10px; } }
</style></head><body>
  <div class="restaurante">Fogão a Lenha da Leninha</div>
  <div class="subtitulo">— EXTRATO DE CONTA —</div>
  <div class="linha"></div>
  <div class="cliente-nome">${cliente.nome}</div>
  <span class="badge">${tipoBadge[cliente.tipo] || 'FIADO'}</span>
  <div class="periodo">Período: ${periodoStr}</div>
  <table>
    <thead><tr><th>#</th><th>Data / Hora</th><th>Pedido</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${linhasPedidos}</tbody>
    <tfoot><tr class="total-row"><td colspan="3">TOTAL DO PERÍODO</td><td style="text-align:right">R$ ${cliente.total.toFixed(2).replace('.', ',')}</td></tr></tfoot>
  </table>
  <div class="linha"></div>
  <div class="rodape">Emitido em ${new Date().toLocaleDateString('pt-BR')} — Fogão a Lenha da Leninha</div>
</body></html>`

  const w = window.open('', '_blank', 'width=680,height=800')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}

function ExtratoCard({ cliente, inicio, fim }) {
  const [aberto, setAberto] = useState(false)
  const badge = BADGE_FIADO[cliente.tipo] || BADGE_FIADO.mensalista
  const pedidosOrdenados = [...cliente.pedidos].sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))

  return (
    <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setAberto(!aberto)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#1A0E08', fontSize: 15, margin: '0 0 3px' }}>{cliente.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, background: badge.bg, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{badge.label}</span>
              <span style={{ fontSize: 11, color: '#9D8878' }}>{cliente.pedidos.length} pedido(s)</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, color: '#1A0E08', fontSize: 15 }}>R$ {cliente.total.toFixed(2).replace('.', ',')}</span>
          <button
            onClick={e => { e.stopPropagation(); imprimirExtrato(cliente, inicio, fim) }}
            title="Imprimir extrato"
            style={{ background: '#C8221A', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
            <Printer size={13} /> Imprimir
          </button>
          {aberto ? <ChevronUp size={15} color="#9D8878" /> : <ChevronDown size={15} color="#9D8878" />}
        </div>
      </div>

      {/* Tabela de pedidos */}
      {aberto && (
        <div style={{ borderTop: '1px solid #F3F0ED' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8, padding: '8px 16px', background: '#FAFAF8', fontSize: 11, fontWeight: 700, color: '#9D8878', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Data</span>
            <span>Itens</span>
            <span>Valor</span>
          </div>
          {pedidosOrdenados.map((p, i) => {
            const itensMarmitex = (p.itens || []).filter(it => it.tipo === 'marmitex')
            const itensExtras = (p.itens || []).filter(it => it.tipo === 'salada' || it.tipo === 'refrigerante' || it.tipo === 'combo')
            return (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8, padding: '10px 16px', borderTop: i > 0 ? '1px solid #F3F0ED' : 'none', alignItems: 'start' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
                    {new Date(p.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </p>
                  <p style={{ fontSize: 11, color: '#9D8878', margin: 0 }}>
                    {new Date(p.criadoEm).toLocaleDateString('pt-BR', { weekday: 'short' })} · {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  {itensMarmitex.map((it, j) => (
                    <p key={j} style={{ fontSize: 12, color: '#1A0E08', margin: '0 0 2px' }}>
                      🍱 <strong>{it.tamanho}</strong> {it.nome}{it.proteina ? <span style={{ color: '#6B5A4E' }}> — {it.proteina}</span> : null}
                    </p>
                  ))}
                  {itensExtras.map((it, j) => (
                    <p key={j} style={{ fontSize: 11, color: '#6B5A4E', margin: '0 0 2px' }}>
                      {it.tipo === 'salada' ? '🥗 Salada' : it.tipo === 'refrigerante' ? `🥤 ${it.qtd || 1}x ${it.nome}` : `📦 ${it.nome}`}
                    </p>
                  ))}
                  {itensMarmitex.length === 0 && itensExtras.length === 0 && (
                    <p style={{ fontSize: 12, color: '#9D8878', margin: 0, fontStyle: 'italic' }}>—</p>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A0E08', whiteSpace: 'nowrap' }}>
                  R$ {Number(p.total).toFixed(2).replace('.', ',')}
                </span>
              </div>
            )
          })}
          {/* Total */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8, padding: '10px 16px', borderTop: '2px solid #E6DDD5', background: '#FAFAF8' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9D8878', gridColumn: '1/3' }}>TOTAL DO PERÍODO</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#C8221A' }}>R$ {cliente.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

const BADGE_FIADO = {
  mensalista: { bg: '#EA580C', label: 'Mensalista' },
  semanal:    { bg: '#2563EB', label: 'Semanal' },
  quinzenal:  { bg: '#7C3AED', label: 'Quinzenal' },
}

function FiadoClienteCard({ cliente, onQuitar }) {
  const [aberto, setAberto] = useState(false)
  const [formaPagto, setFormaPagto] = useState('Dinheiro')
  const [, forceUpdate] = useState(0)
  const badge = BADGE_FIADO[cliente.tipo] || BADGE_FIADO.mensalista

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #FED7AA',
      borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setAberto(!aberto)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <p style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14, margin: '0 0 4px' }}>{cliente.nome}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, background: badge.bg, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {badge.label}
              </span>
              <span style={{ fontSize: 11, color: '#9D8878' }}>{cliente.pedidos.length} pedido(s)</span>
              {cliente.precoMarmitexP && (
                <span style={{ fontSize: 11, color: '#6B5A4E' }}>P: R${Number(cliente.precoMarmitexP).toFixed(2).replace('.', ',')}</span>
              )}
              {cliente.precoMarmitexG && (
                <span style={{ fontSize: 11, color: '#6B5A4E' }}>G: R${Number(cliente.precoMarmitexG).toFixed(2).replace('.', ',')}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: '#7C2D12', fontSize: 15 }}>R$ {cliente.total.toFixed(2).replace('.', ',')}</span>
          {aberto ? <ChevronUp size={15} color="#9D8878" /> : <ChevronDown size={15} color="#9D8878" />}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: '1px solid #FEF3C7' }}>
          {/* Quitar tudo de uma vez */}
          <div style={{ padding: '10px 16px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Quitar todos os pedidos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)}
                style={{ border: '1.5px solid #CFC4BB', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', background: '#fff', color: '#1A0E08', fontFamily: 'Inter, sans-serif' }}>
                {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(f => <option key={f}>{f}</option>)}
              </select>
              <button
                onClick={() => { cliente.pedidos.forEach(p => onQuitar(p.id, formaPagto)); forceUpdate(n => n + 1) }}
                style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Quitar Tudo
              </button>
            </div>
          </div>

          {/* Lista de pedidos individuais */}
          {cliente.pedidos.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #FEF3C7' }}>
              <div>
                <p style={{ fontSize: 13, color: '#1A0E08', margin: '0 0 2px', fontWeight: 600 }}>
                  {new Date(p.criadoEm).toLocaleDateString('pt-BR')}
                  <span style={{ fontWeight: 400, color: '#9D8878', marginLeft: 6 }}>
                    {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <p style={{ fontSize: 11, color: '#9D8878', margin: 0 }}>
                  {p.itens?.length || 0} item(s)
                  {p.itens?.some(i => i.tamanho === 'P') && ` · ${p.itens.filter(i => i.tamanho === 'P').length}P`}
                  {p.itens?.some(i => i.tamanho === 'G') && ` · ${p.itens.filter(i => i.tamanho === 'G').length}G`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A0E08' }}>R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
                <button
                  onClick={() => { onQuitar(p.id, formaPagto); forceUpdate(n => n + 1) }}
                  style={{ background: '#EA580C', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientePendenteCard({ cliente, onQuitar }) {
  const [aberto, setAberto] = useState(false)
  const [formaPagto, setFormaPagto] = useState('Dinheiro')
  const [, forceUpdate] = useState(0)

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #FDE68A',
      borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setAberto(!aberto)}>
        <div>
          <p style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14, margin: '0 0 2px' }}>{cliente.nome}</p>
          <p style={{ fontSize: 12, color: '#9D8878', margin: 0 }}>{cliente.pedidos.length} pedido(s) pendente(s)</p>
        </div>
        <span style={{ fontWeight: 700, color: '#92400E', fontSize: 15 }}>R$ {cliente.total.toFixed(2).replace('.', ',')}</span>
      </div>
      {aberto && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #FEF9C3' }}>
          {cliente.pedidos.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #FEF9C3' }}>
              <div>
                <p style={{ fontSize: 13, color: '#1A0E08', margin: '0 0 2px' }}>
                  {new Date(p.criadoEm).toLocaleDateString('pt-BR')} — {p.itens?.length} item(s)
                </p>
                <p style={{ fontSize: 11, color: '#9D8878', margin: 0 }}>
                  {new Date(p.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1A0E08' }}>R$ {Number(p.total).toFixed(2).replace('.', ',')}</span>
                <select value={formaPagto} onChange={e => setFormaPagto(e.target.value)}
                  style={{
                    border: '1.5px solid #CFC4BB', borderRadius: 6, padding: '5px 8px',
                    fontSize: 12, outline: 'none', background: '#fff', color: '#1A0E08',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                  {['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito'].map(f => <option key={f}>{f}</option>)}
                </select>
                <button
                  onClick={() => { onQuitar(p.id, formaPagto); forceUpdate(n => n + 1) }}
                  style={{
                    background: '#16A34A', color: '#fff', border: 'none',
                    borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
