import { useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  Truck,
  RotateCcw,
  Sparkles,
  Gem,
  Hourglass,
  Hammer,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { searchProducts, listCategories } from '@/api/plugins/ecommerce';
import ProductSlider from '@/components/ProductSlider';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import { ROUTES } from '@/lib/routes';
import { fadeUp, staggerParent, EASE } from '@/lib/motion';
import { homeContent } from './home.content';
import heroBannerWebp from '@/assets/hero-banner.webp';
import heroBannerAvif from '@/assets/hero-banner.avif';

const ICON_MAP = {
  ShieldCheck,
  Lock,
  Truck,
  RotateCcw,
  Sparkles,
  Gem,
  Hourglass,
  Hammer,
};

function subscribeDesktopPointer(callback) {
  const mq = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getDesktopPointerSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches;
}

/* --------------------------------------------------------------------------
   3. HERO SECTION
   -------------------------------------------------------------------------- */
function Hero() {
  const content = homeContent.hero;
  const shouldReduceMotion = useReducedMotion();
  const canParallax = useSyncExternalStore(subscribeDesktopPointer, getDesktopPointerSnapshot, () => false);

  const { scrollY } = useScroll();
  // Parallax on image layer only: <= 8% travel (40px over 600px scroll = 6.67%)
  const yParallax = useTransform(scrollY, [0, 600], [0, 40]);
  const y = canParallax && !shouldReduceMotion ? yParallax : 0;

  const contentVariants = shouldReduceMotion
    ? { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
    : staggerParent;
  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : fadeUp;

  return (
    <section className="relative isolate flex min-h-[100dvh] w-full items-center overflow-hidden">
      {/* Hero background image layer with subtle <= 8% parallax, disabled on mobile & reduced-motion */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-x-0 -top-10 -bottom-10 z-0 select-none will-change-transform"
      >
        <picture className="h-full w-full">
          <source srcSet={heroBannerAvif} type="image/avif" />
          <source srcSet={heroBannerWebp} type="image/webp" />
          <img
            src={heroBannerWebp}
            alt="ژرکا"
            fetchPriority="high"
            width={1920}
            height={1080}
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </motion.div>

      {/* Subtle warm gradient overlay to guarantee text legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-t from-paper/60 via-transparent to-espresso/15 md:bg-gradient-to-l md:from-paper/70 md:via-paper/25 md:to-transparent"
      />

      <div className="container-max relative z-10 flex min-h-[100dvh] w-full items-center pb-16 pt-24 sm:pt-28 lg:pt-24">
        {/* Start-anchored editorial copy */}
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-xl text-start"
        >
          <motion.p variants={itemVariants} className="eyebrow">
            {/* {content.eyebrow} */}
          </motion.p>
          <motion.h1
            variants={itemVariants}
            className="mt-5 font-heading text-4xl font-bold leading-[1.25] text-ink sm:text-5xl md:text-[3.8rem] text-balance"
          >
            {content.title.split('\n').map((line, idx) => (
              <span key={idx}>
                {line}
                {idx === 0 && <br />}
              </span>
            ))}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-lg text-base leading-8 text-neutral-800 md:text-lg md:leading-9"
          >
            {content.description}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-9 flex flex-wrap items-center gap-4">
            <Link to={content.primaryCta.to} className="btn-primary rounded-[4px] active:scale-[0.98]">
              <span>{content.primaryCta.label}</span>
              <ArrowLeft size={16} strokeWidth={1.8} aria-hidden />
            </Link>
            <a
              href={content.secondaryCta.to}
              className="btn-outline border-neutral-400/60 bg-paper/70 backdrop-blur-xs hover:border-brand-600 hover:bg-paper active:scale-[0.98]"
            >
              {content.secondaryCta.label}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   4. TRUST ROW (Brewly style under hero)
   -------------------------------------------------------------------------- */
function TrustRow() {
  const items = homeContent.trustRow;

  return (
    <section aria-label="ارزش‌های فروشگاه" className="border-y border-line bg-card py-9 md:py-12">
      <div className="container-max">
        <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || ShieldCheck;
            return (
              <div
                key={item.id || idx}
                className={`flex flex-col items-center text-center px-4 ${
                  idx % 2 === 1 ? 'border-s border-line' : ''
                } ${
                  idx > 0 ? 'lg:border-s lg:border-line' : 'lg:border-s-0'
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[2px] bg-sand/70 text-brand-600 mb-3.5">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-sm font-semibold text-ink md:text-base">
                  {item.label}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {item.subline}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   5. CATEGORY TILES (Aurelie tile strip)
   -------------------------------------------------------------------------- */
function CategoryTiles() {
  const { data: serverCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => listCategories({ limit: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const fallbacks = homeContent.categories.fallbacks;

  // Use server categories only if they exist and include images; otherwise use curated fallbacks
  const hasServerImages =
    Array.isArray(serverCategories) &&
    serverCategories.some((cat) => cat.image || cat.thumbnail || cat.cover);

  // Display four categories as requested
  const categories = (hasServerImages ? serverCategories : fallbacks).slice(0, 4);

  return (
    <section id="collections" className="section-padding scroll-mt-20 bg-paper">
      <div className="container-max">
        <SectionHeading
          eyebrow={homeContent.categories.eyebrow}
          title={homeContent.categories.title}
          subtitle={homeContent.categories.subtitle}
          link={{ to: ROUTES.shop, label: homeContent.categories.viewAllLabel }}
        />

        <div className="flex gap-4 overflow-x-auto pb-6 pt-3 px-3 -mx-3 scrollbar-none [scroll-snap-type:x_mandatory] sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:mx-0 sm:pt-1.5 sm:pb-2 md:gap-6">
          {categories.map((cat, idx) => {
            const catId = cat._id || cat.id;
            const targetUrl = catId ? `${ROUTES.shop}?category=${encodeURIComponent(catId)}` : ROUTES.shop;
            const fallback = fallbacks[idx % fallbacks.length];
            const title = cat.title || cat.name || fallback?.title || '';
            const latin = cat.latin || fallback?.latin;
            const img = cat.image || cat.thumbnail || cat.cover || fallback?.image;

            return (
              <Link
                key={catId || idx}
                to={targetUrl}
                className="group flex w-[140px] shrink-0 [scroll-snap-align:start] flex-col items-center text-center sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 rounded-[6px]"
              >
                <div className="card-home relative aspect-square w-full">
                  <div className="absolute inset-0 overflow-hidden rounded-[5px] bg-sand transition-colors duration-300 group-hover:bg-[#eae0d2]">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-700/40 font-display text-sm tracking-widest">
                        JERKA
                      </div>
                    )}
                  </div>
                </div>
                <span className="mt-3 font-heading text-xs md:text-sm font-medium text-ink transition-colors group-hover:text-brand-700">
                  {title}
                </span>
                {latin && (
                  <span className="mt-0.5 font-display text-[10px] tracking-widest text-muted">
                    {latin}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   6. GIFT EDIT (Aurelie curated 4-tile grid)
   -------------------------------------------------------------------------- */
function GiftEdit() {
  const content = homeContent.giftEdit;

  return (
    <section className="section-padding border-t border-line bg-sand/35">
      <div className="container-max">
        <SectionHeading
          // eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 pt-2 pb-6">
          {content.items.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="card-gift group relative block aspect-4/5 w-full min-w-0 focus-visible:outline-offset-4"
            >
              {/* Inner media clip container so images follow the 6px card curve (5px inner radius) while ::after shadow extends outside */}
              <div className="absolute inset-0 overflow-hidden rounded-[5px] bg-sand">
                {/* Background Image: sharp throughout, subtle smooth expansion on hover (no full-image blur) */}
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:scale-106 group-focus-visible:scale-106"
                />

                {/* Scrim & localized blur behind text only — keeps top product image clear */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-espresso/95 via-espresso/70 to-transparent opacity-80 backdrop-blur-[5px] [mask-image:linear-gradient(to_top,black_50%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_100%)] transition-[height,opacity] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-[65%] group-hover:opacity-95 group-focus-visible:h-[65%] group-focus-visible:opacity-95"
                />

                {/* Text Overlay: rests near bottom, glides up subtly on hover with descriptor in the lower area */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end p-4 pb-5 text-center sm:p-5 sm:pb-6 transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 sm:group-hover:-translate-y-3 md:group-hover:-translate-y-4 group-focus-visible:-translate-y-2 sm:group-focus-visible:-translate-y-3 md:group-focus-visible:-translate-y-4 motion-reduce:transform-none">
                  <h3 className="font-heading text-sm sm:text-base md:text-lg font-bold leading-snug text-card drop-shadow-sm line-clamp-2 text-balance break-words">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-200/95 leading-relaxed opacity-0 translate-y-3 transition-[opacity,transform] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none line-clamp-2 break-words">
                    {item.descriptor}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   7. PAIRINGS (Curated 2 wide cards)
   -------------------------------------------------------------------------- */
function Pairings() {
  const content = homeContent.pairings;

  return (
    <section className="section-padding border-t border-line bg-paper">
      <div className="container-max">
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {content.items.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-[2px] border border-line bg-card transition-colors duration-300 hover:border-brand-600/60 lg:flex-row"
            >
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-sand lg:w-1/2">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                <div>
                  <h3 className="font-heading text-lg font-bold leading-snug text-ink md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs md:text-sm leading-7 text-muted">
                    {item.descriptor}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    to={item.link}
                    className="link-underline inline-flex items-center gap-2 text-xs md:text-sm font-medium text-brand-700 transition-colors hover:text-brand-800 active:scale-[0.98]"
                  >
                    <span>{item.cta}</span>
                    <ArrowLeft size={14} strokeWidth={1.8} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   8. TRENDING PRODUCTS SLIDER
   -------------------------------------------------------------------------- */
function TrendingProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['home', 'trending'],
    queryFn: () => searchProducts({ sort: '-created_at', limit: 8 }),
    staleTime: 60 * 1000,
  });

  const content = homeContent.trending;
  const products = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <section className="section-padding border-t border-line bg-sand/45">
      <div className="container-max">
        <SectionHeading
          // eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          link={{ to: ROUTES.shop, label: content.viewAllLabel }}
        />

        {/* Dedicated carousel container with distinguishable background */}
        <div className="relative rounded-3xl border border-line/80 bg-sand-deep/30 p-3 sm:p-5 md:p-6 shadow-xs overflow-hidden">
          <ProductSlider
            products={products}
            loading={isLoading}
            error={error?.message ?? null}
            emptyMessage="محصولات محبوب به‌زودی به ویترین افزوده می‌شوند."
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   9. BRAND STORY (Single Moss Band)
   -------------------------------------------------------------------------- */
function BrandStory() {
  const content = homeContent.brandStory;

  return (
    <section
      id="story"
      className="scroll-mt-20 border-t border-line bg-moss-900 text-on-moss overflow-hidden"
    >
      <div className="container-max section-padding grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Editorial Text Content */}
        <Reveal>
          <p className="eyebrow text-brand-300!">
            {content.eyebrow}
          </p>
          <blockquote className="mt-5 font-heading text-2xl font-medium leading-[1.5] text-on-moss sm:text-3xl md:text-3.5xl md:leading-[1.45] text-balance">
            {content.quote}
          </blockquote>
          <p className="mt-6 text-sm leading-8 text-on-moss/75 md:text-base md:leading-8">
            {content.description}
          </p>

          <div className="mt-10 space-y-5 border-t border-on-moss/10 pt-8">
            {content.points.map((pt, idx) => {
              const Icon = ICON_MAP[pt.icon] || Sparkles;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] bg-on-moss/10 text-brand-300">
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-on-moss">
                      {pt.title}
                    </h4>
                    <p className="mt-0.5 text-xs leading-6 text-on-moss/65">
                      {pt.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <Link
              to={content.cta.to}
              className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-on-moss/20 px-8 py-3.5 text-sm font-medium text-on-moss transition-[border-color,background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand-300 hover:bg-on-moss/10 hover:text-on-moss active:scale-[0.98]"
            >
              <span>{content.cta.label}</span>
              <ArrowLeft size={16} strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </Reveal>

        {/* Feature Visual */}
        <Reveal delay={0.2} className="relative">
          <div className="relative aspect-4/5 overflow-hidden rounded-[2px] bg-moss-950">
            <img
              src={content.image}
              alt="بوتیک و استودیوی ژرکا"
              loading="lazy"
              width={800}
              height={1000}
              className="h-full w-full object-cover opacity-90 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 motion-reduce:transition-none motion-reduce:hover:transform-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-moss-950/70 via-transparent to-transparent" />
          </div>
          {/* Subtle architectural hairline accent */}
          <div className="absolute -bottom-4 -start-4 hidden h-32 w-32 border border-brand-300/30 md:block pointer-events-none" />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   10. NEW ARRIVALS (Featured showcase slider)
   -------------------------------------------------------------------------- */
function NewArrivals() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['home', 'newest'],
    queryFn: () => searchProducts({ sort: '-created_at', limit: 8 }),
    staleTime: 60 * 1000,
  });

  const content = homeContent.newArrivals;
  const products = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <section className="section-padding border-t border-line bg-sand/45">
      <div className="container-max">
        <SectionHeading
          // eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          link={{ to: ROUTES.shop, label: content.viewAllLabel }}
        />

        {/* Dedicated carousel container with distinguishable background */}
        <div className="relative rounded-3xl border border-line/80 bg-sand-deep/30 p-3 sm:p-5 md:p-6 shadow-xs overflow-hidden">
          <ProductSlider
            products={products}
            loading={isLoading}
            error={error?.message ?? null}
            emptyMessage="کالکشن جدید به‌زودی رونمایی خواهد شد."
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   11. SEASON BANNER (Aurelie full-bleed)
   -------------------------------------------------------------------------- */
function SeasonBanner() {
  const content = homeContent.seasonBanner;

  return (
    <section className="relative min-h-[380px] md:min-h-[460px] overflow-hidden bg-espresso text-on-espresso">
      {/* Background imagery */}
      <img
        src={content.image}
        alt="کالکشن فصلی ژرکا"
        loading="lazy"
        width={1920}
        height={600}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
      />
      {/* Espresso gradient mask for legibility on text side (inline-start / right) */}
      <div className="absolute inset-0 bg-gradient-to-l from-espresso/90 via-espresso/60 to-transparent" />

      <div className="container-max relative z-10 flex min-h-[380px] md:min-h-[460px] items-center py-16">
        <div className="max-w-xl text-start">
          {/* <p className="eyebrow text-brand-300!">
            {content.eyebrow}
          </p> */}
          <h2 className="mt-4 font-heading text-3xl font-bold leading-tight text-on-espresso md:text-4.5xl">
            {content.title}
          </h2>
          <p className="mt-4 max-w-md text-sm md:text-base leading-8 text-on-espresso/80">
            {content.subtitle}
          </p>
          <div className="mt-8">
            <Link to={content.cta.to} className="btn-primary active:scale-[0.98]">
              <span>{content.cta.label}</span>
              <ArrowLeft size={16} strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   12. TESTIMONIALS (Client voices)
   -------------------------------------------------------------------------- */
function Testimonials() {
  const content = homeContent.testimonials;
  if (!content.items || content.items.length === 0) return null;

  return (
    <section aria-label="دیدگاه مشتریان" className="section-padding border-t border-line bg-card">
      <div className="container-max">
        <SectionHeading
          // eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {content.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-[2px] border border-line bg-paper/60 p-7 md:p-8 transition-colors hover:border-brand-600/40"
            >
              <p className="text-sm leading-8 text-neutral-700 italic">
                «{item.quote}»
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-line/70 pt-5">
                <div>
                  <h4 className="font-heading text-sm font-semibold text-ink">
                    {item.author}
                  </h4>
                  {item.city && (
                    <p className="text-xs text-muted mt-0.5">{item.city}</p>
                  )}
                </div>
                {item.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 size={13} />
                    <span>خریدار تأییدشده</span>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   HOME PAGE EXPORT
   -------------------------------------------------------------------------- */
export default function Home() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <GiftEdit />
      <Pairings />
      <TrendingProducts />
      <BrandStory />
      <NewArrivals />
      <SeasonBanner />
      <Testimonials />
      <TrustRow />
    </>
  );
}
