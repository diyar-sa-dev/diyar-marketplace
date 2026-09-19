import { fetchProduct } from '../../../api/catalog.ts';
import type { DesignerSession, SessionResult } from '../application/DesignerSession.ts';
import { buildDesignItemFromProduct } from './buildDesignItemFromProduct.ts';
import { defaultAddPosition } from './defaultPlacement.ts';

export type FetchProductFn = typeof fetchProduct;

export async function addCatalogProductToSession(
  session: DesignerSession,
  catalogProductId: string,
  fetchProductFn: FetchProductFn = fetchProduct,
): Promise<SessionResult> {
  const product = await fetchProductFn(catalogProductId);
  const document = session.getDocument();
  const position_m = defaultAddPosition(document.room, document.items.length);
  const itemId = crypto.randomUUID();

  const built = buildDesignItemFromProduct(product, { id: itemId, position_m });
  if (built.ok === false) {
    return { ok: false, error: built.error, state: session.getState() };
  }

  return session.applyCommands([{ type: 'ADD_ITEM', item: built.item }]);
}
