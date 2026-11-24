import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Check,
  ArrowUpDown,
  Sparkles,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowLeft,
  ChevronLeft,
  Quote,
  MessageCircleHeart,
  ShieldCheck,
  Layers,
  Sparkle,
} from 'lucide-react';
import {
  useProductSearch,
  useCategories,
  getFacets,
  attributeLabel,
} from '@/api/plugins/ecommerce';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import { formatNumber } from '@/lib/money';
import { EASE } from '@/lib/motion';
import { ROUTES } from '@/lib/routes';

const PAGE_SIZE = 16;

const COLOR_SWATCH_MAP = {
  'آبی': { bg: 'bg-[#2b5c8f]', textLight: true },
  'سفید': { bg: 'bg-white ring-1 ring-espresso/20', textLight: false },
  'کرم': { bg: 'bg-[#faf5ed] ring-1 ring-espresso/20', textLight: false },
  'مشکی': { bg: 'bg-[#1d1a16]', textLight: true },
  'سیاه': { bg: 'bg-[#1d1a16]', textLight: true },
  'قهوه‌ای': { bg: 'bg-[#4a2e18]', textLight: true },
  'سبز': { bg: 'bg-[#2d5a3d]', textLight: true },
  'زیتونی': { bg: 'bg-[#4a6354]', textLight: true },
  'قرمز': { bg: 'bg-[#a83232]', textLight: true },
  'زرشکی': { bg: 'bg-[#7a1f2d]', textLight: true },
  'طوسی': { bg: 'bg-[#8a8a8a]', textLight: true },
  'خاکستری': { bg: 'bg-[#8a8a8a]', textLight: true },
  'زرد': { bg: 'bg-[#e5a93b]', textLight: false },
  'خردلی': { bg: 'bg-[#d99130]', textLight: true },
  'مسی': { bg: 'bg-[#a05c2c]', textLight: true },
  'آجری': { bg: 'bg-[#c86a4b]', textLight: true },
  'صورتی': { bg: 'bg-[#e8a598]', textLight: false },
  'سرمه‌ای': { bg: 'bg-[#1b2a47]', textLight: true },
  'بژ': { bg: 'bg-[#d8c5aa]', textLight: false },
  'نارنجی': { bg: 'bg-[#d96b27]', textLight: true },
  'بنفش': { bg: 'bg-[#5e3575]', textLight: true },
};

const SORTS = [
  { value: '-created_at', label: 'جدیدترین', icon: Sparkles },
  { value: 'price', label: 'ارزان‌ترین', icon: ArrowDownNarrowWide },
  { value: '-price', label: 'گران‌ترین', icon: ArrowUpNarrowWide },
];

const CATEGORY_TONE_PATS = [
  'bg-sand',
  'bg-moss-mist',
  'bg-clay-mist',
  'bg-saffron-mist',
  'bg-dusk-mist',
];

const CATEGORY_IMAGES = {
  living: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80&auto=format&fit=crop',
  lighting: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&q=80&auto=format&fit=crop',
  textile: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=300&q=80&auto=format&fit=crop',
  decor: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=300&q=80&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=300&q=80&auto=format&fit=crop',
};

/**
 * Editorial Catalog Page with Layered Color Architecture (Jerka Color Refresh):
 * - Deep textured Moss Hero Band with lifestyle imagery and stats
 * - Overlapping category tiles straddling the hero band boundary
 * - Sticky translucent toolbar with search and tactile segmented sort
 * - Warm layered Sand Sidebar containing elevated controls and consultation banner
 * - Grid with harmonic colored passepartouts and editorial interstitial breaks
 * - Progress bar and full keyboard/touch accessibility
 */
export default function ProductList() {
  const [params, setParams] = useSearchParams();

  // Read URL parameters
  const q = params.get('q') ?? '';
  const categoryId = params.get('category') ?? '';
  const sort = params.get('sort') ?? SORTS[0].value;
  const inStock = params.get('inStock') === 'true';
  const pageParam = parseInt(params.get('page') || '1', 10);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  // Local state for search input text
  const [prevQ, setPrevQ] = useState(q);
  const [searchInput, setSearchInput] = useState(q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (prevQ !== q) {
    setPrevQ(q);
    setSearchInput(q);
  }

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileFiltersOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  // Extract dynamic attribute filters: attr.<key>=value
  const attributes = useMemo(() => {
    const map = {};
    for (const [key, value] of params.entries()) {
      if (key.startsWith('attr.') && value) {
        map[key.slice(5)] = value.includes(',') ? value.split(',') : value;
      }
    }
    return map;
  }, [params]);

  // Categories query
  const { data: serverCategories = [] } = useCategories({ limit: 50 });

  // Facets query
  const { data: facets = [] } = useQuery({
    queryKey: ['ecommerce', 'facets', categoryId],
    queryFn: () => getFacets({ categoryId: categoryId || undefined }),
    staleTime: 60_000,
  });

  const skip = (page - 1) * PAGE_SIZE;

  // Primary product search query
  const {
    data: searchResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useProductSearch({
    q: q || undefined,
    categoryId: categoryId || undefined,
    sort,
    inStock: inStock ? 'true' : undefined,
    limit: PAGE_SIZE,
    skip,
    attributes,
    facets: 'true',
  });

  const products = useMemo(() => {
    return searchResponse?.items ?? (Array.isArray(searchResponse) ? searchResponse : []);
  }, [searchResponse]);
  const total = searchResponse?.total ?? (typeof searchResponse?.total === 'number' ? searchResponse.total : null);

  // Merge server categories with distinct categories found in products
  const categories = useMemo(() => {
    const list = Array.isArray(serverCategories)
      ? serverCategories
          .map((c) => ({
            ...c,
            title: c.title || c.name || c.label || '',
          }))
          .filter((c) => Boolean(c.title))
      : [];
    const seen = new Set(list.map((c) => String(c._id || c.id || c.title)));
    for (const p of products) {
      if (p.category && (p.category.title || p.category.name)) {
        const id = p.category._id || p.category.id || p.category.title;
        if (!seen.has(String(id))) {
          seen.add(String(id));
          list.push({
            _id: id,
            id,
            title: p.category.title || p.category.name,
          });
        }
      }
    }
    return list;
  }, [serverCategories, products]);

  // URL state update helper
  const updateParams = useCallback(
    (mutator, { resetPage = true } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutator(next);
          if (resetPage) {
            next.delete('page');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const activeAttrKeys = Object.keys(attributes);
  const isSortModified = sort && sort !== SORTS[0].value;
  const activeFilterCount =
    (q ? 1 : 0) +
    (categoryId ? 1 : 0) +
    (inStock ? 1 : 0) +
    (isSortModified ? 1 : 0) +
    activeAttrKeys.length;
  const hasFilters = activeFilterCount > 0;

  const handleToggleAttribute = useCallback(
    (facetKey, val) => {
      updateParams((next) => {
        const paramKey = `attr.${facetKey}`;
        const current = next.get(paramKey);
        if (!current) {
          next.set(paramKey, val);
          return;
        }
        const parts = current.split(',');
        if (parts.includes(val)) {
          const remaining = parts.filter((p) => p !== val);
          if (remaining.length) next.set(paramKey, remaining.join(','));
          else next.delete(paramKey);
        } else {
          next.set(paramKey, [...parts, val].join(','));
        }
      });
    },
    [updateParams]
  );

  const activeCategory = useMemo(() => {
    return categories.find((c) => (c._id || c.id) === categoryId);
  }, [categories, categoryId]);

  const handleClearAllFilters = useCallback(() => {
    setSearchInput('');
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const totalPages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  const scrollToGrid = useCallback(() => {
    const el = document.getElementById('catalog-results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > totalPages || newPage === page) return;
      updateParams(
        (next) => {
          if (newPage === 1) next.delete('page');
          else next.set('page', String(newPage));
        },
        { resetPage: false }
      );
      scrollToGrid();
    },
    [page, totalPages, updateParams, scrollToGrid]
  );

  const totalProductsCount = total != null ? total : products.length;
  const displayedCount = Math.min(skip + products.length, totalProductsCount);

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* 1. Rich Moss Hero Band (Color Refresh Anchor) */}
      <section className="container-max pt-6 sm:pt-8">
        <div className="bg-moss-band relative overflow-hidden rounded-2xl p-8 sm:p-10 md:p-14 text-cream shadow-xl border border-moss-800">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-clay/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-saffron/15 blur-3xl" />

          <div className="relative z-10 grid gap-8 md:grid-cols-[1.25fr_1fr] md:items-center">
            <div>
              {/* Breadcrumbs inside hero */}
              <nav aria-label="مسیر راهنما" className="flex items-center gap-1.5 text-xs text-cream/70">
                <Link to={ROUTES.home} className="transition-colors hover:text-cream">
                  خانه
                </Link>
                <ChevronLeft size={13} className="text-saffron" />
                <Link to={ROUTES.shop} className="transition-colors hover:text-cream">
                  فروشگاه
                </Link>
                {activeCategory && (
                  <>
                    <ChevronLeft size={13} className="text-saffron" />
                    <span className="text-saffron font-medium">{activeCategory.title}</span>
                  </>
                )}
              </nav>

              {/* Eyebrow */}
              <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-saffron">
                مجموعه‌ی پاییز و زمستان ۱۴۰۵
              </p>

              {/* Title */}
              <h1 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-5xl text-cream text-wrap-balance">
                {activeCategory ? activeCategory.title : 'همه محصولات'}
              </h1>

              {/* Narrative description */}
              <p className="mt-4 max-w-lg text-xs leading-7 text-cream/80 sm:text-sm">
                اشیایی دست‌ساز از چوب، کتان و سفال؛ آراسته با رنگ‌های خاک، مس و زعفران برای خانه‌ای که
                گرم، آرام و ماندگار است.
              </p>

              {/* Stat badges */}
              <dl className="mt-8 flex flex-wrap gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-cream/10 px-4 py-2.5 backdrop-blur-md border border-cream/15">
                  <dt className="font-display text-xl font-bold text-cream">{formatNumber(totalProductsCount)}</dt>
                  <dd className="text-[11px] text-cream/70">کالای منتخب</dd>
                </div>
                <div className="rounded-xl bg-cream/10 px-4 py-2.5 backdrop-blur-md border border-cream/15">
                  <dt className="font-display text-xl font-bold text-cream">{formatNumber(categories.length || 4)}</dt>
                  <dd className="text-[11px] text-cream/70">دسته‌بندی اصلی</dd>
                </div>
                <div className="rounded-xl bg-cream/10 px-4 py-2.5 backdrop-blur-md border border-cream/15">
                  <dt className="font-display text-xl font-bold text-saffron">۱۰۰٪</dt>
                  <dd className="text-[11px] text-cream/70">ضمانت اصالت و سلامت</dd>
                </div>
              </dl>
            </div>

            {/* Desktop visual showcase */}
            <div className="relative hidden md:block">
              <div className="relative aspect-5/4 w-full overflow-hidden rounded-2xl border border-cream/20 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1618220179428-22790b461013?w=900&q=80&auto=format&fit=crop"
                  alt="فضای نشیمن پاییزی با محصولات دست‌ساز ژرکا"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-950/60 via-transparent to-transparent" />
              </div>

              {/* Floating saffron callout badge */}
              <div className="absolute -bottom-4 start-6 -rotate-2 rounded-xl bg-saffron px-4 py-2.5 text-espresso shadow-xl">
                <p className="text-[10px] font-semibold">انتخاب فصل</p>
                <p className="font-heading text-sm font-bold">دست‌سازهای ماندگار</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Overlapping Category Tiles Straddling Hero Boundary */}
        <div className="relative z-10 -mt-8 sm:-mt-10 px-2 sm:px-6">
          <div className="mx-auto flex flex-nowrap sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar pb-2">
            {/* "All" Tile */}
            <button
              type="button"
              onClick={() => updateParams((next) => next.delete('category'))}
              className={`flex w-44 sm:w-52 shrink-0 items-center gap-3 rounded-2xl p-2.5 text-start transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-98 ${
                !categoryId
                  ? 'bg-espresso text-cream shadow-md border border-espresso'
                  : 'bg-card text-ink shadow-sm border border-line hover:border-brand-400 hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-1 ${
                  !categoryId ? 'bg-espresso-soft text-saffron' : 'bg-sand text-brand-600'
                }`}
              >
                <Layers size={20} />
              </div>
              <div className="min-w-0 pe-2">
                <span className="block truncate font-heading text-xs font-bold sm:text-sm">همه محصولات</span>
                <span className={`text-[11px] ${!categoryId ? 'text-saffron' : 'text-muted'}`}>
                  {formatNumber(totalProductsCount)} کالا
                </span>
              </div>
            </button>

            {/* Individual Category Tiles */}
            {categories.slice(0, 4).map((c, idx) => {
              const id = c._id || c.id;
              const active = categoryId === id;
              const tone = CATEGORY_TONE_PATS[idx % CATEGORY_TONE_PATS.length];
              const imgUrl =
                idx === 0
                  ? CATEGORY_IMAGES.living
                  : idx === 1
                    ? CATEGORY_IMAGES.lighting
                    : idx === 2
                      ? CATEGORY_IMAGES.textile
                      : CATEGORY_IMAGES.decor;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    updateParams((next) => {
                      if (active) next.delete('category');
                      else next.set('category', id);
                    })
                  }
                  className={`flex w-44 sm:w-52 shrink-0 items-center gap-3 rounded-2xl p-2.5 text-start transition-[transform,background-color,border-color,box-shadow] duration-200 active:scale-98 ${
                    active
                      ? 'bg-espresso text-cream shadow-md border border-espresso'
                      : 'bg-card text-ink shadow-sm border border-line hover:border-brand-400 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl p-0.5 ${active ? 'bg-espresso-soft' : tone}`}>
                    <img src={imgUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                  </div>
                  <div className="min-w-0 pe-2">
                    <span className="block truncate font-heading text-xs font-bold sm:text-sm">{c.title}</span>
                    <span className={`text-[11px] ${active ? 'text-saffron' : 'text-muted'}`}>
                      {c.count != null ? `${formatNumber(c.count)} کالا` : 'مشاهده مجموعه'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Sticky Translucent Toolbar */}
      <div className="sticky top-0 z-30 mt-8 border-y border-line/70 bg-paper/85 backdrop-blur-xl">
        <div className="container-max flex flex-wrap items-center justify-between gap-3.5 py-3">
          {/* Search Input & Mobile Drawer Trigger */}
          <div className="flex w-full flex-1 items-center gap-2.5 sm:max-w-xs md:max-w-sm">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                updateParams((next) => {
                  if (searchInput.trim()) next.set('q', searchInput.trim());
                  else next.delete('q');
                });
              }}
              className="relative flex-1"
            >
              <Search
                size={14}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جست‌وجو در نام و مشخصات کالا…"
                aria-label="جست‌وجوی محصولات"
                className="w-full rounded-full border border-line bg-card py-2 pe-8 ps-9 text-xs text-ink placeholder:text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams((next) => next.delete('q'));
                  }}
                  aria-label="پاک کردن جست‌وجو"
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              aria-expanded={mobileFiltersOpen}
              className="btn-outline flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs lg:hidden"
            >
              <SlidersHorizontal size={13} />
              <span>فیلترها</span>
              {activeFilterCount > 0 && (
                <span className="font-display text-[11px] font-semibold text-brand-700">
                  ({formatNumber(activeFilterCount)})
                </span>
              )}
            </button>
          </div>

          {/* Tactile Segmented Sort Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 sm:py-0">
            <div className="flex items-center gap-1.5 text-xs text-muted shrink-0 select-none">
              <ArrowUpDown size={13} className="text-brand-600" aria-hidden="true" />
              <span className="max-sm:hidden">مرتب‌سازی:</span>
            </div>

            <div
              role="radiogroup"
              aria-label="مرتب‌سازی محصولات"
              className="inline-flex items-center rounded-full border border-line bg-sand/60 p-1 shrink-0 shadow-sm"
            >
              {SORTS.map((s) => {
                const active = sort === s.value;
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => updateParams((next) => next.set('sort', s.value))}
                    className={`group relative flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-98 ${
                      active
                        ? 'bg-espresso text-cream shadow-sm'
                        : 'text-muted hover:text-ink hover:bg-sand/80'
                    }`}
                  >
                    <Icon
                      size={12}
                      className={active ? 'text-saffron' : 'text-muted group-hover:text-ink'}
                      aria-hidden="true"
                    />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="container-max pt-6">
        {/* 4. Active Filter Chips Row */}
        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted me-1">فیلترهای فعال:</span>

            {q && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-900">
                <span>جست‌وجو: «{q}»</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams((next) => next.delete('q'));
                  }}
                  aria-label="حذف فیلتر جست‌وجو"
                  className="text-brand-700 hover:text-brand-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-900">
                <span>دسته‌بندی: {activeCategory.title}</span>
                <button
                  type="button"
                  onClick={() => updateParams((next) => next.delete('category'))}
                  aria-label="حذف فیلتر دسته‌بندی"
                  className="text-brand-700 hover:text-brand-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {isSortModified && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-900">
                <span>مرتب‌سازی: {SORTS.find((s) => s.value === sort)?.label || sort}</span>
                <button
                  type="button"
                  onClick={() => updateParams((next) => next.delete('sort'))}
                  aria-label="بازنشانی مرتب‌سازی"
                  className="text-brand-700 hover:text-brand-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {inStock && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-900">
                <span>فقط کالاهای موجود</span>
                <button
                  type="button"
                  onClick={() => updateParams((next) => next.delete('inStock'))}
                  aria-label="حذف فیلتر موجودی"
                  className="text-brand-700 hover:text-brand-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {activeAttrKeys.map((attrKey) => {
              const rawVal = attributes[attrKey];
              const vals = Array.isArray(rawVal) ? rawVal : [rawVal];
              const localizedLabel = attributeLabel(attrKey);

              return vals.map((val) => (
                <span
                  key={`${attrKey}-${val}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs text-brand-900"
                >
                  <span>
                    {localizedLabel}: {val}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateParams((next) => {
                        const paramName = `attr.${attrKey}`;
                        const current = next.get(paramName);
                        if (!current) return;
                        const parts = current.split(',').filter((item) => item !== val);
                        if (parts.length > 0) next.set(paramName, parts.join(','));
                        else next.delete(paramName);
                      })
                    }
                    aria-label={`حذف فیلتر ${localizedLabel} ${val}`}
                    className="text-brand-700 hover:text-brand-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ));
            })}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-brand-700 transition-colors hover:text-brand-800 underline underline-offset-4 ms-2"
            >
              <RotateCcw size={12} />
              <span>پاک کردن همه</span>
            </button>
          </div>
        )}

        {/* 5. Main Catalog Layout: Layered Sand Sidebar + Products Grid */}
        <div id="catalog-results" className="grid gap-8 lg:grid-cols-[260px_1fr] items-start">
          {/* Desktop Layered Sand Filter Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Main Sand Filter Container */}
              <div className="rounded-3xl bg-sand/75 p-6 border border-line/70 shadow-sm space-y-5">
                {/* 1. In-Stock Elevated Switch Card */}
                <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 shadow-sm border border-line/60">
                  <span className="text-sm font-bold text-ink">فقط کالاهای موجود</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inStock}
                    onClick={() =>
                      updateParams((next) => {
                        if (!inStock) next.set('inStock', 'true');
                        else next.delete('inStock');
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      inStock ? 'bg-brand-600' : 'bg-sand-deep'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-card shadow-sm transition-all duration-200 ease-in-out ${
                        inStock ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="rule-dots" />

                {/* 2. Real Store Categories */}
                <div>
                  <h4 className="mb-3 font-heading text-sm font-bold text-ink">
                    دسته‌بندی‌ها
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateParams((next) => next.delete('category'))}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                        !categoryId
                          ? 'bg-espresso text-cream shadow-sm font-bold'
                          : 'bg-card text-ink shadow-xs border border-line/60 hover:bg-cream hover:border-brand-400/50'
                      }`}
                    >
                      <span>همه محصولات</span>
                      <span className="ms-1.5 text-[11px] opacity-70">
                        ({formatNumber(totalProductsCount)})
                      </span>
                    </button>
                    {categories
                      .filter((c) => Boolean(c && (c.title || c.name)))
                      .map((c) => {
                        const id = c._id || c.id;
                        const active = categoryId === id;
                        const title = c.title || c.name;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              updateParams((next) => {
                                if (active) next.delete('category');
                                else next.set('category', id);
                              })
                            }
                            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                              active
                                ? 'bg-espresso text-cream shadow-sm font-bold'
                                : 'bg-card text-ink shadow-xs border border-line/60 hover:bg-cream hover:border-brand-400/50'
                            }`}
                          >
                            <span>{title}</span>
                            {c.count != null && (
                              <span className="ms-1.5 text-[11px] opacity-70">
                                ({formatNumber(c.count)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* 3. Real Server Attributes / Facets */}
                {facets.map((facet) => {
                  const isColor = facet.key === 'color' || facet.key === 'رنگ';
                  const localizedHeading = attributeLabel(facet.key);
                  const activeVals = attributes[facet.key]
                    ? Array.isArray(attributes[facet.key])
                      ? attributes[facet.key]
                      : [attributes[facet.key]]
                    : [];

                  return (
                    <div key={facet.key}>
                      <div className="rule-dots mb-4" />
                      <h4 className="mb-3 font-heading text-sm font-bold text-ink">
                        {localizedHeading}
                      </h4>

                      {isColor ? (
                        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                          {facet.values.map(({ value, count }) => {
                            const active = activeVals.includes(value);
                            const swatch = COLOR_SWATCH_MAP[value] || { bg: 'bg-[#b8a898]', textLight: true };
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleToggleAttribute(facet.key, value)}
                                className="group flex flex-col items-center gap-1.5 cursor-pointer"
                              >
                                <span
                                  className={`grid size-10 place-items-center rounded-full ring-1 ring-espresso/15 transition-all duration-200 group-hover:scale-105 active:scale-95 ${swatch.bg} ${
                                    active ? 'ring-2 ring-espresso ring-offset-2 ring-offset-sand scale-105 shadow-sm' : ''
                                  }`}
                                >
                                  {active && (
                                    <Check
                                      size={16}
                                      strokeWidth={2.5}
                                      className={swatch.textLight ? 'text-cream' : 'text-espresso'}
                                    />
                                  )}
                                </span>
                                <span
                                  className={`text-xs transition-colors duration-150 ${
                                    active ? 'font-bold text-ink' : 'text-muted group-hover:text-ink'
                                  }`}
                                >
                                  {value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {facet.values.map(({ value, count }) => {
                            const active = activeVals.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleToggleAttribute(facet.key, value)}
                                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer ${
                                  active
                                    ? 'bg-espresso text-cream shadow-sm font-bold'
                                    : 'bg-card text-ink shadow-xs border border-line/60 hover:bg-cream hover:border-brand-400/50'
                                }`}
                              >
                                <span>{value}</span>
                                <span className="ms-1.5 text-[11px] opacity-70">
                                  ({formatNumber(count)})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {hasFilters && (
                  <div className="mt-5 pt-4 border-t border-line/80">
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center gap-1.5 text-xs text-brand-700 transition-colors hover:text-brand-900 font-bold underline underline-offset-4"
                    >
                      <RotateCcw size={12} />
                      <span>حذف همه فیلترها</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Consultation / Design Advice Banner */}
              <div className="bg-copper-gradient relative overflow-hidden rounded-3xl p-6 text-cream shadow-md">
                <div className="pointer-events-none absolute -bottom-10 -left-10 size-36 rounded-full bg-saffron/30 blur-2xl" />
                <MessageCircleHeart size={28} className="text-saffron" />
                <h4 className="mt-4 font-heading text-base font-black leading-7 text-cream">
                  نمی‌دانید چه سبکی به فضای خانه‌تان می‌آید؟
                </h4>
                <p className="mt-2 text-xs leading-6 text-cream/80">
                  مشاوره‌ی رایگان چیدمان با طراحان ژرکا؛ هماهنگ با ابعاد و پالت نور خانه شما.
                </p>
                <Link
                  to={ROUTES.shop}
                  className="mt-5 inline-block rounded-full bg-cream px-5 py-2 text-xs font-black text-brand-900 shadow-sm transition-transform active:scale-95 hover:scale-105"
                >
                  شروع گفت‌وگو
                </Link>
              </div>
            </div>
          </aside>

          {/* Product Grid & Editorial Interstitials */}
          <main className="min-w-0">
            {isLoading && !products.length ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex flex-col animate-pulse">
                    <div className="aspect-4/5 w-full rounded-xl bg-sand/70 border border-line" />
                    <div className="mt-3.5 space-y-2">
                      <div className="h-4 w-4/5 rounded bg-line/60" />
                      <div className="h-3 w-1/3 rounded bg-line/45" />
                      <div className="h-4 w-2/5 rounded bg-line/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error && !products.length ? (
              <div className="rounded-2xl border border-line bg-card p-10 text-center shadow-sm">
                <p className="font-heading text-base font-medium text-ink">خطا در بارگذاری محصولات</p>
                <p className="mt-2 text-xs text-muted max-w-sm mx-auto leading-6">
                  {typeof error === 'string' ? error : error?.message || 'ارتباط با سرور برقرار نشد.'}
                </p>
                <button type="button" onClick={() => refetch()} className="btn-outline mt-6 px-6 py-2 text-xs">
                  تلاش مجدد
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-card p-12 text-center shadow-sm">
                <p className="font-heading text-lg font-bold text-ink">کالایی با این مشخصات یافت نشد</p>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted">
                  می‌توانید فیلترها را حذف کنید یا عبارت جست‌وجوی دیگری وارد نمایید.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="btn-primary mt-6 rounded-full px-6 py-2.5 text-xs"
                  >
                    پاک کردن فیلترها و مشاهده همه
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <Fragment key={product._id || product.id || i}>
                    {/* Editorial Break Banner after 6 products (Page 1) */}
                    {i === 6 && page === 1 && (
                      <div className="bg-espresso-band col-span-full my-3 overflow-hidden rounded-2xl p-6 sm:p-8 text-cream shadow-lg border border-espresso/40">
                        <div className="grid items-center gap-6 md:grid-cols-2">
                          <div>
                            <span className="text-xs font-semibold text-saffron uppercase tracking-wider">
                              مجموعه‌ی دست‌ساز
                            </span>
                            <h3 className="mt-2 font-heading text-2xl sm:text-3xl font-bold leading-tight text-cream">
                              گرمای خانه، <br />
                              از دل <span className="text-clay">خاک و چوب</span>
                            </h3>
                            <p className="mt-3 text-xs sm:text-sm leading-6 text-cream/75 max-w-md">
                              اشیاء بافت‌دار و متریال‌های طبیعی که با تغییر فصل و زاویه تابش نور، جلوه‌ای
                              گرم‌تر به نشیمن شما می‌بخشند.
                            </p>
                            <Link
                              to={ROUTES.shop}
                              className="mt-6 inline-flex items-center gap-2 rounded-full bg-saffron px-5 py-2.5 text-xs font-bold text-espresso shadow-md transition-transform active:scale-95"
                            >
                              <span>دیدن منتخبان فصل</span>
                              <ArrowLeft size={14} />
                            </Link>
                          </div>
                          <div className="relative aspect-16/9 md:aspect-5/3 w-full overflow-hidden rounded-xl border border-cream/15 shadow-md">
                            <img
                              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1000&q=80&auto=format&fit=crop"
                              alt="نشیمن پاییزی ژرکا"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Design Tip Card after 10 products */}
                    {i === 10 && page === 1 && (
                      <div className="col-span-full sm:col-span-2 xl:col-span-2 rounded-2xl bg-saffron-mist p-6 border border-saffron/30 flex flex-col justify-between shadow-sm my-2">
                        <div>
                          <Quote size={28} className="fill-saffron text-saffron" />
                          <p className="mt-2 text-xs font-bold text-brand-900">نکته‌ی چیدمان ژرکا</p>
                          <p className="mt-3 font-heading text-base sm:text-lg font-bold text-espresso leading-7">
                            «قانون سه‌تایی در دکوراسیون: یک بافت طبیعی (چوب یا کتان)، یک متریال دست‌ساز (سفال)
                            و یک فلز با انعکاس گرم مثل برنج یا مس.»
                          </p>
                        </div>
                        <div className="mt-6 flex items-center gap-3 border-t border-saffron/20 pt-4">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&auto=format&fit=crop"
                            alt="نگار صادقی"
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-saffron"
                          />
                          <div>
                            <p className="text-xs font-bold text-ink">نگار صادقی</p>
                            <p className="text-[11px] text-muted">طراح داخلی و مشاور دکوراسیون ژرکا</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <ProductCard product={product} index={i} priority={i < 4} />
                  </Fragment>
                ))}
              </div>
            )}

            {/* 6. Catalog Progress Bar & Pagination */}
            {totalProductsCount > 0 && (
              <div className="mt-14 space-y-6 text-center">
                <div className="mx-auto max-w-xs space-y-2">
                  <p className="text-xs text-muted">
                    نمایش <strong className="text-ink font-display">{formatNumber(displayedCount)}</strong> از{' '}
                    <strong className="text-ink font-display">{formatNumber(totalProductsCount)}</strong> کالا
                  </p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-deep">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, (displayedCount / totalProductsCount) * 100)}%` }}
                    />
                  </div>
                </div>

                <Pagination
                  page={page}
                  total={totalProductsCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                  className="border-t border-line pt-6"
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 7. Mobile Filter Bottom Sheet / Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-50 bg-espresso/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="فیلترهای کاتالوگ"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-line bg-card shadow-2xl overscroll-contain lg:hidden"
            >
              <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-sand-deep select-none" aria-hidden="true" />

              <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-base font-bold text-ink">فیلترها و مرتب‌سازی</h2>
                  {activeFilterCount > 0 && (
                    <span className="font-display text-xs font-semibold text-brand-700">
                      ({formatNumber(activeFilterCount)})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="بستن پنجره فیلترها"
                  className="rounded-full p-1.5 text-muted hover:bg-sand hover:text-ink"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Mobile Sort */}
                <div className="border-b border-line pb-5">
                  <h3 className="mb-3 font-heading text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpDown size={13} className="text-brand-600" aria-hidden="true" />
                    <span>مرتب‌سازی</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SORTS.map((s) => {
                      const active = sort === s.value;
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => updateParams((next) => next.set('sort', s.value))}
                          className={`w-full text-start py-2.5 px-3.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            active
                              ? 'font-bold text-brand-800 bg-sand/80 border border-brand-600/30'
                              : 'text-muted hover:bg-sand/40 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={13} className={active ? 'text-brand-600' : 'text-muted'} />
                            <span>{s.label}</span>
                          </div>
                          {active && <Check size={14} className="text-brand-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Availability */}
                <div className="border-b border-line pb-5">
                  <div className="flex items-center justify-between rounded-xl bg-sand/40 p-3">
                    <span className="text-xs font-bold text-ink">فقط کالاهای موجود</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStock}
                      onClick={() =>
                        updateParams((next) => {
                          if (!inStock) next.set('inStock', 'true');
                          else next.delete('inStock');
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                        inStock ? 'bg-brand-600' : 'bg-sand-deep'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-card shadow-sm transition-all duration-200 ${
                          inStock ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="border-b border-line pb-5">
                  <h3 className="mb-3 font-heading text-xs font-bold text-ink uppercase tracking-wider">
                    دسته‌بندی
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateParams((next) => next.delete('category'))}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                        !categoryId
                          ? 'bg-espresso text-cream font-bold'
                          : 'bg-sand text-ink hover:bg-sand-deep'
                      }`}
                    >
                      همه
                    </button>
                    {categories
                      .filter((c) => Boolean(c && (c.title || c.name)))
                      .map((c) => {
                        const id = c._id || c.id;
                        const active = categoryId === id;
                        const title = c.title || c.name;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              updateParams((next) => {
                                if (active) next.delete('category');
                                else next.set('category', id);
                              })
                            }
                            className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                              active
                                ? 'bg-espresso text-cream font-bold'
                                : 'bg-sand text-ink hover:bg-sand-deep'
                            }`}
                          >
                            <span>{title}</span>
                            {c.count != null && (
                              <span className="ms-1 text-[11px] opacity-70">
                                ({formatNumber(c.count)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Mobile Dynamic Facets */}
                {facets.map((facet) => {
                  const isColor = facet.key === 'color' || facet.key === 'رنگ';
                  const localizedHeading = attributeLabel(facet.key);
                  const activeVals = attributes[facet.key]
                    ? Array.isArray(attributes[facet.key])
                      ? attributes[facet.key]
                      : [attributes[facet.key]]
                    : [];

                  return (
                    <div key={facet.key} className="border-b border-line pb-5">
                      <h3 className="mb-3 font-heading text-xs font-bold text-ink uppercase tracking-wider">
                        {localizedHeading}
                      </h3>
                      {isColor ? (
                        <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                          {facet.values.map(({ value, count }) => {
                            const active = activeVals.includes(value);
                            const swatch = COLOR_SWATCH_MAP[value] || { bg: 'bg-[#b8a898]', textLight: true };
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleToggleAttribute(facet.key, value)}
                                className="flex flex-col items-center gap-1.5"
                              >
                                <span
                                  className={`grid size-9 place-items-center rounded-full ring-1 ring-espresso/15 transition-all ${swatch.bg} ${
                                    active ? 'ring-2 ring-espresso ring-offset-2 ring-offset-sand scale-105 shadow-sm' : ''
                                  }`}
                                >
                                  {active && (
                                    <Check
                                      size={14}
                                      strokeWidth={2.5}
                                      className={swatch.textLight ? 'text-cream' : 'text-espresso'}
                                    />
                                  )}
                                </span>
                                <span
                                  className={`text-xs ${
                                    active ? 'font-bold text-ink' : 'text-muted'
                                  }`}
                                >
                                  {value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {facet.values.map(({ value, count }) => {
                            const active = activeVals.includes(value);
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleToggleAttribute(facet.key, value)}
                                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                                  active
                                    ? 'bg-espresso text-cream font-bold shadow-sm'
                                    : 'border border-line bg-card text-ink shadow-xs hover:bg-cream'
                                }`}
                              >
                                <span>{value}</span>
                                <span className="ms-1.5 text-[11px] opacity-70">
                                  ({formatNumber(count)})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <footer className="flex items-center gap-3 border-t border-line px-5 py-4 bg-card">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="btn-outline px-4 py-2.5 text-xs rounded-full"
                  >
                    حذف فیلترها
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="btn-primary flex-1 py-2.5 text-xs rounded-full"
                >
                  مشاهده نتایج {total != null ? `(${formatNumber(total)} کالا)` : ''}
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
