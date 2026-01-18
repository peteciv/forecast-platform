// Financial calculation utilities

/**
 * Calculate Net Revenue: Revenue × (1 - Derate%)
 */
export function calculateNetRevenue(
  customerRevenue: number,
  deratePercent: number
): number {
  return customerRevenue * (1 - deratePercent / 100);
}

/**
 * Calculate BOM Percentage: (BOM Cost / Net Revenue) × 100
 */
export function calculateBomPercent(
  bomCost: number,
  netRevenue: number
): number {
  if (netRevenue === 0) return 0;
  return (bomCost / netRevenue) * 100;
}

/**
 * Format number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse string to number, handling empty/null values
 */
export function parseNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
