import { Link } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useChatUnreadCount } from '../../hooks/chat/useChat.ts';

type ChatMessagesLinkProps = {
  to: string;
  variant?: 'header' | 'default';
};

export function ChatMessagesLink({ to, variant = 'default' }: ChatMessagesLinkProps) {
  const { t } = useLocale();
  const { data: unreadCount = 0 } = useChatUnreadCount();

  const className =
    variant === 'header'
      ? 'w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center relative cursor-pointer text-gray-600 hover:bg-diyar-dark hover:text-diyar-cream hover:border-diyar-dark transition-colors'
      : 'relative p-2 text-gray-500 hover:text-diyar-dark transition-colors cursor-pointer rounded-xl hover:bg-gray-100';

  return (
    <Link
      to={to}
      className={className}
      title={t('layout.nav.messages')}
      aria-label={t('layout.nav.messages')}
    >
      <MessagesSquare className="w-5 h-5" />
      {unreadCount > 0 && (
        <span
          className="absolute top-0.5 inset-e-0.5 min-w-4.5 h-4.5 px-1 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center"
          aria-label={t('chat.unreadCountLabel', { count: unreadCount })}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
