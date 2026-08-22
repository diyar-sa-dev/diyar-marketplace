<?php

namespace App\Services\Admin;

use App\Enums\AdminPermission;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Services\Returns\ReturnRequestService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class AdminReturnService
{
    public function __construct(
        private readonly ReturnRequestService $returns,
        private readonly AdminAuditService $audit,
        private readonly AdminPermissionService $permissions,
    ) {}

    public function submitForReview(ReturnRequest $returnRequest, User $actor): ReturnRequest
    {
        $this->requireApprove($actor);

        return $this->mutate($returnRequest, $actor, 'return.submit_for_review', fn () => $this->returns->submitForReview($returnRequest));
    }

    public function approve(ReturnRequest $returnRequest, User $actor, ?string $note = null): ReturnRequest
    {
        $this->requireApprove($actor);

        return $this->mutate(
            $returnRequest,
            $actor,
            'return.approve',
            fn () => $this->returns->approve($returnRequest, $note),
            $note,
        );
    }

    public function reject(ReturnRequest $returnRequest, User $actor, ?string $note = null): ReturnRequest
    {
        $this->requireApprove($actor);

        return $this->mutate(
            $returnRequest,
            $actor,
            'return.reject',
            fn () => $this->returns->reject($returnRequest, $note),
            $note,
        );
    }

    public function markReceived(ReturnRequest $returnRequest, User $actor): ReturnRequest
    {
        $this->requireApprove($actor);

        return $this->mutate($returnRequest, $actor, 'return.mark_received', fn () => $this->returns->markReceived($returnRequest));
    }

    public function markInspected(ReturnRequest $returnRequest, User $actor): ReturnRequest
    {
        $this->requireApprove($actor);

        return $this->mutate($returnRequest, $actor, 'return.mark_inspected', fn () => $this->returns->markInspected($returnRequest));
    }

    public function processRefund(ReturnRequest $returnRequest, User $actor, string $idempotencyKey): ReturnRequest
    {
        $this->requireApprove($actor);

        return DB::transaction(function () use ($returnRequest, $actor, $idempotencyKey): ReturnRequest {
            $before = ['status' => $returnRequest->status->value];
            $updated = $this->returns->processRefund($returnRequest, $idempotencyKey);

            $this->audit->record(
                actor: $actor,
                action: 'return.process_refund',
                resource: $updated,
                before: $before,
                after: [
                    'status' => $updated->status->value,
                    'idempotency_key' => $idempotencyKey,
                ],
            );

            return $updated->fresh(['user', 'vendorOrder', 'order', 'refund', 'items']);
        });
    }

    private function mutate(
        ReturnRequest $returnRequest,
        User $actor,
        string $action,
        callable $callback,
        ?string $reason = null,
    ): ReturnRequest {
        return DB::transaction(function () use ($returnRequest, $actor, $action, $callback, $reason): ReturnRequest {
            $before = ['status' => $returnRequest->status->value];
            $updated = $callback();

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
                reason: $reason,
            );

            return $updated->fresh(['user', 'vendorOrder', 'order', 'refund', 'items']);
        });
    }

    private function requireApprove(User $actor): void
    {
        if (! $this->permissions->has($actor, AdminPermission::RefundsApprove)) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }
}
