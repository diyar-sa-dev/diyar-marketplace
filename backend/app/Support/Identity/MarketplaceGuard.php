<?php

namespace App\Support\Identity;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Explicit marketplace (web guard) identity resolution.
 * Never infer marketplace identity from admin guard or role alone.
 */
final class MarketplaceGuard
{
    public static function user(?Request $request = null): ?User
    {
        $request ??= request();

        if ($request !== null) {
            /** @var User|null $user */
            $user = $request->user('web');

            return $user;
        }

        /** @var User|null $user */
        $user = Auth::guard('web')->user();

        return $user;
    }

    public static function check(?Request $request = null): bool
    {
        return self::user($request) !== null;
    }
}
