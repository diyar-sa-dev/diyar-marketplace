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

  const participant = conversation?.participants?.find(
    (item) => item.user_id === message.sender_id,
  );

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
  currentUserId?: string,
): string | null {
  if (!conversation) {
    return null;
  }

  const other = getOtherParticipant(conversation, currentUserId);
  if (other?.participant_role === 'vendor' && conversation.vendor_slug) {
    return `/store/${conversation.vendor_slug}`;
  }

  if (other?.participant_role === 'provider' && conversation.provider_slug) {
    return `/provider/${conversation.provider_slug}`;
  }

  if (other?.participant_role === 'customer') {
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

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

export function getOtherParticipant(
  conversation: Conversation | null | undefined,
  currentUserId: string | undefined,
): ChatParticipant | null {
  const participants = getConversationParticipants(conversation);
  if (participants.length === 0) {
    return null;
  }

  const viewerId = currentUserId?.trim();
  const others = viewerId
    ? participants.filter((participant) => participant.user_id !== viewerId)
    : [];

  if (!viewerId || others.length === 0) {
    return null;
  }

  const viewer = participants.find((participant) => participant.user_id === viewerId);
  const viewerRole = viewer?.participant_role;

  if (viewerRole === 'vendor' || viewerRole === 'provider' || viewerRole === 'admin') {
    return others.find((participant) => participant.participant_role === 'customer') ?? others[0];
  }

  if (viewerRole === 'customer') {
    return others.find((participant) => participant.participant_role !== 'customer') ?? others[0];
  }

  return others[0];
}

export function mergeConversationRecords(
  fromList: Conversation | null,
  fromDetail: Conversation | null,
): Conversation | null {
  if (!fromList) {
    return fromDetail;
  }

  if (!fromDetail || fromDetail.id !== fromList.id) {
    return fromList;
  }

  const participants =
    (fromDetail.participants?.length ?? 0) > 0
      ? fromDetail.participants
      : (fromList.participants ?? []);

  return {
    ...fromList,
    ...fromDetail,
    participants,
    display_name: firstNonEmpty(fromDetail.display_name, fromList.display_name),
    display_avatar_url: fromDetail.display_avatar_url ?? fromList.display_avatar_url ?? null,
    last_message: fromList.last_message ?? fromDetail.last_message,
    last_message_at: fromList.last_message_at ?? fromDetail.last_message_at,
    unread_count: fromList.unread_count ?? fromDetail.unread_count,
  };
}

export function conversationParty(
  conversation: Conversation | null | undefined,
  currentUserId: string | undefined,
  fallbackName: string,
): { name: string; avatarUrl: string | null; role: string | null } {
  const other = getOtherParticipant(conversation, currentUserId);

  return {
    name:
      firstNonEmpty(other?.name, conversation?.display_name, conversation?.subject, fallbackName) ??
      fallbackName,
    avatarUrl: other?.avatar_url ?? conversation?.display_avatar_url ?? null,
    role: other?.participant_role ?? null,
  };
}

export function conversationParticipantRoleLabel(
  role: string | null | undefined,
  t: (key: string) => string,
): string | null {
  switch (role) {
    case 'customer':
      return t('chat.roleCustomer');
    case 'vendor':
      return t('chat.contextVendor');
    case 'provider':
      return t('chat.contextProvider');
    case 'admin':
      return t('chat.contextSupport');
    default:
      return null;
  }
}

export type GroupedConversation = {
  groupKey: string;
  conversations: Conversation[];
  primary: Conversation;
};

export function groupConversationsByCounterparty(
  conversations: Conversation[],
  currentUserId: string | undefined,
): GroupedConversation[] {
  const groups = new Map<string, Conversation[]>();

  for (const conversation of conversations) {
    const other = getOtherParticipant(conversation, currentUserId);
    const groupKey = other?.user_id ?? conversation.id;
    const bucket = groups.get(groupKey) ?? [];
    bucket.push(conversation);
    groups.set(groupKey, bucket);
  }

  const sortByRecent = (items: Conversation[]) =>
    [...items].sort((a, b) => {
      const aTime = new Date(a.last_message_at ?? a.created_at ?? 0).getTime();
      const bTime = new Date(b.last_message_at ?? b.created_at ?? 0).getTime();
      return bTime - aTime;
    });

  return Array.from(groups.entries())
    .map(([groupKey, items]) => {
      const sorted = sortByRecent(items);

      return {
        groupKey,
        conversations: sorted,
        primary: sorted[0],
      };
    })
    .sort((a, b) => {
      const aTime = new Date(a.primary.last_message_at ?? a.primary.created_at ?? 0).getTime();
      const bTime = new Date(b.primary.last_message_at ?? b.primary.created_at ?? 0).getTime();
      return bTime - aTime;
    });
}

export function conversationContextLabel(
  conversation: Conversation,
  t: (key: string) => string,
): string | null {
  if (conversation.type === 'customer_vendor') {
    return t('chat.contextVendor');
  }

  if (conversation.type === 'customer_provider') {
    return t('chat.contextProvider');
  }

  if (conversation.type === 'customer_admin') {
    return t('chat.contextSupport');
  }

  return null;
}

export function groupedConversationUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce((total, conversation) => total + (conversation.unread_count ?? 0), 0);
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
