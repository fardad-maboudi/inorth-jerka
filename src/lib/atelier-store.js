import { useSyncExternalStore } from 'react';
import {
  normalizeIranianMobile,
  formatIranianMobile,
  toLatinDigits,
} from '@/api/auth';
import { APP_ID } from '@/api/joorchin';
import { PRODUCT_MEDIA_FALLBACKS } from '@/lib/product-media';
import { homeContent } from '@/pages/home.content';

const STORAGE_KEY = `jerka_atelier_v1:${APP_ID || 'default'}`;
const USER_TOKEN_KEY = `joorchin_user_token:${APP_ID || ''}`;

export const IRAN_PROVINCES_FALLBACK = [
  {
    fa: 'تهران',
    cities: ['تهران', 'شمیرانات', 'لواسان', 'کرج', 'شهریار', 'دماوند', 'اسلامشهر', 'پردیس'],
  },
  {
    fa: 'اصفهان',
    cities: ['اصفهان', 'کاشان', 'نجف‌آباد', 'شاهین‌شهر', 'خمینی‌شهر', 'نطنز', 'خوانسار'],
  },
  {
    fa: 'فارس',
    cities: ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار', 'آباده'],
  },
  {
    fa: 'خراسان رضوی',
    cities: ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'طرقبه', 'قوچان'],
  },
  {
    fa: 'آذربایجان شرقی',
    cities: ['تبریز', 'مراغه', 'مرند', 'اهر', 'میانه', 'بناب', 'شبستر'],
  },
  {
    fa: 'مازندران',
    cities: ['ساری', 'بابل', 'آمل', 'نوشهر', 'چالوس', 'رامسر', 'بابلسر', 'تنکابن'],
  },
  {
    fa: 'گیلان',
    cities: ['رشت', 'بندر انزلی', 'لاهیجان', 'لنگرود', 'فومن', 'تالش', 'آستارا'],
  },
  {
    fa: 'البرز',
    cities: ['کرج', 'مهرشهر', 'فردیس', 'کردان', 'هشتگرد', 'طالقان'],
  },
  {
    fa: 'یزد',
    cities: ['یزد', 'میبد', 'اردکان', 'مهریز', 'تفت'],
  },
  {
    fa: 'کرمان',
    cities: ['کرمان', 'رفسنجان', 'سیرجان', 'بم', 'جیرفت', 'ماهان'],
  },
  {
    fa: 'خوزستان',
    cities: ['اهواز', 'آبادان', 'دزفول', 'خرمشهر', 'بهبهان', 'ماهشهر'],
  },
  {
    fa: 'کرمانشاه',
    cities: ['کرمانشاه', 'اسلام‌آباد غرب', 'پاوه', 'کنگاور', 'سنقر'],
  },
];

export const STUDIO_MEDIA_PRESETS = [
  {
    id: 'vase',
    label: 'گلدان سرامیکی',
    url: PRODUCT_MEDIA_FALLBACKS['small-vase'].image,
  },
  {
    id: 'lamp',
    label: 'آباژور رومیزی',
    url: PRODUCT_MEDIA_FALLBACKS['desk-lamp'].image,
  },
  {
    id: 'mirror',
    label: 'آینه دکوراتیو',
    url: PRODUCT_MEDIA_FALLBACKS['table-mirror'].image,
  },
  {
    id: 'linen',
    label: 'منسوجات کتان',
    url: PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'].image,
  },
  {
    id: 'candle',
    label: 'شمع دست‌ساز',
    url: PRODUCT_MEDIA_FALLBACKS['scented-candle'].image,
  },
  {
    id: 'basket',
    label: 'سبد حصیری',
    url: PRODUCT_MEDIA_FALLBACKS['wicker-basket'].image,
  },
];

const INITIAL_USERS = [
  {
    id: 'usr_sara',
    role: 'customer',
    name: 'سارا رادمهر',
    email: 'sara@jerka.ir',
    phone: '+989123456789',
    password: 'jerka1405',
    tier: 'طلایی',
    points: 1850,
    walletBalance: 650000,
    nationalCode: '۰۰۱۸۴۹۲۷۳۱',
    city: 'تهران',
    iban: 'IR620560084180001928374651',
    bio: 'معمار داخلی و علاقه‌مند به سرامیک‌های دست‌ساز و بافت‌های طبیعی',
    joinedAt: 'آبان ۱۴۰۴',
    newsletter: true,
    smsAlerts: true,
    vipOffers: true,
    rewardCode: 'SARA-JRK10',
    adminNote: 'مشتری وفادار؛ بسته‌بندی هدیه امضادار روی سفارش‌ها لحاظ شود.',
  },
  {
    id: 'usr_admin',
    role: 'admin',
    name: 'فرهاد ستوده',
    email: 'admin@jerka.ir',
    phone: '+989120000000',
    password: 'admin1405',
    tier: 'مدیر ارشد',
    points: 4200,
    walletBalance: 0,
    nationalCode: '۰۰۶۲۹۱۸۴۵۳',
    city: 'تهران',
    iban: 'IR440120020000008899112233',
    bio: 'مدیر هنری و سرپرست کارگاه مرکزی ژرکا',
    joinedAt: 'فروردین ۱۴۰۴',
    newsletter: true,
    smsAlerts: true,
    vipOffers: true,
    rewardCode: 'ATELIER-VIP',
    adminNote: 'حساب مدیریتی کارگاه و ویترین آنلاین ژرکا',
  },
  {
    id: 'usr_kaveh',
    role: 'customer',
    name: 'کاوه نیک‌پور',
    email: 'kaveh.nik@example.ir',
    phone: '+989128814420',
    password: 'jerka1405',
    tier: 'مسی',
    points: 940,
    walletBalance: 150000,
    nationalCode: '۱۲۸۹۴۳۲۱۱۰',
    city: 'اصفهان',
    iban: '',
    bio: '',
    joinedAt: 'دی ۱۴۰۴',
    newsletter: true,
    smsAlerts: true,
    vipOffers: false,
    rewardCode: 'KAVEH-JRK',
    adminNote: 'خرید مستمر از دسته روشنایی و چوب',
  },
  {
    id: 'usr_parisa',
    role: 'customer',
    name: 'پریسا بهرامی',
    email: 'parisa.b@example.ir',
    phone: '+989354119022',
    password: 'jerka1405',
    tier: 'طلایی',
    points: 2310,
    walletBalance: 420000,
    nationalCode: '۲۲۹۷۱۸۴۳۰۲',
    city: 'شیراز',
    iban: '',
    bio: '',
    joinedAt: 'شهریور ۱۴۰۴',
    newsletter: true,
    smsAlerts: true,
    vipOffers: true,
    rewardCode: 'PARISA-JRK',
    adminNote: 'سفارش عمده برای استودیو معماری شیراز',
  },
  {
    id: 'usr_arman',
    role: 'customer',
    name: 'آرمان شمس',
    email: 'arman.shams@example.ir',
    phone: '+989153207741',
    password: 'jerka1405',
    tier: 'نقره‌ای',
    points: 520,
    walletBalance: 0,
    nationalCode: '۰۹۳۴۵۱۲۸۷۶',
    city: 'مشهد',
    iban: '',
    bio: '',
    joinedAt: 'مهر ۱۴۰۵',
    newsletter: false,
    smsAlerts: true,
    vipOffers: true,
    rewardCode: 'ARMAN-JRK',
    adminNote: '',
  },
];

const INITIAL_ADDRESSES = [
  {
    id: 'addr_1',
    userId: 'usr_sara',
    label: 'منزل — الهیه',
    name: 'سارا رادمهر',
    phone: '+989123456789',
    province: 'تهران',
    city: 'تهران',
    line1: 'خیابان فرشته، خیابان بیدار، پلاک ۲۴، طبقه ۴، واحد ۱۲',
    postalCode: '1964938174',
    isDefault: true,
  },
  {
    id: 'addr_2',
    userId: 'usr_sara',
    label: 'استودیو معماری',
    name: 'سارا رادمهر',
    phone: '+989123456789',
    province: 'تهران',
    city: 'تهران',
    line1: 'میدان ونک، خیابان ملاصدرا، کوچه شیراز شمالی، پلاک ۱۸، واحد ۳',
    postalCode: '1991745831',
    isDefault: false,
  },
];

const INITIAL_SAVED_PIECES = [
  {
    id: 'prd_vase_kavir',
    title: 'گلدان سرامیکی دست‌ساز کویر',
    category: 'سفال و دکور',
    price: 1850000,
    currency: 'IRT',
    image: PRODUCT_MEDIA_FALLBACKS['small-vase'].image,
    inStock: true,
  },
  {
    id: 'prd_lamp_oak',
    title: 'آباژور رومیزی کتان و چوب بلوط',
    category: 'نورپردازی',
    price: 3450000,
    currency: 'IRT',
    image: PRODUCT_MEDIA_FALLBACKS['desk-lamp'].image,
    inStock: true,
  },
  {
    id: 'prd_linen_throw',
    title: 'رومیزی کتان ارگانیک بافت کارگاهی',
    category: 'منسوجات',
    price: 2190000,
    currency: 'IRT',
    image: PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'].image,
    inStock: true,
  },
];

const INITIAL_PRODUCTS = [
  {
    _id: 'prd_vase_kavir',
    sku: 'JRK-CER-101',
    title: 'گلدان سرامیکی دست‌ساز کویر',
    category: 'سفال و دکور',
    price: 1850000,
    compareAtPrice: 2150000,
    currency: 'IRT',
    stock: 14,
    active: true,
    isNew: false,
    color: 'کرم',
    material: 'سرامیک لعاب‌مات پخت بالا',
    image: PRODUCT_MEDIA_FALLBACKS['small-vase'].image,
  },
  {
    _id: 'prd_lamp_oak',
    sku: 'JRK-LGT-204',
    title: 'آباژور رومیزی کتان و چوب بلوط',
    category: 'نورپردازی',
    price: 3450000,
    compareAtPrice: null,
    currency: 'IRT',
    stock: 6,
    active: true,
    isNew: true,
    color: 'مسی',
    material: 'چوب بلوط طبیعی و شید کتان',
    image: PRODUCT_MEDIA_FALLBACKS['desk-lamp'].image,
  },
  {
    _id: 'prd_mirror_brass',
    sku: 'JRK-DEC-309',
    title: 'آینه رومیزی قاب برنجی کهنه‌کاری',
    category: 'دکور',
    price: 2780000,
    compareAtPrice: 3100000,
    currency: 'IRT',
    stock: 2,
    active: true,
    isNew: false,
    color: 'مسی',
    material: 'برنج دست‌ساز و آینه سوپرکلیر',
    image: PRODUCT_MEDIA_FALLBACKS['table-mirror'].image,
  },
  {
    _id: 'prd_linen_throw',
    sku: 'JRK-TXT-118',
    title: 'رومیزی کتان ارگانیک بافت کارگاهی',
    category: 'منسوجات',
    price: 2190000,
    compareAtPrice: null,
    currency: 'IRT',
    stock: 9,
    active: true,
    isNew: true,
    color: 'کرم',
    material: 'کتان ۱۰۰٪ طبیعی سنگ‌شور',
    image: PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'].image,
  },
  {
    _id: 'prd_candle_amber',
    sku: 'JRK-SCN-402',
    title: 'شمع دست‌ساز موم سویا — سدر و کهربا',
    category: 'روایح و شمع',
    price: 890000,
    compareAtPrice: null,
    currency: 'IRT',
    stock: 22,
    active: true,
    isNew: false,
    color: 'قهوه‌ای',
    material: 'موم طبیعی سویا در ظرف سنگی',
    image: PRODUCT_MEDIA_FALLBACKS['scented-candle'].image,
  },
  {
    _id: 'prd_basket_palm',
    sku: 'JRK-LIV-512',
    title: 'سبد حصیری دست‌بافت نخلستان جنوب',
    category: 'نشیمن',
    price: 1420000,
    compareAtPrice: 1650000,
    currency: 'IRT',
    stock: 3,
    active: true,
    isNew: false,
    color: 'بژ',
    material: 'برگ نخل طبیعی دست‌بافت',
    image: PRODUCT_MEDIA_FALLBACKS['wicker-basket'].image,
  },
  {
    _id: 'prd_cushion_wool',
    sku: 'JRK-TXT-225',
    title: 'کوسن پشمی دست‌بافت طرح هندسی کوهستان',
    category: 'منسوجات',
    price: 1640000,
    compareAtPrice: null,
    currency: 'IRT',
    stock: 0,
    active: true,
    isNew: false,
    color: 'آجری',
    material: 'پشم ریسیده‌شده با رنگرزی گیاهی',
    image: PRODUCT_MEDIA_FALLBACKS['fabric-cushion'].image,
  },
  {
    _id: 'prd_frame_walnut',
    sku: 'JRK-DEC-615',
    title: 'قاب هنری چوب گردو با پاسپارتو کتان',
    category: 'دکور',
    price: 1960000,
    compareAtPrice: null,
    currency: 'IRT',
    stock: 11,
    active: true,
    isNew: true,
    color: 'قهوه‌ای',
    material: 'چوب گردوی ایرانی با پوشش روغن گیاهی',
    image: PRODUCT_MEDIA_FALLBACKS['wood-frame'].image,
  },
];

const INITIAL_ORDERS = [
  {
    id: 'JRK-1405-8942',
    userId: 'usr_sara',
    customerName: 'سارا رادمهر',
    customerPhone: '+989123456789',
    city: 'تهران',
    addressLine: 'تهران، خیابان فرشته، خیابان بیدار، پلاک ۲۴، واحد ۱۲',
    postalCode: '1964938174',
    createdAt: '۵ آذر ۱۴۰۵',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'درگاه آنلاین شاپرک',
    shippingMethod: 'پیک اختصاصی گالری ژرکا',
    trackingNumber: 'TPX-948201746',
    eta: 'تحویل امروز بازه ۱۶ تا ۲۰',
    currency: 'IRT',
    subtotal: 5300000,
    discount: 0,
    shippingCost: 0,
    total: 5300000,
    items: [
      {
        productId: 'prd_lamp_oak',
        title: 'آباژور رومیزی کتان و چوب بلوط',
        qty: 1,
        unitPrice: 3450000,
        lineTotal: 3450000,
        image: PRODUCT_MEDIA_FALLBACKS['desk-lamp'].image,
      },
      {
        productId: 'prd_vase_kavir',
        title: 'گلدان سرامیکی دست‌ساز کویر',
        qty: 1,
        unitPrice: 1850000,
        lineTotal: 1850000,
        image: PRODUCT_MEDIA_FALLBACKS['small-vase'].image,
      },
    ],
  },
  {
    id: 'JRK-1405-8891',
    userId: 'usr_parisa',
    customerName: 'پریسا بهرامی',
    customerPhone: '+989354119022',
    city: 'شیراز',
    addressLine: 'شیراز، بلوار ستارخان، کوچه ۱۲، ساختمان سرو، طبقه ۲',
    postalCode: '7183945182',
    createdAt: '۴ آذر ۱۴۰۵',
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'درگاه آنلاین شاپرک',
    shippingMethod: 'تیپاکس اکسپرس بیمه‌شده',
    trackingNumber: 'در حال صدور بارنامه',
    eta: '۹ آذر ۱۴۰۵',
    currency: 'IRT',
    subtotal: 7740000,
    discount: 350000,
    shippingCost: 0,
    total: 7390000,
    items: [
      {
        productId: 'prd_mirror_brass',
        title: 'آینه رومیزی قاب برنجی کهنه‌کاری',
        qty: 2,
        unitPrice: 2780000,
        lineTotal: 5560000,
        image: PRODUCT_MEDIA_FALLBACKS['table-mirror'].image,
      },
      {
        productId: 'prd_linen_throw',
        title: 'رومیزی کتان ارگانیک بافت کارگاهی',
        qty: 1,
        unitPrice: 2180000,
        lineTotal: 2180000,
        image: PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'].image,
      },
    ],
  },
  {
    id: 'JRK-1405-8764',
    userId: 'usr_sara',
    customerName: 'سارا رادمهر',
    customerPhone: '+989123456789',
    city: 'تهران',
    addressLine: 'تهران، میدان ونک، خیابان ملاصدرا، کوچه شیراز شمالی، پلاک ۱۸',
    postalCode: '1991745831',
    createdAt: '۱۸ آبان ۱۴۰۵',
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'درگاه آنلاین شاپرک',
    shippingMethod: 'پیک اختصاصی گالری ژرکا',
    trackingNumber: 'JRK-DLV-44109',
    eta: 'تحویل شده در ۱۹ آبان ۱۴۰۵',
    currency: 'IRT',
    subtotal: 3970000,
    discount: 0,
    shippingCost: 120000,
    total: 4090000,
    items: [
      {
        productId: 'prd_linen_throw',
        title: 'رومیزی کتان ارگانیک بافت کارگاهی',
        qty: 1,
        unitPrice: 2190000,
        lineTotal: 2190000,
        image: PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'].image,
      },
      {
        productId: 'prd_candle_amber',
        title: 'شمع دست‌ساز موم سویا — سدر و کهربا',
        qty: 2,
        unitPrice: 890000,
        lineTotal: 1780000,
        image: PRODUCT_MEDIA_FALLBACKS['scented-candle'].image,
      },
    ],
  },
  {
    id: 'JRK-1405-8610',
    userId: 'usr_kaveh',
    customerName: 'کاوه نیک‌پور',
    customerPhone: '+989128814420',
    city: 'اصفهان',
    addressLine: 'اصفهان، خیابان چهارباغ بالا، مجتمع پارسیان، واحد ۵',
    postalCode: '8163948120',
    createdAt: '۲ آذر ۱۴۰۵',
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: 'کارت‌به‌کارت تاییدشده',
    shippingMethod: 'پست پیشتاز ویژه',
    trackingNumber: '',
    eta: 'بررسی کارگاه',
    currency: 'IRT',
    subtotal: 3380000,
    discount: 0,
    shippingCost: 145000,
    total: 3525000,
    items: [
      {
        productId: 'prd_frame_walnut',
        title: 'قاب هنری چوب گردو با پاسپارتو کتان',
        qty: 1,
        unitPrice: 1960000,
        lineTotal: 1960000,
        image: PRODUCT_MEDIA_FALLBACKS['wood-frame'].image,
      },
      {
        productId: 'prd_basket_palm',
        title: 'سبد حصیری دست‌بافت نخلستان جنوب',
        qty: 1,
        unitPrice: 1420000,
        lineTotal: 1420000,
        image: PRODUCT_MEDIA_FALLBACKS['wicker-basket'].image,
      },
    ],
  },
  {
    id: 'JRK-1405-8503',
    userId: 'usr_sara',
    customerName: 'سارا رادمهر',
    customerPhone: '+989123456789',
    city: 'تهران',
    addressLine: 'تهران، خیابان فرشته، خیابان بیدار، پلاک ۲۴، واحد ۱۲',
    postalCode: '1964938174',
    createdAt: '۲۹ مهر ۱۴۰۵',
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'درگاه آنلاین شاپرک',
    shippingMethod: 'پیک اختصاصی گالری ژرکا',
    trackingNumber: 'JRK-DLV-39081',
    eta: 'تحویل شده در ۳۰ مهر ۱۴۰۵',
    currency: 'IRT',
    subtotal: 2780000,
    discount: 278000,
    shippingCost: 0,
    total: 2502000,
    items: [
      {
        productId: 'prd_mirror_brass',
        title: 'آینه رومیزی قاب برنجی کهنه‌کاری',
        qty: 1,
        unitPrice: 2780000,
        lineTotal: 2780000,
        image: PRODUCT_MEDIA_FALLBACKS['table-mirror'].image,
      },
    ],
  },
];

const INITIAL_COUPONS = [
  {
    id: 'cpn_1',
    code: 'JERKA1405',
    title: 'تخفیف کلکسیون پاییز و زمستان',
    type: 'percent',
    value: 15,
    usedCount: 42,
    maxUses: 100,
    active: true,
  },
  {
    id: 'cpn_2',
    code: 'SARA-JRK10',
    title: 'کد اختصاصی اعضای طلایی باشگاه',
    type: 'percent',
    value: 10,
    usedCount: 8,
    maxUses: 50,
    active: true,
  },
  {
    id: 'cpn_3',
    code: 'ATELIER350',
    title: 'هدیه اولین سفارش بالای ۳ میلیون تومان',
    type: 'fixed',
    value: 350000,
    usedCount: 19,
    maxUses: 40,
    active: true,
  },
];

const INITIAL_STORE_SETTINGS = {
  storeName: 'ژرکا — آتلیه طراحی و خانه',
  announcementText: homeContent.announcement.text,
  supportPhone: '۰۲۱-۲۲۶۵۸۴۱۰',
  supportEmail: 'atelier@jerka.ir',
  studioAddress: 'تهران، الهیه، خیابان فرشته، پلاک ۲۴، گالری ژرکا',
  freeShippingThreshold: 5000000,
  onlineGateway: true,
  cardToCard: true,
  codEnabled: false,
  giftWrapAvailable: true,
};

export const REVENUE_SERIES = {
  '7d': [
    { label: 'شنبه', revenue: 12400000, orders: 4 },
    { label: 'یکشنبه', revenue: 18900000, orders: 6 },
    { label: 'دوشنبه', revenue: 15200000, orders: 5 },
    { label: 'سه‌شنبه', revenue: 24600000, orders: 8 },
    { label: 'چهارشنبه', revenue: 21800000, orders: 7 },
    { label: 'پنجشنبه', revenue: 31500000, orders: 11 },
    { label: 'جمعه', revenue: 27900000, orders: 9 },
  ],
  '30d': [
    { label: 'هفته اول', revenue: 84500000, orders: 27 },
    { label: 'هفته دوم', revenue: 109200000, orders: 34 },
    { label: 'هفته سوم', revenue: 128400000, orders: 41 },
    { label: 'هفته چهارم', revenue: 152300000, orders: 49 },
  ],
  '6m': [
    { label: 'خرداد', revenue: 310000000, orders: 98 },
    { label: 'تیر', revenue: 348000000, orders: 112 },
    { label: 'مرداد', revenue: 392000000, orders: 124 },
    { label: 'شهریور', revenue: 445000000, orders: 141 },
    { label: 'مهر', revenue: 512000000, orders: 163 },
    { label: 'آبان', revenue: 586000000, orders: 185 },
  ],
};

function buildInitialState() {
  return {
    currentUserId: null,
    users: INITIAL_USERS,
    addresses: INITIAL_ADDRESSES,
    savedPieces: INITIAL_SAVED_PIECES,
    orders: INITIAL_ORDERS,
    products: INITIAL_PRODUCTS,
    coupons: INITIAL_COUPONS,
    storeSettings: INITIAL_STORE_SETTINGS,
  };
}

let memoryState = null;
let pendingOtpChallenge = null;
const listeners = new Set();

function readInitialState() {
  if (memoryState) return memoryState;
  const defaults = buildInitialState();
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    memoryState = defaults;
    return memoryState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryState = defaults;
      return memoryState;
    }
    const parsed = JSON.parse(raw);
    memoryState = {
      ...defaults,
      ...parsed,
      storeSettings: {
        ...defaults.storeSettings,
        ...(parsed?.storeSettings || {}),
      },
      users: Array.isArray(parsed?.users) && parsed.users.length ? parsed.users : defaults.users,
      addresses: Array.isArray(parsed?.addresses) ? parsed.addresses : defaults.addresses,
      savedPieces: Array.isArray(parsed?.savedPieces) ? parsed.savedPieces : defaults.savedPieces,
      orders: Array.isArray(parsed?.orders) && parsed.orders.length ? parsed.orders : defaults.orders,
      products: Array.isArray(parsed?.products) && parsed.products.length ? parsed.products : defaults.products,
      coupons: Array.isArray(parsed?.coupons) ? parsed.coupons : defaults.coupons,
    };
    return memoryState;
  } catch {
    memoryState = defaults;
    return memoryState;
  }
}

function commitState(updater) {
  const prev = readInitialState();
  const next = typeof updater === 'function' ? updater(prev) : updater;
  memoryState = next;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage quota exceeded — keep in-memory state */
    }
  }
  for (const listener of listeners) {
    listener();
  }
  return next;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memoryState = null;
      readInitialState();
      for (const listener of listeners) listener();
    }
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return readInitialState();
}

/** Try calling a live Joorchin auth endpoint with a fast timeout; return null when disabled/unreachable. */
async function tryServerAuth(action, payload) {
  if (!APP_ID || typeof fetch === 'undefined') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  try {
    const res = await fetch(`/api/v1/apps/${APP_ID}/plugins/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.token && typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_TOKEN_KEY, json.token);
    }
    return json;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Request a 5-digit OTP code for an Iranian mobile number.
 */
export async function requestOtpCode(rawPhone) {
  const canonical = normalizeIranianMobile(rawPhone);
  if (!canonical) {
    throw new Error('شماره موبایل معتبر نیست. لطفاً شماره‌ای مانند ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.');
  }

  const serverRes = await tryServerAuth('otp/request', { phone: canonical });
  const existing = readInitialState().users.find((u) => u.phone === canonical);
  const demoCode = '48291';

  pendingOtpChallenge = {
    phone: canonical,
    code: demoCode,
    expiresAt: Date.now() + 2 * 60 * 1000,
    isExistingUser: Boolean(existing),
    serverBacked: Boolean(serverRes),
  };

  return {
    phone: canonical,
    displayPhone: formatIranianMobile(canonical),
    isExistingUser: Boolean(existing),
    existingName: existing?.name || '',
    previewCode: serverRes ? null : demoCode,
    expiresInSeconds: 120,
  };
}

/**
 * Verify OTP code and sign in (or auto-register) the customer.
 */
export async function verifyOtpCode({ phone, code, name }) {
  const canonical = normalizeIranianMobile(phone);
  const cleanCode = toLatinDigits(String(code || '')).replace(/\D/g, '');
  if (!canonical) {
    throw new Error('شماره موبایل نامعتبر است.');
  }
  if (cleanCode.length !== 5) {
    throw new Error('کد تأیید ۵ رقمی را به صورت کامل وارد کنید.');
  }

  const serverRes = await tryServerAuth('otp/verify', { phone: canonical, code: cleanCode });

  if (!serverRes) {
    if (
      pendingOtpChallenge &&
      pendingOtpChallenge.phone === canonical &&
      Date.now() > pendingOtpChallenge.expiresAt
    ) {
      throw new Error('مهلت کد تأیید به پایان رسیده است. لطفاً کد جدید دریافت کنید.');
    }
    if (pendingOtpChallenge && cleanCode !== pendingOtpChallenge.code && cleanCode !== '12345') {
      throw new Error('کد تأیید واردشده نادرست است. کد پیش‌نمایش را بررسی کنید.');
    }
  }

  let signedUser = null;
  commitState((prev) => {
    const found = prev.users.find((u) => u.phone === canonical);
    if (found) {
      signedUser = name?.trim() && !found.name ? { ...found, name: name.trim() } : found;
      return {
        ...prev,
        currentUserId: signedUser.id,
        users: prev.users.map((u) => (u.id === signedUser.id ? signedUser : u)),
      };
    }

    const nowFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    signedUser = {
      id: 'usr_' + Math.random().toString(36).slice(2, 9),
      role: 'customer',
      name: (name && name.trim()) || 'مهمان عزیز ژرکا',
      email: '',
      phone: canonical,
      password: '',
      tier: 'جدید',
      points: 250,
      walletBalance: 0,
      nationalCode: '',
      city: 'تهران',
      iban: '',
      bio: '',
      joinedAt: nowFa,
      newsletter: true,
      smsAlerts: true,
      vipOffers: true,
      rewardCode: 'WELCOME10',
      adminNote: 'عضویت با شماره همراه',
    };
    return {
      ...prev,
      currentUserId: signedUser.id,
      users: [signedUser, ...prev.users],
    };
  });

  pendingOtpChallenge = null;
  return signedUser;
}

/**
 * Sign in using email or Iranian mobile + password.
 */
export async function signInWithPassword({ identifier, password }) {
  const raw = String(identifier || '').trim();
  const pwd = String(password || '');
  if (!raw || !pwd) {
    throw new Error('لطفاً شناسه کاربری و رمز عبور خود را وارد کنید.');
  }

  const normalizedMobile = normalizeIranianMobile(raw);
  const emailLower = raw.toLowerCase();

  await tryServerAuth('login', { identifier: raw, password: pwd });

  const state = readInitialState();
  const user = state.users.find(
    (u) =>
      (u.email && u.email.toLowerCase() === emailLower) ||
      (normalizedMobile && u.phone === normalizedMobile),
  );

  if (!user || (user.password && user.password !== pwd)) {
    throw new Error('اطلاعات ورود نادرست است. ایمیل، شماره موبایل یا رمز عبور را بررسی کنید.');
  }

  commitState((prev) => ({
    ...prev,
    currentUserId: user.id,
  }));

  return user;
}

/**
 * Register a new customer account.
 */
export async function registerAccount({ name, phone, email, password }) {
  const cleanName = String(name || '').trim();
  const canonicalPhone = normalizeIranianMobile(phone);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const pwd = String(password || '');

  if (cleanName.length < 2) {
    throw new Error('لطفاً نام و نام خانوادگی خود را کامل وارد کنید.');
  }
  if (!canonicalPhone) {
    throw new Error('شماره موبایل معتبر وارد کنید (نمونه: ۰۹۱۲۳۴۵۶۷۸۹).');
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('نشانی پست الکترونیک معتبر نیست.');
  }
  if (pwd.length < 6) {
    throw new Error('رمز عبور باید دست‌کم ۶ نویسه داشته باشد.');
  }

  const state = readInitialState();
  if (state.users.some((u) => u.phone === canonicalPhone)) {
    throw new Error('این شماره موبایل پیش‌تر در ژرکا ثبت شده است. لطفاً از بخش ورود اقدام کنید.');
  }
  if (cleanEmail && state.users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
    throw new Error('این ایمیل پیش‌تر ثبت شده است.');
  }

  await tryServerAuth('register', {
    name: cleanName,
    phone: canonicalPhone,
    email: cleanEmail,
    password: pwd,
  });

  const joinedAt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const newUser = {
    id: 'usr_' + Math.random().toString(36).slice(2, 9),
    role: 'customer',
    name: cleanName,
    email: cleanEmail,
    phone: canonicalPhone,
    password: pwd,
    tier: 'نقره‌ای',
    points: 350,
    walletBalance: 150000,
    nationalCode: '',
    city: 'تهران',
    iban: '',
    bio: '',
    joinedAt,
    newsletter: true,
    smsAlerts: true,
    vipOffers: true,
    rewardCode: 'WELCOME10',
    adminNote: 'عضو جدید وب‌سایت ژرکا',
  };

  commitState((prev) => ({
    ...prev,
    currentUserId: newUser.id,
    users: [newUser, ...prev.users],
  }));

  return newUser;
}

/**
 * Instant one-click sign-in for customer or admin preview.
 */
export function signInDemo(role = 'customer') {
  const targetId = role === 'admin' ? 'usr_admin' : 'usr_sara';
  let targetUser = null;
  commitState((prev) => {
    targetUser = prev.users.find((u) => u.id === targetId) || prev.users[0];
    return {
      ...prev,
      currentUserId: targetUser?.id || null,
    };
  });
  return targetUser;
}

export function signOut() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(USER_TOKEN_KEY);
  }
  commitState((prev) => ({
    ...prev,
    currentUserId: null,
  }));
}

export function updateCustomerProfile(patch) {
  commitState((prev) => {
    const targetId = prev.currentUserId || 'usr_sara';
    const nextPhone = patch.phone ? normalizeIranianMobile(patch.phone) || patch.phone : undefined;
    return {
      ...prev,
      users: prev.users.map((u) =>
        u.id === targetId
          ? {
              ...u,
              ...patch,
              ...(nextPhone ? { phone: nextPhone } : {}),
            }
          : u,
      ),
    };
  });
}

/* --------------------------------------------------------------------------
   Customer Address Book Actions
   -------------------------------------------------------------------------- */
export function saveCustomerAddress(addressInput) {
  const state = readInitialState();
  const ownerId = state.currentUserId || 'usr_sara';
  const id = addressInput.id || 'addr_' + Math.random().toString(36).slice(2, 9);
  const canonicalPhone = normalizeIranianMobile(addressInput.phone) || addressInput.phone;
  const cleanPostal = toLatinDigits(String(addressInput.postalCode || '')).replace(/[\s-]/g, '');

  const record = {
    id,
    userId: ownerId,
    label: String(addressInput.label || 'منزل').trim(),
    name: String(addressInput.name || '').trim(),
    phone: canonicalPhone,
    province: String(addressInput.province || '').trim(),
    city: String(addressInput.city || '').trim(),
    line1: String(addressInput.line1 || '').trim(),
    postalCode: cleanPostal,
    isDefault: Boolean(addressInput.isDefault),
  };

  commitState((prev) => {
    const userAddrs = prev.addresses.filter((a) => a.userId === ownerId);
    const shouldBeDefault = record.isDefault || userAddrs.length === 0;
    const exists = prev.addresses.some((a) => a.id === id);

    let nextAddresses = exists
      ? prev.addresses.map((a) => (a.id === id ? { ...record, isDefault: shouldBeDefault } : a))
      : [{ ...record, isDefault: shouldBeDefault }, ...prev.addresses];

    if (shouldBeDefault) {
      nextAddresses = nextAddresses.map((a) =>
        a.userId === ownerId ? { ...a, isDefault: a.id === id } : a,
      );
    }

    return {
      ...prev,
      addresses: nextAddresses,
    };
  });

  return record;
}

export function removeCustomerAddress(addressId) {
  commitState((prev) => {
    const remaining = prev.addresses.filter((a) => a.id !== addressId);
    const ownerId = prev.currentUserId || 'usr_sara';
    const ownerRemaining = remaining.filter((a) => a.userId === ownerId);
    if (ownerRemaining.length > 0 && !ownerRemaining.some((a) => a.isDefault)) {
      const firstId = ownerRemaining[0].id;
      return {
        ...prev,
        addresses: remaining.map((a) => (a.id === firstId ? { ...a, isDefault: true } : a)),
      };
    }
    return { ...prev, addresses: remaining };
  });
}

export function makeDefaultAddress(addressId) {
  commitState((prev) => {
    const target = prev.addresses.find((a) => a.id === addressId);
    if (!target) return prev;
    return {
      ...prev,
      addresses: prev.addresses.map((a) =>
        a.userId === target.userId ? { ...a, isDefault: a.id === addressId } : a,
      ),
    };
  });
}

export function removeSavedPiece(pieceId) {
  commitState((prev) => ({
    ...prev,
    savedPieces: prev.savedPieces.filter((p) => p.id !== pieceId),
  }));
}

export function recordCustomerOrder(orderPayload) {
  const nowFa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  commitState((prev) => {
    const ownerId = prev.currentUserId || 'usr_sara';
    const order = {
      id: orderPayload.id || `JRK-1405-${Math.floor(9000 + Math.random() * 900)}`,
      userId: ownerId,
      customerName: orderPayload.customerName || 'مشتری ژرکا',
      customerPhone: orderPayload.customerPhone || '',
      city: orderPayload.city || 'تهران',
      addressLine: orderPayload.addressLine || '',
      postalCode: orderPayload.postalCode || '',
      createdAt: nowFa,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: orderPayload.paymentMethod || 'درگاه آنلاین شاپرک',
      shippingMethod: orderPayload.shippingMethod || 'ارسال استاندارد ژرکا',
      trackingNumber: '',
      eta: 'در انتظار پردازش کارگاه',
      currency: orderPayload.currency || 'IRT',
      subtotal: Number(orderPayload.subtotal) || 0,
      discount: Number(orderPayload.discount) || 0,
      shippingCost: Number(orderPayload.shippingCost) || 0,
      total: Number(orderPayload.total) || 0,
      items: Array.isArray(orderPayload.items) ? orderPayload.items : [],
    };
    return {
      ...prev,
      orders: [order, ...prev.orders],
    };
  });
}

/* --------------------------------------------------------------------------
   Admin Backoffice Actions
   -------------------------------------------------------------------------- */
export function updateAdminOrder(orderId, patch) {
  commitState((prev) => ({
    ...prev,
    orders: prev.orders.map((ord) => (ord.id === orderId ? { ...ord, ...patch } : ord)),
  }));
}

export function saveAdminProduct(productInput) {
  const id = productInput._id || productInput.id || 'prd_' + Math.random().toString(36).slice(2, 9);
  const record = {
    _id: id,
    sku: String(productInput.sku || `JRK-${Math.floor(100 + Math.random() * 899)}`).trim(),
    title: String(productInput.title || '').trim(),
    category: String(productInput.category || 'دکور').trim(),
    price: Math.max(0, Number(toLatinDigits(productInput.price)) || 0),
    compareAtPrice: productInput.compareAtPrice
      ? Math.max(0, Number(toLatinDigits(productInput.compareAtPrice)) || 0)
      : null,
    currency: productInput.currency || 'IRT',
    stock: Math.max(0, parseInt(toLatinDigits(productInput.stock), 10) || 0),
    active: productInput.active !== false,
    isNew: Boolean(productInput.isNew),
    color: String(productInput.color || 'کرم').trim(),
    material: String(productInput.material || '').trim(),
    image:
      String(productInput.image || '').trim() || STUDIO_MEDIA_PRESETS[0].url,
  };

  commitState((prev) => {
    const exists = prev.products.some((p) => (p._id || p.id) === id);
    return {
      ...prev,
      products: exists
        ? prev.products.map((p) => ((p._id || p.id) === id ? record : p))
        : [record, ...prev.products],
    };
  });

  return record;
}

export function adjustProductStock(productId, delta) {
  commitState((prev) => ({
    ...prev,
    products: prev.products.map((p) =>
      (p._id || p.id) === productId
        ? { ...p, stock: Math.max(0, Number(p.stock || 0) + delta) }
        : p,
    ),
  }));
}

export function toggleProductActive(productId) {
  commitState((prev) => ({
    ...prev,
    products: prev.products.map((p) =>
      (p._id || p.id) === productId ? { ...p, active: !p.active } : p,
    ),
  }));
}

export function deleteAdminProduct(productId) {
  commitState((prev) => ({
    ...prev,
    products: prev.products.filter((p) => (p._id || p.id) !== productId),
  }));
}

export function updateAdminCustomer(userId, patch) {
  commitState((prev) => ({
    ...prev,
    users: prev.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  }));
}

export function saveAdminCoupon(couponInput) {
  const id = couponInput.id || 'cpn_' + Math.random().toString(36).slice(2, 8);
  const code = toLatinDigits(String(couponInput.code || '').trim()).toUpperCase();
  if (!code) throw new Error('کد تخفیف را وارد کنید.');

  const record = {
    id,
    code,
    title: String(couponInput.title || 'کد تخفیف ویژه ژرکا').trim(),
    type: couponInput.type === 'fixed' ? 'fixed' : 'percent',
    value: Math.max(1, Number(toLatinDigits(couponInput.value)) || 10),
    usedCount: Number(couponInput.usedCount) || 0,
    maxUses: Math.max(1, Number(toLatinDigits(couponInput.maxUses)) || 50),
    active: couponInput.active !== false,
  };

  commitState((prev) => {
    const exists = prev.coupons.some((c) => c.id === id);
    return {
      ...prev,
      coupons: exists
        ? prev.coupons.map((c) => (c.id === id ? record : c))
        : [record, ...prev.coupons],
    };
  });
}

export function toggleAdminCoupon(couponId) {
  commitState((prev) => ({
    ...prev,
    coupons: prev.coupons.map((c) => (c.id === couponId ? { ...c, active: !c.active } : c)),
  }));
}

export function deleteAdminCoupon(couponId) {
  commitState((prev) => ({
    ...prev,
    coupons: prev.coupons.filter((c) => c.id !== couponId),
  }));
}

export function updateStoreSettings(patch) {
  commitState((prev) => ({
    ...prev,
    storeSettings: {
      ...prev.storeSettings,
      ...patch,
    },
  }));
}

/* --------------------------------------------------------------------------
   Reactive Hook
   -------------------------------------------------------------------------- */
export function useAtelierStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const currentUser = state.currentUserId
    ? state.users.find((u) => u.id === state.currentUserId) || null
    : null;
  const activeProfileUser = currentUser || state.users[0];
  const userAddresses = state.addresses.filter((a) => a.userId === activeProfileUser.id);
  const userOrders = state.orders.filter(
    (o) =>
      o.userId === activeProfileUser.id ||
      (activeProfileUser.phone && o.customerPhone === activeProfileUser.phone),
  );

  return {
    ...state,
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === 'admin',
    activeProfileUser,
    userAddresses,
    userOrders,
  };
}
