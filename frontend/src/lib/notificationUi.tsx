import React from 'react';
import {
  Package,
  Tag,
  Info,
  CreditCard,
  Calendar,
  MessageSquare,
  Star,
  Users,
  Ticket,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import type { Notification } from '../types/notification.ts';
import type { UserRoleLike } from './auth/roles.ts';
import { RoleName, getPortalFromPath, hasActiveRole, resolveChatConversationPath } from './auth/roles.ts';

export function notificationVisual(
  type: string,
  iconSize = 20,
): {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
} {
  if (type.startsWith('order.')) {
    return {
      icon: <Package size={iconSize} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  if (type === 'payment.success') {
    return {
      icon: <CreditCard size={iconSize} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    };
  }

  if (type.startsWith('payment.')) {
    return {
      icon: <CreditCard size={iconSize} />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    };
  }

  if (type.startsWith('booking.')) {
    return {
      icon: <Calendar size={iconSize} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    };
  }

  if (type.startsWith('offer.')) {
    return {
      icon: <Gift size={iconSize} />,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-50',
    };
  }

  if (type.startsWith('review.')) {
    return {
      icon: <Star size={iconSize} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    };
  }

  if (type.startsWith('return.')) {
    return {
      icon: <Tag size={iconSize} />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    };
  }

  if (type.startsWith('product.')) {
    return {
      icon: <AlertTriangle size={iconSize} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    };
  }

  if (type.startsWith('team.')) {
    return {
      icon: <Users size={iconSize} />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    };
  }

  if (type.startsWith('coupon.')) {
    return {
      icon: <Ticket size={iconSize} />,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    };
  }

  if (type.startsWith('system.')) {
    return {
      icon: <Info size={iconSize} />,
      color: 'text-diyar-brown',
      bgColor: 'bg-diyar-brown/10',
    };
  }

  return {
    icon: <MessageSquare size={iconSize} />,
    color: 'text-diyar-brown',
    bgColor: 'bg-diyar-brown/10',
  };
}

function isProviderServiceNotificationContext(
  roles?: UserRoleLike[],
  pathname?: string,
  type?: string,
): boolean {
  if (type === 'offer.accepted') {
    return true;
  }

  const portal = pathname ? getPortalFromPath(pathname) : null;
  if (portal === 'service' || pathname?.includes('/dashboard/service')) {
    return true;
  }

  return hasActiveRole(roles, RoleName.Provider) && Boolean(pathname?.startsWith('/dashboard'));
}

function serviceBookingAppPath(
  bookingId: string | null,
  roles?: UserRoleLike[],
  pathname?: string,
  type?: string,
): string {
  const query = bookingId ? `?highlight=${encodeURIComponent(bookingId)}` : '';
  if (isProviderServiceNotificationContext(roles, pathname, type)) {
    return `/dashboard/service/bookings${query}`;
  }

  return `/profile/service-bookings${query}`;
}

function extractUuid(path: string, pattern: RegExp): string | null {
  const match = path.match(pattern);
  return match?.[1] ?? null;
}

function normalizeNotificationPath(
  path: string,
  roles?: UserRoleLike[],
  pathname?: string,
  type?: string,
): string | null {
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  const [pathnameOnly, search = ''] = trimmed.split('?');
  const query = search ? `?${search}` : '';

  const orderDetailMatch = pathnameOnly.match(/^\/orders\/([0-9a-f-]{36})$/i);
  if (orderDetailMatch) {
    return `/orders?highlight=${orderDetailMatch[1]}`;
  }

  const legacyProviderRequests = pathnameOnly.match(
    /^\/dashboard\/service\/requests(?:\/([0-9a-f-]{36}))?$/i,
  );
  if (legacyProviderRequests) {
    return legacyProviderRequests[1]
      ? `/dashboard/service/client-requests/${legacyProviderRequests[1]}`
      : '/dashboard/service/client-requests';
  }

  const bookingId = extractUuid(pathnameOnly, /^\/service-bookings\/([0-9a-f-]{36})(?:\/.*)?$/i);
  if (bookingId) {
    return serviceBookingAppPath(bookingId, roles, pathname, type);
  }

  if (/^\/returns\//i.test(pathnameOnly)) {
    return '/orders?tab=returns';
  }

  return `${pathnameOnly}${query}`;
}

export function resolveNotificationLink(
  notification: Notification,
  roles?: UserRoleLike[],
  pathname?: string,
): string | null {
  const type = notification.type;
  const actionUrl = notification.data.action_url;
  if (typeof actionUrl === 'string' && actionUrl.startsWith('http')) {
    try {
      const url = new URL(actionUrl);
      return normalizeNotificationPath(`${url.pathname}${url.search}`, roles, pathname, type);
    } catch {
      return null;
    }
  }

  if (typeof actionUrl === 'string' && actionUrl.startsWith('/')) {
    return normalizeNotificationPath(actionUrl, roles, pathname, type);
  }

  if (notification.entity_type === 'conversation' && notification.entity_id) {
    const portal = pathname ? getPortalFromPath(pathname) : null;
    return resolveChatConversationPath(roles, notification.entity_id, portal);
  }

  if (notification.entity_type === 'chat_message_report' && notification.data.conversation_id) {
    const conversationId = String(notification.data.conversation_id);
    const portal = pathname ? getPortalFromPath(pathname) : null;
    return resolveChatConversationPath(roles, conversationId, portal);
  }

  if (notification.entity_type === 'order' && notification.entity_id) {
    return `/orders?highlight=${notification.entity_id}`;
  }

  if (notification.entity_type === 'payment' && notification.data.order_id) {
    return `/orders?highlight=${String(notification.data.order_id)}`;
  }

  if (notification.entity_type === 'service_booking') {
    const bookingId =
      notification.entity_id ??
      (typeof notification.data.booking_id === 'string' ? notification.data.booking_id : null);
    return serviceBookingAppPath(bookingId, roles, pathname, type);
  }

  return null;
}
