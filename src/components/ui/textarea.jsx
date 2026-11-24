import React from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-neutral-300 bg-surface px-3 py-2 text-sm',
        'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export default Textarea;
