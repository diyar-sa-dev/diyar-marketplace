<?php

namespace App\Services\B2b;

use App\Enums\B2bLeadStatus;
use App\Models\B2bCompany;
use App\Models\B2bCompanyReview;
use App\Models\B2bLead;
use App\Models\User;
use App\Support\Cache\B2bCache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class B2bCompanyReviewService
{
    public function __construct(
        private readonly B2bQueryService $b2b,
        private readonly B2bCache $cache,
    ) {}

    public function findPublishedCompanyBySlug(string $slug): B2bCompany
    {
        return $this->b2b->findPublishedBySlug($slug);
    }

    public function paginateForCompany(B2bCompany $company, int $page = 1, int $perPage = 5): LengthAwarePaginator
    {
        return B2bCompanyReview::query()
            ->with(['user:id,name,avatar_path'])
            ->where('b2b_company_id', $company->id)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    public function paginateForPartnerCompany(B2bCompany $company, int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        return B2bCompanyReview::query()
            ->with(['user:id,name,avatar_path', 'lead:id,project_type'])
            ->where('b2b_company_id', $company->id)
            ->latest()
            ->paginate(perPage: min($perPage, 20), page: max($page, 1));
    }

    public function createReview(
        User $user,
        B2bCompany $company,
        string $leadId,
        int $rating,
        ?string $comment,
    ): B2bCompanyReview {
        $lead = B2bLead::query()
            ->whereKey($leadId)
            ->where('b2b_company_id', $company->id)
            ->first();

        if ($lead === null) {
            throw new NotFoundHttpException(__('diyar.b2b.review.lead_not_found'));
        }

        if ($lead->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.b2b.review.lead_not_owned'));
        }

        if ($lead->status !== B2bLeadStatus::Accepted) {
            throw new InvalidArgumentException(__('diyar.b2b.review.lead_not_eligible'));
        }

        if ($company->owner_user_id === $user->id) {
            throw new InvalidArgumentException(__('diyar.b2b.review.cannot_review_own_company'));
        }

        if (B2bCompanyReview::query()->where('b2b_lead_id', $lead->id)->exists()) {
            throw new ConflictHttpException(__('diyar.b2b.review.already_submitted'));
        }

        try {
            $review = DB::transaction(function () use ($user, $company, $lead, $rating, $comment) {
                $review = B2bCompanyReview::query()->create([
                    'user_id' => $user->id,
                    'b2b_company_id' => $company->id,
                    'b2b_lead_id' => $lead->id,
                    'rating' => $rating,
                    'comment' => $comment !== null && trim($comment) !== '' ? trim($comment) : null,
                ]);

                $this->syncCompanyRating($company);

                return $review;
            });
        } catch (QueryException $exception) {
            if ($this->isDuplicateReview($exception)) {
                throw new ConflictHttpException(__('diyar.b2b.review.already_submitted'));
            }

            throw $exception;
        }

        $this->cache->forget();

        return $review->load(['user:id,name,avatar_path', 'company:id,slug,name,logo']);
    }

    /**
     * @return list<B2bCompanyReview>
     */
    public function recentForCompany(B2bCompany $company, int $limit = 6): array
    {
        return B2bCompanyReview::query()
            ->with(['user:id,name,avatar_path'])
            ->where('b2b_company_id', $company->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->all();
    }

    public function syncCompanyRating(B2bCompany $company): void
    {
        $aggregate = B2bCompanyReview::query()
            ->where('b2b_company_id', $company->id)
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating')
            ->first();

        $reviewCount = (int) ($aggregate->review_count ?? 0);
        $averageRating = $aggregate->average_rating !== null
            ? round((float) $aggregate->average_rating, 2)
            : 0;

        $company->update([
            'reviews_count' => $reviewCount,
            'rating' => $averageRating,
        ]);
    }

    private function isDuplicateReview(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'duplicate')
            || str_contains($message, 'unique');
    }
}
