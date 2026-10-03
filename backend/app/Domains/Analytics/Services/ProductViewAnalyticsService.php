<?php

namespace App\Domains\Analytics\Services;

use App\Enums\AnalyticsEventType;
use App\Domains\Analytics\Jobs\RecordAnalyticsEventJob;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

final class ProductViewAnalyticsService
{
    public function recordFromProductShow(Request $request, Product $product): void
    {
        $this->recordView($request, $product->id, $product->vendor_account_id);
    }

    public function recordView(Request $request, string $productId, ?string $vendorAccountId): void
    {
        if (! config('diyar.analytics.events_enabled', true)) {
            return;
        }

        if ($this->shouldSkip($request)) {
            return;
        }

        $dedupeKey = $this->dedupeKey($request, $productId);
        $dedupeSeconds = (int) config('diyar.analytics.view_dedupe_seconds', 1800);

        if (! Cache::add($dedupeKey, 1, $dedupeSeconds)) {
            return;
        }

        /** @var User|null $user */
        $user = $request->user();

        RecordAnalyticsEventJob::dispatch(
            eventType: AnalyticsEventType::ProductViewed->value,
            userId: $user?->id,
            sessionId: $this->resolveSessionId($request),
            subjectType: 'product',
            subjectId: $productId,
            vendorAccountId: $vendorAccountId,
            providerAccountId: null,
            payload: [
                'source' => 'product_detail',
                'locale' => app()->getLocale(),
            ],
            occurredAtIso: now()->toIso8601String(),
        );
    }

    private function shouldSkip(Request $request): bool
    {
        if ($request->headers->get('Purpose') === 'prefetch'
            || $request->headers->get('Sec-Purpose') === 'prefetch'
            || $request->headers->get('X-Purpose') === 'prefetch') {
            return true;
        }

        $userAgent = strtolower((string) $request->userAgent());
        foreach (['bot', 'crawler', 'spider', 'slurp', 'facebookexternalhit'] as $needle) {
            if (str_contains($userAgent, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function dedupeKey(Request $request, string $productId): string
    {
        return sprintf(
            'analytics:view:product:%s:%s',
            $productId,
            hash('sha256', $this->resolveSessionId($request)),
        );
    }

    private function resolveSessionId(Request $request): string
    {
        if ($request->user() !== null) {
            return 'user:'.$request->user()->id;
        }

        $headerSession = $request->header('X-Analytics-Session');
        if (is_string($headerSession) && $headerSession !== '') {
            return 'session:'.substr(hash('sha256', $headerSession), 0, 32);
        }

        if ($request->hasSession()) {
            return 'session:'.$request->session()->getId();
        }

        return 'anon:'.hash('sha256', $request->ip().'|'.substr((string) $request->userAgent(), 0, 120));
    }
}
