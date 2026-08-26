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
import { resolveChatConversationPath, getPortalFromPath } from './auth/roles.ts';

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

function normalizeNotificationPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  const orderDetailMatch = trimmed.match(/^\/orders\/([0-9a-f-]{36})$/i);
  if (orderDetailMatch) {
    return `/orders?highlight=${orderDetailMatch[1]}`;
  }

  if (/^\/service-bookings\//i.test(trimmed)) {
    return '/profile/service-bookings';
  }

  if (/^\/returns\//i.test(trimmed)) {
    return '/orders?tab=returns';
  }

  return trimmed;
}

export function resolveNotificationLink(
  notification: Notification,
  roles?: UserRoleLike[],
  pathname?: string,
): string | null {
  const actionUrl = notification.data.action_url;
  if (typeof actionUrl === 'string' && actionUrl.startsWith('http')) {
    try {
      const url = new URL(actionUrl);
      return normalizeNotificationPath(`${url.pathname}${url.search}`);
    } catch {
      return null;
    }
  }

  if (typeof actionUrl === 'string' && actionUrl.startsWith('/')) {
    return normalizeNotificationPath(actionUrl);
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

  if (notification.entity_type === 'service_booking' && notification.entity_id) {
    return '/profile/service-bookings';
  }

  return null;
}
