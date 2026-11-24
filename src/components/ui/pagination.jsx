/* eslint-disable react-refresh/only-export-components -- exports helpers beside components by design */
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Page numbers to show: always first/last, a window around `page`, `null` for a gap. */
export function pageWindow(page, pageCount, siblings = 1) {
  const total = Math.max(1, Math.floor(pageCount) || 1);
  const current = Math.min(Math.max(1, Math.floor(page) || 1), total);
  const wanted = new Set([1, total]);
  for (let n = current - siblings; n <= current + siblings; n += 1) {
    if (n >= 1 && n <= total) wanted.add(n);
  }
  const sorted = [...wanted].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((n, index) => {
    if (index && n - sorted[index - 1] > 1) result.push(null);
    result.push(n);
  });
  return result;
}

/**
 * Page navigation. `page` is 1-based. Pass `pageCount`, or `total` + `pageSize`.
 * Labels are overridable for non-Persian sites.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize = 20,
  onPageChange,
  siblings = 1,
  className,
  labels = { previous: "قبلی", next: "بعدی", page: "صفحه" },
}) {
  const count = pageCount ?? Math.max(1, Math.ceil((Number(total) || 0) / pageSize));
  if (count <= 1) return null;
  const current = Math.min(Math.max(1, page || 1), count);
  const go = (n) => n >= 1 && n <= count && n !== current && onPageChange?.(n);
  return (
    <nav aria-label="pagination" className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      <Button type="button" variant="outline" size="sm" disabled={current <= 1} onClick={() => go(current - 1)}>
        <ChevronRight className="size-4 ltr:rotate-180" aria-hidden="true" />
        {labels.previous}
      </Button>
      {pageWindow(current, count, siblings).map((n, index) =>
        n === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={n === current ? "default" : "outline"}
            aria-label={`${labels.page} ${n}`}
            aria-current={n === current ? "page" : undefined}
            onClick={() => go(n)}
          >
            {new Intl.NumberFormat("fa-IR").format(n)}
          </Button>
        ),
      )}
      <Button type="button" variant="outline" size="sm" disabled={current >= count} onClick={() => go(current + 1)}>
        {labels.next}
        <ChevronLeft className="size-4 ltr:rotate-180" aria-hidden="true" />
      </Button>
    </nav>
  );
}

export default Pagination;
