import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Save, Check, Copy, ExternalLink, Settings, Smartphone, Lock, ToggleLeft, ToggleRight } from 'lucide-react'

function Campo({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-stone-500 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
    />
  )
}

function Secao({ titulo, icone, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
        <span className="text-stone-600">{icone}</span>
        <h2 className="font-bold text-stone-800">{titulo}</h2>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

export default function Configuracoes() {
  const { config, salvarConfig } = useApp()

  const [form, setForm] = useState({
    pixChave: '',
    pixNome: 'Fogão a Lenha da Leninha',
    pixBanco: '',
    restauranteWhatsapp: '',
    lojaAberta: true,
    equipePIN: '1234',
  })
  const [salvo, setSalvo] = useState(false)
  const [copiado, setCopiad] = useState(null)

  useEffect(() => {
    if (config) setForm(prev => ({ ...prev, ...config }))
  }, [config])

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function salvar() {
    salvarConfig(form)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  function copiar(texto, key) {
    navigator.clipboard.writeText(texto)
    setCopiad(key)
    setTimeout(() => setCopiad(null), 2000)
  }

  const urlBase = window.location.origin
  const urlPublica = urlBase + '/'
  const urlEquipe = urlBase + '/equipe'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Configurações</h1>
          <p className="text-stone-500 text-sm mt-0.5">Ajustes do restaurante e do sistema</p>
        </div>
        <button
          onClick={salvar}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            salvo
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {salvo ? <Check size={16} /> : <Save size={16} />}
          {salvo ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Pix */}
      <Secao titulo="Pagamento via Pix" icone={<Smartphone size={18} />}>
        <Campo label="Chave Pix" hint="CPF, CNPJ, e-mail, telefone ou chave aleatória">
          <Input
            value={form.pixChave}
            onChange={e => set('pixChave', e.target.value)}
            placeholder="Ex: 55321234-5678 ou chave@email.com"
          />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Nome do favorecido">
            <Input
              value={form.pixNome}
              onChange={e => set('pixNome', e.target.value)}
              placeholder="Nome no Pix"
            />
          </Campo>
          <Campo label="Banco">
            <Input
              value={form.pixBanco}
              onChange={e => set('pixBanco', e.target.value)}
              placeholder="Ex: Nubank, Caixa..."
            />
          </Campo>
        </div>
        {form.pixChave && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 mb-1">Prévia — como o cliente verá</p>
            <p className="font-mono text-stone-800 text-sm">{form.pixChave}</p>
            {form.pixNome && <p className="text-xs text-stone-500 mt-0.5">{form.pixNome}</p>}
          </div>
        )}
      </Secao>

      {/* WhatsApp */}
      <Secao titulo="WhatsApp do restaurante" icone={<Smartphone size={18} />}>
        <Campo
          label="Número do WhatsApp"
          hint="Com DDI e DDD, só números. Ex: 5532912345678"
        >
          <Input
            value={form.restauranteWhatsapp}
            onChange={e => set('restauranteWhatsapp', e.target.value.replace(/\D/g, ''))}
            placeholder="5532912345678"
            type="tel"
          />
        </Campo>
        <p className="text-xs text-stone-500">
          Usado para que clientes que pagaram via Pix enviem o comprovante diretamente para este número.
        </p>
      </Secao>

      {/* Loja */}
      <Secao titulo="Status da loja" icone={<Settings size={18} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-stone-800">Loja aberta para pedidos online</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Quando fechada, a página pública exibe mensagem de encerramento
            </p>
          </div>
          <button
            onClick={() => set('lojaAberta', !form.lojaAberta)}
            className={`transition-colors ${form.lojaAberta ? 'text-green-500' : 'text-stone-400'}`}
          >
            {form.lojaAberta
              ? <ToggleRight size={40} />
              : <ToggleLeft size={40} />}
          </button>
        </div>
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          form.lojaAberta
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {form.lojaAberta ? '✅ Aberta — clientes podem fazer pedidos' : '🔒 Fechada — pedidos bloqueados'}
        </div>
      </Secao>

      {/* PIN da equipe */}
      <Secao titulo="Área da equipe" icone={<Lock size={18} />}>
        <Campo
          label="PIN de acesso da equipe"
          hint="Código que a equipe digita para acessar a página /equipe"
        >
          <Input
            value={form.equipePIN}
            onChange={e => set('equipePIN', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="1234"
            type="password"
          />
        </Campo>
        <p className="text-xs text-stone-500">Mínimo 4 dígitos. Padrão: 1234</p>
      </Secao>

      {/* Links */}
      <Secao titulo="Links do sistema" icone={<ExternalLink size={18} />}>
        {[
          { label: 'Página pública de pedidos', url: urlPublica, key: 'pub' },
          { label: 'Área da equipe', url: urlEquipe, key: 'eq' },
        ].map(({ label, url, key }) => (
          <div key={key} className="flex items-center justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-stone-500">{label}</p>
              <p className="text-stone-700 text-sm font-mono truncate">{url}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copiar(url, key)}
                className="p-2 rounded-lg hover:bg-stone-200 transition-colors text-stone-500"
                title="Copiar"
              >
                {copiado === key ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-stone-200 transition-colors text-stone-500"
                title="Abrir"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        ))}
      </Secao>

      {/* Botão salvar no final */}
      <button
        onClick={salvar}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
          salvo ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {salvo ? <Check size={18} /> : <Save size={18} />}
        {salvo ? 'Configurações salvas!' : 'Salvar configurações'}
      </button>
    </div>
  )
}
