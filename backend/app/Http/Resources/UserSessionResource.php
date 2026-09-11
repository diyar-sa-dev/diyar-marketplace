<?php

namespace App\Http\Resources;

use App\Models\UserSession;
use App\Services\Security\IpGeolocationService;
use App\Support\Security\SessionLookupHash;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UserSession */
class UserSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentHash = $request->hasSession()
            ? SessionLookupHash::make($request->session()->getId())
            : null;

        $ipAddress = $this->ip_address;

        return [
            'id' => $this->id,
            'device_type' => $this->device_type,
            'browser' => $this->browser,
            'browser_version' => $this->browser_version,
            'platform' => $this->platform,
            'platform_version' => $this->platform_version,
            'device_name' => $this->device_name,
            'country' => $this->country,
            'city' => $this->city,
            'region' => $this->region,
            'location_source' => $this->location_source,
            'ip_address' => $ipAddress,
            'is_local_ip' => $ipAddress !== null && IpGeolocationService::isPrivateOrLocal($ipAddress),
            'is_current' => $currentHash !== null && $this->session_lookup_hash === $currentHash,
            'first_seen_at' => $this->first_seen_at?->toIso8601String(),
            'last_activity_at' => $this->last_activity_at?->toIso8601String(),
        ];
    }
}
