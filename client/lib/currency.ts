export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "R0";
  return `R${new Intl.NumberFormat("en-ZA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

export const CURRENCY_SYMBOL = "R";
export const CURRENCY_CODE = "ZAR";
