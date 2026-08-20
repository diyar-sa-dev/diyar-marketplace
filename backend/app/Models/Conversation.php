<?php

namespace App\Models;

use App\Enums\ConversationLifecycleStatus;
use App\Enums\ConversationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'type',
        'subject',
        'context_type',
        'context_id',
        'vendor_account_id',
        'provider_account_id',
        'created_by',
        'last_message_id',
        'last_message_at',
        'retention_policy',
        'retain_until',
        'lifecycle_status',
    ];

    protected function casts(): array
    {
        return [
            'type' => ConversationType::class,
            'lifecycle_status' => ConversationLifecycleStatus::class,
            'last_message_at' => 'datetime',
            'retain_until' => 'datetime',
        ];
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Hide draft conversations from recipients until the first message is sent.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeVisibleInInboxFor(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $inner) use ($user): void {
            $inner->whereNotNull('last_message_at')
                ->orWhere('created_by', $user->id);
        });
    }
}
