<?php

namespace App\Domains\Payments\Services\Gateways;

use App\Core\Support\Http\FrontendOrigin;
use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Services\DTO\PaymentCreationRequest;
use App\Domains\Payments\Services\DTO\PaymentCreationResult;
use App\Domains\Payments\Services\DTO\PaymentDetailsRequest;
use App\Domains\Payments\Services\DTO\PaymentDetailsResult;
use App\Domains\Payments\Services\DTO\PaymentMethodCapability;
use App\Domains\Payments\Services\DTO\PaymentMethodsRequest;
use App\Domains\Payments\Services\DTO\PaymentSessionRequest;
use App\Domains\Payments\Services\DTO\PaymentSessionResult;
use App\Domains\Payments\Services\DTO\RefundPaymentRequest;
use App\Domains\Payments\Services\DTO\RefundPaymentResult;
use App\Enums\PaymentStatus;

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
