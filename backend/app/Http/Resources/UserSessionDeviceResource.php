<?php

namespace App\Http\Resources;

use App\Services\Security\IpGeolocationService;
use App\Support\Security\UserSessionDeviceGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UserSessionDeviceGroup */
class UserSessionDeviceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $primary = $this->primary;
        $ipAddress = $primary->ip_address;

        return [
            'fingerprint' => $this->fingerprint,
            'device_type' => $primary->device_type,
            'browser' => $primary->browser,
            'browser_version' => $primary->browser_version,
            'platform' => $primary->platform,
            'platform_version' => $primary->platform_version,
            'device_name' => $primary->device_name,
            'country' => $primary->country,
            'city' => $primary->city,
            'region' => $primary->region,
            'location_source' => $primary->location_source,
            'ip_address' => $ipAddress,
            'is_local_ip' => $ipAddress !== null && IpGeolocationService::isPrivateOrLocal($ipAddress),
            'is_current' => $this->isCurrent,
            'session_count' => $this->sessionCount(),
            'first_seen_at' => $this->firstSeenAt()?->toIso8601String(),
            'last_activity_at' => $this->lastActivityAt()?->toIso8601String(),
            'sessions' => UserSessionResource::collection($this->sessions),
        ];
    }
}
