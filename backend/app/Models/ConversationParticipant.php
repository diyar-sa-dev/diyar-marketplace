<?php

namespace App\Models;

use App\Enums\ConversationParticipantRole;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'conversation_id',
        'user_id',
        'participant_role',
        'unread_count',
        'last_read_at',
        'last_delivered_at',
        'joined_at',
        'left_at',
        'inbox_hidden_at',
    ];

    protected function casts(): array
    {
        return [
            'participant_role' => ConversationParticipantRole::class,
            'unread_count' => 'integer',
            'last_read_at' => 'datetime',
            'last_delivered_at' => 'datetime',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'inbox_hidden_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->left_at === null;
    }
}
