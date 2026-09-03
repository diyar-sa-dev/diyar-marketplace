<?php

namespace App\Http\Resources;

use App\Enums\ConversationParticipantRole;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Conversation */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $viewerId = (string) ($user?->id ?? '');
        /** @var MediaUploadService $media */
        $media = app(MediaUploadService::class);

        $viewerParticipant = $this->participants->first(
            fn (ConversationParticipant $participant): bool => (string) $participant->user_id === $viewerId,
        );

        $counterparty = $this->resolveCounterparty($viewerId, $viewerParticipant?->participant_role);
        $counterpartyPayload = $counterparty !== null
            ? $this->participantPayload($counterparty, $media)
            : null;

        return [
            'id' => $this->id,
            'created_by' => $this->created_by,
            'type' => $this->type->value,
            'subject' => $this->subject,
            'context_type' => $this->context_type,
            'context_id' => $this->context_id,
            'vendor_account_id' => $this->vendor_account_id,
            'provider_account_id' => $this->provider_account_id,
            'unread_count' => $viewerParticipant?->unread_count ?? 0,
            'last_read_at' => $viewerParticipant?->last_read_at?->toIso8601String(),
            'participants' => $this->participants
                ->map(fn (ConversationParticipant $participant) => $this->participantPayload($participant, $media))
                ->values(),
            'display_name' => $this->nonEmptyString($counterpartyPayload['name'] ?? null) ?? $this->subject,
            'display_avatar_url' => $counterpartyPayload['avatar_url'] ?? null,
            'vendor_slug' => $this->vendorAccount?->slug,
            'provider_slug' => $this->providerAccount?->slug,
            'last_message' => $this->lastMessage ? [
                'id' => $this->lastMessage->id,
                'body' => $this->lastMessage->deleted_at !== null ? null : $this->lastMessage->body,
                'sender_id' => $this->lastMessage->sender_id,
                'message_type' => $this->lastMessage->message_type->value,
                'is_deleted' => $this->lastMessage->deleted_at !== null,
                'deleted_at' => $this->lastMessage->deleted_at?->toIso8601String(),
                'created_at' => $this->lastMessage->created_at?->toIso8601String(),
            ] : null,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function resolveCounterparty(
        string $viewerId,
        ?ConversationParticipantRole $viewerRole,
    ): ?ConversationParticipant {
        $others = $this->participants
            ->filter(fn (ConversationParticipant $participant): bool => (string) $participant->user_id !== $viewerId)
            ->values();

        if ($others->isEmpty()) {
            return null;
        }

        if (in_array($viewerRole, [
            ConversationParticipantRole::Vendor,
            ConversationParticipantRole::Provider,
            ConversationParticipantRole::Admin,
        ], true)) {
            return $others->first(
                fn (ConversationParticipant $participant): bool => $participant->participant_role === ConversationParticipantRole::Customer,
            ) ?? $others->first();
        }

        return $others->first(
            fn (ConversationParticipant $participant): bool => in_array($participant->participant_role, [
                ConversationParticipantRole::Vendor,
                ConversationParticipantRole::Provider,
                ConversationParticipantRole::Admin,
            ], true),
        ) ?? $others->first();
    }

    /**
     * @return array{id: mixed, user_id: string, name: string|null, avatar_url: string|null, participant_role: string}
     */
    private function participantPayload(ConversationParticipant $participant, MediaUploadService $media): array
    {
        $name = $this->nonEmptyString($participant->user?->name);
        $avatarUrl = $media->url($participant->user?->avatar_path);

        if ($participant->participant_role === ConversationParticipantRole::Vendor && $this->vendorAccount) {
            $name = $this->nonEmptyString($this->vendorAccount->business_name) ?? $name;
            $avatarUrl = $media->url($this->vendorAccount->logo_path) ?? $avatarUrl;
        }

        if ($participant->participant_role === ConversationParticipantRole::Provider && $this->providerAccount) {
            $name = $this->nonEmptyString($this->providerAccount->business_name) ?? $name;
            $avatarUrl = $media->url($this->providerAccount->avatar_path) ?? $avatarUrl;
        }

        return [
            'id' => $participant->id,
            'user_id' => (string) $participant->user_id,
            'name' => $name,
            'avatar_url' => $avatarUrl,
            'participant_role' => $participant->participant_role->value,
        ];
    }

    private function nonEmptyString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
