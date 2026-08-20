import { ChatAvatar } from './ChatAvatar.tsx';
import { formatConversationPreviewTime } from '../../lib/chat/conversationHelpers.ts';
import type { ChatParticipant, Conversation } from '../../types/chat.ts';

type ChatConversationListItemProps = {
  conversation: Conversation;
  otherParticipant: ChatParticipant | null;
  isActive: boolean;
  locale: string;
  noMessagesLabel: string;
  fallbackTitle: string;
  onSelect: () => void;
};

export function ChatConversationListItem({
  conversation,
  otherParticipant,
  isActive,
  locale,
  noMessagesLabel,
  fallbackTitle,
  onSelect,
}: ChatConversationListItemProps) {
  const title = conversation.display_name ?? conversation.subject ?? fallbackTitle;
  const preview = conversation.last_message?.body?.trim() || noMessagesLabel;
  const timeLabel = formatConversationPreviewTime(
    conversation.last_message_at ?? conversation.created_at,
    locale,
  );

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
          name={otherParticipant?.name ?? title}
          avatarUrl={otherParticipant?.avatar_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-diyar-dark truncate">{title}</p>
            {timeLabel ? <span className="shrink-0 text-[10px] text-gray-400 tabular-nums">{timeLabel}</span> : null}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-xs text-gray-500 truncate">{preview}</p>
            {conversation.unread_count > 0 ? (
              <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-diyar-brown text-white text-[10px] font-bold flex items-center justify-center">
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
