<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Models\ProviderAccount;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProviderAccountResolver
{
    public static function forUser(User $user): ProviderAccount
    {
        $provider = ProviderAccount::query()
            ->where('user_id', $user->id)
            ->where('status', ProviderAccountStatus::Active)
            ->first();

        if ($provider === null) {
            throw new NotFoundHttpException(__('diyar.services.provider_not_found'));
        }

        return $provider;
    }
}
