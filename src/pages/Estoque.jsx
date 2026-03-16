import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Package, Plus, X, Check, AlertTriangle, Pencil } from 'lucide-react'

const CATEGORIAS = ['Carnes', 'Temperos', 'Bebidas', 'Embalagens', 'Limpeza', 'Outros']
const UNIDADES = ['kg', 'g', 'L', 'ml', 'un', 'cx']

const CATEGORIA_COR = {
  'Carnes': { bg: '#C8221A', color: '#fff' },
  'Temperos': { bg: '#CA8A04', color: '#fff' },
  'Bebidas': { bg: '#2563EB', color: '#fff' },
  'Embalagens': { bg: '#7C3AED', color: '#fff' },
  'Limpeza': { bg: '#0891B2', color: '#fff' },
  'Outros': { bg: '#6B7280', color: '#fff' },
}

const FORM_VAZIO = {
  nome: '',
  categoria: 'Carnes',
  quantidade: '',
  unidade: 'kg',
  qtdMinima: '',
  preco: '',
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

export default function Estoque() {
  const { estoque, adicionarEstoque, editarEstoque, removerEstoque, atualizarQuantidade } = useApp()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  function salvar() {
    if (!form.nome.trim()) return
    const dados = {
      ...form,
      quantidade: Number(form.quantidade) || 0,
      qtdMinima: Number(form.qtdMinima) || 0,
      preco: Number(form.preco) || 0,
    }
    if (editandoId) {
      editarEstoque(editandoId, dados)
      setEditandoId(null)
    } else {
      adicionarEstoque(dados)
    }
    setForm(FORM_VAZIO)
    setMostrarForm(false)
  }

  function iniciarEdicao(item) {
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: String(item.quantidade),
      unidade: item.unidade,
      qtdMinima: String(item.qtdMinima),
      preco: String(item.preco),
    })
    setEditandoId(item.id)
    setMostrarForm(true)
  }

  function cancelar() {
    setForm(FORM_VAZIO)
    setMostrarForm(false)
    setEditandoId(null)
  }

  const estoqueFiltrado = estoque
    .filter(e => filtroCategoria === 'todas' || e.categoria === filtroCategoria)
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const totalCusto = estoque.reduce((acc, e) => acc + Number(e.quantidade) * Number(e.preco), 0)
  const abaixoMinimo = estoque.filter(e => Number(e.quantidade) <= Number(e.qtdMinima) && Number(e.qtdMinima) > 0)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
            Estoque
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
            {estoque.length} item(s) • Custo estimado: R$ {totalCusto.toFixed(2).replace('.', ',')}
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
          <Plus size={15} /> Novo Item
        </button>
      </div>

      {/* Alertas estoque baixo */}
      {abaixoMinimo.length > 0 && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA',
          borderRadius: 12, padding: '12px 16px', marginBottom: 18,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 7, marginTop: 0, marginBottom: 10 }}>
            <AlertTriangle size={15} /> {abaixoMinimo.length} item(s) abaixo do mínimo
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {abaixoMinimo.map(e => (
              <span key={e.id} style={{ fontSize: 11, background: '#C8221A', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                {e.nome}: {e.quantidade} {e.unidade}
              </span>
            ))}
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
            {editandoId ? 'Editar Item' : 'Novo Item de Estoque'}
          </h2>

          {/* Identificação */}
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
              Identificação
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Nome</label>
                <input type="text" value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  style={INPUT_BASE} placeholder="Ex: Frango, Arroz..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                  style={INPUT_BASE}>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Unidade</label>
                <select value={form.unidade} onChange={e => setForm(prev => ({ ...prev, unidade: e.target.value }))}
                  style={INPUT_BASE}>
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Quantidades e preço */}
          <div style={{ background: '#F0F9FF', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#2563EB', marginTop: 0, marginBottom: 12 }}>
              Quantidades e Preço
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Quantidade atual</label>
                <input type="number" min="0" step="0.01" value={form.quantidade}
                  onChange={e => setForm(prev => ({ ...prev, quantidade: e.target.value }))}
                  style={INPUT_BASE} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Qtd. Mínima (alerta)</label>
                <input type="number" min="0" step="0.01" value={form.qtdMinima}
                  onChange={e => setForm(prev => ({ ...prev, qtdMinima: e.target.value }))}
                  style={INPUT_BASE} placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Preço de custo (R$)</label>
                <input type="number" min="0" step="0.01" value={form.preco}
                  onChange={e => setForm(prev => ({ ...prev, preco: e.target.value }))}
                  style={INPUT_BASE} placeholder="0,00" />
              </div>
            </div>
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

      {/* Filtro de categoria */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['todas', 'Todas'], ...CATEGORIAS.map(c => [c, c])].map(([key, label]) => (
          <button key={key} onClick={() => setFiltroCategoria(key)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              background: filtroCategoria === key ? '#C8221A' : '#fff',
              color: filtroCategoria === key ? '#fff' : '#6B5A4E',
              border: filtroCategoria === key ? 'none' : '1.5px solid #E6DDD5',
            }}>
            {label}
          </button>
        ))}
      </div>

      {estoqueFiltrado.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9D8878' }}>
          <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
          <p style={{ fontSize: 13 }}>Nenhum item no estoque</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {estoqueFiltrado.map((item, idx) => {
            const abaixo = Number(item.qtdMinima) > 0 && Number(item.quantidade) <= Number(item.qtdMinima)
            const cat = CATEGORIA_COR[item.categoria] || { bg: '#6B7280', color: '#fff' }
            return (
              <div key={item.id} style={{
                background: abaixo ? '#FEF2F2' : (idx % 2 === 0 ? '#fff' : '#FAFAF8'),
                border: abaixo ? '1.5px solid #FECACA' : '1.5px solid #E6DDD5',
                borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                padding: 16,
              }}
                onMouseEnter={e => !abaixo && (e.currentTarget.style.background = '#FFF7ED')}
                onMouseLeave={e => !abaixo && (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFAF8')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1A0E08', fontSize: 14 }}>{item.nome}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color, fontWeight: 600 }}>
                        {item.categoria}
                      </span>
                      {abaixo && (
                        <span style={{ fontSize: 11, background: '#C8221A', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={10} /> Estoque baixo
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: abaixo ? '#991B1B' : '#1A0E08' }}>
                        {item.quantidade} {item.unidade}
                      </span>
                      {Number(item.qtdMinima) > 0 && (
                        <span style={{ fontSize: 13, color: '#9D8878' }}>mín: {item.qtdMinima} {item.unidade}</span>
                      )}
                      {Number(item.preco) > 0 && (
                        <span style={{ fontSize: 13, color: '#6B5A4E' }}>
                          R$ {(Number(item.quantidade) * Number(item.preco)).toFixed(2).replace('.', ',')} em estoque
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => atualizarQuantidade(item.id, -1)}
                      style={{
                        width: 32, height: 32,
                        background: '#fff', border: '1.5px solid #CFC4BB',
                        borderRadius: 8, fontWeight: 700, color: '#6B5A4E',
                        cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      −
                    </button>
                    <button onClick={() => atualizarQuantidade(item.id, 1)}
                      style={{
                        width: 32, height: 32,
                        background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                        borderRadius: 8, fontWeight: 700, color: '#16A34A',
                        cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
                      +
                    </button>
                    <button onClick={() => iniciarEdicao(item)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removerEstoque(item.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
