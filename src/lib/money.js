/**
 * قالب‌بندی مبلغ — تنها منبع نمایش قیمت در فروشگاه ژرکا.
 * مبلغ و واحد پول همیشه از سرور می‌آیند؛ اینجا فقط نمایش داده می‌شوند.
 */
const UNIT_FA = { IRR: 'ریال', IRT: 'تومان', TOMAN: 'تومان' };

export const DEFAULT_CURRENCY = 'IRR';

/** ارقام فارسی — برای نمایش قیمت در تایپوگرافی سرصفحه و بدنه. */
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toFaDigits(str) {
  return String(str).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** قیمت بدون واحد — برای جاهایی که واحد جدا نمایش داده می‌شود. */
export function formatNumber(amount) {
  const value = Number(amount) || 0;
  return toFaDigits(new Intl.NumberFormat('en-US').format(value));
}

export function formatMoney(amount, currency) {
  const value = Number(amount) || 0;
  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
  const unit = UNIT_FA[code];
  if (unit) return formatNumber(value) + ' ' + unit;
  try {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: code }).format(value);
  } catch {
    return formatNumber(value) + ' ' + code;
  }
}

/** قیمت یک محصول/واریانت با واحد پول خودش. */
export function formatPrice(item) {
  return formatMoney(item?.price, item?.currency);
}
