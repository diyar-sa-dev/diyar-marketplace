/** Matches backend `diyar.vendor.low_stock_threshold` default. */
export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'out_of_stock' | 'limited' | 'in_stock';

export function stockStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return 'out_of_stock';
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return 'limited';
  }
  return 'in_stock';
}
