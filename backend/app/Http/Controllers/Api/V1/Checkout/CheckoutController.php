<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\CheckoutPreviewRequest;
use App\Http\Resources\CheckoutPreviewResource;
use App\Services\Checkout\CheckoutPreviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutPreviewService $checkoutPreview,
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

        return ApiResponse::success(data: [
            'preview' => new CheckoutPreviewResource($preview),
        ]);
    }
}
