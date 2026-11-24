import { useEffect, useState } from "react";
import { getPublicSettings } from "../api/joorchin.js";

/** Preview nginx proxies `/api/`, not `/assets/`. Serve uploads through the API. */
function storefrontAssetUrl(url) {
  if (typeof url !== "string" || !url) return url;
  return url.startsWith("/assets/") ? `/api/v1${url}` : url;
}

/**
 * Iranian "نماد اعتماد الکترونیکی" trust seal.
 * Renders the owner-uploaded eNamad verification image, linking to the
 * enamad.ir profile. Renders nothing until a seal file is configured.
 *
 * Out of flow on purpose: an in-flow wrapper after the site Layout (the old
 * `<footer className="py-6">` in App.jsx) painted a white band under every
 * generated footer, even when this component returned null.
 */
export function EnamadSeal({ pluginId = "ecommerce" }) {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    let alive = true;
    getPublicSettings(pluginId).then((c) => alive && setCfg(c || {}));
    return () => {
      alive = false;
    };
  }, [pluginId]);

  const fileUrl = storefrontAssetUrl(cfg?.enamadFileUrl);
  if (!fileUrl) return null;

  const code = cfg?.enamad;
  const href = code
    ? `https://trustseal.enamad.ir/?id=${encodeURIComponent(code)}`
    : "https://enamad.ir";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="origin"
      aria-label="نماد اعتماد الکترونیکی"
      style={{
        position: "fixed",
        right: 16,
        bottom: "max(16px, env(safe-area-inset-bottom, 0px))",
        zIndex: 30,
        display: "inline-block",
      }}
    >
      <img src={fileUrl} alt="نماد اعتماد الکترونیکی" style={{ maxWidth: 120, height: "auto" }} />
    </a>
  );
}

export default EnamadSeal;
