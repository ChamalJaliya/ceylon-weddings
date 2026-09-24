import { COOKIES } from "@ceylonweddings/contracts";

export { COOKIES };

export const RATES_TO_LKR: Record<string, number> = {
  LKR: 1,
  USD: 300,
  AUD: 195,
  GBP: 380,
  EUR: 325,
};

export function formatMoney(amountLkr: number, currency: string) {
  const rate = RATES_TO_LKR[currency] ?? 1;
  const value = amountLkr / rate;
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "LKR" ? 0 : 2,
  }).format(value);
}
