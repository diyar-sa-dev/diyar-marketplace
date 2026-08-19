<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderReviewStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderReview;
use App\Models\Service;
use App\Models\ServiceBooking;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProviderReviewService
{
    public function __construct(
        private readonly ProviderProfileService $providers,
        private readonly ProviderReviewEligibility $eligibility,
    ) {}

    public function findActiveProviderBySlug(string $slug): ProviderAccount
    {
        return $this->providers->findActiveBySlug($slug);
    }

    public function paginatePublicReviews(ProviderAccount $provider, int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        return ProviderReview::query()
            ->with([
                'user:id,name,avatar_path',
                'service:id,title,slug',
                'providerAccount:id,business_name,avatar_path',
            ])
            ->where('provider_account_id', $provider->id)
            ->where('status', ProviderReviewStatus::Published)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    /**
     * @return array{
     *   average_rating: ?float,
     *   review_count: int,
     *   distribution: list<array{stars: int, count: int, percentage: int}>
     * }
     */
    public function ratingSummary(ProviderAccount $provider): array
    {
        $countsByRating = ProviderReview::query()
            ->where('provider_account_id', $provider->id)
            ->where('status', ProviderReviewStatus::Published)
            ->selectRaw('rating, COUNT(*) as aggregate_count')
            ->groupBy('rating')
            ->pluck('aggregate_count', 'rating');

        $reviewCount = (int) $countsByRating->sum();
        $averageRating = null;

        if ($reviewCount > 0) {
            $weightedSum = 0;
            foreach ($countsByRating as $rating => $count) {
                $weightedSum += (int) $rating * (int) $count;
            }
            $averageRating = round($weightedSum / $reviewCount, 1);
        }

        $distribution = [];
        for ($stars = 5; $stars >= 1; $stars--) {
            $count = (int) ($countsByRating[$stars] ?? 0);
            $percentage = $reviewCount > 0 ? (int) round(($count / $reviewCount) * 100) : 0;
            $distribution[] = [
                'stars' => $stars,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return [
            'average_rating' => $averageRating,
            'review_count' => $reviewCount,
            'distribution' => $distribution,
        ];
    }

    public function paginateForProviderDashboard(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        $provider = ProviderAccountResolver::forUser($user);

        return ProviderReview::query()
            ->with(['user:id,name,avatar_path', 'service:id,title'])
            ->where('provider_account_id', $provider->id)
            ->where('status', ProviderReviewStatus::Published)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    public function createForBooking(User $user, ServiceBooking $booking, int $rating, ?string $title, ?string $comment): ProviderReview
    {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.provider_review.rating_invalid'));
        }

        $booking->loadMissing(['providerAccount', 'service']);

        $this->eligibility->assertCanReview($user, $booking);
        $this->assertNotSelfReview($user, $booking->providerAccount);

        $normalizedComment = $this->normalizeText($comment);
        $normalizedTitle = $this->normalizeText($title);

        try {
            return DB::transaction(function () use ($user, $booking, $rating, $normalizedTitle, $normalizedComment) {
                $existing = ProviderReview::query()
                    ->where('service_booking_id', $booking->id)
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    throw new ConflictHttpException(__('diyar.provider_review.already_reviewed'));
                }

                $review = ProviderReview::query()->create([
                    'provider_account_id' => $booking->provider_account_id,
                    'user_id' => $user->id,
                    'service_booking_id' => $booking->id,
                    'service_id' => $booking->service_id,
                    'rating' => $rating,
                    'title' => $normalizedTitle,
                    'comment' => $normalizedComment,
                    'status' => ProviderReviewStatus::Published,
                ]);

                $this->syncAggregates($booking->provider_account_id, $booking->service_id);

                return $review->fresh(['user:id,name,avatar_path', 'service:id,title,slug', 'providerAccount:id,business_name,avatar_path']);
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                throw new ConflictHttpException(__('diyar.provider_review.already_reviewed'));
            }

            throw $exception;
        }
    }

    public function findOwnedReview(User $user, string $reviewId): ProviderReview
    {
        $review = ProviderReview::query()->whereKey($reviewId)->first();

        if ($review === null) {
            throw new NotFoundHttpException(__('diyar.provider_review.not_found'));
        }

        if ($review->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.catalog.cannot_edit_other_review'));
        }

        return $review;
    }

    public function updateReview(User $user, ProviderReview $review, int $rating, ?string $title, ?string $comment): ProviderReview
    {
        if ($rating < 1 || $rating > 5) {
            throw new InvalidArgumentException(__('diyar.provider_review.rating_invalid'));
        }

        $this->findOwnedReview($user, $review->id);

        $review->update([
            'rating' => $rating,
            'title' => $this->normalizeText($title),
            'comment' => $this->normalizeText($comment),
        ]);

        $this->syncAggregates($review->provider_account_id, $review->service_id);

        return $review->fresh(['user:id,name,avatar_path', 'service:id,title,slug', 'providerAccount:id,business_name,avatar_path']);
    }

    public function deleteReview(User $user, ProviderReview $review): void
    {
        $this->findOwnedReview($user, $review->id);

        DB::transaction(function () use ($review) {
            $providerId = $review->provider_account_id;
            $serviceId = $review->service_id;
            $review->delete();
            $this->syncAggregates($providerId, $serviceId);
        });
    }

    public function respond(User $user, ProviderReview $review, string $response): ProviderReview
    {
        $provider = ProviderAccountResolver::forUser($user);

        if ($review->provider_account_id !== $provider->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($review->provider_response !== null) {
            throw new ConflictHttpException(__('diyar.provider_review.already_responded'));
        }

        $normalized = $this->normalizeText($response);
        if ($normalized === null) {
            throw new InvalidArgumentException(__('diyar.provider_review.response_required'));
        }

        $review->update([
            'provider_response' => $normalized,
            'provider_responded_at' => now(),
            'provider_responded_by_user_id' => $user->id,
        ]);

        return $review->fresh(['user:id,name,avatar_path', 'service:id,title,slug', 'providerAccount:id,business_name,avatar_path']);
    }

    private function syncAggregates(string $providerAccountId, ?string $serviceId): void
    {
        $summary = $this->ratingSummary(ProviderAccount::query()->findOrFail($providerAccountId));

        ProviderAccount::query()->whereKey($providerAccountId)->update([
            'rating_average' => $summary['average_rating'] ?? 0,
            'reviews_count' => $summary['review_count'],
        ]);

        if ($serviceId === null) {
            return;
        }

        $serviceSummary = ProviderReview::query()
            ->where('service_id', $serviceId)
            ->where('status', ProviderReviewStatus::Published)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        Service::query()->whereKey($serviceId)->update([
            'rating_average' => round((float) ($serviceSummary->avg_rating ?? 0), 2),
            'reviews_count' => (int) ($serviceSummary->total ?? 0),
        ]);
    }

    private function assertNotSelfReview(User $user, ?ProviderAccount $provider): void
    {
        if ($provider !== null && $provider->user_id === $user->id) {
            throw new AccessDeniedHttpException(__('diyar.provider_review.cannot_review_own_provider'));
        }
    }

    private function normalizeText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim(strip_tags($value));

        return $trimmed === '' ? null : $trimmed;
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
