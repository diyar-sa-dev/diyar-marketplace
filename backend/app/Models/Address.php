<?php

namespace App\Models;

use App\Enums\AddressType;
use Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'label',
        'type',
        'recipient_name',
        'phone',
        'city',
        'district',
        'street',
        'building',
        'apartment',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'type' => AddressType::class,
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function formattedSummary(): string
    {
        return collect([
            $this->city,
            $this->district,
            $this->street,
            $this->building ? __('diyar.profile.building_prefix', ['value' => $this->building]) : null,
            $this->apartment ? __('diyar.profile.apartment_prefix', ['value' => $this->apartment]) : null,
        ])->filter()->implode('، ');
    }
}
