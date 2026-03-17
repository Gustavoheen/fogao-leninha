import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import {
  Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Save,
  UtensilsCrossed, GlassWater, Package, Flame, Beef, Salad, ImagePlus, Loader2
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
  textTransform: 'uppercase',
}

export default function Cardapio() {
  const {
    cardapioHoje,
    salvarCarnes, salvarPrecos, salvarAcompanhamentos, salvarNomeOpcao, toggleOpcaoAlmoco, salvarOpcao, salvarSalada,
    cardapio, adicionarItemCardapio, toggleDisponibilidade, removerItemCardapio,
  } = useApp()

  const refrigerantes = cardapio.filter(i => i.categoria === 'Refrigerante')
  const combos = cardapio.filter(i => i.categoria === 'Combo')

  const [formRefrig, setFormRefrig] = useState(FORM_REFRIG_VAZIO)
  const [addRefrig, setAddRefrig] = useState(false)
  const [formCombo, setFormCombo] = useState(FORM_COMBO_VAZIO)
  const [addCombo, setAddCombo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [salvandoImagem, setSalvandoImagem] = useState(false)
  const [imagemUrl, setImagemUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')

  // Carregar imagemUrl da row de metadados do Supabase (id=99)
  useState(() => {
    supabase.from('cardapio_hoje').select('opcoes').eq('id', 99).single()
      .then(({ data }) => {
        if (data?.opcoes?.imagemUrl) {
          setImagemUrl(data.opcoes.imagemUrl)
          setInputUrl(data.opcoes.imagemUrl)
        }
      })
  })

  async function salvarImagem() {
    const url = inputUrl.trim()
    setSalvandoImagem(true)
    try {
      await supabase.from('cardapio_hoje').upsert({ id: 99, opcoes: { imagemUrl: url || null } })
      setImagemUrl(url)
    } catch (err) {
      alert('Erro ao salvar imagem: ' + err.message)
    } finally {
      setSalvandoImagem(false)
    }
  }

  async function removerImagem() {
    setImagemUrl('')
    setInputUrl('')
    await supabase.from('cardapio_hoje').upsert({ id: 99, opcoes: { imagemUrl: null } })
  }

  async function salvarTudo() {
    setSalvando(true)
    const ts = new Date().toISOString()
    // Salvar apenas colunas conhecidas da tabela (salada fica só no localStorage)
    const { salada: _s, ...dadosSupabase } = cardapioHoje
    const { error } = await supabase
      .from('cardapio_hoje')
      .upsert({ id: 1, ...dadosSupabase, atualizadoEm: ts })
    // Salvar imagemUrl na row de metadados (id=99) sem precisar de nova coluna
    if (imagemUrl) {
      await supabase.from('cardapio_hoje').upsert({ id: 99, opcoes: { imagemUrl } })
    }
    setSalvando(false)
    if (!error) {
      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

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

      {/* Imagem do Cardápio para WhatsApp */}
      <section style={{
        background: '#fff', border: '1.5px solid #E6DDD5',
        borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 20,
      }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#7C3AED', marginTop: 0, marginBottom: 4 }}>
          <ImagePlus size={17} /> Imagem do Cardápio (WhatsApp)
        </h2>
        <p style={{ fontSize: 12, color: '#9D8878', margin: '0 0 14px' }}>
          O bot envia essa imagem automaticamente quando o cliente pede o cardápio
        </p>

        {/* Preview da imagem */}
        {imagemUrl && (
          <div style={{ marginBottom: 14 }}>
            <img src={imagemUrl} alt="Cardápio" onError={() => setImagemUrl('')}
              style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #E6DDD5', display: 'block' }} />
          </div>
        )}

        {/* Input de URL */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="url"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="Cole aqui o link da imagem (ex: https://...)"
            style={{ flex: 1, minWidth: 200, background: '#fff', border: '1.5px solid #C4B5FD', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08' }}
          />
          <button onClick={salvarImagem} disabled={salvandoImagem}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {salvandoImagem ? <Loader2 size={13} /> : <Check size={13} />}
            {salvandoImagem ? 'Salvando...' : 'Salvar'}
          </button>
          {imagemUrl && (
            <button onClick={removerImagem}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#991B1B', border: '1.5px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#9D8878', margin: '8px 0 0' }}>
          Tire foto do cardápio, envie para o Google Drive ou WhatsApp Web, copie o link público e cole aqui
        </p>
      </section>

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
            onOpcao={dados => salvarOpcao(opcao.id, dados)}
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

      {/* Salada personalizada */}
      <SaladaSection cardapioHoje={cardapioHoje} salvarSalada={salvarSalada} />

      {/* Botão Salvar cardápio do dia */}
      <button
        onClick={salvarTudo}
        disabled={salvando}
        style={{
          width: '100%',
          padding: '20px 0',
          borderRadius: 14,
          border: 'none',
          background: salvo ? '#16A34A' : salvando ? '#CFC4BB' : '#EA580C',
          color: '#fff',
          fontSize: 18,
          fontWeight: 900,
          cursor: salvando ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: salvo
            ? '0 4px 16px rgba(22,163,74,0.35)'
            : salvando ? 'none'
            : '0 4px 16px rgba(234,88,12,0.35)',
          transition: 'all 0.2s',
          letterSpacing: '0.02em',
        }}
      >
        {salvo
          ? <><Check size={22} /> Cardápio salvo com sucesso!</>
          : salvando
          ? 'Salvando...'
          : <><Save size={22} /> Salvar cardápio do dia</>
        }
      </button>
    </div>
  )
}

// Seção de Salada Personalizada
function SaladaSection({ cardapioHoje, salvarSalada }) {
  const saladaRaw = cardapioHoje?.salada || {}
  const salada = {
    disponivel: saladaRaw.disponivel ?? false,
    preco: saladaRaw.preco ?? '',
    ingredientes: saladaRaw.ingredientes ?? [],
  }
  const [novoIngr, setNovoIngr] = useState('')

  function update(dados) {
    salvarSalada(dados)
  }

  function adicionarIngrediente() {
    const val = novoIngr.trim()
    if (!val) return
    update({ ingredientes: [...salada.ingredientes, val] })
    setNovoIngr('')
  }

  function removerIngrediente(item) {
    update({ ingredientes: salada.ingredientes.filter(i => i !== item) })
  }

  return (
    <section style={{
      background: '#fff', border: '1.5px solid #E6DDD5',
      borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      <div style={{ background: '#16A34A', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Salad size={17} color="#fff" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Salada Personalizada</h2>
        </div>
        <button onClick={() => update({ disponivel: !salada.disponivel })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.85)' }}>
          {salada.disponivel ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      <div style={{ padding: 16, opacity: salada.disponivel ? 1 : 0.5 }}>
        {/* Preço */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6B5A4E', marginBottom: 6 }}>Preço da salada (R$)</label>
          <input
            type="number" min="0" step="0.01"
            value={salada.preco}
            onChange={e => update({ preco: e.target.value })}
            disabled={!salada.disponivel}
            style={{ ...INPUT_BASE, maxWidth: 180 }}
            placeholder="Ex: 8,00"
          />
        </div>

        {/* Ingredientes */}
        <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Ingredientes disponíveis
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 28 }}>
          {salada.ingredientes.length === 0 && (
            <p style={{ fontSize: 12, color: '#CFC4BB', fontStyle: 'italic' }}>Nenhum ingrediente ainda</p>
          )}
          {salada.ingredientes.map(ingr => (
            <span key={ingr} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#DCFCE7', color: '#166534',
              fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
            }}>
              {ingr}
              <button onClick={() => removerIngrediente(ingr)} disabled={!salada.disponivel}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', display: 'flex', alignItems: 'center' }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={novoIngr}
            onChange={e => setNovoIngr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarIngrediente()}
            disabled={!salada.disponivel}
            style={{ flex: 1, background: '#fff', border: '1.5px solid #CFC4BB', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08' }}
            placeholder="Ex: Alface, Tomate, Cenoura..."
          />
          <button onClick={adicionarIngrediente} disabled={!salada.disponivel}
            style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}>
            <Plus size={13} />
          </button>
        </div>

        {!salada.disponivel && (
          <p style={{ fontSize: 12, color: '#9D8878', marginTop: 10, fontStyle: 'italic' }}>
            Ative o toggle para liberar a salada nos pedidos.
          </p>
        )}
      </div>
    </section>
  )
}

// Card de cada opção de almoço
function OpcaoCard({ opcao, cor, onNome, onAcomp, onToggle, onOpcao }) {
  const [novoItem, setNovoItem] = useState('')
  const [editandoNome, setEditandoNome] = useState(false)
  const [nomeTemp, setNomeTemp] = useState(opcao.nome)
  const tipoCarnes = opcao.tipoCarnes || 'globais'
  const pratoEspecial = opcao.pratoEspecial || ''
  const [pratoTemp, setPratoTemp] = useState(pratoEspecial)

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

        {/* Tipo de carnes para esta opção */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F0ED' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B5A4E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Proteína desta opção
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: tipoCarnes === 'especial' ? 8 : 0 }}>
            <button
              onClick={() => onOpcao({ tipoCarnes: 'globais', pratoEspecial: '' })}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: tipoCarnes === 'globais' ? `2px solid ${HEADER_BG}` : '1.5px solid #CFC4BB',
                background: tipoCarnes === 'globais' ? '#FFF7ED' : '#fff',
                color: tipoCarnes === 'globais' ? HEADER_BG : '#9D8878',
                cursor: 'pointer',
              }}
            >
              🥩 Carnes livres
            </button>
            <button
              onClick={() => onOpcao({ tipoCarnes: 'especial', pratoEspecial: pratoTemp })}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: tipoCarnes === 'especial' ? `2px solid ${HEADER_BG}` : '1.5px solid #CFC4BB',
                background: tipoCarnes === 'especial' ? '#FFF7ED' : '#fff',
                color: tipoCarnes === 'especial' ? HEADER_BG : '#9D8878',
                cursor: 'pointer',
              }}
            >
              🍲 Prato especial
            </button>
          </div>
          {tipoCarnes === 'especial' && (
            <input
              type="text"
              value={pratoTemp}
              onChange={e => setPratoTemp(e.target.value)}
              onBlur={() => { if (pratoTemp.trim()) onOpcao({ tipoCarnes: 'especial', pratoEspecial: pratoTemp.trim() }) }}
              onKeyDown={e => { if (e.key === 'Enter' && pratoTemp.trim()) onOpcao({ tipoCarnes: 'especial', pratoEspecial: pratoTemp.trim() }) }}
              placeholder="Ex: Strogonoff de frango em cubos"
              style={{
                width: '100%', background: '#fff', border: `1.5px solid ${HEADER_BG}`,
                borderRadius: 8, padding: '8px 10px', fontSize: 13,
                outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1A0E08',
                boxSizing: 'border-box',
              }}
            />
          )}
          {tipoCarnes === 'globais' && (
            <p style={{ fontSize: 11, color: '#9D8878', margin: 0 }}>
              Cliente escolhe entre as carnes globais cadastradas acima
            </p>
          )}
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
