import { CheckCircle, Circle, AlertTriangle, ChevronRight } from 'lucide-react';

const DEFAULT_LEVELS = [
  { label: 'Staff / In-charge', level: 1 },
  { label: 'Department HOD',    level: 2 },
  { label: 'Grievance Officer', level: 3 },
  { label: 'Principal',         level: 4 },
];

/**
 * EscalationTimeline
 * Visual step-by-step escalation path for a complaint.
 *
 * Props:
 *  complaint      — complaint object (must have status, statusHistory, assignedDepartment)
 *  routingLevels  — optional array of { label, level } (falls back to DEFAULT_LEVELS)
 */
export default function EscalationTimeline({ complaint, routingLevels }) {
  const levels = routingLevels || DEFAULT_LEVELS;
  const isEscalated = complaint?.status === 'Escalated';

  // Count how many times 'Escalated' appears in statusHistory to determine current level
  const escalationCount = (complaint?.statusHistory || [])
    .filter(h => h.status === 'Escalated').length;

  const currentLevel = isEscalated ? Math.min(escalationCount + 1, levels.length) : 1;

  return (
    <div className="escalation-timeline">
      <div className="escalation-timeline__title">Escalation Path</div>
      <div className="escalation-timeline__track">
        {levels.map((lvl, i) => {
          const done    = lvl.level < currentLevel;
          const active  = lvl.level === currentLevel && isEscalated;
          const pending = lvl.level > currentLevel;

          return (
            <div key={i} className="escalation-timeline__step">
              <div className={`escalation-timeline__node ${done ? 'done' : active ? 'active' : 'pending'}`}>
                {done    ? <CheckCircle size={16} />         : null}
                {active  ? <AlertTriangle size={16} />       : null}
                {pending ? <Circle size={16} strokeWidth={1.5} /> : null}
              </div>
              {i < levels.length - 1 && (
                <ChevronRight size={14} className="escalation-timeline__arrow" />
              )}
              <div className={`escalation-timeline__label ${active ? 'active' : ''}`}>
                {lvl.label}
              </div>
            </div>
          );
        })}
      </div>

      {isEscalated && (
        <div className="escalation-timeline__note">
          ⚠️ Escalated — currently at level {currentLevel}: <strong>{levels[currentLevel - 1]?.label}</strong>
        </div>
      )}

      {complaint?.statusHistory?.filter(h => h.status === 'Escalated').map((h, i) => (
        <div key={i} className="escalation-timeline__history">
          <span style={{ fontWeight: 600 }}>Level {i + 2} escalation</span>
          <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>
            {h.note && `"${h.note}"`}
          </span>
          <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
            {new Date(h.at).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  );
}
