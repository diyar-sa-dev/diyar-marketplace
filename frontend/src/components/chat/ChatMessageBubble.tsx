import { Loader2 } from 'lucide-react';
import { ChatAvatar } from './ChatAvatar.tsx';
import { ChatMessageActions } from './ChatMessageActions.tsx';
import { ChatMessageAttachmentPreview } from './ChatMessageAttachment.tsx';
import { ChatReplyQuote } from './ChatReplyQuote.tsx';
import { getMessageBubbleLayout } from '../../lib/chat/conversationHelpers.ts';
import type { ChatMessage } from '../../types/chat.ts';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  dir: 'rtl' | 'ltr';
  senderName?: string | null;
  senderAvatarUrl?: string | null;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  replyToMessage?: ChatMessage | null;
  replyToSenderName?: string | null;
  replyPreview?: string | null;
  sendingLabel: string;
  retryLabel: string;
  editedLabel: string;
  deletedLabel: string;
  openAttachmentLabel: string;
  saveAttachmentLabel: string;
  loadingAttachmentLabel: string;
  attachmentFailedLabel: string;
  replyActionLabel: string;
  editActionLabel: string;
  deleteActionLabel: string;
  reportActionLabel: string;
  onRetry: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

export function ChatMessageBubble({
  message,
  isMine,
  dir,
  senderName,
  senderAvatarUrl,
  currentUserName,
  currentUserAvatarUrl,
  replyToMessage,
  replyToSenderName,
  replyPreview,
  sendingLabel,
  retryLabel,
  editedLabel,
  deletedLabel,
  openAttachmentLabel,
  saveAttachmentLabel,
  loadingAttachmentLabel,
  attachmentFailedLabel,
  replyActionLabel,
  editActionLabel,
  deleteActionLabel,
  reportActionLabel,
  onRetry,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: ChatMessageBubbleProps) {
  const isPending = message.send_status === 'pending';
  const isFailed = message.send_status === 'failed';
  const isDeleted = Boolean(message.is_deleted || message.deleted_at);
  const layout = getMessageBubbleLayout(dir, isMine);
  const canEdit = isMine && !isDeleted && !isPending && !isFailed;
  const canDelete = isMine && !isDeleted && !isPending && !isFailed;
  const canReply = !isDeleted && !isPending && !isFailed;
  const canReport = !isMine && canReply && !message.reported_by_me;

  const avatar = (
    <ChatAvatar
      name={isMine ? currentUserName : senderName}
      avatarUrl={isMine ? currentUserAvatarUrl : senderAvatarUrl}
      size="sm"
    />
  );

  const actions = (
    <ChatMessageActions
      canReply={canReply}
      canEdit={canEdit}
      canDelete={canDelete}
      canReport={canReport}
      replyLabel={replyActionLabel}
      editLabel={editActionLabel}
      deleteLabel={deleteActionLabel}
      reportLabel={reportActionLabel}
      onReply={onReply}
      onEdit={onEdit}
      onDelete={onDelete}
      onReport={onReport}
    />
  );

  const bubble = (
    <div
      dir={dir}
      className={`max-w-[min(80%,28rem)] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
        isMine
          ? 'bg-diyar-dark text-white rounded-be-sm'
          : 'bg-white border border-gray-100 text-diyar-dark rounded-bs-sm'
      } ${isPending ? 'opacity-75' : ''} ${isFailed ? 'ring-1 ring-red-300' : ''}`}
    >
      {!isMine && senderName ? (
        <p className="text-[11px] font-bold mb-1 text-diyar-brown/80">{senderName}</p>
      ) : null}

      {replyToMessage && replyToSenderName && replyPreview && !isDeleted ? (
        <ChatReplyQuote senderName={replyToSenderName} preview={replyPreview} isMine={isMine} />
      ) : null}

      {isDeleted ? (
        <p className={`italic text-sm ${isMine ? 'text-white/70' : 'text-gray-400'}`}>{deletedLabel}</p>
      ) : (
        <>
          {message.body ? <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p> : null}
          {message.attachments?.map((attachment) => (
            <ChatMessageAttachmentPreview
              key={attachment.id}
              attachment={attachment}
              isMine={isMine}
              openLabel={openAttachmentLabel}
              saveLabel={saveAttachmentLabel}
              loadingLabel={loadingAttachmentLabel}
              failedLabel={attachmentFailedLabel}
            />
          ))}
        </>
      )}

      <div className={`flex items-center gap-2 mt-1.5 ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
        <p className="text-[10px] tabular-nums">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {message.edited_at && !isDeleted ? (
          <p className="text-[10px] italic">{editedLabel}</p>
        ) : null}
        {isPending ? (
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Loader2 size={10} className="animate-spin" />
            {sendingLabel}
          </span>
        ) : null}
        {isFailed ? (
          <button type="button" onClick={onRetry} className="text-[10px] font-bold underline cursor-pointer">
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="group w-full flex" dir="ltr">
      <div className={`flex items-end gap-1.5 max-w-[min(92%,36rem)] ${layout.rowClass}`}>
        {layout.actionsFirst ? (
          <>
            {actions}
            {layout.avatarFirst ? (
              <>
                {avatar}
                {bubble}
              </>
            ) : (
              <>
                {bubble}
                {avatar}
              </>
            )}
          </>
        ) : (
          <>
            {layout.avatarFirst ? (
              <>
                {avatar}
                {bubble}
              </>
            ) : (
              <>
                {bubble}
                {avatar}
              </>
            )}
            {actions}
          </>
        )}
      </div>
    </div>
  );
}
