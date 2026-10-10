import { useState, useEffect, useRef } from 'react';
import { Users, ThumbsUp, ExternalLink } from 'lucide-react';

const NLP_API = 'http://localhost:8001';
const API     = 'http://localhost:5000/api';

/**
 * GroupComplaintPanel
 * Shown on the Submit Complaint form (step 2) when description >= 20 chars.
 * Calls the NLP /similar endpoint to find existing open complaints.
 * Students can "support" an existing complaint instead of filing a duplicate.
 *
 * Props:
 *  description  — current complaint text
 *  onSupport(trackingId) — called when student clicks "Support this"
 */
export default function GroupComplaintPanel({ description, onSupport }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [corpus, setCorpus]   = useState([]); // [{trackingId, text, supportCount}]
  const debounce = useRef();

  // Load a small public corpus of recent open complaints for similarity check
  useEffect(() => {
    async function loadCorpus() {
      try {
        const res = await fetch(`${API}/complaints/public-stats`).catch(() => null);
        // We only need a rough corpus for similarity — just fetch last 30 summaries
        // Use a lightweight approach: fetch recent non-sensitive complaints (descriptions only)
        // In a real system this would be a dedicated endpoint
        const r2 = await fetch(`${API}/complaints?limit=30&status=Submitted`).catch(() => null);
        if (r2?.ok) {
          const data = await r2.json();
          // Note: public can't access /complaints — this only works if user is staff
          // For anonymous users we skip corpus loading gracefully
          if (Array.isArray(data.complaints)) {
            setCorpus(data.complaints.map(c => ({
              trackingId: c.trackingId,
              text: c.description || '',
              supportCount: c.supportCount || 0,
              mainCategory: c.mainCategory,
              subcategory: c.subcategory,
              status: c.status,
            })));
          }
        }
      } catch { /* corpus unavailable — panel hides gracefully */ }
    }
    loadCorpus();
  }, []);

  // Debounce similarity search
  useEffect(() => {
    if (!corpus.length || description.length < 20) {
      setMatches([]); return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${NLP_API}/similar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: description,
            corpus: corpus.map(c => c.text),
            top_n: 3,
          }),
        }).catch(() => null);
        if (res?.ok) {
          const data = await res.json();
          const found = (data.matches || [])
            .filter(m => m.score > 0.25)
            .map(m => ({ ...corpus[m.index], score: m.score }));
          setMatches(found);
        } else {
          setMatches([]);
        }
      } catch { setMatches([]); }
      setLoading(false);
    }, 1200);
    return () => clearTimeout(debounce.current);
  }, [description, corpus]);

  // Don't render if no matches and not loading
  if (!loading && matches.length === 0) return null;

  return (
    <div className="support-panel fade-up">
      <div className="support-panel__header">
        <Users size={15} />
        <span>
          {loading ? 'Checking for similar open complaints…' : `${matches.length} similar complaint${matches.length !== 1 ? 's' : ''} found`}
        </span>
      </div>
      <p className="support-panel__sub">
        Supporting an existing complaint is more effective — it shows how many students are affected.
      </p>

      {!loading && matches.map((m, i) => (
        <div key={i} className="support-panel__item">
          <div className="support-panel__meta">
            <span className="support-panel__cat">{m.mainCategory}</span>
            {m.subcategory && <span className="text-muted" style={{ fontSize: 11 }}> › {m.subcategory}</span>}
          </div>
          <div className="support-panel__text">
            "{m.text?.slice(0, 120)}{m.text?.length > 120 ? '…' : ''}"
          </div>
          <div className="support-panel__actions">
            <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ThumbsUp size={12} /> {m.supportCount || 0} supporters · Tracking: {m.trackingId}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={`/track?id=${m.trackingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost btn--sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                <ExternalLink size={11} /> View
              </a>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => onSupport(m.trackingId)}
              >
                <ThumbsUp size={11} /> Support This
              </button>
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 0' }}>
          <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
}
