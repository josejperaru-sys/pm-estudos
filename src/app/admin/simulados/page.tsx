'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminSimuladosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [simulados, setSimulados] = useState<any[]>([])
  const [questoes, setQuestoes] = useState<any[]>([])
  const [selectedSim, setSelectedSim] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'simulados'|'questoes'>('simulados')

  // Form simulado
  const [simTitle, setSimTitle] = useState('')
  const [simDesc, setSimDesc] = useState('')
  const [simDur, setSimDur] = useState('60')
  const [editingSim, setEditingSim] = useState<any>(null)

  // Form questão
  const [qEnunciado, setQEnunciado] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qE, setQE] = useState('')
  const [qGabarito, setQGabarito] = useState('a')
  const [qMateria, setQMateria] = useState('')
  const [qOrdem, setQOrdem] = useState('1')
  const [editingQ, setEditingQ] = useState<any>(null)

  useEffect(() => { checkAndLoad() }, [])

  async function checkAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.push('/dashboard'); return }
    await loadSimulados()
    setLoading(false)
  }

  async function loadSimulados() {
    const { data } = await supabase.from('simulados').select('*, questoes(count)').order('created_at', { ascending: false })
    setSimulados(data || [])
  }

  async function loadQuestoes(simId: string) {
    const { data } = await supabase.from('questoes').select('*').eq('simulado_id', simId).order('ordem')
    setQuestoes(data || [])
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function saveSim() {
    if (!simTitle.trim()) { showToast('⚠ Informe o título'); return }
    const payload = { title: simTitle, description: simDesc||null, duration_min: parseInt(simDur)||60 }
    if (editingSim) {
      await supabase.from('simulados').update(payload).eq('id', editingSim.id)
      showToast('✅ Simulado atualizado!')
      setEditingSim(null)
    } else {
      await supabase.from('simulados').insert({ ...payload, is_active: false })
      showToast('✅ Simulado criado!')
    }
    setSimTitle(''); setSimDesc(''); setSimDur('60')
    loadSimulados()
  }

  async function toggleActive(sim: any) {
    await supabase.from('simulados').update({ is_active: !sim.is_active }).eq('id', sim.id)
    showToast(sim.is_active ? '🔒 Simulado desativado' : '✅ Simulado publicado!')
    loadSimulados()
  }

  async function deleteSim(id: string) {
    if (!confirm('Deletar este simulado e todas as questões?')) return
    await supabase.from('simulados').delete().eq('id', id)
    showToast('🗑 Simulado removido')
    if (selectedSim?.id === id) { setSelectedSim(null); setQuestoes([]) }
    loadSimulados()
  }

  async function saveQuestao() {
    if (!qEnunciado.trim()||!qA||!qB||!qC||!qD||!qE) { showToast('⚠ Preencha todos os campos'); return }
    if (!selectedSim) { showToast('⚠ Selecione um simulado primeiro'); return }
    const payload = { simulado_id: selectedSim.id, enunciado: qEnunciado, alternativa_a: qA, alternativa_b: qB, alternativa_c: qC, alternativa_d: qD, alternativa_e: qE, gabarito: qGabarito, materia: qMateria||null, ordem: parseInt(qOrdem)||1 }
    if (editingQ) {
      await supabase.from('questoes').update(payload).eq('id', editingQ.id)
      showToast('✅ Questão atualizada!')
      setEditingQ(null)
    } else {
      await supabase.from('questoes').insert(payload)
      showToast('✅ Questão adicionada!')
    }
    setQEnunciado(''); setQA(''); setQB(''); setQC(''); setQD(''); setQE(''); setQGabarito('a'); setQMateria(''); setQOrdem('1')
    loadQuestoes(selectedSim.id)
    loadSimulados()
  }

  async function deleteQ(id: string) {
    await supabase.from('questoes').delete().eq('id', id)
    showToast('🗑 Questão removida')
    if (selectedSim) loadQuestoes(selectedSim.id)
    loadSimulados()
  }

  function editQ(q: any) {
    setEditingQ(q); setQEnunciado(q.enunciado); setQA(q.alternativa_a); setQB(q.alternativa_b); setQC(q.alternativa_c); setQD(q.alternativa_d); setQE(q.alternativa_e); setQGabarito(q.gabarito); setQMateria(q.materia||''); setQOrdem(String(q.ordem))
    setTab('questoes'); window.scrollTo(0,0)
  }

  const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #e2e8f0', fontSize:14, outline:'none', fontFamily:'system-ui', boxSizing:'border-box', background:'#fff', color:'#111' }
  const card: React.CSSProperties = { background:'#fff', borderRadius:14, padding:'20px 24px', marginBottom:16, border:'0.5px solid #e2e8f0', boxShadow:'0 1px 8px rgba(0,0,0,0.05)' }

  if (loading) return <div style={{ padding:40, fontFamily:'system-ui', textAlign:'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4fb', fontFamily:'system-ui, sans-serif' }}>
      {toast && <div style={{ position:'fixed', top:16, right:16, background:'#0d1f4a', color:'#e8c547', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:500, border:'0.5px solid rgba(201,162,39,0.3)', zIndex:999 }}>{toast}</div>}

      <div style={{ background:'linear-gradient(135deg,#0d1f4a,#1a3a7a)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.push('/admin')} style={{ background:'rgba(255,255,255,0.08)', border:'none', color:'#9aafd4', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>← Admin</button>
          <div>
            <div style={{ color:'#f0f4ff', fontSize:14, fontWeight:700 }}>🎯 Gestão de Simulados</div>
            <div style={{ color:'#6a8fc4', fontSize:11 }}>PMMA 2026</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 20px' }}>
        {/* TABS */}
        <div style={{ display:'flex', gap:6, marginBottom:20, background:'#fff', padding:5, borderRadius:12, width:'fit-content', border:'0.5px solid #e2e8f0' }}>
          {[{k:'simulados',l:'📋 Simulados'},{k:'questoes',l:'❓ Questões'}].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              style={{ padding:'8px 20px', borderRadius:9, border:'none', background:tab===t.k?'#0d1f4a':'transparent', color:tab===t.k?'#f0f4ff':'#64748b', fontWeight:tab===t.k?700:400, cursor:'pointer', fontSize:14, fontFamily:'system-ui' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* SIMULADOS */}
        {tab === 'simulados' && (
          <>
            <div style={card}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', marginBottom:16 }}>{editingSim?'✏️ Editar simulado':'➕ Novo simulado'}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 120px', gap:12, marginBottom:14 }}>
                <div><label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Título *</label><input value={simTitle} onChange={e=>setSimTitle(e.target.value)} placeholder="Ex: Simulado 1 — Língua Portuguesa" style={inp} /></div>
                <div><label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Descrição</label><input value={simDesc} onChange={e=>setSimDesc(e.target.value)} placeholder="Descrição breve..." style={inp} /></div>
                <div><label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Duração (min)</label><input type="number" value={simDur} onChange={e=>setSimDur(e.target.value)} style={inp} /></div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={saveSim} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#c9a227,#e8c547)', color:'#0d1b3e', fontSize:14, fontWeight:700, cursor:'pointer' }}>{editingSim?'Salvar':'Criar simulado'}</button>
                {editingSim && <button onClick={() => { setEditingSim(null); setSimTitle(''); setSimDesc(''); setSimDur('60') }} style={{ padding:'10px 18px', borderRadius:10, border:'1px solid #e2e8f0', background:'transparent', color:'#64748b', fontSize:14, cursor:'pointer' }}>Cancelar</button>}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', marginBottom:14 }}>📋 Simulados cadastrados</h2>
              {simulados.length===0 ? <p style={{ color:'#94a3b8' }}>Nenhum simulado ainda.</p> : simulados.map(sim => {
                const totalQ = sim.questoes?.[0]?.count || 0
                return (
                  <div key={sim.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'0.5px solid #f1f5f9' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#0d1b3e' }}>{sim.title}</div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{totalQ} questões · {sim.duration_min}min</div>
                    </div>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, background:sim.is_active?'#f0fdf4':'#f8fafc', color:sim.is_active?'#16a34a':'#94a3b8', border:`1px solid ${sim.is_active?'#bbf7d0':'#e2e8f0'}` }}>
                      {sim.is_active?'✅ Publicado':'⬜ Rascunho'}
                    </span>
                    <div style={{ display:'flex', gap:6' }}>
                      <button onClick={() => { setSelectedSim(sim); loadQuestoes(sim.id); setTab('questoes') }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#334151', fontSize:12, cursor:'pointer' }}>❓ Questões</button>
                      <button onClick={() => toggleActive(sim)} style={{ padding:'6px 12px', borderRadius:8, border:'none', background:sim.is_active?'#fef2f2':'#f0fdf4', color:sim.is_active?'#dc2626':'#16a34a', fontSize:12, cursor:'pointer' }}>{sim.is_active?'Despublicar':'Publicar'}</button>
                      <button onClick={() => { setEditingSim(sim); setSimTitle(sim.title); setSimDesc(sim.description||''); setSimDur(String(sim.duration_min)) }} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#334151', fontSize:12, cursor:'pointer' }}>✏️</button>
                      <button onClick={() => deleteSim(sim.id)} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer' }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* QUESTÕES */}
        {tab === 'questoes' && (
          <>
            {/* Selecionar simulado */}
            <div style={{ ...card, marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Simulado selecionado</label>
              <select value={selectedSim?.id||''} onChange={e => { const s=simulados.find(x=>x.id===e.target.value); setSelectedSim(s||null); if(s) loadQuestoes(s.id) }} style={inp}>
                <option value="">Selecionar simulado...</option>
                {simulados.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {selectedSim && (
              <>
                <div style={card}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', marginBottom:16 }}>{editingQ?'✏️ Editar questão':'❓ Nova questão'} — {selectedSim.title}</h2>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Enunciado da questão *</label>
                    <textarea value={qEnunciado} onChange={e=>setQEnunciado(e.target.value)} placeholder="Digite o enunciado completo da questão..." rows={3}
                      style={{ ...inp, resize:'vertical' }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                    {['a','b','c','d','e'].map(alt => (
                      <div key={alt}>
                        <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Alternativa {alt.toUpperCase()} *</label>
                        <input value={alt==='a'?qA:alt==='b'?qB:alt==='c'?qC:alt==='d'?qD:qE}
                          onChange={e => { if(alt==='a')setQA(e.target.value); else if(alt==='b')setQB(e.target.value); else if(alt==='c')setQC(e.target.value); else if(alt==='d')setQD(e.target.value); else setQE(e.target.value) }}
                          placeholder={`Alternativa ${alt.toUpperCase()}`} style={inp} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Gabarito *</label>
                      <select value={qGabarito} onChange={e=>setQGabarito(e.target.value)} style={inp}>
                        {['a','b','c','d','e'].map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Matéria</label>
                      <select value={qMateria} onChange={e=>setQMateria(e.target.value)} style={inp}>
                        <option value="">Selecionar...</option>
                        {['Língua Portuguesa','Raciocínio Lógico','Matemática','História do Brasil','Geografia','Direito Penal Militar','Direito Constitucional','Informática'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Ordem</label>
                      <input type="number" value={qOrdem} onChange={e=>setQOrdem(e.target.value)} min="1" style={inp} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={saveQuestao} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#c9a227,#e8c547)', color:'#0d1b3e', fontSize:14, fontWeight:700, cursor:'pointer' }}>{editingQ?'Salvar':'Adicionar questão'}</button>
                    {editingQ && <button onClick={() => { setEditingQ(null); setQEnunciado(''); setQA(''); setQB(''); setQC(''); setQD(''); setQE('') }} style={{ padding:'10px 18px', borderRadius:10, border:'1px solid #e2e8f0', background:'transparent', color:'#64748b', fontSize:14, cursor:'pointer' }}>Cancelar</button>}
                  </div>
                </div>

                <div style={card}>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', marginBottom:14 }}>❓ Questões — {selectedSim.title} ({questoes.length})</h2>
                  {questoes.length===0 ? <p style={{ color:'#94a3b8' }}>Nenhuma questão ainda. Adicione acima!</p> : questoes.map((q,i) => (
                    <div key={q.id} style={{ padding:'14px 0', borderBottom:'0.5px solid #f1f5f9', display:'flex', gap:12 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'#0d1f4a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#e8c547', flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', marginBottom:4 }}>{q.enunciado.substring(0,120)}{q.enunciado.length>120?'...':''}</div>
                        <div style={{ fontSize:11, color:'#64748b', display:'flex', gap:10 }}>
                          {q.materia && <span>📚 {q.materia}</span>}
                          <span>Gabarito: <strong style={{ color:'#16a34a' }}>{q.gabarito.toUpperCase()}</strong></span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6', flexShrink:0 }}>
                        <button onClick={() => editQ(q)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#334151', fontSize:12, cursor:'pointer' }}>✏️</button>
                        <button onClick={() => deleteQ(q.id)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer' }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
