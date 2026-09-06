<?php

namespace App\Services\B2b;

use App\Enums\B2bLeadBudgetRange;
use App\Enums\B2bLeadStatus;
use App\Events\Domain\B2bLeadReceived;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class B2bLeadService
{
    public function __construct(
        private readonly B2bQueryService $query,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createLead(B2bCompany $company, User $user, array $attributes): B2bLead
    {
        $this->assertNotDuplicate($company, $user, (string) $attributes['project_type']);

        return DB::transaction(function () use ($company, $user, $attributes): B2bLead {
            $lead = B2bLead::query()->create([
                'b2b_company_id' => $company->id,
                'user_id' => $user->id,
                'project_type' => $attributes['project_type'],
                'estimated_quantity' => $attributes['estimated_quantity'] ?? null,
                'details' => $attributes['details'],
                'budget_range' => $attributes['budget_range'] ?? B2bLeadBudgetRange::Unspecified->value,
                'status' => B2bLeadStatus::New,
            ]);

            DB::afterCommit(fn () => event(new B2bLeadReceived($lead)));

            return $lead;
        });
    }

    public function resolvePublishedCompany(string $slug): B2bCompany
    {
        return $this->query->findPublishedBySlug($slug);
    }

    private function assertNotDuplicate(B2bCompany $company, User $user, string $projectType): void
    {
        $recent = B2bLead::query()
            ->where('b2b_company_id', $company->id)
            ->where('user_id', $user->id)
            ->where('project_type', $projectType)
            ->where('created_at', '>=', now()->subHour())
            ->exists();

        if ($recent) {
            throw new TooManyRequestsHttpException(
                3600,
                __('diyar.b2b.lead_duplicate'),
            );
        }

        $dailyCount = B2bLead::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        if ($dailyCount >= 20) {
            throw new TooManyRequestsHttpException(
                86400,
                __('diyar.b2b.lead_daily_limit'),
            );
        }

        if (trim($projectType) === '') {
            throw new UnprocessableEntityHttpException(__('diyar.b2b.lead_invalid'));
        }
    }
}
