<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderWorkPolicy extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'provider_account_id',
        'policy_enabled',
        'initial_delivery_days',
        'free_revisions_included',
        'timeline_by_project_scope',
        'cancellation_notice_hours',
        'custom_terms',
    ];

    protected function casts(): array
    {
        return [
            'policy_enabled' => 'boolean',
            'initial_delivery_days' => 'integer',
            'free_revisions_included' => 'integer',
            'timeline_by_project_scope' => 'boolean',
            'cancellation_notice_hours' => 'integer',
            'custom_terms' => 'array',
        ];
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }
}
