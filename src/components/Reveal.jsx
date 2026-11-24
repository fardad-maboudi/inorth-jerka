import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, EASE } from '@/lib/motion';

/**
 * Scroll-reveal wrapper — fades content up once when it enters the viewport.
 * Scroll reveals are once-only and respect prefers-reduced-motion.
 * `as` renders a semantic tag; `delay` staggers sibling reveals.
 */
export default function Reveal({ as = 'div', delay = 0, className, children, ...rest }) {
  const shouldReduceMotion = useReducedMotion();
  const Tag = motion[as] ?? motion.div;

  const variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: 0.3, ease: EASE },
        },
      }
    : fadeUp;

  return (
    <Tag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: shouldReduceMotion ? 0 : delay }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
