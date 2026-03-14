import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Truck, Plus, X, Check, Phone } from 'lucide-react'

const FORM_VAZIO = {
  nome: '',
  contato: '',
  telefone: '',
  produtos: '',
  valorMensal: '',
  diaPagamento: '',
  observacoes: '',
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Fornecedores</h1>
          <p className="text-sm text-gray-500">
            {fornecedores.length} fornecedor(es) • Total mensal: R$ {totalMensal.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Fornecedor
        </button>
      </div>

      {/* Resumo */}
      {fornecedores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Mensal</p>
            <p className="text-2xl font-bold text-gray-800">R$ {totalMensal.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className={`border rounded-xl p-4 shadow-sm ${totalPendente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs ${totalPendente > 0 ? 'text-orange-600' : 'text-green-600'}`}>Pendente de Pagamento</p>
            <p className={`text-2xl font-bold ${totalPendente > 0 ? 'text-orange-800' : 'text-green-700'}`}>
              R$ {totalPendente.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">{editandoId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Empresa / Fornecedor</label>
              <input type="text" value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: Distribuidora Silva..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contato (responsável)</label>
              <input type="text" value={form.contato}
                onChange={e => setForm(prev => ({ ...prev, contato: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome do responsável" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input type="text" value={form.telefone}
                onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="(32) 99999-9999" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Produtos fornecidos</label>
              <input type="text" value={form.produtos}
                onChange={e => setForm(prev => ({ ...prev, produtos: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: Carnes, frango, carne bovina..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor Mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valorMensal}
                onChange={e => setForm(prev => ({ ...prev, valorMensal: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dia de Pagamento</label>
              <input type="number" min="1" max="31" value={form.diaPagamento}
                onChange={e => setForm(prev => ({ ...prev, diaPagamento: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: 15" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <input type="text" value={form.observacoes}
                onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Informações adicionais..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={salvar} disabled={!form.nome.trim()}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              <Check size={15} /> {editandoId ? 'Salvar' : 'Adicionar'}
            </button>
            <button onClick={cancelar}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {fornecedores.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum fornecedor cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {fornecedores.map(f => (
            <div key={f.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!f.pago && f.valorMensal > 0 ? 'border-orange-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{f.nome}</span>
                    {f.produtos && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{f.produtos}</span>
                    )}
                  </div>
                  {f.contato && <p className="text-xs text-gray-500">Contato: {f.contato}</p>}
                  {f.telefone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone size={10} /> {f.telefone}
                    </p>
                  )}
                  {f.diaPagamento && (
                    <p className="text-xs text-gray-400 mt-1">Pagamento: todo dia {f.diaPagamento}</p>
                  )}
                  {f.observacoes && <p className="text-xs text-gray-400 mt-1 italic">{f.observacoes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {Number(f.valorMensal) > 0 && (
                    <span className="font-bold text-gray-800">R$ {Number(f.valorMensal).toFixed(2).replace('.', ',')}/mês</span>
                  )}
                  {Number(f.valorMensal) > 0 && (
                    <button
                      onClick={() => pagarFornecedor(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        f.pago
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                      }`}>
                      {f.pago ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => iniciarEdicao(f)} className="text-xs text-gray-400 hover:text-amber-600">Editar</button>
                    <button onClick={() => removerFornecedor(f.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
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
