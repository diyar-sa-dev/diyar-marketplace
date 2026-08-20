export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export const CHAT_ATTACHMENT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_MIME_TYPES.join(',');

export type ChatAttachmentValidationError = 'invalidType' | 'tooLarge';

export function validateChatAttachment(
  file: File,
): { ok: true } | { ok: false; error: ChatAttachmentValidationError } {
  if (
    !CHAT_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof CHAT_ATTACHMENT_MIME_TYPES)[number])
  ) {
    return { ok: false, error: 'invalidType' };
  }

  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
    return { ok: false, error: 'tooLarge' };
  }

  return { ok: true };
}
