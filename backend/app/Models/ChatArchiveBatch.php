<?php

namespace App\Models;

use App\Enums\ChatArchiveBatchStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatArchiveBatch extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'message_count',
        'checksum',
        'storage_disk',
        'storage_location',
        'status',
        'error_message',
        'started_at',
        'uploaded_at',
        'verified_at',
        'safe_to_purge_at',
        'completed_at',
        'promoted_by',
        'promoted_via',
        'promotion_note',
    ];

    protected function casts(): array
    {
        return [
            'status' => ChatArchiveBatchStatus::class,
            'message_count' => 'integer',
            'started_at' => 'datetime',
            'uploaded_at' => 'datetime',
            'verified_at' => 'datetime',
            'safe_to_purge_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'archive_batch_id');
    }

    public function canPurge(): bool
    {
        return $this->status === ChatArchiveBatchStatus::SafeToPurge;
    }
}
