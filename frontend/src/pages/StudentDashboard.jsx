import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, ThumbsUp, ExternalLink, RefreshCw, FileText, Shield,
  Bell, HelpCircle, ClipboardList, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import { getAuthUser, getAuthToken } from '../App.jsx';

const API = 'http://localhost:5000/api';

function getSessionToken() {
  let t = localStorage.getItem('kcet_session');
  if (!t) { t = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('kcet_session', t); }
  return t;
}
function getStorageKey(user) {
  // Use user-specific key if logged in (isolated per user), else shared anonymous key
  const identifier = user?._id || user?.id || user?.email;
  return identifier ? `kcet_tracking_ids_${identifier}` : 'kcet_tracking_ids';
}
function getStoredIds(user) {
  try { return JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]'); } catch { return []; }
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const token = getAuthToken();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supportId, setSupportId] = useState('');
  const [supporting, setSupporting] = useState('');
  const [manualId, setManualId] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('complaints');
  // Pagination
  const [sPage, setSPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const ids = getStoredIds(user);
      if (token) {
        const query = ids.length ? `?trackingIds=${encodeURIComponent(JSON.stringify(ids))}` : '';
        const res = await fetch(`${API}/complaints/my-complaints${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || []);
          setLoading(false);
          return;
        }
      }
      if (ids.length) {
        const results = await Promise.all(
          ids.map(id =>
            fetch(`${API}/complaints/track/${id}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        setComplaints(results.filter(Boolean));
      } else {
        setComplaints([]);
      }
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  async function handleSupport(trackingId) {
    setSupporting(trackingId);
    try {
      const res = await fetch(`${API}/complaints/${trackingId}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: getSessionToken() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`✅ Support recorded! ${data.supportCount} students have supported this.`);
      const ids = getStoredIds(user);
      if (!ids.includes(trackingId)) { ids.unshift(trackingId); localStorage.setItem(getStorageKey(user), JSON.stringify(ids.slice(0, 20))); }
      loadComplaints();
    } catch (err) { toast.error(err.message || 'Could not record support.'); }
    finally { setSupporting(''); }
  }

  async function handleManualSearch(e) {
    e.preventDefault();
    if (!manualId.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API}/complaints/track/${manualId.trim().toUpperCase()}`);
      if (!res.ok) throw new Error('Complaint not found. Check the tracking ID.');
      const data = await res.json();
      const ids = getStoredIds(user);
      if (!ids.includes(data.trackingId)) { ids.unshift(data.trackingId); localStorage.setItem(getStorageKey(user), JSON.stringify(ids.slice(0, 20))); }
      toast.success('Complaint added to your dashboard.');
      setManualId('');
      loadComplaints();
    } catch (err) { toast.error(err.message || 'Lookup failed.'); }
    finally { setSearching(false); }
  }

  // Stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Submitted').length,
    inReview: complaints.filter(c => ['Under Review', 'In Progress', 'Awaiting Information'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
  };

  const STAT_CARDS = [
    { label: 'Total Complaints', value: stats.total, color: 'var(--accent-light)', icon: <ClipboardList size={20} style={{ color: 'var(--accent-light)' }} />, bg: 'var(--accent-dim)' },
    { label: 'Pending', value: stats.pending, color: 'var(--amber)', icon: <Clock size={20} style={{ color: 'var(--amber)' }} />, bg: 'var(--amber-dim)' },
    { label: 'Under Review', value: stats.inReview, color: 'var(--blue)', icon: <AlertCircle size={20} style={{ color: 'var(--blue)' }} />, bg: 'var(--blue-dim)' },
    { label: 'Resolved', value: stats.resolved, color: 'var(--green)', icon: <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />, bg: 'var(--green-dim)' },
  ];

  const QUICK_ACTIONS = [
    { icon: '📝', label: 'Submit Complaint', desc: 'Report an issue or concern', link: '/submit', color: 'var(--accent-dim)', textColor: 'var(--accent-light)' },
    { icon: '🔍', label: 'Track Complaint', desc: 'Check status by tracking ID', link: '/track', color: 'var(--blue-dim)', textColor: 'var(--blue)' },
    { icon: '🔔', label: 'Notifications', desc: 'View status updates', link: '/notifications', color: 'var(--purple-dim)', textColor: 'var(--purple)' },
    { icon: '🛡️', label: 'Safety Report', desc: 'Confidential safety reporting', link: '/safety', color: 'var(--safety-dim)', textColor: 'var(--safety)', border: '1px solid var(--safety-border)' },
  ];

  const statusColor = {
    'Submitted': 'var(--accent-light)', 'Under Review': 'var(--blue)',
    'In Progress': 'var(--amber)', 'Escalated': 'var(--red)',
    'Resolved': 'var(--green)', 'Closed': 'var(--text-3)',
    'Awaiting Information': 'var(--purple)', 'Reopened': 'var(--safety)',
  };

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(complaints.length / ITEMS_PER_PAGE));
  const pagedComplaints = complaints.slice((sPage - 1) * ITEMS_PER_PAGE, sPage * ITEMS_PER_PAGE);

  return (
    <div style={{ padding: '32px 20px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Welcome banner */}
      <div className="card fade-up" style={{
        background: 'linear-gradient(135deg, rgba(79,110,247,0.18) 0%, rgba(176,102,245,0.10) 100%)',
        border: '1px solid rgba(79,110,247,0.22)', marginBottom: 28,
        flexDirection: 'row', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="section-eyebrow" style={{ marginBottom: 6 }}>Student Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ' back'}! 👋
          </h1>
          <p className="text-sm text-muted">
            Track your complaints and submissions. {complaints.length > 0 ? `You have ${stats.pending + stats.inReview} active complaint${stats.pending + stats.inReview !== 1 ? 's' : ''}.` : 'Submit your first complaint to get started.'}
          </p>
        </div>
        <Link to="/submit" className="btn btn--primary">
          <Plus size={16} /> New Complaint
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stat-cards fade-up-1" style={{ marginBottom: 28 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className="stat-card__label">{s.label}</div>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
            </div>
            <div className="stat-card__value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 32 }} className="fade-up-2">
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: 11 }}>Quick Actions</div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} to={a.link} className="quick-action" style={{ border: a.border || '1px solid var(--border)' }}>
              <div className="quick-action__icon" style={{ background: a.color }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
              </div>
              <div className="quick-action__label" style={{ color: 'var(--text)' }}>{a.label}</div>
              <div className="quick-action__desc">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Add by tracking ID */}
      <div className="card fade-up-3" style={{ marginBottom: 24, gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={15} style={{ color: 'var(--accent-light)' }} /> Add Complaint to Dashboard
        </div>
        <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            value={manualId}
            onChange={e => setManualId(e.target.value.toUpperCase())}
            placeholder="Enter tracking ID, e.g. KCET-2026-A1B2C3"
            style={{ flex: 1, minWidth: 200, fontFamily: 'monospace', letterSpacing: 1 }}
          />
          <button type="submit" className="btn btn--primary btn--sm" disabled={searching || !manualId.trim()}>
            {searching ? 'Searching…' : 'Track & Add'}
          </button>
        </form>
        <p className="text-xs text-muted">Enter any complaint's tracking ID to add it to your dashboard and monitor its progress.</p>
      </div>

      {/* Complaints list header */}
      <div className="flex items-center justify-between mb-3">
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {complaints.length > 0
            ? `Your Complaints (${complaints.length})`
            : 'No complaints tracked yet'}
          {complaints.length > 0 && totalPages > 1 && (
            <span className="text-sm text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
              — Page {sPage} of {totalPages}
            </span>
          )}
        </div>
        <button className="btn btn--ghost btn--sm" onClick={loadComplaints} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && complaints.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 56 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No complaints in your history</div>
          <p className="text-sm text-muted mb-6">Submit a complaint or enter a tracking ID above to get started.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/submit" className="btn btn--primary"><FileText size={14} /> Submit Complaint</Link>
            <Link to="/safety" className="btn btn--danger"><Shield size={14} /> Safety Report</Link>
          </div>
        </div>
      )}

      {/* Complaint cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pagedComplaints.map((c, idx) => (
          <div key={c.trackingId} className={`card fade-up-${(idx % 4) + 1}`} style={{ gap: 14 }}>
            {/* Header */}
            <div className="complaint-card__header">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-light)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                  {c.trackingId}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.mainCategory}</div>
                {c.subcategory && <div className="text-sm text-muted">{c.subcategory}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <StatusBadge status={c.status} />
                {c.nlpCategory && (
                  <span className="nlp-pill" style={{ fontSize: 10 }}>🤖 {c.nlpCategory}</span>
                )}
              </div>
            </div>

            {/* Assignment */}
            {c.assignedDepartment && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                <span style={{ fontSize: 13 }}>📍</span>
                Assigned to: <strong>{c.assignedDepartment}</strong>
              </div>
            )}

            {/* Timeline dots */}
            {c.statusHistory?.length > 0 && (
              <div>
                <div className="text-xs text-muted mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.statusHistory.slice(-3).map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[h.status] || 'var(--text-3)', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600 }}>{h.status}</span>
                        {h.note && <span className="text-muted"> — {h.note}</span>}
                        <div className="text-xs text-muted">{new Date(h.at).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                  {c.statusHistory.length > 3 && (
                    <div className="text-xs text-muted">{c.statusHistory.length - 3} earlier entries…</div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution note */}
            {c.status === 'Resolved' && c.statusHistory?.slice(-1)[0]?.note && (
              <div className="alert alert--success" style={{ fontSize: 13 }}>
                ✅ <strong>Resolution:</strong> {c.statusHistory.slice(-1)[0].note}
              </div>
            )}

            {/* Footer */}
            <div className="complaint-card__meta" style={{ justifyContent: 'space-between', marginTop: 0 }}>
              <div className="flex items-center gap-3">
                <span>📅 {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                {c.supportCount > 0 && <span>👥 {c.supportCount} support{c.supportCount !== 1 ? 's' : ''}</span>}
                {c.resolvedAt && <span style={{ color: 'var(--green)' }}>✅ Resolved {new Date(c.resolvedAt).toLocaleDateString('en-IN')}</span>}
              </div>
              <div className="flex gap-2">
                {c.status !== 'Resolved' && c.status !== 'Closed' && (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={supporting === c.trackingId}
                    onClick={() => handleSupport(c.trackingId)}
                    style={{ fontSize: 12 }}
                  >
                    <ThumbsUp size={12} />
                    {supporting === c.trackingId ? 'Recording…' : 'Support (+1)'}
                  </button>
                )}
                <Link to={`/track?id=${c.trackingId}`} className="btn btn--primary btn--sm" style={{ fontSize: 12 }}>
                  <ExternalLink size={12} /> Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {complaints.length > ITEMS_PER_PAGE && (
        <Pagination
          page={sPage}
          totalPages={totalPages}
          total={complaints.length}
          limit={ITEMS_PER_PAGE}
          onPageChange={p => { setSPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      {complaints.length > 0 && (
        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 24 }}>
          Your complaint history is saved in your browser. <Link to="/student-login" style={{ color: 'var(--accent-light)' }}>Create an account</Link> to access it across devices.
        </p>
      )}
    </div>
  );
}
