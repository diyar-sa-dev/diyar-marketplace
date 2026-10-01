<?php

namespace App\Domains\Payments\Contracts;

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

interface PaymentGatewayInterface
{
    public function name(): string;

    /**
     * @return list<PaymentMethodCapability>
     */
    public function listPaymentMethods(PaymentMethodsRequest $request): array;

    public function createSession(PaymentSessionRequest $request): PaymentSessionResult;

    public function createPayment(PaymentCreationRequest $request): PaymentCreationResult;

    public function getPaymentDetails(PaymentDetailsRequest $request): PaymentDetailsResult;

    public function refund(RefundPaymentRequest $request): RefundPaymentResult;
}
