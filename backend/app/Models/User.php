<?php

namespace App\Models;

use App\Enums\RoleName;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'bio',
        'avatar_path',
        'preferences',
        'password',
        'status',
        'phone_verified_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'status' => UserStatus::class,
            'phone_verified_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->using(UserRole::class)
            ->withPivot(['id', 'status'])
            ->withTimestamps();
    }

    public function vendorAccount(): HasOne
    {
        return $this->hasOne(VendorAccount::class);
    }

    public function providerAccount(): HasOne
    {
        return $this->hasOne(ProviderAccount::class);
    }

    public function hasRole(string|RoleName $roleName): bool
    {
        $name = $roleName instanceof RoleName ? $roleName->value : $roleName;

        return $this->roles->contains(fn (Role $role) => $role->name->value === $name);
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }
}
