<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceRequestStatus;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ServiceRequestService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(User $user, array $payload): ServiceRequest
    {
        $categoryIds = $this->normalizeCategoryIds($payload['category_ids'] ?? []);
        if ($categoryIds === []) {
            throw new InvalidArgumentException(__('diyar.services.requests.categories_required'));
        }

        $categories = ServiceCategory::query()
            ->whereIn('id', $categoryIds)
            ->where('is_active', true)
            ->get();

        if ($categories->count() !== count($categoryIds)) {
            throw new InvalidArgumentException(__('diyar.services.requests.invalid_categories'));
        }

        $service = null;
        if (! empty($payload['service_id'])) {
            $service = Service::query()
                ->where('is_active', true)
                ->whereKey($payload['service_id'])
                ->first();

            if ($service === null) {
                throw new NotFoundHttpException(__('diyar.services.not_found'));
            }
        }

        $description = trim((string) ($payload['description'] ?? ''));
        if ($description === '') {
            throw new InvalidArgumentException(__('diyar.services.requests.description_required'));
        }

        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            $title = Str::limit($description, 80, '…');
        }

        return DB::transaction(function () use ($user, $payload, $categories, $service, $description, $title) {
            $request = ServiceRequest::query()->create([
                'user_id' => $user->id,
                'service_id' => $service?->id,
                'provider_account_id' => $service?->provider_account_id ?? ($payload['provider_account_id'] ?? null),
                'reference' => $this->allocateReference('SRQ'),
                'title' => $title,
                'description' => $description,
                'budget_min' => $payload['budget_min'] ?? null,
                'budget_max' => $payload['budget_max'] ?? null,
                'location' => isset($payload['location']) ? trim((string) $payload['location']) : null,
                'reference_links' => $this->normalizeReferenceLinks($payload['reference_links'] ?? []),
                'status' => ServiceRequestStatus::Pending,
            ]);

            $request->categories()->sync($categories->pluck('id')->all());

            return $request->fresh(['categories', 'attachments', 'service', 'providerAccount']);
        });
    }

    public function listForCustomer(User $user, string $status, int $page, int $perPage): LengthAwarePaginator
    {
        $query = ServiceRequest::query()
            ->where('user_id', $user->id)
            ->with(['categories', 'acceptedOffer.providerAccount'])
            ->withCount(['offers as offers_count'])
            ->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function findForCustomer(User $user, string $id): ServiceRequest
    {
        $request = ServiceRequest::query()
            ->where('user_id', $user->id)
            ->with([
                'categories',
                'attachments',
                'offers.providerAccount',
                'acceptedOffer.providerAccount',
                'booking.payment',
                'service',
            ])
            ->whereKey($id)
            ->first();

        if ($request === null) {
            throw new NotFoundHttpException(__('diyar.services.requests.not_found'));
        }

        return $request;
    }

    public function cancel(User $user, ServiceRequest $request): ServiceRequest
    {
        if ($request->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if (! in_array($request->status, [
            ServiceRequestStatus::Pending,
            ServiceRequestStatus::OffersReceived,
        ], true)) {
            throw new InvalidArgumentException(__('diyar.services.requests.cannot_cancel'));
        }

        $request->update([
            'status' => ServiceRequestStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $request->fresh(['categories', 'attachments']);
    }

    /**
     * @param  list<string>  $categoryIds
     * @return list<string>
     */
    private function normalizeCategoryIds(array $categoryIds): array
    {
        return array_values(array_unique(array_filter(array_map(
            static fn ($id) => is_string($id) ? trim($id) : null,
            $categoryIds,
        ))));
    }

    /**
     * @param  list<mixed>  $links
     * @return list<string>
     */
    private function normalizeReferenceLinks(array $links): array
    {
        $normalized = [];

        foreach ($links as $link) {
            if (! is_string($link)) {
                continue;
            }

            $trimmed = trim($link);
            if ($trimmed === '' || ! filter_var($trimmed, FILTER_VALIDATE_URL)) {
                continue;
            }

            $normalized[] = $trimmed;
        }

        return array_values(array_unique($normalized));
    }

    private function allocateReference(string $prefix): string
    {
        $date = now()->format('Ymd');
        $count = ServiceRequest::query()->whereDate('created_at', today())->count() + 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }
}
