/**
 * Single source of truth for the site's active logo.
 *
 * Populated when a logo is generated for this app (be-core logo service →
 * `/assets/:permalink`). Favicon, header mark, and og:image all read from here
 * so they stay in sync. The agent overwrites `logoUrl` after generating a logo.
 */
export const siteConfig = {
  /** Public asset URL of the active logo SVG, e.g. "/assets/abc123". Empty = none. */
  logoUrl: '',
};

export default siteConfig;
