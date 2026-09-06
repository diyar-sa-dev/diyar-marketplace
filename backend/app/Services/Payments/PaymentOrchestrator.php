<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;

/**
 * Provider-agnostic checkout payment entry point.
 *
 * Controllers should depend on this service rather than gateway-specific adapters.
 */
final class PaymentOrchestrator
{
    public function __construct(
        private readonly PaymentApplicationService $payments,
        private readonly PaymentMethodResolver $methods,
    ) {}

    /**
     * @return array{payment: Payment, session: array<string, mixed>, methods: list<array<string, mixed>>, attempt_id: string}
     */
    public function initiate(Order $order, User $user, string $idempotencyKey): array
    {
        return $this->payments->initiate($order, $user, $idempotencyKey);
    }

    /**
     * @return array{payment: Payment, payment_url: string, attempt_id: string}
     */
    public function submit(
        Order $order,
        User $user,
        string $sessionId,
        string $idempotencyKey,
        ?string $paymentMethodRaw,
    ): array {
        return $this->payments->submit(
            $order,
            $user,
            $sessionId,
            $idempotencyKey,
            $paymentMethodRaw,
        );
    }

    public function show(Order $order, User $user): Payment
    {
        return $this->payments->show($order, $user);
    }

    /**
     * @return array{status: string, message: string, authoritative: bool}
     */
    public function browserCallback(Order $order, User $user, ?string $gatewayPaymentId): array
    {
        return $this->payments->browserCallback($order, $user, $gatewayPaymentId);
    }

    /**
     * @return array{status: string, redirect_url: string}
     */
    public function simulateLocalOutcome(Order $order, User $user, string $attemptId, string $outcome): array
    {
        return $this->payments->simulateLocalOutcome($order, $user, $attemptId, $outcome);
    }
}
