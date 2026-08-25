import { useLocale } from '../../hooks/useLocale.ts';
import {
  connectionStatusStyles,
  type ChatConnectionState,
} from '../../lib/chat/conversationHelpers.ts';
import type { RealtimeConnectionState } from '../../lib/realtime/echo.ts';

type ChatConnectionStatusProps = {
  state: RealtimeConnectionState | ChatConnectionState;
  compact?: boolean;
};

export function ChatConnectionStatus({ state, compact = false }: ChatConnectionStatusProps) {
  const { t } = useLocale();
  const styles = connectionStatusStyles(state as ChatConnectionState);
  const browserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

  const label = (() => {
    if (browserOffline) {
      return t('chat.offline');
    }

    switch (state) {
      case 'connected':
        return t('chat.connected');
      case 'connecting':
        return t('chat.connecting');
      case 'disconnected':
        return t('chat.disconnected');
      case 'idle':
        return t('chat.connecting');
      case 'failed':
        return t('chat.failed');
      default:
        return t('chat.reconnecting');
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white/80 px-2.5 py-1 ${compact ? 'text-[11px]' : 'text-xs'} ${styles.textClass}`}
    >
      <span className="relative flex h-2 w-2">
        {styles.ping ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${styles.dotClass}`} />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dotClass}`} />
      </span>
      {!compact ? <span className="font-medium">{label}</span> : null}
    </span>
  );
}
