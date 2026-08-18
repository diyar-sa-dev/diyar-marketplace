<?php

namespace App\Services\Vendor;

use App\Enums\BusinessEntityType;
use App\Enums\SaudiBank;
use App\Enums\Weekday;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorBankAccount;
use App\Models\VendorLegalProfile;
use App\Models\VendorWorkingHour;
use App\Services\Media\MediaUploadService;
use App\Support\Finance\IbanValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class VendorSettingsService
{
    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    public function getForUser(User $user): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        return $vendorAccount->load([
            'legalProfile',
            'activeBankAccount',
            'workingHours',
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateProfile(User $user, array $attributes): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        $updates = [];

        if (array_key_exists('business_name', $attributes)) {
            $updates['business_name'] = $attributes['business_name'];
        }

        if (array_key_exists('slug', $attributes)) {
            $slug = strtolower(trim((string) $attributes['slug']));
            $this->assertValidSlug($slug, $vendorAccount);
            $updates['slug'] = $slug;
        }

        if (array_key_exists('description', $attributes)) {
            $updates['description'] = $attributes['description'];
        }

        if (array_key_exists('location', $attributes)) {
            $updates['location'] = $attributes['location'];
        }

        if (array_key_exists('support_phone', $attributes)) {
            $updates['support_phone'] = $attributes['support_phone'];
        }

        if (array_key_exists('support_email', $attributes)) {
            $updates['support_email'] = $attributes['support_email'];
        }

        if (array_key_exists('website_url', $attributes)) {
            $websiteUrl = trim((string) ($attributes['website_url'] ?? ''));
            $updates['website_url'] = $websiteUrl !== '' ? $websiteUrl : null;
        }

        if ($updates !== []) {
            $vendorAccount->fill($updates)->save();
        }

        return $this->getForUser($user);
    }

    public function uploadLogo(User $user, UploadedFile $file): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        return DB::transaction(function () use ($vendorAccount, $file) {
            $previousPath = $vendorAccount->logo_path;
            $newPath = $this->media->storeVendorLogo($vendorAccount->id, $file);
            $vendorAccount->forceFill(['logo_path' => $newPath])->save();
            $this->media->deletePath($previousPath);

            return $this->getForUser($vendorAccount->user);
        });
    }

    public function deleteLogo(User $user): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);
        $previousPath = $vendorAccount->logo_path;
        $vendorAccount->forceFill(['logo_path' => null])->save();
        $this->media->deletePath($previousPath);

        return $this->getForUser($user);
    }

    public function uploadCover(User $user, UploadedFile $file): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        return DB::transaction(function () use ($vendorAccount, $file) {
            $previousPath = $vendorAccount->cover_path;
            $newPath = $this->media->storeVendorCover($vendorAccount->id, $file);
            $vendorAccount->forceFill(['cover_path' => $newPath])->save();
            $this->media->deletePath($previousPath);

            return $this->getForUser($vendorAccount->user);
        });
    }

    public function deleteCover(User $user): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);
        $previousPath = $vendorAccount->cover_path;
        $vendorAccount->forceFill(['cover_path' => null])->save();
        $this->media->deletePath($previousPath);

        return $this->getForUser($user);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsertLegalProfile(User $user, array $attributes): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        DB::transaction(function () use ($vendorAccount, $attributes) {
            VendorLegalProfile::query()->updateOrCreate(
                ['vendor_account_id' => $vendorAccount->id],
                [
                    'entity_type' => BusinessEntityType::from((string) $attributes['entity_type']),
                    'commercial_registration_number' => (string) $attributes['commercial_registration_number'],
                    'tax_number' => $attributes['tax_number'] ?? null,
                ],
            );
        });

        return $this->getForUser($user);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsertBankAccount(User $user, array $attributes): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);
        $iban = IbanValidator::normalize((string) $attributes['iban']);

        if (! IbanValidator::isValidSaudiIban($iban)) {
            throw ValidationException::withMessages([
                'iban' => [__('diyar.vendor.invalid_iban')],
            ]);
        }

        DB::transaction(function () use ($vendorAccount, $attributes, $iban) {
            VendorBankAccount::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->update(['is_active' => false]);

            VendorBankAccount::query()->create([
                'vendor_account_id' => $vendorAccount->id,
                'bank_code' => SaudiBank::from((string) $attributes['bank_code']),
                'beneficiary_name' => (string) $attributes['beneficiary_name'],
                'iban' => $iban,
                'iban_last4' => IbanValidator::last4($iban),
                'is_active' => true,
            ]);
        });

        return $this->getForUser($user);
    }

    /**
     * @param  list<array<string, mixed>>  $hours
     */
    public function upsertWorkingHours(User $user, array $hours): VendorAccount
    {
        $vendorAccount = $this->requireVendorAccount($user);

        DB::transaction(function () use ($vendorAccount, $hours) {
            foreach ($hours as $entry) {
                $day = Weekday::from((string) $entry['day']);
                $isClosed = (bool) ($entry['is_closed'] ?? false);

                VendorWorkingHour::query()->updateOrCreate(
                    [
                        'vendor_account_id' => $vendorAccount->id,
                        'day' => $day->value,
                    ],
                    [
                        'is_closed' => $isClosed,
                        'opens_at' => $isClosed ? null : ($entry['opens_at'] ?? null),
                        'closes_at' => $isClosed ? null : ($entry['closes_at'] ?? null),
                        'closes_next_day' => $isClosed ? false : (bool) ($entry['closes_next_day'] ?? false),
                    ],
                );
            }
        });

        return $this->getForUser($user);
    }

    private function requireVendorAccount(User $user): VendorAccount
    {
        $vendorAccount = $user->vendorAccount;

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $vendorAccount;
    }

    private function assertValidSlug(string $slug, VendorAccount $vendorAccount): void
    {
        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => [__('diyar.vendor.slug_required')],
            ]);
        }

        if (! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            throw ValidationException::withMessages([
                'slug' => [__('diyar.vendor.slug_invalid')],
            ]);
        }

        $reserved = config('diyar.vendor.reserved_slugs', []);
        if (in_array($slug, $reserved, true)) {
            throw ValidationException::withMessages([
                'slug' => [__('diyar.vendor.slug_reserved')],
            ]);
        }

        $exists = VendorAccount::query()
            ->where('slug', $slug)
            ->whereKeyNot($vendorAccount->id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'slug' => [__('diyar.vendor.slug_taken')],
            ]);
        }
    }
}
