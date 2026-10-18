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
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/75 backdrop-blur-xs sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-studio-title"
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-none bg-[#fbf9f5] text-diyar-dark shadow-2xl sm:h-[min(96dvh,980px)] sm:max-h-[96vh] sm:rounded-3xl border border-diyar-brown/30"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-diyar-brown/30 bg-diyar-dark px-3 py-3 text-white sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-diyar-brown text-white shadow-xs">
              <Sparkles size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="room-studio-title" className="truncate text-sm font-bold sm:text-base">
                  مصمم الغرف التفاعلي
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-white/90 font-medium border border-white/10">
                  2D • 2.5D • 3D واقعي
                </span>
              </div>
              <p className="truncate text-[11px] font-medium text-white/75">
                تخيّل مكانك، ورتّب قطع أثاث ديار كيفما تشاء
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${vendorButtonClass} rounded-full p-2 text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer`}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3.5 bg-[#fbf9f5]">
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
              <div className="h-full min-h-0 flex-1 flex flex-col overflow-hidden">
                <RoomDesignerWorkspace />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
