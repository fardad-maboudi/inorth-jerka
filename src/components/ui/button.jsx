import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal shadcn-style Button. Ships with the scaffold because generated apps
 * almost always `import { Button } from '@/components/ui/button'`; without a
 * real implementation the missing-import stub renders nothing.
 */
/**
 * Palette-bound variants. Every colour here is a `@theme` token, so a button
 * takes the app's brand automatically.
 *
 * This used to hardcode Tailwind's stock blue with a white label, which meant
 * the primary button of *every* generated app was blue no matter what palette
 * the agent locked — and a white label over a light brand fails WCAG AA
 * outright. Always pair a filled surface with its `on-` token, never a literal
 * white: those are computed per palette to be readable.
 *
 * (Do not name stock utility classes literally in this file — Tailwind's
 * `@source` scan reads comments too and would emit the class into the bundle.)
 */
const VARIANTS = {
  default: 'bg-brand-600 text-on-brand hover:bg-brand-700',
  outline:
    'border border-neutral-300 bg-transparent text-ink hover:bg-neutral-100',
  ghost: 'bg-transparent text-ink hover:bg-neutral-100',
  // `state-error` itself is only 4.23:1 under white — the `-ink` variant is the
  // AA-safe fill for a solid destructive button.
  destructive: 'bg-state-error-ink text-white hover:opacity-90',
  secondary: 'bg-neutral-100 text-ink hover:bg-neutral-200',
};

const SIZES = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-8 text-base',
  icon: 'h-10 w-10',
};

export function Button({
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.default,
        SIZES[size] ?? SIZES.default,
        className,
      )}
      {...props}
    />
  );
}

export default Button;
