'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin() {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('status, role').eq('id', data.user.id).single()
    if (!profile || profile.status === 'pending') { router.push('/aguardando-aprovacao'); return }
    if (profile.status === 'suspended') { setError('Conta suspensa. Entre em contato com a coordenação.'); setLoading(false); return }
    if (profile.role === 'admin') { router.push('/admin'); return }
    router.push('/dashboard')
  }

  async function handleRegister() {
    if (!fullName.trim()) { setError('Informe seu nome completo.'); return }
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) { setSuccess('Cadastro realizado! Aguarde a aprovação.'); setTimeout(() => router.push('/aguardando-aprovacao'), 2000) }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; }
        .login-wrap {
          display: flex;
          min-height: 100vh;
        }
        .login-left {
          width: 42%;
          background: #0d1b3e;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
        }
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f4f6fb;
        }
        .form-box {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 18px;
          padding: 36px 32px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
        }
        .inp {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          font-size: 16px;
          outline: none;
          font-family: system-ui;
          background: #fff;
          color: #111;
        }
        .inp:focus { border-color: #c9a227; }
        .btn-main {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #c9a227;
          color: #0d1b3e;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: system-ui;
        }
        .btn-main:disabled { opacity: 0.7; cursor: not-allowed; }
        @media (max-width: 640px) {
          .login-wrap {
            flex-direction: column;
          }
          .login-left {
            width: 100%;
            padding: 32px 24px;
          }
          .login-left .features { display: none; }
          .login-right {
            padding: 24px 16px;
            background: #f4f6fb;
            align-items: flex-start;
          }
          .form-box {
            padding: 28px 20px;
            border-radius: 16px;
          }
          .inp { font-size: 16px; }
        }
      `}</style>

      <div className="login-wrap">
        {/* ESQUERDA */}
        <div className="login-left">
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#c9a227', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 16, color: '#0d1b3e', boxShadow: '0 0 0 10px rgba(201,162,39,0.12)' }}>★</div>
          <h1 style={{ color: '#f0f4ff', fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>PM Estudos</h1>
          <p style={{ color: '#9aafd4', textAlign: 'center', fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>Plataforma oficial de ensino tecnológico da Polícia Militar do Maranhão</p>
          <div style={{ width: 40, height: 3, background: '#c9a227', borderRadius: 2, margin: '16px auto' }} />
          <div className="features">
            {[
              { icon: '▶', t: 'Videoaulas estruturadas', d: 'Conteúdo completo para os concursos da PMMA' },
              { icon: '📊', t: 'Progresso em tempo real', d: 'Acompanhe sua evolução por módulo' },
              { icon: '📄', t: 'Material em PDF', d: 'Baixe os materiais de cada aula' },
              { icon: '📅', t: 'Cronograma sincronizado', d: 'Calendário atualizado pela coordenação' },
            ].map(f => (
              <div key={f.t} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(201,162,39,0.1)', border: '0.5px solid rgba(201,162,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>{f.icon}</div>
                <div><div style={{ color: '#dce8ff', fontSize: 13, fontWeight: 600 }}>{f.t}</div><div style={{ color: '#9aafd4', fontSize: 12, marginTop: 2 }}>{f.d}</div></div>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(154,175,212,0.35)', fontSize: 10, letterSpacing: '0.1em', marginTop: 16, textAlign: 'center' }}>POLÍCIA MILITAR DO MARANHÃO · PMMA</p>
        </div>

        {/* DIREITA */}
        <div className="login-right">
          <div className="form-box">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#a07e1a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {mode === 'login' ? 'Área do aluno' : 'Novo acesso'}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0d1b3e', margin: '0 0 6px' }}>
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                {mode === 'login' ? 'Acesse sua conta para continuar estudando.' : 'Após o cadastro, aguarde a aprovação da coordenação.'}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f4f6fb', borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: mode === m ? '#fff' : 'transparent', fontWeight: mode === m ? 700 : 400, color: mode === m ? '#0d1b3e' : '#6b7280', cursor: 'pointer', fontSize: 15, boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.1)' : 'none', fontFamily: 'system-ui' }}>
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>

            {/* Google decorativo */}
            <div style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, marginBottom: 16, opacity: 0.5, color: '#374151' }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continuar com o Google (em breve)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} /><span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>ou com e-mail</span><div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {mode === 'register' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nome completo</label>
                <input className="inp" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>E-mail</label>
              <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Senha</label>
                {mode === 'login' && (
                  <span style={{ fontSize: 13, color: '#a07e1a', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => { if (email) supabase.auth.resetPasswordForEmail(email).then(() => setSuccess('E-mail de recuperação enviado!')) }}>
                    Esqueci minha senha
                  </span>
                )}
              </div>
              <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())} />
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#dc2626', marginBottom: 14 }}>⚠ {error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#16a34a', marginBottom: 14 }}>✓ {success}</div>}

            <button className="btn-main" onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? '→ Entrar na plataforma' : '→ Criar conta'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: '#6b7280' }}>
              {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              <span style={{ color: '#a07e1a', cursor: 'pointer', fontWeight: 700 }}
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}>
                {mode === 'login' ? 'Cadastre-se gratuitamente' : 'Entrar'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
