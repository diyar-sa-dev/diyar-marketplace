<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Models\Order;
use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;

final class MyFatoorahPaymentMapper
{
    /**
     * @return array<string, mixed>
     */
    public function mapSessionRequest(PaymentSessionRequest $request): array
    {
        return [
            'PaymentMode' => 'COLLECT_DETAILS',
            'Order' => $this->mapOrder($request->amount, $request->currency, $request->orderNumber),
            'Customer' => $this->mapCustomer($request),
            'Language' => $this->mapLanguage($request->language),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function mapPaymentRequest(PaymentCreationRequest $request): array
    {
        $payload = [
            'SourceOfFund' => [
                'SessionId' => $request->sessionId,
            ],
            'Order' => $this->mapOrder($request->amount, $request->currency, $request->orderNumber),
            'Customer' => $this->mapCustomer($request),
            'IntegrationUrls' => [
                'Redirection' => $request->callbackUrl,
            ],
            'Language' => $this->mapLanguage($request->language),
            'SourceInfo' => $this->sourceInfo(),
        ];

        $gatewayMethod = MyFatoorahPaymentMethodMapper::toGatewayPaymentMethod($request->paymentMethod);
        if ($gatewayMethod !== null) {
            $payload['PaymentMethod'] = $gatewayMethod;
        }

        if ($request->suppliers !== []) {
            $payload['Suppliers'] = $request->suppliers;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapOrder(string $amount, string $currency, string $orderNumber): array
    {
        return [
            'Amount' => (float) $amount,
            'Currency' => $currency,
            'ExternalIdentifier' => $orderNumber,
        ];
    }

    private function mapLanguage(string $language): string
    {
        return str_starts_with(strtolower($language), 'ar') ? 'AR' : 'EN';
    }

    /**
     * @return array<string, mixed>
     */
    private function mapCustomer(PaymentSessionRequest|PaymentCreationRequest $request): array
    {
        return array_filter([
            'Name' => $request->customerName,
            'Email' => $request->customerEmail,
            'Mobile' => [
                'CountryCode' => $request->mobileCountryCode,
                'Number' => $request->customerMobile,
            ],
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function sourceInfo(): string
    {
        return 'DIYAR Laravel '.app()->version().' - MyFatoorah Package 2.2.4';
    }

    public function paymentReferenceForOrder(Order $order): string
    {
        return $order->order_number;
    }
}
