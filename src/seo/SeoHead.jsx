import { siteConfig } from '../config/site';
import { pwaConfig } from '../config/pwa';

/** Default SEO + OG tags for generated apps. Agent should customize title/description. */
export function SeoHead({
  title = 'My Site',
  description = 'Built with Joorchin',
  ogImage,
  canonical,
}) {
  const siteTitle = title;
  const siteDesc = description;
  // og:image + favicon default to the active logo (single source: siteConfig).
  const logoUrl = siteConfig?.logoUrl || '';
  const ogImageUrl = ogImage || logoUrl || '/og-image.png';
  const canonicalUrl =
    canonical ||
    (typeof window !== 'undefined' ? window.location.href : '');
  const pwaOn = Boolean(pwaConfig?.enabled) && import.meta.env.PROD;
  const themeColor = pwaConfig?.themeColor || '#99002e';
  const icon192 = '/icons/icon-192.png';

  return (
    <>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDesc} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImageUrl} />
      {logoUrl ? <link rel="icon" href={logoUrl} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      {pwaOn ? (
        <>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content={themeColor} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content={pwaConfig.shortName || siteTitle} />
          <link rel="apple-touch-icon" href={logoUrl || icon192} />
        </>
      ) : null}
    </>
  );
}

// Default export so agents can use either default or named import of SeoHead.
// (Do not put example import statements in comments — validators may misread them.)
export default SeoHead;
