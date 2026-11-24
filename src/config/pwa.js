/**
 * PWA metadata for the published site. Preview (Vite dev) never registers a
 * service worker — this file is read at prod `vite build` only.
 *
 * Publish overwrites `enabled` / name / theme from the app record. The agent
 * may set `name`/`description` via SeoHead / site title; do not hand-write a SW.
 */
export const pwaConfig = {
  enabled: true,
  name: 'My Site',
  shortName: 'Site',
  description: 'Built with Joorchin',
  themeColor: '#99002e',
  backgroundColor: '#ffffff',
  display: 'standalone',
  lang: 'fa',
  dir: 'rtl',
  startUrl: '/',
  scope: '/',
};

export default pwaConfig;
