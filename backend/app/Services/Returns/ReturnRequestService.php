<?php

namespace App\Services\Returns;

use App\Enums\ReturnReason;
use App\Enums\ReturnRequestStatus;
use App\Models\OrderItem;
use App\Models\ReturnItem;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Models\VendorOrder;
use App\Services\Returns\DTO\EffectiveReturnPolicy;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ReturnRequestService
{
    public function __construct(
        private readonly ReturnEligibilityService $eligibility,
        private readonly ReturnReferenceService $references,
        private readonly ReturnStateService $state,
        private readonly RefundProcessingService $refundProcessing,
    ) {}

    /**
     * @param  array{
     *   vendor_order_id: string,
     *   reason: string,
     *   customer_note?: ?string,
     *   items: list<array{order_item_id: string, quantity: int}>
     * }  $payload
     */
    public function create(User $user, array $payload): ReturnRequest
    {
        $vendorOrder = VendorOrder::query()
            ->with(['order', 'items.product', 'vendorAccount'])
            ->findOrFail($payload['vendor_order_id']);

        if ($vendorOrder->order?->user_id !== $user->id) {
            throw new InvalidArgumentException(__('diyar.returns.order_not_owned'));
        }

        if ($vendorOrder->items->isEmpty()) {
            throw new InvalidArgumentException(__('diyar.returns.no_items'));
        }

        $reason = ReturnReason::from($payload['reason']);

        return DB::transaction(function () use ($user, $payload, $vendorOrder, $reason) {
            $returnItems = [];
            $itemPolicies = [];

            foreach ($payload['items'] as $itemPayload) {
                /** @var OrderItem|null $orderItem */
                $orderItem = OrderItem::query()
                    ->where('id', $itemPayload['order_item_id'])
                    ->where('vendor_order_id', $vendorOrder->id)
                    ->lockForUpdate()
                    ->first();

                if ($orderItem === null) {
                    throw new InvalidArgumentException(__('diyar.returns.item_not_in_vendor_order'));
                }

                $vendorOrder->loadMissing(['order', 'items.product', 'vendorAccount', 'shipment']);
                $orderItem->loadMissing('product');

                $policy = $this->eligibility->assertCanRequest(
                    $vendorOrder,
                    $orderItem,
                    $reason,
                    (int) $itemPayload['quantity'],
                );

                $itemPolicies[$orderItem->id] = $policy;

                $unitPrice = number_format((float) $orderItem->unit_price, 2, '.', '');
                $quantity = (int) $itemPayload['quantity'];
                $lineSubtotal = bcmul($unitPrice, (string) $quantity, 2);

                $returnItems[] = [
                    'order_item_id' => $orderItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_subtotal' => $lineSubtotal,
                ];
            }

            if ($itemPolicies === []) {
                throw new InvalidArgumentException(__('diyar.returns.not_eligible'));
            }

            $policySnapshot = $this->buildPolicySnapshot($itemPolicies);

            $returnRequest = ReturnRequest::query()->create([
                'reference' => $this->references->nextReturnReference(),
                'order_id' => $vendorOrder->order_id,
                'vendor_order_id' => $vendorOrder->id,
                'user_id' => $user->id,
                'status' => ReturnRequestStatus::Requested,
                'reason' => $reason,
                'customer_note' => $payload['customer_note'] ?? null,
                'submitted_at' => now(),
                'policy_snapshot' => $policySnapshot,
            ]);

            foreach ($returnItems as $itemData) {
                ReturnItem::query()->create([
                    'return_request_id' => $returnRequest->id,
                    ...$itemData,
                ]);
            }

            return $returnRequest->fresh(['items.orderItem', 'vendorOrder', 'order']);
        });
    }

    public function submitForReview(ReturnRequest $returnRequest): ReturnRequest
    {
        return $this->state->transition($returnRequest, ReturnRequestStatus::UnderReview);
    }

    public function approve(ReturnRequest $returnRequest, ?string $vendorNote = null): ReturnRequest
    {
        if (
            ReturnPolicySnapshot::requiresEvidence((array) $returnRequest->policy_snapshot)
            && ! $returnRequest->evidence()->exists()
        ) {
            throw new InvalidArgumentException(__('diyar.returns.evidence_required'));
        }

        $updated = $this->state->transition($returnRequest, ReturnRequestStatus::Approved, array_filter([
            'vendor_note' => $vendorNote,
        ]));

        return $this->state->transition($updated, ReturnRequestStatus::AwaitingReturn);
    }

    public function reject(ReturnRequest $returnRequest, ?string $vendorNote = null): ReturnRequest
    {
        return $this->state->transition($returnRequest, ReturnRequestStatus::Rejected, array_filter([
            'vendor_note' => $vendorNote,
        ]));
    }

    public function markReceived(ReturnRequest $returnRequest): ReturnRequest
    {
        return $this->state->transition($returnRequest, ReturnRequestStatus::Received);
    }

    public function markInspected(ReturnRequest $returnRequest): ReturnRequest
    {
        return $this->state->transition($returnRequest, ReturnRequestStatus::Inspected);
    }

    public function processRefund(ReturnRequest $returnRequest, string $idempotencyKey): ReturnRequest
    {
        $this->refundProcessing->process($returnRequest, $idempotencyKey);

        return $returnRequest->fresh(['items.orderItem', 'refund', 'vendorOrder', 'order']);
    }

    /**
     * @param  array<string, EffectiveReturnPolicy>  $itemPolicies
     * @return array<string, mixed>
     */
    private function buildPolicySnapshot(array $itemPolicies): array
    {
        /** @var EffectiveReturnPolicy $primary */
        $primary = reset($itemPolicies);
        $effective = $primary->toArray();
        $effective['shipping_refundable'] = array_reduce(
            $itemPolicies,
            static fn (bool $carry, EffectiveReturnPolicy $policy): bool => $carry && $policy->shippingRefundable,
            true,
        );

        $items = [];
        foreach ($itemPolicies as $orderItemId => $policy) {
            $items[$orderItemId] = $policy->toArray();
        }

        return [
            'effective' => $effective,
            'items' => $items,
            'frozen_at' => now()->toIso8601String(),
        ];
    }
}
