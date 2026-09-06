import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ChatMessageActionsProps = {
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  canReport: boolean;
  replyLabel: string;
  editLabel: string;
  deleteLabel: string;
  reportLabel: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

export function ChatMessageActions({
  canEdit,
  canDelete,
  canReply,
  canReport,
  replyLabel,
  editLabel,
  deleteLabel,
  reportLabel,
  onReply,
  onEdit,
  onDelete,
  onReport,
}: ChatMessageActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!canReply && !canEdit && !canDelete && !canReport) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative shrink-0 self-end pb-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-diyar-dark cursor-pointer transition-colors"
        aria-label={replyLabel}
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <div className="absolute bottom-8 inset-e-0 z-20 min-w-32 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {canReply ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReply();
              }}
              className="block w-full px-3 py-2 text-start text-sm text-diyar-dark hover:bg-gray-50 cursor-pointer"
            >
              {replyLabel}
            </button>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="block w-full px-3 py-2 text-start text-sm text-diyar-dark hover:bg-gray-50 cursor-pointer"
            >
              {editLabel}
            </button>
          ) : null}
          {canReport ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
              className="block w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              {reportLabel}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="block w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              {deleteLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
