import { ChatAvatar } from './ChatAvatar.tsx';
import {
  conversationContextLabel,
  conversationParticipantRoleLabel,
  conversationParty,
  formatConversationPreviewTime,
  getConversationListPreview,
  groupedConversationUnreadCount,
  type MessagePreviewLabels,
} from '../../lib/chat/conversationHelpers.ts';
import type { Conversation } from '../../types/chat.ts';

type ChatConversationListItemProps = {
  conversation: Conversation;
  relatedConversations?: Conversation[];
  currentUserId?: string;
  isActive: boolean;
  locale: string;
  noMessagesLabel: string;
  previewLabels: MessagePreviewLabels;
  fallbackTitle: string;
  t: (key: string) => string;
  onSelect: () => void;
};

export function ChatConversationListItem({
  conversation,
  relatedConversations = [],
  currentUserId,
  isActive,
  locale,
  noMessagesLabel,
  previewLabels,
  fallbackTitle,
  t,
  onSelect,
}: ChatConversationListItemProps) {
  const party = conversationParty(conversation, currentUserId, fallbackTitle);
  const roleLabel = conversationParticipantRoleLabel(party.role, t);
  const preview = getConversationListPreview(conversation.last_message, previewLabels, noMessagesLabel);
  const timeLabel = formatConversationPreviewTime(
    conversation.last_message_at ?? conversation.created_at,
    locale,
  );
  const grouped = relatedConversations.length > 0 ? relatedConversations : [conversation];
  const unreadCount = groupedConversationUnreadCount(grouped);
  const contextBadges = grouped
    .map((item) => conversationContextLabel(item, t))
    .filter((label): label is string => Boolean(label))
    .filter((label, index, labels) => labels.indexOf(label) === index);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-start px-3 py-3 transition cursor-pointer border-b border-gray-100/80 ${
        isActive ? 'bg-white shadow-[inset_3px_0_0_0_var(--color-diyar-brown)]' : 'hover:bg-white/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <ChatAvatar
          name={party.name}
          avatarUrl={party.avatarUrl}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-sm text-diyar-dark truncate">{party.name}</p>
              {roleLabel ? (
                <p className="text-[11px] text-gray-500 truncate">{roleLabel}</p>
              ) : null}
              {contextBadges.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {contextBadges.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {timeLabel ? <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">{timeLabel}</span> : null}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-xs text-gray-500 truncate">{preview}</p>
            {unreadCount > 0 ? (
              <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-diyar-brown text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
