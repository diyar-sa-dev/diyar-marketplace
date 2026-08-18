<?php

namespace App\Models;

use App\Enums\VendorTeamRole;
use App\Enums\VendorTeamStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorTeamMember extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'user_id',
        'email',
        'role',
        'status',
        'invite_token',
        'invited_at',
        'accepted_at',
        'vendor_role_granted',
        'invited_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'role' => VendorTeamRole::class,
            'status' => VendorTeamStatus::class,
            'invited_at' => 'datetime',
            'accepted_at' => 'datetime',
            'vendor_role_granted' => 'boolean',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}
