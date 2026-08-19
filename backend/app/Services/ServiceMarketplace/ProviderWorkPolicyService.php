<?php

namespace App\Services\ServiceMarketplace;

use App\Models\ProviderWorkPolicy;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class ProviderWorkPolicyService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsert(User $user, array $attributes): ProviderWorkPolicy
    {
        $provider = ProviderAccountResolver::forUser($user);

        return DB::transaction(function () use ($provider, $attributes) {
            $policy = ProviderWorkPolicy::query()
                ->where('provider_account_id', $provider->id)
                ->lockForUpdate()
                ->first();

            $customTerms = collect($attributes['custom_terms'] ?? [])
                ->map(fn ($term) => trim((string) $term))
                ->filter(fn (string $term) => $term !== '')
                ->values()
                ->take(5)
                ->all();

            $payload = [
                'policy_enabled' => (bool) ($attributes['policy_enabled'] ?? true),
                'initial_delivery_days' => max(0, min(365, (int) ($attributes['initial_delivery_days'] ?? 7))),
                'free_revisions_included' => max(0, min(20, (int) ($attributes['free_revisions_included'] ?? 2))),
                'timeline_by_project_scope' => (bool) ($attributes['timeline_by_project_scope'] ?? true),
                'cancellation_notice_hours' => array_key_exists('cancellation_notice_hours', $attributes)
                    && $attributes['cancellation_notice_hours'] !== null
                    ? max(0, min(720, (int) $attributes['cancellation_notice_hours']))
                    : null,
                'custom_terms' => $customTerms,
            ];

            if ($policy === null) {
                return ProviderWorkPolicy::query()->create([
                    'provider_account_id' => $provider->id,
                    ...$payload,
                ]);
            }

            $policy->update($payload);

            return $policy->fresh();
        });
    }

    public function getForAuthenticatedProvider(User $user): ?ProviderWorkPolicy
    {
        $provider = $user->providerAccount;

        if ($provider === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return ProviderWorkPolicy::query()
            ->where('provider_account_id', $provider->id)
            ->first();
    }
}
