import {
  LayoutDashboard,
  MessageSquare,
  Palette,
  PenTool,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  wrench: Wrench,
  'pen-tool': PenTool,
  'layout-dashboard': LayoutDashboard,
  truck: Truck,
  'message-square': MessageSquare,
};

export function serviceCategoryIcon(iconKey?: string | null): LucideIcon {
  if (iconKey && CATEGORY_ICONS[iconKey]) {
    return CATEGORY_ICONS[iconKey];
  }

  return LayoutDashboard;
}

export const SERVICE_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';
