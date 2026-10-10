import StatusBadge from './StatusBadge.jsx';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ComplaintCard({ complaint, onSelect, actions }) {
  const isSensitive = complaint.isSensitive;
  return (
    <div
      className={`complaint-card${isSensitive ? ' complaint-card--sensitive' : ''}`}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
      onClick={() => onSelect?.(complaint)}
    >
      <div className="complaint-card__header">
        <div style={{ flex: 1 }}>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="complaint-card__id font-mono">{complaint.trackingId}</span>
            <StatusBadge status={complaint.status} />
            {isSensitive && <span className="badge badge--sensitive">🛡️ Confidential</span>}
            {complaint.complaintType === 'suggestion' && <span className="badge" style={{background:'rgba(34,197,94,0.1)',color:'#22c55e'}}>💡 Suggestion</span>}
            {complaint.complaintType === 'appreciation' && <span className="badge" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b'}}>👏 Appreciation</span>}
          </div>
          <div className="complaint-card__cat mt-2">{complaint.mainCategory}
            {complaint.subcategory && <span className="text-muted text-sm"> › {complaint.subcategory}</span>}
          </div>
        </div>
        <div className="text-xs text-muted">{timeAgo(complaint.createdAt)}</div>
      </div>

      {complaint.description && (
        <p className="complaint-card__desc" style={{
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {complaint.description}
        </p>
      )}

      <div className="complaint-card__meta">
        {complaint.assignedDepartment && !isSensitive && (
          <span>📍 {complaint.assignedDepartment}</span>
        )}
        {complaint.nlp?.confidence && (
          <span>🤖 NLP {Math.round(complaint.nlp.confidence * 100)}% confidence</span>
        )}
        {complaint.nlp?.needsHumanReview && (
          <span className="text-amber">⚠ Needs review</span>
        )}
        {complaint.supportCount > 0 && (
          <span>👥 {complaint.supportCount} supporters</span>
        )}
      </div>

      {actions && <div className="complaint-card__actions">{actions}</div>}
    </div>
  );
}
