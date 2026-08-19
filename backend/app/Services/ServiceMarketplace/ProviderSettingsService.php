<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\SaudiBank;
use App\Models\ProviderAccount;
use App\Models\ProviderBankAccount;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use App\Services\Profile\ProfileService;
use App\Support\Finance\IbanValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ProviderSettingsService
{
    public function __construct(
        private readonly MediaUploadService $media,
        private readonly ProfileService $profile,
    ) {}

    /**
     * @return array{provider: ProviderAccount, user: User}
     */
    public function getForUser(User $user): array
    {
        $provider = ProviderAccountResolver::forUser($user);

        return [
            'provider' => $provider->load('activeBankAccounts'),
            'user' => $user->fresh(),
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateProfile(User $user, array $attributes): array
    {
        $provider = ProviderAccountResolver::forUser($user);
        $updates = [];

        if (array_key_exists('specialty', $attributes)) {
            $updates['business_name'] = $attributes['specialty'];
        }

        if (array_key_exists('bio', $attributes)) {
            $updates['bio'] = $attributes['bio'];
        }

        if (array_key_exists('work_areas', $attributes)) {
            $updates['location'] = $attributes['work_areas'];
        }

        if ($updates !== []) {
            $provider->fill($updates)->save();
        }

        return $this->getForUser($user);
    }

    /**
     * @param  array<int, array<string, mixed>>  $hours
     */
    public function updateWorkingHours(User $user, array $hours): array
    {
        $provider = ProviderAccountResolver::forUser($user);

        $normalized = collect($hours)
            ->map(function (array $entry) {
                $isClosed = (bool) ($entry['is_closed'] ?? false);

                return [
                    'day' => (string) $entry['day'],
                    'is_closed' => $isClosed,
                    'opens_at' => $isClosed ? null : ($entry['opens_at'] ?? null),
                    'closes_at' => $isClosed ? null : ($entry['closes_at'] ?? null),
                    'closes_next_day' => $isClosed ? false : (bool) ($entry['closes_next_day'] ?? false),
                ];
            })
            ->values()
            ->all();

        $provider->forceFill(['working_hours' => $normalized])->save();

        return $this->getForUser($user);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateAccount(User $user, array $attributes): array
    {
        $profileAttributes = [];

        if (array_key_exists('name', $attributes)) {
            $profileAttributes['name'] = $attributes['name'];
        }

        if (array_key_exists('email', $attributes)) {
            $profileAttributes['email'] = $attributes['email'];
        }

        if ($profileAttributes !== []) {
            $this->profile->update($user, $profileAttributes);
        }

        return $this->getForUser($user);
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        $this->profile->updatePassword($user, $currentPassword, $newPassword);
    }

    /**
     * @param  array<string, mixed>  $preferences
     */
    public function updateNotifications(User $user, array $preferences): array
    {
        $existing = is_array($user->preferences) ? $user->preferences : [];
        $existing['provider_notifications'] = array_merge(
            $this->defaultNotifications(),
            $existing['provider_notifications'] ?? [],
            $preferences,
        );

        $this->profile->update($user, ['preferences' => $existing]);

        return $this->getForUser($user);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsertBankAccount(User $user, array $attributes): array
    {
        $provider = ProviderAccountResolver::forUser($user);
        $iban = IbanValidator::normalize((string) $attributes['iban']);

        if (! IbanValidator::isValidSaudiIban($iban)) {
            throw ValidationException::withMessages([
                'iban' => [__('diyar.vendor.invalid_iban')],
            ]);
        }

        DB::transaction(function () use ($provider, $attributes, $iban) {
            ProviderBankAccount::query()
                ->where('provider_account_id', $provider->id)
                ->update(['is_active' => false]);

            ProviderBankAccount::query()->create([
                'provider_account_id' => $provider->id,
                'bank_code' => SaudiBank::from((string) $attributes['bank_code']),
                'beneficiary_name' => (string) $attributes['beneficiary_name'],
                'iban' => $iban,
                'iban_last4' => IbanValidator::last4($iban),
                'is_active' => true,
            ]);
        });

        return $this->getForUser($user);
    }

    public function uploadAvatar(User $user, UploadedFile $file): array
    {
        $provider = ProviderAccountResolver::forUser($user);

        DB::transaction(function () use ($provider, $file) {
            $previousPath = $provider->avatar_path;
            $newPath = $this->media->storeProviderAvatar($provider->id, $file);
            $provider->forceFill(['avatar_path' => $newPath])->save();
            if (! str_starts_with((string) $previousPath, 'http')) {
                $this->media->deletePath($previousPath);
            }
        });

        return $this->getForUser($user);
    }

    public function deleteAvatar(User $user): array
    {
        $provider = ProviderAccountResolver::forUser($user);
        $previousPath = $provider->avatar_path;
        $provider->forceFill(['avatar_path' => null])->save();

        if (! str_starts_with((string) $previousPath, 'http')) {
            $this->media->deletePath($previousPath);
        }

        return $this->getForUser($user);
    }

    /**
     * @return array<string, bool>
     */
    public function notificationPreferences(User $user): array
    {
        $stored = $user->preferences['provider_notifications'] ?? [];

        return array_merge($this->defaultNotifications(), is_array($stored) ? $stored : []);
    }

    /**
     * @return array<string, bool>
     */
    private function defaultNotifications(): array
    {
        return [
            'new_bookings' => true,
            'appointment_reminders' => true,
            'messages' => true,
            'new_reviews' => false,
        ];
    }
}
