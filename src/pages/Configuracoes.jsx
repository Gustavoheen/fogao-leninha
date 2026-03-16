import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Save, Check, Copy, ExternalLink, Settings, Smartphone, Lock, ToggleLeft, ToggleRight, QrCode, Link, Eye, EyeOff } from 'lucide-react'

function Campo({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-base font-black text-stone-800 tracking-wide">{label}</label>
      {hint && <p className="text-sm font-medium text-stone-400 -mt-1">{hint}</p>}
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
      className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-5 py-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-semibold"
      style={{ fontSize: 16 }}
    />
  )
}

function Secao({ titulo, icone, cor = 'orange', children }) {
  const cores = {
    orange: { header: 'bg-orange-500', icon: 'text-white', title: 'text-white', dot: 'bg-orange-200' },
    green:  { header: 'bg-green-600',  icon: 'text-white', title: 'text-white', dot: 'bg-green-200' },
    blue:   { header: 'bg-blue-600',   icon: 'text-white', title: 'text-white', dot: 'bg-blue-200' },
    purple: { header: 'bg-violet-600', icon: 'text-white', title: 'text-white', dot: 'bg-violet-200' },
    slate:  { header: 'bg-stone-700',  icon: 'text-white', title: 'text-white', dot: 'bg-stone-400' },
  }
  const c = cores[cor]
  return (
    <div className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden">
      <div className={`px-6 py-5 flex items-center gap-3 ${c.header}`}>
        <span className={c.icon}>{icone}</span>
        <h2 className={`text-xl font-black tracking-wide ${c.title}`}>{titulo}</h2>
      </div>
      <div className="p-6 space-y-6">
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
    senhaAdmin: 'fogao2024',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
  const urlAdmin = urlBase + '/login'

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header da página */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-stone-100">
        <div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">Configurações</h1>
          <p className="text-stone-500 text-base font-medium mt-1">Ajustes do restaurante e do sistema</p>
        </div>
        <button
          onClick={salvar}
          className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-base transition-all shadow-md ${
            salvo
              ? 'bg-green-500 text-white shadow-green-200'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
          }`}
        >
          {salvo ? <Check size={20} /> : <Save size={20} />}
          {salvo ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* ── Pix ── */}
      <Secao titulo="Pagamento via Pix" icone={<QrCode size={22} />} cor="orange">
        <Campo label="Chave Pix" hint="CPF, CNPJ, e-mail, telefone ou chave aleatória">
          <Input
            value={form.pixChave}
            onChange={e => set('pixChave', e.target.value)}
            placeholder="Ex: 55321234-5678 ou chave@email.com"
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
            <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Prévia — como o cliente verá</p>
            <p className="font-mono text-orange-900 text-lg font-black">{form.pixChave}</p>
            {form.pixNome && <p className="text-sm font-semibold text-orange-700 mt-1">{form.pixNome}</p>}
            {form.pixBanco && <p className="text-sm text-orange-500 mt-0.5">{form.pixBanco}</p>}
          </div>
        )}
      </Secao>

      {/* ── WhatsApp ── */}
      <Secao titulo="WhatsApp do restaurante" icone={<Smartphone size={22} />} cor="green">
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
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-green-800">
            Clientes que pagaram via Pix enviam o comprovante para este número.
          </p>
        </div>
      </Secao>

      {/* ── Status da loja ── */}
      <Secao titulo="Status da loja" icone={<Settings size={22} />} cor="blue">
        <div className="flex items-center justify-between gap-4 bg-stone-50 rounded-xl px-5 py-4">
          <div>
            <p className="text-lg font-black text-stone-900">Loja aberta para pedidos online</p>
            <p className="text-sm font-medium text-stone-500 mt-1">
              Quando fechada, a página pública exibe mensagem de encerramento
            </p>
          </div>
          <button
            onClick={() => set('lojaAberta', !form.lojaAberta)}
            className={`transition-colors shrink-0 ${form.lojaAberta ? 'text-green-500' : 'text-stone-400'}`}
          >
            {form.lojaAberta
              ? <ToggleRight size={60} />
              : <ToggleLeft size={60} />}
          </button>
        </div>

        <div className={`rounded-xl px-5 py-5 text-lg font-black border-2 text-center tracking-wide ${
          form.lojaAberta
            ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200'
            : 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200'
        }`}>
          {form.lojaAberta ? '✅ ABERTA — clientes podem fazer pedidos' : '🔒 FECHADA — pedidos bloqueados'}
        </div>
      </Secao>

      {/* ── PIN da equipe ── */}
      <Secao titulo="Área da equipe" icone={<Lock size={22} />} cor="purple">
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
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-violet-800">
            Mínimo 4 dígitos. Padrão: <span className="font-black">1234</span>
          </p>
        </div>
      </Secao>

      {/* ── Senha do admin ── */}
      <Secao titulo="Senha do painel admin" icone={<Lock size={22} />} cor="slate">
        <Campo
          label="Senha de acesso ao painel"
          hint="Senha usada para entrar no painel de gestão (/login)"
        >
          <div className="relative">
            <Input
              value={form.senhaAdmin}
              onChange={e => set('senhaAdmin', e.target.value)}
              placeholder="fogao2024"
              type={mostrarSenha ? 'text' : 'password'}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Campo>
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-stone-600">
            Padrão: <span className="font-black">fogao2024</span> — altere para algo seguro.
          </p>
        </div>
      </Secao>

      {/* ── Links do sistema ── */}
      <Secao titulo="Links do sistema" icone={<Link size={22} />} cor="slate">
        {[
          { label: 'Link do cliente — cardápio público', url: urlPublica, key: 'pub', cor: 'blue' },
          { label: 'Link da equipe — coleta de pedidos', url: urlEquipe, key: 'eq', cor: 'violet' },
          { label: 'Link do admin — painel de gestão', url: urlAdmin, key: 'adm', cor: 'orange' },
        ].map(({ label, url, key, cor }) => (
          <div key={key} className={`flex items-center justify-between gap-3 rounded-xl px-5 py-4 border-2 ${
            cor === 'blue' ? 'bg-blue-50 border-blue-200'
            : cor === 'violet' ? 'bg-violet-50 border-violet-200'
            : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${
                cor === 'blue' ? 'text-blue-500' : cor === 'violet' ? 'text-violet-500' : 'text-orange-500'
              }`}>{label}</p>
              <p className={`text-base font-mono font-bold truncate ${
                cor === 'blue' ? 'text-blue-900' : cor === 'violet' ? 'text-violet-900' : 'text-orange-900'
              }`}>{url}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copiar(url, key)}
                className={`p-3 rounded-xl transition-colors font-bold ${
                  copiado === key
                    ? 'bg-green-500 text-white'
                    : cor === 'blue' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    : cor === 'violet' ? 'bg-violet-100 hover:bg-violet-200 text-violet-700'
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title="Copiar"
              >
                {copiado === key ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-xl transition-colors ${
                  cor === 'blue' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  : cor === 'violet' ? 'bg-violet-100 hover:bg-violet-200 text-violet-700'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title="Abrir"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        ))}
      </Secao>

      {/* Botão salvar no final */}
      <button
        onClick={salvar}
        className={`w-full flex items-center justify-center gap-3 py-6 rounded-2xl font-black text-xl transition-all shadow-lg ${
          salvo
            ? 'bg-green-500 text-white shadow-green-200'
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
        }`}
      >
        {salvo ? <Check size={26} /> : <Save size={26} />}
        {salvo ? 'Configurações salvas!' : 'Salvar configurações'}
      </button>

    </div>
  )
}
