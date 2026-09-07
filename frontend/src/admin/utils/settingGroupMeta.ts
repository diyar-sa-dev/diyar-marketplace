import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  MessageSquare,
  Package,
  Palette,
  Percent,
  Settings2,
  ShoppingBag,
  Sparkles,
  ToggleLeft,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';

export type SettingGroupId =
  | 'platform'
  | 'feature'
  | 'commerce'
  | 'orders'
  | 'shipping'
  | 'payouts'
  | 'affiliate'
  | 'services'
  | 'notifications'
  | 'chat'
  | 'theme';

type SettingGroupMeta = {
  icon: LucideIcon;
  descriptionKey: string;
  accentClass: string;
};

export const SETTING_GROUP_META: Record<SettingGroupId, SettingGroupMeta> = {
  platform: {
    icon: Settings2,
    descriptionKey: 'admin.settings.groupDescriptions.platform',
    accentClass: 'bg-diyar-dark/8 text-diyar-dark',
  },
  feature: {
    icon: ToggleLeft,
    descriptionKey: 'admin.settings.groupDescriptions.feature',
    accentClass: 'bg-violet-100 text-violet-700',
  },
  commerce: {
    icon: ShoppingBag,
    descriptionKey: 'admin.settings.groupDescriptions.commerce',
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  orders: {
    icon: Package,
    descriptionKey: 'admin.settings.groupDescriptions.orders',
    accentClass: 'bg-sky-100 text-sky-700',
  },
  shipping: {
    icon: Truck,
    descriptionKey: 'admin.settings.groupDescriptions.shipping',
    accentClass: 'bg-blue-100 text-blue-700',
  },
  payouts: {
    icon: Wallet,
    descriptionKey: 'admin.settings.groupDescriptions.payouts',
    accentClass: 'bg-amber-100 text-amber-800',
  },
  affiliate: {
    icon: Percent,
    descriptionKey: 'admin.settings.groupDescriptions.affiliate',
    accentClass: 'bg-fuchsia-100 text-fuchsia-700',
  },
  services: {
    icon: Wrench,
    descriptionKey: 'admin.settings.groupDescriptions.services',
    accentClass: 'bg-teal-100 text-teal-700',
  },
  notifications: {
    icon: Bell,
    descriptionKey: 'admin.settings.groupDescriptions.notifications',
    accentClass: 'bg-orange-100 text-orange-700',
  },
  chat: {
    icon: MessageSquare,
    descriptionKey: 'admin.settings.groupDescriptions.chat',
    accentClass: 'bg-indigo-100 text-indigo-700',
  },
  theme: {
    icon: Palette,
    descriptionKey: 'admin.settings.groupDescriptions.theme',
    accentClass: 'bg-diyar-brown/15 text-diyar-brown',
  },
};

export function settingGroupMeta(group: string): SettingGroupMeta {
  return (
    SETTING_GROUP_META[group as SettingGroupId] ?? {
      icon: Sparkles,
      descriptionKey: 'admin.settings.groupDescriptions.default',
      accentClass: 'bg-gray-100 text-gray-600',
    }
  );
}
