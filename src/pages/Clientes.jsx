import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { UserPlus, Search, Pencil, Trash2, Phone, MapPin, X, Check } from 'lucide-react'

const VAZIO = { nome: '', telefone: '', endereco: '', observacoes: '' }

export default function Clientes() {
  const { clientes, adicionarCliente, editarCliente, removerCliente } = useApp()
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState(VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  )

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
    setForm({ nome: cliente.nome, telefone: cliente.telefone, endereco: cliente.endereco, observacoes: cliente.observacoes })
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clientes.length} cadastrado(s)</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">
            {editandoId ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="(32) 99999-9999"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={e => setForm({ ...form, endereco: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Rua, número, bairro"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                rows={2}
                placeholder="Preferências, alergias..."
              />
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
          {filtrados.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{cliente.nome}</p>
                <div className="flex gap-4 mt-1">
                  {cliente.telefone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone size={11} /> {cliente.telefone}
                    </span>
                  )}
                  {cliente.endereco && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} /> {cliente.endereco}
                    </span>
                  )}
                </div>
                {cliente.observacoes && (
                  <p className="text-xs text-amber-600 mt-1">{cliente.observacoes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => iniciarEdicao(cliente)} className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => removerCliente(cliente.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
