<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahConfigFactory;
use App\Support\Http\FrontendOrigin;

final class PaymentRequestBuilder
{
    public function buildSessionRequest(Order $order, Payment $payment, User $user): PaymentSessionRequest
    {
        return new PaymentSessionRequest(
            paymentReference: (string) $payment->payment_reference,
            orderNumber: $order->order_number,
            amount: $this->formatAmount($payment->amount),
            currency: $payment->currency,
            customerName: (string) ($order->shipping_recipient_name ?? $user->name),
            customerEmail: $user->email,
            customerMobile: $this->normalizeMobile($order->shipping_phone ?? $user->phone),
            mobileCountryCode: MyFatoorahConfigFactory::mobileCountryCode(),
            language: app()->getLocale() === 'ar' ? 'ar' : 'en',
            callbackUrl: $this->callbackUrl($order),
            errorUrl: $this->callbackUrl($order),
            metadata: [
                'payment_id' => (string) $payment->id,
                'order_id' => (string) $order->id,
            ],
        );
    }

    public function buildCreationRequest(
        Order $order,
        Payment $payment,
        User $user,
        string $sessionId,
        ?string $paymentMethod = null,
    ): PaymentCreationRequest {
        return new PaymentCreationRequest(
            sessionId: $sessionId,
            paymentReference: (string) $payment->payment_reference,
            orderNumber: $order->order_number,
            amount: $this->formatAmount($payment->amount),
            currency: $payment->currency,
            customerName: (string) ($order->shipping_recipient_name ?? $user->name),
            customerEmail: $user->email,
            customerMobile: $this->normalizeMobile($order->shipping_phone ?? $user->phone),
            mobileCountryCode: MyFatoorahConfigFactory::mobileCountryCode(),
            language: app()->getLocale() === 'ar' ? 'ar' : 'en',
            callbackUrl: $this->callbackUrl($order),
            errorUrl: $this->callbackUrl($order),
            metadata: [
                'payment_id' => (string) $payment->id,
                'order_id' => (string) $order->id,
            ],
            suppliers: [],
            paymentMethod: $paymentMethod,
        );
    }

    private function callbackUrl(Order $order): string
    {
        $configured = config('myfatoorah.redirect_url');
        if (is_string($configured) && $configured !== '') {
            return rtrim($configured, '/').'/orders?highlight='.$order->id.'&payment=callback';
        }

        return FrontendOrigin::url('/orders?highlight='.$order->id.'&payment=callback');
    }

    private function normalizeMobile(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '966')) {
            $digits = substr($digits, 3);
        } elseif (str_starts_with($digits, '965')) {
            $digits = substr($digits, 3);
        }

        return substr($digits, 0, 14);
    }

    private function formatAmount(mixed $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }
}
