<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProviderServiceManagementService
{
    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $user, array $attributes, ?UploadedFile $cover = null): Service
    {
        $provider = ProviderAccountResolver::forUser($user);

        return DB::transaction(function () use ($provider, $attributes, $cover) {
            $service = Service::query()->create([
                'provider_account_id' => $provider->id,
                'service_category_id' => $this->resolveCategoryId($provider, $attributes['service_category_id'] ?? null),
                'title' => (string) $attributes['title'],
                'slug' => $this->uniqueSlug($provider, (string) $attributes['title']),
                'description' => $attributes['description'] ?? null,
                'pricing_mode' => ServicePricingMode::Fixed,
                'booking_mode' => ServiceBookingMode::Direct,
                'starting_price' => number_format((float) $attributes['starting_price'], 2, '.', ''),
                'currency' => (string) config('diyar.finance.currency', 'SAR'),
                'duration_label' => $attributes['duration_label'] ?? null,
                'duration_minutes' => isset($attributes['duration_minutes'])
                    ? (int) $attributes['duration_minutes']
                    : 60,
                'delivery_type_label' => $attributes['service_type_label'] ?? null,
                'location' => $attributes['location'] ?? $provider->location,
                'remote_available' => (bool) ($attributes['remote_available'] ?? $provider->remote_available),
                'features' => [],
                'is_active' => (bool) ($attributes['is_active'] ?? true),
            ]);

            if ($cover !== null) {
                $service->forceFill([
                    'cover_path' => $this->media->storeServiceCover($service->id, $cover),
                ])->save();
            }

            return $service->fresh(['category', 'providerAccount']);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, Service $service, array $attributes, ?UploadedFile $cover = null): Service
    {
        $this->assertOwned($user, $service);
        $provider = ProviderAccountResolver::forUser($user);

        return DB::transaction(function () use ($service, $attributes, $cover, $provider) {
            $updates = [];

            if (array_key_exists('title', $attributes)) {
                $updates['title'] = (string) $attributes['title'];
                $updates['slug'] = $this->uniqueSlug($provider, (string) $attributes['title'], $service->id);
            }

            if (array_key_exists('starting_price', $attributes)) {
                $updates['starting_price'] = number_format((float) $attributes['starting_price'], 2, '.', '');
            }

            if (array_key_exists('duration_label', $attributes)) {
                $updates['duration_label'] = $attributes['duration_label'];
            }

            if (array_key_exists('service_type_label', $attributes)) {
                $updates['delivery_type_label'] = $attributes['service_type_label'];
            }

            if (array_key_exists('location', $attributes)) {
                $updates['location'] = $attributes['location'];
            }

            if (array_key_exists('description', $attributes)) {
                $updates['description'] = $attributes['description'];
            }

            if (array_key_exists('is_active', $attributes)) {
                $updates['is_active'] = (bool) $attributes['is_active'];
            }

            if (array_key_exists('service_category_id', $attributes)) {
                $updates['service_category_id'] = $this->resolveCategoryId($provider, $attributes['service_category_id']);
            }

            if ($updates !== []) {
                $service->fill($updates)->save();
            }

            if ($cover !== null) {
                $previousPath = $service->cover_path;
                $service->forceFill([
                    'cover_path' => $this->media->storeServiceCover($service->id, $cover),
                ])->save();

                if (! str_starts_with((string) $previousPath, 'http')) {
                    $this->media->deletePath($previousPath);
                }
            }

            return $service->fresh(['category', 'providerAccount']);
        });
    }

    public function delete(User $user, Service $service): void
    {
        $this->assertOwned($user, $service);

        $hasBookings = ServiceBooking::query()->where('service_id', $service->id)->exists();
        if ($hasBookings) {
            throw new InvalidArgumentException(__('diyar.services.catalog.cannot_delete_with_bookings'));
        }

        DB::transaction(function () use ($service) {
            if (! str_starts_with((string) $service->cover_path, 'http')) {
                $this->media->deletePath($service->cover_path);
            }

            $service->delete();
        });
    }

    public function findOwnedService(User $user, string $serviceId): Service
    {
        $provider = ProviderAccountResolver::forUser($user);

        $service = Service::query()
            ->where('provider_account_id', $provider->id)
            ->whereKey($serviceId)
            ->first();

        if ($service === null) {
            throw new NotFoundHttpException(__('diyar.services.not_found'));
        }

        return $service;
    }

    private function assertOwned(User $user, Service $service): void
    {
        $provider = ProviderAccountResolver::forUser($user);

        if ($service->provider_account_id !== $provider->id) {
            throw new NotFoundHttpException(__('diyar.services.not_found'));
        }
    }

    private function resolveCategoryId($provider, ?string $categoryId): string
    {
        if ($categoryId !== null) {
            $category = ServiceCategory::query()->whereKey($categoryId)->where('is_active', true)->first();
            if ($category !== null) {
                return $category->id;
            }
        }

        $existing = Service::query()
            ->where('provider_account_id', $provider->id)
            ->whereNotNull('service_category_id')
            ->value('service_category_id');

        if ($existing !== null) {
            return $existing;
        }

        return ServiceCategory::query()->where('slug', 'other')->value('id')
            ?? ServiceCategory::query()->where('is_active', true)->value('id');
    }

    private function uniqueSlug($provider, string $title, ?string $ignoreId = null): string
    {
        $base = Str::slug($title);
        if ($base === '') {
            $base = 'service';
        }

        $slug = $base;
        $counter = 1;

        while (Service::query()
            ->where('provider_account_id', $provider->id)
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
