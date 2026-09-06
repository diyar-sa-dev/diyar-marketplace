<?php

namespace App\Support\B2b;

use App\Models\B2bCompany;
use App\Models\User;

final class B2bNotificationSupport
{
    public static function resolveOwner(B2bCompany $company): ?User
    {
        $company->loadMissing(['owner', 'vendorAccount.user', 'providerAccount.user']);

        return $company->owner
            ?? $company->vendorAccount?->user
            ?? $company->providerAccount?->user;
    }

    public static function partnerDashboardUrl(B2bCompany $company): string
    {
        $base = rtrim((string) config('diyar.frontend_url'), '/');
        $path = $company->provider_account_id !== null
            ? '/dashboard/service/b2b'
            : '/dashboard/vendor/b2b';

        return $base.$path;
    }

    public static function customerLeadsUrl(?string $leadId = null): string
    {
        $base = rtrim((string) config('diyar.frontend_url'), '/');
        $url = $base.'/orders?tab=b2b';

        if ($leadId !== null && $leadId !== '') {
            $url .= '&highlight='.rawurlencode($leadId);
        }

        return $url;
    }
}
