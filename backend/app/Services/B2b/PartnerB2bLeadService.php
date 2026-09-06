<?php

namespace App\Services\B2b;

use App\Enums\B2bLeadStatus;
use App\Enums\B2bPublicationStatus;
use App\Events\Domain\B2bLeadAccepted;
use App\Events\Domain\B2bLeadRejected;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PartnerB2bLeadService
{
    public function __construct(
        private readonly PartnerB2bCompanyService $partnerB2b,
    ) {}

    /**
     * @return array{
     *   summary: array<string, int>,
     *   items: Collection<int, B2bLead>,
     *   pagination: array<string, int>
     * }
     */
    public function paginateForPartner(
        User $user,
        bool $isVendor,
        ?string $status,
        ?string $search,
        int $page,
        int $perPage,
    ): array {
        $company = $this->requirePublishedPartnerCompany($user, $isVendor);

        $baseQuery = B2bLead::query()->where('b2b_company_id', $company->id);

        $summary = [
            'total' => (clone $baseQuery)->count(),
            'new' => (clone $baseQuery)->where('status', B2bLeadStatus::New->value)->count(),
            'accepted' => (clone $baseQuery)->where('status', B2bLeadStatus::Accepted->value)->count(),
            'rejected' => (clone $baseQuery)->where('status', B2bLeadStatus::Rejected->value)->count(),
        ];

        $query = $this->applyPartnerFilters(
            B2bLead::query()
                ->with(['user'])
                ->where('b2b_company_id', $company->id),
            $status,
            $search,
        );

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate(perPage: $perPage, page: $page);

        return [
            'summary' => $summary,
            'items' => $paginator->getCollection(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function findForPartner(User $user, bool $isVendor, string $leadId): B2bLead
    {
        $company = $this->requirePublishedPartnerCompany($user, $isVendor);

        $lead = B2bLead::query()
            ->with(['user'])
            ->where('b2b_company_id', $company->id)
            ->find($leadId);

        if ($lead === null) {
            throw new NotFoundHttpException(__('diyar.b2b.lead_not_found'));
        }

        return $lead;
    }

    public function updateStatusForPartner(
        User $user,
        bool $isVendor,
        string $leadId,
        string $status,
    ): B2bLead {
        $lead = $this->findForPartner($user, $isVendor, $leadId);

        if ($lead->status !== B2bLeadStatus::New) {
            throw new ConflictHttpException(__('diyar.b2b.lead_status_locked'));
        }

        $nextStatus = B2bLeadStatus::from($status);
        $lead->forceFill(['status' => $nextStatus])->save();
        $fresh = $lead->fresh(['user', 'company']);

        DB::afterCommit(function () use ($fresh, $nextStatus): void {
            if ($nextStatus === B2bLeadStatus::Accepted) {
                event(new B2bLeadAccepted($fresh));
            } elseif ($nextStatus === B2bLeadStatus::Rejected) {
                event(new B2bLeadRejected($fresh));
            }
        });

        return $fresh;
    }

    private function requirePublishedPartnerCompany(User $user, bool $isVendor): B2bCompany
    {
        $company = $isVendor
            ? $this->partnerB2b->findForVendor($user)
            : $this->partnerB2b->findForProvider($user);

        if ($company === null) {
            throw new NotFoundHttpException(__('diyar.b2b.company_not_found'));
        }

        $this->partnerB2b->assertCanManage($user, $company);

        if ($company->publication_status !== B2bPublicationStatus::Published) {
            throw new AccessDeniedHttpException(__('diyar.b2b.leads_require_published'));
        }

        return $company;
    }

    /**
     * @param  Builder<B2bLead>  $query
     * @return Builder<B2bLead>
     */
    private function applyPartnerFilters(Builder $query, ?string $status, ?string $search): Builder
    {
        if ($status !== null && $status !== '' && $status !== 'all') {
            if (! in_array($status, [
                B2bLeadStatus::New->value,
                B2bLeadStatus::Accepted->value,
                B2bLeadStatus::Rejected->value,
            ], true)) {
                throw new UnprocessableEntityHttpException(__('diyar.b2b.lead_invalid'));
            }

            $query->where('status', $status);
        }

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.addcslashes($term, '%_\\').'%';
            $query->where(function (Builder $inner) use ($like) {
                $inner
                    ->where('project_type', 'like', $like)
                    ->orWhere('estimated_quantity', 'like', $like)
                    ->orWhere('details', 'like', $like)
                    ->orWhereHas('user', fn (Builder $userQuery) => $userQuery
                        ->where('name', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('email', 'like', $like));
            });
        }

        return $query;
    }
}
