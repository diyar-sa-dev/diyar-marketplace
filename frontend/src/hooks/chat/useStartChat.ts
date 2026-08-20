import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createConversation, fetchConversations } from '../../api/chat.ts';
import type { Conversation, ConversationType } from '../../types/chat.ts';
import { useAuth } from '../auth/useAuth.ts';
import { useLocale } from '../useLocale.ts';
import { useToast } from '../useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import { chatKeys } from './useChat.ts';

type StartChatOptions = {
  subject?: string;
  context_type?: string;
  context_id?: string;
  returnPath?: string;
};

async function findExistingConversation(
  type: ConversationType,
  accountId: string,
  accountField: 'vendor_account_id' | 'provider_account_id',
): Promise<Conversation | null> {
  const { conversations } = await fetchConversations(1, 50);
  return (
    conversations.find(
      (conversation) => conversation.type === type && conversation[accountField] === accountId,
    ) ?? null
  );
}

export function useStartChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLocale();

  const mutation = useMutation({
    mutationFn: createConversation,
  });

  const seedConversationInCache = (conversation: Conversation) => {
    queryClient.setQueriesData<{
      conversations: Conversation[];
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>({ queryKey: chatKeys.conversations() }, (current) => {
      if (!current?.conversations) {
        return current;
      }

      if (current.conversations.some((item) => item.id === conversation.id)) {
        return current;
      }

      return {
        ...current,
        conversations: [conversation, ...current.conversations],
      };
    });
  };

  const openConversation = (conversation: Conversation) => {
    seedConversationInCache(conversation);
    navigate(`/chat?conversation=${conversation.id}`);
  };

  const requireAuth = (returnPath?: string) => {
    if (isAuthenticated) {
      return true;
    }

    navigate('/auth', { state: { from: returnPath ?? window.location.pathname } });
    return false;
  };

  const handleChatError = (error: unknown) => {
    const parsed = parseApiError(error, locale);
    toast.error(parsed.message || t('chat.startError'));
  };

  const startVendorChat = async (vendorAccountId: string, options: StartChatOptions = {}) => {
    if (!requireAuth(options.returnPath)) {
      return;
    }

    try {
      const existing = await findExistingConversation(
        'customer_vendor',
        vendorAccountId,
        'vendor_account_id',
      );
      if (existing) {
        openConversation(existing);
        return;
      }

      const conversation = await mutation.mutateAsync({
        type: 'customer_vendor',
        vendor_account_id: vendorAccountId,
        subject: options.subject,
        context_type: options.context_type,
        context_id: options.context_id,
      });
      seedConversationInCache(conversation);
      openConversation(conversation);
    } catch (error) {
      handleChatError(error);
    }
  };

  const startProviderChat = async (providerAccountId: string, options: StartChatOptions = {}) => {
    if (!requireAuth(options.returnPath)) {
      return;
    }

    try {
      const existing = await findExistingConversation(
        'customer_provider',
        providerAccountId,
        'provider_account_id',
      );
      if (existing) {
        openConversation(existing);
        return;
      }

      const conversation = await mutation.mutateAsync({
        type: 'customer_provider',
        provider_account_id: providerAccountId,
        subject: options.subject,
        context_type: options.context_type,
        context_id: options.context_id,
      });
      seedConversationInCache(conversation);
      openConversation(conversation);
    } catch (error) {
      handleChatError(error);
    }
  };

  return {
    startVendorChat,
    startProviderChat,
    isStarting: mutation.isPending,
  };
}
