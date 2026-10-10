import { Cpu } from 'lucide-react';

export default function NLPPreview({ nlp, loading }) {
  if (loading) {
    return (
      <div className="nlp-preview">
        <div className="nlp-preview__header"><Cpu size={13} /> Analyzing complaint…</div>
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
      </div>
    );
  }
  if (!nlp) return null;

  const pct = nlp.confidence ? Math.round(nlp.confidence * 100) : null;

  return (
    <div className="nlp-preview">
      <div className="nlp-preview__header">
        <Cpu size={13} />
        NLP Prediction
        {nlp.needsHumanReview && (
          <span className="badge badge--awaiting" style={{ marginLeft: 8, fontSize: 10 }}>Needs human review</span>
        )}
      </div>

      <div className="nlp-preview__result">
        <div className="nlp-preview__item">
          <span className="nlp-preview__key">Predicted Category</span>
          <span className="nlp-preview__val">{nlp.predictedCategory || '—'}</span>
        </div>
        <div className="nlp-preview__item">
          <span className="nlp-preview__key">Suggested Department</span>
          <span className="nlp-preview__val">{nlp.suggestedDepartment || '—'}</span>
        </div>
        {pct !== null && (
          <div className="nlp-preview__item" style={{ minWidth: 120 }}>
            <span className="nlp-preview__key">Confidence — {pct}%</span>
            <div className="nlp-bar">
              <div className="nlp-bar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {nlp.top3?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="text-xs text-muted mb-2">Top predictions</div>
          <div className="flex gap-2 flex-wrap">
            {nlp.top3.map((t, i) => (
              <span key={i} className="nlp-pill" style={{ opacity: i === 0 ? 1 : 0.6 }}>
                {t.category} ({Math.round(t.score * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted" style={{ marginTop: 6 }}>
        Method: {nlp.method || 'unknown'} · NLP assists routing only — authorized staff make final decisions
      </div>
    </div>
  );
}
