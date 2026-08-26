<?php

namespace App\Services\Payments\Gateways;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Enums\FakePaymentScenario;
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
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Support\Str;

/**
 * Development/test payment provider with configurable scenarios.
 *
 * NEVER bound in production — see EnvironmentSafetyValidator.
 */
final class FakePaymentGateway implements PaymentGatewayInterface
{
    public const SESSION_PREFIX = 'fake-session';

    public const PAYMENT_PREFIX = 'fake-payment';

    /** @var array<string, FakePaymentScenario> */
    private static array $referenceScenarios = [];

    /** @var array<string, RefundPaymentRequest> */
    private static array $refundRequests = [];

    public static function reset(): void
    {
        self::$referenceScenarios = [];
        self::$refundRequests = [];
    }

    public static function setScenarioForReference(string $reference, FakePaymentScenario $scenario): void
    {
        self::$referenceScenarios[$reference] = $scenario;
    }

    /**
     * @return list<RefundPaymentRequest>
     */
    public static function refundRequests(): array
    {
        return array_values(self::$refundRequests);
    }

    public function name(): string
    {
        return 'fake';
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
        $scenario = $this->scenarioFor($request->paymentReference);
        $this->throwIfScenarioDemands($scenario, ['timeout', 'rate_limited', 'provider_error']);

        return new PaymentSessionResult(
            sessionId: self::SESSION_PREFIX.'-'.$request->paymentReference,
            countryCode: 'SAU',
            testMode: true,
            scriptDomain: 'https://demo.myfatoorah.com',
        );
    }

    public function createPayment(PaymentCreationRequest $request): PaymentCreationResult
    {
        $scenario = $this->scenarioFor($request->paymentReference);
        $this->throwIfScenarioDemands($scenario, ['timeout', 'rate_limited', 'provider_error']);

        $orderId = $request->metadata['order_id'] ?? '';
        $frontend = rtrim((string) config('diyar.frontend_url'), '/');
        $gatewayPaymentId = self::PAYMENT_PREFIX.'-'.$request->paymentReference;

        return new PaymentCreationResult(
            paymentUrl: $frontend.'/checkout/payment/'.$orderId.'/simulate?scenario='.$scenario->value,
            gatewayPaymentId: $gatewayPaymentId,
            gatewayInvoiceId: 'fake-invoice-'.Str::lower(Str::substr($request->paymentReference, -8)),
        );
    }

    public function getPaymentDetails(PaymentDetailsRequest $request): PaymentDetailsResult
    {
        $scenario = $this->scenarioFor($request->expectedReference);
        $this->throwIfScenarioDemands($scenario, ['timeout', 'rate_limited', 'provider_error']);

        $status = match ($scenario) {
            FakePaymentScenario::Fail => PaymentStatus::Failed,
            FakePaymentScenario::Processing, FakePaymentScenario::WebhookDelay => PaymentStatus::Processing,
            FakePaymentScenario::RequiresAction => PaymentStatus::RequiresAction,
            FakePaymentScenario::UnknownResult, FakePaymentScenario::WebhookOutOfOrder => PaymentStatus::Unknown,
            default => PaymentStatus::Paid,
        };

        return new PaymentDetailsResult(
            status: $status,
            amount: $request->expectedAmount,
            currency: $request->expectedCurrency,
            paymentReference: $request->expectedReference,
            gatewayPaymentId: $request->gatewayPaymentId ?? self::PAYMENT_PREFIX.'-'.$request->expectedReference,
            gatewayInvoiceId: 'fake-invoice-'.Str::lower(Str::substr($request->expectedReference, -8)),
            failureReason: $status === PaymentStatus::Failed ? 'Simulated payment failure' : null,
        );
    }

    public function refund(RefundPaymentRequest $request): RefundPaymentResult
    {
        self::$refundRequests[$request->refundReference] = $request;

        $scenario = $this->scenarioFor($request->paymentReference);

        if ($scenario === FakePaymentScenario::Fail) {
            throw PaymentGatewayException::operationFailed('Simulated refund failure');
        }

        return new RefundPaymentResult(
            gatewayRefundId: 'fake-refund-'.$request->refundReference,
            amount: $request->amount,
            currency: $request->currency,
            success: true,
        );
    }

    private function scenarioFor(string $reference): FakePaymentScenario
    {
        return self::$referenceScenarios[$reference]
            ?? FakePaymentScenario::tryFromConfig(config('diyar.payments.fake_scenario'));
    }

    /**
     * @param  list<string>  $scenarioValues
     */
    private function throwIfScenarioDemands(FakePaymentScenario $scenario, array $scenarioValues): void
    {
        if (! in_array($scenario->value, $scenarioValues, true)) {
            return;
        }

        throw match ($scenario) {
            FakePaymentScenario::RateLimited => PaymentGatewayException::rateLimited('Simulated rate limit'),
            FakePaymentScenario::Timeout => PaymentGatewayException::timeout('Simulated provider timeout'),
            default => PaymentGatewayException::operationFailed('Simulated provider error'),
        };
    }
}
