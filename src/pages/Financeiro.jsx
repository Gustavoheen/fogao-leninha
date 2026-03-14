import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TrendingUp, Plus, X, Check, Pencil } from 'lucide-react'

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

const INPUT_BASE = {
  background: '#fff',
  border: '1.5px solid #CFC4BB',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  color: '#1A0E08',
  boxSizing: 'border-box',
}

export default function Financeiro() {
  const { despesas, adicionarDespesa, editarDespesa, removerDespesa, pagarDespesa, pedidos } = useApp()
  const [aba, setAba] = useState('despesas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [editandoId, setEditandoId] = useState(null)

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
    setForm({
      categoria: d.categoria,
      descricao: d.descricao,
      valor: String(d.valor),
      data: d.data,
      pago: d.pago,
    })
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
  const receitasHoje = pedidosHoje
    .filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista'))
    .reduce((acc, p) => acc + Number(p.total), 0)
  const despesasHoje = despesas
    .filter(d => d.data === hoje && d.pago)
    .reduce((acc, d) => acc + Number(d.valor), 0)
  const liquidoHoje = receitasHoje - despesasHoje

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Financeiro
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            Controle de despesas e fluxo de caixa
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
              padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            <Plus size={15} /> Nova Despesa
          </button>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[['despesas', 'Despesas'], ['fluxo', 'Fluxo do Dia']].map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: aba === key ? '#C8221A' : '#fff',
              color: aba === key ? '#fff' : '#6B5A4E',
              border: aba === key ? 'none' : '1.5px solid #E6DDD5',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Aba Despesas */}
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

              {/* Informações da despesa */}
              <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
                  Detalhes
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Categoria</label>
                    <select value={form.categoria} onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                      style={INPUT_BASE}>
                      {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Data</label>
                    <input type="date" value={form.data}
                      onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))}
                      style={INPUT_BASE} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Descrição</label>
                    <input type="text" value={form.descricao}
                      onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                      style={INPUT_BASE}
                      placeholder="Ex: Compra de frango..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Valor (R$)</label>
                    <input type="number" min="0" step="0.01" value={form.valor}
                      onChange={e => setForm(prev => ({ ...prev, valor: e.target.value }))}
                      style={INPUT_BASE}
                      placeholder="0,00" />
                  </div>
                </div>
              </div>

              {/* Status de pagamento */}
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setForm(prev => ({ ...prev, pago: !prev.pago }))}
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
                <button onClick={salvar}
                  disabled={!form.descricao.trim() || !form.valor}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: !form.descricao.trim() || !form.valor ? '#D1D5DB' : '#16A34A',
                    color: '#fff',
                    boxShadow: !form.descricao.trim() || !form.valor ? 'none' : '0 2px 8px rgba(22,163,74,0.3)',
                    borderRadius: 8, border: 'none',
                    padding: '9px 20px', fontSize: 13, fontWeight: 600,
                    cursor: !form.descricao.trim() || !form.valor ? 'not-allowed' : 'pointer',
                  }}>
                  <Check size={14} /> {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
                <button onClick={cancelar} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#fff', color: '#6B5A4E',
                  border: '1.5px solid #CFC4BB',
                  borderRadius: 8, padding: '9px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  <X size={14} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
              style={{
                border: '1.5px solid #E6DDD5', borderRadius: 8,
                padding: '7px 12px', fontSize: 12, outline: 'none',
                background: '#fff', color: '#6B5A4E', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
              <option value="todas">Todas categorias</option>
              {CATEGORIAS_DESPESA.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)}
              style={{
                border: '1.5px solid #E6DDD5', borderRadius: 8,
                padding: '7px 12px', fontSize: 12, outline: 'none',
                background: '#fff', color: '#6B5A4E', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
              <option value="todos">Pago e não pago</option>
              <option value="pago">Somente pagos</option>
              <option value="pendente">Somente pendentes</option>
            </select>
          </div>

          {/* Totais */}
          {despesasFiltradas.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Total filtrado</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
                  R$ {despesasFiltradas.reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#16A34A', margin: '0 0 4px' }}>Pagos</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#15803D', margin: 0 }}>
                  R$ {despesasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 12, color: '#CA8A04', margin: '0 0 4px' }}>Pendentes</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#92400E', margin: 0 }}>
                  R$ {despesasFiltradas.filter(d => !d.pago).reduce((acc, d) => acc + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                </p>
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
                    background: idx % 2 === 0 ? '#fff' : '#FAFAF8',
                    border: '1.5px solid #E6DDD5',
                    borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAF8'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, fontWeight: 600 }}>
                          {d.categoria}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A0E08' }}>{d.descricao}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#9D8878', margin: '3px 0 0' }}>
                        {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>R$ {Number(d.valor).toFixed(2).replace('.', ',')}</span>
                      <button
                        onClick={() => pagarDespesa(d.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', border: 'none',
                          background: d.pago ? '#16A34A' : '#CA8A04',
                          color: '#fff',
                        }}>
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

      {/* Aba Fluxo */}
      {aba === 'fluxo' && (
        <div>
          <p style={{ fontSize: 13, color: '#9D8878', marginBottom: 20 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#15803D', marginTop: 0, marginBottom: 6 }}>Receitas</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#14532D', margin: 0 }}>R$ {receitasHoje.toFixed(2).replace('.', ',')}</p>
              <p style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>
                {pedidosHoje.filter(p => p.statusPagamento === 'pago' || (!p.statusPagamento && p.pagamento !== 'Pendente' && p.pagamento !== 'Mensalista')).length} pedido(s) pago(s)
              </p>
            </div>
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#991B1B', marginTop: 0, marginBottom: 6 }}>Despesas</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#7F1D1D', margin: 0 }}>R$ {despesasHoje.toFixed(2).replace('.', ',')}</p>
              <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{despesas.filter(d => d.data === hoje && d.pago).length} lançamento(s)</p>
            </div>
            <div style={{
              background: liquidoHoje >= 0 ? '#EFF6FF' : '#FFFBEB',
              border: liquidoHoje >= 0 ? '1.5px solid #BFDBFE' : '1.5px solid #FDE68A',
              borderRadius: 12, padding: 20,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: liquidoHoje >= 0 ? '#1D4ED8' : '#92400E', marginTop: 0, marginBottom: 6 }}>Líquido</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: liquidoHoje >= 0 ? '#1E3A8A' : '#78350F', margin: 0 }}>
                R$ {Math.abs(liquidoHoje).toFixed(2).replace('.', ',')}
              </p>
              <p style={{ fontSize: 12, color: liquidoHoje >= 0 ? '#2563EB' : '#CA8A04', marginTop: 4 }}>
                {liquidoHoje >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </div>
          </div>

          {/* Barra visual */}
          {(receitasHoje + despesasHoje) > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6B5A4E', marginTop: 0, marginBottom: 12 }}>Proporção Receitas vs Despesas</p>
              <div style={{ height: 24, background: '#F3F0ED', borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
                {receitasHoje > 0 && (
                  <div
                    style={{
                      background: '#16A34A', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      width: `${(receitasHoje / (receitasHoje + despesasHoje)) * 100}%`,
                      transition: 'width 0.3s',
                    }}>
                    {((receitasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0) > 15 ? `${((receitasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0)}%` : ''}
                  </div>
                )}
                {despesasHoje > 0 && (
                  <div
                    style={{
                      background: '#DC2626', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      width: `${(despesasHoje / (receitasHoje + despesasHoje)) * 100}%`,
                    }}>
                    {((despesasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0) > 15 ? `${((despesasHoje / (receitasHoje + despesasHoje)) * 100).toFixed(0)}%` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: '#16A34A', borderRadius: '50%', display: 'inline-block' }}></span> Receitas
                </span>
                <span style={{ fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: '#DC2626', borderRadius: '50%', display: 'inline-block' }}></span> Despesas
                </span>
              </div>
            </div>
          )}

          {/* Despesas de hoje */}
          {despesas.filter(d => d.data === hoje).length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12 }}>
                Despesas de Hoje
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {despesas.filter(d => d.data === hoje).map((d, idx) => {
                  const cat = CATEGORIA_COR[d.categoria] || { bg: '#6B7280', color: '#fff' }
                  return (
                    <div key={d.id} style={{
                      background: idx % 2 === 0 ? '#fff' : '#FAFAF8',
                      border: '1.5px solid #E6DDD5',
                      borderRadius: 12, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      <div>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, fontWeight: 600, marginRight: 8 }}>
                          {d.categoria}
                        </span>
                        <span style={{ fontSize: 13, color: '#1A0E08' }}>{d.descricao}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: '#1A0E08' }}>R$ {Number(d.valor).toFixed(2).replace('.', ',')}</span>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                          background: d.pago ? '#16A34A' : '#CA8A04',
                          color: '#fff',
                        }}>
                          {d.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
