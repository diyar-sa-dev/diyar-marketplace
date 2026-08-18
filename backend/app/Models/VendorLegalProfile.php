<?php

namespace App\Models;

use App\Enums\BusinessEntityType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorLegalProfile extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'entity_type',
        'commercial_registration_number',
        'tax_number',
    ];

    protected function casts(): array
    {
        return [
            'entity_type' => BusinessEntityType::class,
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }
}
