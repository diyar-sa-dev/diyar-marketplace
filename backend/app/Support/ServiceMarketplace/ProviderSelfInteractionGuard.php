<?php

namespace App\Support\ServiceMarketplace;

use App\Models\ProviderAccount;
use App\Models\Service;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class ProviderSelfInteractionGuard
{
    public static function assertNotOwnProviderService(User $user, Service $service): void
    {
        $service->loadMissing('providerAccount');

        if ($service->providerAccount?->user_id === $user->id) {
            throw new AccessDeniedHttpException(__('diyar.services.bookings.cannot_book_own_service'));
        }
    }

    public static function assertNotOwnServiceForRequest(User $user, Service $service): void
    {
        $service->loadMissing('providerAccount');

        if ($service->providerAccount?->user_id === $user->id) {
            throw new AccessDeniedHttpException(__('diyar.services.requests.cannot_request_own_service'));
        }
    }

    public static function assertNotOwnProviderAccount(User $user, ?ProviderAccount $providerAccount): void
    {
        if ($providerAccount !== null && $providerAccount->user_id === $user->id) {
            throw new AccessDeniedHttpException(__('diyar.services.requests.cannot_request_own_service'));
        }
    }
}
