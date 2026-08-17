<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderNumberSequence extends Model
{
    public $incrementing = false;

    protected $primaryKey = 'date';

    protected $keyType = 'string';

    protected $fillable = [
        'date',
        'last_sequence',
    ];

    protected function casts(): array
    {
        return [
            'last_sequence' => 'integer',
        ];
    }
}
