import { describe, expect, it } from 'vitest';
import { resolveNotificationLink } from './notificationUi.tsx';
import type { Notification } from '../types/notification.ts';
import { RoleName } from './auth/roles.ts';

const bookingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'offer.accepted',
    title: 'تم قبول العرض',
    body: 'تم قبول عرضك.',
    data: {},
    entity_type: 'service_booking',
    entity_id: bookingId,
    priority: 'normal',
    read_at: null,
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const providerRoles = [{ name: RoleName.Provider, status: 'active' }];

describe('resolveNotificationLink', () => {
  it('rewrites the legacy provider requests path that 404s', () => {
    const href = resolveNotificationLink(
      makeNotification({
        data: { action_url: 'https://diyar.test/dashboard/service/requests' },
      }),
      providerRoles,
      '/dashboard/service/notifications',
    );

    expect(href).toBe('/dashboard/service/client-requests');
  });

  it('opens provider bookings from an offer-accepted notification', () => {
    const href = resolveNotificationLink(
      makeNotification({
        data: {
          action_url: `https://diyar.test/dashboard/service/bookings?highlight=${bookingId}`,
          booking_id: bookingId,
        },
      }),
      providerRoles,
      '/dashboard/service/notifications',
    );

    expect(href).toBe(`/dashboard/service/bookings?highlight=${bookingId}`);
  });

  it('maps canonical service-booking urls to the provider dashboard when in that portal', () => {
    const href = resolveNotificationLink(
      makeNotification({
        type: 'booking.created',
        data: { action_url: `https://diyar.test/service-bookings/${bookingId}` },
      }),
      providerRoles,
      '/dashboard/service/notifications',
    );

    expect(href).toBe(`/dashboard/service/bookings?highlight=${bookingId}`);
  });

  it('maps canonical service-booking urls to the customer hub outside the provider portal', () => {
    const href = resolveNotificationLink(
      makeNotification({
        type: 'booking.created',
        data: { action_url: `https://diyar.test/service-bookings/${bookingId}` },
      }),
      [{ name: RoleName.Customer, status: 'active' }],
      '/profile/notifications',
    );

    expect(href).toBe(`/profile/service-bookings?highlight=${bookingId}`);
  });
});
