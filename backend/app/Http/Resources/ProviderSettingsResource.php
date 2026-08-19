<?php

namespace App\Http\Resources;

use App\Models\ProviderAccount;
use App\Models\User;
use App\Services\ServiceMarketplace\ProviderSettingsService;
use App\Support\ServiceMarketplace\ServiceMarketplacePresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array{provider: ProviderAccount, user: User} */
class ProviderSettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ProviderAccount $provider */
        $provider = $this->resource['provider'];
        /** @var User $user */
        $user = $this->resource['user'];
        $presenter = app(ServiceMarketplacePresenter::class);
        $settings = app(ProviderSettingsService::class);

        return [
            'profile' => [
                'avatar_url' => $presenter->mediaUrl($provider->avatar_path),
                'specialty' => $provider->business_name,
                'bio' => $provider->bio,
                'work_areas' => $provider->location,
            ],
            'working_hours' => $presenter->formatWorkingHours($provider->working_hours),
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'notifications' => $settings->notificationPreferences($user),
            'bank_accounts' => ProviderBankAccountResource::collection(
                $provider->relationLoaded('activeBankAccounts')
                    ? $provider->activeBankAccounts
                    : $provider->activeBankAccounts()->get(),
            )->resolve(),
            'payout_schedule' => config('diyar.finance.payout_schedule', [
                'min_days' => 1,
                'max_days' => 3,
            ]),
        ];
    }
}
