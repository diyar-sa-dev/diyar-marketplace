import { useEffect, useState } from 'react';
import { fetchChatAttachmentBlob } from '../../api/chat.ts';
import type { ChatMessageAttachment } from '../../types/chat.ts';

const blobCache = new Map<string, string>();

function cacheKey(path: string): string {
  return path.split('?')[0] ?? path;
}

export function useChatAttachmentBlob(attachment: ChatMessageAttachment | null, enabled = true) {
  const isActive = attachment !== null && enabled;
  const path = isActive ? (attachment.preview_url ?? attachment.url) : null;
  const cachedUrl = path ? (blobCache.get(cacheKey(path)) ?? null) : null;
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path || cachedUrl) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setIsLoading(true);
      setError(false);
    });

    void fetchChatAttachmentBlob(path, true)
      .then((blob) => {
        if (cancelled) {
          return;
        }

        const url = URL.createObjectURL(blob);
        blobCache.set(cacheKey(path), url);
        setLoadedPath(path);
        setLoadedUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoadedPath(path);
          setLoadedUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, cachedUrl]);

  const blobUrl = isActive ? (cachedUrl ?? (loadedPath === path ? loadedUrl : null)) : null;

  return {
    blobUrl,
    isLoading: isActive && !cachedUrl && isLoading,
    error: isActive && !cachedUrl && error,
  };
}

export async function downloadChatAttachment(
  attachment: ChatMessageAttachment,
  fallbackName?: string,
): Promise<void> {
  const blob = await fetchChatAttachmentBlob(attachment.url, false);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.original_name || fallbackName || 'attachment';
  link.click();
  URL.revokeObjectURL(url);
}

export async function openChatAttachment(attachment: ChatMessageAttachment): Promise<void> {
  const blob = await fetchChatAttachmentBlob(attachment.preview_url ?? attachment.url, true);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
