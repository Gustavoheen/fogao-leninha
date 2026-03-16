import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { UserCheck, Plus, X, Check, Bike, Pencil } from 'lucide-react'

const FORM_VAZIO = {
  nome: '',
  cargo: '',
  salario: '',
  dataAdmissao: '',
  ativo: true,
  observacoes: '',
}

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

export default function Funcionarios() {
  const { funcionarios, adicionarFuncionario, editarFuncionario, removerFuncionario, motoboys, adicionarMotoboy, removerMotoboy } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [novoMotoboy, setNovoMotoboy] = useState('')

  function salvar() {
    if (!form.nome.trim()) return
    const dados = {
      ...form,
      salario: Number(form.salario) || 0,
    }
    if (editandoId) {
      editarFuncionario(editandoId, dados)
      setEditandoId(null)
    } else {
      adicionarFuncionario(dados)
    }
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(f) {
    setForm({
      nome: f.nome,
      cargo: f.cargo || '',
      salario: String(f.salario || ''),
      dataAdmissao: f.dataAdmissao || '',
      ativo: f.ativo !== false,
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

  function adicionarMotoboyNovo() {
    if (!novoMotoboy.trim()) return
    adicionarMotoboy(novoMotoboy.trim())
    setNovoMotoboy('')
  }

  const totalFolha = funcionarios.filter(f => f.ativo !== false).reduce((acc, f) => acc + Number(f.salario || 0), 0)
  const ativos = funcionarios.filter(f => f.ativo !== false)
  const inativos = funcionarios.filter(f => f.ativo === false)

  const motoboysFuncionarios = funcionarios
    .filter(f => f.ativo !== false && (
      f.cargo?.toLowerCase().includes('motoboy') || f.cargo?.toLowerCase().includes('entregador')
    ))
    .map(f => f.nome)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Funcionários
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {ativos.length} ativo(s) • Folha: R$ {totalFolha.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#C8221A', color: '#fff',
            boxShadow: '0 2px 10px rgba(200,34,26,0.35)',
            borderRadius: 8, border: 'none',
            padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
          <Plus size={15} /> Novo Funcionário
        </button>
      </div>

      {/* Cards de resumo */}
      {funcionarios.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 22 }}>
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, color: '#92400E', margin: '0 0 4px' }}>Folha de Pagamento</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#78350F', margin: 0 }}>R$ {totalFolha.toFixed(2).replace('.', ',')}</p>
            <p style={{ fontSize: 13, color: '#CA8A04', marginTop: 4 }}>{ativos.length} funcionário(s) ativo(s)</p>
          </div>
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, color: '#9D8878', margin: '0 0 4px' }}>Ativos</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#16A34A', margin: 0 }}>{ativos.length}</p>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #E6DDD5', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, color: '#9D8878', margin: '0 0 4px' }}>Inativos</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#6B7280', margin: 0 }}>{inativos.length}</p>
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
            {editandoId ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>

          {/* Dados pessoais */}
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
              Dados Pessoais
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Nome</label>
                <input type="text" value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  style={INPUT_BASE} placeholder="Nome completo" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Cargo</label>
                <input type="text" value={form.cargo}
                  onChange={e => setForm(prev => ({ ...prev, cargo: e.target.value }))}
                  style={INPUT_BASE} placeholder="Ex: Motoboy, Cozinheiro..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Data de Admissão</label>
                <input type="date" value={form.dataAdmissao}
                  onChange={e => setForm(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                  style={INPUT_BASE} />
              </div>
            </div>
          </div>

          {/* Salário e status */}
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#16A34A', marginTop: 0, marginBottom: 12 }}>
              Salário e Status
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Salário (R$)</label>
                <input type="number" min="0" step="0.01" value={form.salario}
                  onChange={e => setForm(prev => ({ ...prev, salario: e.target.value }))}
                  style={INPUT_BASE} placeholder="0,00" />
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, ativo: !prev.ativo }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                  background: form.ativo ? '#16A34A' : '#6B7280',
                  color: '#fff',
                }}>
                {form.ativo ? <><Check size={13} /> Ativo</> : 'Inativo'}
              </button>
            </div>
          </div>

          {/* Observações */}
          <div style={{ background: '#F8F7F5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Observações</label>
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
                padding: '11px 20px', fontSize: 14, fontWeight: 700,
                cursor: !form.nome.trim() ? 'not-allowed' : 'pointer',
              }}>
              <Check size={14} /> {editandoId ? 'Salvar' : 'Adicionar'}
            </button>
            <button onClick={cancelar} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', color: '#6B5A4E',
              border: '1.5px solid #CFC4BB',
              borderRadius: 8, padding: '9px 18px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de funcionários */}
      {ativos.length === 0 && inativos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9D8878' }}>
          <UserCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
          <p style={{ fontSize: 13 }}>Nenhum funcionário cadastrado</p>
        </div>
      ) : (
        <>
          {ativos.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D8878', marginBottom: 12 }}>
                Funcionários Ativos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ativos.map(f => (
                  <FuncionarioCard key={f.id} funcionario={f} onEditar={iniciarEdicao} onRemover={removerFuncionario} onToggle={editarFuncionario} />
                ))}
              </div>
            </div>
          )}
          {inativos.length > 0 && (
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CFC4BB', marginBottom: 12 }}>
                Inativos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {inativos.map(f => (
                  <FuncionarioCard key={f.id} funcionario={f} onEditar={iniciarEdicao} onRemover={removerFuncionario} onToggle={editarFuncionario} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Seção Motoboys */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1.5px solid #E6DDD5' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A0E08', marginTop: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bike size={17} style={{ color: '#2563EB' }} /> Motoboys para Entrega
        </h2>
        <p style={{ fontSize: 13, color: '#9D8878', marginBottom: 16 }}>
          Lista usada na atribuição de entregas nos pedidos.
          {motoboysFuncionarios.length > 0 && ' Funcionários com cargo de motoboy/entregador são adicionados automaticamente.'}
        </p>

        {motoboysFuncionarios.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: '#9D8878', marginBottom: 8 }}>Do cadastro de funcionários:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {motoboysFuncionarios.map(nome => (
                <span key={nome} style={{ background: '#2563EB', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                  {nome}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            value={novoMotoboy}
            onChange={e => setNovoMotoboy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarMotoboyNovo()}
            style={INPUT_BASE}
            placeholder="Adicionar motoboy avulso..."
          />
          <button onClick={adicionarMotoboyNovo}
            style={{
              background: '#C8221A', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '0 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              flexShrink: 0,
            }}>
            <Plus size={16} />
          </button>
        </div>

        {motoboys.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {motoboys.map(nome => (
              <div key={nome} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#FFFBEB', border: '1.5px solid #FDE68A',
                color: '#92400E', fontSize: 12, padding: '5px 12px',
                borderRadius: 20, fontWeight: 600,
              }}>
                {nome}
                <button onClick={() => removerMotoboy(nome)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CA8A04', display: 'flex', alignItems: 'center', marginLeft: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                  onMouseLeave={e => e.currentTarget.style.color = '#CA8A04'}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {motoboys.length === 0 && motoboysFuncionarios.length === 0 && (
          <p style={{ fontSize: 13, color: '#9D8878' }}>Nenhum motoboy cadastrado. Adicione acima ou cadastre funcionários com cargo "Motoboy".</p>
        )}
      </div>
    </div>
  )
}

function FuncionarioCard({ funcionario: f, onEditar, onRemover, onToggle }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #E6DDD5',
      borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      padding: 16, opacity: f.ativo === false ? 0.65 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>{f.nome}</span>
            {f.cargo && (
              <span style={{ fontSize: 11, background: '#2563EB', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {f.cargo}
              </span>
            )}
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: f.ativo !== false ? '#16A34A' : '#6B7280',
              color: '#fff',
            }}>
              {f.ativo !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {Number(f.salario) > 0 && (
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0E08', margin: '3px 0' }}>
              R$ {Number(f.salario).toFixed(2).replace('.', ',')}/mês
            </p>
          )}
          {f.dataAdmissao && (
            <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0' }}>
              Desde {new Date(f.dataAdmissao + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
          {f.observacoes && <p style={{ fontSize: 13, color: '#9D8878', fontStyle: 'italic', margin: '2px 0' }}>{f.observacoes}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
          <button
            onClick={() => onToggle(f.id, { ativo: f.ativo === false })}
            style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 20, fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid',
              background: 'transparent',
              borderColor: f.ativo !== false ? '#CFC4BB' : '#BBF7D0',
              color: f.ativo !== false ? '#6B5A4E' : '#16A34A',
            }}>
            {f.ativo !== false ? 'Desativar' : 'Ativar'}
          </button>
          <button onClick={() => onEditar(f)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
            onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onRemover(f.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
            onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
