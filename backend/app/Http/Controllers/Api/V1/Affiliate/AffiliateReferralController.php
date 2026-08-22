<?php

namespace App\Http\Controllers\Api\V1\Affiliate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\ResolveAffiliateReferralRequest;
use App\Http\Requests\Affiliate\TrackAffiliateClickRequest;
use App\Services\Affiliate\AffiliateAttributionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class AffiliateReferralController extends Controller
{
    public function __construct(
        private readonly AffiliateAttributionService $attribution,
    ) {}

    public function trackClick(TrackAffiliateClickRequest $request): JsonResponse
    {
        try {
            $result = $this->attribution->recordClick(
                referralCode: $request->validated('ref'),
                productId: $request->validated('product_id'),
                sessionFingerprint: $request->validated('session_fingerprint'),
                ip: $request->ip(),
                user: $request->user(),
                trafficSource: $request->validated('traffic_source'),
                referrerUrl: $request->validated('referrer_url'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        if ($result === null) {
            return ApiResponse::success(
                data: ['attributed' => false],
                message: __('diyar.affiliate.self_referral_blocked'),
            );
        }

        return ApiResponse::success(data: [
            'attributed' => true,
            'attribution' => $result,
        ]);
    }

    public function resolve(ResolveAffiliateReferralRequest $request): JsonResponse
    {
        $attribution = $this->attribution->resolveAttributionForProduct(
            user: $request->user(),
            sessionFingerprint: $request->validated('session_fingerprint'),
            productId: $request->validated('product_id'),
        );

        if ($attribution === null && $request->filled('ref')) {
            try {
                $attribution = $this->attribution->recordClick(
                    referralCode: $request->validated('ref'),
                    productId: $request->validated('product_id'),
                    sessionFingerprint: (string) $request->validated('session_fingerprint'),
                    ip: $request->ip(),
                    user: $request->user(),
                );
            } catch (InvalidArgumentException) {
                $attribution = null;
            }
        }

        return ApiResponse::success(data: [
            'attributed' => $attribution !== null,
            'attribution' => $attribution,
        ]);
    }
}
