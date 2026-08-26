<?php

namespace App\Http\Controllers\Api\V1\Payment;

use App\Http\Controllers\Controller;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PaymentWebhookProcessor;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FakePaymentWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentWebhookProcessor $processor,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        if (! config('diyar.payments.use_fake_gateway')) {
            return response()->json(null, 404);
        }

        try {
            $result = $this->processor->ingestFake($request->all());
        } catch (PaymentGatewayException) {
            return ApiResponse::error(__('diyar.payment.invalid_webhook_payload'), 400);
        }

        return ApiResponse::success([
            'duplicate' => $result['duplicate'],
            'event_id' => $result['event_id'],
        ]);
    }
}
