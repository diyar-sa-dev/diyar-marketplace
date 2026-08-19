<?php

namespace App\Models;

use App\Enums\SaudiBank;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderBankAccount extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'provider_account_id',
        'bank_code',
        'beneficiary_name',
        'iban',
        'iban_last4',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'bank_code' => SaudiBank::class,
            'is_active' => 'boolean',
        ];
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }
}
