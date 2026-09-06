import { beforeAll, describe, expect, it } from 'vitest';
import { resolveNotificationCopy } from './notificationCopy.ts';
import { ensureLocaleCatalog } from './i18n/localeCatalog.ts';
import { translate } from './i18n/translate.ts';
import type { Notification } from '../types/notification.ts';
import type { TranslateFn } from './i18n/types.ts';

function makeNotification(status: string): Notification {
  return {
    id: 'n1',
    type: 'return.updated',
    title: 'تحديث طلب الإرجاع',
    body: `حالة طلب الإرجاع الآن: ${status}.`,
    data: { status },
    entity_type: 'return',
    entity_id: 'r1',
    priority: 'normal',
    read_at: null,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

describe('resolveNotificationCopy', () => {
  beforeAll(async () => {
    await ensureLocaleCatalog('ar');
    await ensureLocaleCatalog('en');
  });

  it('localizes return statuses in Arabic', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);

    expect(resolveNotificationCopy(makeNotification('rejected'), t, 'ar').body).toBe(
      'حالة طلب الإرجاع الآن: مرفوض.',
    );
    expect(resolveNotificationCopy(makeNotification('under_review'), t, 'ar').body).toBe(
      'حالة طلب الإرجاع الآن: قيد المراجعة.',
    );
  });

  it('localizes return statuses in English', () => {
    const t: TranslateFn = (key, params) => translate('en', key, params);

    expect(resolveNotificationCopy(makeNotification('rejected'), t, 'en').body).toBe(
      'Your return request status is now Rejected.',
    );
    expect(resolveNotificationCopy(makeNotification('under_review'), t, 'en').body).toBe(
      'Your return request status is now Under review.',
    );
  });

  it('fills booking service title from detail_lines and never leaves placeholders', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);
    const notification: Notification = {
      id: 'n2',
      type: 'booking.completed',
      title: 'اكتمل الحجز',
      body: 'اكتمل الحجز SBK-20260830-0003 لخدمة تركيب الستائر.',
      data: {
        reference: 'SBK-20260830-0003',
        detail_lines: [{ label: 'service', value: 'تركيب الستائر' }],
      },
      entity_type: 'service_booking',
      entity_id: 'b1',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    expect(resolveNotificationCopy(notification, t, 'ar').body).toBe(
      'اكتمل الحجز SBK-20260830-0003 لخدمة تركيب الستائر.',
    );
  });

  it('falls back to stored body when a placeholder cannot be filled', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);
    const notification: Notification = {
      id: 'n3',
      type: 'booking.completed',
      title: 'اكتمل الحجز',
      body: 'اكتمل الحجز SBK-1 لخدمة تنظيف المجالس.',
      data: { reference: 'SBK-1' },
      entity_type: 'service_booking',
      entity_id: 'b2',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    expect(resolveNotificationCopy(notification, t, 'ar').body).toBe(
      'اكتمل الحجز SBK-1 لخدمة تنظيف المجالس.',
    );
    expect(resolveNotificationCopy(notification, t, 'ar').body).not.toContain('{{');
  });

  it('never leaves a raw placeholder on an existing booking row', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);
    const notification: Notification = {
      id: 'n4',
      type: 'booking.completed',
      title: 'اكتمل الحجز',
      body: 'اكتمل الحجز SBK-20260830-0003 لـ {{service_title}}',
      data: { reference: 'SBK-20260830-0003' },
      entity_type: 'service_booking',
      entity_id: 'b3',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const copy = resolveNotificationCopy(notification, t, 'ar');

    expect(copy.title).toBe('اكتمل الحجز');
    expect(copy.body).toContain('SBK-20260830-0003');
    expect(copy.body).not.toContain('{{');
    expect(copy.body).not.toContain(':service_title');
  });

  it('localizes team invitation roles and chat report enums', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);

    const invitation: Notification = {
      id: 'n5',
      type: 'team.invitation',
      title: 'دعوة للفريق',
      body: 'تمت دعوتك للانضمام إلى متجر ديار كـ manager.',
      data: { store_name: 'متجر ديار', role: 'manager' },
      entity_type: 'team_member',
      entity_id: 'm1',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    expect(resolveNotificationCopy(invitation, t, 'ar').body).toBe(
      'تمت دعوتك للانضمام إلى متجر ديار كـ مدير.',
    );

    const report: Notification = {
      id: 'n6',
      type: 'chat.report_resolved',
      title: 'تمت مراجعة بلاغك',
      body: 'Your report about spam was dismissed.',
      data: { reason: 'spam', status: 'dismissed', note_line: '' },
      entity_type: 'chat_message_report',
      entity_id: 'r2',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    expect(resolveNotificationCopy(report, t, 'ar').body).toBe(
      'بلاغك بخصوص رسائل مزعجة: تم رفضه — لا مخالفة.',
    );
  });

  it('tells the provider that the accepted offer became a booking', () => {
    const t: TranslateFn = (key, params) => translate('ar', key, params);
    const notification: Notification = {
      id: 'n7',
      type: 'offer.accepted',
      title: 'تم قبول العرض',
      body: 'تم قبول عرضك للطلب SRQ-20260901-0001.',
      data: {
        request_reference: 'SRQ-20260901-0001',
        booking_reference: 'SBK-20260901-0002',
      },
      entity_type: 'service_booking',
      entity_id: 'b4',
      priority: 'normal',
      read_at: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    expect(resolveNotificationCopy(notification, t, 'ar').body).toContain('SRQ-20260901-0001');
    expect(resolveNotificationCopy(notification, t, 'ar').body).toContain('SBK-20260901-0002');
    expect(resolveNotificationCopy(notification, t, 'ar').body).toContain('الحجوزات');
  });
});
