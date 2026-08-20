export type ConversationType = 'customer_vendor' | 'customer_provider' | 'customer_admin';

export type MessageSendStatus = 'pending' | 'sent' | 'failed';

export type ChatParticipant = {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  participant_role: string;
};

export type ChatMessageAttachment = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  preview_url?: string;
};

export type ChatMessage = {
  id: string;
  client_message_id?: string;
  idempotency_key?: string | null;
  send_status?: MessageSendStatus;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string | null;
  message_type: 'text' | 'system' | 'attachment';
  reply_to_message_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  is_deleted?: boolean;
  attachments: ChatMessageAttachment[];
  created_at: string;
};

export type Conversation = {
  id: string;
  created_by: string | null;
  type: ConversationType;
  subject: string | null;
  context_type: string | null;
  context_id: string | null;
  vendor_account_id: string | null;
  provider_account_id: string | null;
  unread_count: number;
  last_read_at: string | null;
  participants: ChatParticipant[];
  display_name: string | null;
  vendor_slug: string | null;
  provider_slug: string | null;
  last_message: {
    id: string;
    body: string | null;
    sender_id: string;
    message_type: string;
    created_at: string;
  } | null;
  last_message_at: string | null;
  created_at: string;
};

export type MessageCreatedPayload = {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string | null;
  message_type: string;
  reply_to_message_id?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  is_deleted?: boolean;
  created_at: string;
  attachments: ChatMessage['attachments'];
};

export type MessageUpdatedPayload = MessageCreatedPayload;

export type TypingUpdatedPayload = {
  conversation_id: string;
  user_id: string;
  name: string | null;
  typing: boolean;
};

export type ChatCrossTabPayload = {
  type: 'message' | 'message_updated' | 'read';
  conversation_id: string;
  message?: ChatMessage;
  unread_count?: number;
};
