import { X } from 'lucide-react';

type ChatAttachmentDraftProps = {
  file: File;
  previewUrl: string;
  uploadProgress: number | null;
  removeLabel: string;
  uploadingLabel: string;
  onRemove: () => void;
};

export function ChatAttachmentDraft({
  file,
  previewUrl,
  uploadProgress,
  removeLabel,
  uploadingLabel,
  onRemove,
}: ChatAttachmentDraftProps) {
  const isUploading = uploadProgress !== null;

  return (
    <div className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-start gap-3">
        <img
          src={previewUrl}
          alt={file.name}
          className="h-20 w-20 rounded-xl object-cover border border-gray-200 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-diyar-dark truncate">{file.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
          {isUploading ? (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-diyar-brown transition-[width] duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {uploadingLabel} {uploadProgress}%
              </p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isUploading}
          onClick={onRemove}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer disabled:opacity-40"
          aria-label={removeLabel}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
