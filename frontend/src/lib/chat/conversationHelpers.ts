import type { ChatMessage, ChatParticipant, Conversation } from '../../types/chat.ts';
import { intlLocaleTag } from '../intlLocale.ts';

export type ChatConnectionState =
  'connected' | 'connecting' | 'disconnected' | 'failed' | 'reconnecting' | 'idle';

export type MessagePreviewLabels = {
  deleted: string;
  photo: string;
  attachment: string;
  empty: string;
};

export function getMessagePreviewContent(
  message: ChatMessage,
  labels: MessagePreviewLabels,
): string {
  if (message.is_deleted || message.deleted_at) {
    return labels.deleted;
  }

  if (message.body?.trim()) {
    return message.body.trim();
  }

  if (message.attachments?.length) {
    const attachment = message.attachments[0];
    if (attachment.mime_type.startsWith('image/')) {
      return attachment.original_name || labels.photo;
    }

    return attachment.original_name || labels.attachment;
  }

  return labels.empty;
}

export function getConversationListPreview(
  lastMessage: Conversation['last_message'],
  labels: MessagePreviewLabels,
  noMessagesLabel: string,
): string {
  if (!lastMessage) {
    return noMessagesLabel;
  }

  if (lastMessage.is_deleted || lastMessage.deleted_at) {
    return labels.deleted;
  }

  if (lastMessage.body?.trim()) {
    return lastMessage.body.trim();
  }

  return labels.empty;
}

export function resolveMessageSenderName(
  message: ChatMessage,
  conversation: Conversation | null | undefined,
  currentUserId: string | undefined,
  youLabel: string,
  fallbackLabel: string,
): string {
  if (currentUserId && message.sender_id === currentUserId) {
    return youLabel;
  }

  if (message.sender_name?.trim()) {
    return message.sender_name.trim();
  }

  const participant = conversation?.participants?.find((item) => item.user_id === message.sender_id);

  return participant?.name?.trim() || fallbackLabel;
}

export function getMessageBubbleLayout(
  dir: 'rtl' | 'ltr',
  isMine: boolean,
): {
  rowClass: string;
  avatarFirst: boolean;
  actionsFirst: boolean;
} {
  const onRight = dir === 'rtl' ? isMine : !isMine;

  return {
    rowClass: onRight ? 'ms-auto flex-row' : 'me-auto flex-row',
    avatarFirst: !onRight,
    actionsFirst: dir === 'rtl' ? isMine : !isMine,
  };
}

export function isConversationInInbox(
  conversation: Conversation,
  currentUserId: string | undefined,
): boolean {
  if (!currentUserId) {
    return false;
  }

  return (
    Boolean(conversation.last_message_at || conversation.last_message) ||
    conversation.created_by === currentUserId
  );
}

export function resolveConversationProfilePath(
  conversation: Conversation | null | undefined,
): string | null {
  if (!conversation) {
    return null;
  }

  if (conversation.type === 'customer_vendor' && conversation.vendor_slug) {
    return `/store/${conversation.vendor_slug}`;
  }

  if (conversation.type === 'customer_provider' && conversation.provider_slug) {
    return `/provider/${conversation.provider_slug}`;
  }

  if (conversation.context_type === 'service' && conversation.context_id) {
    return `/service/${conversation.context_id}`;
  }

  return null;
}

export function getConversationParticipants(
  conversation: Conversation | null | undefined,
): ChatParticipant[] {
  return conversation?.participants ?? [];
}

export function getOtherParticipant(
  conversation: Conversation | null | undefined,
  currentUserId: string | undefined,
): ChatParticipant | null {
  if (!conversation || !currentUserId) {
    return null;
  }

  return (
    getConversationParticipants(conversation).find(
      (participant) => participant.user_id !== currentUserId,
    ) ?? null
  );
}

export function formatConversationPreviewTime(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const tag = intlLocaleTag(locale);

  if (sameDay) {
    return date.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString(tag, { month: 'short', day: 'numeric' });
}

export function connectionStatusStyles(state: ChatConnectionState): {
  dotClass: string;
  textClass: string;
  ping?: boolean;
} {
  switch (state) {
    case 'connected':
      return {
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-700',
      };
    case 'connecting':
    case 'reconnecting':
      return {
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-700',
        ping: true,
      };
    case 'failed':
      return {
        dotClass: 'bg-red-500',
        textClass: 'text-red-600',
      };
    case 'disconnected':
    case 'idle':
    default:
      return {
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-500',
      };
  }
}
