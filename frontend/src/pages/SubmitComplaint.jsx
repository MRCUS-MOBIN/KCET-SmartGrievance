import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, X, Eye, EyeOff, Send, Languages } from 'lucide-react';
import CATEGORIES, { COMPLAINT_TYPES } from '../data/categories.js';
import NLPPreview from '../components/NLPPreview.jsx';
import GroupComplaintPanel from '../components/GroupComplaintPanel.jsx';
import { getAuthUser, getAuthToken } from '../App.jsx';
import { API, NLP_API } from '../config/api.js';

const LANG_OPTIONS = [
  { value: 'en',       label: '🇬🇧 English' },
  { value: 'ta',       label: '🇮🇳 Tamil' },
  { value: 'tanglish', label: '💬 Tanglish' },
];

function getStorageKey(user) {
  const identifier = user?._id || user?.id || user?.email;
  return identifier ? `kcet_tracking_ids_${identifier}` : 'kcet_tracking_ids';
}

export default function SubmitComplaint() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = getAuthUser();

  // Form state
  const [step, setStep] = useState(1);
  const [complaintType, setComplaintType] = useState('complaint');
  const [mainCategory, setMainCategory] = useState(params.get('category') || '');
  const [subcategory, setSubcategory] = useState('');
  const [submissionMode, setSubmissionMode] = useState('anonymous');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [studentName, setStudentName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [files, setFiles] = useState([]);
  const [nlp, setNlp] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const nlpTimer = useRef();

  const selectedCat = CATEGORIES.find(c => c.label === mainCategory);
  const isSensitiveCategory = selectedCat?.isSensitive;

  // Auto-forward sensitive category to safety page
  useEffect(() => {
    if (isSensitiveCategory) {
      toast('Redirecting to confidential safety report form…', { icon: '🛡️' });
      setTimeout(() => navigate('/safety'), 1000);
    }
  }, [isSensitiveCategory]);

  // Debounce NLP preview — direct URL (fixed from broken chain)
  useEffect(() => {
    if (description.length < 12) { setNlp(null); return; }
    clearTimeout(nlpTimer.current);
    nlpTimer.current = setTimeout(async () => {
      setNlpLoading(true);
      try {
        const res = await fetch(`${NLP_API}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: description, lang: language }),
        }).catch(() => null);
        if (res?.ok) setNlp(await res.json());
        else setNlp(null);
      } catch { setNlp(null); /* NLP offline — no preview */ }
      setNlpLoading(false);
    }, 900);
    return () => clearTimeout(nlpTimer.current);
  }, [description, language]);

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < selected.length) toast.error('Some files exceeded 10MB and were removed.');
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  }

  // Support an existing complaint instead of submitting a new one
  async function handleSupport(trackingId) {
    const sessionToken = localStorage.getItem('kcet_session') || (() => {
      const t = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('kcet_session', t);
      return t;
    })();
    try {
      const res = await fetch(`${API}/complaints/${trackingId}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`✅ Support recorded! Tracking ID: ${trackingId}`);
      // Save to local history
      const history = JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]');
      if (!history.includes(trackingId)) {
        history.unshift(trackingId);
        localStorage.setItem(getStorageKey(user), JSON.stringify(history.slice(0, 20)));
      }
      navigate(`/track?id=${trackingId}`);
    } catch (err) {
      toast.error(err.message || 'Could not record support.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mainCategory) return toast.error('Please select a category.');
    if (description.trim().length < 8) return toast.error('Please describe the issue in at least 8 characters.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('submissionMode', submissionMode);
      fd.append('complaintType', complaintType);
      fd.append('mainCategory', mainCategory);
      fd.append('subcategory', subcategory);
      fd.append('description', description.trim());
      fd.append('location', JSON.stringify({ freeText: location }));
      fd.append('language', language);
      if (incidentDate) fd.append('incidentDate', incidentDate);
      if (submissionMode === 'identified') {
        fd.append('studentName', studentName);
        fd.append('contactEmail', contactEmail);
      }
      const token = getAuthToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API}/complaints`, { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
      toast.success('Complaint submitted successfully!');
      // Save tracking ID to localStorage for Student Dashboard
      const history = JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]');
      history.unshift(data.trackingId);
      localStorage.setItem(getStorageKey(user), JSON.stringify(history.slice(0, 20)));
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──
  if (result) return (
    <div className="section">
      <div className="container container--xs">
        <div className="card fade-up" style={{ textAlign: 'center', gap: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800 }}>Complaint Submitted</h2>
          <div className="alert alert--success" style={{ width: '100%', textAlign: 'left' }}>
            <div>
              <strong>Your Tracking ID</strong><br />
              <span style={{ fontFamily: 'monospace', fontSize: 20, color: 'var(--green)', letterSpacing: 2 }}>
                {result.trackingId}
              </span>
              <div className="text-sm mt-2" style={{ color: '#86efac' }}>Save this ID to track your complaint status.</div>
            </div>
          </div>
          {result.nlp && <NLPPreview nlp={result.nlp} />}
          <p className="text-sm text-muted">{result.message}</p>
          <div className="flex gap-3 flex-wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
            <button className="btn btn--ghost" onClick={() => { setResult(null); setDescription(''); setMainCategory(''); setSubcategory(''); setFiles([]); setStep(1); }}>
              Submit Another
            </button>
            <button className="btn btn--primary" onClick={() => navigate(`/track?id=${result.trackingId}`)}>
              Track This Complaint →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="section">
      <div className="container container--sm">
        <div className="section-eyebrow">KCET 360° SmartGrievance</div>
        <h1 className="section-title mb-2">Submit a {complaintType === 'complaint' ? 'Complaint' : complaintType === 'suggestion' ? 'Suggestion' : 'Appreciation'}</h1>
        <p className="section-sub">Your concern will be routed to the right department. Anonymous submission available.</p>

        <div className="form-panel">
          {/* Steps indicator */}
          <div className="form-steps">
            <div className={`form-step ${step >= 1 ? 'done' : ''}`} />
            <div className={`form-step ${step >= 2 ? (step === 2 ? 'active' : 'done') : ''}`} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Step 1: Type + Category ── */}
            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label">What would you like to submit?</label>
                  <div className="toggle-group">
                    {COMPLAINT_TYPES.map(t => (
                      <label key={t.value} className={`toggle-opt${complaintType === t.value ? ' active' : ''}`}>
                        <input type="radio" name="type" value={t.value} checked={complaintType === t.value} onChange={() => setComplaintType(t.value)} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select complaint category *</label>
                  <div className="category-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))' }}>
                    {CATEGORIES.map(cat => (
                      <div
                        key={cat.id}
                        className={`category-card${cat.isSensitive ? ' category-card--sensitive' : ''}${mainCategory === cat.label ? ' card--glow' : ''}`}
                        style={{ '--cat-color': cat.color, outline: mainCategory === cat.label ? `2px solid ${cat.color}` : 'none', cursor: 'pointer' }}
                        onClick={() => { setMainCategory(cat.label); setSubcategory(''); }}
                      >
                        <div className="category-card__icon" style={{ fontSize: 22 }}>{cat.icon}</div>
                        <div className="category-card__name" style={{ fontSize: 12 }}>{cat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {mainCategory && selectedCat && (
                  <div className="form-group fade-up">
                    <label className="form-label">Select subcategory</label>
                    <select className="form-select" value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                      <option value="">— Choose a subcategory (optional) —</option>
                      {selectedCat.subcategories.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--primary btn--full"
                  disabled={!mainCategory}
                  onClick={() => setStep(2)}
                >
                  Continue → Describe the Issue
                </button>
              </>
            )}

            {/* ── Step 2: Details ── */}
            {step === 2 && (
              <>
                <div className="flex gap-2 items-center">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStep(1)}>← Back</button>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedCat?.icon} {mainCategory}</div>
                    {subcategory && <div className="text-sm text-muted">{subcategory}</div>}
                  </div>
                </div>

                {/* Language selector */}
                <div className="form-group">
                  <label className="form-label"><Languages size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}/>Write in</label>
                  <div className="toggle-group lang-toggle">
                    {LANG_OPTIONS.map(l => (
                      <label key={l.value} className={`toggle-opt${language === l.value ? ' active' : ''}`}>
                        <input type="radio" name="lang" value={l.value} checked={language === l.value} onChange={() => setLanguage(l.value)} />
                        {l.label}
                      </label>
                    ))}
                  </div>
                  <div className="form-hint">Write naturally. NLP will handle Tamil, Tanglish, and English.</div>
                </div>

                {/* Submission mode */}
                <div className="form-group">
                  <label className="form-label">Submission mode</label>
                  <div className="toggle-group">
                    <label className={`toggle-opt${submissionMode === 'anonymous' ? ' active' : ''}`}>
                      <input type="radio" name="mode" value="anonymous" checked={submissionMode === 'anonymous'} onChange={() => setSubmissionMode('anonymous')} />
                      <EyeOff size={14} /> Submit anonymously
                    </label>
                    <label className={`toggle-opt${submissionMode === 'identified' ? ' active' : ''}`}>
                      <input type="radio" name="mode" value="identified" checked={submissionMode === 'identified'} onChange={() => setSubmissionMode('identified')} />
                      <Eye size={14} /> Submit with my details
                    </label>
                  </div>
                  <div className="form-hint">
                    {submissionMode === 'anonymous'
                      ? 'Your identity will not be recorded. You can still track your complaint using the tracking ID.'
                      : 'Your name and email will be stored and may be used to contact you for follow-up.'}
                  </div>
                </div>

                {submissionMode === 'identified' && (
                  <div className="grid-2 fade-up">
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input className="form-input" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input className="form-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="college@email.com" />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Describe the issue *</label>
                  <textarea
                    className="form-textarea"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={language === 'ta'
                      ? 'உங்கள் பிரச்சினையை விவரிக்கவும்…'
                      : language === 'tanglish'
                        ? 'Ungal problem-ai describe pannunga…'
                        : 'Explain what happened, where, and when. Be as specific as possible…'}
                    minLength={8}
                    required
                  />
                  <div className="form-hint">{description.length}/5000 characters</div>
                </div>

                {/* NLP live preview */}
                {(nlpLoading || nlp) && <NLPPreview nlp={nlp} loading={nlpLoading} />}

                {/* Similar complaints (Group Complaint Panel) */}
                {description.length >= 20 && (
                  <GroupComplaintPanel
                    description={description}
                    onSupport={handleSupport}
                  />
                )}

                {/* Location */}
                <div className="form-group">
                  <label className="form-label">Location (optional)</label>
                  <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Boys hostel block B, CSE lab 3, Bus route 5" />
                </div>

                {/* Incident date */}
                <div className="form-group">
                  <label className="form-label">Incident date (optional)</label>
                  <input className="form-input" type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                </div>

                {/* File attachments */}
                <div className="form-group">
                  <label className="form-label">Attach photos or documents (optional)</label>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
                    <Upload size={14} /> Choose files (max 5, 10MB each)
                  </button>
                  <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4" onChange={handleFiles} style={{ display: 'none' }} />
                  {files.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {files.map((f, i) => (
                        <div key={i} className="badge badge--submitted" style={{ gap: 6 }}>
                          {f.name.slice(0, 20)}
                          <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="divider" />

                <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                  {submitting ? 'Submitting…' : <><Send size={16} /> Submit {complaintType === 'complaint' ? 'Complaint' : complaintType === 'suggestion' ? 'Suggestion' : 'Appreciation'}</>}
                </button>

                <p className="text-xs text-muted" style={{ textAlign: 'center' }}>
                  A unique tracking ID will be generated. NLP prediction is for routing assistance — authorized staff make all final decisions.
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
