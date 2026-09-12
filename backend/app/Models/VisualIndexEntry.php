<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisualIndexEntry extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'product_id',
        'product_image_id',
        'media_file_id',
        'hash_bits',
        'hash_bucket',
        'engine_version',
        'representation_version',
        'index_version',
        'is_active',
        'indexed_at',
    ];

    protected function casts(): array
    {
        return [
            'hash_bucket' => 'integer',
            'is_active' => 'boolean',
            'indexed_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productImage(): BelongsTo
    {
        return $this->belongsTo(ProductImage::class);
    }

    public function mediaFile(): BelongsTo
    {
        return $this->belongsTo(MediaFile::class);
    }
}
