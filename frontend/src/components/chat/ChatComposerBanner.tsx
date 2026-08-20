import { CornerUpLeft, Pencil, X } from 'lucide-react';

type ChatComposerBannerProps = {
  mode: 'reply' | 'edit';
  title: string;
  preview: string;
  cancelLabel: string;
  onCancel: () => void;
};

export function ChatComposerBanner({
  mode,
  title,
  preview,
  cancelLabel,
  onCancel,
}: ChatComposerBannerProps) {
  const Icon = mode === 'edit' ? Pencil : CornerUpLeft;

  return (
    <div className="mb-3 flex items-stretch gap-3 overflow-hidden rounded-2xl border border-diyar-brown/15 bg-linear-to-r from-diyar-cream/70 to-white px-3 py-2.5 shadow-sm">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-diyar-brown/10 text-diyar-brown">
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1 border-s-2 border-diyar-brown/30 ps-2.5">
          <p className="text-[11px] font-bold text-diyar-brown truncate">{title}</p>
          <p className="text-xs text-gray-600 truncate mt-0.5">{preview}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 self-start rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
        aria-label={cancelLabel}
      >
        <X size={14} />
      </button>
    </div>
  );
}
