import { Loader2 } from 'lucide-react';
import { useRef } from 'react';
import { useModalDialog } from '../../../hooks/useModalDialog.ts';
import type { DesignCartLine } from '../adapters/deriveCartLinesFromDocument.ts';

export type AddToCartReviewModalProps = {
  open: boolean;
  lines: DesignCartLine[];
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
};

export function AddToCartReviewModal({
  open,
  lines,
  onConfirm,
  onClose,
  isSubmitting,
  errorMessage,
}: AddToCartReviewModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  const totalPieces = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-110 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-t-2xl bg-background p-5 pb-safe shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-cart-review-title"
        data-testid="room-design-add-to-cart-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-to-cart-review-title" className="text-lg font-semibold">
          إضافة إلى السلة
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalPieces} قطعة — الأسعار والمخزون يُحدَّثان من السيرفر عند التأكيد.
        </p>

        <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto">
          {lines.map((line) => (
            <li
              key={line.product_id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="truncate">{line.label}</span>
              <span className="shrink-0 text-muted-foreground">× {line.quantity}</span>
            </li>
          ))}
        </ul>

        {errorMessage ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl border px-4 py-2 text-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
            onClick={onConfirm}
            disabled={isSubmitting || lines.length === 0}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
