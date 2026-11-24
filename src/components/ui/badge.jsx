import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tinted badges built from the brand ramp. `100` tint under `800` text is a
 * contrast-safe pair at every hue because both come from the same perceptual
 * tone ramp — see `be/core` design-system/hct-palette.ts.
 */
const VARIANTS = {
  default: 'bg-brand-100 text-brand-800',
  secondary: 'bg-neutral-100 text-neutral-800',
  outline: 'border border-neutral-300 text-ink',
  destructive: 'bg-state-error/15 text-state-error',
};

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant] ?? VARIANTS.default,
        className,
      )}
      {...props}
    />
  );
}

export default Badge;
