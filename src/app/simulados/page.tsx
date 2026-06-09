'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SimuladosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [simulados, setSimulados] = useState<any[]>([])
  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [{ data: sims }, { data: res }] = await Promise.all([
      supabase.from('simulados').select('*, questoes(count)').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('simulado_resultados').select('*').eq('user_id', user.id),
    ])
    setSimulados(sims || [])
    setResultados(res || [])
    setLoading(false)
  }

  function getResultado(simuladoId: string) {
    return resultados.find(r => r.simulado_id === simuladoId)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4fb', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
        <div style={{ color:'#64748b' }}>Carregando simulados...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fb', fontFamily:'system-ui, sans-serif' }}>
      <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9aafd4', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>← Voltar</button>
          <div>
            <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:700 }}>🎯 Simulados PMMA 2026</div>
            <div style={{ color:'#6a8fc4', fontSize:11 }}>Teste seus conhecimentos</div>
          </div>
        </div>
        <div style={{ background:'rgba(201,162,39,0.15)', border:'0.5px solid rgba(201,162,39,0.3)', color:'#e8c547', fontSize:11, padding:'5px 12px', borderRadius:20, fontWeight:600 }}>
          {simulados.length} disponíveis
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'24px 20px' }}>
        {simulados.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:16, padding:'60px 40px', textAlign:'center', border:'0.5px solid #e2e8f0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎯</div>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', marginBottom:8 }}>Nenhum simulado disponível</h2>
            <p style={{ color:'#64748b', fontSize:14 }}>A coordenação ainda não publicou nenhum simulado. Volte em breve!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {simulados.map((sim, i) => {
              const res = getResultado(sim.id)
              const totalQ = sim.questoes?.[0]?.count || 0
              const pct = res ? Math.round((res.acertos/res.total)*100) : null
              const corPct = pct !== null ? (pct>=70?'#2d9a6b':pct>=50?'#c9a227':'#dc2626') : null
              return (
                <div key={sim.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden', border:'0.5px solid #e2e8f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ height:6, background:`linear-gradient(90deg,#0d1f4a,${['#c9a227','#3b82f6','#22c55e','#a855f7'][i%4]})` }}></div>
                  <div style={{ padding:'20px 24px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', margin:'0 0 6px' }}>{sim.title}</h3>
                        {sim.description && <p style={{ fontSize:13, color:'#64748b', margin:'0 0 12px' }}>{sim.description}</p>}
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <span style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>📝 {totalQ} questões</span>
                          <span style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>⏱ {sim.duration_min} minutos</span>
                          <span style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>🎯 Mínimo 70%</span>
                        </div>
                      </div>
                      {pct !== null && (
                        <div style={{ textAlign:'center', flexShrink:0 }}>
                          <div style={{ fontSize:28, fontWeight:700, color:corPct! }}>{pct}%</div>
                          <div style={{ fontSize:10, color:'#94a3b8' }}>seu resultado</div>
                          <div style={{ fontSize:11, color:pct>=70?'#16a34a':'#dc2626', fontWeight:600, marginTop:2 }}>{pct>=70?'✅ Aprovado':'❌ Reprovado'}</div>
                        </div>
                      )}
                    </div>

                    {res && (
                      <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', marginTop:12, display:'flex', gap:16, flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, color:'#64748b' }}>✅ {res.acertos} acertos</span>
                        <span style={{ fontSize:12, color:'#64748b' }}>❌ {res.total-res.acertos} erros</span>
                        <span style={{ fontSize:12, color:'#64748b' }}>Feito em {new Date(res.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}

                    <button onClick={() => router.push(`/simulados/${sim.id}`)}
                      style={{ marginTop:14, padding:'10px 24px', borderRadius:10, background: res ? '#f8fafc' : 'linear-gradient(135deg,#c9a227,#e8c547)', color: res ? '#334155' : '#0d1b3e', fontSize:14, fontWeight:700, cursor:'pointer', border: res ? '1px solid #e2e8f0' : 'none' }}>
                      {res ? '📋 Ver resultado / Refazer' : '▶ Iniciar simulado'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
