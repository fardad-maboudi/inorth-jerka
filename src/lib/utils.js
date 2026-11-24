import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts (shadcn-style helper).
 * Generated components almost always `import { cn } from '@/lib/utils'`,
 * so this MUST ship with the scaffold — otherwise the missing-import stub
 * generator produces a bogus `Utils()` export and the app crashes at runtime.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
