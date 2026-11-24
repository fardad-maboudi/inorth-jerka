import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal shadcn-style Input. Ships with the scaffold — see Button.jsx for why.
 * forwardRef so it works with form libraries the agent may add later.
 */
export const Input = React.forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-neutral-300 bg-surface px-3 py-2 text-sm',
        'placeholder:text-muted',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

export default Input;
