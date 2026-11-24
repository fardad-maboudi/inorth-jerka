/**
 * Preview authentication for generated apps.
 * Preview mode is set only via a server-minted JWT — never from client flags.
 */

const PREVIEW_TOKEN_KEY = `joorchin_preview_token:${import.meta.env?.VITE_APP_ID}`;
const USER_TOKEN_KEY = `joorchin_user_token:${import.meta.env?.VITE_APP_ID}`;

/** Current app id from the served path `/app/{appId}/...`. */
function currentAppId() {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/app\/([a-f0-9]{24})/i);
  return match ? match[1] : window.location.hostname.match(/^([a-f0-9]{24})\./i)?.[1] || null;
}

/** Decode the `appId` claim from a JWT without verifying its signature. */
function tokenAppId(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload && payload.appId ? String(payload.appId) : null;
  } catch {
    return null;
  }
}

/**
 * A token belongs to this app only when its appId claim matches the served app.
 * All generated apps share the `localhost` origin, so a token left in
 * sessionStorage by a previously-previewed app must never be reused here —
 * doing so makes the backend return 403 (appId mismatch in assertAppAccess).
 */
function tokenMatchesApp(token) {
  if (!token) return false;
  const appId = currentAppId() || import.meta.env?.VITE_APP_ID;
  if (!appId) return false;
  return tokenAppId(token) === appId;
}

let previewToken = null;
let runtimeToken = null;
let runtimeSessionActive = false;
if (typeof sessionStorage !== 'undefined') {
  const stored = sessionStorage.getItem(PREVIEW_TOKEN_KEY);
  if (tokenMatchesApp(stored)) {
    previewToken = stored;
  } else if (stored) {
    sessionStorage.removeItem(PREVIEW_TOKEN_KEY); // drop a stale cross-app token
  }
}

/**
 * @param {string|null|undefined} token
 */
export function setPreviewToken(token) {
  if (!tokenMatchesApp(token)) return; // never adopt another app's token
  previewToken = token;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('joorchin:preview-auth-ready'));
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(PREVIEW_TOKEN_KEY, token);
  }
}

/**
 * Adopt a server-verified runtime session without persisting it across reloads.
 * @param {string|null|undefined} token
 * @returns {boolean}
 */
export function setInMemoryAuthToken(token) {
  if (!tokenMatchesApp(token)) return false;
  runtimeSessionActive = true;
  runtimeToken = token;
  return true;
}

/** End a runtime session without reusing a stored website identity. */
export function clearInMemoryAuthToken(exitRuntime = false) { runtimeToken = null; runtimeSessionActive = !exitRuntime; }

/**
 * @returns {string|null}
 */
export function getPreviewToken() {
  return previewToken;
}

export function getAuthHeaders() {
  if (runtimeToken && tokenMatchesApp(runtimeToken)) {
    return { Authorization: `Bearer ${runtimeToken}` };
  }
  if (runtimeSessionActive) return {};
  // The auth plugin stores signed-in visitor sessions here. Use that identity
  // for plugin calls; preview JWTs only identify the iframe viewer.
  const userToken = typeof localStorage !== 'undefined'
    ? localStorage.getItem(USER_TOKEN_KEY)
    : null;
  if (userToken && tokenMatchesApp(userToken)) {
    return { Authorization: `Bearer ${userToken}` };
  }
  if (!previewToken) return {};
  return { Authorization: `Bearer ${previewToken}` };
}

/** Accept preview token from studio iframe parent or ?preview_token= URL param. */
export function initPreviewAuthListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', (event) => {
    const { type, token } = event.data || {};
    if (event.source === window.parent && type === 'joorchin:preview-auth' && token) {
      setPreviewToken(token);
      window.dispatchEvent(new CustomEvent('joorchin:preview-auth-ready'));
    }
  });

  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('preview_token');
  if (urlToken) {
    setPreviewToken(urlToken);
    params.delete('preview_token');
    const qs = params.toString();
    const cleanUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', cleanUrl);
    window.dispatchEvent(new CustomEvent('joorchin:preview-auth-ready'));
  }
}

/** UI-only hint visibility; backend authorization still verifies the token. */
export function isOwnerStudioPreview() {
  if (!import.meta.env?.DEV || typeof window === 'undefined' || window.parent === window) return false;
  try {
    const claims = JSON.parse(atob((getPreviewToken() || '').split('.')[1]));
    return claims.tokenKind === 'preview' && claims.exp * 1000 > Date.now() && tokenMatchesApp(getPreviewToken());
  } catch { return false; }
}

/** Persian and Arabic digits to ASCII. @param {unknown} value */
export function toLatinDigits(value) {
  return String(value ?? '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** Canonical ASCII +989XXXXXXXXX, or null. @param {unknown} raw */
export function normalizeIranianMobile(raw) {
  const compact = toLatinDigits(String(raw ?? '')).replace(/[\s()\-._]/g, '');
  if (!/^\+?\d+$/.test(compact)) return null;
  const digits = compact.replace(/^\+/, '');
  // Candidates rather than a prefix chain: `9891234567` is a bare national
  // number on the 0989 prefix, not a country code, and stripping `98` first
  // would reject it.
  const candidates = [
    digits,
    digits.startsWith('0') ? digits.slice(1) : null,
    digits.startsWith('0098') ? digits.slice(4) : null,
    digits.startsWith('98') ? digits.slice(2) : null,
  ];
  const national = candidates.find(
    (value) => value !== null && /^9\d{9}$/.test(value),
  );
  return national ? `+98${national}` : null;
}

/** Display an Iranian mobile locally, preserving other values. @param {unknown} raw */
export function formatIranianMobile(raw) {
  const canonical = normalizeIranianMobile(raw);
  return canonical ? `0${canonical.slice(3)}` : toLatinDigits(raw);
}
