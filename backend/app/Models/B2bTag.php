<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class B2bTag extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'slug',
        'name',
    ];

    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(B2bCompany::class, 'b2b_company_tag', 'b2b_tag_id', 'b2b_company_id');
    }
}
