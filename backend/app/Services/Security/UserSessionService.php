<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\UserSession;
use App\Support\Security\RevokedSessionCache;
use App\Support\Security\SessionLookupHash;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\UniqueConstraintViolationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserSessionService
{
    public function __construct(
        private readonly UserAgentParser $userAgentParser,
        private readonly IpGeolocationService $geolocation,
    ) {}

    public function registerFromRequest(User $user, Request $request): UserSession
    {
        if (! $request->hasSession()) {
            throw new \RuntimeException('Session is required to register a user session.');
        }

        $sessionId = $request->session()->getId();
        $sessionHash = SessionLookupHash::make($sessionId);
        $agent = $this->userAgentParser->parse($request->userAgent());
        $location = $this->geolocation->resolveForRegistration($request);
        $now = now();

        /** @var UserSession|null $existing */
        $existing = UserSession::query()
            ->where('session_lookup_hash', $sessionHash)
            ->first();

        if ($existing !== null) {
            if ($existing->revoked_at !== null) {
                $existing->forceFill([
                    'user_id' => $user->id,
                    'laravel_session_id' => $sessionId,
                    'revoked_at' => null,
                    'last_activity_at' => $now,
                    'ip_address' => $request->ip(),
                    ...$agent,
                    ...$location,
                ])->save();

                RevokedSessionCache::rememberActive($sessionId);
                $this->enforceActiveSessionLimit($user);

                return $existing->fresh();
            }

            $existing->forceFill([
                'user_id' => $user->id,
                'laravel_session_id' => $sessionId,
                'last_activity_at' => $now,
                'ip_address' => $request->ip(),
                ...$agent,
                ...$location,
            ])->save();

            RevokedSessionCache::rememberActive($sessionId);

            return $existing->fresh();
        }

        try {
            $created = UserSession::query()->create([
                'user_id' => $user->id,
                'session_lookup_hash' => $sessionHash,
                'laravel_session_id' => $sessionId,
                ...$agent,
                'ip_address' => $request->ip(),
                ...$location,
                'first_seen_at' => $now,
                'last_activity_at' => $now,
            ]);

            RevokedSessionCache::rememberActive($sessionId);
            $this->enforceActiveSessionLimit($user);

            return $created;
        } catch (UniqueConstraintViolationException) {
            $raceWinner = UserSession::query()
                ->where('session_lookup_hash', $sessionHash)
                ->firstOrFail();

            $raceWinner->forceFill([
                'user_id' => $user->id,
                'laravel_session_id' => $sessionId,
                'last_activity_at' => $now,
                'revoked_at' => null,
            ])->save();

            RevokedSessionCache::rememberActive($sessionId);

            return $raceWinner->fresh();
        }
    }

    public function touchActivity(User $user, string $laravelSessionId): void
    {
        try {
            $throttleSeconds = (int) config('diyar.security.session_activity_throttle_seconds', 300);
            $cacheKey = 'user_session_activity:'.SessionLookupHash::make($laravelSessionId);

            if (! Cache::add($cacheKey, true, $throttleSeconds)) {
                return;
            }

            UserSession::query()
                ->where('user_id', $user->id)
                ->where('session_lookup_hash', SessionLookupHash::make($laravelSessionId))
                ->whereNull('revoked_at')
                ->update(['last_activity_at' => now()]);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    public function shouldAttemptBackfill(string $laravelSessionId): bool
    {
        try {
            $throttleSeconds = (int) config('diyar.security.session_backfill_throttle_seconds', 60);

            return Cache::add(
                'user_session_backfill:'.SessionLookupHash::make($laravelSessionId),
                true,
                $throttleSeconds,
            );
        } catch (\Throwable) {
            return true;
        }
    }

    public function isCurrentSessionRevoked(string $laravelSessionId): bool
    {
        if (RevokedSessionCache::isRevoked($laravelSessionId)) {
            return true;
        }

        $hash = SessionLookupHash::make($laravelSessionId);

        $revoked = UserSession::query()
            ->where('session_lookup_hash', $hash)
            ->whereNotNull('revoked_at')
            ->exists();

        if ($revoked) {
            RevokedSessionCache::markRevoked($laravelSessionId);

            return true;
        }

        RevokedSessionCache::rememberActive($laravelSessionId);

        return false;
    }

    /**
     * @return Collection<int, UserSession>
     */
    public function listActiveForUser(User $user): Collection
    {
        return UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->orderByDesc('last_activity_at')
            ->limit((int) config('diyar.security.max_active_sessions_per_user', 25))
            ->get();
    }

    public function findActiveOwnedSession(User $user, string $publicSessionId): UserSession
    {
        $session = UserSession::query()
            ->where('user_id', $user->id)
            ->whereKey($publicSessionId)
            ->whereNull('revoked_at')
            ->first();

        if ($session === null) {
            throw new NotFoundHttpException(__('diyar.profile.security.session_not_found'));
        }

        return $session;
    }

    public function revokeOwnedSession(User $user, string $publicSessionId, ?string $currentLaravelSessionId): void
    {
        $session = $this->findActiveOwnedSession($user, $publicSessionId);

        if ($currentLaravelSessionId !== null
            && SessionLookupHash::make($currentLaravelSessionId) === $session->session_lookup_hash) {
            throw new AccessDeniedHttpException(__('diyar.profile.security.cannot_revoke_current_session'));
        }

        $this->revokeSessionRecord($session, invalidateRememberToken: true);
    }

    public function revokeOthers(User $user, string $currentLaravelSessionId): int
    {
        $currentHash = SessionLookupHash::make($currentLaravelSessionId);

        $sessions = UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->where('session_lookup_hash', '!=', $currentHash)
            ->get();

        foreach ($sessions as $session) {
            $this->revokeSessionRecord($session, invalidateRememberToken: false);
        }

        if ($sessions->isNotEmpty()) {
            $this->invalidateRememberToken($user);
        }

        return $sessions->count();
    }

    public function revokeAllForUser(User $user): int
    {
        $sessions = UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->get();

        foreach ($sessions as $session) {
            $this->revokeSessionRecord($session, invalidateRememberToken: false);
        }

        $this->invalidateRememberToken($user);

        return $sessions->count();
    }

    public function revokeByLaravelSessionId(string $laravelSessionId): void
    {
        $session = UserSession::query()
            ->where('session_lookup_hash', SessionLookupHash::make($laravelSessionId))
            ->whereNull('revoked_at')
            ->first();

        if ($session === null) {
            return;
        }

        $this->revokeSessionRecord($session, invalidateRememberToken: false);
    }

    public function syncSessionIdAfterRegeneration(User $user, string $oldLaravelSessionId, string $newLaravelSessionId): void
    {
        $oldHash = SessionLookupHash::make($oldLaravelSessionId);
        $newHash = SessionLookupHash::make($newLaravelSessionId);

        UserSession::query()
            ->where('user_id', $user->id)
            ->where('session_lookup_hash', $oldHash)
            ->whereNull('revoked_at')
            ->update([
                'session_lookup_hash' => $newHash,
                'laravel_session_id' => $newLaravelSessionId,
                'last_activity_at' => now(),
            ]);

        RevokedSessionCache::markRevoked($oldLaravelSessionId);
        RevokedSessionCache::rememberActive($newLaravelSessionId);
    }

    private function revokeSessionRecord(UserSession $session, bool $invalidateRememberToken): void
    {
        if ($session->revoked_at !== null) {
            return;
        }

        $plainSessionId = (string) $session->laravel_session_id;

        RevokedSessionCache::markRevoked($plainSessionId);

        DB::transaction(function () use ($session, $invalidateRememberToken, $plainSessionId): void {
            $session->forceFill([
                'revoked_at' => now(),
                'ip_address' => null,
                'city' => null,
                'region' => null,
            ])->save();

            $this->destroyLaravelSession($plainSessionId);

            if ($invalidateRememberToken) {
                $this->invalidateRememberToken($session->user);
            }
        });
    }

    private function invalidateRememberToken(User $user): void
    {
        User::query()->whereKey($user->id)->update(['remember_token' => null]);
    }

    private function destroyLaravelSession(string $laravelSessionId): void
    {
        try {
            if (app()->bound('session')) {
                app('session')->getHandler()->destroy($laravelSessionId);
            }
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function enforceActiveSessionLimit(User $user): void
    {
        $limit = (int) config('diyar.security.max_active_sessions_per_user', 25);
        if ($limit <= 0) {
            return;
        }

        $active = UserSession::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->orderByDesc('last_activity_at')
            ->get();

        if ($active->count() <= $limit) {
            return;
        }

        $active->slice($limit)->each(function (UserSession $session): void {
            $this->revokeSessionRecord($session, invalidateRememberToken: false);
        });
    }
}
