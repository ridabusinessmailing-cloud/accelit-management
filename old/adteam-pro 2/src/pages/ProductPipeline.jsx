import { useState, useEffect, useRef } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable.js'
import { useAuth } from '../lib/AuthContext.jsx'
import { C, PageHeader, ErrorBanner, Spinner } from '../components/ui.jsx'
import { supabase } from '../lib/supabase.js'
import { triggerProductCreated } from '../hooks/useWorkflowAutomation.js'

// ── Constants ────────────────────────────────────────────
const PRODUCT_STATUSES = ['test', 'active']

const STATUS_STYLE = {
  test:   { bg: '#FDF6E3', color: '#B07D1A', border: '#E8D08A' },
  active: { bg: '#EBF7F1', color: '#1E7B4B', border: '#BBE8D0' },
}

const LOW_WARN = 200  // light red
const LOW_CRIT = 50   // strong red

function rowColors(available) {
  if (available < LOW_CRIT) return { bg: '#FDECEA', border: '#F5C6C2' }
  if (available < LOW_WARN) return { bg: '#FEF3F2', border: '#FECACA' }
  return { bg: '#FFFFFF', border: '#F0EDE8' }
}

const blank = () => ({
  name: '', sku: '', status: 'test',
  available_qty: 0, sold_qty: 0, add_qty: 0, incoming_qty: 0,
})

// ── Editable inline cell ──────────────────────────────────
function Cell({ value, onChange, onCommit, type = 'text', align = 'left', placeholder = '—' }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const ref = useRef(null)

  useEffect(() => { if (editing) ref.current?.select() }, [editing])
  useEffect(() => { if (!editing) setDraft(value) }, [value, editing])

  function commit() {
    setEditing(false)
    const v = type === 'number' ? (parseFloat(draft) || 0) : String(draft)
    if (v !== value) onChange(v)
    onCommit?.()
  }

  function onKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setEditing(false); setDraft(value) }
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type={type === 'number' ? 'number' : 'text'}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        style={{
          width: '100%', padding: '5px 8px', borderRadius: 6,
          border: `2px solid ${C.accent}`, outline: 'none', fontSize: 13.5,
          fontFamily: 'inherit', fontWeight: 500, background: '#fff',
          color: C.text, textAlign: align,
          boxShadow: `0 0 0 3px ${C.accent}18`,
        }}
      />
    )
  }

  const isEmpty = value === '' || value === null || value === undefined
  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        padding: '6px 8px', borderRadius: 6, cursor: 'text',
        color: isEmpty ? C.textLight : C.text,
        fontStyle: isEmpty ? 'italic' : 'normal',
        fontWeight: type === 'number' ? 600 : 500,
        fontSize: 13.5, minHeight: 32,
        display: 'flex', alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#F2F0EC'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {isEmpty ? placeholder : (type === 'number' ? Number(value).toLocaleString() : value)}
    </div>
  )
}

// ── Status toggle pill ────────────────────────────────────
function StatusPill({ value, onToggle }) {
  const [busy, setBusy] = useState(false)
  const s = STATUS_STYLE[value] || STATUS_STYLE.test
  async function click() {
    setBusy(true)
    await onToggle(value === 'test' ? 'active' : 'test')
    setBusy(false)
  }
  return (
    <button onClick={click} disabled={busy} style={{
      background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
      borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
      transition: 'opacity 0.15s',
    }}>
      {value}
    </button>
  )
}

// ── Column header ─────────────────────────────────────────
function TH({ children, align = 'left', width }) {
  return (
    <th style={{
      padding: '11px 12px', textAlign: align, fontSize: 11, fontWeight: 800,
      color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.07em',
      borderBottom: `2px solid ${C.border}`, background: '#FAFAF8',
      whiteSpace: 'nowrap', width,
    }}>
      {children}
    </th>
  )
}

// ── New row inline form ───────────────────────────────────
function NewRowForm({ onSave, onCancel }) {
  const [row, setRow] = useState(blank())
  const [err, setErr] = useState('')
  const nameRef = useRef(null)
  useEffect(() => nameRef.current?.focus(), [])

  function f(field) {
    return e => setRow(r => ({ ...r, [field]: e.target.value }))
  }
  function keyDown(e) {
    if (e.key === 'Enter')  save()
    if (e.key === 'Escape') onCancel()
  }
  async function save() {
    if (!row.name.trim()) return setErr('Name is required')
    setErr('')
    await onSave({
      ...row,
      available_qty: Number(row.available_qty) || 0,
      sold_qty:      Number(row.sold_qty)      || 0,
      add_qty:       Number(row.add_qty)       || 0,
      incoming_qty:  Number(row.incoming_qty)  || 0,
    })
  }

  const inputSt = (extra = {}) => ({
    width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13.5,
    fontFamily: 'inherit', background: '#fff', outline: 'none',
    border: `1.5px solid ${C.border}`, ...extra,
  })
  const numSt = { ...inputSt(), textAlign: 'right' }

  return (
    <>
      {err && (
        <tr><td colSpan={9}><div style={{ padding: '6px 12px', fontSize: 12, color: C.red }}>{err}</div></td></tr>
      )}
      <tr style={{ background: '#EEF4FD', borderBottom: `2px solid #9EC5F5` }}>
        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 11, color: C.blue, fontWeight: 700 }}>★</td>
        <td style={{ padding: '4px 6px' }}>
          <input ref={nameRef} value={row.name} onChange={f('name')} onKeyDown={keyDown}
            placeholder="Product name *" style={{ ...inputSt(), border: `2px solid ${C.accent}`, fontWeight: 600 }} />
        </td>
        <td style={{ padding: '4px 6px' }}>
          <input value={row.sku} onChange={f('sku')} onKeyDown={keyDown} placeholder="SKU" style={inputSt()} />
        </td>
        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
          <select value={row.status} onChange={f('status')}
            style={{ padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.border}`, fontSize: 12.5, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}>
            {PRODUCT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </td>
        <td style={{ padding: '4px 6px' }}><input type="number" value={row.available_qty} onChange={f('available_qty')} onKeyDown={keyDown} style={numSt} /></td>
        <td style={{ padding: '4px 6px' }}><input type="number" value={row.sold_qty}      onChange={f('sold_qty')}      onKeyDown={keyDown} style={numSt} /></td>
        <td style={{ padding: '4px 6px' }}><input type="number" value={row.add_qty}       onChange={f('add_qty')}       onKeyDown={keyDown} style={numSt} /></td>
        <td style={{ padding: '4px 6px' }}><input type="number" value={row.incoming_qty}  onChange={f('incoming_qty')}  onKeyDown={keyDown} style={numSt} /></td>
        <td style={{ padding: '4px 8px' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            <button onClick={save} title="Save (Enter)"
              style={{ background: C.text, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>✓</button>
            <button onClick={onCancel} title="Cancel (Esc)"
              style={{ background: C.borderLight, color: C.textMid, border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 13, cursor: 'pointer' }}>✕</button>
          </div>
        </td>
      </tr>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function ProductsTable() {
  const { rows, loading, error, insert, update, remove } = useRealtimeTable('products', { orderBy: 'created_at', ascending: true })

  // pending[id] = { field: newValue, ... } — local edits not yet saved
  const [pending,   setPending]   = useState({})
  const [saving,    setSaving]    = useState({}) // id → true while saving
  const [addingRow, setAddingRow] = useState(false)
  const [saveErr,   setSaveErr]   = useState('')
  const [fStatus,   setFStatus]   = useState('')

  // Merge server row with any local pending edits
  function display(row) {
    return { ...row, ...(pending[row.id] || {}) }
  }

  // Queue a local field change
  function queue(id, field, value) {
    setPending(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }))
  }

  // Commit all pending changes for a row — recalculate available
  async function commitRow(id) {
    const changes = pending[id]
    if (!changes || Object.keys(changes).length === 0) return
    setSaving(s => ({ ...s, [id]: true }))
    setSaveErr('')
    try {
      const row    = rows.find(r => r.id === id)
      const merged = { ...row, ...changes }

      // Delta-based recalculation:
      // available += (new_add - old_add) - (new_sold - old_sold)
      const addDelta  = (Number(merged.add_qty)  || 0) - (Number(row.add_qty)  || 0)
      const soldDelta = (Number(merged.sold_qty) || 0) - (Number(row.sold_qty) || 0)
      const newAvail  = Math.max(0, (Number(row.available_qty) || 0) + addDelta - soldDelta)

      await supabase
        .from('products')
        .update({ ...changes, available_qty: newAvail })
        .eq('id', id)

      setPending(p => { const n = { ...p }; delete n[id]; return n })
    } catch (e) {
      setSaveErr(e.message)
    }
    setSaving(s => { const n = { ...s }; delete n[id]; return n })
  }

  // Toggle status directly (no Enter needed)
  async function toggleStatus(id, newStatus) {
    await supabase.from('products').update({ status: newStatus }).eq('id', id)
  }

  async function deleteRow(id) {
    if (!confirm('Delete this product?')) return
    try { await remove(id) } catch (e) { alert(e.message) }
  }

  async function saveNewRow(data) {
    setSaveErr('')
    try {
      await insert(data)
      setAddingRow(false)
      // ── Workflow automation: fire tasks when a "test" product is created ──
      if (data.status === 'test' && data.name?.trim()) {
        triggerProductCreated(data.name.trim()).catch(console.warn)
      }
    } catch (e) { setSaveErr(e.message) }
  }

  const filtered = rows.filter(r => !fStatus || r.status === fStatus)
  const pendingCount = Object.keys(pending).length

  return (
    <div>
      <PageHeader
        title="📦 Products"
        subtitle="Click any cell to edit · Enter to save · Esc to cancel"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Status filter pills */}
            {[{ v: '', label: 'All' }, { v: 'test', label: 'Test' }, { v: 'active', label: 'Active' }].map(({ v, label }) => (
              <button key={v} onClick={() => setFStatus(v)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${fStatus === v ? C.accent : C.border}`,
                background: fStatus === v ? C.accentLight : C.surface,
                color: fStatus === v ? C.accent : C.textMid,
              }}>
                {label}
              </button>
            ))}
            <button
              onClick={() => setAddingRow(true)}
              style={{
                padding: '8px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                background: C.text, color: '#fff',
              }}
            >
              + Add Product
            </button>
          </div>
        }
      />

      {saveErr && <ErrorBanner message={saveErr} />}
      {error    && <ErrorBanner message={error} />}

      {/* Legend + stats row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textLight }}>
          <span style={{ width: 13, height: 13, borderRadius: 3, background: '#FDECEA', border: '1.5px solid #F5C6C2', display: 'inline-block' }} />
          Critical &lt; {LOW_CRIT} units
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textLight }}>
          <span style={{ width: 13, height: 13, borderRadius: 3, background: '#FEF3F2', border: '1.5px solid #FECACA', display: 'inline-block' }} />
          Low stock &lt; {LOW_WARN} units
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textLight }}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {pendingCount > 0 && (
            <span style={{ marginLeft: 10, color: C.yellow, fontWeight: 600 }}>
              ● {pendingCount} unsaved
            </span>
          )}
        </span>
      </div>

      {/* Spreadsheet table */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 780 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: 48 }} />
            </colgroup>
            <thead>
              <tr>
                <TH width={36}>#</TH>
                <TH>Product Name</TH>
                <TH>SKU</TH>
                <TH align="center">Status</TH>
                <TH align="right">Available</TH>
                <TH align="right">Sold Qty</TH>
                <TH align="right">Add Qty</TH>
                <TH align="right">Incoming</TH>
                <TH align="center" width={48}> </TH>
              </tr>
            </thead>
            <tbody>

              {loading && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center' }}><Spinner /></td></tr>
              )}

              {/* Data rows */}
              {!loading && filtered.map((row, i) => {
                const d      = display(row)
                const rc     = rowColors(d.available_qty ?? 0)
                const hasPend = !!(pending[row.id] && Object.keys(pending[row.id]).length > 0)
                const isSav  = saving[row.id]
                const avail  = d.available_qty ?? 0
                const availColor = avail < LOW_CRIT ? '#C0392B' : avail < LOW_WARN ? '#B07D1A' : '#1E7B4B'

                return (
                  <tr key={row.id} style={{
                    background: rc.bg,
                    borderBottom: `1px solid ${rc.border}`,
                    opacity: isSav ? 0.65 : 1,
                    transition: 'background 0.25s, opacity 0.15s',
                  }}>
                    {/* Row # / status indicator */}
                    <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: 11.5, color: C.textLight, fontWeight: 500 }}>
                      {isSav
                        ? <span style={{ fontSize: 12, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                        : hasPend
                          ? <span style={{ width: 7, height: 7, background: C.accent, borderRadius: '50%', display: 'inline-block' }} title="Unsaved changes" />
                          : <span style={{ color: C.textLight }}>{i + 1}</span>
                      }
                    </td>

                    {/* Product name */}
                    <td style={{ padding: '2px 6px' }}>
                      <Cell value={d.name || ''} placeholder="Product name"
                        onChange={v => queue(row.id, 'name', v)}
                        onCommit={() => commitRow(row.id)} />
                    </td>

                    {/* SKU */}
                    <td style={{ padding: '2px 6px' }}>
                      <Cell value={d.sku || ''} placeholder="SKU"
                        onChange={v => queue(row.id, 'sku', v)}
                        onCommit={() => commitRow(row.id)} />
                    </td>

                    {/* Status pill */}
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <StatusPill
                        value={d.status || 'test'}
                        onToggle={newStatus => toggleStatus(row.id, newStatus)}
                      />
                    </td>

                    {/* Available — calculated, read-only display */}
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: availColor, fontVariantNumeric: 'tabular-nums' }}>
                        {avail.toLocaleString()}
                      </span>
                    </td>

                    {/* Sold qty */}
                    <td style={{ padding: '2px 6px' }}>
                      <Cell value={d.sold_qty ?? 0} type="number" align="right"
                        onChange={v => queue(row.id, 'sold_qty', v)}
                        onCommit={() => commitRow(row.id)} />
                    </td>

                    {/* Add qty */}
                    <td style={{ padding: '2px 6px' }}>
                      <Cell value={d.add_qty ?? 0} type="number" align="right"
                        onChange={v => queue(row.id, 'add_qty', v)}
                        onCommit={() => commitRow(row.id)} />
                    </td>

                    {/* Incoming qty — informational only */}
                    <td style={{ padding: '2px 6px' }}>
                      <Cell value={d.incoming_qty ?? 0} type="number" align="right"
                        onChange={v => queue(row.id, 'incoming_qty', v)}
                        onCommit={() => commitRow(row.id)} />
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteRow(row.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#D1C9C0', padding: 4, borderRadius: 5, lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#C0392B'}
                        onMouseLeave={e => e.currentTarget.style.color = '#D1C9C0'}
                        title="Delete row"
                      >🗑</button>
                    </td>
                  </tr>
                )
              })}

              {/* Empty state */}
              {!loading && filtered.length === 0 && !addingRow && (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: C.textLight, fontSize: 14 }}>
                    No products yet. Click <strong>+ Add Product</strong> to get started.
                  </td>
                </tr>
              )}

              {/* New row form */}
              {addingRow && (
                <NewRowForm
                  onSave={saveNewRow}
                  onCancel={() => setAddingRow(false)}
                />
              )}

            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, background: '#FAFAF8', display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Total available', value: filtered.reduce((s, r) => s + (r.available_qty || 0), 0) },
              { label: 'Total sold',      value: filtered.reduce((s, r) => s + (r.sold_qty      || 0), 0) },
              { label: 'Total incoming',  value: filtered.reduce((s, r) => s + (r.incoming_qty  || 0), 0) },
            ].map(({ label, value }) => (
              <span key={label} style={{ fontSize: 12.5, color: C.textLight }}>
                {label}: <strong style={{ color: C.text }}>{value.toLocaleString()}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 11.5, color: C.textLight, textAlign: 'center' }}>
        Click any cell to edit ·&nbsp;
        <kbd style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10.5 }}>Enter</kbd>
        &nbsp;to save ·&nbsp;
        <kbd style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10.5 }}>Esc</kbd>
        &nbsp;to cancel · Status pill toggles on click
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
