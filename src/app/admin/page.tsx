export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'alunos'|'modulos'|'aulas'|'calendario'>('alunos')
  const [profiles, setProfiles] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Módulo form
  const [modTitle, setModTitle] = useState('')
  const [modDesc, setModDesc] = useState('')
  const [modOrder, setModOrder] = useState('1')
  const [editingMod, setEditingMod] = useState<any>(null)

  // Aula form
  const [lesTitle, setLesTitle] = useState('')
  const [lesDesc, setLesDesc] = useState('')
  const [lesModule, setLesModule] = useState('')
  const [lesYt, setLesYt] = useState('')
  const [lesDur, setLesDur] = useState('')
  const [lesOrder, setLesOrder] = useState('1')
  const [editingLes, setEditingLes] = useState<any>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const [pdfName, setPdfName] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [lesPdf, setLesPdf] = useState('')

  // Calendário form
  const [calTitle, setCalTitle] = useState('')
  const [calDate, setCalDate] = useState('')
  const [calStart, setCalStart] = useState('')
  const [calEnd, setCalEnd] = useState('')
  const [calDesc, setCalDesc] = useState('')

  useEffect(() => { checkAdminAndLoad() }, [])

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.push('/dashboard'); return }
    await loadAll()
    setLoading(false)
  }

  async function loadAll() {
    const [{ data: pr }, { data: mo }, { data: le }, { data: ev }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('modules').select('*').order('order_index'),
      supabase.from('lessons').select('*, modules(title)').order('order_index'),
      supabase.from('study_calendar').select('*').order('event_date'),
    ])
    setProfiles(pr || [])
    setModules(mo || [])
    setLessons(le || [])
    setEvents(ev || [])
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    showToast(status === 'approved' ? '✅ Aluno aprovado!' : status === 'suspended' ? '🚫 Aluno suspenso.' : '✅ Aluno reativado.')
    loadAll()
  }

  // MÓDULOS
  async function saveModule() {
    if (!modTitle.trim()) { showToast('⚠ Informe o título do módulo'); return }
    if (editingMod) {
      await supabase.from('modules').update({ title: modTitle, description: modDesc, order_index: parseInt(modOrder) || 1 }).eq('id', editingMod.id)
      showToast('✅ Módulo atualizado!')
      setEditingMod(null)
    } else {
      await supabase.from('modules').insert({ title: modTitle, description: modDesc, order_index: parseInt(modOrder) || 1 })
      showToast('✅ Módulo criado!')
    }
    setModTitle(''); setModDesc(''); setModOrder('1')
    loadAll()
  }

  async function deleteModule(id: string) {
    if (!confirm('Deletar este módulo e todas as aulas dele?')) return
    await supabase.from('modules').delete().eq('id', id)
    showToast('🗑 Módulo removido.')
    loadAll()
  }

  function editModule(m: any) {
    setEditingMod(m); setModTitle(m.title); setModDesc(m.description || ''); setModOrder(String(m.order_index))
    setTab('modulos'); window.scrollTo(0, 0)
  }

  // AULAS
  async function uploadPdf(file: File): Promise<string> {
    setUploadingPdf(true)
    const ext = file.name.split('.').pop()
    const path = `aulas/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('pdfs').upload(path, file)
    setUploadingPdf(false)
    if (error) { showToast('❌ Erro ao fazer upload do PDF'); return '' }
    return path
  }

  async function saveLesson() {
    if (!lesTitle.trim()) { showToast('⚠ Informe o título da aula'); return }
    if (!lesModule) { showToast('⚠ Selecione o módulo'); return }
    let pdfPath = lesPdf
    if (pdfRef.current?.files?.[0]) {
      pdfPath = await uploadPdf(pdfRef.current.files[0])
      if (!pdfPath) return
    }
    const payload = { title: lesTitle, description: lesDesc, module_id: lesModule, youtube_url: lesYt || null, duration_min: parseInt(lesDur) || null, order_index: parseInt(lesOrder) || 1, pdf_url: pdfPath || null }
    if (editingLes) {
      await supabase.from('lessons').update(payload).eq('id', editingLes.id)
      showToast('✅ Aula atualizada!')
      setEditingLes(null)
    } else {
      await supabase.from('lessons').insert(payload)
      showToast('✅ Aula publicada!')
    }
    setLesTitle(''); setLesDesc(''); setLesModule(''); setLesYt(''); setLesDur(''); setLesOrder('1'); setLesPdf(''); setPdfName('')
    if (pdfRef.current) pdfRef.current.value = ''
    loadAll()
  }

  async function deleteLesson(id: string) {
    if (!confirm('Deletar esta aula?')) return
    await supabase.from('lessons').delete().eq('id', id)
    showToast('🗑 Aula removida.')
    loadAll()
  }

  function editLesson(l: any) {
    setEditingLes(l); setLesTitle(l.title); setLesDesc(l.description || ''); setLesModule(l.module_id); setLesYt(l.youtube_url || ''); setLesDur(l.duration_min ? String(l.duration_min) : ''); setLesOrder(String(l.order_index)); setLesPdf(l.pdf_url || ''); setPdfName(l.pdf_url ? 'PDF já cadastrado' : '')
    setTab('aulas'); window.scrollTo(0, 0)
  }

  // CALENDÁRIO
  async function saveEvent() {
    if (!calTitle.trim() || !calDate) { showToast('⚠ Título e data são obrigatórios'); return }
    await supabase.from('study_calendar').insert({ title: calTitle, event_date: calDate, start_time: calStart || null, end_time: calEnd || null, description: calDesc || null, is_global: true })
    showToast('✅ Evento criado!')
    setCalTitle(''); setCalDate(''); setCalStart(''); setCalEnd(''); setCalDesc('')
    loadAll()
  }

  async function deleteEvent(id: string) {
    await supabase.from('study_calendar').delete().eq('id', id)
    showToast('🗑 Evento removido.')
    loadAll()
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)
    const matchS = !filterStatus || p.status === filterStatus
    return matchQ && matchS
  })

  const pending = profiles.filter(p => p.status === 'pending').length
  const approved = profiles.filter(p => p.status === 'approved').length

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none', fontFamily: 'system-ui', boxSizing: 'border-box', background: '#fff', color: '#111' }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', background: '#f4f6fb' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 40, marginBottom: 12 }}>★</div><div style={{ color: '#6b7280' }}>Carregando painel...</div></div></div>

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: 'system-ui, sans-serif' }}>
      {/* TOPBAR */}
      <div style={{ background: '#0d1b3e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#c9a227', fontSize: 22 }}>★</span>
          <span style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 700 }}>PM Estudos</span>
          <span style={{ background: 'rgba(201,162,39,0.15)', color: '#e8c547', fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(201,162,39,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', color: '#9aafd4', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Ver como aluno</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', color: '#9aafd4', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Sair</button>
        </div>
      </div>

      {/* TOAST */}
      {toast && <div style={{ position: 'fixed', top: 72, right: 20, background: '#0d1b3e', color: '#e8c547', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: '0.5px solid rgba(201,162,39,0.3)', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        {/* MÉTRICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { l: 'Aguardando aprovação', v: pending, c: '#c9a227', icon: '⏳' },
            { l: 'Alunos aprovados', v: approved, c: '#2d9a6b', icon: '✅' },
            { l: 'Módulos cadastrados', v: modules.length, c: '#2860c4', icon: '📚' },
            { l: 'Total de aulas', v: lessons.length, c: '#7c4dab', icon: '▶' },
          ].map(m => (
            <div key={m.l} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', borderLeft: `4px solid ${m.c}`, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{m.icon} {m.l}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#0d1b3e' }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#fff', padding: 6, borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', width: 'fit-content' }}>
          {[
            { k: 'alunos', l: '👥 Alunos', badge: pending > 0 ? pending : null },
            { k: 'modulos', l: '📚 Módulos' },
            { k: 'aulas', l: '▶ Aulas' },
            { k: 'calendario', l: '📅 Calendário' },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: tab === t.k ? '#0d1b3e' : 'transparent', color: tab === t.k ? '#f0f4ff' : '#6b7280', fontWeight: tab === t.k ? 700 : 400, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.l}
              {t.badge && <span style={{ background: '#c9a227', color: '#0d1b3e', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── ALUNOS ── */}
        {tab === 'alunos' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar por nome ou e-mail..." style={{ ...inp, flex: 1 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 180 }}>
                <option value="">Todos os status</option>
                <option value="pending">Aguardando</option>
                <option value="approved">Aprovados</option>
                <option value="suspended">Suspensos</option>
              </select>
            </div>
            <div style={card}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Aluno', 'E-mail', 'Cadastro', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhum aluno encontrado</td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0d1b3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#c9a227', flexShrink: 0 }}>
                            {(p.full_name || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{p.full_name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{p.email}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600, background: p.status === 'approved' ? '#f0fdf4' : p.status === 'pending' ? '#fffbeb' : '#fef2f2', color: p.status === 'approved' ? '#16a34a' : p.status === 'pending' ? '#d97706' : '#dc2626', border: `1px solid ${p.status === 'approved' ? '#bbf7d0' : p.status === 'pending' ? '#fde68a' : '#fecaca'}` }}>
                          {p.status === 'approved' ? 'Aprovado' : p.status === 'pending' ? 'Aguardando' : 'Suspenso'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.status !== 'approved' && <button onClick={() => updateStatus(p.id, 'approved')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#2d9a6b', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Aprovar</button>}
                          {p.status === 'approved' && <button onClick={() => updateStatus(p.id, 'suspended')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>Suspender</button>}
                          {p.status === 'suspended' && <button onClick={() => updateStatus(p.id, 'approved')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#2860c4', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Reativar</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── MÓDULOS ── */}
        {tab === 'modulos' && (
          <>
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 20px' }}>{editingMod ? '✏️ Editar módulo' : '➕ Novo módulo'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12, marginBottom: 14 }}>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Título do módulo *</label><input value={modTitle} onChange={e => setModTitle(e.target.value)} placeholder="Ex: Direito Penal Militar" style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Descrição</label><input value={modDesc} onChange={e => setModDesc(e.target.value)} placeholder="Breve descrição..." style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Ordem</label><input type="number" value={modOrder} onChange={e => setModOrder(e.target.value)} min="1" style={inp} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveModule} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#c9a227', color: '#0d1b3e', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{editingMod ? 'Salvar alterações' : 'Criar módulo'}</button>
                {editingMod && <button onClick={() => { setEditingMod(null); setModTitle(''); setModDesc(''); setModOrder('1') }} style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 16px' }}>📚 Módulos cadastrados ({modules.length})</h2>
              {modules.length === 0 ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhum módulo ainda. Crie o primeiro acima.</p> : (
                modules.map(m => {
                  const count = lessons.filter(l => l.module_id === m.id).length
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #0d1b3e, #1a2d5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📖</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{count} aula{count !== 1 ? 's' : ''}{m.description ? ` · ${m.description}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => editModule(m)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => deleteModule(m.id)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, cursor: 'pointer' }}>🗑 Deletar</button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── AULAS ── */}
        {tab === 'aulas' && (
          <>
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 20px' }}>{editingLes ? '✏️ Editar aula' : '➕ Nova aula'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Título da aula *</label><input value={lesTitle} onChange={e => setLesTitle(e.target.value)} placeholder="Ex: Crimes contra a pessoa — Parte I" style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Módulo *</label>
                  <select value={lesModule} onChange={e => setLesModule(e.target.value)} style={inp}>
                    <option value="">Selecionar módulo...</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Ordem</label><input type="number" value={lesOrder} onChange={e => setLesOrder(e.target.value)} min="1" style={inp} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>URL do YouTube</label><input value={lesYt} onChange={e => setLesYt(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Duração (minutos)</label><input type="number" value={lesDur} onChange={e => setLesDur(e.target.value)} placeholder="45" style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>PDF da aula</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: '14px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }} onClick={() => pdfRef.current?.click()}>
                    <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setPdfName(e.target.files[0].name) }} />
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{uploadingPdf ? '⏳ Enviando...' : pdfName || (lesPdf ? '📄 PDF cadastrado — clique para trocar' : '📄 Clique para selecionar PDF')}</div>
                  </div>
                </div>
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Descrição / Ementa</label><input value={lesDesc} onChange={e => setLesDesc(e.target.value)} placeholder="Breve descrição do conteúdo..." style={inp} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveLesson} disabled={uploadingPdf} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#c9a227', color: '#0d1b3e', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{editingLes ? 'Salvar alterações' : 'Publicar aula'}</button>
                {editingLes && <button onClick={() => { setEditingLes(null); setLesTitle(''); setLesDesc(''); setLesModule(''); setLesYt(''); setLesDur(''); setLesOrder('1'); setLesPdf(''); setPdfName('') }} style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>}
              </div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 16px' }}>▶ Aulas publicadas ({lessons.length})</h2>
              {lessons.length === 0 ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhuma aula ainda. Crie a primeira acima.</p> : (
                modules.map(m => {
                  const mLessons = lessons.filter(l => l.module_id === m.id)
                  if (mLessons.length === 0) return null
                  return (
                    <div key={m.id} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0d1b3e', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>📖 {m.title} ({mLessons.length} aulas)</div>
                      {mLessons.map(l => (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderBottom: '1px solid #f3f4f6', marginLeft: 8 }}>
                          <div style={{ fontSize: 20 }}>▶</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{l.title}</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', gap: 10 }}>
                              {l.duration_min && <span>⏱ {l.duration_min} min</span>}
                              {l.youtube_url && <span>🎥 YouTube</span>}
                              {l.pdf_url && <span>📄 PDF</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => editLesson(l)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer' }}>✏️ Editar</button>
                            <button onClick={() => deleteLesson(l.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── CALENDÁRIO ── */}
        {tab === 'calendario' && (
          <>
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 20px' }}>➕ Novo evento no cronograma</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Título do evento *</label><input value={calTitle} onChange={e => setCalTitle(e.target.value)} placeholder="Ex: Simulado Geral — Turma 2025" style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Data *</label><input type="date" value={calDate} onChange={e => setCalDate(e.target.value)} style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Hora início</label><input type="time" value={calStart} onChange={e => setCalStart(e.target.value)} style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Hora fim</label><input type="time" value={calEnd} onChange={e => setCalEnd(e.target.value)} style={inp} /></div>
                <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Descrição</label><input value={calDesc} onChange={e => setCalDesc(e.target.value)} placeholder="Detalhes do evento..." style={inp} /></div>
              </div>
              <button onClick={saveEvent} style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#c9a227', color: '#0d1b3e', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Criar evento</button>
            </div>

            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d1b3e', margin: '0 0 16px' }}>📅 Eventos cadastrados ({events.length})</h2>
              {events.length === 0 ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhum evento ainda.</p> : (
                events.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color || '#c9a227', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {new Date(ev.event_date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        {ev.start_time ? ` · ${ev.start_time}` : ''}
                        {ev.end_time ? ` até ${ev.end_time}` : ''}
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>🗑 Remover</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
