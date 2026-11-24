/**
 * VENDORED COPY of `sdks/contracts/schemas/page-routes.ts` — the single definition of
 * "which URL does this page file serve".
 *
 * It is vendored rather than imported because this file ships INSIDE the
 * generated app's container, which has no access to the monorepo's packages.
 * `be/vps/src/page-routes-vendor.test.ts` runs both implementations over the
 * same corpus and fails if they disagree, so the two cannot silently drift the
 * way the three hand-maintained copies did before 2026-08-15 (app
 * `6a7f797e78fa4454c00ecaf8`: cart icon and primary CTA both 404).
 *
 * EDIT `sdks/contracts/schemas/page-routes.ts` FIRST, then mirror the change here.
 */

const PAGE_FILE_RE = /^src\/pages\/(.+)\.jsx$/;
const ROUTE_HELPER_RE = /Routes\.jsx$/;

/**
 * Directories under `src/pages/` written by plugin install, not by the agent.
 * A scaffold page is never promoted to the site root — without `Shop` here the
 * storefront cart became the homepage on any build whose first agent-written
 * page sorted after `./pages/Shop/Cart.jsx`.
 */
export const PLUGIN_SCAFFOLD_PAGE_DIRS = ["Auth", "Cms", "Forms", "Media", "Shop"];

/** `./pages/Shop/Cart.jsx` and `src/pages/Shop/Cart.jsx` both normalize to the latter. */
export function normalizePagePath(file) {
  const clean = String(file).replace(/^\.\//, "");
  return clean.startsWith("pages/") ? `src/${clean}` : clean;
}

/** Is this file a routable page module (as opposed to a `*Routes.jsx` helper)? */
export function isPageModule(file) {
  const path = normalizePagePath(file);
  return PAGE_FILE_RE.test(path) && !ROUTE_HELPER_RE.test(path);
}

/**
 * Page file -> the route this entry mounts, or `null` when it is not a page.
 * Segments are lowercased (not kebabed), `[param]` becomes `:param` keeping its
 * case, and a trailing `Home`/`index` is dropped.
 */
export function pageRoutePath(file) {
  const path = normalizePagePath(file);
  if (!isPageModule(path)) return null;
  const match = PAGE_FILE_RE.exec(path);
  if (!match) return null;
  const segments = match[1]
    .split("/")
    .map((segment) => {
      const param = /^\[(.+)\]$/.exec(segment);
      return param ? `:${param[1]}` : segment.toLowerCase();
    })
    .filter((segment, index, all) =>
      index === all.length - 1 ? !/^(home|index)$/.test(segment) : true,
    );
  return segments.length ? `/${segments.join("/")}` : "/";
}

/** Is this page written by a plugin scaffold rather than by the agent? */
export function isPluginScaffoldPage(file) {
  const path = normalizePagePath(file);
  return PLUGIN_SCAFFOLD_PAGE_DIRS.some((dir) =>
    path.startsWith(`src/pages/${dir}/`),
  );
}
