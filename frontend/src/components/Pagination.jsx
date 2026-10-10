import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination Controller
 * Props:
 *   page        - current page (1-indexed)
 *   totalPages  - total number of pages
 *   total       - total items count
 *   limit       - items per page
 *   onPageChange(newPage)
 *   onLimitChange(newLimit)  - optional
 *   limitOptions - optional array of numbers e.g. [10,20,50]
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
}) {
  if (totalPages <= 1 && total <= limit) return null;

  // Build visible page numbers: show up to 5 pages around current
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12, padding: '16px 0', marginTop: 8,
    }}>
      {/* Left: count info */}
      <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>
          Showing <strong style={{ color: 'var(--text-2)' }}>{from}–{to}</strong> of{' '}
          <strong style={{ color: 'var(--text-2)' }}>{total}</strong> items
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={e => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 8, padding: '4px 8px',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            {limitOptions.map(l => <option key={l} value={l}>{l} / page</option>)}
          </select>
        )}
      </div>

      {/* Right: page controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* First page */}
        <PagBtn
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
        >
          <ChevronsLeft size={14} />
        </PagBtn>

        {/* Prev */}
        <PagBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </PagBtn>

        {/* Page numbers */}
        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-3)', fontSize: 13 }}>…</span>
            : (
              <PagBtn
                key={p}
                active={p === page}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PagBtn>
            )
        )}

        {/* Next */}
        <PagBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight size={14} />
        </PagBtn>

        {/* Last page */}
        <PagBtn
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
        >
          <ChevronsRight size={14} />
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({ children, active, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        minWidth: 34, height: 34, borderRadius: 8, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: active ? 700 : 500, cursor: disabled ? 'not-allowed' : 'pointer',
        background: active
          ? 'var(--accent-light)'
          : 'var(--surface2)',
        color: active
          ? '#fff'
          : disabled ? 'var(--text-3)' : 'var(--text)',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.15s',
        boxShadow: active ? '0 0 0 2px rgba(79,110,247,0.25)' : 'none',
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'var(--surface3)'; }}
      onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.background = 'var(--surface2)'; }}
    >
      {children}
    </button>
  );
}
