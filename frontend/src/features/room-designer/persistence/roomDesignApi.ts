import { marketplaceApi } from '../../../api/client.ts';
import type { ApiSuccessResponse } from '../../../types/api.ts';
import type { RoomDesignDocument } from '../domain/models.ts';
import type { RoomDesignListItem, RoomDesignRecord } from './types.ts';

export const roomDesignKeys = {
  all: ['room-designs'] as const,
  detail: (id: string) => ['room-designs', id] as const,
  list: (page: number, perPage: number) => ['room-designs', 'list', page, perPage] as const,
};

export async function fetchRoomDesign(id: string): Promise<RoomDesignRecord> {
  const { data } = await marketplaceApi.get<ApiSuccessResponse<{ room_design: RoomDesignRecord }>>(
    `/room-designs/${id}`,
  );
  return data.data.room_design;
}

export async function fetchRoomDesignList(page = 1, perPage = 20): Promise<{
  items: RoomDesignListItem[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
}> {
  const { data } = await marketplaceApi.get<
    ApiSuccessResponse<{
      items: RoomDesignListItem[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>
  >('/room-designs', { params: { page, per_page: perPage } });
  return data.data;
}

export async function createRoomDesign(input: {
  title?: string | null;
  document: RoomDesignDocument;
}): Promise<RoomDesignRecord> {
  const { data } = await marketplaceApi.post<ApiSuccessResponse<{ room_design: RoomDesignRecord }>>(
    '/room-designs',
    input,
  );
  return data.data.room_design;
}

export interface AddRoomDesignToCartResult {
  cart: import('../../../types/cart.ts').Cart;
  skipped: Array<{ product_id: string; reason: string }>;
}

export async function addRoomDesignToCart(
  designId: string,
  payload?: { item_ids?: string[] },
): Promise<AddRoomDesignToCartResult> {
  const { data } = await marketplaceApi.post<
    ApiSuccessResponse<{ cart: AddRoomDesignToCartResult['cart']; skipped: AddRoomDesignToCartResult['skipped'] }>
  >(`/room-designs/${designId}/add-to-cart`, payload ?? {});
  return { cart: data.data.cart, skipped: data.data.skipped ?? [] };
}

export async function updateRoomDesign(
  id: string,
  payload: { expected_version: number; document: RoomDesignDocument },
): Promise<RoomDesignRecord> {
  const { data } = await marketplaceApi.put<ApiSuccessResponse<{ room_design: RoomDesignRecord }>>(
    `/room-designs/${id}`,
    payload,
  );
  return data.data.room_design;
}
