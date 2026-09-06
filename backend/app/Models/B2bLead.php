<?php

namespace App\Models;

use App\Enums\B2bLeadBudgetRange;
use App\Enums\B2bLeadStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class B2bLead extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'b2b_company_id',
        'user_id',
        'project_type',
        'estimated_quantity',
        'details',
        'budget_range',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'budget_range' => B2bLeadBudgetRange::class,
            'status' => B2bLeadStatus::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(B2bCompany::class, 'b2b_company_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(B2bCompanyReview::class, 'b2b_lead_id');
    }
}
