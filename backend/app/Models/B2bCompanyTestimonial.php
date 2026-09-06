<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class B2bCompanyTestimonial extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'b2b_company_id',
        'author_name',
        'author_role',
        'rating',
        'content',
        'sort_order',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(B2bCompany::class, 'b2b_company_id');
    }
}
