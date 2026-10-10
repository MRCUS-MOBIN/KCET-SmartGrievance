import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChartWidget, PieChartWidget, LineChartWidget } from '../components/AnalyticsChart.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { getAuthToken, getAuthUser } from '../App.jsx';
import {
  RefreshCw, Shield, BarChart2, List, Settings, Search,
  Filter, Download, MessageSquare, Clock, CheckCircle2,
  AlertTriangle, Users, TrendingUp, X
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const STATUSES = ['Submitted','Under Review','Awaiting Information','In Progress','Escalated','Resolved','Reopened','Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function authHeader() {
  return { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' };
}

export default function AdminDashboard() {
  const user = getAuthUser();
  const [tab, setTab] = useState('analytics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Analytics
  const [summary, setSummary] = useState(null);
  const [byCat, setByCat] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [byType, setByType] = useState([]);
  const [trend, setTrend] = useState([]);
  const [bySubcat, setBySubcat] = useState([]);
  const [avgResolution, setAvgResolution] = useState([]);
  const [escalationRate, setEscalationRate] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Safety cases
  const [safetyCases, setSafetyCases] = useState([]);
  const [safetyTotal, setSafetyTotal] = useState(0);
  const [loadingSafety, setLoadingSafety] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // All complaints + pagination
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [assignDept, setAssignDept] = useState('');
  const [updatingComplaint, setUpdatingComplaint] = useState(false);
  const [cPage, setCPage] = useState(1);
  const [cLimit, setCLimit] = useState(10);
  const [cTotal, setCTotal] = useState(0);
  const [cTotalPages, setCTotalPages] = useState(1);

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      const [s, cat, st, tp, tr, subcat, avgRes, escRate] = await Promise.all([
        fetch(`${API}/analytics/summary`,          { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/analytics/by-category`,      { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/analytics/by-status`,        { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/analytics/by-type`,          { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/analytics/trend?days=30`,    { headers: authHeader() }).then(r => r.json()),
        fetch(`${API}/analytics/by-subcategory`,   { headers: authHeader() }).then(r => r.json()).catch(() => []),
        fetch(`${API}/analytics/avg-resolution`,   { headers: authHeader() }).then(r => r.json()).catch(() => []),
        fetch(`${API}/analytics/escalation-rate`,  { headers: authHeader() }).then(r => r.json()).catch(() => []),
      ]);
      setSummary(s);
      setByCat(Array.isArray(cat) ? cat : []);
      setByStatus(Array.isArray(st) ? st : []);
      setByType(Array.isArray(tp) ? tp : []);
      setTrend(Array.isArray(tr) ? tr : []);
      setBySubcat(Array.isArray(subcat) ? subcat : []);
      setAvgResolution(Array.isArray(avgRes) ? avgRes : []);
      setEscalationRate(Array.isArray(escRate) ? escRate : []);
    } catch { toast.error('Analytics load failed.'); }
    setLoadingAnalytics(false);
  }

  async function exportCsv() {
    setExportingCsv(true);
    try {
      const res  = await fetch(`${API}/complaints?limit=1000`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const rows = (data.complaints || []).filter(c => !c.isSensitive);
      const headers = ['trackingId','mainCategory','subcategory','complaintType','status','priority','submissionMode','assignedDepartment','supportCount','createdAt','resolvedAt'];
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `kcet_complaints_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV downloaded! Sensitive complaints excluded.');
    } catch (err) { toast.error(err.message || 'Export failed.'); }
    setExportingCsv(false);
  }

  async function loadSafetyCases() {
    setLoadingSafety(true);
    try {
      const res  = await fetch(`${API}/safety/cases?limit=20`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSafetyCases(data.cases || []);
      setSafetyTotal(data.total || 0);
    } catch (err) { toast.error(err.message || 'Could not load safety cases.'); }
    setLoadingSafety(false);
  }

  async function loadComplaints(page = cPage, limit = cLimit) {
    setLoadingComplaints(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`${API}/complaints?${params}`, { headers: authHeader() });
      const data = await res.json();
      setComplaints(data.complaints || []);
      setCTotal(data.total || 0);
      setCTotalPages(data.pages || 1);
      setCPage(data.page || 1);
    } catch { toast.error('Could not load complaints.'); }
    setLoadingComplaints(false);
  }

  useEffect(() => {
    if (tab === 'analytics')  loadAnalytics();
    if (tab === 'safety')     loadSafetyCases();
    if (tab === 'complaints') loadComplaints(1, cLimit);
  }, [tab, statusFilter]);

  useEffect(() => {
    if (tab === 'complaints') loadComplaints(cPage, cLimit);
  }, [cPage, cLimit]);

  async function updateSafetyStatus() {
    if (!newStatus || !selectedCase) return;
    setUpdating(true);
    try {
      const res  = await fetch(`${API}/safety/cases/${selectedCase.trackingId}/status`, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Case updated to "${newStatus}"`);
      setSelectedCase(null); setNewStatus(''); setStatusNote('');
      loadSafetyCases();
    } catch (err) { toast.error(err.message || 'Update failed.'); }
    setUpdating(false);
  }

  async function handleComplaintUpdate() {
    if (!selectedComplaint) return;
    setUpdatingComplaint(true);
    try {
      const promises = [];
      if (updateStatus) {
        promises.push(
          fetch(`${API}/complaints/${selectedComplaint._id}/status`, {
            method: 'PATCH',
            headers: authHeader(),
            body: JSON.stringify({ status: updateStatus, note: updateNote }),
          })
        );
      }
      if (assignDept) {
        promises.push(
          fetch(`${API}/complaints/${selectedComplaint._id}/assign`, {
            method: 'PUT',
            headers: authHeader(),
            body: JSON.stringify({ department: assignDept }),
          })
        );
      }
      if (adminResponse) {
        promises.push(
          fetch(`${API}/complaints/${selectedComplaint._id}/response`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ response: adminResponse }),
          })
        );
      }
      await Promise.all(promises);
      toast.success('Complaint updated successfully!');
      setSelectedComplaint(null);
      setUpdateStatus(''); setUpdateNote(''); setAdminResponse(''); setAssignDept('');
      loadComplaints();
    } catch (err) {
      toast.error(err.message || 'Update failed.');
    }
    setUpdatingComplaint(false);
  }

  // Client-side search filter on the current page's results
  const filteredComplaints = searchTerm
    ? complaints.filter(c =>
        c.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mainCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : complaints;

  const SIDEBAR_ITEMS = [
    { id: 'analytics',  icon: <BarChart2 size={16} />,  label: 'Analytics'       },
    { id: 'complaints', icon: <List size={16} />,        label: 'All Complaints'  },
    { id: 'safety',     icon: <Shield size={16} />,      label: '🛡️ Safety Cases', danger: true },
  ];

  const DEPT_OPTIONS = [
    'Relevant Department HOD / Principal',
    'Hostel Management',
    'Canteen Management',
    'Facilities & Maintenance Department',
    'Transport Office',
    'Physical Education Department',
    'Librarian',
    'IT Department',
    'Examinations Cell / COE',
    'Accounts & Finance Office',
    'Student Welfare Officer',
    'Placement Cell',
    'Facilities & Administration',
    'Student Affairs / Dean of Students',
    'College Administration Office',
    'Campus Administration',
    'Safety Review Committee (RESTRICTED)',
    'Principal Office',
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard__sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <button className="sidebar__toggle" onClick={() => setSidebarCollapsed(v => !v)} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          {sidebarCollapsed ? '→' : '←'}
        </button>

        <div className="sidebar__section">
          <div className="sidebar__section-label">Main</div>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar__item${tab === item.id ? ' active' : ''}${item.danger ? ' sidebar__item--danger' : ''}`}
              onClick={() => setTab(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              <span className="sidebar__item-label">{item.label}</span>
              {item.id === 'safety' && safetyTotal > 0 && (
                <span className="sidebar__item-badge">{safetyTotal}</span>
              )}
            </button>
          ))}
        </div>

        <div className="sidebar__divider" />

        {/* User info */}
        <div className="sidebar__user">
          <div className="flex items-center gap-3">
            <div className="sidebar__user-avatar">
              {(user?.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard__main">

        {/* ── Analytics Tab ── */}
        {tab === 'analytics' && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800 }}>Analytics Dashboard</h1>
              <div className="flex gap-2">
                <button className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={exportingCsv}>
                  <Download size={13} /> {exportingCsv ? 'Exporting…' : 'Export CSV'}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={loadAnalytics} disabled={loadingAnalytics}>
                  <RefreshCw size={13} className={loadingAnalytics ? 'spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {loadingAnalytics && (
              <div className="stat-cards">
                {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
              </div>
            )}

            {summary && (
              <>
                <div className="stat-cards mb-6">
                  {[
                    { label: 'Total Complaints', value: summary.total, color: 'var(--accent-light)', icon: <List size={18} style={{ color: 'var(--accent-light)' }} />, bg: 'var(--accent-dim)' },
                    { label: 'New (Today)',       value: summary.newToday ?? 0, color: 'var(--blue)', icon: <Clock size={18} style={{ color: 'var(--blue)' }} />, bg: 'var(--blue-dim)' },
                    { label: 'Resolved',          value: summary.resolved, color: 'var(--green)', icon: <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />, bg: 'var(--green-dim)' },
                    { label: 'In Progress',       value: summary.inProgress, color: 'var(--blue)', icon: <TrendingUp size={18} style={{ color: 'var(--blue)' }} />, bg: 'var(--blue-dim)' },
                    { label: 'Escalated',         value: summary.escalated, color: 'var(--red)', icon: <AlertTriangle size={18} style={{ color: 'var(--red)' }} />, bg: 'var(--red-dim)' },
                    { label: 'Safety Cases',      value: summary.sensitive, color: 'var(--safety)', icon: <Shield size={18} style={{ color: 'var(--safety)' }} />, bg: 'var(--safety-dim)' },
                  ].map(s => (
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

                <div className="grid-2 mb-6">
                  <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: 16 }}>Complaints by Category</div>
                    <BarChartWidget data={byCat.slice(0, 10)} xKey="category" yKey="count" label="Complaints" color="#4f6ef7" />
                  </div>
                  <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: 16 }}>Complaints by Status</div>
                    <PieChartWidget data={byStatus} nameKey="status" valueKey="count" />
                  </div>
                </div>

                {trend.length > 0 && (
                  <div className="card mb-6">
                    <div style={{ fontWeight: 700, marginBottom: 16 }}>Submission Trend — Last 30 Days</div>
                    <LineChartWidget data={trend} xKey="date" yKey="count" label="Submissions" color="#4f6ef7" />
                  </div>
                )}

                {byType.length > 0 && (
                  <div className="card mb-6">
                    <div style={{ fontWeight: 700, marginBottom: 16 }}>Complaint vs Suggestion vs Appreciation</div>
                    <PieChartWidget data={byType} nameKey="type" valueKey="count" />
                  </div>
                )}

                {bySubcat.length > 0 && (
                  <div className="card mb-6">
                    <div style={{ fontWeight: 700, marginBottom: 16 }}>Top 15 Recurring Subcategories</div>
                    <BarChartWidget data={bySubcat} xKey="subcategory" yKey="count" label="Reports" color="#b066f5" />
                  </div>
                )}

                {avgResolution.length > 0 && (
                  <div className="card mb-6">
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Average Days to Resolve (per Category)</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            {['Category','Avg Days','Resolved Cases'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {avgResolution.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 12px' }}>{r.category}</td>
                              <td style={{ padding: '10px 12px', color: r.avgDays <= 3 ? 'var(--green)' : r.avgDays <= 7 ? 'var(--amber)' : 'var(--red)', fontWeight: 700 }}>{r.avgDays}d</td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-3)' }}>{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {escalationRate.length > 0 && (
                  <div className="card">
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Escalation Rate by Category</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            {['Category','Total','Escalated','Rate'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {escalationRate.filter(r => r.escalated > 0).map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 12px' }}>{r.category}</td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{r.total}</td>
                              <td style={{ padding: '10px 12px', color: 'var(--amber)', fontWeight: 700 }}>{r.escalated}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
                                    <div style={{ width: `${r.rate}%`, height: '100%', background: r.rate > 30 ? 'var(--red)' : 'var(--amber)', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: r.rate > 30 ? 'var(--red)' : 'var(--amber)', minWidth: 36 }}>{r.rate}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── All Complaints Tab ── */}
        {tab === 'complaints' && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800 }}>All Complaints</h1>
                <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                  {cTotal} total complaint{cTotal !== 1 ? 's' : ''} &nbsp;·&nbsp; Page {cPage} of {cTotalPages}
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => loadComplaints(cPage, cLimit)} disabled={loadingComplaints}>
                <RefreshCw size={13} className={loadingComplaints ? 'spin' : ''} /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="card mb-4" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 36, fontSize: 13 }}
                  placeholder="Search by ID, category, description…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="form-select"
                style={{ flex: 1, minWidth: 160, maxWidth: 200, fontSize: 13 }}
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCPage(1); }}
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-xs text-muted">
                {searchTerm
                  ? `${filteredComplaints.length} match${filteredComplaints.length !== 1 ? 'es' : ''} on this page`
                  : `${complaints.length} on this page`
                }
              </div>
            </div>

            {loadingComplaints ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
              </div>
            ) : (
              <>
                <div className="complaint-list">
                  {filteredComplaints.map(c => (
                    <ComplaintCard
                      key={c._id}
                      complaint={c}
                      actions={
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setUpdateStatus(c.status);
                            setAssignDept(c.assignedDepartment || '');
                            setAdminResponse('');
                            setUpdateNote('');
                          }}
                        >
                          <Settings size={12} /> Manage
                        </button>
                      }
                    />
                  ))}
                  {filteredComplaints.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                      <div style={{ fontWeight: 600 }}>No complaints found</div>
                      {searchTerm && <p className="text-sm text-muted mt-2">Try a different search term.</p>}
                    </div>
                  )}
                </div>

                {/* ── Pagination Controls ── */}
                <Pagination
                  page={cPage}
                  totalPages={cTotalPages}
                  total={cTotal}
                  limit={cLimit}
                  onPageChange={p => setCPage(p)}
                  onLimitChange={l => { setCLimit(l); setCPage(1); }}
                  limitOptions={[10, 20, 50]}
                />
              </>
            )}
          </>
        )}

        {/* ── Safety Cases Tab ── */}
        {tab === 'safety' && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--safety)' }}>
                🛡️ Safety & Confidential Cases
              </h1>
              <button className="btn btn--ghost btn--sm" onClick={loadSafetyCases} disabled={loadingSafety}>
                <RefreshCw size={13} className={loadingSafety ? 'spin' : ''} /> Refresh
              </button>
            </div>

            <div className="alert alert--danger mb-6">
              <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                These reports are <strong>confidential</strong>. Visible only to authorized safety officers and designated committees.
                Do not share case contents outside the authorized review process.
                NLP assists categorization only — it does <strong>not</strong> determine truth or make disciplinary decisions.
              </div>
            </div>

            <div className="text-sm text-muted mb-4">Total safety cases: <strong>{safetyTotal}</strong></div>

            {loadingSafety ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
              </div>
            ) : (
              <div className="complaint-list">
                {safetyCases.map(c => (
                  <ComplaintCard
                    key={c._id}
                    complaint={c}
                    actions={
                      <button className="btn btn--danger btn--sm" onClick={() => { setSelectedCase(c); setNewStatus(c.status); }}>
                        Review Case →
                      </button>
                    }
                  />
                ))}
                {safetyCases.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <div style={{ fontWeight: 600 }}>No safety cases found</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Complaint management modal ── */}
      {selectedComplaint && tab === 'complaints' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedComplaint(null); }}>
          <div className="modal">
            <div className="modal__header">
              <div>
                <div className="modal__title">Manage Complaint</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-light)', marginTop: 4 }}>{selectedComplaint.trackingId}</div>
              </div>
              <button className="btn btn--ghost btn--sm btn--icon" onClick={() => setSelectedComplaint(null)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div><div className="text-xs text-muted">Category</div><div style={{ fontWeight: 600 }}>{selectedComplaint.mainCategory}</div></div>
                <div><div className="text-xs text-muted">Current Status</div><div style={{ fontWeight: 600 }}>{selectedComplaint.status}</div></div>
              </div>

              <div className="form-group">
                <label className="form-label">Update Status</label>
                <select className="form-select" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Note (for audit trail)</label>
                <textarea className="form-textarea" style={{ minHeight: 70 }} value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="Internal note about this status change…" />
              </div>

              <div className="form-group">
                <label className="form-label">Assign to Department</label>
                <select className="form-select" value={assignDept} onChange={e => setAssignDept(e.target.value)}>
                  <option value="">— Keep current / Select department —</option>
                  {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label"><MessageSquare size={13} style={{ display: 'inline', marginRight: 4 }} /> Response to Student</label>
                <textarea className="form-textarea" style={{ minHeight: 80 }} value={adminResponse} onChange={e => setAdminResponse(e.target.value)} placeholder="Visible response to the student (optional)…" />
              </div>

              <div className="flex gap-2">
                <button className="btn btn--primary" onClick={handleComplaintUpdate} disabled={updatingComplaint}>
                  {updatingComplaint ? 'Saving…' : '✓ Save Changes'}
                </button>
                <button className="btn btn--ghost" onClick={() => setSelectedComplaint(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Safety case modal ── */}
      {selectedCase && tab === 'safety' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedCase(null); }}>
          <div className="modal form-panel--safety" style={{ maxWidth: 580 }}>
            <div className="modal__header">
              <h2 className="modal__title" style={{ color: 'var(--safety)' }}>🛡️ Safety Case Review</h2>
              <button className="btn btn--ghost btn--sm btn--icon" onClick={() => setSelectedCase(null)}><X size={16} /></button>
            </div>

            <div className="alert alert--danger" style={{ marginBottom: 16 }}>
              Case Reference: <strong style={{ fontFamily: 'monospace' }}>{selectedCase.trackingId}</strong>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
              <div><div className="text-xs text-muted">Subcategory</div><div style={{ fontWeight: 600 }}>{selectedCase.subcategory || '—'}</div></div>
              <div><div className="text-xs text-muted">Submitted</div><div>{new Date(selectedCase.createdAt).toLocaleString('en-IN')}</div></div>
              <div><div className="text-xs text-muted">Mode</div><div style={{ textTransform: 'capitalize' }}>{selectedCase.submissionMode}</div></div>
              <div><div className="text-xs text-muted">Status</div><div style={{ fontWeight: 600 }}>{selectedCase.status}</div></div>
            </div>

            {selectedCase.description && (
              <div style={{ marginBottom: 16 }}>
                <div className="text-xs text-muted mb-1">Report Description</div>
                <p className="text-sm" style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: 8, lineHeight: 1.65, color: 'var(--text-2)' }}>
                  {selectedCase.description}
                </p>
              </div>
            )}

            <div className="safety-emergency" style={{ marginBottom: 16 }}>
              ⚠️ NLP may assist category suggestion only. It does NOT determine whether an allegation is true, automatically reject a report, or make disciplinary decisions. All decisions must follow the college's approved grievance process.
            </div>

            {selectedCase.statusHistory?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Case Timeline</div>
                {selectedCase.statusHistory.map((s, i) => (
                  <div key={i} className="flex gap-3 mb-2 text-sm">
                    <span style={{ fontWeight: 600 }}>{s.status}</span>
                    <span className="text-muted">{s.note}</span>
                    <span className="text-muted" style={{ marginLeft: 'auto' }}>{new Date(s.at).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Update Case Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Authorized Review Note</label>
              <textarea className="form-textarea" style={{ minHeight: 80 }} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Internal note for audit trail (not shown publicly)…" />
            </div>

            <div className="flex gap-3">
              <button className="btn btn--danger" disabled={updating} onClick={updateSafetyStatus}>
                {updating ? 'Saving…' : 'Update Case'}
              </button>
              <button className="btn btn--ghost" onClick={() => setSelectedCase(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
