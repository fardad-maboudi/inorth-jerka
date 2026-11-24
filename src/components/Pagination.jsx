import { useMemo } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { formatNumber } from '@/lib/money';

/**
 * Generates an accessible pagination window with page numbers and 'gap' markers:
 * e.g., [1, 2, 3, 'gap', 10]
 */
function createPageWindow(current, total, siblings = 1) {
  const totalPages = Math.max(1, Math.floor(total) || 1);
  const currentPage = Math.min(Math.max(1, Math.floor(current) || 1), totalPages);

  const wanted = new Set([1, totalPages]);
  for (let n = currentPage - siblings; n <= currentPage + siblings; n += 1) {
    if (n >= 1 && n <= totalPages) {
      wanted.add(n);
    }
  }

  const sorted = Array.from(wanted).sort((a, b) => a - b);
  const result = [];

  sorted.forEach((n, idx) => {
    if (idx > 0 && n - sorted[idx - 1] > 1) {
      result.push('gap');
    }
    result.push(n);
  });

  return result;
}

/**
 * Editorial Pagination Component (JERKA Design System)
 * - 2px corner radius, hairline borders, warm paper/card surfaces
 * - RTL-first directional navigation (Previous points right, Next points left)
 * - Persian digits formatted via `formatNumber`
 * - WCAG AA accessible focus rings and ARIA current markers
 * - Tactile press feedback (:active:scale-[0.97])
 */
export default function Pagination({
  page = 1,
  total = 0,
  pageSize = 16,
  onPageChange,
  className = '',
  labels = { previous: 'قبلی', next: 'بعدی', page: 'صفحه' },
}) {
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((Number(total) || 0) / Number(pageSize || 16)));
  }, [total, pageSize]);

  // Hide pagination if only 1 page exists
  if (totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const windowItems = createPageWindow(currentPage, totalPages);

  const handleNav = (target) => {
    if (target >= 1 && target <= totalPages && target !== currentPage) {
      onPageChange?.(target);
    }
  };

  return (
    <nav
      aria-label="صفحه‌بندی نتایج"
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      {/* Previous Page Button (In RTL, previous points right) */}
      <button
        type="button"
        onClick={() => handleNav(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="صفحه قبلی"
        className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-[2px] transition-[border-color,background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600"
      >
        <ArrowRight size={14} aria-hidden="true" />
        <span>{labels.previous}</span>
      </button>

      {/* Numbered Page Window */}
      {windowItems.map((item, idx) =>
        item === 'gap' ? (
          <span
            key={`gap-${idx}`}
            aria-hidden="true"
            className="px-2 text-xs text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => handleNav(item)}
            aria-label={`${labels.page} ${formatNumber(item)}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`min-w-[34px] h-[34px] inline-flex items-center justify-center px-2 rounded-[2px] text-xs transition-[border-color,background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 ${
              item === currentPage
                ? 'bg-espresso text-on-espresso font-semibold border border-espresso shadow-sm'
                : 'border border-line bg-card text-ink hover:border-brand-400 hover:text-brand-700 hover:bg-sand/30 font-medium'
            }`}
          >
            {formatNumber(item)}
          </button>
        )
      )}

      {/* Next Page Button (In RTL, next points left) */}
      <button
        type="button"
        onClick={() => handleNav(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="صفحه بعدی"
        className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-[2px] transition-[border-color,background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600"
      >
        <span>{labels.next}</span>
        <ArrowLeft size={14} aria-hidden="true" />
      </button>
    </nav>
  );
}
