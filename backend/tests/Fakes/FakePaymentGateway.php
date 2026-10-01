<?php

namespace Tests\Fakes;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
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

final class FakePaymentGateway implements PaymentGatewayInterface
{
    public static string $sessionId = 'test-session-001';

    public static string $paymentUrl = 'https://sandbox.myfatoorah.test/pay/001';

    public static string $gatewayPaymentId = '07076945628364902373';

    public static PaymentStatus $detailsStatus = PaymentStatus::Paid;

    public static ?string $detailsFailureReason = null;

    /** @var list<PaymentSessionRequest> */
    public static array $sessionRequests = [];

    /** @var list<PaymentCreationRequest> */
    public static array $creationRequests = [];

    public static function reset(): void
    {
        self::$sessionRequests = [];
        self::$creationRequests = [];
        self::$detailsStatus = PaymentStatus::Paid;
        self::$detailsFailureReason = null;
    }

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
        self::$sessionRequests[] = $request;

        return new PaymentSessionResult(
            sessionId: self::$sessionId,
            countryCode: 'SAU',
            testMode: true,
            scriptDomain: 'https://demo.myfatoorah.com',
        );
    }

    public function createPayment(PaymentCreationRequest $request): PaymentCreationResult
    {
        self::$creationRequests[] = $request;

        return new PaymentCreationResult(
            paymentUrl: self::$paymentUrl,
            gatewayPaymentId: self::$gatewayPaymentId,
            gatewayInvoiceId: '12345',
        );
    }

    public function getPaymentDetails(PaymentDetailsRequest $request): PaymentDetailsResult
    {
        return new PaymentDetailsResult(
            status: self::$detailsStatus,
            amount: $request->expectedAmount,
            currency: $request->expectedCurrency,
            paymentReference: $request->expectedReference,
            gatewayPaymentId: $request->gatewayPaymentId,
            gatewayInvoiceId: '12345',
            failureReason: self::$detailsFailureReason,
        );
    }

    public function refund(RefundPaymentRequest $request): RefundPaymentResult
    {
        return new RefundPaymentResult(
            gatewayRefundId: 'test-refund-'.$request->refundReference,
            amount: $request->amount,
            currency: $request->currency,
            success: true,
        );
    }
}
