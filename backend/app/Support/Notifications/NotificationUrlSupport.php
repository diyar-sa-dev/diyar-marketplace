<?php

namespace App\Support\Notifications;

final class NotificationUrlSupport
{
    public static function orderUrl(string $orderId, ?string $paymentOutcome = null): string
    {
        $base = rtrim((string) config('diyar.frontend_url'), '/');
        $url = $base.'/orders?highlight='.rawurlencode($orderId);

        if ($paymentOutcome !== null && $paymentOutcome !== '') {
            $url .= '&payment='.rawurlencode($paymentOutcome);
        }

        return $url;
    }

    public static function chatConversationUrl(string $conversationId): string
    {
        $base = rtrim((string) config('diyar.frontend_url'), '/');

        return $base.'/chat?conversation='.rawurlencode($conversationId);
    }

    public static function providerBookingsUrl(?string $bookingId = null): string
    {
        $url = rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/service/bookings';

        if ($bookingId !== null && $bookingId !== '') {
            $url .= '?highlight='.rawurlencode($bookingId);
        }

        return $url;
    }

    public static function customerBookingsUrl(?string $bookingId = null): string
    {
        $url = rtrim((string) config('diyar.frontend_url'), '/').'/profile/service-bookings';

        if ($bookingId !== null && $bookingId !== '') {
            $url .= '?highlight='.rawurlencode($bookingId);
        }

        return $url;
    }

    public static function serviceBookingCanonicalUrl(string $bookingId): string
    {
        return rtrim((string) config('diyar.frontend_url'), '/').'/service-bookings/'.rawurlencode($bookingId);
    }
}
