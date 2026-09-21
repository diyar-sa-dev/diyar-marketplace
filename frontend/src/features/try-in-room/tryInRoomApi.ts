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

export async function createTryInRoomJobForRoomDesign(
  roomDesignId: string,
  file: File,
  idempotencyKey: string,
): Promise<TryInRoomJob> {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('idempotency_key', idempotencyKey);

  const { data } = await marketplaceApi.post<
    ApiSuccessResponse<{ try_in_room_job: TryInRoomJob }>
  >(`/room-designs/${roomDesignId}/try-in-room`, formData);

  return data.data.try_in_room_job;
}

export async function fetchTryInRoomJob(jobId: string): Promise<TryInRoomJob> {
  const { data } = await marketplaceApi.get<
    ApiSuccessResponse<{ try_in_room_job: TryInRoomJob }>
  >(`/try-in-room/${jobId}`);

  return data.data.try_in_room_job;
}

export async function fetchTryInRoomResultImage(jobId: string): Promise<string> {
  const { data } = await marketplaceApi.get<Blob>(`/try-in-room/${jobId}/result`, {
    responseType: 'blob',
    headers: { Accept: 'image/png,image/jpeg,image/webp,image/*' },
  });

  if (!(data instanceof Blob) || data.size === 0 || data.type.includes('json')) {
    throw new Error('try_in_room_result_missing');
  }

  return URL.createObjectURL(data);
}
