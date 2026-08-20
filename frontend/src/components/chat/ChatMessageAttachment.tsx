import { Download, ExternalLink, Loader2 } from 'lucide-react';
import type { ChatMessageAttachment } from '../../types/chat.ts';
import {
  downloadChatAttachment,
  openChatAttachment,
  useChatAttachmentBlob,
} from '../../hooks/chat/useChatAttachment.ts';

type ChatMessageAttachmentPreviewProps = {
  attachment: ChatMessageAttachment;
  isMine: boolean;
  openLabel: string;
  saveLabel: string;
  loadingLabel: string;
  failedLabel: string;
};

export function ChatMessageAttachmentPreview({
  attachment,
  isMine,
  openLabel,
  saveLabel,
  loadingLabel,
  failedLabel,
}: ChatMessageAttachmentPreviewProps) {
  const isImage = attachment.mime_type.startsWith('image/');
  const { blobUrl, isLoading, error } = useChatAttachmentBlob(attachment, isImage);

  const actionClass = isMine
    ? 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20'
    : 'text-diyar-brown bg-white hover:bg-gray-50 border border-gray-200';

  return (
    <div className="mt-2 space-y-2">
      {isImage ? (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-black/5">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="animate-spin text-diyar-brown" size={22} />
            </div>
          ) : error || !blobUrl ? (
            <div className="flex h-24 items-center justify-center px-3 text-center text-xs opacity-70">
              {failedLabel}
            </div>
          ) : (
            <img
              src={blobUrl}
              alt={attachment.original_name}
              className="max-h-72 w-full object-cover cursor-pointer"
              onClick={() => void openChatAttachment(attachment)}
            />
          )}
        </div>
      ) : (
        <p className="text-xs opacity-80 truncate">{attachment.original_name}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void openChatAttachment(attachment)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${actionClass}`}
        >
          <ExternalLink size={12} />
          {isLoading && isImage ? loadingLabel : openLabel}
        </button>
        <button
          type="button"
          onClick={() => void downloadChatAttachment(attachment)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${actionClass}`}
        >
          <Download size={12} />
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
