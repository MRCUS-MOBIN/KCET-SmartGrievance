import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, AlertTriangle, Tag } from 'lucide-react';
import ComplaintCard from '../components/ComplaintCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import NLPPreview from '../components/NLPPreview.jsx';
import EscalationTimeline from '../components/EscalationTimeline.jsx';
import CATEGORIES from '../data/categories.js';
import { getAuthToken, getAuthUser } from '../App.jsx';

const API = 'http://localhost:5000/api';
const STATUSES = ['Submitted','Under Review','Awaiting Information','In Progress','Escalated','Resolved','Reopened','Closed'];

function authHeader() {
  return { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' };
}

export default function StaffDashboard() {
  const user = getAuthUser();
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('queue'); // queue | needsReview

  // Update status modal state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Escalation state
  const [escalateNote, setEscalateNote] = useState('');
  const [escalating, setEscalating] = useState(false);

  // NLP correction state
  const [nlpCorrectedCat, setNlpCorrectedCat] = useState('');
  const [correctingNlp, setCorrectingNlp] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filterStatus) params.set('status', filterStatus);
      if (filterCat) params.set('category', filterCat);
      // Staff never see sensitive — backend enforces this
      const res = await fetch(`${API}/complaints?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.message || 'Could not load complaints.');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterCat]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  async function updateStatus() {
    if (!newStatus || !selected) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/complaints/${selected._id}/status`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Status updated to "${newStatus}"`);
      setSelected(null);
      setNewStatus(''); setStatusNote('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    } finally {
      setUpdating(false);
    }
  }

  async function escalateComplaint() {
    if (!selected) return;
    setEscalating(true);
    try {
      const res = await fetch(`${API}/complaints/${selected._id}/escalate`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ note: escalateNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('Complaint escalated to next level.');
      setSelected(null); setEscalateNote('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Escalation failed.');
    } finally {
      setEscalating(false);
    }
  }

  async function correctNlpCategory() {
    if (!selected || !nlpCorrectedCat) return;
    setCorrectingNlp(true);
    try {
      const res = await fetch(`${API}/complaints/${selected._id}/nlp`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ correctedCategory: nlpCorrectedCat, correctedBy: user?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('NLP category corrected. Thank you for improving the system.');
      setNlpCorrectedCat('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'NLP correction failed.');
    } finally {
      setCorrectingNlp(false);
    }
  }

  const needsReview = complaints.filter(c => c.nlp?.needsHumanReview);
  const escalatedComplaints = complaints.filter(c => c.status === 'Escalated');

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard__sidebar">
        <div className="sidebar__label">Filter by Status</div>
        {['', ...STATUSES].map(s => (
          <button key={s} className={`sidebar__item${filterStatus === s ? ' active' : ''}`} onClick={() => { setFilterStatus(s); setPage(1); }}>
            {s || 'All Statuses'}
          </button>
        ))}
        <div className="sidebar__divider" />
        <div className="sidebar__label">View</div>
        <button className={`sidebar__item${tab === 'queue' ? ' active' : ''}`} onClick={() => setTab('queue')}>
          📋 My Queue ({total})
        </button>
        <button className={`sidebar__item${tab === 'needsReview' ? ' active' : ''}`} onClick={() => setTab('needsReview')}>
          ⚠️ Needs NLP Review ({needsReview.length})
        </button>
        <button className={`sidebar__item${tab === 'escalated' ? ' active' : ''}`} onClick={() => { setFilterStatus('Escalated'); setTab('escalated'); }}>
          🔺 Escalated ({escalatedComplaints.length})
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard__main">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800 }}>
              Staff Dashboard
            </h1>
            <div className="text-sm text-muted">Logged in as {user?.name} · {user?.department || user?.role}</div>
          </div>
          <div className="flex gap-3">
            <input className="form-input" placeholder="Filter by category…" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 200 }} />
            <button className="btn btn--ghost btn--sm" onClick={fetchComplaints} disabled={loading}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
          </div>
        )}

        {!loading && (
          <div className="complaint-list">
            {(tab === 'queue' ? complaints : needsReview).map(c => (
              <ComplaintCard
                key={c._id}
                complaint={c}
                onSelect={setSelected}
                actions={
                  <button className="btn btn--ghost btn--sm" onClick={() => { setSelected(c); setNewStatus(c.status); }}>
                    Update Status →
                  </button>
                }
              />
            ))}
            {complaints.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontWeight: 600 }}>No complaints found</div>
                <div className="text-sm text-muted mt-2">Try changing the filters or refresh.</div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="flex gap-3 items-center justify-between mt-6">
            <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
            <span className="text-sm text-muted">Page {page} · {total} total</span>
            <button className="btn btn--ghost btn--sm" disabled={page * 15 >= total} onClick={() => setPage(p => p+1)}>Next →</button>
          </div>
        )}
      </main>

      {/* Update Status Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="card fade-up" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800 }}>Update Complaint</h2>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div>
              <div className="text-xs text-muted mb-1">Tracking ID</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{selected.trackingId}</div>
            </div>

            <div>
              <div className="text-xs text-muted mb-1">Category</div>
              <div style={{ fontWeight: 600 }}>{selected.mainCategory} › {selected.subcategory}</div>
            </div>

            {selected.description && (
              <div>
                <div className="text-xs text-muted mb-1">Description</div>
                <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.6, background: 'var(--bg3)', padding: '10px 12px', borderRadius: 8 }}>
                  {selected.description}
                </p>
              </div>
            )}

            <NLPPreview nlp={selected.nlp} />

            {/* ── NLP Category Correction ── */}
            <div className="card" style={{ background: 'var(--bg3)', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={14} style={{ color: 'var(--accent)' }} />
                Correct NLP Category
              </div>
              <p className="text-xs text-muted">If the NLP predicted the wrong category, correct it here. Your correction improves future predictions.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ flex: 1 }}
                  value={nlpCorrectedCat}
                  onChange={e => setNlpCorrectedCat(e.target.value)}
                >
                  <option value="">— Select correct category —</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.label}>{c.icon} {c.label}</option>)}
                </select>
                <button
                  className="btn btn--primary btn--sm"
                  disabled={!nlpCorrectedCat || correctingNlp}
                  onClick={correctNlpCategory}
                >
                  {correctingNlp ? 'Saving…' : 'Confirm Correction'}
                </button>
              </div>
            </div>

            {/* ── Escalation ── */}
            {selected.status !== 'Resolved' && selected.status !== 'Closed' && (
              <div className="card" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)' }}>
                  <AlertTriangle size={14} />
                  Escalate to Next Level
                </div>
                <p className="text-xs text-muted">Use when the issue requires higher authority intervention. This is logged permanently.</p>
                {selected.status === 'Escalated' && (
                  <EscalationTimeline complaint={selected} />
                )}
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 60 }}
                  value={escalateNote}
                  onChange={e => setEscalateNote(e.target.value)}
                  placeholder="Why is this being escalated? (optional note)"
                />
                <button
                  className="btn btn--sm"
                  style={{ background: 'var(--amber)', color: '#000', fontWeight: 700, alignSelf: 'flex-start' }}
                  disabled={escalating}
                  onClick={escalateComplaint}
                >
                  {escalating ? 'Escalating…' : '🔺 Escalate'}
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Resolution Note (optional)</label>
              <textarea className="form-textarea" style={{ minHeight: 80 }} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Add notes for the student or for internal records…" />
            </div>

            <div className="flex gap-3">
              <button className="btn btn--primary" disabled={updating} onClick={updateStatus}>
                {updating ? 'Saving…' : 'Save Update'}
              </button>
              <button className="btn btn--ghost" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
