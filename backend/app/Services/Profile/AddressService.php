<?php

namespace App\Services\Profile;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class AddressService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes) {
            $isDefault = (bool) ($attributes['is_default'] ?? false);
            $hasAddresses = $user->addresses()->exists();

            if (! $hasAddresses) {
                $isDefault = true;
            }

            if ($isDefault) {
                $this->clearDefaultForUser($user);
            }

            return $user->addresses()->create([
                'label' => $attributes['label'],
                'type' => $attributes['type'],
                'recipient_name' => $attributes['recipient_name'],
                'phone' => $attributes['phone'],
                'city' => $attributes['city'] ?? null,
                'district' => $attributes['district'] ?? null,
                'street' => $attributes['street'] ?? null,
                'building' => $attributes['building'] ?? null,
                'apartment' => $attributes['apartment'] ?? null,
                'is_default' => $isDefault,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, Address $address, array $attributes): Address
    {
        $this->assertOwnership($user, $address);

        return DB::transaction(function () use ($user, $address, $attributes) {
            $isDefault = array_key_exists('is_default', $attributes)
                ? (bool) $attributes['is_default']
                : $address->is_default;

            if ($isDefault) {
                $this->clearDefaultForUser($user, $address->id);
            }

            $address->fill([
                'label' => $attributes['label'] ?? $address->label,
                'type' => $attributes['type'] ?? $address->type,
                'recipient_name' => $attributes['recipient_name'] ?? $address->recipient_name,
                'phone' => $attributes['phone'] ?? $address->phone,
                'city' => array_key_exists('city', $attributes) ? $attributes['city'] : $address->city,
                'district' => array_key_exists('district', $attributes) ? $attributes['district'] : $address->district,
                'street' => array_key_exists('street', $attributes) ? $attributes['street'] : $address->street,
                'building' => array_key_exists('building', $attributes) ? $attributes['building'] : $address->building,
                'apartment' => array_key_exists('apartment', $attributes) ? $attributes['apartment'] : $address->apartment,
                'is_default' => $isDefault,
            ])->save();

            return $address->fresh();
        });
    }

    public function delete(User $user, Address $address): void
    {
        $this->assertOwnership($user, $address);

        DB::transaction(function () use ($user, $address) {
            $wasDefault = $address->is_default;
            $address->delete();

            if ($wasDefault) {
                $next = $user->addresses()->oldest()->first();
                if ($next !== null) {
                    $next->forceFill(['is_default' => true])->save();
                }
            }
        });
    }

    public function setDefault(User $user, Address $address): Address
    {
        $this->assertOwnership($user, $address);

        return DB::transaction(function () use ($user, $address) {
            $this->clearDefaultForUser($user, $address->id);
            $address->forceFill(['is_default' => true])->save();

            return $address->fresh();
        });
    }

    private function clearDefaultForUser(User $user, ?string $exceptId = null): void
    {
        $user->addresses()->lockForUpdate()->get();

        $query = $user->addresses()->where('is_default', true);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }
        $query->update(['is_default' => false]);
    }

    private function assertOwnership(User $user, Address $address): void
    {
        if ($address->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }

    public function findOwnedAddress(User $user, string $addressId): Address
    {
        $address = Address::query()->whereKey($addressId)->first();
        if ($address === null) {
            throw new NotFoundHttpException(__('diyar.auth.not_found'));
        }

        $this->assertOwnership($user, $address);

        return $address;
    }
}
