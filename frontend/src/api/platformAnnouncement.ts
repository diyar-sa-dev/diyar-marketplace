import { marketplaceApi } from './client.ts';
import type { ApiSuccessResponse } from '../types/api.ts';

export type PlatformAnnouncement = {
  enabled: boolean;
  text: string;
  cta: string;
  link: string;
};

export async function fetchPlatformAnnouncement(): Promise<PlatformAnnouncement> {
  const response =
    await marketplaceApi.get<ApiSuccessResponse<{ announcement: PlatformAnnouncement }>>(
      '/platform/announcement',
    );
  return response.data.data.announcement;
}
