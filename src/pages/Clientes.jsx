import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { UserPlus, Search, Pencil, Trash2, Phone, MapPin, X, Check, AlertCircle, Star } from 'lucide-react'
import { formatarEndereco, ENDERECO_VAZIO } from '../utils/endereco'

const VAZIO = { nome: '', telefone: '', ...ENDERECO_VAZIO, observacoes: '', tipo: 'normal' }

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
}

export default function Clientes() {
  const { clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtrados = clientes.filter(c => {
    const endStr = formatarEndereco(c).toLowerCase()
    const buscaOk =
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca) ||
      endStr.includes(busca.toLowerCase()) ||
      (c.bairro || '').toLowerCase().includes(busca.toLowerCase())
    const tipoOk = filtroTipo === 'todos' || c.tipo === filtroTipo
    return buscaOk && tipoOk
  })

  const totalMensalistas = clientes.filter(c => c.tipo === 'mensalista').length
  const totalDebitoPendente = clientes
    .filter(c => c.tipo === 'mensalista')
    .reduce((acc, c) => acc + debitoPendente(c.id), 0)

  function salvar() {
    if (!form.nome.trim()) return
    if (editandoId) {
      editarCliente(editandoId, form)
      setEditandoId(null)
    } else {
      adicionarCliente(form)
    }
    setForm(VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(cliente) {
    setForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      rua: cliente.rua || '',
      bairro: cliente.bairro || '',
      numero: cliente.numero || '',
      referencia: cliente.referencia || '',
      observacoes: cliente.observacoes || '',
      tipo: cliente.tipo || 'normal',
    })
    setEditandoId(cliente.id)
    setMostrarForm(true)
  }

  function cancelar() {
    setForm(VAZIO)
    setEditandoId(null)
    setMostrarForm(false)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {clientes.length} cadastrado(s) · {totalMensalistas} mensalista(s)
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#C8221A', color: '#fff',
            boxShadow: '0 2px 10px rgba(200,34,26,0.35)',
            borderRadius: 8, border: 'none',
            padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
          <UserPlus size={15} /> Novo Cliente
        </button>
      </div>

      {/* Alerta débito */}
      {totalDebitoPendente > 0 && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={17} style={{ color: '#92400E', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
            Mensalistas com débito total de <strong>R$ {totalDebitoPendente.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
      )}

      {/* Busca + filtro */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9D8878' }} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, rua ou bairro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ ...INPUT_BASE, paddingLeft: 34 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['todos', 'Todos'], ['normal', 'Normal'], ['mensalista', 'Mensalista']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltroTipo(key)}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: filtroTipo === key ? '#C8221A' : '#fff',
                color: filtroTipo === key ? '#fff' : '#6B5A4E',
                border: filtroTipo === key ? 'none' : '1.5px solid #E6DDD5',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div style={{
          background: '#fff', border: '1.5px solid #E6DDD5',
          borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: 20, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A0E08', marginTop: 0, marginBottom: 16 }}>
            {editandoId ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>

          {/* Dados básicos */}
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={12} /> Dados Pessoais
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  style={INPUT_BASE} placeholder="Nome completo" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Telefone</label>
                <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                  style={INPUT_BASE} placeholder="(32) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div style={{ background: '#F0F9FF', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2563EB', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} /> Endereço
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Rua</label>
                <input type="text" value={form.rua} onChange={e => setForm({ ...form, rua: e.target.value })}
                  style={INPUT_BASE} placeholder="Nome da rua" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Bairro</label>
                <input type="text" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })}
                  style={INPUT_BASE} placeholder="Bairro" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Número</label>
                <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                  style={INPUT_BASE} placeholder="Ex: 123" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Referência</label>
                <input type="text" value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })}
                  style={INPUT_BASE} placeholder="Ex: Próximo ao mercado" />
              </div>
            </div>
          </div>

          {/* Tipo + obs */}
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16A34A', marginTop: 0, marginBottom: 12 }}>
              Configurações
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Tipo de Cliente</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  style={{ ...INPUT_BASE }}>
                  <option value="normal">Normal</option>
                  <option value="mensalista">Mensalista (paga depois)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B5A4E', marginBottom: 4 }}>Observações</label>
                <input type="text" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  style={INPUT_BASE} placeholder="Preferências, alergias..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={salvar} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#16A34A', color: '#fff',
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              borderRadius: 8, border: 'none',
              padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Check size={14} /> Salvar
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
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9D8878' }}>
          <UserPlus size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
          <p style={{ fontSize: 13 }}>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtrados.map((cliente, idx) => {
            const debito = debitoPendente(cliente.id)
            const endFormatado = formatarEndereco(cliente)
            return (
              <div key={cliente.id} style={{
                background: idx % 2 === 0 ? '#fff' : '#FAFAF8',
                border: debito > 0 ? '1.5px solid #FDE68A' : '1.5px solid #E6DDD5',
                borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAF8'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14, margin: 0 }}>{cliente.nome}</p>
                    {cliente.tipo === 'mensalista' && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: 11, background: '#CA8A04', color: '#fff',
                        padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                      }}>
                        <Star size={9} /> Mensalista
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                    {cliente.telefone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B5A4E' }}>
                        <Phone size={11} /> {cliente.telefone}
                      </span>
                    )}
                  </div>
                  {endFormatado && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 4 }}>
                      <MapPin size={11} style={{ color: '#9D8878', marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: '#6B5A4E', lineHeight: 1.5 }}>
                        {cliente.rua && <span>{cliente.rua}</span>}
                        {cliente.numero && <span>, nº {cliente.numero}</span>}
                        {cliente.bairro && <span> — {cliente.bairro}</span>}
                        {cliente.referencia && <span style={{ display: 'block', color: '#9D8878', fontStyle: 'italic' }}>{cliente.referencia}</span>}
                      </div>
                    </div>
                  )}
                  {cliente.observacoes && (
                    <p style={{ fontSize: 12, color: '#CA8A04', marginTop: 4 }}>{cliente.observacoes}</p>
                  )}
                  {debito > 0 && (
                    <p style={{ fontSize: 12, color: '#92400E', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={11} /> Débito: R$ {debito.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button
                    onClick={() => iniciarEdicao(cliente)}
                    style={{ padding: 7, background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#9D8878' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.color = '#C8221A' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9D8878' }}>
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => removerCliente(cliente.id)}
                    style={{ padding: 7, background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#9D8878' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#991B1B' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9D8878' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
