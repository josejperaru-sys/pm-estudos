'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<string>('')
  const [markingDone, setMarkingDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard'|'modulos'|'cronograma'|'progresso'>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [{ data: prof }, { data: mods }, { data: les }, { data: prog }, { data: evts }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('modules').select('*').order('order_index'),
      supabase.from('lessons').select('*').order('order_index'),
      supabase.from('user_progress').select('*').eq('user_id', user.id),
      supabase.from('study_calendar').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(5),
    ])
    setProfile(prof)
    setModules(mods || [])
    setLessons(les || [])
    setProgress(prog || [])
    setEvents(evts || [])
    setLoading(false)
    if (mods && mods.length > 0) setActiveModule(mods[0].id)
  }

  function getYouTubeId(url: string) {
    const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/)
    return m?.[1] || ''
  }

  function isCompleted(lessonId: string) {
    return progress.some(p => p.lesson_id === lessonId && p.completed)
  }

  function getModulePct(moduleId: string) {
    const mLessons = lessons.filter(l => l.module_id === moduleId)
    if (mLessons.length === 0) return 0
    const done = mLessons.filter(l => isCompleted(l.id)).length
    return Math.round((done / mLessons.length) * 100)
  }

  async function markComplete(lessonId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMarkingDone(true)
    await supabase.from('user_progress').upsert(
      { user_id: user.id, lesson_id: lessonId, completed: true, watch_pct: 100, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' }
    )
    await loadData()
    setMarkingDone(false)
  }

  const totalLessons = lessons.length
  const totalDone = progress.filter(p => p.completed).length
  const totalPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0
  const currentModuleLessons = lessons.filter(l => l.module_id === activeModule)
  const colors = ['#c9a227','#2d9a6b','#2860c4','#7c4dab','#e06c1a','#1a9ab0']

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f6fb', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48, marginBottom:12 }}>★</div><div style={{ color:'#6b7280' }}>Carregando plataforma...</div></div>
    </div>
  )

  const navItems = [
    { key:'dashboard', icon:'🏠', label:'Dashboard' },
    { key:'modulos',   icon:'📚', label:'Módulos' },
    { key:'cronograma',icon:'📅', label:'Cronograma' },
    { key:'progresso', icon:'📊', label:'Progresso' },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', background:'#f4f6fb' }}>

      {/* SIDEBAR DESKTOP */}
      <div style={{ width:230, background:'#0d1b3e', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflow:'auto' }} className="sidebar-desktop">
        <div style={{ padding:'20px 16px', borderBottom:'0.5px solid rgba(201,162,39,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'#c9a227', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#0d1b3e' }}>★</div>
            <div><div style={{ color:'#f0f4ff', fontSize:14, fontWeight:700 }}>PM Estudos</div><div style={{ color:'#9aafd4', fontSize:10 }}>PMMA · Plataforma</div></div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'14px 0' }}>
          {navItems.map(item => (
            <div key={item.key} onClick={() => setActiveTab(item.key as any)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', cursor:'pointer',
                borderLeft: activeTab===item.key ? '3px solid #c9a227' : '3px solid transparent',
                background: activeTab===item.key ? 'rgba(201,162,39,0.1)' : 'transparent',
                color: activeTab===item.key ? '#e8c547' : '#9aafd4',
                fontSize:13, fontWeight: activeTab===item.key ? 700 : 400 }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding:'16px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#c9a227', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#0d1b3e', flexShrink:0 }}>
              {(profile?.full_name||'A').substring(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ color:'#f0f4ff', fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.full_name||'Aluno'}</div>
              <div style={{ color:'#9aafd4', fontSize:10 }}>Aluno</div>
            </div>
          </div>
          <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }}
            style={{ width:'100%', padding:'7px', borderRadius:7, border:'0.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'#9aafd4', fontSize:12, cursor:'pointer' }}>
            Sair da conta
          </button>
        </div>
      </div>

      {/* MAIN */}
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>

        {/* TOPBAR MOBILE */}
        <div style={{ background:'#0d1b3e', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#c9a227', fontSize:20 }}>★</span>
            <span style={{ color:'#f0f4ff', fontSize:14, fontWeight:700 }}>PM Estudos</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#9aafd4', fontSize:12 }}>{profile?.full_name?.split(' ')[0]}</span>
            <button onClick={()=>setMenuOpen(!menuOpen)}
              style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#f0f4ff', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:18 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* MENU MOBILE DROPDOWN */}
        {menuOpen && (
          <div style={{ background:'#0d1b3e', borderBottom:'1px solid rgba(201,162,39,0.2)', zIndex:40 }}>
            {navItems.map(item => (
              <div key={item.key} onClick={()=>{ setActiveTab(item.key as any); setMenuOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', cursor:'pointer',
                  borderLeft: activeTab===item.key ? '4px solid #c9a227' : '4px solid transparent',
                  background: activeTab===item.key ? 'rgba(201,162,39,0.1)' : 'transparent',
                  color: activeTab===item.key ? '#e8c547' : '#9aafd4', fontSize:14 }}>
                <span>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ padding:'12px 20px', borderTop:'0.5px solid rgba(255,255,255,0.07)' }}>
              <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }}
                style={{ background:'transparent', border:'0.5px solid rgba(255,255,255,0.15)', color:'#9aafd4', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
                Sair da conta
              </button>
            </div>
          </div>
        )}

        {/* CONTEÚDO */}
        <div style={{ flex:1, padding:'20px 16px', maxWidth:1100, width:'100%', margin:'0 auto', boxSizing:'border-box' as any }}>

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ fontSize:20, fontWeight:700, color:'#0d1b3e', margin:0 }}>Olá, {profile?.full_name?.split(' ')[0]||'Aluno'} 👋</h1>
                <p style={{ color:'#6b7280', fontSize:13, margin:'4px 0 0' }}>Continue de onde parou e avance nos seus estudos.</p>
              </div>

              {/* MÉTRICAS */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:20 }}>
                {[
                  { l:'Aulas concluídas', v:`${totalDone}/${totalLessons}`, c:'#2d9a6b', icon:'✅' },
                  { l:'Progresso geral',  v:`${totalPct}%`, c:'#c9a227', icon:'📊' },
                  { l:'Módulos',          v:modules.length, c:'#2860c4', icon:'📚' },
                  { l:'Próximos eventos', v:events.length,  c:'#7c4dab', icon:'📅' },
                ].map(m=>(
                  <div key={m.l} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', borderLeft:`4px solid ${m.c}`, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>{m.icon} {m.l}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:'#0d1b3e' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* PLAYER */}
              {activeLesson && (
                <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', marginBottom:20, boxShadow:'0 1px 8px rgba(0,0,0,0.07)' }}>
                  {activeLesson.youtube_url && getYouTubeId(activeLesson.youtube_url) ? (
                    <div style={{ position:'relative', paddingBottom:'56.25%', height:0 }}>
                      <iframe style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
                        src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.youtube_url)}`}
                        frameBorder="0" allowFullScreen />
                    </div>
                  ) : (
                    <div style={{ height:160, background:'linear-gradient(135deg,#0d1b3e,#1a2d5a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>▶</div>
                  )}
                  <div style={{ padding:'16px' }}>
                    <h2 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', margin:'0 0 6px' }}>{activeLesson.title}</h2>
                    {activeLesson.description && <p style={{ color:'#6b7280', fontSize:13, margin:'0 0 12px' }}>{activeLesson.description}</p>}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' as any }}>
                      {activeLesson.pdf_url && (
                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${activeLesson.pdf_url}`} target="_blank" rel="noreferrer"
                          style={{ padding:'9px 16px', borderRadius:9, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, textDecoration:'none' }}>
                          📄 Baixar PDF
                        </a>
                      )}
                      <button onClick={()=>markComplete(activeLesson.id)} disabled={isCompleted(activeLesson.id)||markingDone}
                        style={{ padding:'9px 18px', borderRadius:9, border:'none',
                          background: isCompleted(activeLesson.id) ? '#2d9a6b' : '#c9a227',
                          color: isCompleted(activeLesson.id) ? '#fff' : '#0d1b3e',
                          fontSize:13, fontWeight:700, cursor: isCompleted(activeLesson.id) ? 'default' : 'pointer' }}>
                        {isCompleted(activeLesson.id) ? '✅ Aula concluída!' : markingDone ? '⌛ Salvando...' : '✓ Marcar como concluída'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LISTA DE AULAS */}
              <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ overflowX:'auto', borderBottom:'1px solid #f3f4f6', display:'flex' }}>
                  {modules.map((m,i)=>(
                    <button key={m.id} onClick={()=>setActiveModule(m.id)}
                      style={{ padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:13,
                        fontWeight: activeModule===m.id ? 700 : 400,
                        color: activeModule===m.id ? '#0d1b3e' : '#6b7280',
                        borderBottom: activeModule===m.id ? `3px solid ${colors[i%colors.length]}` : '3px solid transparent',
                        whiteSpace:'nowrap' as any }}>
                      {getModulePct(m.id)===100?'✅':'📖'} {m.title} <span style={{ fontSize:11, background:'#f4f6fb', padding:'2px 6px', borderRadius:6, color:'#6b7280' }}>{getModulePct(m.id)}%</span>
                    </button>
                  ))}
                </div>
                <div>
                  {currentModuleLessons.length===0 ? (
                    <div style={{ padding:'32px', textAlign:'center', color:'#9ca3af', fontSize:14 }}>Nenhuma aula neste módulo ainda.</div>
                  ) : currentModuleLessons.map((l,i)=>{
                    const done = isCompleted(l.id)
                    const active = activeLesson?.id===l.id
                    return (
                      <div key={l.id} onClick={()=>{ setActiveLesson(l); setActiveTab('dashboard'); window.scrollTo(0,0) }}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer',
                          background: active ? '#fffbeb' : 'transparent',
                          borderLeft: active ? '4px solid #c9a227' : '4px solid transparent' }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background: done?'#2d9a6b':active?'#c9a227':'#f3f4f6',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
                          color: done||active?'#fff':'#9ca3af', flexShrink:0, fontWeight:700 }}>
                          {done?'✓':i+1}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight: active?700:500, color: active?'#0d1b3e':'#374151' }}>{l.title}</div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:2, display:'flex', gap:8 }}>
                            {l.duration_min && <span>⏱ {l.duration_min}min</span>}
                            {l.youtube_url && <span>🎥</span>}
                            {l.pdf_url && <span>📄</span>}
                          </div>
                        </div>
                        {done && <span style={{ fontSize:11, background:'#f0fdf4', color:'#16a34a', padding:'3px 8px', borderRadius:6, fontWeight:600, whiteSpace:'nowrap' as any }}>Concluída</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── MÓDULOS ── */}
          {activeTab === 'modulos' && (
            <>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:'0 0 16px' }}>📚 Meus módulos</h2>
              {modules.length===0 ? (
                <div style={{ background:'#fff', borderRadius:14, padding:'40px', textAlign:'center', color:'#9ca3af' }}>Nenhum módulo disponível ainda.</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
                  {modules.map((m,i)=>{
                    const pct = getModulePct(m.id)
                    const mLessons = lessons.filter(l=>l.module_id===m.id)
                    const done = mLessons.filter(l=>isCompleted(l.id)).length
                    return (
                      <div key={m.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', cursor:'pointer' }}
                        onClick={()=>{ setActiveModule(m.id); setActiveTab('dashboard') }}>
                        <div style={{ height:80, background:`linear-gradient(135deg, #0d1b3e, ${colors[i%colors.length]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📖</div>
                        <div style={{ padding:'16px' }}>
                          <h3 style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:'0 0 4px' }}>{m.title}</h3>
                          {m.description && <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 10px' }}>{m.description}</p>}
                          <div style={{ fontSize:12, color:'#6b7280', marginBottom:8 }}>{done}/{mLessons.length} aulas · {pct}%</div>
                          <div style={{ height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:colors[i%colors.length], borderRadius:3 }} />
                          </div>
                          <button style={{ marginTop:12, width:'100%', padding:'9px', borderRadius:9, border:'none', background:'#c9a227', color:'#0d1b3e', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                            ▶ Acessar módulo
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── CRONOGRAMA ── */}
          {activeTab === 'cronograma' && (
            <>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:'0 0 16px' }}>📅 Cronograma de estudos</h2>
              {events.length===0 ? (
                <div style={{ background:'#fff', borderRadius:14, padding:'40px', textAlign:'center', color:'#9ca3af' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
                  Nenhum evento programado pela coordenação ainda.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {events.map(ev=>(
                    <div key={ev.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', gap:14, alignItems:'flex-start' }}>
                      <div style={{ width:12, height:12, borderRadius:'50%', background:ev.color||'#c9a227', flexShrink:0, marginTop:4 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:600, color:'#0d1b3e' }}>{ev.title}</div>
                        <div style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>
                          📆 {new Date(ev.event_date+'T12:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
                          {ev.start_time && ` · 🕐 ${ev.start_time}`}
                          {ev.end_time && ` até ${ev.end_time}`}
                        </div>
                        {ev.description && <div style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>{ev.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PROGRESSO ── */}
          {activeTab === 'progresso' && (
            <>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:'0 0 16px' }}>📊 Meu progresso</h2>
              {/* Total */}
              <div style={{ background:'linear-gradient(135deg,#0d1b3e,#1a2d5a)', borderRadius:14, padding:'24px', marginBottom:16, color:'#fff' }}>
                <div style={{ fontSize:13, color:'#9aafd4', marginBottom:6 }}>Progresso total do curso</div>
                <div style={{ fontSize:40, fontWeight:700, color:'#c9a227', marginBottom:12 }}>{totalPct}%</div>
                <div style={{ height:10, background:'rgba(255,255,255,0.1)', borderRadius:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${totalPct}%`, background:'linear-gradient(90deg,#c9a227,#e8c547)', borderRadius:5 }} />
                </div>
                <div style={{ fontSize:12, color:'#9aafd4', marginTop:8 }}>{totalDone} de {totalLessons} aulas concluídas</div>
              </div>
              {/* Por módulo */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {modules.map((m,i)=>{
                  const pct = getModulePct(m.id)
                  const mLessons = lessons.filter(l=>l.module_id===m.id)
                  const done = mLessons.filter(l=>isCompleted(l.id)).length
                  return (
                    <div key={m.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{m.title}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:colors[i%colors.length] }}>{pct}%</div>
                      </div>
                      <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:colors[i%colors.length], borderRadius:4, transition:'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>{done} de {mLessons.length} aulas concluídas</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div>

        {/* NAVBAR BOTTOM MOBILE */}
        <div style={{ background:'#0d1b3e', borderTop:'1px solid rgba(201,162,39,0.2)', display:'flex', position:'sticky', bottom:0, zIndex:50 }}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>{ setActiveTab(item.key as any); setMenuOpen(false) }}
              style={{ flex:1, padding:'10px 4px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                color: activeTab===item.key ? '#c9a227' : '#9aafd4', fontSize:10, fontWeight: activeTab===item.key ? 700 : 400,
                borderTop: activeTab===item.key ? '2px solid #c9a227' : '2px solid transparent' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </div>
  )
}
