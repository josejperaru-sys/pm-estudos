'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SimuladoPage() {
  const router = useRouter()
  const params = useParams()
  const simuladoId = params?.simuladoId as string
  const supabase = createClient()

  const [simulado, setSimulado] = useState<any>(null)
  const [questoes, setQuestoes] = useState<any[]>([])
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [fase, setFase] = useState<string>('intro')
  const [tempoRestante, setTempoRestante] = useState(0)
  const [tempoGasto, setTempoGasto] = useState(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const timerRef = useRef<any>(null)
  const inicioRef = useRef<number>(0)

  useEffect(() => {
    loadSimulado()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  async function loadSimulado() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: sim }, { data: qs }] = await Promise.all([
      supabase.from('simulados').select('*').eq('id', simuladoId).single(),
      supabase.from('questoes').select('*').eq('simulado_id', simuladoId).order('ordem'),
    ])

    // Verifica se já fez
    const { data: res } = await supabase
      .from('simulado_resultados')
      .select('*')
      .eq('user_id', user.id)
      .eq('simulado_id', simuladoId)
      .single()

    if (res?.finalizado) {
      setResultado(res)
      setRespostas(res.respostas || {})
      setQuestoes(qs || [])
      setSimulado(sim)
      setFase('resultado')
      setLoading(false)
      return
    }

    setSimulado(sim)
    setQuestoes(qs || [])
    setTempoRestante((sim?.duration_min || 60) * 60)
    setLoading(false)
  }

  function iniciarProva() {
    setFase('prova')
    inicioRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          finalizarProva()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function finalizarProva() {
    if (timerRef.current) clearInterval(timerRef.current)
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const gasto = Math.round((Date.now() - inicioRef.current) / 1000)
    setTempoGasto(gasto)

    let acertos = 0
    questoes.forEach(q => {
      if (respostas[q.id] === q.gabarito) acertos++
    })

    const payload = {
      user_id: user.id,
      simulado_id: simuladoId,
      respostas,
      acertos,
      total: questoes.length,
      tempo_gasto: gasto,
      finalizado: true,
    }

    await supabase.from('simulado_resultados').upsert(payload, { onConflict: 'user_id,simulado_id' })
    setResultado(payload)
    setFase('resultado')
    setSalvando(false)
  }

  function formatTempo(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  function getCorAlternativa(questao: any, alt: string) {
    if (fase !== 'resultado') {
      return respostas[questao.id] === alt
        ? { bg:'rgba(201,162,39,0.15)', border:'1.5px solid #c9a227', color:'#92400e' }
        : { bg:'#f8fafc', border:'1px solid #e2e8f0', color:'#334155' }
    }
    if (alt === questao.gabarito) return { bg:'#f0fdf4', border:'1.5px solid #2d9a6b', color:'#166534' }
    if (respostas[questao.id] === alt && alt !== questao.gabarito) return { bg:'#fef2f2', border:'1.5px solid #dc2626', color:'#991b1b' }
    return { bg:'#f8fafc', border:'1px solid #e2e8f0', color:'#94a3b8' }
  }

  const pct = resultado ? Math.round((resultado.acertos / resultado.total) * 100) : 0
  const corPct = pct >= 70 ? '#2d9a6b' : pct >= 50 ? '#c9a227' : '#dc2626'

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a1628', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:60, height:60, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'#0d1b3e', margin:'0 auto 16px' }}>🎯</div>
        <div style={{ color:'#6a8fc4' }}>Carregando simulado...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fb', fontFamily:'system-ui, sans-serif' }}>
      {/* TOPBAR */}
      <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9aafd4', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>← Voltar</button>
          <div>
            <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:700 }}>{simulado?.title}</div>
            <div style={{ color:'#6a8fc4', fontSize:11 }}>{questoes.length} questões · {simulado?.duration_min} minutos</div>
          </div>
        </div>
        {fase === 'prova' && (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:tempoRestante < 300 ? 'rgba(220,38,38,0.2)' : 'rgba(74,158,255,0.15)', border:`1px solid ${tempoRestante < 300 ? '#dc2626' : '#4a9eff'}`, borderRadius:10, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>⏱</span>
              <span style={{ color:tempoRestante < 300 ? '#fca5a5' : '#4a9eff', fontSize:16, fontWeight:700, fontFamily:'monospace' }}>{formatTempo(tempoRestante)}</span>
            </div>
            <div style={{ color:'#6a8fc4', fontSize:12 }}>{Object.keys(respostas).length}/{questoes.length} respondidas</div>
          </div>
        )}
      </div>

      {/* INTRO */}
      {fase === 'intro' && (
        <div style={{ maxWidth:600, margin:'40px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:'32px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
              <h1 style={{ color:'#f0f4ff', fontSize:22, fontWeight:700, margin:'0 0 8px' }}>{simulado?.title}</h1>
              {simulado?.description && <p style={{ color:'#6a8fc4', fontSize:14, margin:0 }}>{simulado.description}</p>}
            </div>
            <div style={{ padding:'28px 32px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:24 }}>
                {[
                  { icon:'📝', val:questoes.length, lbl:'Questões' },
                  { icon:'⏱', val:`${simulado?.duration_min}min`, lbl:'Duração' },
                  { icon:'🎯', val:'70%', lbl:'Mínimo aprovação' },
                ].map(i => (
                  <div key={i.lbl} style={{ background:'#f8fafc', borderRadius:10, padding:'14px', textAlign:'center', border:'0.5px solid #e2e8f0' }}>
                    <div style={{ fontSize:22 }}>{i.icon}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', marginTop:4 }}>{i.val}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{i.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400e' }}>
                ⚠ Após iniciar, o tempo começa a contar. Não feche a página durante a prova.
              </div>
              <button onClick={iniciarProva} disabled={questoes.length === 0}
                style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#c9a227,#e8c547)', color:'#0d1b3e', fontSize:16, fontWeight:700, cursor:'pointer' }}>
                {questoes.length === 0 ? 'Nenhuma questão cadastrada' : '▶ Iniciar simulado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVA */}
      {fase === 'prova' && (
        <div style={{ maxWidth:760, margin:'0 auto', padding:'20px' }}>
          {/* BARRA DE PROGRESSO */}
          <div style={{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12, border:'0.5px solid #e2e8f0' }}>
            <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>Questão {questaoAtual+1} de {questoes.length}</span>
            <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${((questaoAtual+1)/questoes.length)*100}%`, background:'linear-gradient(90deg,#c9a227,#e8c547)', borderRadius:3 }}></div>
            </div>
            <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>{Math.round(((questaoAtual+1)/questoes.length)*100)}%</span>
          </div>

          {/* QUESTÃO */}
          {questoes[questaoAtual] && (
            <div style={{ background:'#fff', borderRadius:14, padding:'24px', marginBottom:14, border:'0.5px solid #e2e8f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)' }}>
              {questoes[questaoAtual].materia && (
                <div style={{ fontSize:11, background:'#eff6ff', color:'#1e40af', padding:'3px 10px', borderRadius:20, display:'inline-block', fontWeight:600, marginBottom:12 }}>
                  {questoes[questaoAtual].materia}
                </div>
              )}
              <p style={{ fontSize:15, color:'#0d1b3e', lineHeight:1.7, marginBottom:20, fontWeight:500 }}>
                {questaoAtual+1}. {questoes[questaoAtual].enunciado}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {['a','b','c','d','e'].map(alt => {
                  const c = getCorAlternativa(questoes[questaoAtual], alt)
                  return (
                    <button key={alt} onClick={() => {
                      if ((fase as string) === 'resultado') return
                      setRespostas(prev => ({ ...prev, [questoes[questaoAtual].id]: alt }))
                    }}
                      style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderRadius:10, background:c.bg, border:c.border, cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'system-ui' }}>
                      <span style={{ width:26, height:26, borderRadius:'50%', background:respostas[questoes[questaoAtual].id]===alt?'#c9a227':'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:respostas[questoes[questaoAtual].id]===alt?'#0d1b3e':'#64748b', flexShrink:0 }}>
                        {alt.toUpperCase()}
                      </span>
                      <span style={{ fontSize:14, color:c.color, lineHeight:1.5 }}>{questoes[questaoAtual][`alternativa_${alt}`]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* NAVEGAÇÃO */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <button onClick={() => setQuestaoAtual(p => Math.max(0,p-1))} disabled={questaoAtual===0}
              style={{ padding:'10px 20px', borderRadius:10, border:'1px solid #e2e8f0', background:'#fff', color:'#334155', fontSize:14, cursor:'pointer', opacity:questaoAtual===0?0.4:1 }}>
              ← Anterior
            </button>

            {/* MINI MAPA */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', flex:1 }}>
              {questoes.map((q,i) => (
                <button key={q.id} onClick={() => setQuestaoAtual(i)}
                  style={{ width:28, height:28, borderRadius:6, border:'none', background:questaoAtual===i?'#0d1f4a':respostas[q.id]?'#c9a227':'#e2e8f0', color:questaoAtual===i||respostas[q.id]?'#fff':'#94a3b8', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {i+1}
                </button>
              ))}
            </div>

            {questaoAtual < questoes.length-1 ? (
              <button onClick={() => setQuestaoAtual(p => p+1)}
                style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', color:'#f0f4ff', fontSize:14, cursor:'pointer', fontWeight:600 }}>
                Próxima →
              </button>
            ) : (
              <button onClick={finalizarProva} disabled={salvando}
                style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#c9a227,#e8c547)', color:'#0d1b3e', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {salvando ? '⌛ Salvando...' : '✅ Finalizar prova'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {fase === 'resultado' && resultado && (
        <div style={{ maxWidth:700, margin:'40px auto', padding:'0 20px' }}>
          <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ background:`linear-gradient(135deg,${pct>=70?'#0d4a1f':'#4a0d0d'},${pct>=70?'#1a7a3a':'#7a1a1a'})`, padding:'32px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:8 }}>{pct>=70?'🏆':pct>=50?'📊':'💪'}</div>
              <div style={{ fontSize:48, fontWeight:700, color:pct>=70?'#4ade80':pct>=50?'#fbbf24':'#f87171' }}>{pct}%</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginTop:4 }}>
                {pct>=70?'Aprovado! Excelente desempenho!':pct>=50?'Bom desempenho! Continue praticando.':'Continue estudando, você consegue!'}
              </div>
            </div>
            <div style={{ padding:'28px 32px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
                {[
                  { icon:'✅', val:resultado.acertos, lbl:'Acertos', cor:'#2d9a6b' },
                  { icon:'❌', val:resultado.total-resultado.acertos, lbl:'Erros', cor:'#dc2626' },
                  { icon:'⏱', val:formatTempo(resultado.tempo_gasto||tempoGasto), lbl:'Tempo gasto', cor:'#1a4a9e' },
                ].map(i => (
                  <div key={i.lbl} style={{ background:'#f8fafc', borderRadius:10, padding:'14px', textAlign:'center', border:'0.5px solid #e2e8f0' }}>
                    <div style={{ fontSize:22 }}>{i.icon}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:i.cor, marginTop:4 }}>{i.val}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{i.lbl}</div>
                  </div>
                ))}
              </div>

              {/* GABARITO */}
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', marginBottom:12 }}>📋 Gabarito comentado</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:400, overflowY:'auto' }}>
                {questoes.map((q,i) => {
                  const resp = respostas[q.id]
                  const acertou = resp === q.gabarito
                  return (
                    <div key={q.id} style={{ background:acertou?'#f0fdf4':'#fef2f2', border:`1px solid ${acertou?'#bbf7d0':'#fecaca'}`, borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0d1b3e', marginBottom:4 }}>{i+1}. {q.enunciado.substring(0,100)}{q.enunciado.length>100?'...':''}</div>
                          <div style={{ fontSize:11, color:'#64748b' }}>
                            Gabarito: <strong style={{ color:'#16a34a' }}>{q.gabarito.toUpperCase()} — {q[`alternativa_${q.gabarito}`]}</strong>
                          </div>
                          {!acertou && resp && (
                            <div style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>
                              Sua resposta: {resp.toUpperCase()} — {q[`alternativa_${resp}`]}
                            </div>
                          )}
                          {!resp && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>Não respondida</div>}
                        </div>
                        <span style={{ fontSize:16, flexShrink:0 }}>{acertou?'✅':'❌'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={() => router.push('/dashboard')}
                  style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid #e2e8f0', background:'#fff', color:'#334155', fontSize:14, cursor:'pointer', fontWeight:600 }}>
                  ← Voltar ao dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
