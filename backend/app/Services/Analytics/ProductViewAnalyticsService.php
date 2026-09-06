<?php

namespace App\Services\Analytics;

use App\Enums\AnalyticsEventType;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

final class ProductViewAnalyticsService
{
    public function __construct(
        private readonly AnalyticsEventRecorder $recorder,
    ) {}

    public function recordFromProductShow(Request $request, Product $product): void
    {
        if (! config('diyar.analytics.events_enabled', true)) {
            return;
        }

        if ($this->shouldSkip($request)) {
            return;
        }

        $dedupeKey = $this->dedupeKey($request, $product);
        $dedupeSeconds = (int) config('diyar.analytics.view_dedupe_seconds', 1800);

        if (! Cache::add($dedupeKey, 1, $dedupeSeconds)) {
            return;
        }

        /** @var User|null $user */
        $user = $request->user();

        $this->recorder->record(
            AnalyticsEventType::ProductViewed,
            user: $user,
            sessionId: $this->resolveSessionId($request),
            subjectType: 'product',
            subjectId: $product->id,
            vendorAccountId: $product->vendor_account_id,
            payload: [
                'source' => 'product_detail',
                'locale' => app()->getLocale(),
            ],
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

    private function dedupeKey(Request $request, Product $product): string
    {
        return sprintf(
            'analytics:view:product:%s:%s',
            $product->id,
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
