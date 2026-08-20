import { ChatAvatar } from './ChatAvatar.tsx';
import { getMessageBubbleLayout } from '../../lib/chat/conversationHelpers.ts';

type ChatTypingIndicatorProps = {
  dir: 'rtl' | 'ltr';
  name?: string | null;
  avatarUrl?: string | null;
};

function TypingDotsBubble() {
  return (
    <div
      className="rounded-2xl rounded-bs-sm bg-white border border-gray-100 px-4 py-3 shadow-sm"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 h-4">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot chat-typing-dot-delay-1" />
        <span className="chat-typing-dot chat-typing-dot-delay-2" />
      </div>
    </div>
  );
}

export function ChatTypingIndicator({ dir, name, avatarUrl }: ChatTypingIndicatorProps) {
  const layout = getMessageBubbleLayout(dir, false);

  return (
    <div className="w-full flex" dir="ltr" aria-live="polite">
      <div className={`flex items-end gap-1.5 max-w-[min(92%,36rem)] ${layout.rowClass}`}>
        {layout.avatarFirst ? (
          <>
            <ChatAvatar name={name} avatarUrl={avatarUrl} size="sm" />
            <TypingDotsBubble />
          </>
        ) : (
          <>
            <TypingDotsBubble />
            <ChatAvatar name={name} avatarUrl={avatarUrl} size="sm" />
          </>
        )}
      </div>
    </div>
  );
}
