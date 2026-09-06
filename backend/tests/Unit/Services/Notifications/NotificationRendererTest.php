<?php

namespace Tests\Unit\Services\Notifications;

use App\Enums\NotificationType;
use App\Models\User;
use App\Services\Notifications\NotificationRenderer;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NotificationRendererTest extends TestCase
{
    #[Test]
    public function it_localizes_return_status_in_arabic(): void
    {
        $user = new User;
        $user->preferences = ['locale' => 'ar'];

        $rendered = app(NotificationRenderer::class)->render(
            $user,
            NotificationType::ReturnUpdated,
            ['status' => 'rejected'],
        );

        $this->assertSame('تحديث طلب الإرجاع', $rendered['title']);
        $this->assertSame('حالة طلب الإرجاع الآن: مرفوض.', $rendered['body']);
        $this->assertStringNotContainsString('rejected', $rendered['body']);
    }

    #[Test]
    public function it_localizes_all_return_statuses_in_english(): void
    {
        $user = new User;
        $user->preferences = ['locale' => 'en'];
        $renderer = app(NotificationRenderer::class);

        $labels = [
            'requested' => 'Requested',
            'under_review' => 'Under review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'awaiting_return' => 'Awaiting return',
            'received' => 'Received',
            'inspected' => 'Inspected',
            'refunded' => 'Refunded',
            'cancelled' => 'Cancelled',
        ];

        foreach ($labels as $status => $label) {
            $rendered = $renderer->render(
                $user,
                NotificationType::ReturnUpdated,
                ['status' => $status],
            );

            $this->assertSame("Your return request status is now {$label}.", $rendered['body'], $status);
            $this->assertStringNotContainsString($status, $rendered['body']);
        }
    }

    #[Test]
    public function it_fills_booking_service_title_from_detail_lines(): void
    {
        $user = new User;
        $user->preferences = ['locale' => 'ar'];

        $rendered = app(NotificationRenderer::class)->render(
            $user,
            NotificationType::BookingCompleted,
            [
                'reference' => 'SBK-20260830-0003',
                'detail_lines' => [
                    ['label' => 'service', 'value' => 'تركيب الستائر'],
                ],
            ],
        );

        $this->assertSame('اكتمل الحجز', $rendered['title']);
        $this->assertSame('اكتمل الحجز SBK-20260830-0003 لخدمة تركيب الستائر.', $rendered['body']);
        $this->assertStringNotContainsString('service_title', $rendered['body']);
    }

    #[Test]
    public function it_mentions_the_created_booking_when_an_offer_is_accepted(): void
    {
        $user = new User;
        $user->preferences = ['locale' => 'ar'];

        $rendered = app(NotificationRenderer::class)->render(
            $user,
            NotificationType::OfferAccepted,
            [
                'request_reference' => 'SRQ-20260901-0001',
                'booking_reference' => 'SBK-20260901-0002',
            ],
        );

        $this->assertSame('تم قبول العرض', $rendered['title']);
        $this->assertStringContainsString('SRQ-20260901-0001', $rendered['body']);
        $this->assertStringContainsString('SBK-20260901-0002', $rendered['body']);
        $this->assertStringContainsString('الحجوزات', $rendered['body']);
    }
}
