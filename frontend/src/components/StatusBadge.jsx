const STATUS_CONFIG = {
  'Submitted':          { cls: 'badge--submitted', dot: '●' },
  'Under Review':       { cls: 'badge--review',    dot: '◑' },
  'Awaiting Information':{ cls: 'badge--awaiting', dot: '◔' },
  'In Progress':        { cls: 'badge--progress',  dot: '◕' },
  'Escalated':          { cls: 'badge--escalated', dot: '▲' },
  'Resolved':           { cls: 'badge--resolved',  dot: '✓' },
  'Reopened':           { cls: 'badge--review',    dot: '↩' },
  'Closed':             { cls: 'badge--closed',    dot: '✕' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { cls: 'badge--closed', dot: '●' };
  return (
    <span className={`badge ${cfg.cls}`}>
      <span>{cfg.dot}</span> {status}
    </span>
  );
}
