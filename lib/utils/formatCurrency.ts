/**
 * Exact, deterministic currency formatter for WooCommerce SaaS.
 * Treats order prices as immutable snapshot values.
 */
export function formatCurrency(amount: number | string, currency = "USD"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "$0.00";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `$${numericAmount.toFixed(2)}`;
  }
}
