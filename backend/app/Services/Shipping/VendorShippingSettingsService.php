<?php

namespace App\Services\Shipping;

use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class VendorShippingSettingsService
{
    public function resolveForVendorAccount(VendorAccount $vendorAccount): ?VendorShippingSettings
    {
        return VendorShippingSettings::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->first();
    }

    public function requireForCheckout(string $vendorAccountId): VendorShippingSettings
    {
        $settings = VendorShippingSettings::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->first();

        if ($settings === null || ! $settings->isCheckoutEligible()) {
            throw new UnprocessableEntityHttpException(__('diyar.shipping.vendor_not_configured'));
        }

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsert(User $user, array $attributes): VendorShippingSettings
    {
        $vendorAccount = $user->vendorAccount;

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        $this->assertAtLeastOneMethod($attributes);

        return DB::transaction(function () use ($vendorAccount, $attributes) {
            $settings = VendorShippingSettings::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->lockForUpdate()
                ->first();

            $payload = [
                'carrier_enabled' => (bool) ($attributes['carrier_enabled'] ?? false),
                'carrier_flat_rate' => $attributes['carrier_flat_rate'] ?? null,
                'carrier_free_shipping_enabled' => (bool) ($attributes['carrier_free_shipping_enabled'] ?? false),
                'carrier_free_shipping_threshold' => $attributes['carrier_free_shipping_threshold'] ?? null,
                'pickup_enabled' => (bool) ($attributes['pickup_enabled'] ?? false),
                'pickup_location_label' => $attributes['pickup_location_label'] ?? null,
            ];

            if ($settings === null) {
                return VendorShippingSettings::query()->create([
                    'vendor_account_id' => $vendorAccount->id,
                    ...$payload,
                ]);
            }

            $settings->update($payload);

            return $settings->fresh();
        });
    }

    public function getForAuthenticatedVendor(User $user): ?VendorShippingSettings
    {
        $vendorAccount = $user->vendorAccount;

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $this->resolveForVendorAccount($vendorAccount);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function assertAtLeastOneMethod(array $attributes): void
    {
        $carrier = (bool) ($attributes['carrier_enabled'] ?? false);
        $pickup = (bool) ($attributes['pickup_enabled'] ?? false);

        if (! $carrier && ! $pickup) {
            throw new UnprocessableEntityHttpException(__('diyar.shipping.at_least_one_method'));
        }
    }
}
