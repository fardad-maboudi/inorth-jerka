/**
 * Static editorial content for the JERKA storefront home page.
 * Single source of truth for home marketing copy, editorial imagery, and curated blocks.
 *
 * Rules:
 * - Persian headings and text use proper Persian punctuation and zero-width non-joiners (نیم‌فاصله).
 * - Eyebrows with Latin letters stay capitalized and tracked; Persian stays untracked.
 * - Image URLs are CDN-hosted, high-resolution and optimized.
 */

export const homeContent = {
  announcement: {
    text: 'ارسال رایگان برای سفارش‌های بالای پنج میلیون تومان · ضمانت اصالت و سلامت کالا',
  },

  hero: {
    eyebrow: 'NEW SEASON — ۱۴۰۵',
    title: 'زیبایی،\nدر جزئیات است.',
    description:
      'ژرکا مجموعه‌ای دست‌چین از طراحی، کیفیت و اصالت است — برای کسانی که می‌دانند چیزهای خوب هرگز تصادفی انتخاب نمی‌شوند.',
    primaryCta: {
      label: 'مشاهده فروشگاه',
      to: '/shop',
    },
    secondaryCta: {
      label: 'داستان ژرکا',
      to: '#story',
    },
    watermark: 'JERKA',
    est: 'EST. ۱۴۰۴',
    location: 'تهران · تهران',
    images: {
      main: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80&auto=format&fit=crop',
      secondary: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700&q=80&auto=format&fit=crop',
    },
  },

  trustRow: [
    {
      id: 'authenticity',
      icon: 'ShieldCheck',
      label: 'ضمانت اصالت کالا',
      subline: 'تضمین اصالت تمامی دست‌سازه‌ها',
    },
    {
      id: 'payment',
      icon: 'Lock',
      label: 'پرداخت امن و سریع',
      subline: 'درگاه‌های معتبر و رمزنگاری‌شده',
    },
    {
      id: 'shipping',
      icon: 'Truck',
      label: 'ارسال ایمن به سراسر کشور',
      subline: 'بسته‌بندی اختصاصی و مطمئن',
    },
    {
      id: 'return',
      icon: 'RotateCcw',
      label: '۷ روز ضمانت بازگشت',
      subline: 'پشتیبانی بی‌قیدوشرط بازگشت',
    },
  ],

  categories: {
    eyebrow: 'COLLECTIONS',
    title: 'دسته‌بندی‌های برگزیده',
    subtitle: 'کاوش در میان مجموعه‌های اصیل و دست‌چین ژرکا',
    viewAllLabel: 'همه مجموعه‌ها',
    fallbacks: [
      {
        id: 'apparel',
        title: 'پوشاک و الیاف طبیعی',
        latin: 'Apparel',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
      {
        id: 'living',
        title: 'خانه و چیدمان',
        latin: 'Living',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
      {
        id: 'accessories',
        title: 'اکسسوری و زیورآلات',
        latin: 'Accessories',
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
      {
        id: 'leather',
        title: 'چرم و دست‌دوز',
        latin: 'Leatherwork',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
      {
        id: 'scents',
        title: 'روایح و عطریات',
        latin: 'Fragrance',
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
      {
        id: 'ceramics',
        title: 'سفال و سرامیک',
        latin: 'Ceramics',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80&auto=format&fit=crop',
        icon: 'Sparkles',
      },
    ],
  },

  giftEdit: {
    eyebrow: 'GIFT EDIT',
    title: 'پیشنهادهای هدیه',
    subtitle: 'انتخابی سنجیده با بسته‌بندی امضادار برای خاطره‌هایی ماندگار',
    items: [
      {
        id: 'g1',
        title: 'ست چرم دست‌دوز',
        descriptor: 'کیف مدارک و جاکارتی نفیس',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop',
        link: '/shop',
      },
      {
        id: 'g2',
        title: 'شمع معطر موم طبیعی',
        descriptor: 'رایحه وانیل دودی و چوب صندل',
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80&auto=format&fit=crop',
        link: '/shop',
      },
      {
        id: 'g3',
        title: 'فنجان سرامیکی دست‌ساز',
        descriptor: 'طراحی ارگونومیک با لعاب مات خاکی',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80&auto=format&fit=crop',
        link: '/shop',
      },
      {
        id: 'g4',
        title: 'شال الیاف طبیعی',
        descriptor: 'تنفس‌پذیر با رنگرزی گیاهی',
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80&auto=format&fit=crop',
        link: '/shop',
      },
    ],
  },

  pairings: {
    eyebrow: 'STYLE PAIRINGS',
    title: 'ست‌های هماهنگ',
    subtitle: 'همنشینی هارمونیک اشیا و بافت‌ها در زندگی روزمره',
    items: [
      {
        id: 'p1',
        title: 'آرامش صبحگاهی با سرامیک و روایح چوبی',
        descriptor:
          'ترکیبی از ماگ‌های سرامیکی استودیویی و شمع‌های دست‌ساز آروماتیک که شروع روز شما را به مراسمی آرام و دلپذیر تبدیل می‌کنند.',
        cta: 'مشاهده ست صبحگاهی',
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=900&q=80&auto=format&fit=crop',
        link: '/shop',
      },
      {
        id: 'p2',
        title: 'میز کار مینیمال با چرم طبیعی و مس',
        descriptor:
          'وسایل رومیزی طراحی‌شده با خطوط خالص، چرم طبیعی گرم و جزئیات دست‌ساز برای تمرکز عمیق و زیبایی محیط کار.',
        cta: 'مشاهده چیدمان میز',
        image: 'https://images.unsplash.com/photo-1758640920659-0bb864175983?fm=jpg&q=60&w=900&auto=format&fit=crop',
        link: '/shop',
      },
    ],
  },

  trending: {
    eyebrow: 'TRENDING NOW',
    title: 'محبوب‌ترین‌های ژرکا',
    subtitle: 'آثاری که توجه و علاقه بیشتری را به خود جلب کرده‌اند',
    viewAllLabel: 'مشاهده همه',
  },

  brandStory: {
    eyebrow: 'OUR PHILOSOPHY',
    quote: '«تجربه‌ای منحصربه‌فرد از یک خرید خاص»',
    description:
      'از انتخاب دقیق هنرمندان و تولیدکنندگان تا آخرین گره بر بسته‌بندی سفارش، هر تصمیم با یک پرسش سنجیده می‌شود: آیا همین را با افتخار در خانه خود جای می‌دادیم؟ کیفیت برای ما یک ادعا نیست، روال هر روزه است.',
    points: [
      {
        icon: 'Sparkles',
        title: 'اصالت متریال',
        text: 'استفاده از خالص‌ترین چرم، سرامیک دست‌ساز و الیاف طبیعی',
      },
      {
        icon: 'Compass',
        title: 'طراحی بی‌زمان',
        text: 'آثاری که وابسته به مدهای گذرا نیستند و با گذر سال‌ها زیباتر می‌شوند',
      },
      {
        icon: 'HeartHandshake',
        title: 'احترام به دسترنج',
        text: 'حمایت مستقیم از کارگاه‌های محلی و تولید اصیل و اخلاقی',
      },
    ],
    cta: {
      label: 'مشاهده محصولات فروشگاه',
      to: '/shop',
    },
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1400&q=80&auto=format&fit=crop',
  },

  newArrivals: {
    eyebrow: 'JUST ARRIVED',
    title: 'تازه‌ترین رسیده‌ها',
    subtitle: 'جدیدترین دست‌سازه‌ها و قطعات افزوده‌شده به گالری ژرکا',
    viewAllLabel: 'مشاهده همه',
  },

  seasonBanner: {
    eyebrow: 'NEW SEASON — ۱۴۰۵',
    title: 'فصل نو، نگاه نو',
    subtitle: 'کالکشن فصلی ژرکا با تمرکز بر بافت‌های ارگانیک، خطوط آزاد و رنگ‌های خاکی و گرم.',
    cta: {
      label: 'کشف کالکشن جدید',
      to: '/shop',
    },
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?fm=jpg&q=60&w=3000&auto=format&fit=crop',
  },

  testimonials: {
    eyebrow: 'CLIENT VOICES',
    title: 'روایت همراهان ژرکا',
    subtitle: 'دیدگاه کسانی که به ژرکا اعتماد کرده‌اند',
    items: [
      {
        id: 't1',
        quote:
          'کیفیت بسته‌بندی و ظرافت دوخت فراتر از انتظارم بود. پیدا کردن چنین وسواس و اصالتی در خرید آنلاین کم‌نظیر است.',
        author: 'سارا رادمهر',
        city: 'تهران',
        verified: true,
      },
      {
        id: 't2',
        quote:
          'خرید از ژرکا درست مانند قدم زدن در یک بوتیک دنج با نور ملایم است؛ دقیق، بی‌هیاهو و سرشار از سلیقه.',
        author: 'علیرضا شمس',
        city: 'اصفهان',
        verified: true,
      },
      {
        id: 't3',
        quote:
          'ظروف سرامیکی که سفارش دادم الان نقطه کانونی میز پذیرایی من هستند. از پشتیبانی و پیگیری عالی‌تان سپاسگزارم.',
        author: 'نیلوفر پارسا',
        city: 'شیراز',
        verified: true,
      },
    ],
  },

  newsletter: {
    eyebrow: 'NEWSLETTER',
    title: 'اول از همه باخبر شوید',
    description:
      'رونمایی از مجموعه‌های تازه، یادداشت‌های طراحی و پیشنهادهای ویژه — ماهی یک ایمیل، بدون هیاهو.',
    placeholder: 'نشانی ایمیل شما',
    buttonText: 'عضویت',
    successMessage: 'سپاس! ایمیل شما با موفقیت ثبت شد.',
  },
};

export default homeContent;
