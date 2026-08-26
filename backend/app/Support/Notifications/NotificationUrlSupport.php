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
}
