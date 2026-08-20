<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Enums\ServiceOfferStatus;
use App\Enums\ServiceRequestStatus;
use App\Events\Domain\ServiceOfferAccepted;
use App\Events\Domain\ServiceOfferReceived;
use App\Models\ProviderAccount;
use App\Models\ServiceOffer;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ServiceOfferService
{
    /** @var list<string> */
    private const QUOTATION_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    public function __construct(
        private readonly MediaUploadService $media,
        private readonly ServiceBookingService $bookings,
        private readonly ProviderAvailabilityService $availability,
    ) {}

    public function listForProvider(
        User $user,
        string $status,
        int $page,
        int $perPage,
        ?string $search = null,
        ?string $category = null,
        ?string $sort = null,
    ): LengthAwarePaginator {
        $provider = $this->resolveProviderAccount($user);

        $query = ServiceRequest::query()
            ->whereIn('status', [
                ServiceRequestStatus::Pending,
                ServiceRequestStatus::OffersReceived,
            ])
            ->where('user_id', '!=', $user->id)
            ->whereHas('categories', function (Builder $categoryQuery) use ($provider) {
                $categoryQuery->whereIn('service_categories.id', $this->providerCategoryIds($provider));
            })
            ->with(['categories', 'user:id,name'])
            ->withCount('attachments')
            ->withExists(['offers as provider_has_offer' => fn (Builder $q) => $q
                ->where('provider_account_id', $provider->id)]);

        if ($status === 'submitted') {
            $query->whereHas('offers', fn (Builder $q) => $q
                ->where('provider_account_id', $provider->id));
        } elseif ($status === 'open') {
            $query->whereDoesntHave('offers', fn (Builder $q) => $q
                ->where('provider_account_id', $provider->id));
        }

        if ($category !== null && trim($category) !== '') {
            $categorySlug = trim($category);
            $query->whereHas('categories', fn (Builder $q) => $q->where('slug', $categorySlug));
        }

        if ($search !== null && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('reference', 'like', $term)
                    ->orWhere('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('location', 'like', $term)
                    ->orWhereHas('user', fn (Builder $userQuery) => $userQuery->where('name', 'like', $term));
            });
        }

        match ($sort) {
            'oldest' => $query->oldest(),
            'budget_asc' => $query->orderBy('budget_min')->orderBy('budget_max'),
            'budget_desc' => $query->orderByDesc('budget_max')->orderByDesc('budget_min'),
            default => $query->latest(),
        };

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function findForProvider(User $user, string $requestId): ServiceRequest
    {
        $provider = $this->resolveProviderAccount($user);

        $request = ServiceRequest::query()
            ->with([
                'categories',
                'attachments',
                'user:id,name',
                'offers' => function ($query) use ($provider) {
                    $query
                        ->where('provider_account_id', $provider->id)
                        ->with('providerAccount');
                },
            ])
            ->withCount('attachments')
            ->withExists(['offers as provider_has_offer' => fn (Builder $q) => $q
                ->where('provider_account_id', $provider->id)])
            ->whereKey($requestId)
            ->first();

        if ($request === null) {
            throw new NotFoundHttpException(__('diyar.services.requests.not_found'));
        }

        $hasOffer = ServiceOffer::query()
            ->where('service_request_id', $request->id)
            ->where('provider_account_id', $provider->id)
            ->exists();

        if ($request->user_id === $user->id && ! $hasOffer) {
            throw new NotFoundHttpException(__('diyar.services.requests.not_found'));
        }

        if (! $hasOffer && ! $this->requestMatchesProviderCategories($request, $provider)) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if (! $hasOffer && ! in_array($request->status, [
            ServiceRequestStatus::Pending,
            ServiceRequestStatus::OffersReceived,
        ], true)) {
            throw new AccessDeniedHttpException(__('diyar.services.offers.request_closed'));
        }

        return $request;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function submit(User $user, ServiceRequest $request, array $payload, ?UploadedFile $quotation = null): ServiceOffer
    {
        $provider = $this->resolveProviderAccount($user);

        if ($request->user_id === $user->id) {
            throw new AccessDeniedHttpException(__('diyar.services.offers.cannot_offer_own_request'));
        }

        if (! in_array($request->status, [
            ServiceRequestStatus::Pending,
            ServiceRequestStatus::OffersReceived,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.offers.request_closed'));
        }

        if (! $this->requestMatchesProviderCategories($request, $provider)) {
            throw new AccessDeniedHttpException(__('diyar.services.offers.category_mismatch'));
        }

        $existing = ServiceOffer::query()
            ->where('service_request_id', $request->id)
            ->where('provider_account_id', $provider->id)
            ->first();

        if ($existing !== null) {
            throw new InvalidArgumentException(__('diyar.services.offers.already_submitted'));
        }

        $price = $payload['proposed_price'] ?? null;
        if ($price === null || (float) $price <= 0) {
            throw new InvalidArgumentException(__('diyar.services.offers.price_required'));
        }

        $proposedDate = isset($payload['proposed_scheduled_date'])
            ? trim((string) $payload['proposed_scheduled_date'])
            : '';
        $proposedTime = isset($payload['proposed_scheduled_time'])
            ? substr(trim((string) $payload['proposed_scheduled_time']), 0, 5)
            : '';

        if ($proposedDate !== '' xor $proposedTime !== '') {
            throw new InvalidArgumentException(__('diyar.services.bookings.schedule_required'));
        }

        if ($proposedDate !== '' && $proposedTime !== '') {
            $this->availability->assertMinimumLeadTime($proposedDate, $proposedTime);
        }

        return DB::transaction(function () use ($request, $provider, $payload, $quotation, $price) {
            $quotationMeta = $quotation !== null
                ? $this->storeQuotation($request, $quotation)
                : null;

            $offer = ServiceOffer::query()->create([
                'service_request_id' => $request->id,
                'provider_account_id' => $provider->id,
                'proposed_price' => $price,
                'currency' => $payload['currency'] ?? 'SAR',
                'duration_days' => $payload['duration_days'] ?? null,
                'proposed_scheduled_date' => $payload['proposed_scheduled_date'] ?? null,
                'proposed_scheduled_time' => $payload['proposed_scheduled_time'] ?? null,
                'message' => isset($payload['message']) ? trim((string) $payload['message']) : null,
                'quotation_disk' => $quotationMeta['disk'] ?? null,
                'quotation_path' => $quotationMeta['path'] ?? null,
                'quotation_original_name' => $quotationMeta['original_name'] ?? null,
                'expires_at' => $payload['expires_at'] ?? null,
                'status' => ServiceOfferStatus::Pending,
            ]);

            if ($request->status === ServiceRequestStatus::Pending) {
                $request->update(['status' => ServiceRequestStatus::OffersReceived]);
            }

            $fresh = $offer->fresh(['providerAccount', 'serviceRequest']);
            DB::afterCommit(fn () => event(new ServiceOfferReceived($fresh)));

            return $fresh;
        });
    }

    public function accept(User $user, ServiceOffer $offer, array $payload = []): ServiceOffer
    {
        $request = $offer->serviceRequest()->firstOrFail();

        if ($request->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($offer->status !== ServiceOfferStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.services.offers.not_acceptable'));
        }

        if (! in_array($request->status, [
            ServiceRequestStatus::Pending,
            ServiceRequestStatus::OffersReceived,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.offers.request_closed'));
        }

        return DB::transaction(function () use ($user, $offer, $request, $payload) {
            $offer->update(['status' => ServiceOfferStatus::Accepted]);

            ServiceOffer::query()
                ->where('service_request_id', $request->id)
                ->whereKeyNot($offer->id)
                ->where('status', ServiceOfferStatus::Pending)
                ->update(['status' => ServiceOfferStatus::Rejected]);

            $request->update([
                'status' => ServiceRequestStatus::OfferAccepted,
                'accepted_offer_id' => $offer->id,
            ]);

            $this->bookings->createFromAcceptedOffer($user, $offer, array_merge([
                'scheduled_date' => $offer->proposed_scheduled_date?->format('Y-m-d'),
                'scheduled_time' => $offer->proposed_scheduled_time,
            ], $payload));

            $fresh = $offer->fresh(['providerAccount', 'booking']);
            DB::afterCommit(fn () => event(new ServiceOfferAccepted($fresh)));

            return $fresh;
        });
    }

    public function reject(User $user, ServiceOffer $offer): ServiceOffer
    {
        $request = $offer->serviceRequest()->firstOrFail();

        if ($request->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($offer->status !== ServiceOfferStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.services.offers.not_rejectable'));
        }

        if (! in_array($request->status, [
            ServiceRequestStatus::Pending,
            ServiceRequestStatus::OffersReceived,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.offers.request_closed'));
        }

        $offer->update(['status' => ServiceOfferStatus::Rejected]);

        return $offer->fresh(['providerAccount']);
    }

    /**
     * @return array{disk: string, path: string, original_name: string}
     */
    private function storeQuotation(ServiceRequest $request, UploadedFile $file): array
    {
        $detectedMime = (string) $file->getMimeType();
        if (! in_array($detectedMime, self::QUOTATION_MIMES, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }

        $disk = $this->media->diskName();
        $directory = sprintf('service-offers/%s', $request->id);
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $filename = Str::uuid()->toString().'.'.$extension;

        $stored = Storage::disk($disk)->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return [
            'disk' => $disk,
            'path' => $directory.'/'.$filename,
            'original_name' => (string) $file->getClientOriginalName(),
        ];
    }

    private function resolveProviderAccount(User $user): ProviderAccount
    {
        $provider = ProviderAccount::query()
            ->where('user_id', $user->id)
            ->where('status', ProviderAccountStatus::Active)
            ->first();

        if ($provider === null) {
            throw new NotFoundHttpException(__('diyar.services.provider_not_found'));
        }

        return $provider;
    }

    /**
     * @return list<string>
     */
    private function providerCategoryIds(ProviderAccount $provider): array
    {
        return $provider->services()
            ->where('is_active', true)
            ->pluck('service_category_id')
            ->unique()
            ->values()
            ->all();
    }

    private function requestMatchesProviderCategories(ServiceRequest $request, ProviderAccount $provider): bool
    {
        $providerCategoryIds = $this->providerCategoryIds($provider);
        if ($providerCategoryIds === []) {
            return false;
        }

        return $request->categories()
            ->whereIn('service_categories.id', $providerCategoryIds)
            ->exists();
    }
}
