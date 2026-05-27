'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AguardandoAprovacao() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('profiles').select('status, role, full_name').eq('id', user.id).single()
    if (data?.full_name) setUserName(data.full_name.split(' ')[0])
    if (data?.status === 'approved') {
      if (data.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    }
  }

  async function checkNow() {
    setChecking(true)
    await checkStatus()
    setTimeout(() => setChecking(false), 1500)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '52px 44px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(201,162,39,0.1)', border: '2px solid rgba(201,162,39,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 40 }}>⏳</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0d1b3e', marginBottom: 10 }}>
          {userName ? `Olá, ${userName}!` : 'Cadastro recebido!'}
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 36, fontSize: 15 }}>
          Sua conta está aguardando aprovação da coordenação da PMMA. Você será notificado assim que o acesso for liberado.
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
          {[
            { n: 1, t: 'Cadastro realizado', d: 'Seus dados foram registrados com sucesso', done: true },
            { n: 2, t: 'Revisão da coordenação', d: 'Aguardando aprovação manual da PMMA', active: true },
            { n: 3, t: 'Acesso liberado', d: 'Você poderá acessar todos os conteúdos' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: s.n < 3 ? 16 : 0, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: s.done ? '#2d9a6b' : s.active ? '#c9a227' : '#e5e7eb', color: s.done || s.active ? '#fff' : '#9ca3af', marginTop: 1 }}>
                {s.done ? '✓' : s.n}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.t}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={checkNow} disabled={checking}
          style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: '#0d1b3e', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10, fontFamily: 'system-ui' }}>
          {checking ? '⌛ Verificando...' : '🔄 Verificar status agora'}
        </button>
        <button onClick={logout}
          style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontFamily: 'system-ui' }}>
          Sair da conta
        </button>
      </div>
    </div>
  )
}
