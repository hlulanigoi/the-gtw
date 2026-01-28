import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setRuntimeCurrency, getRuntimeCurrency } from "@/lib/currency";

const STORAGE_KEY = "@parcel_currency";

export type CurrencyCode = "USD" | "EUR" | "ZAR" | "GBP";

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => getRuntimeCurrency().code as CurrencyCode);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = (JSON.parse(saved) as { code: CurrencyCode; locale?: string })?.code;
          if (parsed) {
            setRuntimeCurrency(parsed);
            setCurrencyState(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setCurrency = useCallback(async (code: CurrencyCode, locale?: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ code, locale }));
      setRuntimeCurrency(code, locale);
      setCurrencyState(code);
    } catch (e) {
      // ignore
    }
  }, []);

  return { currency, setCurrency } as const;
}
