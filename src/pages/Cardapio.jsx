import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, ToggleLeft, ToggleRight, X, Check,
  UtensilsCrossed, GlassWater, Package, Flame, Beef
} from 'lucide-react'

const SUBTIPOS_REFRIGERANTE = ['Lata', 'Mini', '2 Litros']
const FORM_REFRIG_VAZIO = { nome: '', subtipo: 'Lata', preco: '' }
const FORM_COMBO_VAZIO = { nome: '', descricao: '', preco: '' }

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

export default function Cardapio() {
  const {
    cardapioHoje,
    salvarCarnes, salvarPrecos, salvarAcompanhamentos, salvarNomeOpcao, toggleOpcaoAlmoco,
    cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
    config, salvarConfig,
  } = useApp()

  const refrigerantes = cardapio.filter(i => i.categoria === 'Refrigerante')
  const combos = cardapio.filter(i => i.categoria === 'Combo')

  const [configLocal, setConfigLocal] = useState({ whatsapp: config?.whatsapp || '', pixChave: config?.pixChave || '', pixNome: config?.pixNome || 'Fogão a Lenha da Leninha' })
  const [configSalvo, setConfigSalvo] = useState(false)

  const [formRefrig, setFormRefrig] = useState(FORM_REFRIG_VAZIO)
  const [addRefrig, setAddRefrig] = useState(false)
  const [formCombo, setFormCombo] = useState(FORM_COMBO_VAZIO)
  const [addCombo, setAddCombo] = useState(false)

  function salvarRefrig() {
    if (!formRefrig.nome.trim() || !formRefrig.preco) return
    adicionarItemCardapio({ nome: formRefrig.nome, categoria: 'Refrigerante', subtipo: formRefrig.subtipo, preco: parseFloat(formRefrig.preco) })
    setFormRefrig(FORM_REFRIG_VAZIO); setAddRefrig(false)
  }

  function salvarCombo() {
    if (!formCombo.nome.trim() || !formCombo.preco) return
    adicionarItemCardapio({ nome: formCombo.nome, categoria: 'Combo', descricao: formCombo.descricao, preco: parseFloat(formCombo.preco) })
    setFormCombo(FORM_COMBO_VAZIO); setAddCombo(false)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#1A0E08', margin: 0 }}>
          Cardápio do Dia
        </h1>
        <p style={{ fontSize: 13, color: '#9D8878', margin: '2px 0 0' }}>
          Configure as opções, acompanhamentos, carnes e bebidas
        </p>
        {cardapioHoje?.atualizadoEm && (
          <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            Configurado: {new Date(cardapioHoje.atualizadoEm).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} às {new Date(cardapioHoje.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Carnes e Tamanhos */}
      <section style={{
        background: '#fff', border: '1.5px solid #E6DDD5',
        borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 20,
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#991B1B', marginTop: 0, marginBottom: 16 }}>
          <Beef size={17} /> Carnes e Tamanhos
          <span style={{ fontSize: 12, fontWeight: 400, color: '#9D8878', marginLeft: 4 }}>(valem para as duas opções)</span>
        </h2>

        {/* Seção de preços */}
        <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#C8221A', marginTop: 0, marginBottom: 12 }}>
            Preços
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Preço Pequena (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={cardapioHoje.precoP}
                onChange={e => salvarPrecos(e.target.value, cardapioHoje.precoG)}
                style={INPUT_BASE}
                placeholder="Ex: 17,00"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Preço Grande (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={cardapioHoje.precoG}
                onChange={e => salvarPrecos(cardapioHoje.precoP, e.target.value)}
                style={INPUT_BASE}
                placeholder="Ex: 20,00"
              />
            </div>
          </div>
        </div>

        {/* Carnes */}
        <div style={{ background: '#FEF2F2', borderRadius: 10, padding: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#991B1B', marginTop: 0, marginBottom: 12 }}>
            Opções de carne (até 3)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#9D8878', width: 16, textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</span>
                <input
                  type="text"
                  value={cardapioHoje.carnes?.[idx] || ''}
                  onChange={e => {
                    const novas = [...(cardapioHoje.carnes || ['', '', ''])]
                    novas[idx] = e.target.value
                    salvarCarnes(novas)
                  }}
                  style={INPUT_BASE}
                  placeholder={`Carne ${idx + 1} — ex: Filé de Frango a Parmegiana`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opções de almoço */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {cardapioHoje.opcoes.map((opcao, idx) => (
          <OpcaoCard
            key={opcao.id}
            opcao={opcao}
            cor={idx === 0 ? 'orange' : 'amber'}
            onNome={nome => salvarNomeOpcao(opcao.id, nome)}
            onAcomp={lista => salvarAcompanhamentos(opcao.id, lista)}
            onToggle={() => toggleOpcaoAlmoco(opcao.id)}
          />
        ))}
      </div>

      {/* Refrigerantes */}
      <section style={{
        background: '#fff', border: '1.5px solid #E6DDD5',
        borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1D4ED8', margin: 0 }}>
            <GlassWater size={17} /> Refrigerantes
          </h2>
          <button
            onClick={() => setAddRefrig(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#2563EB', color: '#fff',
              borderRadius: 8, border: 'none',
              padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {addRefrig && (
          <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input type="text" value={formRefrig.nome} onChange={e => setFormRefrig({ ...formRefrig, nome: e.target.value })}
              style={INPUT_BASE} placeholder="Nome (ex: Coca-Cola)" />
            <select value={formRefrig.subtipo} onChange={e => setFormRefrig({ ...formRefrig, subtipo: e.target.value })}
              style={INPUT_BASE}>
              {SUBTIPOS_REFRIGERANTE.map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" min="0" step="0.01" value={formRefrig.preco}
                onChange={e => setFormRefrig({ ...formRefrig, preco: e.target.value })}
                style={{ ...INPUT_BASE, width: 'auto', flex: 1 }}
                placeholder="R$ 0,00" />
              <button onClick={salvarRefrig} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}><Check size={15} /></button>
              <button onClick={() => { setFormRefrig(FORM_REFRIG_VAZIO); setAddRefrig(false) }}
                style={{ background: '#fff', color: '#6B5A4E', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}><X size={15} /></button>
            </div>
          </div>
        )}

        {refrigerantes.length === 0
          ? <p style={{ fontSize: 13, color: '#9D8878', fontStyle: 'italic' }}>Nenhum refrigerante cadastrado</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {refrigerantes.map((item, idx) => (
                <ItemLine key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} cor="blue" idx={idx} />
              ))}
            </div>
        }
      </section>

      {/* Combos */}
      <section style={{
        background: '#fff', border: '1.5px solid #E6DDD5',
        borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#6D28D9', margin: 0 }}>
            <Package size={17} /> Combos
          </h2>
          <button
            onClick={() => setAddCombo(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#7C3AED', color: '#fff',
              borderRadius: 8, border: 'none',
              padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
            <Plus size={13} /> Adicionar
          </button>
        </div>

        {addCombo && (
          <div style={{ background: '#F5F3FF', borderRadius: 10, padding: 12, marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input type="text" value={formCombo.nome} onChange={e => setFormCombo({ ...formCombo, nome: e.target.value })}
              style={INPUT_BASE} placeholder="Nome do combo" />
            <input type="text" value={formCombo.descricao} onChange={e => setFormCombo({ ...formCombo, descricao: e.target.value })}
              style={INPUT_BASE} placeholder="Descrição" />
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" min="0" step="0.01" value={formCombo.preco}
                onChange={e => setFormCombo({ ...formCombo, preco: e.target.value })}
                style={{ ...INPUT_BASE, width: 'auto', flex: 1 }}
                placeholder="R$ 0,00" />
              <button onClick={salvarCombo} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}><Check size={15} /></button>
              <button onClick={() => { setFormCombo(FORM_COMBO_VAZIO); setAddCombo(false) }}
                style={{ background: '#fff', color: '#6B5A4E', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}><X size={15} /></button>
            </div>
          </div>
        )}

        {combos.length === 0
          ? <p style={{ fontSize: 13, color: '#9D8878', fontStyle: 'italic' }}>Nenhum combo cadastrado</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {combos.map((item, idx) => (
                <ItemLine key={item.id} item={item} onToggle={toggleDisponibilidade} onRemover={removerItemCardapio} cor="purple" idx={idx} />
              ))}
            </div>
        }
      </section>

      {/* Config Pedido Online */}
      <section style={{
        background: '#fff', border: '1.5px solid #E6DDD5',
        borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 20,
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#1D4ED8', marginTop: 0, marginBottom: 16 }}>
          ⚙️ Configurações do Pedido Online
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>WhatsApp do restaurante (com DDI, ex: 5532999999999)</label>
            <input type="text" value={configLocal.whatsapp}
              onChange={e => setConfigLocal(p => ({ ...p, whatsapp: e.target.value }))}
              style={{ background: '#fff', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08', boxSizing: 'border-box' }}
              placeholder="5532999999999" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Chave PIX</label>
            <input type="text" value={configLocal.pixChave}
              onChange={e => setConfigLocal(p => ({ ...p, pixChave: e.target.value }))}
              style={{ background: '#fff', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08', boxSizing: 'border-box' }}
              placeholder="CPF, email, telefone ou chave aleatória" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Nome do titular PIX</label>
            <input type="text" value={configLocal.pixNome}
              onChange={e => setConfigLocal(p => ({ ...p, pixNome: e.target.value }))}
              style={{ background: '#fff', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08', boxSizing: 'border-box' }}
              placeholder="Nome completo ou do restaurante" />
          </div>
        </div>
        <button onClick={() => { salvarConfig(configLocal); setConfigSalvo(true); setTimeout(() => setConfigSalvo(false), 2000) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: configSalvo ? '#16A34A' : '#1D4ED8', color: '#fff',
            padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          }}>
          {configSalvo ? '✓ Salvo!' : 'Salvar Configurações'}
        </button>
      </section>
    </div>
  )
}

// Card de cada opção de almoço
function OpcaoCard({ opcao, cor, onNome, onAcomp, onToggle }) {
  const [novoItem, setNovoItem] = useState('')
  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(opcao.nome)

  const HEADER_BG = cor === 'orange' ? '#EA580C' : '#B45309'

  function adicionarItem() {
    const val = novoItem.trim()
    if (!val) return
    onAcomp([...opcao.acompanhamentos, val])
    setNovoItem('')
  }

  function removerItem(item) {
    onAcomp(opcao.acompanhamentos.filter(a => a !== item))
  }

  function confirmarNome() {
    if (nomeTemp.trim()) onNome(nomeTemp.trim())
    setEditandoNome(false)
  }

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #E6DDD5',
      borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden', opacity: opcao.disponivel ? 1 : 0.6,
    }}>
      {/* Header colorido */}
      <div style={{ background: HEADER_BG, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
          {editandoNome ? (
            <input
              autoFocus
              value={nomeTemp}
              onChange={e => setNomeTemp(e.target.value)}
              onBlur={confirmarNome}
              onKeyDown={e => e.key === 'Enter' && confirmarNome()}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 6, padding: '3px 8px', fontSize: 13, fontWeight: 700,
                color: '#fff', width: 112, outline: 'none',
              }}
            />
          ) : (
            <button onClick={() => { setNomeTemp(opcao.nome); setEditandoNome(true) }}
              style={{ fontWeight: 700, color: '#fff', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}>
              {opcao.nome}
            </button>
          )}
        </div>
        <button onClick={onToggle} style={{ color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {opcao.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
      </div>

      {/* Acompanhamentos */}
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B5A4E', marginTop: 0, marginBottom: 10 }}>
          Acompanhamentos
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, minHeight: 24 }}>
          {opcao.acompanhamentos.length === 0 && (
            <p style={{ fontSize: 12, color: '#CFC4BB', fontStyle: 'italic' }}>Nenhum item ainda</p>
          )}
          {opcao.acompanhamentos.map(a => (
            <span key={a} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#F3F4F6', color: '#374151',
              fontSize: 12, padding: '4px 10px', borderRadius: 20,
            }}>
              {a}
              <button onClick={() => removerItem(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
                onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={novoItem}
            onChange={e => setNovoItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarItem()}
            style={{
              flex: 1, background: '#fff', border: '1.5px solid #CFC4BB',
              borderRadius: 8, padding: '7px 10px', fontSize: 12,
              outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08',
            }}
            placeholder="Ex: Arroz, Feijão, Farofa..."
          />
          <button onClick={adicionarItem}
            style={{ background: HEADER_BG, color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}>
            <Plus size={13} />
          </button>
        </div>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F0ED' }}>
          <p style={{ fontSize: 13, color: '#9D8878', margin: 0 }}>
            🥩 Carnes: <span style={{ fontWeight: 600, color: '#6B5A4E' }}>globais (configuradas acima)</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Item de linha (refrigerante / combo)
function ItemLine({ item, onToggle, onRemover, cor, idx }) {
  const BADGE_BG = cor === 'blue' ? '#2563EB' : '#7C3AED'
  const ROW_BG = idx % 2 === 0 ? '#fff' : '#FAFAF8'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 8,
      border: '1px solid #E6DDD5',
      background: item.disponivel ? ROW_BG : '#F9FAFB',
      opacity: item.disponivel ? 1 : 0.55,
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
      onMouseLeave={e => e.currentTarget.style.background = item.disponivel ? ROW_BG : '#F9FAFB'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A0E08' }}>{item.nome}</span>
        {item.subtipo && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: BADGE_BG, color: '#fff', fontWeight: 600 }}>
            {item.subtipo}
          </span>
        )}
        {item.descricao && <span style={{ fontSize: 13, color: '#9D8878' }}>{item.descricao}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</span>
        <button onClick={() => onToggle(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.disponivel ? '#16A34A' : '#9D8878' }}>
          {item.disponivel ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
        </button>
        <button onClick={() => onRemover(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878' }}
          onMouseEnter={e => e.currentTarget.style.color = '#C8221A'}
          onMouseLeave={e => e.currentTarget.style.color = '#9D8878'}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
