<?php

namespace App\Http\Resources;

use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorAccount */
class VendorSettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'business_name' => $this->business_name,
            'slug' => $this->slug,
            'store_domain' => (string) config('diyar.vendor.store_domain', 'diyar.sa'),
            'description' => $this->description,
            'location' => $this->location,
            'support_phone' => $this->support_phone,
            'support_email' => $this->support_email,
            'website_url' => $this->website_url,
            'logo_url' => $media->url($this->logo_path),
            'cover_url' => $media->url($this->cover_path),
            'legal_profile' => $this->whenLoaded('legalProfile', fn () => $this->legalProfile !== null
                ? new VendorLegalProfileResource($this->legalProfile)
                : null),
            'bank_account' => $this->whenLoaded('activeBankAccount', fn () => $this->activeBankAccount !== null
                ? new VendorBankAccountResource($this->activeBankAccount)
                : null),
            'working_hours' => VendorWorkingHourResource::collection($this->whenLoaded('workingHours')),
            'payout_schedule' => [
                'min_days' => (int) config('diyar.finance.payout_schedule.min_days', 1),
                'max_days' => (int) config('diyar.finance.payout_schedule.max_days', 3),
            ],
            'payout_minimum' => number_format((float) config('diyar.finance.payout_minimum', '100.00'), 2, '.', ''),
        ];
    }
}
