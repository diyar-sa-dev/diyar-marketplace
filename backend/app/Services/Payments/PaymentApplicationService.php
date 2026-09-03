<?php

namespace App\Services\Payments;

use App\Enums\AnalyticsEventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentAttemptStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\User;
use App\Services\Analytics\AnalyticsEventRecorder;
use App\Services\Order\PaymentStateService;
use App\Services\Payments\DTO\PaymentMethodCapability;
use App\Services\Payments\DTO\PaymentMethodsRequest;
use App\Services\Payments\DTO\PaymentSessionResult;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\Gateways\FakePaymentGateway;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PaymentApplicationService
{
    public function __construct(
        private readonly PaymentGatewayManager $gateways,
        private readonly PaymentRequestBuilder $requestBuilder,
        private readonly PaymentAllocationSnapshotService $allocations,
        private readonly PaymentMethodResolver $paymentMethods,
        private readonly PaymentStateService $paymentStates,
        private readonly AnalyticsEventRecorder $analyticsEvents,
    ) {}

    /**
     * @return array{payment: Payment, session: array<string, mixed>, methods: list<array<string, mixed>>, attempt_id: string}
     */
    public function initiate(Order $order, User $user, string $idempotencyKey): array
    {
        $this->assertPayableOrder($order, $user);

        $payment = $this->resolvePayment($order);
        $this->assertPaymentAmountMatchesOrder($payment, $order);

        if (in_array($payment->status, [PaymentStatus::Failed, PaymentStatus::Expired], true)) {
            $payment = app(PaymentStateService::class)->transition($payment, PaymentStatus::Pending, [
                'failure_reason' => null,
                'failed_at' => null,
            ]);
        }

        $gateway = $this->gateways->driver($payment->gateway);

        $existingAttempt = $payment->attempts()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existingAttempt !== null) {
            if ($existingAttempt->gateway_session_id !== null) {
                return $this->buildInitiationResponse(
                    $payment,
                    $existingAttempt,
                    $gateway->listPaymentMethods($this->methodsRequest($payment)),
                );
            }

            $existingAttempt->delete();
        }

        try {
            return DB::transaction(function () use ($order, $payment, $gateway, $idempotencyKey, $user) {
                $attempt = $payment->attempts()->create([
                    'idempotency_key' => $idempotencyKey,
                    'status' => PaymentAttemptStatus::Pending,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'metadata' => [
                        'order_number' => $order->order_number,
                    ],
                ]);

                $this->allocations->snapshotForPayment($payment, $attempt);

                $session = $gateway->createSession(
                    $this->requestBuilder->buildSessionRequest($order, $payment, $user)
                );

                $attempt->update([
                    'status' => PaymentAttemptStatus::SessionCreated,
                    'gateway_session_id' => $session->sessionId,
                ]);

                return $this->buildInitiationResponse(
                    $payment->fresh(),
                    $attempt->fresh(),
                    $gateway->listPaymentMethods($this->methodsRequest($payment)),
                    $session,
                );
            });
        } catch (QueryException $exception) {
            if ($this->isAttemptIdempotencyViolation($exception)) {
                $existingAttempt = $payment->attempts()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingAttempt !== null && $existingAttempt->gateway_session_id !== null) {
                    return $this->buildInitiationResponse(
                        $payment->fresh(),
                        $existingAttempt,
                        $gateway->listPaymentMethods($this->methodsRequest($payment)),
                    );
                }
            }

            throw $exception;
        } catch (PaymentGatewayException $exception) {
            throw new UnprocessableEntityHttpException($exception->getMessage());
        } catch (\RuntimeException $exception) {
            throw new UnprocessableEntityHttpException($exception->getMessage());
        }
    }

    /**
     * @return array{payment: Payment, payment_url: string, attempt_id: string}
     */
    public function submit(Order $order, User $user, string $sessionId, string $idempotencyKey, ?string $paymentMethod = null): array
    {
        $this->assertOrderOwner($order, $user);

        $payment = $this->resolvePayment($order);

        $attempt = $payment->attempts()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($attempt !== null
            && $attempt->gateway_session_id === $sessionId
            && $attempt->status === PaymentAttemptStatus::Submitted
            && $attempt->gateway_payment_url !== null) {
            return [
                'payment' => $payment->fresh(),
                'payment_url' => (string) $attempt->gateway_payment_url,
                'attempt_id' => $attempt->id,
            ];
        }

        $this->assertPayableOrder($order, $user);
        $this->assertPaymentAmountMatchesOrder($payment, $order);

        $gateway = $this->gateways->driver($payment->gateway);

        if ($attempt === null || $attempt->gateway_session_id !== $sessionId) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.invalid_session'));
        }

        $gatewayMethods = $gateway->listPaymentMethods($this->methodsRequest($payment));
        $canonicalMethod = $paymentMethod !== null
            ? $this->paymentMethods->parseRequired($paymentMethod)
            : null;
        $gatewayMethodCode = $canonicalMethod !== null
            ? $this->paymentMethods->assertAvailable($canonicalMethod, $gatewayMethods)
            : null;

        $lockedState = DB::transaction(function () use ($payment, $idempotencyKey, $sessionId) {
            $payment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();

            $attempt = PaymentAttempt::query()
                ->where('payment_id', $payment->id)
                ->where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($attempt === null || $attempt->gateway_session_id !== $sessionId) {
                throw new UnprocessableEntityHttpException(__('diyar.payment.invalid_session'));
            }

            if ($attempt->status === PaymentAttemptStatus::Submitted && $attempt->gateway_payment_url !== null) {
                return [
                    'replay' => true,
                    'payment' => $payment,
                    'attempt' => $attempt,
                ];
            }

            $this->paymentStates->transition($payment, PaymentStatus::Processing, source: 'submit');

            return [
                'replay' => false,
                'payment' => $payment->fresh(),
                'attempt' => $attempt->fresh(),
            ];
        });

        if ($lockedState['replay']) {
            return [
                'payment' => $lockedState['payment']->fresh(),
                'payment_url' => (string) $lockedState['attempt']->gateway_payment_url,
                'attempt_id' => $lockedState['attempt']->id,
            ];
        }

        /** @var Payment $lockedPayment */
        $lockedPayment = $lockedState['payment'];
        /** @var PaymentAttempt $lockedAttempt */
        $lockedAttempt = $lockedState['attempt'];

        try {
            $result = $gateway->createPayment(
                $this->requestBuilder->buildCreationRequest($order, $lockedPayment, $user, $sessionId, $gatewayMethodCode)
            );
        } catch (PaymentGatewayException $exception) {
            throw new UnprocessableEntityHttpException($exception->getMessage());
        }

        return DB::transaction(function () use (
            $lockedPayment,
            $lockedAttempt,
            $result,
            $canonicalMethod,
            $paymentMethod,
            $user,
            $order,
        ) {
            $payment = Payment::query()->whereKey($lockedPayment->id)->lockForUpdate()->firstOrFail();

            $attempt = PaymentAttempt::query()
                ->whereKey($lockedAttempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status === PaymentAttemptStatus::Submitted && $attempt->gateway_payment_url !== null) {
                return [
                    'payment' => $payment->fresh(),
                    'payment_url' => (string) $attempt->gateway_payment_url,
                    'attempt_id' => $attempt->id,
                ];
            }

            $attempt->update([
                'status' => PaymentAttemptStatus::Submitted,
                'gateway_payment_id' => $result->gatewayPaymentId,
                'gateway_invoice_id' => $result->gatewayInvoiceId,
                'gateway_payment_url' => $result->paymentUrl,
                'metadata' => array_merge($attempt->metadata ?? [], array_filter([
                    'payment_method' => $canonicalMethod?->value ?? $paymentMethod,
                ])),
            ]);

            $payment->update(array_filter([
                'gateway_payment_id' => $result->gatewayPaymentId ?? $payment->gateway_payment_id,
                'gateway_invoice_id' => $result->gatewayInvoiceId ?? $payment->gateway_invoice_id,
                'payment_method' => $canonicalMethod?->value ?? $paymentMethod,
            ]));

            $this->analyticsEvents->record(
                AnalyticsEventType::PaymentStarted,
                user: $user,
                subjectType: 'payment',
                subjectId: $payment->id,
                payload: ['order_id' => $order->id, 'attempt_id' => $attempt->id],
            );

            return [
                'payment' => $payment->fresh(),
                'payment_url' => $result->paymentUrl,
                'attempt_id' => $attempt->id,
            ];
        });
    }

    /**
     * @return array{status: string, redirect_url: string}
     */
    public function simulateLocalOutcome(Order $order, User $user, string $attemptId, string $outcome): array
    {
        if (! config('diyar.payments.use_fake_gateway')) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.simulation_unavailable'));
        }

        $this->assertPayableOrder($order, $user);

        $payment = $this->resolvePayment($order);
        $payment = $this->preparePaymentForSimulation($payment);
        $attempt = $payment->attempts()->whereKey($attemptId)->first();

        if ($attempt === null) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.invalid_session'));
        }

        $finalizer = app(PaymentFinalizationService::class);
        $frontend = rtrim((string) config('diyar.frontend_url'), '/');
        $redirectBase = $frontend.'/orders?highlight='.$order->id;

        $payment = match ($outcome) {
            'success' => $finalizer->finalizePaid(
                $payment->fresh(),
                $attempt->gateway_payment_id ?? FakePaymentGateway::PAYMENT_PREFIX.'-'.$payment->payment_reference,
                $attempt->gateway_invoice_id ?? 'local-invoice-001',
            ),
            'expired' => $this->markRetryableFailure(
                $finalizer,
                $payment,
                __('diyar.payment.simulated_expired'),
                PaymentStatus::Expired,
            ),
            default => $this->markRetryableFailure(
                $finalizer,
                $payment,
                __('diyar.payment.simulated_failed'),
                PaymentStatus::Failed,
            ),
        };

        $query = match ($outcome) {
            'success' => 'paid',
            'expired' => 'expired',
            default => 'failed',
        };

        return [
            'status' => $payment->status->value,
            'redirect_url' => $redirectBase.'&payment='.$query,
        ];
    }

    public function show(Order $order, User $user): Payment
    {
        $this->assertOrderOwner($order, $user);

        return $this->resolvePayment($order);
    }

    /**
     * @return array{status: string, message: string, authoritative: bool}
     */
    public function browserCallback(Order $order, User $user, ?string $gatewayPaymentId): array
    {
        $payment = $this->show($order, $user);

        if ($gatewayPaymentId !== null && $payment->gateway_payment_id === null) {
            $payment->update(['gateway_payment_id' => $gatewayPaymentId]);
        }

        return [
            'status' => $payment->status->value,
            'message' => __('diyar.payment.callback_informational'),
            'authoritative' => false,
        ];
    }

    private function resolvePayment(Order $order): Payment
    {
        $payment = $order->payment;

        if ($payment === null) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.not_found'));
        }

        if ($payment->payment_reference === null) {
            $payment->update([
                'payment_reference' => $order->order_number,
                'gateway' => $payment->gateway ?? config('diyar.payments.gateway'),
            ]);
            $payment = $payment->fresh();
        }

        return $payment;
    }

    private function assertPaymentAmountMatchesOrder(Payment $payment, Order $order): void
    {
        $paymentAmount = number_format((float) $payment->amount, 2, '.', '');
        $orderTotal = number_format((float) $order->grand_total, 2, '.', '');

        if (bccomp($paymentAmount, $orderTotal, 2) !== 0) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.amount_mismatch'));
        }

        if ($payment->currency !== config('diyar.payments.currency', 'SAR')) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.currency_mismatch'));
        }
    }

    private function methodsRequest(Payment $payment): PaymentMethodsRequest
    {
        return new PaymentMethodsRequest(
            amount: number_format((float) $payment->amount, 2, '.', ''),
            currency: $payment->currency,
            applePayEnabled: (bool) config('myfatoorah.register_apple_pay'),
        );
    }

    private function assertPayableOrder(Order $order, User $user): void
    {
        $this->assertOrderOwner($order, $user);

        if ($order->status !== OrderStatus::Pending) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.order_not_payable'));
        }

        $payment = $order->payment;

        if ($payment === null || ! in_array($payment->status, [
            PaymentStatus::Pending,
            PaymentStatus::Processing,
            PaymentStatus::RequiresAction,
            PaymentStatus::Failed,
            PaymentStatus::Expired,
            PaymentStatus::Unknown,
        ], true)) {
            throw new ConflictHttpException(__('diyar.payment.already_processed'));
        }
    }

    private function assertOrderOwner(Order $order, User $user): void
    {
        if ($order->user_id !== $user->id && ! $user->hasRole('admin')) {
            throw new UnprocessableEntityHttpException(__('diyar.auth.forbidden'));
        }
    }

    private function isAttemptIdempotencyViolation(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unique') && str_contains($message, 'idempotency');
    }

    /**
     * @param  list<PaymentMethodCapability>  $methods
     * @return array{payment: Payment, session: array<string, mixed>, methods: list<array<string, mixed>>, attempt_id: string}
     */
    private function buildInitiationResponse(
        Payment $payment,
        PaymentAttempt $attempt,
        array $methods,
        ?PaymentSessionResult $session = null,
    ): array {
        $sessionData = $session ? [
            'session_id' => $session->sessionId,
            'country_code' => $session->countryCode,
            'test_mode' => $session->testMode,
            'script_domain' => $session->scriptDomain,
        ] : [
            'session_id' => (string) $attempt->gateway_session_id,
            'country_code' => config('diyar.payments.currency') === 'SAR' ? 'SAU' : config('myfatoorah.country_iso', 'SAU'),
            'test_mode' => (bool) config('myfatoorah.test_mode', true),
            'script_domain' => null,
        ];

        return [
            'payment' => $payment,
            'session' => $sessionData,
            'methods' => $this->paymentMethods->presentCheckoutMethods($methods),
            'attempt_id' => $attempt->id,
            'simulated' => config('diyar.payments.use_fake_gateway'),
        ];
    }

    private function markRetryableFailure(
        PaymentFinalizationService $finalizer,
        Payment $payment,
        string $reason,
        PaymentStatus $status,
    ): Payment {
        $payment = $finalizer->markFailed($payment->fresh(), $reason, $status);

        return $this->paymentStates->transition($payment, PaymentStatus::Pending, [
            'failure_reason' => null,
            'failed_at' => null,
        ], source: 'simulate_retry');
    }

    private function preparePaymentForSimulation(Payment $payment): Payment
    {
        if (! in_array($payment->status, [PaymentStatus::Failed, PaymentStatus::Expired], true)) {
            return $payment;
        }

        return $this->paymentStates->transition($payment, PaymentStatus::Pending, [
            'failure_reason' => null,
            'failed_at' => null,
        ], source: 'simulate_retry');
    }
}
