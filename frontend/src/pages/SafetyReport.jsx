import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Shield, Upload, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:5000/api';

const SUBCATEGORIES = [
  'Ragging — physical, verbal, or psychological',
  'Bullying and intimidation',
  'Physical harm or assault',
  'Sexual harassment (POSH Act)',
  'Cyberbullying or online harassment',
  'Stalking — physical or digital',
  'Discrimination — caste, gender, religion, disability',
  'Threats and coercion',
  'Retaliation for reporting an issue',
  'Unsafe campus condition or immediate danger',
  'Privacy violation or personal data misuse',
  'Other safety or protection concern',
];

export default function SafetyReport() {
  const [submissionMode, setSubmissionMode] = useState('anonymous');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [studentName, setStudentName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < selected.length) toast.error('Some files exceeded 10MB.');
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (description.trim().length < 10) return toast.error('Please describe the incident in at least 10 characters.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('submissionMode', submissionMode);
      fd.append('subcategory', subcategory);
      fd.append('description', description.trim());
      fd.append('location', JSON.stringify({ freeText: location }));
      if (incidentDate) fd.append('incidentDate', incidentDate);
      if (submissionMode === 'identified') {
        fd.append('studentName', studentName);
        fd.append('contactEmail', contactEmail);
      }
      files.forEach(f => fd.append('attachments', f));

      const res = await fetch(`${API}/safety/report`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
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
        <div className="form-panel form-panel--safety fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800 }}>Report Received</h2>
          <div className="alert alert--danger" style={{ width: '100%', textAlign: 'left' }}>
            <div>
              <strong>Case Reference</strong><br />
              <span style={{ fontFamily: 'monospace', fontSize: 18, color: 'var(--safety)', letterSpacing: 2 }}>
                {result.caseRef}
              </span>
              <div className="text-sm mt-2" style={{ color: '#fca5a5' }}>
                Save this reference. Use it to follow up with authorized safety officers.
              </div>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
            {result.message}
          </p>
          <div className="safety-emergency" style={{ width: '100%' }}>
            {result.emergency}
          </div>
          <button className="btn btn--ghost btn--full" onClick={() => { setResult(null); setDescription(''); setSubcategory(''); setFiles([]); }}>
            Submit Another Report
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="section">
      <div className="container container--xs">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Shield size={24} style={{ color: 'var(--safety)' }} />
          <span className="section-eyebrow" style={{ color: 'var(--safety)', marginBottom: 0 }}>Confidential Safety Report</span>
        </div>
        <h1 className="section-title mb-2" style={{ color: 'var(--text)' }}>Safety & Student Protection</h1>
        <p className="section-sub">
          For ragging, bullying, harassment, discrimination, threats, stalking, or any safety concern.
          This report is <strong style={{ color: 'var(--text)' }}>visible only to authorized safety officers</strong> — not to regular staff or public dashboards.
        </p>

        {/* Emergency banner */}
        <div className="safety-emergency mb-6">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Immediate Danger?</div>
          <div>
            If you or someone else is in immediate danger, contact campus security or dial <strong>100</strong> (Police) / <strong>108</strong> (Ambulance) / <strong>1800-180-5522</strong> (UGC helpline).
            This system does <strong>NOT</strong> automatically contact emergency services.
          </div>
        </div>

        <div className="form-panel form-panel--safety">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* NLP disclaimer */}
            <div className="alert alert--warning">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <div className="text-sm">
                NLP may assist category suggestions only. It <strong>does not</strong> determine whether an allegation is true, automatically reject reports, or make disciplinary decisions.
                All cases are reviewed by authorized personnel only.
              </div>
            </div>

            {/* Submission mode */}
            <div className="form-group">
              <label className="form-label">Submission mode</label>
              <div className="toggle-group">
                <label className={`toggle-opt${submissionMode === 'anonymous' ? ' active' : ''}`}>
                  <input type="radio" name="mode" value="anonymous" checked={submissionMode === 'anonymous'} onChange={() => setSubmissionMode('anonymous')} />
                  <EyeOff size={14} /> Anonymous — identity not recorded
                </label>
                <label className={`toggle-opt${submissionMode === 'confidential' ? ' active' : ''}`}>
                  <input type="radio" name="mode" value="confidential" checked={submissionMode === 'confidential'} onChange={() => setSubmissionMode('confidential')} />
                  <Shield size={14} /> Confidential — contact me for follow-up
                </label>
              </div>
              <div className="form-hint">
                {submissionMode === 'anonymous'
                  ? 'Your identity will not be recorded. You can still follow up using the case reference.'
                  : 'Your contact details are stored securely and shared ONLY with authorized safety officers.'}
              </div>
            </div>

            {submissionMode === 'confidential' && (
              <div className="grid-2 fade-up">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email / Phone</label>
                  <input className="form-input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Safe to contact" />
                </div>
              </div>
            )}

            {/* Concern type */}
            <div className="form-group">
              <label className="form-label">Type of concern</label>
              <select className="form-select" value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                <option value="">— Select the type of concern (optional) —</option>
                {SUBCATEGORIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Describe what happened *</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the incident in your own words — who was involved, what happened, when and where. Include as much detail as you are comfortable sharing."
                minLength={10}
                required
                style={{ minHeight: 160 }}
              />
              <div className="form-hint">{description.length}/5000 characters</div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location (optional)</label>
              <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Boys hostel corridor, classroom, online/WhatsApp" />
            </div>

            {/* Incident date */}
            <div className="form-group">
              <label className="form-label">Incident date (optional)</label>
              <input className="form-input" type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>

            {/* File attachments */}
            <div className="form-group">
              <label className="form-label">Attach evidence (optional)</label>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Attach screenshots, photos, documents
              </button>
              <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4" onChange={handleFiles} style={{ display: 'none' }} />
              <div className="form-hint">Max 5 files, 10MB each. Stored securely and accessible only to authorized officers.</div>
              {files.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {files.map((f, i) => (
                    <div key={i} className="badge badge--sensitive" style={{ gap: 6 }}>
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

            <button type="submit" className="btn btn--danger btn--full" disabled={submitting}>
              <Shield size={16} /> {submitting ? 'Submitting securely…' : 'Submit Confidential Report'}
            </button>

            <p className="text-xs text-muted" style={{ textAlign: 'center', lineHeight: 1.6 }}>
              A unique case reference will be generated. Your report is transmitted securely and accessible only to authorized safety officers and designated committees.
              This is a proposed system — confirm committee integration with college administration before deployment.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
