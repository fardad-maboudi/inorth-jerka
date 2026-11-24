import { useEffect, useRef } from "react";

const LOADING_VIDEO_SRC = `${import.meta.env.BASE_URL}loading/joorchin-loading.mp4`;
const STAGE_BG = "#FFFFFF";

/**
 * Default scaffold screen shown before the agent replaces App.jsx with real UI.
 */
export default function BuildingPlaceholder() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) {
        video.pause();
        video.currentTime = 0;
      } else {
        void video.play().catch(() => {});
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <main
      lang="fa"
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: STAGE_BG }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="در حال ساخت اپلیکیشن"
    >
      <div className="flex w-full max-w-[400px] flex-col items-center gap-5 text-center">
        <div className="relative w-full">
          <video
            ref={videoRef}
            src={LOADING_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-sm object-cover"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[15px] font-medium text-[#1A2B3C]">
            سایت شما در حال ساخت است
          </p>
          <p className="text-sm text-[#5A6A7A]">
            جور و چین دارند اپلیکیشن شما را می‌سازند. تا چند لحظه دیگر طراحی
            واقعی‌تان جایگزین این صفحه می‌شود.
          </p>
        </div>
      </div>
    </main>
  );
}
