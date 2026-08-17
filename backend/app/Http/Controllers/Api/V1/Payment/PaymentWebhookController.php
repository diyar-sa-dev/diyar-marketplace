<?php

namespace App\Http\Controllers\Api\V1\Payment;

use App\Http\Controllers\Controller;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\PaymentWebhookProcessor;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentWebhookProcessor $processor,
    ) {}

    public function myfatoorah(Request $request): JsonResponse
    {
        if (config('myfatoorah.webhook_secret_key') === '') {
            return response()->json(null, 404);
        }

        try {
            $result = $this->processor->handle(
                gateway: 'myfatoorah',
                rawBody: $request->getContent(),
                headers: collect($request->headers->all())
                    ->mapWithKeys(fn ($values, $key) => [$key => is_array($values) ? ($values[0] ?? '') : $values])
                    ->all(),
            );
        } catch (PaymentGatewayException) {
            return response()->json(null, 400);
        }

        if (! $result['accepted']) {
            return response()->json(null, 401);
        }

        return ApiResponse::success(['duplicate' => $result['duplicate']]);
    }
}
