<?php

namespace App\Domains\Vendors\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Vendors\Requests\ReplyVendorReviewRequest;
use App\Domains\Vendors\Services\VendorReviewInboxService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorReviewInboxController extends Controller
{
    public function __construct(
        private readonly VendorReviewInboxService $reviews,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->integer('page', 1));
        $perPage = min(20, max(1, (int) $request->integer('per_page', 10)));
        $type = $request->string('type')->toString();
        $type = in_array($type, ['product', 'store'], true) ? $type : null;

        return ApiResponse::success(
            $this->reviews->list($request->user(), $page, $perPage, $type),
        );
    }

    public function reply(ReplyVendorReviewRequest $request, string $type, string $reviewId): JsonResponse
    {
        if (! in_array($type, ['product', 'store'], true)) {
            return ApiResponse::error(__('diyar.auth.forbidden'), 403);
        }

        try {
            $item = $this->reviews->reply(
                $request->user(),
                $type,
                $reviewId,
                $request->validated('reply'),
            );
        } catch (\InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['item' => $item],
            message: __('diyar.vendor.reviews.reply_sent'),
        );
    }
}
