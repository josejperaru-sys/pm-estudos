'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ModulosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<string>('')
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [markingDone, setMarkingDone] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const [{ data: prof }, { data: mods }, { data: les }, { data: prog }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('modules').select('*').order('order_index'),
      supabase.from('lessons').select('*').order('order_index'),
      supabase.from('user_progress').select('*').eq('user_id', user.id),
    ])
    setProfile(prof)
    setModules(mods || [])
    setLessons(les || [])
    setProgress(prog || [])
    setLoading(false)
    if (mods && mods.length > 0) {
      setActiveModule(mods[0].id)
      setOpenModules(new Set([mods[0].id]))
      const firstLesson = (les || []).find((l: any) => l.module_id === mods[0].id)
      if (firstLesson) setActiveLesson(firstLesson)
    }
  }

  function getYouTubeId(url: string) {
    const m = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/)
    return m?.[1] || ''
  }

  function isCompleted(lessonId: string) {
    return progress.some((p: any) => p.lesson_id === lessonId && p.completed)
  }

  function getModulePct(moduleId: string) {
    const mLessons = lessons.filter((l: any) => l.module_id === moduleId)
    if (mLessons.length === 0) return 0
    const done = mLessons.filter((l: any) => isCompleted(l.id)).length
    return Math.round((done / mLessons.length) * 100)
  }

  function toggleModule(moduleId: string) {
    setOpenModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
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

  function getNextLesson() {
    if (!activeLesson) return null
    const idx = lessons.findIndex((l: any) => l.id === activeLesson.id)
    return idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null
  }

  function getPrevLesson() {
    if (!activeLesson) return null
    const idx = lessons.findIndex((l: any) => l.id === activeLesson.id)
    return idx > 0 ? lessons[idx - 1] : null
  }

  const totalLessons = lessons.length
  const totalDone = progress.filter((p: any) => p.completed).length
  const totalPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0
  const currentModuleLessons = lessons.filter((l: any) => l.module_id === activeModule)
  const nextLesson = getNextLesson()
  const prevLesson = getPrevLesson()
  const colors = ['#c9a227','#3b82f6','#22c55e','#a855f7','#f97316','#0ea5e9','#ec4899','#14b8a6']

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a1628', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:60, height:60, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'#0d1b3e', margin:'0 auto 16px' }}>★</div>
        <div style={{ color:'#6a8fc4', fontSize:14 }}>Carregando módulos...</div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
        .mod-shell { display: flex; flex-direction: column; height: 100vh; background: #f0f4fb; }
        .mod-topbar { background: linear-gradient(135deg,#0d1f4a,#1a3a7a); padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .mod-body { display: flex; flex: 1; overflow: hidden; }
        .mod-left { width: 240px; background: #fff; border-right: 0.5px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; }
        .mod-left-hdr { padding: 12px 14px; background: #0d1f4a; flex-shrink: 0; border-bottom: 1px solid rgba(201,162,39,0.15); }
        .mod-left-scroll { flex: 1; overflow-y: auto; }
        .mod-center { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f0f4fb; }
        .mod-right { width: 220px; background: #fff; border-left: 0.5px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; }
        .mod-right-hdr { padding: 12px 14px; background: #0d1f4a; flex-shrink: 0; border-bottom: 1px solid rgba(201,162,39,0.15); }
        .mod-right-scroll { flex: 1; overflow-y: auto; padding: 10px; }
        .group-hdr { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; background: #f8fafc; border-bottom: 0.5px solid #f1f5f9; }
        .group-hdr:hover { background: #f1f5f9; }
        .lesson-li { display: flex; align-items: flex-start; gap: 8px; padding: 8px 14px 8px 26px; cursor: pointer; border-bottom: 0.5px solid #f8fafc; }
        .lesson-li:hover { background: #f8fafc; }
        .lesson-li.active { background: rgba(201,162,39,0.06); border-left: 3px solid #c9a227; padding-left: 23px; }
        .mat-card { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 9px; border: 0.5px solid #e2e8f0; margin-bottom: 8px; cursor: pointer; }
        .mat-card:hover { background: #f8fafc; border-color: #c9a227; }
        @media (max-width: 768px) {
          .mod-left { display: none; }
          .mod-right { display: none; }
          .mod-center { width: 100%; }
        }
      `}</style>

      <div className="mod-shell">
        <div className="mod-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9aafd4', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, fontFamily:'system-ui' }}>← Dashboard</button>
            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}></div>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#0d1b3e' }}>★</div>
            <div>
              <div style={{ color:'#f0f4ff', fontSize:13, fontWeight:600 }}>PM Estudos · Módulos</div>
              <div style={{ color:'#6a8fc4', fontSize:10 }}>PMMA 2026 · {totalDone}/{totalLessons} aulas concluídas</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'rgba(201,162,39,0.12)', border:'0.5px solid rgba(201,162,39,0.3)', color:'#e8c547', fontSize:11, padding:'4px 10px', borderRadius:16, fontWeight:600 }}>{totalPct}% concluído</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#c9a227,#e8c547)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#0d1b3e' }}>
                {(profile?.full_name||'A').substring(0,2).toUpperCase()}
              </div>
              <span style={{ color:'#9aafd4', fontSize:12 }}>{profile?.full_name?.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        <div className="mod-body">
          <div className="mod-left">
            <div className="mod-left-hdr">
              <div style={{ color:'#f0f4ff', fontSize:12, fontWeight:600 }}>Módulos de aula</div>
              <div style={{ color:'#6a8fc4', fontSize:10, marginTop:2 }}>{modules.length} módulos · {totalLessons} aulas</div>
            </div>
            <div className="mod-left-scroll">
              {modules.map((mod: any, mi: number) => {
                const pct = getModulePct(mod.id)
                const mLessons = lessons.filter((l: any) => l.module_id === mod.id)
                const isOpen = openModules.has(mod.id)
                return (
                  <div key={mod.id} style={{ borderBottom:'0.5px solid #f1f5f9' }}>
                    <div className="group-hdr" onClick={() => { toggleModule(mod.id); setActiveModule(mod.id) }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }}>
                        <span style={{ fontSize:14, color:isOpen?'#c9a227':'#94a3b8' }}>{isOpen?'▾':'▸'}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0d1b3e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mod.title}</div>
                          <div style={{ height:3, background:'#f1f5f9', borderRadius:2, overflow:'hidden', marginTop:4 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:colors[mi%colors.length], borderRadius:2 }}></div>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize:10, color:pct>0?colors[mi%colors.length]:'#94a3b8', fontWeight:600, marginLeft:6, flexShrink:0 }}>{pct}%</span>
                    </div>
                    {isOpen && mLessons.map((l: any, li: number) => {
                      const done = isCompleted(l.id)
                      const active = activeLesson?.id === l.id
                      return (
                        <div key={l.id} className={`lesson-li${active?' active':''}`} onClick={() => { setActiveLesson(l); setActiveModule(mod.id) }}>
                          <div style={{ width:18, height:18, borderRadius:'50%', background:done?'#2d9a6b':active?'#c9a227':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:done||active?done?'#fff':'#0d1b3e':'#94a3b8', flexShrink:0, marginTop:1 }}>
                            {done?'✓':li+1}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:11, color:active?'#92400e':'#334155', fontWeight:active?600:400, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{l.title}</div>
                            <div style={{ fontSize:10, color:'#94a3b8', marginTop:1, display:'flex', gap:6 }}>
                              {l.duration_min && <span>⏱ {l.duration_min}min</span>}
                              {l.youtube_url && <span>🎥</span>}
                              {l.pdf_url && <span>📄</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mod-center">
            {activeLesson ? (
              <>
                <div style={{ background:'#000', flexShrink:0 }}>
                  {activeLesson.youtube_url && getYouTubeId(activeLesson.youtube_url) ? (
                    <div style={{ position:'relative', paddingBottom:'52%', height:0 }}>
                      <iframe style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
                        src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.youtube_url)}`}
                        frameBorder="0" allowFullScreen />
                    </div>
                  ) : (
                    <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center' }}>
                      <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(201,162,39,0.9)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                        <span style={{ fontSize:24, color:'#0d1b3e', marginLeft:4 }}>▶</span>
                      </div>
                      <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:600 }}>{activeLesson.title}</div>
                      <div style={{ color:'#6a8fc4', fontSize:12, marginTop:4 }}>Vídeo não disponível</div>
                    </div>
                  )}
                </div>

                <div style={{ background:'#fff', borderBottom:'0.5px solid #e2e8f0', padding:'14px 18px', flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', marginBottom:6 }}>{activeLesson.title}</div>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap' as const, marginBottom:10 }}>
                    {activeLesson.duration_min && <span style={{ fontSize:12, color:'#64748b' }}>⏱ {activeLesson.duration_min} minutos</span>}
                    <span style={{ fontSize:12, color:'#64748b' }}>📚 {modules.find((m: any) => m.id===activeLesson.module_id)?.title}</span>
                    <span style={{ fontSize:12, color:'#64748b' }}>🎓 PMMA 2026</span>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' as const }}>
                    <button onClick={() => markComplete(activeLesson.id)} disabled={isCompleted(activeLesson.id)||markingDone}
                      style={{ padding:'8px 18px', borderRadius:9, border:'none', background:isCompleted(activeLesson.id)?'#2d9a6b':'linear-gradient(135deg,#c9a227,#e8c547)', color:isCompleted(activeLesson.id)?'#fff':'#0d1b3e', fontSize:13, fontWeight:700, cursor:isCompleted(activeLesson.id)?'default':'pointer', fontFamily:'system-ui' }}>
                      {isCompleted(activeLesson.id)?'✅ Aula concluída':markingDone?'⌛ Salvando...':'✓ Marcar como concluída'}
                    </button>
                    {prevLesson && <button onClick={() => setActiveLesson(prevLesson)} style={{ padding:'8px 14px', borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', color:'#334155', fontSize:13, cursor:'pointer', fontFamily:'system-ui' }}>← Anterior</button>}
                    {nextLesson && <button onClick={() => { setActiveLesson(nextLesson); setActiveModule(nextLesson.module_id); setOpenModules(prev => new Set([...prev, nextLesson.module_id])) }} style={{ padding:'8px 14px', borderRadius:9, border:'none', background:'#0d1f4a', color:'#f0f4ff', fontSize:13, cursor:'pointer', fontFamily:'system-ui' }}>Próxima →</button>}
                  </div>
                </div>

                <div style={{ padding:'16px 18px 80px' }}>
                  {activeLesson.description && (
                    <div style={{ background:'#fff', borderRadius:12, padding:'14px 16px', marginBottom:12, border:'0.5px solid #e2e8f0' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>Sobre esta aula</div>
                      <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{activeLesson.description}</div>
                    </div>
                  )}
                  <div style={{ background:'#fff', borderRadius:12, padding:'14px 16px', border:'0.5px solid #e2e8f0' }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:10 }}>Progresso</div>
                    {(() => {
                      const mod = modules.find((m: any) => m.id === activeLesson.module_id)
                      const pct = mod ? getModulePct(mod.id) : 0
                      const mLessons = lessons.filter((l: any) => l.module_id === activeLesson.module_id)
                      const done = mLessons.filter((l: any) => isCompleted(l.id)).length
                      const mi = modules.findIndex((m: any) => m.id === activeLesson.module_id)
                      return (
                        <>
                          <div style={{ marginBottom:10 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:12, color:'#334155', fontWeight:500 }}>{mod?.title}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:colors[mi%colors.length] }}>{pct}%</span>
                            </div>
                            <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:colors[mi%colors.length], borderRadius:3 }}></div>
                            </div>
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{done}/{mLessons.length} aulas</div>
                          </div>
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:12, color:'#334155', fontWeight:500 }}>Progresso geral</span>
                              <span style={{ fontSize:12, fontWeight:700, color:'#1a4a9e' }}>{totalPct}%</span>
                            </div>
                            <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${Math.max(totalPct,1)}%`, background:'linear-gradient(90deg,#c9a227,#4a9eff)', borderRadius:3 }}></div>
                            </div>
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{totalDone}/{totalLessons} aulas concluídas</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
                <div style={{ fontSize:48 }}>📚</div>
                <div style={{ fontSize:16, fontWeight:600, color:'#0d1b3e' }}>Selecione uma aula</div>
                <div style={{ fontSize:14, color:'#64748b' }}>Escolha um módulo e uma aula na lista ao lado</div>
              </div>
            )}
          </div>

          <div className="mod-right">
            <div className="mod-right-hdr">
              <div style={{ color:'#f0f4ff', fontSize:12, fontWeight:600 }}>Materiais complementares</div>
            </div>
            <div className="mod-right-scroll">
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px', borderRadius:9, border:'0.5px solid #e2e8f0', marginBottom:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#0d1f4a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#c9a227', flexShrink:0 }}>PM</div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#0d1b3e' }}>Coordenação PMMA</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>PMMA 2026</div>
                </div>
              </div>

              {activeLesson?.pdf_url ? (
                <>
                  <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>PDF desta aula</div>
                  <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${activeLesson.pdf_url}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                    <div className="mat-card">
                      <div style={{ width:34, height:34, borderRadius:8, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📄</div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'#0d1b3e' }}>Material da aula</div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>Clique para baixar</div>
                      </div>
                      <span style={{ marginLeft:'auto', fontSize:14, color:'#94a3b8' }}>⬇</span>
                    </div>
                  </a>
                </>
              ) : (
                <>
                  <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:6 }}>Materiais</div>
                  <div style={{ background:'#f8fafc', borderRadius:9, padding:'12px', textAlign:'center' as const, border:'0.5px solid #e2e8f0', marginBottom:8 }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>📂</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>Nenhum material para esta aula</div>
                  </div>
                </>
              )}

              {nextLesson && (
                <>
                  <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', margin:'12px 0 6px' }}>Próxima aula</div>
                  <div className="mat-card" style={{ borderColor:'rgba(201,162,39,0.3)', background:'rgba(201,162,39,0.04)' }}
                    onClick={() => { setActiveLesson(nextLesson); setActiveModule(nextLesson.module_id); setOpenModules(prev => new Set([...prev, nextLesson.module_id])) }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>▶</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'#a07e1a', whiteSpace:'nowrap' as const, overflow:'hidden', textOverflow:'ellipsis' }}>{nextLesson.title}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>{nextLesson.duration_min ? `${nextLesson.duration_min}min` : 'Próxima'}</div>
                    </div>
                    <span style={{ color:'#c9a227', fontSize:14, flexShrink:0 }}>›</span>
                  </div>
                </>
              )}

              <div style={{ fontSize:10, fontWeight:600, color:'#94a3b8', textTransform:'uppercase' as const, letterSpacing:'0.06em', margin:'12px 0 6px' }}>Aulas deste módulo</div>
              {currentModuleLessons.map((l: any, i: number) => {
                const done = isCompleted(l.id)
                const active = activeLesson?.id === l.id
                return (
                  <div key={l.id} onClick={() => setActiveLesson(l)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, marginBottom:4, cursor:'pointer', background:active?'rgba(201,162,39,0.08)':'transparent', border:active?'0.5px solid rgba(201,162,39,0.3)':'0.5px solid transparent' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:done?'#2d9a6b':active?'#c9a227':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:done||active?done?'#fff':'#0d1b3e':'#94a3b8', flexShrink:0 }}>
                      {done?'✓':i+1}
                    </div>
                    <span style={{ fontSize:11, color:active?'#92400e':'#475569', fontWeight:active?600:400, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{l.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
