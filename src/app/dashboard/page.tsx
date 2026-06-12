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
      supabase.from('study_calendar').select('*').gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(8),
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
  const colors = ['#c9a227','#3b82f6','#22c55e','#a855f7','#f97316','#0ea5e9','#ec4899','#14b8a6']

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a1628', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:60, height:60, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'#0d1b3e', margin:'0 auto 16px' }}>★</div>
        <div style={{ color:'#6a8fc4', fontSize:14 }}>Carregando PM Estudos...</div>
      </div>
    </div>
  )

  const navItems = [
    { key:'dashboard', icon:'🏠', label:'Dashboard' },
    { key:'modulos',   icon:'📚', label:'Módulos' },
    { key:'cronograma',icon:'📅', label:'Cronograma' },
    { key:'progresso', icon:'📊', label:'Progresso' },
  ]

  // Calendário junho 2026
  const calDays = [
    { d:1,  mat:'Português',  cls:'#dbeafe', tc:'#1e40af' },
    { d:2,  mat:'Matemática', cls:'#fce7f3', tc:'#9d174d' },
    { d:3,  mat:'História',   cls:'#dcfce7', tc:'#166534' },
    { d:4,  mat:'D. Penal',   cls:'#fef3c7', tc:'#92400e' },
    { d:5,  mat:'Geografia',  cls:'#f3e8ff', tc:'#6b21a8' },
    { d:6,  mat:'Revisão',    cls:'#f1f5f9', tc:'#475569' },
    { d:7,  mat:'★ Hoje',    cls:'#0d1f4a', tc:'#e8c547' },
    { d:8,  mat:'Português',  cls:'#dbeafe', tc:'#1e40af' },
    { d:9,  mat:'Matemática', cls:'#fce7f3', tc:'#9d174d' },
    { d:10, mat:'Informática',cls:'#e0f2fe', tc:'#0c4a6e' },
    { d:11, mat:'D. Penal',   cls:'#fef3c7', tc:'#92400e' },
    { d:12, mat:'História',   cls:'#dcfce7', tc:'#166534' },
    { d:13, mat:'Revisão',    cls:'#f1f5f9', tc:'#475569' },
    { d:14, mat:'Português',  cls:'#dbeafe', tc:'#1e40af' },
    { d:15, mat:'Matemática', cls:'#fce7f3', tc:'#9d174d' },
    { d:16, mat:'Geografia',  cls:'#f3e8ff', tc:'#6b21a8' },
    { d:17, mat:'D. Const.',  cls:'#fef3c7', tc:'#92400e' },
    { d:18, mat:'História',   cls:'#dcfce7', tc:'#166534' },
    { d:19, mat:'Informática',cls:'#e0f2fe', tc:'#0c4a6e' },
    { d:20, mat:'SIMULADO',   cls:'#0d1f4a', tc:'#e8c547' },
    { d:21, mat:'Português',  cls:'#dbeafe', tc:'#1e40af' },
    { d:22, mat:'Matemática', cls:'#fce7f3', tc:'#9d174d' },
    { d:23, mat:'História',   cls:'#dcfce7', tc:'#166534' },
    { d:24, mat:'D. Penal',   cls:'#fef3c7', tc:'#92400e' },
    { d:25, mat:'Geografia',  cls:'#f3e8ff', tc:'#6b21a8' },
    { d:26, mat:'Informática',cls:'#e0f2fe', tc:'#0c4a6e' },
    { d:27, mat:'Revisão',    cls:'#f1f5f9', tc:'#475569' },
    { d:28, mat:'Português',  cls:'#dbeafe', tc:'#1e40af' },
    { d:29, mat:'Matemática', cls:'#fce7f3', tc:'#9d174d' },
    { d:30, mat:'D. Const.',  cls:'#fef3c7', tc:'#92400e' },
  ]

  const materias = [
    { name:'Língua Portuguesa',           aulas:18, cor:'#3b82f6', sub:'Gramática · Interpretação · Redação', horas:'5h/sem' },
    { name:'Raciocínio Lógico e Matemática', aulas:22, cor:'#ec4899', sub:'Lógica · Aritmética · Geometria', horas:'5h/sem' },
    { name:'História do Brasil',          aulas:15, cor:'#22c55e', sub:'Colônia · Império · República', horas:'3h/sem' },
    { name:'Geografia',                   aulas:12, cor:'#a855f7', sub:'Brasil · Maranhão · Geopolítica', horas:'2h/sem' },
    { name:'Direito Penal Militar',       aulas:28, cor:'#f59e0b', sub:'CPM · CPPM · Estatuto PMMA', horas:'5h/sem' },
    { name:'Direito Constitucional',      aulas:20, cor:'#f97316', sub:'CF/88 · Direitos Fundamentais', horas:'4h/sem' },
    { name:'Informática',                 aulas:10, cor:'#0ea5e9', sub:'Windows · Office · Internet', horas:'2h/sem' },
    { name:'Motivação e Preparação',      aulas:3,  cor:'#c9a227', sub:'Mindset · Rotina · Foco', horas:'em andamento' },
  ]

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; }
        .pm-shell { display: flex; min-height: 100vh; background: #f0f4fb; }
        .pm-sidebar {
          width: 245px; background: linear-gradient(180deg,#0d1f4a 0%,#0a1628 100%);
          display: flex; flex-direction: column; flex-shrink: 0;
          border-right: 0.5px solid rgba(201,162,39,0.15);
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }
        .pm-sidebar::before {
          content: ''; position: sticky; top: 0; display: block;
          height: 3px; background: linear-gradient(90deg,#c9a227,#4a9eff,#c9a227);
          flex-shrink: 0;
        }
        .pm-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .pm-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 22px; background: #fff;
          border-bottom: 0.5px solid #e2e8f0; flex-shrink: 0;
          position: sticky; top: 0; z-index: 30;
        }
        .pm-content { flex: 1; overflow-y: auto; padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
        .pm-mobile-top {
          display: none; background: linear-gradient(90deg,#0d1f4a,#1a3a7a);
          padding: 12px 16px; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50; border-bottom: 0.5px solid rgba(201,162,39,0.2);
        }
        .pm-bottom-nav {
          display: none; background: #0d1f4a; border-top: 0.5px solid rgba(201,162,39,0.2);
          position: sticky; bottom: 0; z-index: 50;
        }
        @media (max-width: 768px) {
          .pm-sidebar { display: none !important; }
          .pm-topbar { display: none !important; }
          .pm-mobile-top { display: flex !important; }
          .pm-bottom-nav { display: flex !important; }
          .pm-content { padding: 14px 14px 80px; }
          .pm-metrics { grid-template-columns: 1fr 1fr !important; }
          .pm-row2 { grid-template-columns: 1fr !important; }
          .pm-hero { flex-direction: column !important; gap: 12px; }
          .pm-hero-right { text-align: left !important; }
          .pm-mini-bar { margin: 6px 0 0 0 !important; }
        }
        .pm-nav-item {
          display: flex; align-items: center; gap: 10px; padding: 9px 12px;
          border-radius: 8px; color: #6a8fc4; font-size: 13px; cursor: pointer;
          margin-bottom: 1px; position: relative; text-decoration: none;
        }
        .pm-nav-item:hover { background: rgba(74,158,255,0.06); color: #a8c8ff; }
        .pm-nav-item.active { background: rgba(201,162,39,0.1); color: #e8c547; }
        .pm-nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: linear-gradient(180deg,#c9a227,#e8c547); border-radius: 0 2px 2px 0;
        }
      `}</style>

      <div className="pm-shell">
        {/* SIDEBAR DESKTOP */}
        <nav className="pm-sidebar">
          <div style={{ padding:'20px 16px 14px', borderBottom:'0.5px solid rgba(201,162,39,0.12)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:42, height:42, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#0d1b3e', flexShrink:0, boxShadow:'0 2px 8px rgba(201,162,39,0.3)' }}>★</div>
              <div>
                <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:600 }}>PM Estudos</div>
                <div style={{ color:'#6a8fc4', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>Polícia Militar · MA</div>
              </div>
            </div>
            <div style={{ background:'rgba(74,158,255,0.08)', border:'0.5px solid rgba(74,158,255,0.2)', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4a9eff', flexShrink:0 }}></div>
              <span style={{ color:'#6a8fc4', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>TURMA PMMA</span>
              <span style={{ color:'#4a9eff', fontSize:11, fontWeight:600, marginLeft:'auto' }}>2026</span>
            </div>
          </div>

          <div style={{ flex:1, padding:'14px 8px', overflowY:'auto' }}>
            <div style={{ fontSize:10, color:'rgba(106,143,196,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 8px 5px', marginTop:4 }}>Principal</div>
            {navItems.map(item => (
              <div key={item.key} onClick={() => { if(item.key === 'modulos') { router.push('/modulos') } else { setActiveTab(item.key as any) } }} className={`pm-nav-item${activeTab===item.key?' active':''}`}>
                <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ fontSize:10, color:'rgba(106,143,196,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'8px 8px 5px', marginTop:4 }}>Desempenho</div>
            <div className="pm-nav-item"><span style={{ fontSize:16 }}>📈</span>Relatórios</div>
            <div className="pm-nav-item"><span style={{ fontSize:16 }}>🏆</span>Conquistas</div>
            <div className="pm-nav-item"><span style={{ fontSize:16 }}>🎯</span>Simulados</div>
          </div>

          <div style={{ padding:'12px 8px', borderTop:'0.5px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'rgba(74,158,255,0.05)', border:'0.5px solid rgba(74,158,255,0.1)' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#c9a227,#e8c547)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#0d1b3e', flexShrink:0 }}>
                {(profile?.full_name||'A').substring(0,2).toUpperCase()}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ color:'#dce8ff', fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.full_name||'Aluno'}</div>
                <div style={{ color:'#6a8fc4', fontSize:10 }}>PMMA 2026</div>
              </div>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#2d9a6b', flexShrink:0, marginLeft:'auto' }}></div>
            </div>
            <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }}
              style={{ width:'100%', marginTop:8, padding:'7px', borderRadius:7, border:'0.5px solid rgba(255,255,255,0.08)', background:'transparent', color:'#6a8fc4', fontSize:12, cursor:'pointer' }}>
              Sair da conta
            </button>
          </div>
        </nav>

        {/* MOBILE TOP */}
        <div className="pm-mobile-top">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:32, height:32, background:'linear-gradient(135deg,#c9a227,#e8c547)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#0d1b3e' }}>★</div>
            <div>
              <div style={{ color:'#f0f4ff', fontSize:13, fontWeight:700 }}>PM Estudos</div>
              <div style={{ color:'#4a9eff', fontSize:10 }}>TURMA PMMA 2026</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#e8c547', fontSize:12, fontWeight:600 }}>★ {totalDone} aulas</span>
            <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login') }}
              style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9aafd4', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:12 }}>
              Sair
            </button>
          </div>
        </div>

        {/* MAIN */}
        <main className="pm-main">
          {/* TOPBAR DESKTOP */}
          <div className="pm-topbar">
            <div>
              <h1 style={{ fontSize:16, fontWeight:600, color:'#0d1b3e' }}>Bem-vindo, {profile?.full_name?.split(' ')[0]||'Aluno'} 👋</h1>
              <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Turma PMMA 2026 · Continue sua preparação</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ background:'rgba(201,162,39,0.1)', border:'0.5px solid rgba(201,162,39,0.3)', color:'#8a6b10', fontSize:11, padding:'5px 12px', borderRadius:20, fontWeight:600 }}>★ {totalDone * 100} pts</span>
            </div>
          </div>

          <div className="pm-content">

            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <>
                {/* HERO */}
                <div className="pm-hero" style={{ background:'linear-gradient(135deg,#0d1f4a 0%,#1a3a7a 50%,#0d2d5e 100%)', borderRadius:14, padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-20, right:-20, width:140, height:140, borderRadius:'50%', background:'rgba(74,158,255,0.05)', border:'0.5px solid rgba(74,158,255,0.1)' }}></div>
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ fontSize:10, color:'#4a9eff', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ display:'inline-block', width:16, height:1, background:'#4a9eff' }}></span>
                      Concurso PMMA 2026
                    </div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#f0f4ff', lineHeight:1.3 }}>
                      {activeLesson ? `Assistindo: ${activeLesson.title.substring(0,30)}...` : 'Continue seus estudos'}
                    </div>
                    <div style={{ fontSize:12, color:'#6a8fc4', marginTop:4 }}>
                      {totalDone} de {totalLessons} aulas concluídas · {totalPct}% do curso
                    </div>
                    <button onClick={() => { if(activeLesson) { setActiveTab('dashboard') } }}
                      style={{ marginTop:12, background:'linear-gradient(135deg,#c9a227,#e8c547)', color:'#0d1b3e', border:'none', padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                      ▶ {activeLesson ? 'Continuar aula' : 'Começar estudos'}
                    </button>
                  </div>
                  <div className="pm-hero-right" style={{ position:'relative', zIndex:1, textAlign:'right' }}>
                    <div style={{ fontSize:40, fontWeight:700, color:'#4a9eff', lineHeight:1 }}>{totalPct}%</div>
                    <div style={{ fontSize:11, color:'#6a8fc4', marginTop:2 }}>Progresso geral</div>
                    <div className="pm-mini-bar" style={{ width:80, height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden', margin:'6px 0 0 auto' }}>
                      <div style={{ height:'100%', width:`${Math.max(totalPct,2)}%`, background:'linear-gradient(90deg,#c9a227,#4a9eff)', borderRadius:3 }}></div>
                    </div>
                  </div>
                </div>

                {/* MÉTRICAS */}
                <div className="pm-metrics" style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10 }}>
                  {[
                    { icon:'✅', label:'Aulas concluídas', val:`${totalDone}/${totalLessons}`, sub:'aulas', cor:'#1a4a9e', bg:'#eff6ff', pct: totalLessons>0?totalDone/totalLessons*100:0 },
                    { icon:'🔥', label:'Sequência ativa', val:'3', sub:'dias', cor:'#c9a227', bg:'#fefce8', pct:60 },
                    { icon:'📚', label:'Módulos ativos', val:String(modules.length), sub:'módulos', cor:'#1d7a55', bg:'#f0fdf4', pct:100 },
                    { icon:'🏆', label:'Posição na turma', val:'#1', sub:'ranking', cor:'#7c3aed', bg:'#fdf4ff', pct:90 },
                  ].map(m => (
                    <div key={m.label} style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:12, padding:'13px 15px', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{m.icon}</div>
                        <span style={{ fontSize:10, color:'#94a3b8' }}>{m.sub}</span>
                      </div>
                      <div style={{ fontSize:20, fontWeight:700, color:'#0d1b3e', lineHeight:1 }}>{m.val}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>{m.label}</div>
                      <div style={{ height:3, background:'#f1f5f9', borderRadius:2, overflow:'hidden', marginTop:8 }}>
                        <div style={{ height:'100%', width:`${m.pct}%`, background:m.cor, borderRadius:2 }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pm-row2" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:12 }}>
                  {/* MÓDULOS */}
                  <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:12, padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', display:'flex', alignItems:'center', gap:6 }}>📊 Progresso por módulo</div>
                      <span onClick={() => setActiveTab('modulos')} style={{ fontSize:11, color:'#64748b', cursor:'pointer', border:'0.5px solid #e2e8f0', padding:'4px 10px', borderRadius:20 }}>Ver todos →</span>
                    </div>
                    {modules.slice(0,5).map((m,i) => {
                      const pct = getModulePct(m.id)
                      const mLessons = lessons.filter(l=>l.module_id===m.id)
                      const done = mLessons.filter(l=>isCompleted(l.id)).length
                      return (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'0.5px solid #f1f5f9' }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📖</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'#0d1b3e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.title}</div>
                            <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{done}/{mLessons.length} aulas</div>
                            <div style={{ height:4, background:'#f1f5f9', borderRadius:2, overflow:'hidden', marginTop:4 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:colors[i%colors.length], borderRadius:2 }}></div>
                            </div>
                          </div>
                          <span style={{ fontSize:11, fontWeight:600, color:pct>0?colors[i%colors.length]:'#94a3b8', flexShrink:0 }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* RELATÓRIO + SEQUÊNCIA */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', marginBottom:10 }}>📈 Relatório semanal</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {[
                          { v:`${totalDone}`, l:'Aulas concluídas' },
                          { v:'87%', l:'Taxa retenção' },
                          { v:`${totalLessons-totalDone}`, l:'Aulas restantes' },
                          { v:'#1', l:'Ranking turma' },
                        ].map(r => (
                          <div key={r.l} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px', border:'0.5px solid #e2e8f0' }}>
                            <div style={{ fontSize:16, fontWeight:700, color:'#0d1b3e' }}>{r.v}</div>
                            <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{r.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', marginBottom:8 }}>🔥 Sequência · 3 dias</div>
                      <div style={{ display:'flex', gap:3 }}>
                        {['S','T','Q','Q','S','S','D'].map((d,i) => (
                          <div key={i} style={{ flex:1, textAlign:'center' }}>
                            <div style={{ height:18, borderRadius:3, background: i<3?'#2d9a6b':i===6?'linear-gradient(135deg,#c9a227,#e8c547)':'#f1f5f9', marginBottom:2 }}></div>
                            <div style={{ fontSize:9, color:'#94a3b8' }}>{d}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:6 }}>Meta: 5 dias/semana · PMMA 2026</div>
                    </div>
                  </div>
                </div>

                {/* LISTA DE AULAS */}
                {modules.length > 0 && (
                  <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ overflowX:'auto', borderBottom:'1px solid #f1f5f9', display:'flex' }}>
                      {modules.map((m,i) => (
                        <button key={m.id} onClick={() => setActiveModule(m.id)}
                          style={{ padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:activeModule===m.id?700:400, color:activeModule===m.id?'#0d1b3e':'#64748b', borderBottom:activeModule===m.id?`3px solid ${colors[i%colors.length]}`:'3px solid transparent', whiteSpace:'nowrap', fontFamily:'system-ui' }}>
                          {getModulePct(m.id)===100?'✅':'📖'} {m.title} <span style={{ fontSize:10, background:'#f4f6fb', padding:'2px 5px', borderRadius:6, color:'#94a3b8' }}>{getModulePct(m.id)}%</span>
                        </button>
                      ))}
                    </div>
                    {activeLesson && (
                      <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:16 }}>
                        {activeLesson.youtube_url && getYouTubeId(activeLesson.youtube_url) ? (
                          <div style={{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:10, overflow:'hidden' }}>
                            <iframe style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
                              src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.youtube_url)}`} frameBorder="0" allowFullScreen />
                          </div>
                        ) : (
                          <div style={{ height:120, background:'rgba(255,255,255,0.05)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>▶</div>
                        )}
                        <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:'#f0f4ff' }}>{activeLesson.title}</div>
                            {activeLesson.description && <div style={{ fontSize:12, color:'#6a8fc4', marginTop:3 }}>{activeLesson.description}</div>}
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            {activeLesson.pdf_url && (
                              <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${activeLesson.pdf_url}`} target="_blank" rel="noreferrer"
                                style={{ padding:'8px 14px', borderRadius:8, border:'0.5px solid rgba(255,255,255,0.15)', background:'transparent', color:'#dce8ff', fontSize:12, textDecoration:'none' }}>
                                📄 PDF
                              </a>
                            )}
                            <button onClick={() => markComplete(activeLesson.id)} disabled={isCompleted(activeLesson.id)||markingDone}
                              style={{ padding:'8px 16px', borderRadius:8, border:'none', background:isCompleted(activeLesson.id)?'#2d9a6b':'linear-gradient(135deg,#c9a227,#e8c547)', color:isCompleted(activeLesson.id)?'#fff':'#0d1b3e', fontSize:12, fontWeight:700, cursor:isCompleted(activeLesson.id)?'default':'pointer' }}>
                              {isCompleted(activeLesson.id)?'✅ Concluída':markingDone?'⌛...':'✓ Marcar como concluída'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      {currentModuleLessons.length===0 ? (
                        <div style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:14 }}>Nenhuma aula neste módulo ainda.</div>
                      ) : currentModuleLessons.map((l,i) => {
                        const done = isCompleted(l.id)
                        const active = activeLesson?.id===l.id
                        return (
                          <div key={l.id} onClick={() => setActiveLesson(l)}
                            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer', background:active?'#fffbeb':'transparent', borderLeft:active?'4px solid #c9a227':'4px solid transparent', borderBottom:'0.5px solid #f8fafc' }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:done?'#2d9a6b':active?'linear-gradient(135deg,#c9a227,#e8c547)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:done||active?done?'#fff':'#0d1b3e':'#94a3b8', flexShrink:0, fontWeight:700 }}>
                              {done?'✓':i+1}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:active?700:500, color:active?'#92400e':'#334155' }}>{l.title}</div>
                              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2, display:'flex', gap:8 }}>
                                {l.duration_min && <span>⏱ {l.duration_min}min</span>}
                                {l.youtube_url && <span>🎥</span>}
                                {l.pdf_url && <span>📄</span>}
                              </div>
                            </div>
                            {done && <span style={{ fontSize:10, background:'#f0fdf4', color:'#16a34a', padding:'3px 8px', borderRadius:20, fontWeight:600 }}>Concluída</span>}
                            {active && !done && <span style={{ fontSize:10, background:'rgba(201,162,39,0.1)', color:'#8a6b10', padding:'3px 8px', borderRadius:20, fontWeight:600 }}>Assistindo</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── MÓDULOS ── */}
            {activeTab === 'modulos' && (
              <>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:0 }}>📚 Meus módulos</h2>
                  <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Turma PMMA 2026 · {modules.length} módulos disponíveis</p>
                </div>
                {modules.length===0 ? (
                  <div style={{ background:'#fff', borderRadius:14, padding:40, textAlign:'center', color:'#94a3b8' }}>Nenhum módulo disponível ainda.</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                    {modules.map((m,i) => {
                      const pct = getModulePct(m.id)
                      const mLessons = lessons.filter(l=>l.module_id===m.id)
                      const done = mLessons.filter(l=>isCompleted(l.id)).length
                      return (
                        <div key={m.id} style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.06)', cursor:'pointer', border:'0.5px solid #e2e8f0' }}
                          onClick={() => { setActiveModule(m.id); setActiveTab('dashboard') }}>
                          <div style={{ height:80, background:`linear-gradient(135deg,#0d1f4a,${colors[i%colors.length]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>📖</div>
                          <div style={{ padding:16 }}>
                            <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:'0 0 4px' }}>{m.title}</h3>
                            {m.description && <p style={{ fontSize:12, color:'#64748b', margin:'0 0 10px' }}>{m.description}</p>}
                            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>{done}/{mLessons.length} aulas · {pct}%</div>
                            <div style={{ height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden', marginBottom:12 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:colors[i%colors.length], borderRadius:3 }}></div>
                            </div>
                            <button onClick={() => router.push('/modulos')} style={{ width:'100%', padding:'9px', borderRadius:9, border:'none', background:pct===100?'#2d9a6b':`linear-gradient(135deg,${colors[i%colors.length]},${colors[(i+1)%colors.length]})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                              {pct===100?'✅ Módulo concluído':'▶ Acessar módulo'}
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
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:0 }}>📅 Cronograma PMMA 2026</h2>
                  <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Planejamento de estudos baseado no edital</p>
                </div>

                {/* STATS */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
                  {[
                    { v:'133', l:'Total de aulas', c:'#0d1f4a' },
                    { v:'8',   l:'Matérias no edital', c:'#c9a227' },
                    { v:'24', l:'Semanas de estudo', c:'#2d9a6b' },
                    { v:'5-6h', l:'Meta por semana', c:'#7c3aed' },
                  ].map(s => (
                    <div key={s.l} style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* CALENDÁRIO */}
                <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:'#c9a227' }}>📅</span> Junho 2026 · PMMA
                    </div>
                    <span style={{ background:'rgba(201,162,39,0.2)', color:'#e8c547', fontSize:11, padding:'3px 10px', borderRadius:10, fontWeight:600 }}>Mês 1 de 6</span>
                  </div>
                  <div style={{ padding:14 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:8 }}>
                      {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => (
                        <div key={d} style={{ textAlign:'center', fontSize:10, color:'#94a3b8', fontWeight:600, padding:'3px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
                      {/* semana começa na segunda → 0 espaços vazios desde domingo */}
                      {Array.from({length:0}).map((_,i) => <div key={'e'+i} style={{ minHeight:60 }}></div>)}
                      {Array.from({length:30}).map((_,i) => {
                        const day = calDays[i]
                        const isToday = day.d === 7
                        return (
                          <div key={day.d} style={{ minHeight:60, background:isToday?'transparent':'#fafafa', border:`${isToday?'1.5px':'0.5px'} solid ${isToday?'#c9a227':'#e2e8f0'}`, borderRadius:8, padding:6 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:isToday?'#c9a227':'#64748b', marginBottom:3 }}>{day.d}</div>
                            <div style={{ fontSize:9, padding:'2px 4px', borderRadius:4, background:day.cls, color:day.tc, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{day.mat}</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* LEGENDA */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
                      {[
                        { l:'Português', c:'#dbeafe', t:'#1e40af' },
                        { l:'Matemática', c:'#fce7f3', t:'#9d174d' },
                        { l:'História', c:'#dcfce7', t:'#166534' },
                        { l:'Direito', c:'#fef3c7', t:'#92400e' },
                        { l:'Geografia', c:'#f3e8ff', t:'#6b21a8' },
                        { l:'Informática', c:'#e0f2fe', t:'#0c4a6e' },
                        { l:'Simulado', c:'#0d1f4a', t:'#e8c547' },
                        { l:'Revisão', c:'#f1f5f9', t:'#475569' },
                      ].map(item => (
                        <div key={item.l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#64748b' }}>
                          <div style={{ width:10, height:10, borderRadius:2, background:item.c, border:`0.5px solid ${item.t}33`, flexShrink:0 }}></div>
                          {item.l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MATÉRIAS */}
                <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:14, padding:16 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', marginBottom:12 }}>📋 Matérias do edital</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {materias.map(m => (
                      <div key={m.name} style={{ background:'#f8fafc', border:'0.5px solid #e2e8f0', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{m.name}</span>
                          <span style={{ fontSize:11, color:'#94a3b8' }}>{m.aulas} aulas · {m.horas}</span>
                        </div>
                        <div style={{ height:5, background:'#e2e8f0', borderRadius:3, overflow:'hidden', marginBottom:5 }}>
                          <div style={{ height:'100%', width: m.name.includes('Motiv') ? '33%' : '0%', background:m.cor, borderRadius:3 }}></div>
                        </div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PLANO SEMANAL */}
                <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:14, padding:16 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', marginBottom:12 }}>📆 Plano semanal sugerido</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      { dia:'Segunda', mat:'Língua Portuguesa', dur:'1h', cor:'#dbeafe', tc:'#1e40af' },
                      { dia:'Terça',   mat:'Raciocínio Lógico e Matemática', dur:'1h', cor:'#fce7f3', tc:'#9d174d' },
                      { dia:'Quarta',  mat:'História do Brasil', dur:'1h', cor:'#dcfce7', tc:'#166534' },
                      { dia:'Quinta',  mat:'Direito Penal Militar', dur:'1h', cor:'#fef3c7', tc:'#92400e' },
                      { dia:'Sexta',   mat:'Geografia + Informática', dur:'1h', cor:'#f3e8ff', tc:'#6b21a8' },
                      { dia:'Sábado',  mat:'Revisão geral', dur:'1h', cor:'#f1f5f9', tc:'#475569' },
                      { dia:'Domingo', mat:'Descanso / Simulado mensal', dur:'—', cor:'#0d1f4a', tc:'#e8c547' },
                    ].map(p => (
                      <div key={p.dia} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 12px', background:'#f8fafc', borderRadius:9, border:'0.5px solid #e2e8f0' }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#0d1b3e', width:68, flexShrink:0 }}>{p.dia}</span>
                        <span style={{ fontSize:11, padding:'3px 10px', borderRadius:6, background:p.cor, color:p.tc, fontWeight:600, flex:1 }}>{p.mat}</span>
                        <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>{p.dur}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* METAS POR PERÍODO */}
                <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:14, padding:16 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', marginBottom:12 }}>🎯 Metas por período</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {[
                      { per:'Jun–Jul 2026', meta:'Base: Português + Matemática', cor:'#eff6ff', tc:'#1e40af' },
                      { per:'Ago–Set 2026', meta:'Direito Penal + Constitucional', cor:'#fef3c7', tc:'#92400e' },
                      { per:'Out–Nov 2026', meta:'História + Geografia + Revisão', cor:'#f0fdf4', tc:'#166534' },
                      { per:'Dez 2026',     meta:'★ Simulados intensivos · Prova!', cor:'#0d1f4a', tc:'#e8c547' },
                    ].map(p => (
                      <div key={p.per} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:p.cor, borderRadius:10, border:`0.5px solid ${p.tc}33` }}>
                        <span style={{ fontSize:12, color:p.tc, fontWeight:600 }}>{p.per}</span>
                        <span style={{ fontSize:12, color:p.tc, fontWeight:500 }}>{p.meta}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EVENTOS DO BANCO */}
                {events.length > 0 && (
                  <div style={{ background:'#fff', border:'0.5px solid #e2e8f0', borderRadius:14, padding:16 }}>
                    <h3 style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', marginBottom:12 }}>📌 Próximos eventos</h3>
                    {events.map(ev => (
                      <div key={ev.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'0.5px solid #f1f5f9' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:ev.color||'#c9a227', flexShrink:0, marginTop:4 }}></div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{ev.title}</div>
                          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
                            {new Date(ev.event_date+'T12:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'2-digit', month:'long' })}
                            {ev.start_time ? ` · ${ev.start_time}` : ''}
                          </div>
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
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:0 }}>📊 Meu progresso</h2>
                  <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Turma PMMA 2026 · Acompanhamento detalhado</p>
                </div>

                <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', borderRadius:14, padding:'22px 24px' }}>
                  <div style={{ fontSize:13, color:'#6a8fc4', marginBottom:6 }}>Progresso total do curso · PMMA 2026</div>
                  <div style={{ fontSize:44, fontWeight:700, color:'#4a9eff', marginBottom:10 }}>{totalPct}%</div>
                  <div style={{ height:10, background:'rgba(255,255,255,0.1)', borderRadius:5, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.max(totalPct,1)}%`, background:'linear-gradient(90deg,#c9a227,#4a9eff)', borderRadius:5 }}></div>
                  </div>
                  <div style={{ fontSize:12, color:'#6a8fc4', marginTop:8 }}>{totalDone} de {totalLessons} aulas concluídas</div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {modules.map((m,i) => {
                    const pct = getModulePct(m.id)
                    const mLessons = lessons.filter(l=>l.module_id===m.id)
                    const done = mLessons.filter(l=>isCompleted(l.id)).length
                    return (
                      <div key={m.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', border:'0.5px solid #e2e8f0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#0d1b3e' }}>{m.title}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:pct>0?colors[i%colors.length]:'#94a3b8' }}>{pct}%</div>
                        </div>
                        <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:colors[i%colors.length], borderRadius:4, transition:'width 0.5s' }}></div>
                        </div>
                        <div style={{ fontSize:12, color:'#94a3b8', display:'flex', justifyContent:'space-between' }}>
                          <span>{done} de {mLessons.length} aulas</span>
                          {pct===100 && <span style={{ color:'#2d9a6b', fontWeight:600 }}>✅ Módulo concluído!</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

          </div>

          {/* BOTTOM NAV MOBILE */}
          <div className="pm-bottom-nav">
            {navItems.map(item => (
              <button key={item.key} onClick={() => { if(item.key === 'modulos') { router.push('/modulos') } else { setActiveTab(item.key as any) } }}
                style={{ flex:1, padding:'10px 4px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, color:activeTab===item.key?'#c9a227':'#6a8fc4', fontSize:10, fontWeight:activeTab===item.key?700:400, borderTop:activeTab===item.key?'2px solid #c9a227':'2px solid transparent', fontFamily:'system-ui' }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
