import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { UserPlus, Search, Pencil, Trash2, Phone, MapPin, X, Check, AlertCircle, Star } from 'lucide-react'

const VAZIO = { nome: '', telefone: '', endereco: '', observacoes: '', tipo: 'normal' }

export default function Clientes() {
  const { clientes, adicionarCliente, editarCliente, removerCliente, debitoPendente } = useApp()
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtrados = clientes.filter(c => {
    const buscaOk = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.telefone || '').includes(busca) ||
      (c.endereco || '').toLowerCase().includes(busca.toLowerCase())
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
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clientes.length} cadastrado(s) · {totalMensalistas} mensalista(s)</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Alerta de débito mensalistas */}
      {totalDebitoPendente > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700">
            Mensalistas com débito total de <strong>R$ {totalDebitoPendente.toFixed(2).replace('.', ',')}</strong>
          </p>
        </div>
      )}

      {/* Busca + filtro */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, telefone ou endereço..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
        </div>
        <div className="flex gap-1">
          {[['todos', 'Todos'], ['normal', 'Normal'], ['mensalista', 'Mensalista']].map(([key, label]) => (
            <button key={key} onClick={() => setFiltroTipo(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filtroTipo === key ? 'bg-amber-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">{editandoId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="(32) 99999-9999" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
              <input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Rua, número, bairro" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Cliente</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="normal">Normal</option>
                <option value="mensalista">Mensalista (paga depois)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <input type="text" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Preferências, alergias..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={salvar} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={15} /> Salvar
            </button>
            <button onClick={cancelar} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtrados.map(cliente => {
            const debito = debitoPendente(cliente.id)
            return (
              <div key={cliente.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${debito > 0 ? 'border-orange-200' : 'border-gray-100'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{cliente.nome}</p>
                    {cliente.tipo === 'mensalista' && (
                      <span className="flex items-center gap-0.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                        <Star size={10} /> Mensalista
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 flex-wrap">
                    {cliente.telefone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} /> {cliente.telefone}</span>
                    )}
                    {cliente.endereco && (
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} /> {cliente.endereco}</span>
                    )}
                  </div>
                  {cliente.observacoes && <p className="text-xs text-amber-600 mt-1">{cliente.observacoes}</p>}
                  {debito > 0 && (
                    <p className="text-xs text-orange-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> Débito pendente: R$ {debito.toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => iniciarEdicao(cliente)} className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => removerCliente(cliente.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
