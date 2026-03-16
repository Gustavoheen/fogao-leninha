import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart3, TrendingUp, ShoppingBag, AlertCircle, Banknote, Smartphone, CreditCard, CircleDollarSign, Bike, HandCoins, ChevronDown, ChevronUp } from 'lucide-react'

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
  const { pedidos, despesas, funcionarios, clientes, quitarPedido, debitoPendente, debitoFiado } = useApp()
  const [periodo, setPeriodo] = useState('hoje')
  const [dataCustom, setDataCustom] = useState({ inicio: '', fim: '' })

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

  const clientesComPendente = pedidosPendentes.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) acc[key] = { nome: p.clienteNome, total: 0, pedidos: [] }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    return acc
  }, {})

  // Pedidos fiado não quitados agrupados por cliente
  const pedidosFiado = pedidos.filter(p =>
    p.statusPagamento === 'mensalista' && p.status !== 'cancelado'
  )
  const fiadoPorCliente = pedidosFiado.reduce((acc, p) => {
    const key = p.clienteId || p.clienteNome
    if (!acc[key]) {
      const clienteReg = clientes.find(c => c.id === p.clienteId)
      acc[key] = {
        nome: p.clienteNome,
        clienteId: p.clienteId,
        tipo: clienteReg?.tipo || (p.pagamento === 'Semanal' ? 'semanal' : p.pagamento === 'Quinzenal' ? 'quinzenal' : 'mensalista'),
        precoMarmitexP: clienteReg?.precoMarmitexP || '',
        precoMarmitexG: clienteReg?.precoMarmitexG || '',
        total: 0,
        pedidos: [],
      }
    }
    acc[key].total += Number(p.total)
    acc[key].pedidos.push(p)
    return acc
  }, {})
  const fiadoLista = Object.values(fiadoPorCliente).sort((a, b) => b.total - a.total)
  const totalFiadoGeral = fiadoLista.reduce((acc, c) => acc + c.total, 0)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {/* Receitas */}
        <div style={{
          background: 'linear-gradient(135deg, #C8221A 0%, #7F1D1D 100%)',
          borderRadius: 14, padding: 18, boxShadow: '0 4px 16px rgba(200,34,26,0.3)',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, opacity: 0.85 }}>
            <TrendingUp size={14} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Receitas</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>R$ {totalReceitas.toFixed(2).replace('.', ',')}</p>
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{pedidosPagos.length} pedido(s)</p>
        </div>

        {/* Despesas */}
        <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#9D8878' }}>
            <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Despesas</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#C8221A', margin: 0 }}>R$ {totalDespesas.toFixed(2).replace('.', ',')}</p>
          <p style={{ fontSize: 11, color: '#9D8878', marginTop: 4 }}>{despesasPeriodo.length} lançamento(s)</p>
        </div>

        {/* Lucro Líquido */}
        <div style={{
          background: lucroLiquido >= 0 ? '#F0FDF4' : '#FEF2F2',
          border: lucroLiquido >= 0 ? '1.5px solid #BBF7D0' : '1.5px solid #FECACA',
          borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D8878' }}>Lucro Líquido</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: lucroLiquido >= 0 ? '#15803D' : '#991B1B', margin: 0 }}>
            R$ {Math.abs(lucroLiquido).toFixed(2).replace('.', ',')}
          </p>
          <p style={{ fontSize: 11, color: lucroLiquido >= 0 ? '#16A34A' : '#C8221A', marginTop: 4 }}>
            {lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}
          </p>
        </div>

        {/* Pendente */}
        <div style={{
          background: totalPendente > 0 ? '#FFFBEB' : '#fff',
          border: totalPendente > 0 ? '1.5px solid #FDE68A' : '1.5px solid #E6DDD5',
          borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <AlertCircle size={14} style={{ color: totalPendente > 0 ? '#CA8A04' : '#9D8878' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9D8878' }}>Pendente</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: totalPendente > 0 ? '#92400E' : '#1A0E08', margin: 0 }}>
            R$ {totalPendente.toFixed(2).replace('.', ',')}
          </p>
          <p style={{ fontSize: 11, color: '#9D8878', marginTop: 4 }}>{pedidosPendentes.length} pedido(s)</p>
        </div>
      </div>

      {/* Por forma de pagamento */}
      {Object.keys(porForma).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 14 }}>
            Por Forma de Pagamento
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => {
              const Icon = ICONE_PAGAMENTO[forma] || CreditCard
              const percent = totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0
              const cor = COR_PAGAMENTO[forma] || { bg: '#6B7280', light: '#F9FAFB', border: '#E5E7EB', text: '#111827' }
              return (
                <div key={forma} style={{
                  background: cor.light,
                  border: `1.5px solid ${cor.border}`,
                  borderRadius: 12, padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ background: cor.bg, borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: cor.text }}>{forma}</span>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: cor.text, margin: 0 }}>R$ {valor.toFixed(2).replace('.', ',')}</p>
                  <div style={{ marginTop: 8, height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: cor.bg, borderRadius: 10, width: `${percent}%` }} />
                  </div>
                  <p style={{ fontSize: 11, color: cor.text, opacity: 0.65, marginTop: 4 }}>{percent.toFixed(0)}% do total</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motoboys hoje */}
      {Object.keys(porMotoboy).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bike size={13} /> Motoboys Hoje
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(porMotoboy).map(([nome, info]) => (
              <div key={nome} style={{
                background: '#fff', border: '1.5px solid #E6DDD5',
                borderRadius: 12, padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 8, padding: 7, display: 'flex', alignItems: 'center' }}>
                    <Bike size={15} style={{ color: '#2563EB' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#1A0E08', fontSize: 14 }}>{nome}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#9D8878' }}>{info.entregas} entrega(s)</span>
                  <span style={{ fontWeight: 700, color: '#16A34A', fontSize: 14 }}>R$ {info.valor.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagamentos pendentes */}
      {Object.keys(clientesComPendente).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={13} /> Pagamentos Pendentes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(clientesComPendente).map((c, idx) => (
              <ClientePendenteCard key={idx} cliente={c} onQuitar={quitarPedido} />
            ))}
          </div>
        </div>
      )}

      {/* Dinheiro a Receber (fiado) */}
      {fiadoLista.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HandCoins size={13} /> Dinheiro a Receber
            </h2>
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#7C2D12',
              background: '#FFF7ED', border: '1.5px solid #FED7AA',
              borderRadius: 20, padding: '4px 12px',
            }}>
              Total: R$ {totalFiadoGeral.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fiadoLista.map((c, idx) => (
              <FiadoClienteCard key={c.clienteId || c.nome + idx} cliente={c} onQuitar={quitarPedido} />
            ))}
          </div>
        </div>
      )}

      {/* Fechamento mensal */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 14 }}>
          Fechamento do Mês
        </h2>
        <FechamentoMensal pedidos={pedidos} despesas={despesas} funcionarios={funcionariosAtivos} />
      </div>
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
