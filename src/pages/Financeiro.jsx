import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { TrendingUp, Plus, X, Check, Pencil, Wallet, Building2, Users, ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORIAS_DESPESA = ['Compras/Ingredientes', 'Combustível', 'Embalagens', 'Manutenção', 'Salários', 'Outros']

const CATEGORIA_COR = {
  'Compras/Ingredientes': { bg: '#16A34A', color: '#fff' },
  'Combustível': { bg: '#2563EB', color: '#fff' },
  'Embalagens': { bg: '#7C3AED', color: '#fff' },
  'Manutenção': { bg: '#EA580C', color: '#fff' },
  'Salários': { bg: '#4338CA', color: '#fff' },
  'Outros': { bg: '#6B7280', color: '#fff' },
}

const FORM_VAZIO = {
  categoria: 'Compras/Ingredientes',
  descricao: '',
  valor: '',
  data: new Date().toISOString().split('T')[0],
  pago: true,
}

const SALDOS_VAZIO = { conta: '', dinheiro: '', reserva: '' }

const INPUT_BASE = {
  background: '#fff',
  border: '1.5px solid #CFC4BB',
  borderRadius: 8,
  padding: '14px 16px',
  fontSize: 16,
  width: '100%',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  color: '#1A0E08',
  boxSizing: 'border-box',
}

function fmt(v) { return Number(v || 0).toFixed(2).replace('.', ',') }

function getWeekNumber(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  const year = mon.getFullYear()
  const start = new Date(year, 0, 1)
  const week = Math.ceil(((mon - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function getMonthKey(dateStr) { return dateStr.slice(0, 7) }

function calcReceita(pedido) {
  const p = pedido
  if (p.statusPagamento === 'pago') return Number(p.total)
  if (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista') return Number(p.total)
  return 0
}

export default function Financeiro() {
  const { despesas, adicionarDespesa, editarDespesa, removerDespesa, pagarDespesa, pedidos } = useApp()
  const [aba, setAba] = useState('despesas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [editandoId, setEditandoId] = useState(null)

  // Saldos — persistidos no localStorage
  const [saldos, setSaldos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fl_saldos') || 'null') || SALDOS_VAZIO } catch { return SALDOS_VAZIO }
  })
  const [editandoSaldo, setEditandoSaldo] = useState(null) // 'conta' | 'dinheiro' | 'reserva'
  const [inputSaldo, setInputSaldo] = useState('')

  // Fluxo de caixa
  const [periodoFluxo, setPeriodoFluxo] = useState('diario') // diario | semanal | mensal
  const [anoFluxo, setAnoFluxo] = useState(new Date().getFullYear())
  const [mesFluxo, setMesFluxo] = useState(new Date().getMonth() + 1) // 1-12

  function salvarSaldo(campo) {
    const novo = { ...saldos, [campo]: Number(inputSaldo) || 0 }
    setSaldos(novo)
    localStorage.setItem('fl_saldos', JSON.stringify(novo))
    setEditandoSaldo(null)
  }

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
    setForm({ categoria: d.categoria, descricao: d.descricao, valor: String(d.valor), data: d.data, pago: d.pago })
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

  const hoje = new Date().toISOString().split('T')[0]
  const pedidosHoje = pedidos.filter(p => p.criadoEm?.startsWith(hoje) && p.status !== 'cancelado')
  const receitasHoje = pedidosHoje.reduce((acc, p) => acc + calcReceita(p), 0)
  const despesasHoje = despesas.filter(d => d.data === hoje && d.pago).reduce((acc, d) => acc + Number(d.valor), 0)
  const liquidoHoje = receitasHoje - despesasHoje

  // ---- Fluxo de Caixa ----
  function buildFluxo() {
    if (periodoFluxo === 'diario') {
      // Dias do mês selecionado
      const diasNoMes = new Date(anoFluxo, mesFluxo, 0).getDate()
      return Array.from({ length: diasNoMes }, (_, i) => {
        const dia = String(i + 1).padStart(2, '0')
        const mes = String(mesFluxo).padStart(2, '0')
        const key = `${anoFluxo}-${mes}-${dia}`
        const rec = pedidos.filter(p => p.criadoEm?.startsWith(key) && p.status !== 'cancelado').reduce((a, p) => a + calcReceita(p), 0)
        const desp = despesas.filter(d => d.data === key && d.pago).reduce((a, d) => a + Number(d.valor), 0)
        return { label: `${dia}/${mes}`, key, rec, desp, liq: rec - desp }
      }).filter(d => d.rec > 0 || d.desp > 0)
    }

    if (periodoFluxo === 'semanal') {
      // Semanas do mês selecionado
      const diasNoMes = new Date(anoFluxo, mesFluxo, 0).getDate()
      const semanas = {}
      for (let i = 1; i <= diasNoMes; i++) {
        const dia = String(i).padStart(2, '0')
        const mes = String(mesFluxo).padStart(2, '0')
        const key = `${anoFluxo}-${mes}-${dia}`
        const wk = getWeekNumber(key)
        if (!semanas[wk]) semanas[wk] = { label: '', rec: 0, desp: 0, dias: [] }
        semanas[wk].dias.push(dia)
        semanas[wk].rec += pedidos.filter(p => p.criadoEm?.startsWith(key) && p.status !== 'cancelado').reduce((a, p) => a + calcReceita(p), 0)
        semanas[wk].desp += despesas.filter(d => d.data === key && d.pago).reduce((a, d) => a + Number(d.valor), 0)
      }
      return Object.entries(semanas).map(([wk, v]) => ({
        label: `${String(mesFluxo).padStart(2,'0')}/${v.dias[0]}–${v.dias[v.dias.length-1]}`,
        key: wk, rec: v.rec, desp: v.desp, liq: v.rec - v.desp,
      })).filter(d => d.rec > 0 || d.desp > 0)
    }

    if (periodoFluxo === 'mensal') {
      // Meses do ano selecionado
      return Array.from({ length: 12 }, (_, i) => {
        const mes = String(i + 1).padStart(2, '0')
        const prefix = `${anoFluxo}-${mes}`
        const rec = pedidos.filter(p => p.criadoEm?.startsWith(prefix) && p.status !== 'cancelado').reduce((a, p) => a + calcReceita(p), 0)
        const desp = despesas.filter(d => d.data?.startsWith(prefix) && d.pago).reduce((a, d) => a + Number(d.valor), 0)
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        return { label: meses[i], key: prefix, rec, desp, liq: rec - desp }
      }).filter(d => d.rec > 0 || d.desp > 0)
    }
    return []
  }

  const fluxoData = buildFluxo()
  const maxVal = Math.max(...fluxoData.map(d => Math.max(d.rec, d.desp)), 1)

  const totalRecFluxo = fluxoData.reduce((a, d) => a + d.rec, 0)
  const totalDespFluxo = fluxoData.reduce((a, d) => a + d.desp, 0)
  const totalLiqFluxo = totalRecFluxo - totalDespFluxo

  const MESES_NOME = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  function mesAnterior() {
    if (mesFluxo === 1) { setMesFluxo(12); setAnoFluxo(a => a - 1) }
    else setMesFluxo(m => m - 1)
  }
  function mesProximo() {
    if (mesFluxo === 12) { setMesFluxo(1); setAnoFluxo(a => a + 1) }
    else setMesFluxo(m => m + 1)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Financeiro
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            Despesas, saldos e fluxo de caixa
          </p>
        </div>
        {aba === 'despesas' && (
          <button
            onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#C8221A', color: '#fff',
              boxShadow: '0 2px 10px rgba(200,34,26,0.35)',
              borderRadius: 8, border: 'none',
              padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
            <Plus size={15} /> Nova Despesa
          </button>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {[['despesas', 'Despesas'], ['saldos', 'Saldos'], ['fluxo', 'Fluxo de Caixa']].map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            style={{
              padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: aba === key ? '#C8221A' : '#fff',
              color: aba === key ? '#fff' : '#6B5A4E',
              border: aba === key ? 'none' : '1.5px solid #E6DDD5',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ===== ABA DESPESAS ===== */}
      {aba === 'despesas' && (
        <div>
          {mostrarForm && (
            <div style={{
              background: '#fff', border: '1.5px solid #E6DDD5',
              borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              padding: 20, marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A0E08', marginTop: 0, marginBottom: 16 }}>
                {editandoId ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
                  Detalhes
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Categoria</label>
                    <select value={form.categoria} onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))} style={INPUT_BASE}>
                      {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Data</label>
                    <input type="date" value={form.data} onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))} style={INPUT_BASE} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Descrição</label>
                    <input type="text" value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} style={INPUT_BASE} placeholder="Ex: Compra de frango..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Valor (R$)</label>
                    <input type="number" min="0" step="0.01" value={form.valor} onChange={e => setForm(prev => ({ ...prev, valor: e.target.value }))} style={INPUT_BASE} placeholder="0,00" />
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setForm(prev => ({ ...prev, pago: !prev.pago }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: form.pago ? '#16A34A' : '#fff',
                    color: form.pago ? '#fff' : '#6B5A4E',
                    border: form.pago ? 'none' : '1.5px solid #CFC4BB',
                  }}>
                  {form.pago ? <><Check size={13} /> Pago</> : 'Não pago'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={salvar} disabled={!form.descricao.trim() || !form.valor}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: !form.descricao.trim() || !form.valor ? '#D1D5DB' : '#16A34A',
                    color: '#fff',
                    boxShadow: !form.descricao.trim() || !form.valor ? 'none' : '0 2px 8px rgba(22,163,74,0.3)',
                    borderRadius: 8, border: 'none',
                    padding: '11px 20px', fontSize: 14, fontWeight: 700,
                    cursor: !form.descricao.trim() || !form.valor ? 'not-allowed' : 'pointer',
                  }}>
                  <Check size={14} /> {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
                <button onClick={cancelar} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#fff', color: '#6B5A4E', border: '1.5px solid #CFC4BB',
                  borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              style={{ border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '7px 12px', fontSize: 12, outline: 'none', background: '#fff', color: '#6B5A4E', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <option value="todas">Todas categorias</option>
              {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)}
              style={{ border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '7px 12px', fontSize: 12, outline: 'none', background: '#fff', color: '#6B5A4E', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <option value="todos">Pago e não pago</option>
              <option value="pago">Somente pagos</option>
              <option value="pendente">Somente pendentes</option>
            </select>
          </div>

          {despesasFiltradas.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 13, color: '#9D8878', margin: '0 0 4px' }}>Total filtrado</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A0E08', margin: 0 }}>R$ {fmt(despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0))}</p>
              </div>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 13, color: '#16A34A', margin: '0 0 4px' }}>Pagos</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#15803D', margin: 0 }}>R$ {fmt(despesasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + Number(d.valor), 0))}</p>
              </div>
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 13, color: '#CA8A04', margin: '0 0 4px' }}>Pendentes</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#92400E', margin: 0 }}>R$ {fmt(despesasFiltradas.filter(d => !d.pago).reduce((acc, d) => acc + Number(d.valor), 0))}</p>
              </div>
            </div>
          )}

          {despesasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9D8878' }}>
              <TrendingUp size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <p style={{ fontSize: 13 }}>Nenhuma despesa encontrada</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {despesasFiltradas.map((d, idx) => {
                const cat = CATEGORIA_COR[d.categoria] || { bg: '#6B7280', color: '#fff' }
                return (
                  <div key={d.id} style={{
                    background: idx % 2 === 0 ? '#fff' : '#FAFAF8', border: '1.5px solid #E6DDD5',
                    borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAF8'}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, fontWeight: 600 }}>{d.categoria}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A0E08' }}>{d.descricao}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#9D8878', margin: '3px 0 0' }}>{new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>R$ {fmt(d.valor)}</span>
                      <button onClick={() => pagarDespesa(d.id)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: d.pago ? '#16A34A' : '#CA8A04', color: '#fff' }}>
                        {d.pago ? '✓ Pago' : '⏳ Pendente'}
                      </button>
                      <button onClick={() => iniciarEdicao(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => removerDespesa(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== ABA SALDOS ===== */}
      {aba === 'saldos' && (
        <div>
          <p style={{ fontSize: 13, color: '#9D8878', marginBottom: 24 }}>
            Atualize manualmente os saldos sempre que necessário. Esses valores ficam salvos localmente.
          </p>

          {/* Cards de saldo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { campo: 'conta', icon: Building2, label: 'Saldo Conta Bancária', cor: '#2563EB', bg: '#EFF6FF', borda: '#BFDBFE', corLabel: '#1D4ED8' },
              { campo: 'dinheiro', icon: Wallet, label: 'Dinheiro em Mãos', cor: '#16A34A', bg: '#F0FDF4', borda: '#BBF7D0', corLabel: '#15803D' },
              { campo: 'reserva', icon: Users, label: 'Caixinha — Reserva Funcionários', cor: '#7C3AED', bg: '#F5F3FF', borda: '#DDD6FE', corLabel: '#6D28D9' },
            ].map(({ campo, icon: Icon, label, cor, bg, borda, corLabel }) => (
              <div key={campo} style={{ background: bg, border: `1.5px solid ${borda}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ background: cor, borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="#fff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: corLabel, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>

                {editandoSaldo === campo ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#1A0E08' }}>R$</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={inputSaldo}
                        onChange={e => setInputSaldo(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') salvarSaldo(campo); if (e.key === 'Escape') setEditandoSaldo(null) }}
                        style={{ ...INPUT_BASE, padding: '8px 12px', fontSize: 20, fontWeight: 700, width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => salvarSaldo(campo)} style={{ flex: 1, background: cor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Salvar
                      </button>
                      <button onClick={() => setEditandoSaldo(null)} style={{ flex: 1, background: '#fff', color: '#6B5A4E', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 30, fontWeight: 700, color: '#1A0E08', margin: '0 0 12px' }}>
                      R$ {fmt(saldos[campo])}
                    </p>
                    <button onClick={() => { setEditandoSaldo(campo); setInputSaldo(String(saldos[campo] || '')) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: corLabel, border: `1.5px solid ${borda}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      <Pencil size={12} /> Atualizar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 13, color: '#9D8878', margin: '0 0 6px', fontWeight: 600 }}>Patrimônio Total</p>
            <p style={{ fontSize: 34, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
              R$ {fmt(Number(saldos.conta || 0) + Number(saldos.dinheiro || 0) + Number(saldos.reserva || 0))}
            </p>
            <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#2563EB' }}>Conta: R$ {fmt(saldos.conta)}</span>
              <span style={{ fontSize: 12, color: '#16A34A' }}>Dinheiro: R$ {fmt(saldos.dinheiro)}</span>
              <span style={{ fontSize: 12, color: '#7C3AED' }}>Reserva: R$ {fmt(saldos.reserva)}</span>
            </div>
          </div>

          {/* Saldo do dia */}
          <div style={{ marginTop: 20, background: liquidoHoje >= 0 ? '#F0FDF4' : '#FFFBEB', border: `1.5px solid ${liquidoHoje >= 0 ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9D8878', margin: '0 0 6px' }}>Resultado de Hoje</p>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: '#16A34A', margin: '0 0 2px' }}>Receitas</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#14532D', margin: 0 }}>R$ {fmt(receitasHoje)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#DC2626', margin: '0 0 2px' }}>Despesas</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#7F1D1D', margin: 0 }}>R$ {fmt(despesasHoje)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: liquidoHoje >= 0 ? '#1D4ED8' : '#92400E', margin: '0 0 2px' }}>Líquido</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: liquidoHoje >= 0 ? '#1E3A8A' : '#78350F', margin: 0 }}>
                  {liquidoHoje < 0 ? '-' : ''}R$ {fmt(Math.abs(liquidoHoje))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ABA FLUXO DE CAIXA ===== */}
      {aba === 'fluxo' && (
        <div>
          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {/* Período */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[['diario', 'Diário'], ['semanal', 'Semanal'], ['mensal', 'Mensal']].map(([k, l]) => (
                <button key={k} onClick={() => setPeriodoFluxo(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: periodoFluxo === k ? '#1A0E08' : '#fff',
                    color: periodoFluxo === k ? '#fff' : '#6B5A4E',
                    border: periodoFluxo === k ? 'none' : '1.5px solid #E6DDD5',
                  }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Navegador mês/ano */}
            {periodoFluxo !== 'mensal' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <button onClick={mesAnterior} style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={16} color="#6B5A4E" />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0E08', minWidth: 120, textAlign: 'center' }}>
                  {MESES_NOME[mesFluxo - 1]} {anoFluxo}
                </span>
                <button onClick={mesProximo} style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={16} color="#6B5A4E" />
                </button>
              </div>
            )}
            {periodoFluxo === 'mensal' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <button onClick={() => setAnoFluxo(a => a - 1)} style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={16} color="#6B5A4E" />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A0E08', minWidth: 60, textAlign: 'center' }}>{anoFluxo}</span>
                <button onClick={() => setAnoFluxo(a => a + 1)} style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={16} color="#6B5A4E" />
                </button>
              </div>
            )}
          </div>

          {/* KPIs do período */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803D', marginTop: 0, marginBottom: 6 }}>Receitas</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#14532D', margin: 0 }}>R$ {fmt(totalRecFluxo)}</p>
            </div>
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#991B1B', marginTop: 0, marginBottom: 6 }}>Despesas</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#7F1D1D', margin: 0 }}>R$ {fmt(totalDespFluxo)}</p>
            </div>
            <div style={{
              background: totalLiqFluxo >= 0 ? '#EFF6FF' : '#FFFBEB',
              border: totalLiqFluxo >= 0 ? '1.5px solid #BFDBFE' : '1.5px solid #FDE68A',
              borderRadius: 12, padding: 18,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: totalLiqFluxo >= 0 ? '#1D4ED8' : '#92400E', marginTop: 0, marginBottom: 6 }}>Líquido</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: totalLiqFluxo >= 0 ? '#1E3A8A' : '#78350F', margin: 0 }}>
                {totalLiqFluxo < 0 ? '-' : ''}R$ {fmt(Math.abs(totalLiqFluxo))}
              </p>
            </div>
          </div>

          {fluxoData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9D8878' }}>
              <TrendingUp size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <p style={{ fontSize: 13 }}>Sem movimentação no período</p>
            </div>
          ) : (
            <>
              {/* Gráfico de barras */}
              <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6B5A4E', marginTop: 0, marginBottom: 16 }}>Receitas vs Despesas</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: periodoFluxo === 'diario' ? 6 : 16, minWidth: periodoFluxo === 'diario' ? fluxoData.length * 36 : 'auto', height: 140 }}>
                  {fluxoData.map(d => (
                    <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: periodoFluxo === 'diario' ? 28 : 50 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 110, width: '100%', justifyContent: 'center' }}>
                        <div title={`Receita: R$ ${fmt(d.rec)}`} style={{
                          width: periodoFluxo === 'diario' ? 10 : 18,
                          height: Math.max(3, (d.rec / maxVal) * 100),
                          background: '#16A34A', borderRadius: '3px 3px 0 0',
                          alignSelf: 'flex-end',
                        }} />
                        <div title={`Despesa: R$ ${fmt(d.desp)}`} style={{
                          width: periodoFluxo === 'diario' ? 10 : 18,
                          height: Math.max(3, (d.desp / maxVal) * 100),
                          background: '#DC2626', borderRadius: '3px 3px 0 0',
                          alignSelf: 'flex-end',
                        }} />
                      </div>
                      <span style={{ fontSize: periodoFluxo === 'diario' ? 9 : 11, color: '#9D8878', marginTop: 4, textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, background: '#16A34A', borderRadius: 2, display: 'inline-block' }}></span> Receitas
                  </span>
                  <span style={{ fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, background: '#DC2626', borderRadius: 2, display: 'inline-block' }}></span> Despesas
                  </span>
                </div>
              </div>

              {/* Tabela detalhada */}
              <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', background: '#F9F6F3', borderBottom: '1.5px solid #E6DDD5' }}>
                  {['Período', 'Receitas', 'Despesas', 'Líquido'].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9D8878' }}>{h}</span>
                  ))}
                </div>
                {fluxoData.map((d, idx) => (
                  <div key={d.key} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    padding: '10px 16px',
                    background: idx % 2 === 0 ? '#fff' : '#FAFAF8',
                    borderBottom: idx < fluxoData.length - 1 ? '1px solid #F3F0ED' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: '#1A0E08', fontWeight: 600 }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>R$ {fmt(d.rec)}</span>
                    <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>R$ {fmt(d.desp)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: d.liq >= 0 ? '#1D4ED8' : '#DC2626' }}>
                      {d.liq < 0 ? '-' : ''}R$ {fmt(Math.abs(d.liq))}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 16px', background: '#1A0E08' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#CFC4BB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#86EFAC' }}>R$ {fmt(totalRecFluxo)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>R$ {fmt(totalDespFluxo)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: totalLiqFluxo >= 0 ? '#93C5FD' : '#FDE68A' }}>
                    {totalLiqFluxo < 0 ? '-' : ''}R$ {fmt(Math.abs(totalLiqFluxo))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
