<?php

namespace App\Services\Chat;

use App\Enums\ConversationLifecycleStatus;
use App\Enums\ConversationParticipantRole;
use App\Enums\ConversationType;
use App\Enums\RoleName;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\ProviderAccount;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ConversationService
{
    public function __construct(
        private readonly ChatAuthorizationService $authorization,
        private readonly ChatUnreadCounterService $unreadCounter,
        private readonly ChatCacheService $cache,
    ) {}

    /**
     * @return array{items: list<Conversation>, pagination: array<string, mixed>}
     */
    public function listForUser(User $user, int $page = 1, int $perPage = 20): array
    {
        $query = Conversation::query()
            ->whereExists(function ($sub) use ($user) {
                $sub->selectRaw('1')
                    ->from('conversation_participants as cp')
                    ->whereColumn('cp.conversation_id', 'conversations.id')
                    ->where('cp.user_id', $user->id)
                    ->whereNull('cp.left_at')
                    ->where(function ($inner) {
                        $inner->whereNull('cp.inbox_hidden_at')
                            ->orWhereColumn('conversations.last_message_at', '>', 'cp.inbox_hidden_at');
                    });
            })
            ->visibleInInboxFor($user)
            ->with([
                'participants.user',
                'lastMessage.sender',
                'vendorAccount',
                'providerAccount',
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'items' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function findForUser(User $user, string $conversationId): Conversation
    {
        $conversation = Conversation::query()
            ->with(['participants.user', 'vendorAccount', 'providerAccount'])
            ->findOrFail($conversationId);

        $this->authorization->ensureParticipant($user, $conversation);
        $this->ensureVisibleInInbox($user, $conversation);

        return $conversation;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(User $creator, array $attributes): Conversation
    {
        $type = ConversationType::from((string) $attributes['type']);

        return DB::transaction(function () use ($creator, $type, $attributes) {
            $participants = $this->resolveParticipants($creator, $type, $attributes);
            $this->assertDistinctParticipants($participants);

            $existingDraft = $this->findExistingDraftConversation($creator, $type, $attributes);
            if ($existingDraft !== null) {
                ConversationParticipant::query()
                    ->where('conversation_id', $existingDraft->id)
                    ->where('user_id', $creator->id)
                    ->update(['inbox_hidden_at' => null]);

                return $existingDraft->load(['participants.user', 'vendorAccount', 'providerAccount']);
            }

            $conversation = Conversation::query()->create([
                'type' => $type,
                'subject' => $attributes['subject'] ?? null,
                'context_type' => $attributes['context_type'] ?? null,
                'context_id' => $attributes['context_id'] ?? null,
                'vendor_account_id' => $attributes['vendor_account_id'] ?? null,
                'provider_account_id' => $attributes['provider_account_id'] ?? null,
                'created_by' => $creator->id,
                'retention_policy' => $this->resolveRetentionPolicy($attributes),
                'lifecycle_status' => ConversationLifecycleStatus::Active,
            ]);

            foreach ($participants as $participant) {
                ConversationParticipant::query()->create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $participant['user_id'],
                    'participant_role' => $participant['role'],
                    'joined_at' => now(),
                ]);

                $this->unreadCounter->forgetUserTotal((string) $participant['user_id']);
            }

            return $conversation->load(['participants.user', 'vendorAccount', 'providerAccount']);
        });
    }

    public function markRead(User $user, Conversation $conversation): void
    {
        app(ChatPresenceService::class)->touch($user, $conversation->id);

        $participant = $this->authorization->ensureParticipant($user, $conversation);

        if ($participant->unread_count === 0 && $participant->last_read_at !== null) {
            return;
        }

        $participant->update([
            'unread_count' => 0,
            'last_read_at' => now(),
            'last_delivered_at' => now(),
        ]);

        $this->unreadCounter->forgetUserTotal($user->id);
        $this->cache->invalidateForRead($conversation->id, $user->id);
    }

    public function removeFromInbox(User $user, Conversation $conversation): void
    {
        $participant = $this->authorization->ensureParticipant($user, $conversation);

        $participant->update([
            'inbox_hidden_at' => now(),
            'unread_count' => 0,
        ]);

        $this->unreadCounter->forgetUserTotal($user->id);
        $this->cache->invalidateForRead($conversation->id, $user->id);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolveRetentionPolicy(array $attributes): string
    {
        $contextType = (string) ($attributes['context_type'] ?? '');
        $protected = config('diyar.chat.retention.protected_context_types', []);

        if ($contextType !== '' && in_array($contextType, $protected, true)) {
            return 'business_critical';
        }

        return 'standard';
    }

    /**
     * @return list<array{user_id: string, role: ConversationParticipantRole}>
     */
    private function resolveParticipants(User $creator, ConversationType $type, array $attributes): array
    {
        $creatorRole = $this->authorization->resolveCreatorRoleForConversation($creator, $type, $attributes);

        return match ($type) {
            ConversationType::CustomerVendor => $this->resolveCustomerVendorParticipants($creator, $creatorRole, $attributes),
            ConversationType::CustomerProvider => $this->resolveCustomerProviderParticipants($creator, $creatorRole, $attributes),
            ConversationType::CustomerAdmin => $this->resolveCustomerAdminParticipants($creator, $creatorRole, $attributes),
        };
    }

    /**
     * @return list<array{user_id: string, role: ConversationParticipantRole}>
     */
    private function resolveCustomerVendorParticipants(User $creator, ConversationParticipantRole $creatorRole, array $attributes): array
    {
        $vendorAccountId = (string) ($attributes['vendor_account_id'] ?? '');
        if ($vendorAccountId === '') {
            throw new InvalidArgumentException(__('diyar.chat.vendor_required'));
        }

        $vendor = VendorAccount::query()->findOrFail($vendorAccountId);

        if ($creatorRole === ConversationParticipantRole::Customer) {
            if ($creator->id === $vendor->user_id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            return [
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $vendor->user_id, 'role' => ConversationParticipantRole::Vendor],
            ];
        }

        if ($creatorRole === ConversationParticipantRole::Vendor && $creator->vendorAccount?->id === $vendor->id) {
            $customerId = (string) ($attributes['customer_user_id'] ?? '');
            if ($customerId === '') {
                throw new InvalidArgumentException(__('diyar.chat.customer_required'));
            }

            if ($customerId === $creator->id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            return [
                ['user_id' => $customerId, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Vendor],
            ];
        }

        throw new AuthorizationException(__('diyar.chat.cannot_create'));
    }

    /**
     * @return list<array{user_id: string, role: ConversationParticipantRole}>
     */
    private function resolveCustomerProviderParticipants(User $creator, ConversationParticipantRole $creatorRole, array $attributes): array
    {
        $providerAccountId = (string) ($attributes['provider_account_id'] ?? '');
        if ($providerAccountId === '') {
            throw new InvalidArgumentException(__('diyar.chat.provider_required'));
        }

        $provider = ProviderAccount::query()->findOrFail($providerAccountId);

        if ($creatorRole === ConversationParticipantRole::Customer) {
            if ($creator->id === $provider->user_id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            return [
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $provider->user_id, 'role' => ConversationParticipantRole::Provider],
            ];
        }

        if ($creatorRole === ConversationParticipantRole::Provider && $creator->providerAccount?->id === $provider->id) {
            $customerId = (string) ($attributes['customer_user_id'] ?? '');
            if ($customerId === '') {
                throw new InvalidArgumentException(__('diyar.chat.customer_required'));
            }

            if ($customerId === $creator->id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            return [
                ['user_id' => $customerId, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Provider],
            ];
        }

        throw new AuthorizationException(__('diyar.chat.cannot_create'));
    }

    /**
     * @return list<array{user_id: string, role: ConversationParticipantRole}>
     */
    private function resolveCustomerAdminParticipants(User $creator, ConversationParticipantRole $creatorRole, array $attributes): array
    {
        if ($creatorRole === ConversationParticipantRole::Customer) {
            $admin = User::query()
                ->whereHas('roles', fn ($q) => $q->where('name', RoleName::Admin->value))
                ->orderBy('created_at')
                ->first();

            if ($admin === null) {
                throw new InvalidArgumentException(__('diyar.chat.admin_unavailable'));
            }

            return [
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $admin->id, 'role' => ConversationParticipantRole::Admin],
            ];
        }

        if ($creatorRole === ConversationParticipantRole::Admin) {
            $customerId = (string) ($attributes['customer_user_id'] ?? '');
            if ($customerId === '') {
                throw new InvalidArgumentException(__('diyar.chat.customer_required'));
            }

            if ($customerId === $creator->id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            return [
                ['user_id' => $customerId, 'role' => ConversationParticipantRole::Customer],
                ['user_id' => $creator->id, 'role' => ConversationParticipantRole::Admin],
            ];
        }

        throw new AuthorizationException(__('diyar.chat.cannot_create'));
    }

    /**
     * Draft conversations (no messages yet) are visible only to their creator until the first message is sent.
     */
    private function ensureVisibleInInbox(User $user, Conversation $conversation): void
    {
        if ($conversation->last_message_at === null && $conversation->created_by !== $user->id) {
            throw new AuthorizationException(__('diyar.chat.not_participant'));
        }

        $participant = $conversation->participants->firstWhere('user_id', $user->id)
            ?? ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $user->id)
                ->whereNull('left_at')
                ->first();

        if (
            $participant?->inbox_hidden_at !== null
            && (
                $conversation->last_message_at === null
                || $conversation->last_message_at->lte($participant->inbox_hidden_at)
            )
        ) {
            throw new AuthorizationException(__('diyar.chat.not_participant'));
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function findExistingDraftConversation(
        User $creator,
        ConversationType $type,
        array $attributes,
    ): ?Conversation {
        $query = Conversation::query()
            ->where('type', $type)
            ->whereNull('last_message_at')
            ->where('created_by', $creator->id);

        $contextType = $attributes['context_type'] ?? null;
        $contextId = $attributes['context_id'] ?? null;

        if ($contextType === null && $contextId === null) {
            $query->whereNull('context_type')->whereNull('context_id');
        } else {
            $query->where('context_type', $contextType)
                ->where('context_id', $contextId);
        }

        if ($type === ConversationType::CustomerVendor) {
            $vendorAccountId = (string) ($attributes['vendor_account_id'] ?? '');
            if ($vendorAccountId === '') {
                return null;
            }

            $query->where('vendor_account_id', $vendorAccountId);
        } elseif ($type === ConversationType::CustomerProvider) {
            $providerAccountId = (string) ($attributes['provider_account_id'] ?? '');
            if ($providerAccountId === '') {
                return null;
            }

            $query->where('provider_account_id', $providerAccountId);
        } else {
            return null;
        }

        return $query->first();
    }

    /**
     * @param  list<array{user_id: string, role: ConversationParticipantRole}>  $participants
     */
    private function assertDistinctParticipants(array $participants): void
    {
        $userIds = array_column($participants, 'user_id');

        if (count($userIds) !== count(array_unique($userIds))) {
            throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
        }
    }
}
