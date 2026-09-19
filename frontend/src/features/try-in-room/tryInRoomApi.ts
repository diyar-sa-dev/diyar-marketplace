import { marketplaceApi } from '../../api/client.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { TryInRoomJob } from './types.ts';

export async function createTryInRoomJobForProduct(
  productId: string,
  file: File,
  idempotencyKey: string,
): Promise<TryInRoomJob> {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('idempotency_key', idempotencyKey);

  const { data } = await marketplaceApi.post<
    ApiSuccessResponse<{ try_in_room_job: TryInRoomJob }>
  >(`/products/${productId}/try-in-room`, formData);

  return data.data.try_in_room_job;
}

export async function fetchTryInRoomJob(jobId: string): Promise<TryInRoomJob> {
  const { data } = await marketplaceApi.get<
    ApiSuccessResponse<{ try_in_room_job: TryInRoomJob }>
  >(`/try-in-room/${jobId}`);

  return data.data.try_in_room_job;
}
