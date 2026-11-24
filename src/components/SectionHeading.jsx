import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Editorial Section Heading conforming to JERKA design principles.
 * Eyebrow (Latin, Playfair, tracked) -> Persian title (Estedad) -> optional subtitle (muted).
 * Supports start-aligned (default) and centered variant (Aurelie look), plus optional action link or custom controls.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  link,
  align = 'start',
  actions,
  className = '',
}) {
  const isCentered = align === 'center';

  return (
    <div
      className={`mb-10 md:mb-14 ${
        isCentered
          ? 'mx-auto flex max-w-2xl flex-col items-center text-center'
          : 'flex flex-col md:flex-row md:items-end md:justify-between gap-6'
      } ${className}`}
    >
      <div className={isCentered ? 'text-center' : 'max-w-xl'}>
        {eyebrow && (
          <p className="eyebrow inline-block">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="mt-3.5 font-heading text-2xl font-bold tracking-tight text-ink md:text-3.5xl lg:text-4xl text-balance">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-3 text-sm leading-7 text-muted md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {(link || actions) && (
        <div
          className={`flex shrink-0 items-center gap-4 ${
            isCentered ? 'mt-6' : 'self-start md:self-end'
          }`}
        >
          {link && (
            <Link
              to={link.to}
              className="link-underline inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
            >
              <span>{link.label || 'مشاهده همه'}</span>
              <ArrowLeft size={15} strokeWidth={1.8} aria-hidden />
            </Link>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
