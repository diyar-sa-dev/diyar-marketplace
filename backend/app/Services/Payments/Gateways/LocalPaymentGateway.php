<?php

namespace App\Services\Payments\Gateways;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentCreationResult;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\DTO\PaymentDetailsResult;
use App\Services\Payments\DTO\PaymentMethodCapability;
use App\Services\Payments\DTO\PaymentMethodsRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;
use App\Services\Payments\DTO\PaymentSessionResult;
use App\Services\Payments\DTO\RefundPaymentRequest;
use App\Services\Payments\DTO\RefundPaymentResult;
use App\Support\Http\FrontendOrigin;

/**
 * Local/dev payment gateway — simulates MyFatoorah without external API calls.
 */
final class LocalPaymentGateway implements PaymentGatewayInterface
{
    public const SESSION_ID = 'local-dev-session';

    public const PAYMENT_URL = 'http://localhost:3000/orders?payment=local-dev';

    public const GATEWAY_PAYMENT_ID = 'local-dev-payment-001';

    public function name(): string
    {
        return 'myfatoorah';
    }

    public function listPaymentMethods(PaymentMethodsRequest $request): array
    {
        return [
            new PaymentMethodCapability(code: 'mada', available: true, label: 'Mada'),
            new PaymentMethodCapability(code: 'card', available: true, label: 'Visa/Mastercard'),
            new PaymentMethodCapability(code: 'apple_pay', available: true, label: 'Apple Pay'),
            new PaymentMethodCapability(code: 'tabby', available: true, label: 'Tabby'),
        ];
    }

    public function createSession(PaymentSessionRequest $request): PaymentSessionResult
    {
        return new PaymentSessionResult(
            sessionId: self::SESSION_ID.'-'.$request->paymentReference,
            countryCode: 'SAU',
            testMode: true,
            scriptDomain: 'https://demo.myfatoorah.com',
        );
    }

    public function createPayment(PaymentCreationRequest $request): PaymentCreationResult
    {
        $orderId = $request->metadata['order_id'] ?? '';

        return new PaymentCreationResult(
            paymentUrl: FrontendOrigin::url('/checkout/payment/'.$orderId.'/simulate'),
            gatewayPaymentId: self::GATEWAY_PAYMENT_ID.'-'.$request->paymentReference,
            gatewayInvoiceId: 'local-invoice-001',
        );
    }

    public function getPaymentDetails(PaymentDetailsRequest $request): PaymentDetailsResult
    {
        return new PaymentDetailsResult(
            status: PaymentStatus::Paid,
            amount: $request->expectedAmount,
            currency: $request->expectedCurrency,
            paymentReference: $request->expectedReference,
            gatewayPaymentId: $request->gatewayPaymentId ?? self::GATEWAY_PAYMENT_ID,
            gatewayInvoiceId: 'local-invoice-001',
            failureReason: null,
        );
    }

    public function refund(RefundPaymentRequest $request): RefundPaymentResult
    {
        return new RefundPaymentResult(
            gatewayRefundId: 'local-refund-'.$request->refundReference,
            amount: $request->amount,
            currency: $request->currency,
            success: true,
        );
    }
}
