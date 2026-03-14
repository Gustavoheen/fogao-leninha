import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Truck, Plus, X, Check, Phone, Pencil } from 'lucide-react'

const FORM_VAZIO = {
  nome: '',
  contato: '',
  telefone: '',
  produtos: '',
  valorMensal: '',
  diaPagamento: '',
  observacoes: '',
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

export default function Fornecedores() {
  const { fornecedores, adicionarFornecedor, editarFornecedor, removerFornecedor, pagarFornecedor } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)

  function salvar() {
    if (!form.nome.trim()) return
    const dados = {
      ...form,
      valorMensal: Number(form.valorMensal) || 0,
      diaPagamento: Number(form.diaPagamento) || 1,
    }
    if (editandoId) {
      editarFornecedor(editandoId, dados)
      setEditandoId(null)
    } else {
      adicionarFornecedor(dados)
    }
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(f) {
    setForm({
      nome: f.nome,
      contato: f.contato || '',
      telefone: f.telefone || '',
      produtos: f.produtos || '',
      valorMensal: String(f.valorMensal || ''),
      diaPagamento: String(f.diaPagamento || ''),
      observacoes: f.observacoes || '',
    })
    setEditandoId(f.id)
    setMostrarForm(true)
  }

  function cancelar() {
    setForm(FORM_VAZIO)
    setMostrarForm(false)
    setEditandoId(null)
  }

  const totalMensal = fornecedores.reduce((acc, f) => acc + Number(f.valorMensal || 0), 0)
  const totalPendente = fornecedores.filter(f => !f.pago).reduce((acc, f) => acc + Number(f.valorMensal || 0), 0)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Fornecedores
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {fornecedores.length} fornecedor(es) • Total mensal: R$ {totalMensal.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#C8221A', color: '#fff',
            boxShadow: '0 2px 10px rgba(200,34,26,0.35)',
            borderRadius: 8, border: 'none',
            padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
          <Plus size={15} /> Novo Fornecedor
        </button>
      </div>

      {/* Resumo */}
      {fornecedores.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
          <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 4px' }}>Total Mensal</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1A0E08', margin: 0 }}>R$ {totalMensal.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{
            border: '1.5px solid',
            borderColor: totalPendente > 0 ? '#FDE68A' : '#BBF7D0',
            background: totalPendente > 0 ? '#FFFBEB' : '#F0FDF4',
            borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 12, color: totalPendente > 0 ? '#92400E' : '#16A34A', margin: '0 0 4px' }}>Pendente de Pagamento</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: totalPendente > 0 ? '#78350F' : '#15803D', margin: 0 }}>
              R$ {totalPendente.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      )}

      {/* Formulário */}
      {mostrarForm && (
        <div style={{
          background: '#fff', border: '1.5px solid #E6DDD5',
          borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: 20, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A0E08', marginTop: 0, marginBottom: 16 }}>
            {editandoId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>

          {/* Dados da empresa */}
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
              Dados da Empresa
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Nome da Empresa / Fornecedor</label>
                <input type="text" value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  style={INPUT_BASE} placeholder="Ex: Distribuidora Silva..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Contato (responsável)</label>
                <input type="text" value={form.contato}
                  onChange={e => setForm(prev => ({ ...prev, contato: e.target.value }))}
                  style={INPUT_BASE} placeholder="Nome do responsável" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Telefone</label>
                <input type="text" value={form.telefone}
                  onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                  style={INPUT_BASE} placeholder="(32) 99999-9999" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Produtos fornecidos</label>
                <input type="text" value={form.produtos}
                  onChange={e => setForm(prev => ({ ...prev, produtos: e.target.value }))}
                  style={INPUT_BASE} placeholder="Ex: Carnes, frango, carne bovina..." />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16A34A', marginTop: 0, marginBottom: 12 }}>
              Financeiro
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Valor Mensal (R$)</label>
                <input type="number" min="0" step="0.01" value={form.valorMensal}
                  onChange={e => setForm(prev => ({ ...prev, valorMensal: e.target.value }))}
                  style={INPUT_BASE} placeholder="0,00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Dia de Pagamento</label>
                <input type="number" min="1" max="31" value={form.diaPagamento}
                  onChange={e => setForm(prev => ({ ...prev, diaPagamento: e.target.value }))}
                  style={INPUT_BASE} placeholder="Ex: 15" />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div style={{ background: '#F8F7F5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Observações</label>
            <input type="text" value={form.observacoes}
              onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              style={INPUT_BASE} placeholder="Informações adicionais..." />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={salvar} disabled={!form.nome.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: !form.nome.trim() ? '#D1D5DB' : '#16A34A',
                color: '#fff',
                boxShadow: !form.nome.trim() ? 'none' : '0 2px 8px rgba(22,163,74,0.3)',
                borderRadius: 8, border: 'none',
                padding: '9px 20px', fontSize: 13, fontWeight: 600,
                cursor: !form.nome.trim() ? 'not-allowed' : 'pointer',
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

      {/* Lista */}
      {fornecedores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9D8878' }}>
          <Truck size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
          <p style={{ fontSize: 13 }}>Nenhum fornecedor cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fornecedores.map((f, idx) => (
            <div key={f.id} style={{
              background: idx % 2 === 0 ? '#fff' : '#FAFAF8',
              border: !f.pago && f.valorMensal > 0 ? '1.5px solid #FDE68A' : '1.5px solid #E6DDD5',
              borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              padding: 16,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAF8'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>{f.nome}</span>
                    {f.produtos && (
                      <span style={{ fontSize: 11, background: '#CA8A04', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                        {f.produtos}
                      </span>
                    )}
                  </div>
                  {f.contato && <p style={{ fontSize: 12, color: '#6B5A4E', margin: '2px 0' }}>Contato: {f.contato}</p>}
                  {f.telefone && (
                    <p style={{ fontSize: 12, color: '#6B5A4E', margin: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={10} /> {f.telefone}
                    </p>
                  )}
                  {f.diaPagamento && (
                    <p style={{ fontSize: 12, color: '#9D8878', margin: '4px 0 0' }}>Pagamento: todo dia {f.diaPagamento}</p>
                  )}
                  {f.observacoes && <p style={{ fontSize: 12, color: '#9D8878', margin: '2px 0 0', fontStyle: 'italic' }}>{f.observacoes}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 16 }}>
                  {Number(f.valorMensal) > 0 && (
                    <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>
                      R$ {Number(f.valorMensal).toFixed(2).replace('.', ',')}/mês
                    </span>
                  )}
                  {Number(f.valorMensal) > 0 && (
                    <button
                      onClick={() => pagarFornecedor(f.id)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: f.pago ? '#16A34A' : '#CA8A04',
                        color: '#fff',
                      }}>
                      {f.pago ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => iniciarEdicao(f)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removerFornecedor(f.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
