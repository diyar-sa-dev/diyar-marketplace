import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { ChatProvider } from '../../context/ChatProvider.tsx';
import { NotificationProvider } from '../../context/NotificationProvider.tsx';

function needsChatRealtime(pathname: string): boolean {
  return (
    pathname.startsWith('/chat')
    || pathname.includes('/messages')
    || pathname.startsWith('/dashboard')
  );
}

/** Chat + notification realtime — scoped to reduce initial module load on browse-only pages. */
export function MarketplaceMessagingProviders({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  if (pathname.startsWith('/admin')) {
    return children;
  }

  const withNotifications = isAuthenticated && !pathname.startsWith('/auth');
  const withChat = needsChatRealtime(pathname);

  if (!withNotifications && !withChat) {
    return children;
  }

  let tree = children;

  if (withChat) {
    tree = <ChatProvider>{tree}</ChatProvider>;
  }

  if (withNotifications) {
    tree = <NotificationProvider>{tree}</NotificationProvider>;
  }

  return tree;
}
