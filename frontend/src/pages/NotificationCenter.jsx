import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCheck, FileText, Info, AlertTriangle, Star, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthToken, getAuthUser } from '../App.jsx';

const API = 'http://localhost:5000/api';

function getSessionToken() {
  let t = localStorage.getItem('kcet_session');
  if (!t) { t = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('kcet_session', t); }
  return t;
}

const TYPE_META = {
  complaint_submitted: { icon: '📝', bg: 'var(--blue-dim)',   label: 'Submitted'  },
  complaint_assigned:  { icon: '📍', bg: 'var(--accent-dim)', label: 'Assigned'   },
  status_changed:      { icon: '🔄', bg: 'var(--amber-dim)',  label: 'Updated'    },
  admin_response:      { icon: '💬', bg: 'var(--purple-dim)', label: 'Response'   },
  complaint_resolved:  { icon: '✅', bg: 'var(--green-dim)',  label: 'Resolved'   },
  complaint_reopened:  { icon: '🔁', bg: 'var(--amber-dim)',  label: 'Reopened'   },
  escalation:          { icon: '⚠️', bg: 'var(--red-dim)',    label: 'Escalated'  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Demo notifications for empty state
const DEMO_NOTIFS = [
  { _id: 'd1', type: 'complaint_submitted', title: 'Complaint Submitted', message: 'Complaint KCET-2026-DEMO01 has been received and is under initial review.', relatedComplaintId: 'KCET-2026-DEMO01', isRead: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { _id: 'd2', type: 'complaint_assigned', title: 'Complaint Assigned', message: 'Complaint KCET-2026-DEMO01 has been assigned to the Hostel Management department.', relatedComplaintId: 'KCET-2026-DEMO01', isRead: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { _id: 'd3', type: 'admin_response', title: 'New Response', message: 'An authorized staff member has responded to complaint KCET-2026-DEMO01. Please check the complaint for the full response.', relatedComplaintId: 'KCET-2026-DEMO01', isRead: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { _id: 'd4', type: 'complaint_resolved', title: 'Complaint Resolved', message: 'Complaint KCET-2026-DEMO02 has been marked as resolved.', relatedComplaintId: 'KCET-2026-DEMO02', isRead: true, createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
];

export default function NotificationCenter() {
  const user = getAuthUser();
  const token = getAuthToken();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  async function loadNotifs() {
    setLoading(true);
    try {
      const sessionToken = getSessionToken();
      const params = user && token ? '' : `?sessionToken=${sessionToken}`;
      const headers = user && token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/notifications${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications?.length > 0 ? data.notifications : DEMO_NOTIFS);
      } else {
        setNotifs(DEMO_NOTIFS);
      }
    } catch {
      setNotifs(DEMO_NOTIFS);
    }
    setLoading(false);
  }

  useEffect(() => { loadNotifs(); }, []);

  async function markRead(id) {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    try {
      const sessionToken = getSessionToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers, body: JSON.stringify({ sessionToken }) });
    } catch {}
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const sessionToken = getSessionToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers, body: JSON.stringify({ sessionToken }) });
      toast.success('All notifications marked as read');
    } catch {}
    setMarkingAll(false);
  }

  const filtered = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs;
  const unreadCount = notifs.filter(n => !n.isRead).length;

  return (
    <div className="section" style={{ padding: '40px 20px' }}>
      <div className="container container--sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="section-eyebrow">Inbox</div>
            <h1 className="section-title" style={{ marginBottom: 4 }}>Notifications</h1>
            {unreadCount > 0 && (
              <div className="text-sm text-muted">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn--ghost btn--sm" onClick={loadNotifs} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>
            {unreadCount > 0 && (
              <button className="btn btn--ghost btn--sm" onClick={markAllRead} disabled={markingAll}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tab-bar mb-6">
          {[
            { id: 'all', label: `All (${notifs.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
          ].map(f => (
            <button key={f.id} className={`tab-btn${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <Bell size={40} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <div className="text-sm text-muted">
                {filter === 'unread'
                  ? 'All caught up! You have no unread messages.'
                  : 'Submit a complaint to start receiving updates here.'}
              </div>
              {filter === 'all' && (
                <Link to="/submit" className="btn btn--primary btn--sm" style={{ marginTop: 16, display: 'inline-flex' }}>
                  <FileText size={13} /> Submit Complaint
                </Link>
              )}
            </div>
          )}

          <div className="notif-list">
            {filtered.map(notif => {
              const meta = TYPE_META[notif.type] || { icon: '🔔', bg: 'var(--surface2)', label: 'Update' };
              return (
                <div
                  key={notif._id}
                  className={`notif-item${!notif.isRead ? ' unread' : ''}`}
                  onClick={() => !notif.isRead && markRead(notif._id)}
                >
                  <div className="notif-item__icon" style={{ background: meta.bg }}>
                    {meta.icon}
                  </div>
                  <div className="notif-item__content">
                    <div className="flex items-center justify-between gap-2">
                      <div className="notif-item__title">{notif.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, background: 'var(--surface2)', color: 'var(--text-3)', padding: '2px 7px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                          {meta.label}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(notif._id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                            title="Mark as read"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notif-item__msg">{notif.message}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="notif-item__time">{timeAgo(notif.createdAt)}</div>
                      {notif.relatedComplaintId && (
                        <Link
                          to={`/track?id=${notif.relatedComplaintId}`}
                          className="text-xs"
                          style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 3 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={10} /> View complaint
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          Notifications are linked to your current session. Log in with your student account to access notifications across devices.
        </p>
      </div>
    </div>
  );
}
