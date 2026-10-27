<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CarrierConfiguration extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'carrier_code',
        'name',
        'is_active',
        'is_sandbox',
        'api_token_encrypted',
        'account_id_encrypted',
        'webhook_secret_encrypted',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_sandbox' => 'boolean',
            'api_token_encrypted' => 'encrypted',
            'account_id_encrypted' => 'encrypted',
            'webhook_secret_encrypted' => 'encrypted',
            'settings' => 'array',
        ];
    }
}
