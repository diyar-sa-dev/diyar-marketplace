import type { ChatMessage } from '../../types/chat.ts';

export type MessagesInfiniteData = {
  pages: Array<{ messages: ChatMessage[]; next_cursor: string | null }>;
  pageParams: Array<string | null>;
};

/** React Query infinite pages: index 0 = newest batch, higher indices = older batches. */
const NEWEST_PAGE_INDEX = 0;

export function messageKey(message: ChatMessage): string {
  return message.client_message_id ?? message.idempotency_key ?? message.id;
}

export function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a.id.localeCompare(b.id);
  });
}

export function flattenMessages(data: MessagesInfiniteData | undefined): ChatMessage[] {
  if (!data?.pages?.length) {
    return [];
  }

  const seen = new Set<string>();
  const merged: ChatMessage[] = [];

  for (let pageIndex = data.pages.length - 1; pageIndex >= 0; pageIndex -= 1) {
    for (const message of data.pages[pageIndex].messages) {
      const key = messageKey(message);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(message);
    }
  }

  return sortMessages(merged);
}

function upsertOnNewestPage(
  pages: MessagesInfiniteData['pages'],
  message: ChatMessage,
): MessagesInfiniteData['pages'] {
  const nextPages = [...pages];
  const newestPage = nextPages[NEWEST_PAGE_INDEX] ?? { messages: [], next_cursor: null };

  const exists = newestPage.messages.some(
    (item) =>
      item.id === message.id ||
      (message.client_message_id && item.client_message_id === message.client_message_id) ||
      (message.idempotency_key && item.idempotency_key === message.idempotency_key) ||
      (message.idempotency_key && item.id === message.idempotency_key) ||
      (message.idempotency_key && item.client_message_id === message.idempotency_key),
  );

  if (exists) {
    nextPages[NEWEST_PAGE_INDEX] = {
      ...newestPage,
      messages: sortMessages(
        newestPage.messages.map((item) =>
          item.client_message_id === message.client_message_id ||
          (message.idempotency_key && item.idempotency_key === message.idempotency_key) ||
          item.id === message.id ||
          item.id === message.idempotency_key
            ? message
            : item,
        ),
      ),
    };
  } else {
    nextPages[NEWEST_PAGE_INDEX] = {
      ...newestPage,
      messages: sortMessages([...newestPage.messages, message]),
    };
  }

  return nextPages;
}

export function appendMessageToInfiniteData(
  data: MessagesInfiniteData | undefined,
  message: ChatMessage,
): MessagesInfiniteData {
  if (!data?.pages?.length) {
    return {
      pages: [{ messages: [message], next_cursor: null }],
      pageParams: [null],
    };
  }

  return {
    ...data,
    pages: upsertOnNewestPage(data.pages, message),
    pageParams:
      data.pageParams?.length === data.pages.length
        ? data.pageParams
        : data.pages.map((_, index) => data.pageParams?.[index] ?? null),
  };
}

/** Append a realtime message without ever shrinking an existing thread cache. */
export function mergeIncomingMessage(
  data: MessagesInfiniteData | undefined,
  message: ChatMessage,
): MessagesInfiniteData {
  const previousCount = flattenMessages(data).length;
  const next = appendMessageToInfiniteData(data, message);
  const nextCount = flattenMessages(next).length;

  if (data?.pages?.length) {
    if (next.pages.length < data.pages.length) {
      return {
        ...next,
        pages: [next.pages[0], ...data.pages.slice(1)],
        pageParams:
          data.pageParams?.length === data.pages.length
            ? data.pageParams
            : data.pages.map((_, index) => data.pageParams?.[index] ?? null),
      };
    }

    if (nextCount < previousCount) {
      return data;
    }
  }

  return next;
}

export function replaceOptimisticMessage(
  data: MessagesInfiniteData | undefined,
  clientMessageId: string,
  message: ChatMessage,
): MessagesInfiniteData | undefined {
  if (!data?.pages?.length) {
    return data;
  }

  const pages = data.pages.map((page, index) => ({
    ...page,
    messages:
      index === NEWEST_PAGE_INDEX
        ? sortMessages(
            page.messages.map((item) =>
              item.client_message_id === clientMessageId || item.id === clientMessageId
                ? message
                : item,
            ),
          )
        : page.messages,
  }));

  return { ...data, pages };
}

export function markMessageFailed(
  data: MessagesInfiniteData | undefined,
  clientMessageId: string,
): MessagesInfiniteData | undefined {
  if (!data?.pages?.length) {
    return data;
  }

  const pages = data.pages.map((page, index) => ({
    ...page,
    messages:
      index === NEWEST_PAGE_INDEX
        ? page.messages.map((item) =>
            item.client_message_id === clientMessageId
              ? { ...item, send_status: 'failed' as const }
              : item,
          )
        : page.messages,
  }));

  return { ...data, pages };
}

export function mergeReconciledMessages(
  data: MessagesInfiniteData | undefined,
  incoming: ChatMessage[],
): MessagesInfiniteData {
  if (!incoming.length) {
    return data ?? { pages: [{ messages: [], next_cursor: null }], pageParams: [null] };
  }

  if (!data?.pages?.length) {
    return {
      pages: [{ messages: sortMessages(incoming), next_cursor: null }],
      pageParams: [null],
    };
  }

  let merged = data;
  for (const message of incoming) {
    merged = appendMessageToInfiniteData(merged, message);
  }

  return merged;
}

export function markMessageReportedByMe(
  data: MessagesInfiniteData | undefined,
  messageId: string,
): MessagesInfiniteData | undefined {
  if (!data?.pages?.length) {
    return data;
  }

  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.map((item) =>
      item.id === messageId ? { ...item, reported_by_me: true } : item,
    ),
  }));

  return { ...data, pages };
}

export function upsertMessageInInfiniteData(
  data: MessagesInfiniteData | undefined,
  message: ChatMessage,
): MessagesInfiniteData | undefined {
  if (!data?.pages?.length) {
    return data;
  }

  let found = false;
  const pages = data.pages.map((page) => ({
    ...page,
    messages: page.messages.map((item) => {
      if (
        item.id === message.id ||
        (message.client_message_id && item.client_message_id === message.client_message_id) ||
        (message.idempotency_key && item.idempotency_key === message.idempotency_key)
      ) {
        found = true;
        return {
          ...message,
          client_message_id: item.client_message_id ?? message.client_message_id,
        };
      }

      return item;
    }),
  }));

  if (!found) {
    return appendMessageToInfiniteData(data, message);
  }

  return {
    ...data,
    pages: pages.map((page, index) =>
      index === NEWEST_PAGE_INDEX ? { ...page, messages: sortMessages(page.messages) } : page,
    ),
  };
}
