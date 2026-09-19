<?php

namespace App\Support\Security;

use App\Models\UserSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

final class UserSessionDeviceGroup
{
    /**
     * @param  Collection<int, UserSession>  $sessions
     */
    public function __construct(
        public readonly string $fingerprint,
        public readonly UserSession $primary,
        public readonly Collection $sessions,
        public readonly bool $isCurrent,
    ) {}

    public function sessionCount(): int
    {
        return $this->sessions->count();
    }

    public function firstSeenAt(): ?Carbon
    {
        return $this->sessions->min('first_seen_at');
    }

    public function lastActivityAt(): ?Carbon
    {
        return $this->sessions->max('last_activity_at');
    }
}
