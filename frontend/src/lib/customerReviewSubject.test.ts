import { describe, expect, it } from 'vitest';
import { customerReviewServiceSource, customerReviewSubjectTitle } from './customerReviewSubject.ts';
import type { PendingCustomerReview } from '../api/customerReviews.ts';

describe('customerReviewSubjectTitle', () => {
  it('uses the RFQ snapshot title when the catalog service is missing', () => {
    const item: PendingCustomerReview = {
      type: 'service',
      pending_key: 'service:1',
      booking_reference: 'SBK-20260901-0002',
      service: {
        id: null,
        title: 'تصميم داخلي متكامل للمساحات السكنية (3D & 2D)',
        slug: null,
      },
      provider: { id: 'p1', name: 'إيوان', slug: 'eiwan', logo_url: null },
    };

    expect(customerReviewSubjectTitle(item, 'خدمة')).toBe(
      'تصميم داخلي متكامل للمساحات السكنية (3D & 2D)',
    );
  });

  it('falls back to the provider name then the generic label', () => {
    const item: PendingCustomerReview = {
      type: 'service',
      pending_key: 'service:2',
      booking_reference: 'SBK-1',
      service: null,
      provider: { id: 'p1', name: 'إيوان', slug: 'eiwan', logo_url: null },
    };

    expect(customerReviewSubjectTitle(item, 'خدمة')).toBe('إيوان');
    expect(
      customerReviewSubjectTitle({ ...item, provider: null }, 'خدمة'),
    ).toBe('خدمة');
  });

  it('treats RFQ bookings as custom requests', () => {
    expect(
      customerReviewServiceSource({
        type: 'service',
        pending_key: 'service:1',
        booking_source: 'rfq',
        request_reference: 'SRQ-1',
      }),
    ).toBe('rfq');
    expect(
      customerReviewServiceSource({
        type: 'service',
        pending_key: 'service:2',
        booking_source: 'direct',
      }),
    ).toBe('direct');
  });
});
