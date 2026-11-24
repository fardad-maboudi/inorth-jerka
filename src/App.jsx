/**
 * @joorchin-platform-entry
 *
 * PLATFORM-OWNED — do not edit, and do not let the agent rewrite this file.
 * Routing is discovered from `src/pages/*.jsx`, so a page becomes reachable the
 * moment it lands on disk (Vite invalidates glob importers on file *add*, which
 * is what makes the preview grow live during a build).
 *
 * Conventions:
 *   src/pages/Home.jsx | Index.jsx     -> "/"   (else the first page is promoted)
 *   src/pages/About.jsx                -> "/about"
 *   src/pages/Shop/ProductList.jsx     -> "/shop/productlist"   (nested dirs)
 *   src/pages/Shop/index.jsx           -> "/shop"
 *   src/pages/Product/[id].jsx         -> "/product/:id"         (path params)
 *   src/pages/Article/[slug].jsx       -> "/article/:slug"
 *   src/components/Layout.jsx          -> wraps <Routes> when present
 *   src/config/plugins.js              -> which platform providers to mount
 *
 * Nested dirs and `[param]` segments exist because the flat, param-less version
 * of this convention silently produced worse sites: plugin scaffolds under
 * `pages/Shop/` were never routed at all (dead code the agent still linked to),
 * and with no way to express `/product/:id` the agent fell back to
 * `/product?id=123` — unshareable, unindexable URLs (app
 * 6a6f10a89aaaf47096221a76, 2026-08-02). `*Routes.jsx` files are route-table
 * helpers, not pages, so they are excluded.
 *
 * Each route is lazy + error-isolated, so a page with a broken import fails
 * alone instead of blanking the whole preview. The same rule binds the chrome
 * this file mounts itself: NO PLATFORM-OWNED CHROME MAY UNMOUNT THE APP. Two
 * consequences, both enforced in `src/generated-site-scaffold.test.ts`:
 *   - anything rendered in `App()` is OUTSIDE `<BrowserRouter>` (the router is
 *     created in `AppRoutes()`), so it must not touch react-router — `<Link>`
 *     there reads a null context and takes the whole tree down with it;
 *   - every lazy chrome mount gets a `RouteErrorBoundary`, so a failed chunk
 *     load costs that widget and nothing else.
 *
 * BASENAME: preview containers serve the app under `/app/<appId>/` (vite `base`
 * from `VITE_BASE`), published root domains under `/`. The router MUST be told,
 * or every route is declared at `/` while the location is `/app/<appId>/` and
 * `<Routes>` matches nothing — a fully-built site renders blank with only
 * `No routes matched location` in the console. `import.meta.env.BASE_URL` is
 * vite's own resolved base, so it is correct in both deployments.
 */
import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { initPreviewAuthListener } from "./api/auth.js";
import BuildingPlaceholder from "./components/BuildingPlaceholder.jsx";
import PageSkeleton from "./components/PageSkeleton.jsx";
import RouteErrorBoundary from "./components/RouteErrorBoundary.jsx";
// Routing vocabulary — the ONE derivation, mirrored from `sdks/contracts/schemas/page-routes.ts`
// so be-core's gates and plugin contracts can never advertise a path this file
// does not serve. Re-exported because existing tooling imports them from here.
import {
  isPageModule,
  isPluginScaffoldPage,
  pageRoutePath,
} from "./lib/page-routes.js";
import StorefrontHead from "./seo/StorefrontHead.jsx";
import EnamadSeal from "./seo/EnamadSeal.jsx";
import { pwaConfig } from "./config/pwa.js";
import { platformConfig } from "./config/plugins.js";
import {
  NullCartProvider,
  PendingCartProvider,
} from "./lib/cart-context.js";
import {
  NullI18nProvider,
  PendingI18nProvider,
} from "./lib/i18n-context.js";

export { isPageModule, isPluginScaffoldPage, pageRoutePath };

const pageModules = import.meta.glob("./pages/**/*.jsx");
// Wildcard so Vite watches file *add* for Layout the same way it does pages.
const layoutModules = import.meta.glob("./components/**/Layout.jsx");

const layoutLoader = Object.values(layoutModules)[0];
const LazyLayout = layoutLoader ? lazy(layoutLoader) : null;

const LazyInstallPage = lazy(() => import("./pwa/InstallPage.jsx"));
const LazyPwaBanner = lazy(() => import("./pwa/PwaInstallBanner.jsx"));

/**
 * Static registry: every specifier is a real file in the base image. The
 * plugins.js snapshot decides *activation* only — never filesystem discovery.
 * Auth (and later analytics) join this table the same way; do not add another
 * bespoke boundary.
 */
/**
 * One retry for cold-start races: the runtime probe can hit a provider chunk
 * while Vite is still compiling it after a container wake. A single failed
 * dynamic import must not permanently demote the app to the Null provider
 * (which throws CartUnavailableError while ecommerce is enabled).
 */
function importWithRetry(importer) {
  return () =>
    importer().catch(() =>
      new Promise((resolve) => setTimeout(resolve, 400)).then(importer),
    );
}

const LazyCartProvider = lazy(
  importWithRetry(() =>
    import("./platform/providers/cart-provider.jsx").then((mod) => ({
      default: mod.CartProvider ?? mod.default,
    })),
  ),
);
const LazyI18nProvider = lazy(
  importWithRetry(() =>
    import("./platform/providers/i18n-provider.jsx").then((mod) => ({
      default: mod.I18nProvider ?? mod.default,
    })),
  ),
);

const PROVIDER_REGISTRY = {
  ecommerce: {
    Provider: LazyCartProvider,
    Fallback: NullCartProvider,
    Pending: PendingCartProvider,
    routeName: "CartProvider",
  },
  i18n: {
    Provider: LazyI18nProvider,
    Fallback: NullI18nProvider,
    Pending: PendingI18nProvider,
    routeName: "I18nProvider",
  },
};

function readEnabledPlugins(config) {
  const enabled = config?.enabledPlugins;
  if (!enabled || typeof enabled !== "object") return {};
  return enabled;
}

function CapabilityProvider({ spec, children }) {
  const Fallback = spec.Fallback;
  const Pending = spec.Pending ?? Fallback;
  const Provider = spec.Provider;
  return (
    <RouteErrorBoundary
      routeName={spec.routeName}
      fallback={() => <Fallback>{children}</Fallback>}
    >
      {/* Loading uses the silent pending provider — the chunk loading is not a
          platform defect and must not beacon cart_unavailable. */}
      <Suspense fallback={<Pending>{children}</Pending>}>
        <Provider>{children}</Provider>
      </Suspense>
    </RouteErrorBoundary>
  );
}

/**
 * Three states, no pass-through hole: capability off → no provider (non-shop;
 * useCart is never called); on + loaded → real provider; on + failed →
 * Null*Provider + blocking telemetry. Never `if (!Provider) return children`.
 */
function PlatformProviders({ children }) {
  const enabled = readEnabledPlugins(platformConfig);
  let tree = children;
  for (const [id, spec] of Object.entries(PROVIDER_REGISTRY)) {
    if (enabled[id] !== true) continue;
    tree = (
      <CapabilityProvider key={id} spec={spec}>
        {tree}
      </CapabilityProvider>
    );
  }
  return tree;
}

/**
 * Exactly one index route: with no Home/Index page, promote the first page the
 * agent itself wrote. If only scaffolds exist, promote nothing — the build is
 * still in flight and `AppRoutes` falls back to `<BuildingPlaceholder />`.
 * Pure and exported so `src/generated-site-scaffold.test.ts` can exercise it.
 */
export function promoteIndexRoute(pages) {
  if (!pages.some((p) => p.path === "/")) {
    const promotable = pages.find((p) => !isPluginScaffoldPage(p.file));
    if (promotable) promotable.path = "/";
  }
  return pages;
}

function buildRoutes() {
  return promoteIndexRoute(
    Object.keys(pageModules)
      .filter(isPageModule)
      .sort()
      .map((file) => ({
        file,
        name: file.replace("./pages/", "").replace(/\.jsx$/, ""),
        path: pageRoutePath(file),
        Component: lazy(pageModules[file]),
      })),
  );
}

/**
 * Layout as a PARENT ROUTE element. `<LazyLayout><Outlet /></LazyLayout>` works
 * for both conventions the agent may emit: an `<Outlet />`-based Layout ignores
 * the children prop, a children-based Layout renders the Outlet we pass in.
 */
function LayoutRoute() {
  return (
    <RouteErrorBoundary routeName="Layout">
      <Suspense fallback={<PageSkeleton />}>
        <LazyLayout>
          <Outlet />
        </LazyLayout>
      </Suspense>
    </RouteErrorBoundary>
  );
}

/**
 * Vite's resolved base, normalized for react-router. `BASE_URL` is `/app/<id>/`
 * in a preview container and `/` on a published root domain; react-router wants
 * no trailing slash, and treats "" / "/" the same.
 */
export function resolveBasename(baseUrl) {
  const raw = typeof baseUrl === "string" ? baseUrl.trim() : "";
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

/**
 * Rendered when the location matches no page. Never a blank screen: a silent
 * blank is indistinguishable from a broken build, so say what happened, link
 * home, and beacon it to `.app-runtime/<appId>.jsonl` (see
 * public/runtime-telemetry.js). The old blank-#root detector could not see this
 * class of failure — `#root` had the site chrome in it, only the routed outlet
 * was empty — which is how a whole storefront shipped as "ready" while
 * rendering nothing.
 */
function RouteNotFound({ knownPaths }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.__joorchinTelemetry?.report({
      type: "route_unmatched",
      message: `No route matched "${pathname}"`,
      details: `known paths: ${knownPaths.join(", ") || "(none)"}`,
      // Only the ROOT being unmatched means the site is unreachable — that is
      // what be-core escalates to a blocking validation issue. A deep link
      // matching nothing is normal mid-build noise.
      meta: { isRoot: pathname === "/" || pathname === "" },
    });
  }, [pathname, knownPaths]);

  return (
    <main
      dir="rtl"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <p className="text-lg font-semibold">این صفحه پیدا نشد</p>
      <p className="text-sm opacity-70">{pathname}</p>
      <Link to="/" className="text-sm underline">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}

function AppRoutes() {
  const pages = buildRoutes();
  // No root route means no real page exists yet (empty workspace, or only plugin
  // scaffolds so far) — that is a build in progress, not a broken site.
  if (!pages.some((p) => p.path === "/")) return <BuildingPlaceholder />;

  const routes = pages.map((page) => (
    <Route
      key={page.name}
      path={page.path}
      element={
        // `key` per route: without it React reuses ONE RouteErrorBoundary
        // instance across navigations (same type, same tree position), so a
        // broken page left every sibling route stuck on its error screen.
        <RouteErrorBoundary key={page.name} routeName={page.name}>
          <Suspense fallback={<PageSkeleton />}>
            <page.Component />
          </Suspense>
        </RouteErrorBoundary>
      }
    />
  ));

  if (pwaConfig?.enabled) {
    routes.push(
      <Route
        key="__install"
        path="/install"
        element={
          <RouteErrorBoundary key="install" routeName="Install">
            <Suspense fallback={<PageSkeleton />}>
              <LazyInstallPage />
            </Suspense>
          </RouteErrorBoundary>
        }
      />,
    );
  }

  const notFound = (
    <Route
      key="__notfound"
      path="*"
      element={<RouteNotFound knownPaths={pages.map((p) => p.path)} />}
    />
  );

  const knownPaths = [
    ...pages.map((p) => p.path),
    ...(pwaConfig?.enabled ? ["/install"] : []),
  ];

  return (
    <BrowserRouter basename={resolveBasename(import.meta.env.BASE_URL)}>
      <PreviewStudioBridge paths={knownPaths} />
      <Routes>
        {LazyLayout ? (
          <Route element={<LayoutRoute />}>
            {routes}
            {notFound}
          </Route>
        ) : (
          [...routes, notFound]
        )}
      </Routes>
      {/*
       * Chrome, not a route — but it MUST live inside <BrowserRouter>: it links
       * to /install with react-router's <Link>, and <Link> outside a router
       * reads a null context ("Cannot destructure property 'basename'"), which
       * with no boundary above it unmounts the entire app (app
       * 6a819339efe4c0d5d0ba15ca, 2026-08-16 — every preview blank, 12 beacons).
       * Error-isolated like every other lazy mount in this file, so a broken
       * banner (or a chunk that fails to load) costs the banner, never the site.
       */}
      <PwaBannerChrome />
    </BrowserRouter>
  );
}

/**
 * Studio preview chrome talks to the parent frame. Must live inside the
 * router so `navigate()` updates the same history the route notifier wraps.
 */
function PreviewStudioBridge({ paths }) {
  const navigate = useNavigate();
  const pathKey = Array.isArray(paths) ? paths.join("\0") : "";

  useEffect(() => {
    const list = pathKey ? pathKey.split("\0") : [];
    window.parent?.postMessage({ type: "preview:routes", payload: { paths: list } }, "*");
  }, [pathKey]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.data?.type !== "preview:navigate") return;
      const raw = event.data?.payload?.path;
      if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return;
      if (raw.includes("://")) return;
      const path = raw.split("?")[0].split("#")[0];
      navigate(path);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  return null;
}

/** Platform chrome: isolated so it can only ever fail alone. */
function PwaBannerChrome() {
  if (!pwaConfig?.enabled) return null;
  return (
    <RouteErrorBoundary routeName="PwaBanner" fallback={() => null}>
      <Suspense fallback={null}>
        <LazyPwaBanner />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function App() {
  useEffect(() => {
    initPreviewAuthListener();
  }, []);

  // Never put in-flow chrome after <AppRoutes /> and never stack padding on a
  // min-h-screen shell: generated Layouts are themselves min-h-screen, so
  // `pt-10` + an empty <footer py-6> always created a white band below the
  // site footer (studio preview). Overlay chrome only — EnamadSeal / the
  // preview banner / the PWA dock are position:fixed.
  return (
    <div>
      {/*
       * Every platform chrome mount is error-isolated: a throwing chrome
       * component (head tags, seal) must cost itself, never
       * unmount the routed app. Same invariant as PwaBannerChrome below
       * (app 6a819339efe4c0d5d0ba15ca class).
       */}
      <RouteErrorBoundary routeName="StorefrontHead" fallback={() => null}>
        <StorefrontHead />
      </RouteErrorBoundary>
      <PlatformProviders>
        <AppRoutes />
      </PlatformProviders>
      <RouteErrorBoundary routeName="EnamadSeal" fallback={() => null}>
        <EnamadSeal />
      </RouteErrorBoundary>
    </div>
  );
}

export default App;
