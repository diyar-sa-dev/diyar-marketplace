<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\CheckoutPreviewRequest;
use App\Http\Resources\CheckoutPreviewResource;
use App\Enums\AnalyticsEventType;
use App\Services\Analytics\AnalyticsEventRecorder;
use App\Services\Checkout\CheckoutPreviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutPreviewService $checkoutPreview,
        private readonly AnalyticsEventRecorder $analyticsEvents,
    ) {}

    public function preview(CheckoutPreviewRequest $request): JsonResponse
    {
        try {
            $preview = $this->checkoutPreview->preview(
                user: $request->user(),
                shippingAddressId: $request->validated('shipping_address_id'),
                deliverySelections: $request->validated('vendor_delivery_selections'),
                vendorCoupons: $request->validated('vendor_coupons') ?? [],
            );
        } catch (UnprocessableEntityHttpException|InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $this->recordCheckoutStarted($request);

        return ApiResponse::success(data: [
            'preview' => new CheckoutPreviewResource($preview),
        ]);
    }

    private function recordCheckoutStarted(Request $request): void
    {
        $user = $request->user();
        if ($user === null) {
            return;
        }

        $dedupeKey = sprintf('analytics:checkout_started:%s', $user->id);
        if (! Cache::add($dedupeKey, 1, (int) config('diyar.analytics.checkout_dedupe_seconds', 3600))) {
            return;
        }

        $this->analyticsEvents->record(
            AnalyticsEventType::CheckoutStarted,
            user: $user,
            sessionId: $request->hasSession() ? (string) $request->session()->getId() : null,
            subjectType: 'user',
            subjectId: $user->id,
        );
    }
}
