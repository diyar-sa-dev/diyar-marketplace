<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class B2bCompanyReview extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'b2b_company_id',
        'b2b_lead_id',
        'rating',
        'comment',
        'company_reply',
        'company_replied_at',
        'company_replied_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'company_replied_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(B2bCompany::class, 'b2b_company_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(B2bLead::class, 'b2b_lead_id');
    }

    public function companyRepliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_replied_by_user_id');
    }
}
