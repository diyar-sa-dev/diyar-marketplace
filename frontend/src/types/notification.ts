export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  priority: string;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type NotificationListResponse = {
  notifications: Notification[];
  pagination: NotificationPagination;
};

export type NotificationStatusFilter = 'all' | 'unread' | 'read';

export type NotificationFilter = {
  page: number;
  perPage: number;
  status: NotificationStatusFilter;
  category: string | null;
};

export type NotificationCategoryDefinition = {
  key: string;
  label: string;
  policy: string;
  channels: string[];
  channel_policies: Record<string, boolean>;
  filterable?: boolean;
};

export type NotificationPreferenceMatrix = Record<string, Record<string, boolean>>;

export type NotificationGlobalChannels = {
  email: boolean;
  push: boolean;
  sms: {
    available: boolean;
    enabled: boolean;
  };
};

export type NotificationPreferenceSettings = {
  channels: NotificationGlobalChannels;
  categories: NotificationCategoryDefinition[];
  preferences: NotificationPreferenceMatrix;
  category_enabled: Record<string, boolean>;
};

export type NotificationPreferenceUpdate = {
  preferences?: NotificationPreferenceMatrix;
  category_enabled?: Record<string, boolean>;
  channels?: {
    email?: boolean;
    push?: boolean;
  };
};
