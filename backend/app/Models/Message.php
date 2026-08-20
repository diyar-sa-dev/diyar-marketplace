<?php

namespace App\Models;

use App\Enums\MessageType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'message_type',
        'idempotency_key',
        'edited_at',
        'deleted_at',
        'reply_to_message_id',
        'archived_at',
        'archive_batch_id',
    ];

    protected function casts(): array
    {
        return [
            'message_type' => MessageType::class,
            'archived_at' => 'datetime',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }
}
