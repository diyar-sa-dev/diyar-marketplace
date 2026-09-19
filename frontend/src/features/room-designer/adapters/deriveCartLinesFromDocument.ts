import type { RoomDesignDocument } from '../domain/models.ts';

export interface DesignCartLine {
  product_id: string;
  quantity: number;
  /** Display label from spatial snapshot — not purchase authority. */
  label: string;
}

/** Aggregate spatial item instances into cart-oriented product quantities (client preview only). */
export function deriveCartLinesFromDocument(
  document: RoomDesignDocument,
  roomItemIds?: string[],
): DesignCartLine[] {
  const filter =
    roomItemIds && roomItemIds.length > 0 ? new Set(roomItemIds) : null;

  const byProduct = new Map<string, { quantity: number; label: string }>();

  for (const item of document.items) {
    if (filter && !filter.has(item.id)) {
      continue;
    }
    const existing = byProduct.get(item.product_id);
    byProduct.set(item.product_id, {
      quantity: (existing?.quantity ?? 0) + 1,
      label: item.snapshot.name,
    });
  }

  return [...byProduct.entries()].map(([product_id, value]) => ({
    product_id,
    quantity: value.quantity,
    label: value.label,
  }));
}
