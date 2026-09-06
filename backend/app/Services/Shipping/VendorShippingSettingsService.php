<?php

namespace App\Services\Shipping;

use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Collection;
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
            return $this->syntheticCheckoutDefaults($vendorAccountId);
        }

        return $this->normalizeForCheckout($settings);
    }

    /**
     * @param  list<string>  $vendorAccountIds
     * @return Collection<string, VendorShippingSettings>
     */
    public function batchForVendors(array $vendorAccountIds): Collection
    {
        if ($vendorAccountIds === []) {
            return collect();
        }

        $settings = VendorShippingSettings::query()
            ->whereIn('vendor_account_id', $vendorAccountIds)
            ->with('shippingProfile')
            ->get()
            ->keyBy('vendor_account_id');

        return collect($vendorAccountIds)->mapWithKeys(function (string $vendorAccountId) use ($settings) {
            $row = $settings->get($vendorAccountId);

            return [
                $vendorAccountId => $row === null || ! $row->isCheckoutEligible()
                    ? $this->syntheticCheckoutDefaults($vendorAccountId)
                    : $this->normalizeForCheckout($row),
            ];
        });
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

    private function syntheticCheckoutDefaults(string $vendorAccountId): VendorShippingSettings
    {
        return new VendorShippingSettings([
            'vendor_account_id' => $vendorAccountId,
            'carrier_enabled' => true,
            'carrier_flat_rate' => config('diyar.shipping.default_carrier_flat_rate', '30.00'),
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => false,
            'pickup_location_label' => null,
        ]);
    }

    private function normalizeForCheckout(VendorShippingSettings $settings): VendorShippingSettings
    {
        $defaultRate = config('diyar.shipping.default_carrier_flat_rate', '30.00');

        if ($settings->carrier_enabled && $settings->carrier_flat_rate === null) {
            $settings->carrier_flat_rate = $defaultRate;
        }

        $pickupIncomplete = $settings->pickup_enabled && ! filled($settings->pickup_location_label);
        $carrierUsable = $settings->carrier_enabled && $settings->carrier_flat_rate !== null;

        if ($pickupIncomplete && ! $carrierUsable) {
            return $this->syntheticCheckoutDefaults((string) $settings->vendor_account_id);
        }

        if (! $settings->carrier_enabled && $settings->pickup_enabled && $pickupIncomplete) {
            return $this->syntheticCheckoutDefaults((string) $settings->vendor_account_id);
        }

        return $settings;
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
