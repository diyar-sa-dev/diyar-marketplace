import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Paperclip, Search, Send, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useChatRealtime } from '../context/ChatProvider.tsx';
import {
  chatKeys,
  useConversation,
  useConversations,
  useDeleteMessage,
  useHideConversation,
  useMarkConversationRead,
  useMessagesInfinite,
  useReportMessage,
  useSendMessage,
  useSendTyping,
  useUpdateMessage,
} from '../hooks/chat/useChat.ts';
import { flattenMessages } from '../lib/chat/messageCache.ts';
import {
  CHAT_ATTACHMENT_ACCEPT,
  validateChatAttachment,
} from '../lib/chat/attachmentValidation.ts';
import { getConversationParticipants, getOtherParticipant, getMessagePreviewContent, groupConversationsByCounterparty, conversationContextLabel, conversationParticipantRoleLabel, conversationParty, isConversationInInbox, mergeConversationRecords, resolveConversationProfilePath, resolveMessageSenderName } from '../lib/chat/conversationHelpers.ts';
import { confirmRemoveConversation } from '../lib/confirmDialog.ts';
import { isNearContainerBottom, scrollContainerToBottom } from '../lib/chat/scroll.ts';
import type { ChatMessage } from '../types/chat.ts';
import { useToast } from '../hooks/useToast.ts';
import { isForbidden, parseApiError } from '../utils/errors.ts';
import { ChatConnectionStatus } from '../components/chat/ChatConnectionStatus.tsx';
import { ChatAttachmentDraft } from '../components/chat/ChatAttachmentDraft.tsx';
import { ChatAvatar } from '../components/chat/ChatAvatar.tsx';
import { ChatConversationListItem } from '../components/chat/ChatConversationListItem.tsx';
import { ChatComposerBanner } from '../components/chat/ChatComposerBanner.tsx';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble.tsx';
import { ChatReportMessageDialog } from '../components/chat/ChatReportMessageDialog.tsx';
import { ChatTypingIndicator } from '../components/chat/ChatTypingIndicator.tsx';
import {
  ChatSelectConversation,
  ChatSidebarEmpty,
  ChatThreadEmpty,
} from '../components/chat/ChatEmptyStates.tsx';
import { MessagingSectionErrorBoundary } from '../components/common/MessagingSectionErrorBoundary.tsx';

const TYPING_DEBOUNCE_MS = 1500;
const TYPING_STOP_MS = 3000;
const PRESENCE_HEARTBEAT_MS = 45_000;
const RECENT_ACTIVITY_MS = 90_000;

type ChatPageProps = {
  embedded?: boolean;
};

export default function ChatPage({ embedded = false }: ChatPageProps) {
  const { t, dir, locale } = useLocale();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  const [activeId, setActiveId] = useState<string | null>(requestedConversationId);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(Boolean(requestedConversationId));
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const typingStopTimeoutRef = useRef<number | undefined>(undefined);
  const lastTypingSentRef = useRef(0);

  const clearComposerMode = useCallback(() => {
    setReplyToMessage(null);
    setEditingMessage(null);
  }, []);

  const clearAttachmentDraft = useCallback(() => {
    setSelectedFile(null);
    setAttachmentPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setUploadProgress(null);
  }, []);

  const handleAttachmentSelect = useCallback(
    (file: File | null) => {
      if (!file) {
        clearAttachmentDraft();
        return;
      }

      const validation = validateChatAttachment(file);
      if (validation.ok === false) {
        const message =
          validation.error === 'tooLarge' ? t('chat.attachmentTooLarge') : t('chat.attachmentInvalidType');
        toast.error(message);
        return;
      }

      setAttachmentPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return URL.createObjectURL(file);
      });
      setSelectedFile(file);
      setUploadProgress(null);
    },
    [clearAttachmentDraft, t, toast],
  );

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl);
      }
    };
  }, [attachmentPreviewUrl]);

  const clearConversationFromUrl = useCallback(() => {
    navigate({ pathname: window.location.pathname, search: '' }, { replace: true });
  }, [navigate]);

  const dropInaccessibleConversation = useCallback(
    (conversationId: string) => {
      queryClient.setQueriesData<{ conversations: Array<{ id: string }> }>(
        { queryKey: chatKeys.conversations() },
        (current) => {
          if (!current?.conversations) {
            return current;
          }

          return {
            ...current,
            conversations: current.conversations.filter((conversation) => conversation.id !== conversationId),
          };
        },
      );
      queryClient.removeQueries({ queryKey: chatKeys.messages(conversationId) });
      queryClient.removeQueries({ queryKey: chatKeys.conversation(conversationId) });
    },
    [queryClient],
  );

  const dismissInaccessibleConversation = useCallback(
    (conversationId: string) => {
      dropInaccessibleConversation(conversationId);
      setActiveId((current) => (current === conversationId ? null : current));
      setShowThreadOnMobile(false);
      if (requestedConversationId === conversationId) {
        clearConversationFromUrl();
      }
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    [clearConversationFromUrl, dropInaccessibleConversation, queryClient, requestedConversationId],
  );

  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data?.conversations ?? [];
  const inboxConversations = useMemo(
    () => conversations.filter((conversation) => isConversationInInbox(conversation, user?.id)),
    [conversations, user?.id],
  );

  const conversationFromList = useMemo(
    () => inboxConversations.find((conversation) => conversation.id === activeId) ?? null,
    [activeId, inboxConversations],
  );
  const directConversationQuery = useConversation(activeId);

  const activeConversation = useMemo(() => {
    const candidate = mergeConversationRecords(conversationFromList, directConversationQuery.data ?? null);
    if (!candidate || !isConversationInInbox(candidate, user?.id)) {
      return null;
    }

    return candidate;
  }, [conversationFromList, directConversationQuery.data, user?.id]);

  const canAccessThread = Boolean(activeId && activeConversation);

  const messagesQuery = useMessagesInfinite(activeId, { enabled: canAccessThread });
  const sendMessageMutation = useSendMessage(activeId ?? 'none');
  const updateMessageMutation = useUpdateMessage(activeId ?? 'none');
  const deleteMessageMutation = useDeleteMessage(activeId ?? 'none');
  const reportMessageMutation = useReportMessage(activeId ?? 'none');
  const hideConversationMutation = useHideConversation();
  const sendTypingMutation = useSendTyping(activeId ?? 'none');
  const { mutate: markConversationRead } = useMarkConversationRead();
  const { connectionState, subscribeConversation, typingUsers, counterpartyActivityAt } = useChatRealtime();

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return inboxConversations;
    }
    return inboxConversations.filter((conversation) => {
      const haystack = [
        conversation.display_name,
        conversation.subject,
        ...getConversationParticipants(conversation).map((participant) => participant.name),
      ]
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [inboxConversations, query]);

  const groupedConversations = useMemo(
    () => groupConversationsByCounterparty(filteredConversations, user?.id),
    [filteredConversations, user?.id],
  );

  const activeConversationGroup = useMemo(
    () =>
      groupedConversations.find((group) =>
        group.conversations.some((conversation) => conversation.id === activeId),
      ) ?? null,
    [activeId, groupedConversations],
  );
  const activeOtherParticipant = getOtherParticipant(activeConversation, user?.id);
  const activeParty = conversationParty(activeConversation, user?.id, t('chat.conversation'));
  const activePartyRoleLabel = conversationParticipantRoleLabel(activeParty.role, t);
  const counterpartyProfilePath = useMemo(
    () => resolveConversationProfilePath(activeConversation, user?.id),
    [activeConversation, user?.id],
  );
  const messages = useMemo(
    () => flattenMessages(messagesQuery.data),
    [messagesQuery.data],
  );
  const messageById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const previewLabels = useMemo(
    () => ({
      deleted: t('chat.messageDeleted'),
      photo: t('chat.replyPhoto'),
      attachment: t('chat.attachment'),
      empty: t('chat.replyEmpty'),
    }),
    [t],
  );
  const lastMessageKey = messages.at(-1)?.client_message_id ?? messages.at(-1)?.id ?? null;
  const activeTypers = activeId ? (typingUsers[activeId] ?? []) : [];
  const activeTyperNames = activeTypers.map((entry) => entry.name);
  const isSomeoneTyping = activeTypers.length > 0;
  const counterpartyRecentlyActive = useMemo(() => {
    if (!activeId || !activeOtherParticipant || isSomeoneTyping) {
      return false;
    }

    const lastRealtimeAt = counterpartyActivityAt[activeId];
    if (lastRealtimeAt && Date.now() - lastRealtimeAt < RECENT_ACTIVITY_MS) {
      return true;
    }

    const lastMessage = activeConversation?.last_message;
    if (lastMessage && lastMessage.sender_id === activeOtherParticipant.user_id) {
      return Date.now() - new Date(lastMessage.created_at).getTime() < RECENT_ACTIVITY_MS;
    }

    return false;
  }, [
    activeId,
    activeConversation?.last_message,
    activeOtherParticipant,
    counterpartyActivityAt,
    isSomeoneTyping,
  ]);
  const showConnectionSubtitle =
    isSomeoneTyping ||
    counterpartyRecentlyActive ||
    connectionState === 'connecting' ||
    connectionState === 'reconnecting' ||
    connectionState === 'disconnected' ||
    connectionState === 'failed';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/chat' } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearComposerMode();
  }, [activeId, clearComposerMode]);

  useEffect(() => {
    if (!activeConversation || !isConversationInInbox(activeConversation, user?.id)) {
      return;
    }

    queryClient.setQueriesData<{
      conversations: Array<{ id: string }>;
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    }>({ queryKey: chatKeys.conversations() }, (current) => {
      if (!current?.conversations) {
        return current;
      }

      if (current.conversations.some((conversation) => conversation.id === activeConversation.id)) {
        return current;
      }

      return {
        ...current,
        conversations: [activeConversation, ...current.conversations],
      };
    });
  }, [activeConversation, queryClient, user?.id]);

  useEffect(() => {
    if (requestedConversationId) {
      setActiveId(requestedConversationId);
      setShowThreadOnMobile(true);
    }
  }, [requestedConversationId]);

  useEffect(() => {
    if (!activeId || conversationsQuery.isLoading) {
      return;
    }

    const staleSelection = inboxConversations.find((conversation) => conversation.id === activeId);
    if (staleSelection && !isConversationInInbox(staleSelection, user?.id)) {
      dismissInaccessibleConversation(activeId);
    }
  }, [
    activeId,
    conversationsQuery.isLoading,
    dismissInaccessibleConversation,
    inboxConversations,
    user?.id,
  ]);

  useEffect(() => {
    if (!activeId || !directConversationQuery.isError) {
      return;
    }

    if (isForbidden(parseApiError(directConversationQuery.error))) {
      dismissInaccessibleConversation(activeId);
    }
  }, [activeId, directConversationQuery.error, directConversationQuery.isError, dismissInaccessibleConversation]);

  useEffect(() => {
    if (!activeId || !messagesQuery.isError) {
      return;
    }

    if (isForbidden(parseApiError(messagesQuery.error))) {
      dismissInaccessibleConversation(activeId);
    }
  }, [activeId, dismissInaccessibleConversation, messagesQuery.error, messagesQuery.isError]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    scrollContainerToBottom(scrollRef.current, behavior);
  }, []);

  useEffect(() => {
    if (!canAccessThread || !activeId) {
      return;
    }

    subscribeConversation(activeId);

    const markActiveConversationRead = () => {
      markConversationRead(activeId);
    };

    markActiveConversationRead();
    shouldStickToBottomRef.current = true;

    const heartbeat = window.setInterval(markActiveConversationRead, PRESENCE_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [activeId, canAccessThread, subscribeConversation, markConversationRead]);

  useLayoutEffect(() => {
    if (!canAccessThread || !activeId) {
      return;
    }

    shouldStickToBottomRef.current = true;
    scrollToBottom('auto');
  }, [activeId, canAccessThread, scrollToBottom]);

  useLayoutEffect(() => {
    if (!canAccessThread || messagesQuery.isLoading) {
      return;
    }

    if (!shouldStickToBottomRef.current) {
      return;
    }

    scrollToBottom(messagesQuery.isFetchingNextPage ? 'auto' : 'smooth');
  }, [
    canAccessThread,
    isSomeoneTyping,
    lastMessageKey,
    messagesQuery.isFetchingNextPage,
    messagesQuery.isLoading,
    scrollToBottom,
  ]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !canAccessThread) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        scrollContainerToBottom(container, 'auto');
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [canAccessThread, activeId, isSomeoneTyping, lastMessageKey]);

  const handleScroll = useCallback(() => {
    shouldStickToBottomRef.current = isNearContainerBottom(scrollRef.current);
  }, []);

  const handleLoadOlder = async () => {
    const container = scrollRef.current;
    if (!container || !messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) {
      return;
    }

    const previousHeight = container.scrollHeight;
    await messagesQuery.fetchNextPage();
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight - previousHeight;
      }
    });
  };

  const notifyTyping = useCallback(
    (typing: boolean) => {
      if (!activeId || !canAccessThread) {
        return;
      }

      void sendTypingMutation.mutateAsync(typing).catch(() => undefined);
    },
    [activeId, canAccessThread, sendTypingMutation],
  );

  const stopTyping = useCallback(() => {
    window.clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = undefined;
    lastTypingSentRef.current = 0;
    notifyTyping(false);
  }, [notifyTyping]);

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!activeId) {
      return;
    }

    if (!value.trim()) {
      stopTyping();
      return;
    }

    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_DEBOUNCE_MS) {
      lastTypingSentRef.current = now;
      notifyTyping(true);
    }

    window.clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = window.setTimeout(() => {
      notifyTyping(false);
    }, TYPING_STOP_MS);
  };

  const handleSend = async (retryMessage?: ChatMessage) => {
    stopTyping();

    const trimmed = retryMessage?.body?.trim() ?? input.trim();
    const attachment = editingMessage ? undefined : selectedFile ?? undefined;

    if (
      !activeId ||
      !canAccessThread ||
      (!trimmed && !attachment) ||
      sendMessageMutation.isPending ||
      updateMessageMutation.isPending
    ) {
      return;
    }

    if (editingMessage && !retryMessage) {
      try {
        await updateMessageMutation.mutateAsync({
          messageId: editingMessage.id,
          body: trimmed,
        });
        setInput('');
        clearComposerMode();
        shouldStickToBottomRef.current = true;
        scrollToBottom('smooth');
      } catch {
        toast.error(t('chat.sendFailed'));
      }
      return;
    }

    const idempotencyKey = retryMessage?.idempotency_key ?? retryMessage?.client_message_id ?? crypto.randomUUID();

    if (!retryMessage) {
      setInput('');
      if (!attachment) {
        clearAttachmentDraft();
      }
    }

    try {
      if (attachment) {
        setUploadProgress(0);
      }

      sendMessageMutation.reset();

      await sendMessageMutation.mutateAsync({
        body: trimmed,
        idempotency_key: idempotencyKey,
        reply_to_message_id: replyToMessage?.id,
        attachment,
        onUploadProgress: attachment ? setUploadProgress : undefined,
      });
      shouldStickToBottomRef.current = true;
      scrollToBottom('smooth');
      clearAttachmentDraft();
      clearComposerMode();
    } catch (error) {
      if (!retryMessage) {
        setInput(trimmed);
      }
      setUploadProgress(null);
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleReply = useCallback((message: ChatMessage) => {
    setEditingMessage(null);
    setReplyToMessage(message);
  }, []);

  const handleEdit = useCallback((message: ChatMessage) => {
    setReplyToMessage(null);
    setEditingMessage(message);
    setInput(message.body ?? '');
    clearAttachmentDraft();
  }, [clearAttachmentDraft]);

  const handleDelete = useCallback(
    async (message: ChatMessage) => {
      if (!activeId || !canAccessThread) {
        return;
      }

      try {
        await deleteMessageMutation.mutateAsync(message.id);
        if (editingMessage?.id === message.id) {
          clearComposerMode();
          setInput('');
        }
        if (replyToMessage?.id === message.id) {
          setReplyToMessage(null);
        }
      } catch {
        toast.error(t('chat.deleteFailed'));
      }
    },
    [activeId, canAccessThread, clearComposerMode, deleteMessageMutation, editingMessage?.id, replyToMessage?.id, t, toast],
  );

  const handleReport = useCallback((message: ChatMessage) => {
    if (!activeId || !canAccessThread || message.reported_by_me) {
      return;
    }

    setReportingMessage(message);
  }, [activeId, canAccessThread]);

  const handleSubmitReport = useCallback(
    async (payload: { reason: string; details?: string }) => {
      if (!activeId || !canAccessThread || !reportingMessage) {
        return;
      }

      try {
        await reportMessageMutation.mutateAsync({
          messageId: reportingMessage.id,
          reason: payload.reason,
          details: payload.details,
        });
        setReportingMessage(null);
        toast.success(t('chat.reportSubmitted'));
      } catch (error) {
        const parsed = parseApiError(error, locale);
        if (parsed.status === 409) {
          toast.error(parsed.message || t('chat.reportAlreadySubmitted'));
          setReportingMessage(null);
          return;
        }

        toast.error(parsed.message || t('chat.reportFailed'));
      }
    },
    [
      activeId,
      canAccessThread,
      locale,
      reportMessageMutation,
      reportingMessage,
      t,
      toast,
    ],
  );

  const handleRemoveConversation = useCallback(async () => {
    if (!activeId || !canAccessThread) {
      return;
    }

    const confirmed = await confirmRemoveConversation(t);
    if (!confirmed) {
      return;
    }

    try {
      await hideConversationMutation.mutateAsync(activeId);
      clearComposerMode();
      setInput('');
      clearAttachmentDraft();
      setActiveId(null);
      setShowThreadOnMobile(false);
      clearConversationFromUrl();
      toast.success(t('chat.removedFromInbox'));
    } catch {
      toast.error(t('chat.removeConversationFailed'));
    }
  }, [
    activeId,
    canAccessThread,
    clearAttachmentDraft,
    clearComposerMode,
    clearConversationFromUrl,
    hideConversationMutation,
    t,
    toast,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  const panelHeightClass = embedded ? 'h-[calc(100dvh-12rem)] max-h-[calc(100dvh-12rem)]' : 'h-[70vh] max-h-[70vh]';

  return (
    <div className={embedded ? 'flex h-full min-h-0 flex-col' : 'max-w-6xl mx-auto px-4 py-6'} dir={dir}>
      {!embedded ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-diyar-dark">{t('chat.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('chat.selectConversationHint')}</p>
          </div>
          <ChatConnectionStatus state={connectionState} hideWhenConnected />
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-diyar-dark">{t('chat.title')}</h2>
          <ChatConnectionStatus state={connectionState} compact />
        </div>
      )}

      <MessagingSectionErrorBoundary
        fallbackTitle={t('chat.title')}
        fallbackMessage={t('chat.loadError')}
      >
      <div
        className={`grid min-h-0 grid-cols-1 md:grid-cols-[minmax(280px,340px)_1fr] bg-white border border-gray-100 rounded-3xl overflow-hidden ${panelHeightClass} shadow-sm ${embedded ? 'flex-1' : ''}`}
      >
        <aside
          className={`border-e border-gray-100 bg-[#f8f7f5] ${showThreadOnMobile && activeId ? 'hidden md:flex' : 'flex'} flex-col min-h-0 h-full overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-100 bg-white/70 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('chat.searchConversations')}
                className="w-full bg-white border border-gray-200 rounded-xl ps-9 pe-3 py-2.5 text-sm outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar overscroll-y-contain">
            {conversationsQuery.isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-diyar-brown" />
              </div>
            ) : groupedConversations.length === 0 ? (
              <ChatSidebarEmpty
                title={t('chat.noConversations')}
                hint={t('chat.noConversationsHint')}
              />
            ) : (
              groupedConversations.map((group) => (
                <ChatConversationListItem
                  key={group.groupKey}
                  conversation={group.primary}
                  relatedConversations={group.conversations.length > 1 ? group.conversations : undefined}
                  currentUserId={user?.id}
                  isActive={group.conversations.some((conversation) => conversation.id === activeId)}
                  locale={locale}
                  noMessagesLabel={t('chat.noMessagesYet')}
                  previewLabels={previewLabels}
                  fallbackTitle={t('chat.conversation')}
                  t={t}
                  onSelect={() => {
                    setActiveId(group.primary.id);
                    setShowThreadOnMobile(true);
                  }}
                />
              ))
            )}
          </div>
        </aside>

        <section
          className={`${!showThreadOnMobile && !activeId ? 'hidden md:flex' : 'flex'} h-full min-h-0 flex-col overflow-hidden`}
        >
          {activeId && !activeConversation && (directConversationQuery.isLoading || conversationsQuery.isLoading) ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="animate-spin text-diyar-brown" />
            </div>
          ) : !activeConversation ? (
            <ChatSelectConversation
              title={t('chat.selectConversation')}
              hint={t('chat.selectConversationHint')}
            />
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white/90 backdrop-blur-sm shrink-0">
                <button
                  type="button"
                  className="md:hidden shrink-0 w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-diyar-brown hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowThreadOnMobile(false)}
                  aria-label={t('chat.backToList')}
                  title={t('chat.backToList')}
                >
                  {dir === 'rtl' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                {counterpartyProfilePath ? (
                  <Link to={counterpartyProfilePath} className="shrink-0 rounded-full hover:opacity-90 transition-opacity">
                    <ChatAvatar
                      name={activeParty.name}
                      avatarUrl={activeParty.avatarUrl}
                      size="md"
                      online={false}
                    />
                  </Link>
                ) : (
                  <ChatAvatar
                    name={activeParty.name}
                    avatarUrl={activeParty.avatarUrl}
                    size="md"
                    online={false}
                  />
                )}
                <div className="min-w-0 flex-1">
                  {counterpartyProfilePath ? (
                    <Link
                      to={counterpartyProfilePath}
                      className="font-bold text-diyar-dark truncate block hover:text-diyar-brown transition-colors"
                    >
                      {activeParty.name}
                    </Link>
                  ) : (
                    <h2 className="font-bold text-diyar-dark truncate">
                      {activeParty.name}
                    </h2>
                  )}
                  {activePartyRoleLabel ? (
                    <p className="text-xs text-gray-500 truncate">{activePartyRoleLabel}</p>
                  ) : null}
                  {showConnectionSubtitle ? (
                    <p className="text-xs text-gray-500 truncate">
                      {isSomeoneTyping
                        ? t('chat.isTyping', { name: activeTyperNames.join(', ') })
                        : counterpartyRecentlyActive
                          ? t('chat.recentlyActive')
                          : connectionState === 'connecting' || connectionState === 'reconnecting'
                            ? t('chat.reconnecting')
                            : t('chat.disconnected')}
                    </p>
                  ) : null}
                  {activeConversationGroup && activeConversationGroup.conversations.length > 1 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeConversationGroup.conversations.map((conversation) => {
                        const label = conversationContextLabel(conversation, t);
                        if (!label) {
                          return null;
                        }

                        const isSelected = conversation.id === activeId;

                        return (
                          <button
                            key={conversation.id}
                            type="button"
                            onClick={() => setActiveId(conversation.id)}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-diyar-brown text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            aria-label={`${t('chat.switchConversation')}: ${label}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <ChatConnectionStatus state={connectionState} compact hideWhenConnected />
                <button
                  type="button"
                  onClick={() => void handleRemoveConversation()}
                  disabled={hideConversationMutation.isPending}
                  className="shrink-0 w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                  aria-label={t('chat.removeConversation')}
                  title={t('chat.removeConversation')}
                >
                  {hideConversationMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain chat-scrollbar p-4 space-y-4 bg-linear-to-b from-[#faf9f7] to-[#f5f3ef]"
              >
                {messagesQuery.hasNextPage ? (
                  <div className="flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => void handleLoadOlder()}
                      disabled={messagesQuery.isFetchingNextPage}
                      className="text-xs font-bold text-diyar-brown bg-white border border-gray-200 rounded-full px-4 py-1.5 cursor-pointer disabled:opacity-50 hover:bg-gray-50"
                    >
                      {messagesQuery.isFetchingNextPage ? t('chat.loadingOlder') : t('chat.loadOlder')}
                    </button>
                  </div>
                ) : messages.length > 0 ? (
                  <p className="text-center text-[11px] text-gray-400">{t('chat.noMoreMessages')}</p>
                ) : null}

                {messagesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-diyar-brown" />
                  </div>
                ) : messages.length === 0 ? (
                  <ChatThreadEmpty
                    name={activeParty.name}
                    avatarUrl={activeParty.avatarUrl}
                    title={t('chat.emptyThreadTitle')}
                    hint={t('chat.emptyThreadHint')}
                  />
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === user?.id;
                    const senderParticipant = getConversationParticipants(activeConversation).find(
                      (participant) => participant.user_id === message.sender_id,
                    );
                    const repliedMessage = message.reply_to_message_id
                      ? messageById.get(message.reply_to_message_id) ?? null
                      : null;

                    return (
                      <ChatMessageBubble
                        key={message.client_message_id ?? message.id}
                        message={message}
                        isMine={isMine}
                        dir={dir}
                        senderName={message.sender_name ?? senderParticipant?.name}
                        senderAvatarUrl={senderParticipant?.avatar_url}
                        currentUserName={user?.name}
                        currentUserAvatarUrl={user?.avatar_url}
                        replyToMessage={repliedMessage}
                        replyToSenderName={
                          repliedMessage
                            ? resolveMessageSenderName(
                                repliedMessage,
                                activeConversation,
                                user?.id,
                                t('chat.you'),
                                t('chat.conversation'),
                              )
                            : null
                        }
                        replyPreview={
                          repliedMessage ? getMessagePreviewContent(repliedMessage, previewLabels) : null
                        }
                        sendingLabel={t('chat.sending')}
                        retryLabel={t('chat.retry')}
                        editedLabel={t('chat.edited')}
                        deletedLabel={t('chat.messageDeleted')}
                        openAttachmentLabel={t('chat.openAttachment')}
                        saveAttachmentLabel={t('chat.saveAttachment')}
                        loadingAttachmentLabel={t('chat.loadingAttachment')}
                        attachmentFailedLabel={t('chat.attachmentPreviewFailed')}
                        replyActionLabel={t('chat.reply')}
                        editActionLabel={t('chat.edit')}
                        deleteActionLabel={t('chat.delete')}
                        reportActionLabel={t('chat.report')}
                        onRetry={() => void handleSend(message)}
                        onReply={() => handleReply(message)}
                        onEdit={() => handleEdit(message)}
                        onDelete={() => void handleDelete(message)}
                        onReport={() => void handleReport(message)}
                      />
                    );
                  })
                )}

                {isSomeoneTyping ? (
                  <ChatTypingIndicator
                    dir={dir}
                    name={activeTyperNames[0] ?? activeParty.name}
                    avatarUrl={activeParty.avatarUrl}
                  />
                ) : null}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                {replyToMessage ? (
                  <ChatComposerBanner
                    mode="reply"
                    title={t('chat.replyingToName', {
                      name: resolveMessageSenderName(
                        replyToMessage,
                        activeConversation,
                        user?.id,
                        t('chat.you'),
                        t('chat.conversation'),
                      ),
                    })}
                    preview={getMessagePreviewContent(replyToMessage, previewLabels)}
                    cancelLabel={t('chat.cancelReply')}
                    onCancel={() => setReplyToMessage(null)}
                  />
                ) : null}
                {editingMessage ? (
                  <ChatComposerBanner
                    mode="edit"
                    title={t('chat.editingMessage')}
                    preview={getMessagePreviewContent(editingMessage, previewLabels)}
                    cancelLabel={t('chat.cancelEdit')}
                    onCancel={() => {
                      clearComposerMode();
                      setInput('');
                    }}
                  />
                ) : null}
                {selectedFile && attachmentPreviewUrl && !editingMessage ? (
                  <ChatAttachmentDraft
                    file={selectedFile}
                    previewUrl={attachmentPreviewUrl}
                    uploadProgress={uploadProgress}
                    removeLabel={t('chat.removeAttachment')}
                    uploadingLabel={t('chat.uploadingAttachment')}
                    onRemove={clearAttachmentDraft}
                  />
                ) : null}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={CHAT_ATTACHMENT_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      handleAttachmentSelect(file);
                      event.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={Boolean(editingMessage)}
                    className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-diyar-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('chat.attach')}
                  >
                    <Paperclip size={18} />
                  </button>
                  <textarea
                    value={input}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={
                      editingMessage ? t('chat.editMessagePlaceholder') : t('chat.messagePlaceholder')
                    }
                    className="flex-1 min-h-11 max-h-32 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/10 bg-[#faf9f7]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={
                      (!input.trim() && !selectedFile && !editingMessage) ||
                      sendMessageMutation.isPending ||
                      updateMessageMutation.isPending
                    }
                    className="w-11 h-11 rounded-xl bg-diyar-brown text-white flex items-center justify-center disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-diyar-brown/90 transition-colors shadow-sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
                {sendMessageMutation.isError ? (
                  <p className="text-xs text-red-500 mt-2">{t('chat.sendFailed')}</p>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
      </MessagingSectionErrorBoundary>

      {!isAuthenticated ? (
        <div className="mt-4 text-center">
          <Link to="/auth" className="text-diyar-brown font-bold">
            {t('chat.loginRequired')}
          </Link>
        </div>
      ) : null}

      <ChatReportMessageDialog
        open={Boolean(reportingMessage)}
        message={reportingMessage}
        isSubmitting={reportMessageMutation.isPending}
        onClose={() => setReportingMessage(null)}
        onSubmit={(payload) => void handleSubmitReport(payload)}
      />
    </div>
  );
}
