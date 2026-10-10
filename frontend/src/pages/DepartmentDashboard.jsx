/**
 * DepartmentDashboard.jsx
 * ─────────────────────────────────────────────────────────────────
 * Each department staff sees ONLY complaints assigned to their dept.
 * Status changes & responses are visible to student + admin.
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw, MessageSquare, CheckCircle2, Clock,
  AlertTriangle, ChevronDown, ChevronUp, Building2,
  Send, History,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { getAuthToken, getAuthUser } from '../App.jsx';

const API = 'http://localhost:5000/api';
const STATUSES = [
  'Under Review', 'Awaiting Information', 'In Progress',
  'Escalated', 'Resolved', 'Closed',
];

function authHeader() {
  return { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' };
}

// ── Dept colour/icon map ──────────────────────────────────────────
const DEPT_META = {
  'Hostel Management':                      { icon: '🏠', color: '#6366f1' },
  'Canteen Management':                     { icon: '🍽️', color: '#f59e0b' },
  'Facilities & Maintenance Department':    { icon: '🔧', color: '#64748b' },
  'Transport Office':                       { icon: '🚌', color: '#0ea5e9' },
  'Physical Education Department':          { icon: '⚽', color: '#22c55e' },
  'Librarian':                              { icon: '📚', color: '#a855f7' },
  'IT Department':                          { icon: '💻', color: '#3b82f6' },
  'Examinations Cell / COE':               { icon: '📝', color: '#ef4444' },
  'Accounts & Finance Office':             { icon: '💰', color: '#f97316' },
  'Student Welfare Officer':               { icon: '🩺', color: '#ec4899' },
  'Safety Review Committee (RESTRICTED)':  { icon: '🛡️', color: '#dc2626' },
  'Relevant Department HOD / Principal':   { icon: '👨‍🏫', color: '#7c3aed' },
  'Placement Cell':                        { icon: '🎓', color: '#0891b2' },
  'Facilities & Administration':           { icon: '🌿', color: '#16a34a' },
  'Student Affairs / Dean of Students':   { icon: '🎉', color: '#db2777' },
  'College Administration Office':         { icon: '🏢', color: '#475569' },
  'Campus Administration':                 { icon: '🛒', color: '#92400e' },
};

// ── Complaint row card ────────────────────────────────────────────
function ComplaintRow({ c, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'box-shadow .2s',
      }}
      className="complaint-row"
    >
      {/* Header */}
      <div
        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: 13, minWidth: 150 }}>
          {c.trackingId}
        </div>
        <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{c.mainCategory}</div>
        <StatusBadge status={c.status} />
        <div style={{ fontSize: 12, color: 'var(--text-2)', minWidth: 90, textAlign: 'right' }}>
          {new Date(c.createdAt).toLocaleDateString('en-IN')}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.subcategory && (
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ fontWeight: 600 }}>Sub-category: </span>{c.subcategory}
            </div>
          )}

          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', fontSize: 14, lineHeight: 1.6 }}>
            {c.description}
          </div>

          {/* Status history mini-timeline */}
          {c.statusHistory?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <History size={12} /> Activity Log
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {c.statusHistory.slice(-4).map((h, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{h.status}</span>
                    {h.note && <span>— {h.note}</span>}
                    {h.by && <span style={{ opacity: 0.6 }}>by {h.by}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin response if any */}
          {c.adminResponse && (
            <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>📩 Previous Response to Student</div>
              {c.adminResponse}
            </div>
          )}

          <button
            className="btn btn--primary btn--sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => onSelect(c)}
          >
            <MessageSquare size={14} /> Manage This Complaint
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function DepartmentDashboard() {
  const user = getAuthUser();
  const dept = user?.department || '';
  const meta = DEPT_META[dept] || { icon: '🏢', color: '#6366f1' };

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]             = useState(1);

  // Modal state
  const [selected, setSelected]     = useState(null);
  const [newStatus, setNewStatus]   = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [response, setResponse]     = useState('');
  const [saving, setSaving]         = useState(false);

  // Stats
  const open     = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filterStatus) params.set('status', filterStatus);
      // Filter by this department
      if (dept) params.set('department', dept);
      const res  = await fetch(`${API}/complaints?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.message || 'Could not load complaints.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, dept]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  function openModal(c) {
    setSelected(c);
    setNewStatus(c.status);
    setStatusNote('');
    setResponse(c.adminResponse || '');
  }

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    try {
      // 1. Update status
      const sRes = await fetch(`${API}/complaints/${selected._id}/status`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      if (!sRes.ok) {
        const d = await sRes.json();
        throw new Error(d.message);
      }

      // 2. Post response if filled
      if (response.trim()) {
        const rRes = await fetch(`${API}/complaints/${selected._id}/response`, {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({ response: response.trim() }),
        });
        if (!rRes.ok) {
          const d = await rRes.json();
          throw new Error(d.message);
        }
      }

      toast.success('✅ Complaint updated — student & admin can now see the changes!');
      setSelected(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="dashboard__sidebar">
        {/* Dept badge */}
        <div style={{
          background: `linear-gradient(135deg, ${meta.color}22, ${meta.color}11)`,
          border: `1px solid ${meta.color}44`,
          borderRadius: 12,
          padding: '14px 12px',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{meta.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: meta.color }}>{dept}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{user?.name}</div>
        </div>

        <div className="sidebar__label">Filter by Status</div>
        {['', ...STATUSES].map(s => (
          <button
            key={s}
            className={`sidebar__item${filterStatus === s ? ' active' : ''}`}
            onClick={() => { setFilterStatus(s); setPage(1); }}
          >
            {s || 'All Statuses'}
          </button>
        ))}

        <div className="sidebar__divider" />

        {/* Stats */}
        <div className="sidebar__label">My Department Stats</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-2)' }}>Total Assigned</span>
            <span style={{ fontWeight: 700 }}>{total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-2)' }}>Open</span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{open}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-2)' }}>Resolved</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{resolved}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-2)' }}>Escalated</span>
            <span style={{ fontWeight: 700, color: '#ef4444' }}>{escalated}</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dashboard__main">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{meta.icon}</span> {dept} — Complaint Queue
            </h1>
            <div className="text-sm text-muted">
              Only complaints assigned to your department are shown here
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={fetchComplaints} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', val: total,    icon: <Building2 size={14} />,    color: '#6366f1' },
            { label: 'Open',  val: open,     icon: <Clock size={14} />,        color: '#f59e0b' },
            { label: 'Done',  val: resolved, icon: <CheckCircle2 size={14} />, color: '#22c55e' },
            { label: 'Escalated', val: escalated, icon: <AlertTriangle size={14} />, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{
              background: `${s.color}15`,
              border: `1px solid ${s.color}33`,
              borderRadius: 10,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: s.color,
              fontWeight: 700,
              fontSize: 14,
            }}>
              {s.icon} {s.val} {s.label}
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)}
          </div>
        )}

        {/* Complaint list */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {complaints.map(c => (
              <ComplaintRow key={c._id} c={c} onSelect={openModal} />
            ))}
            {complaints.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontWeight: 700 }}>No complaints assigned to {dept}</div>
                <div className="text-sm text-muted mt-2">
                  When admin assigns a complaint to your department it will appear here.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex gap-3 items-center justify-between mt-6">
            <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="text-sm text-muted">Page {page} · {total} total</span>
            <button className="btn btn--ghost btn--sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </main>

      {/* ── Manage Modal ── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            className="card fade-up"
            style={{ maxWidth: 580, width: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800 }}>
                  {meta.icon} Manage Complaint
                </h2>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)', marginTop: 2 }}>
                  {selected.trackingId}
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Info row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="text-xs text-muted">Category</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{selected.mainCategory}</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="text-xs text-muted">Current Status</div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-xs text-muted mb-1">Student's Complaint</div>
              <p style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)' }}>
                {selected.description}
              </p>
            </div>

            {/* ── Info banner ── */}
            <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent)' }}>
              ℹ️ Any changes you make here will be <strong>immediately visible to the student and admin dashboard</strong>.
            </div>

            {/* Update Status */}
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Internal note */}
            <div className="form-group">
              <label className="form-label">Internal Note (audit trail)</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 70 }}
                placeholder="Add notes about the action taken (internal record)…"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
              />
            </div>

            {/* Response to student */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={13} style={{ color: 'var(--accent)' }} />
                Response to Student (visible to student)
              </label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 90 }}
                placeholder="Write a message to the student about this complaint… (student will see this when they track)"
                value={response}
                onChange={e => setResponse(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button className="btn btn--primary" disabled={saving} onClick={saveChanges}>
                {saving ? 'Saving…' : '✓ Save Changes'}
              </button>
              <button className="btn btn--ghost" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
