import { useState, useEffect } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable.js'
import { useAuth } from '../lib/AuthContext.jsx'
import {
  C, Tag, Avatar, Modal, FL, Inp, Sel, TA, Row, Btn,
  PageHeader, FilterSel, ErrorBanner, PRIORITY_META, STATUS_META,
} from '../components/ui.jsx'
import { checkSaidaTasksCompleted, checkCampaignTaskCompleted, checkPendingReviewTasks } from '../hooks/useWorkflowAutomation.js'

const TEAM        = ['Rida', 'Oussama', 'Saida', 'Sana']
const TEAMS_LIST  = ['Creative', 'Media Buying', 'Operations']
const PRIORITIES  = ['Low', 'Medium', 'High', 'Urgent']
const TASK_COLS   = ['Backlog', 'To do', 'In progress', 'Review', 'Done']

const blank = (user) => ({
  title: '', description: '', team: 'Creative', assigned_to: user,
  deadline: '', priority: 'Medium', column_name: 'To do',
  related_product: '', drive_links: '', completed: false,
})

export default function TaskManager() {
  const { userName, isAdmin } = useAuth()
  const { rows, loading, error, insert, update, remove } = useRealtimeTable('tasks', { orderBy: 'created_at', ascending: true })

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [fMember, setFM]      = useState('')
  const [fTeam,   setFT]      = useState('')
  const [dragging, setDragging] = useState(null)
  const [form, setForm]       = useState(blank(userName))
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  // ── Workflow automation: poll for pending 24h review tasks on mount ──
  useEffect(() => {
    checkPendingReviewTasks().catch(console.warn)
  }, [])

  function openNew(col = 'To do') { setForm({ ...blank(userName), column_name: col }); setEditing(null); setErr(''); setModal(true) }
  function openEdit(r) {
    setForm({ title: r.title, description: r.description || '', team: r.team || 'Creative', assigned_to: r.assigned_to, deadline: r.deadline || '', priority: r.priority, column_name: r.column_name, related_product: r.related_product || '', drive_links: r.drive_links || '', completed: r.completed })
    setEditing(r.id); setErr(''); setModal(true)
  }

  async function save() {
    if (!form.title.trim()) return setErr('Title is required.')
    setSaving(true); setErr('')
    try {
      const entry = { ...form, column_name: form.completed ? 'Done' : form.column_name }
      if (editing) await update(editing, entry)
      else await insert(entry)
      setModal(false)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function toggleDone(task) {
    const completed   = !task.completed
    const column_name = completed ? 'Done' : 'To do'
    try {
      await update(task.id, { completed, column_name })
      // ── Workflow automation: check step 2 and step 3 triggers ──
      if (completed && task.related_product) {
        const updatedTask = { ...task, completed: true }
        // Check if all Saida creative tasks are done → create campaign task
        checkSaidaTasksCompleted(task.related_product, rows.map(r => r.id === task.id ? updatedTask : r)).catch(console.warn)
        // Check if the campaign task was just completed → start 24h timer
        checkCampaignTaskCompleted(updatedTask).catch(console.warn)
      }
    } catch (e) { alert(e.message) }
  }

  async function moveTask(id, column_name) {
    try { await update(id, { column_name, completed: column_name === 'Done' }) } catch (e) { alert(e.message) }
  }

  async function del(id) {
    if (!isAdmin && rows.find(r => r.id === id)?.assigned_to !== userName) return alert('You can only delete your own tasks.')
    if (!confirm('Delete task?')) return
    try { await remove(id) } catch (e) { alert(e.message) }
  }

  const F = rows.filter(r => (!fMember || r.assigned_to === fMember) && (!fTeam || r.team === fTeam))
  const grouped = TASK_COLS.reduce((acc, c) => { acc[c] = F.filter(r => r.column_name === c); return acc; }, {})

  return (
    <div>
      <PageHeader title="✅ Task Manager" subtitle="Kanban board — drag cards between columns"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <FilterSel value={fMember} onChange={setFM} options={TEAM} placeholder="All members" />
            <FilterSel value={fTeam}   onChange={setFT} options={TEAMS_LIST} placeholder="All teams" />
            <Btn onClick={() => openNew()}>+ Add Task</Btn>
          </div>
        }
      />
      {error && <ErrorBanner message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, overflowX: 'auto' }}>
        {TASK_COLS.map(col => (
          <div key={col}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragging) { moveTask(dragging, col); setDragging(null) } }}
            style={{ background: C.bg, borderRadius: 14, padding: 14, minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_META[col]?.text || C.textLight }} />
              <span style={{ fontWeight: 800, fontSize: 13 }}>{col}</span>
              <span style={{ marginLeft: 'auto', background: C.border, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: C.textMid }}>{grouped[col]?.length}</span>
            </div>

            {loading && <div style={{ color: C.textLight, fontSize: 12, textAlign: 'center', padding: '10px 0' }}>Loading…</div>}

            {grouped[col]?.map(t => (
              <div key={t.id} draggable
                onDragStart={() => setDragging(t.id)}
                onDragEnd={() => setDragging(null)}
                style={{ background: C.surface, borderRadius: 10, padding: 13, marginBottom: 10, border: `1.5px solid ${C.border}`, cursor: 'grab', opacity: t.completed ? 0.7 : 1 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7, cursor: 'pointer', flex: 1 }}>
                    <input type="checkbox" checked={t.completed} onChange={() => toggleDone(t)}
                      style={{ marginTop: 2, accentColor: C.accent, width: 13, height: 13, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3, textDecoration: t.completed ? 'line-through' : 'none', color: C.text }}>
                      {t.title}
                    </span>
                  </label>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_META[t.priority]?.color, flexShrink: 0, marginTop: 3 }} />
                </div>

                {t.description && <p style={{ margin: '0 0 8px 20px', fontSize: 11.5, color: C.textMid, lineHeight: 1.4 }}>{t.description.slice(0, 70)}{t.description.length > 70 ? '…' : ''}</p>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, marginLeft: 20 }}>
                  {t.team && <Tag label={t.team} meta={{ bg: C.bg, text: C.textMid }} />}
                  {t.related_product && <Tag label={t.related_product} meta={{ bg: C.blueLight, text: C.blue }} />}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 20 }}>
                  <Avatar name={t.assigned_to} size={22} />
                  <span style={{ fontSize: 10.5, color: C.textLight }}>{t.deadline}</span>
                </div>

                <div style={{ display: 'flex', gap: 5, marginTop: 8, marginLeft: 20 }}>
                  <Btn sm variant="ghost"  onClick={() => openEdit(t)}>Edit</Btn>
                  <Btn sm variant="danger" onClick={() => del(t.id)}>Del</Btn>
                </div>
              </div>
            ))}

            <button onClick={() => openNew(col)}
              style={{ width: '100%', padding: '8px', borderRadius: 8, border: `1.5px dashed ${C.border}`, background: 'transparent', color: C.textLight, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Task' : 'New Task'} onClose={() => setModal(false)}>
          {err && <ErrorBanner message={err} />}
          <FL label="Title"><Inp value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" /></FL>
          <FL label="Description"><TA value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details…" /></FL>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <FL label="Team"><Sel value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}>{TEAMS_LIST.map(t => <option key={t}>{t}</option>)}</Sel></FL>
            <FL label="Assigned To"><Sel value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>{TEAM.map(m => <option key={m}>{m}</option>)}</Sel></FL>
            <FL label="Priority"><Sel value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</Sel></FL>
          </div>
          <Row>
            <FL label="Deadline" half><Inp type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></FL>
            <FL label="Column" half>
              <Sel value={form.column_name} onChange={e => setForm({ ...form, column_name: e.target.value, completed: e.target.value === 'Done' })}>
                {TASK_COLS.map(c => <option key={c}>{c}</option>)}
              </Sel>
            </FL>
          </Row>
          <FL label="Related Product / Creative"><Inp value={form.related_product} onChange={e => setForm({ ...form, related_product: e.target.value })} placeholder="Optional" /></FL>
          <FL label="Google Drive Links"><Inp value={form.drive_links} onChange={e => setForm({ ...form, drive_links: e.target.value })} placeholder="https://drive.google.com/…" /></FL>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
            <input type="checkbox" checked={form.completed}
              onChange={e => setForm({ ...form, completed: e.target.checked, column_name: e.target.checked ? 'Done' : form.column_name })}
              style={{ accentColor: C.accent, width: 15, height: 15 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Mark as completed (moves to Done)</span>
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
