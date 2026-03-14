import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { UserCheck, Plus, X, Check, Bike } from 'lucide-react'

const FORM_VAZIO = {
  nome: '',
  cargo: '',
  salario: '',
  dataAdmissao: '',
  ativo: true,
  observacoes: '',
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

  // Motoboys vindos dos funcionários (cargo contém motoboy ou entregador)
  const motoboysFuncionarios = funcionarios
    .filter(f => f.ativo !== false && (
      f.cargo?.toLowerCase().includes('motoboy') || f.cargo?.toLowerCase().includes('entregador')
    ))
    .map(f => f.nome)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Funcionários</h1>
          <p className="text-sm text-gray-500">{ativos.length} ativo(s) • Folha: R$ {totalFolha.toFixed(2).replace('.', ',')}</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(FORM_VAZIO) }}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Funcionário
        </button>
      </div>

      {/* Folha de pagamento */}
      {funcionarios.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-amber-700">Folha de Pagamento</p>
            <p className="text-2xl font-bold text-amber-900">R$ {totalFolha.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs text-amber-600 mt-1">{ativos.length} funcionário(s) ativo(s)</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Ativos</p>
            <p className="text-2xl font-bold text-green-700">{ativos.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Inativos</p>
            <p className="text-2xl font-bold text-gray-400">{inativos.length}</p>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 mb-5 shadow-sm">
          <h2 className="font-semibold text-amber-900 mb-4">{editandoId ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
              <input type="text" value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <input type="text" value={form.cargo}
                onChange={e => setForm(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Ex: Motoboy, Cozinheiro..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Salário (R$)</label>
              <input type="number" min="0" step="0.01" value={form.salario}
                onChange={e => setForm(prev => ({ ...prev, salario: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de Admissão</label>
              <input type="date" value={form.dataAdmissao}
                onChange={e => setForm(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setForm(prev => ({ ...prev, ativo: !prev.ativo }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                  form.ativo ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                {form.ativo ? <><Check size={12} /> Ativo</> : 'Inativo'}
              </button>
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

      {/* Lista de funcionários */}
      {ativos.length === 0 && inativos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <UserCheck size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum funcionário cadastrado</p>
        </div>
      ) : (
        <>
          {ativos.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Funcionários Ativos</h3>
              <div className="grid gap-3">
                {ativos.map(f => <FuncionarioCard key={f.id} funcionario={f} onEditar={iniciarEdicao} onRemover={removerFuncionario} onToggle={editarFuncionario} />)}
              </div>
            </div>
          )}
          {inativos.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inativos</h3>
              <div className="grid gap-3">
                {inativos.map(f => <FuncionarioCard key={f.id} funcionario={f} onEditar={iniciarEdicao} onRemover={removerFuncionario} onToggle={editarFuncionario} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Seção Motoboys */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-amber-900 mb-1 flex items-center gap-2">
          <Bike size={18} /> Motoboys para Entrega
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Lista usada na atribuição de entregas nos pedidos.
          {motoboysFuncionarios.length > 0 && ' Funcionários com cargo de motoboy/entregador são adicionados automaticamente.'}
        </p>

        {motoboysFuncionarios.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2">Do cadastro de funcionários:</p>
            <div className="flex flex-wrap gap-2">
              {motoboysFuncionarios.map(nome => (
                <span key={nome} className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium">
                  {nome}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <input type="text" value={novoMotoboy} onChange={e => setNovoMotoboy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarMotoboyNovo()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Adicionar motoboy avulso..." />
          <button onClick={adicionarMotoboyNovo}
            className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
          </button>
        </div>

        {motoboys.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {motoboys.map(nome => (
              <div key={nome} className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium">
                {nome}
                <button onClick={() => removerMotoboy(nome)} className="text-amber-600 hover:text-red-600 ml-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {motoboys.length === 0 && motoboysFuncionarios.length === 0 && (
          <p className="text-xs text-gray-400">Nenhum motoboy cadastrado. Adicione acima ou cadastre funcionários com cargo "Motoboy".</p>
        )}
      </div>
    </div>
  )
}

function FuncionarioCard({ funcionario: f, onEditar, onRemover, onToggle }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${f.ativo === false ? 'border-gray-100 opacity-70' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{f.nome}</span>
            {f.cargo && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{f.cargo}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {f.ativo !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {Number(f.salario) > 0 && (
            <p className="text-sm font-bold text-gray-700 mt-1">R$ {Number(f.salario).toFixed(2).replace('.', ',')}/mês</p>
          )}
          {f.dataAdmissao && (
            <p className="text-xs text-gray-400">Desde {new Date(f.dataAdmissao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
          )}
          {f.observacoes && <p className="text-xs text-gray-400 italic mt-0.5">{f.observacoes}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(f.id, { ativo: f.ativo === false })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${f.ativo !== false ? 'text-gray-400 border-gray-200 hover:border-gray-300' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
            {f.ativo !== false ? 'Desativar' : 'Ativar'}
          </button>
          <button onClick={() => onEditar(f)} className="text-xs text-gray-400 hover:text-amber-600">Editar</button>
          <button onClick={() => onRemover(f.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      </div>
    </div>
  )
}
