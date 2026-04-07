import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Email fixo do admin — única conta com acesso ao painel
const ADMIN_EMAIL = 'admin@fogaoleninha.com.br'

export default function Login() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState(false)
  const [entrando, setEntrando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setEntrando(true)
    setErro(false)
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: senha,
    })
    setEntrando(false)
    if (error) {
      setErro(true)
      setSenha('')
    } else {
      navigate('/pedidos', { replace: true })
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #110704 0%, #3D1A0E 60%, #5C2310 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/logo-vertical.png"
            alt="Fogão a Lenha da Leninha"
            style={{ height: 88, margin: '0 auto 16px', display: 'block' }}
          />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 700, color: '#1A0E08', marginBottom: 4,
          }}>
            Área Interna
          </h1>
          <p style={{ fontSize: 13, color: '#9D8878' }}>
            Painel de gestão — Fogão a Lenha da Leninha
          </p>
        </div>

        <form onSubmit={entrar}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: '#6B5A4E', marginBottom: 6,
            }}>
              Senha de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              }}>
                <Lock size={15} color="#9D8878" />
              </div>
              <input
                type={mostrar ? 'text' : 'password'}
                data-nocase
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(false) }}
                placeholder="••••••••"
                autoFocus
                disabled={entrando}
                style={{
                  width: '100%', padding: '11px 40px 11px 38px',
                  borderRadius: 10, fontSize: 14,
                  border: erro ? '1.5px solid #EF4444' : '1.5px solid #CFC4BB',
                  outline: 'none', color: '#1A0E08',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                  opacity: entrando ? 0.5 : 1,
                }}
              />
              <button
                type="button"
                onClick={() => setMostrar(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9D8878', padding: 2,
                }}
              >
                {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {erro && (
              <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={entrando}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              background: entrando ? '#CFC4BB' : '#C8221A',
              color: '#fff', border: 'none',
              cursor: entrando ? 'default' : 'pointer',
              boxShadow: entrando ? 'none' : '0 4px 16px rgba(200,34,26,0.40)',
              transition: 'all 0.15s', letterSpacing: '0.02em',
            }}
          >
            {entrando ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#CFC4BB', textAlign: 'center', marginTop: 20 }}>
          Fogão a Lenha da Leninha · Sistema PDV v2.0
        </p>
      </div>
    </div>
  )
}
