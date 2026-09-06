import { adminApi } from '../../api/client.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

export type AdminAnnouncementSettings = {
  enabled: boolean;
  text_ar: string;
  text_en: string;
  cta_ar: string;
  cta_en: string;
  link: string;
};

export async function fetchAdminAnnouncement(): Promise<AdminAnnouncementSettings> {
  const response =
    await adminApi.get<ApiSuccessResponse<{ announcement: AdminAnnouncementSettings }>>(
      '/admin/announcement',
    );
  return response.data.data.announcement;
}

export async function updateAdminAnnouncement(
  payload: AdminAnnouncementSettings,
): Promise<AdminAnnouncementSettings> {
  const response = await adminApi.patch<
    ApiSuccessResponse<{ announcement: AdminAnnouncementSettings }>
  >('/admin/announcement', payload);
  return response.data.data.announcement;
}

export async function createAdminBroadcast(payload: {
  title: string;
  body: string;
  channels: Array<'in_app' | 'email' | 'push'>;
  audience_type: 'all';
  category?: string;
  priority?: 'low' | 'normal' | 'high';
}): Promise<void> {
  await adminApi.post('/admin/notifications/broadcasts', payload);
}

export async function deleteAdminFeedback(id: string): Promise<void> {
  await adminApi.delete(`/admin/feedback/${id}`);
}
