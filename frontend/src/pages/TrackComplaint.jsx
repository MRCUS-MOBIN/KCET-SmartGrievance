import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle, Clock, ArrowRight, MessageSquare, Star, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { API } from '../config/api.js';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const PIPELINE_STEPS = [
  { key: 'Submitted',    label: 'Submitted',    icon: '📝' },
  { key: 'Under Review', label: 'Under Review', icon: '🔍' },
  { key: 'In Progress',  label: 'In Progress',  icon: '⚙️' },
  { key: 'Resolved',     label: 'Resolved',     icon: '✅' },
];

function getPipelineState(statusHistory, currentStatus) {
  const statuses = (statusHistory || []).map(h => h.status);
  statuses.push(currentStatus);

  return PIPELINE_STEPS.map(step => {
    if (step.key === 'In Progress') {
      const done = statuses.some(s => ['In Progress', 'Escalated', 'Awaiting Information', 'Resolved', 'Closed'].includes(s));
      const active = ['In Progress', 'Escalated', 'Awaiting Information'].includes(currentStatus);
      return { ...step, done: done && !active, active };
    }
    const done = statuses.includes(step.key) && currentStatus !== step.key;
    const active = currentStatus === step.key || (step.key === 'Submitted' && currentStatus === 'Submitted');
    const isResolved = step.key === 'Resolved' && ['Resolved', 'Closed'].includes(currentStatus);
    return { ...step, done: done || isResolved, active: active && !isResolved };
  });
}

export default function TrackComplaint() {
  const [params] = useSearchParams();
  const [trackingId, setTrackingId] = useState(params.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  async function track(e) {
    e?.preventDefault();
    const id = (typeof e === 'string' ? e : trackingId).trim().toUpperCase();
    if (!id) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API}/complaints/track/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Complaint not found.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-track if ID in URL
  useEffect(() => {
    const id = params.get('id');
    if (id) { setTrackingId(id.toUpperCase()); track(id.toUpperCase()); }
  }, []);

  async function submitFeedback(e) {
    e.preventDefault();
    if (!feedbackRating) return;
    setSubmittingFeedback(true);
    try {
      await fetch(`${API}/complaints/${result.trackingId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedback }),
      });
      setFeedbackSubmitted(true);
    } catch {}
    setSubmittingFeedback(false);
  }

  const pipelineSteps = result ? getPipelineState(result.statusHistory, result.status) : [];

  return (
    <div className="section" style={{ padding: '40px 20px' }}>
      <div className="container container--xs">
        <div className="section-eyebrow">Complaint Lookup</div>
        <h1 className="section-title">Track Your Complaint</h1>
        <p className="section-sub" style={{ marginBottom: 28 }}>
          Enter your Tracking ID to view status, department assignment, and admin responses.
        </p>

        {/* Search form */}
        <form onSubmit={track} className="card fade-up" style={{ gap: 14, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tracking ID</label>
              <input
                className="form-input"
                value={trackingId}
                onChange={e => setTrackingId(e.target.value.toUpperCase())}
                placeholder="KCET-2026-XXXXXX"
                style={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: 16 }}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={loading} style={{ marginBottom: 0 }}>
              {loading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
              {loading ? 'Searching…' : 'Track'}
            </button>
          </div>
          <p className="text-xs text-muted">
            Your Tracking ID was shown after you submitted a complaint (format: KCET-YYYY-XXXXXX).
          </p>
        </form>

        {error && (
          <div className="alert alert--danger mb-4 fade-in">
            ❌ {error}
            <div className="text-xs mt-2">Make sure the ID is correct. It's case-insensitive.</div>
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
            {/* Status header card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs text-muted mb-1" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tracking ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: 'var(--accent-light)', letterSpacing: 2 }}>
                    {result.trackingId}
                  </div>
                </div>
                <StatusBadge status={result.status} />
              </div>

              <div className="grid-2" style={{ gap: 16, marginTop: 4 }}>
                <div>
                  <div className="text-xs text-muted mb-1">Category</div>
                  <div style={{ fontWeight: 600 }}>{result.mainCategory}</div>
                  {result.subcategory && <div className="text-sm text-muted">{result.subcategory}</div>}
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Assigned Department</div>
                  <div style={{ fontWeight: 600 }}>{result.assignedDepartment || 'Pending assignment'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Submitted</div>
                  <div style={{ fontSize: 13 }}>{formatDate(result.createdAt)}</div>
                </div>
                {result.resolvedAt && (
                  <div>
                    <div className="text-xs text-muted mb-1">Resolved</div>
                    <div style={{ fontSize: 13, color: 'var(--green)' }}>{formatDate(result.resolvedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual pipeline timeline */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 20 }}>📊 Complaint Progress</div>
              <div className="track-timeline-h">
                {pipelineSteps.map((step, i) => (
                  <div key={step.key} className={`track-h-step${step.done ? ' done' : ''}${step.active ? ' active' : ''}`}>
                    <div className="track-h-dot">
                      {step.done ? '✓' : step.active ? step.icon : step.icon}
                    </div>
                    <div className="track-h-label">{step.label}</div>
                  </div>
                ))}
              </div>

              {/* Special status alerts */}
              {result.status === 'Escalated' && (
                <div className="alert alert--warning mt-4" style={{ fontSize: 13 }}>
                  ⚠️ This complaint has been escalated for urgent review. A senior officer is now handling it.
                </div>
              )}
              {result.status === 'Awaiting Information' && (
                <div className="alert alert--info mt-4" style={{ fontSize: 13 }}>
                  ℹ️ The department needs more information. If you submitted anonymously, they cannot contact you directly — consider submitting additional details as a new complaint.
                </div>
              )}
            </div>

            {/* NLP Classification */}
            {result.nlpCategory && (
              <div className="card" style={{ gap: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🤖 NLP Auto-Classification
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-muted">Predicted Category</div>
                    <span className="nlp-pill" style={{ marginTop: 4 }}>{result.nlpCategory}</span>
                  </div>
                  {result.nlpConfidence && (
                    <div>
                      <div className="text-xs text-muted mb-1">Confidence</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 100, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round(result.nlpConfidence * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{Math.round(result.nlpConfidence * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted">NLP suggests routing — authorized staff make all final decisions.</p>
              </div>
            )}

            {/* Status Timeline (detailed) */}
            {result.statusHistory?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 16 }}>📋 Status History</div>
                <div className="track-timeline">
                  {result.statusHistory.map((s, i) => {
                    const isCurrent = i === result.statusHistory.length - 1;
                    const isDone = !isCurrent;
                    return (
                      <div key={i} className={`track-step${isDone ? ' done' : ''}`}>
                        <div className={`track-dot ${isDone ? 'done' : 'current'}`}>
                          {isDone ? '✓' : '●'}
                        </div>
                        <div className="track-content">
                          <div className="track-status">{s.status}</div>
                          {s.note && <div className="track-note">{s.note}</div>}
                          <div className="track-date">{formatDate(s.at)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin response */}
            {result.adminResponse && (
              <div className="card" style={{ border: '1px solid var(--blue-dim)', background: 'rgba(59,158,255,0.04)' }}>
                <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={16} style={{ color: 'var(--blue)' }} /> Response from Administration
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{result.adminResponse}</p>
              </div>
            )}

            {/* Resolution + feedback */}
            {['Resolved', 'Closed'].includes(result.status) && (
              <div className="card" style={{ border: '1px solid var(--green-dim)', background: 'var(--green-dim)' }}>
                <div style={{ fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={18} /> Complaint Resolved
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                  This complaint has been marked as resolved. If the issue persists, you can submit a new complaint referencing this tracking ID.
                </p>

                {/* Feedback form */}
                {!feedbackSubmitted ? (
                  <form onSubmit={submitFeedback}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Rate the resolution:</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFeedbackRating(r)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', fontSize: 24,
                            filter: r <= feedbackRating ? 'none' : 'grayscale(100%) opacity(0.4)',
                            transition: 'filter 0.15s', padding: '4px 2px',
                          }}
                        >⭐</button>
                      ))}
                    </div>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 80, marginBottom: 10, fontSize: 13 }}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Any comments about how your complaint was handled? (optional)"
                    />
                    <button type="submit" className="btn btn--success btn--sm" disabled={!feedbackRating || submittingFeedback}>
                      <Star size={13} /> {submittingFeedback ? 'Submitting…' : 'Submit Feedback'}
                    </button>
                  </form>
                ) : (
                  <div className="alert alert--success" style={{ fontSize: 13 }}>
                    ✅ Thank you for your feedback! Your rating has been recorded.
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted" style={{ textAlign: 'center' }}>
              For safety or sensitive complaints, contact the college grievance cell directly.
              This tracker does not display confidential report details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
