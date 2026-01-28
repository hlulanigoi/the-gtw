const DEFAULT = { code: process.env.EXPO_PUBLIC_CURRENCY_CODE || "NGN", locale: process.env.EXPO_PUBLIC_LOCALE || "en-NG" };

// runtime currency can be set at runtime (by the user) and will be used by `formatCurrency`.
let runtimeCurrencyCode: string = DEFAULT.code;
let runtimeLocale: string = DEFAULT.locale;

export function setRuntimeCurrency(code: string, locale?: string) {
  runtimeCurrencyCode = code;
  if (locale) runtimeLocale = locale;
}

export function getRuntimeCurrency() {
  return { code: runtimeCurrencyCode, locale: runtimeLocale };
}

const SYMBOL_MAP: Record<string, string> = {
  NGN: "₦",
  ZAR: "R",
  USD: "$",
  EUR: "€",
};

export const formatCurrency = (amount: number | null | undefined): string => {
  const code = runtimeCurrencyCode || DEFAULT.code;
  const locale = runtimeLocale || DEFAULT.locale;
  const symbol = SYMBOL_MAP[code] ?? code;
  if (amount === null || amount === undefined) return `${symbol}0`;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount as number);
  } catch {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
};

export const CURRENCY_SYMBOL = SYMBOL_MAP[DEFAULT.code] ?? DEFAULT.code;
export const CURRENCY_CODE = DEFAULT.code;
