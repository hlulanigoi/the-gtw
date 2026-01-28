const DEFAULT = { code: process.env.EXPO_PUBLIC_CURRENCY_CODE || "USD", locale: process.env.EXPO_PUBLIC_LOCALE || "en-US" };

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
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const LOCALE_MAP: Record<string, string> = {
  ZAR: "en-ZA",
  USD: "en-US",
  EUR: "en-EU",
  GBP: "en-GB",
};

export const formatCurrency = (amount: number | null | undefined, currencyCode?: string): string => {
  const code = currencyCode || runtimeCurrencyCode || DEFAULT.code;
  const locale = LOCALE_MAP[code] || runtimeLocale || DEFAULT.locale;
  const symbol = SYMBOL_MAP[code] ?? code;
  if (amount === null || amount === undefined) return `${symbol}0`;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount as number);
  } catch {
    return `${symbol}${(amount).toFixed(2)}`;
  }
};

export const CURRENCY_SYMBOL = SYMBOL_MAP[DEFAULT.code] ?? DEFAULT.code;
export const CURRENCY_CODE = DEFAULT.code;

// Predefined top-up amounts per currency (in major units)
export const TOPUP_AMOUNTS: Record<string, number[]> = {
  USD: [10, 25, 50, 100, 250, 500],
  EUR: [10, 25, 50, 100, 250, 500],
  GBP: [10, 25, 50, 100, 250, 500],
  ZAR: [100, 250, 500, 1000, 2500, 5000],
};

// Get currency name
export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  ZAR: "South African Rand",
};
