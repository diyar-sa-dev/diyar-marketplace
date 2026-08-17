<?php

namespace App\Contracts\Payments;

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
