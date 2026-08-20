<?php

namespace App\Services\Chat;

use App\Enums\ConversationParticipantRole;
use App\Enums\ConversationType;
use App\Enums\RoleName;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\ProviderAccount;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Auth\Access\AuthorizationException;

final class ChatAuthorizationService
{
    public function participant(User $user, Conversation $conversation): ?ConversationParticipant
    {
        return ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();
    }

    public function ensureParticipant(User $user, Conversation $conversation): ConversationParticipant
    {
        $participant = $this->participant($user, $conversation);

        if ($participant === null) {
            throw new AuthorizationException(__('diyar.chat.not_participant'));
        }

        return $participant;
    }

    public function canSubscribe(User $user, string $conversationId): bool
    {
        return ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();
    }

    public function resolveParticipantRole(User $user): ?ConversationParticipantRole
    {
        if ($user->hasRole(RoleName::Admin)) {
            return ConversationParticipantRole::Admin;
        }

        if ($user->hasRole(RoleName::Vendor)) {
            return ConversationParticipantRole::Vendor;
        }

        if ($user->hasRole(RoleName::Provider)) {
            return ConversationParticipantRole::Provider;
        }

        if ($user->hasRole(RoleName::Customer)) {
            return ConversationParticipantRole::Customer;
        }

        return null;
    }

    /**
     * Infer which side of the conversation the creator is acting as (context-aware for multi-role users).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function resolveCreatorRoleForConversation(
        User $user,
        ConversationType $type,
        array $attributes,
    ): ConversationParticipantRole {
        return match ($type) {
            ConversationType::CustomerVendor => $this->resolveCreatorRoleForVendorConversation($user, $attributes),
            ConversationType::CustomerProvider => $this->resolveCreatorRoleForProviderConversation($user, $attributes),
            ConversationType::CustomerAdmin => $this->resolveCreatorRoleForAdminConversation($user, $attributes),
        };
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolveCreatorRoleForVendorConversation(User $user, array $attributes): ConversationParticipantRole
    {
        $vendorAccountId = (string) ($attributes['vendor_account_id'] ?? '');
        $vendor = VendorAccount::query()->findOrFail($vendorAccountId);
        $customerId = (string) ($attributes['customer_user_id'] ?? '');

        if ($customerId !== '') {
            if ($customerId === $user->id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            if ($user->vendorAccount?->id === $vendor->id && $user->hasRole(RoleName::Vendor)) {
                return ConversationParticipantRole::Vendor;
            }

            throw new AuthorizationException(__('diyar.chat.cannot_create'));
        }

        if ($user->id === $vendor->user_id) {
            throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
        }

        return ConversationParticipantRole::Customer;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolveCreatorRoleForProviderConversation(User $user, array $attributes): ConversationParticipantRole
    {
        $providerAccountId = (string) ($attributes['provider_account_id'] ?? '');
        $provider = ProviderAccount::query()->findOrFail($providerAccountId);
        $customerId = (string) ($attributes['customer_user_id'] ?? '');

        if ($customerId !== '') {
            if ($customerId === $user->id) {
                throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
            }

            if ($user->providerAccount?->id === $provider->id && $user->hasRole(RoleName::Provider)) {
                return ConversationParticipantRole::Provider;
            }

            throw new AuthorizationException(__('diyar.chat.cannot_create'));
        }

        if ($user->id === $provider->user_id) {
            throw new AuthorizationException(__('diyar.chat.self_chat_not_allowed'));
        }

        return ConversationParticipantRole::Customer;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolveCreatorRoleForAdminConversation(User $user, array $attributes): ConversationParticipantRole
    {
        if ($user->hasRole(RoleName::Admin) && ($attributes['customer_user_id'] ?? '') !== '') {
            return ConversationParticipantRole::Admin;
        }

        if ($user->hasRole(RoleName::Customer)) {
            return ConversationParticipantRole::Customer;
        }

        throw new AuthorizationException(__('diyar.chat.cannot_create'));
    }
}
