/**
 * JERKA is a standalone site — this manifest is owned here, not synced from the
 * platform. The ecommerce plugin activates the platform CartProvider in App.jsx;
 * i18n stays off (the storefront is Persian-first, copy is hardcoded fa).
 */
export const platformConfig = {
  version: 1,
  enabledPlugins: { ecommerce: true, auth: true, delivery: false, i18n: false },
};

export default platformConfig;
