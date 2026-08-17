<?php

namespace App\Http\Resources;

use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReturnRequest */
class ReturnRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'order_id' => $this->order_id,
            'vendor_order_id' => $this->vendor_order_id,
            'status' => $this->status->value,
            'reason' => $this->reason->value,
            'customer_note' => $this->customer_note,
            'vendor_note' => $this->vendor_note,
            'policy_snapshot' => $this->policy_snapshot,
            'items' => ReturnItemResource::collection($this->whenLoaded('items')),
            'evidence' => ReturnEvidenceResource::collection($this->whenLoaded('evidence')),
            'refund' => new RefundResource($this->whenLoaded('refund')),
            'order_number' => $this->whenLoaded('order', fn () => $this->order?->order_number),
            'vendor_name' => $this->whenLoaded('vendorOrder', fn () => $this->vendorOrder?->vendorAccount?->business_name),
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'received_at' => $this->received_at?->toIso8601String(),
            'inspected_at' => $this->inspected_at?->toIso8601String(),
            'refunded_at' => $this->refunded_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
