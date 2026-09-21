import { Sparkles, X } from 'lucide-react';
import { useRef } from 'react';
import { AuthPromptModal } from '../../product/AuthPromptModal.tsx';
import { ErrorBoundary } from '../../common/ErrorBoundary.tsx';
import { useAuth } from '../../../hooks/auth/useAuth.ts';
import { useModalDialog } from '../../../hooks/useModalDialog.ts';
import { vendorButtonClass } from '../../../lib/vendorProductValidation.ts';
import { RoomDesignerWorkspace } from '../../../features/room-designer/ui/RoomDesignerWorkspace.tsx';

type SidebarAiStudioModalProps = {
  onClose: () => void;
};

export function SidebarAiStudioModal({ onClose }: SidebarAiStudioModalProps) {
  const { isAuthenticated } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalDialog(true, onClose, panelRef);

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-studio-title"
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white text-diyar-dark shadow-2xl sm:h-[min(92dvh,880px)] sm:max-h-[92vh] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-diyar-dark px-3 py-3 text-white sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-diyar-brown text-white">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <h3 id="room-studio-title" className="truncate text-sm font-bold sm:text-base">
                مصمم الغرف التفاعلي
              </h3>
              <p className="truncate text-[11px] font-medium text-white/70">
                تخيّل مكانك، ورتّب قطع أثاث ديار كيفما تشاء
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${vendorButtonClass} rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white`}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-4">
          {!isAuthenticated ? (
            <AuthPromptModal
              open
              onClose={onClose}
              title="سجّل الدخول لفتح المصمم"
              message="يلزم حساب ديار لحفظ غرفتك ومعاينة الأثاث داخلها."
            />
          ) : (
            <ErrorBoundary
              fallback={
                <div className="p-8 text-center" role="alert">
                  <p className="text-sm text-muted-foreground">تعذّر فتح المصمم. أغلق النافذة وحاول مرة أخرى.</p>
                  <button
                    type="button"
                    className="mt-4 min-h-11 text-sm text-diyar-brown underline"
                    onClick={onClose}
                  >
                    إغلاق
                  </button>
                </div>
              }
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <RoomDesignerWorkspace />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
