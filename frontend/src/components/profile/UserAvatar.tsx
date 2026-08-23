import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useLocale } from '../../lib/i18n/localeContext.ts';
import { resolveMediaUrl } from '../../lib/media.ts';

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'onDark';
  editable?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
  onUpload?: (file: File) => void;
  onDelete?: () => void;
};

function initialsFromName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return '?';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'lg',
  variant = 'default',
  editable = false,
  isUploading = false,
  isDeleting = false,
  onUpload,
  onDelete,
}: UserAvatarProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedUrl = useMemo(() => resolveMediaUrl(avatarUrl), [avatarUrl]);
  const showImage = Boolean(resolvedUrl) && !imageFailed;
  const isBusy = isUploading || isDeleting;

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUrl]);

  const dimension =
    size === 'lg' ? 'w-24 h-24 text-3xl' : size === 'md' ? 'w-16 h-16 text-xl' : 'w-9 h-9 text-xs';
  const borderWidth = size === 'sm' ? 'border-2' : 'border-4';
  const shellClassName =
    variant === 'onDark'
      ? showImage
        ? 'border-white/50'
        : 'bg-white text-diyar-dark border-white/80'
      : 'bg-diyar-brown/10 text-diyar-dark border-white';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    event.target.value = '';
  };

  const openFilePicker = () => {
    if (!isBusy) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={`relative group shrink-0 ${dimension}`}>
      <div
        className={`${dimension} relative rounded-full overflow-hidden ${borderWidth} drop-shadow-md font-bold ${shellClassName}`}
      >
        <div
          role={editable ? 'button' : undefined}
          tabIndex={editable && !isBusy ? 0 : undefined}
          onClick={editable ? openFilePicker : undefined}
          onKeyDown={
            editable
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openFilePicker();
                  }
                }
              : undefined
          }
          className={`absolute inset-0 flex items-center justify-center ${editable ? 'cursor-pointer' : ''}`}
          aria-label={editable ? t('profile.avatar.update') : undefined}
        >
          {showImage ? (
            <img
              src={resolvedUrl}
              alt={name ?? t('profile.avatar.alt')}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span>{initialsFromName(name)}</span>
          )}
        </div>

        {isBusy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {!isBusy && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-full bg-black/45 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                  disabled={isBusy}
                  className="cursor-pointer rounded-full bg-white/90 p-2 text-diyar-dark hover:bg-white disabled:opacity-60"
                  aria-label={t('profile.avatar.update')}
                >
                  <Camera size={18} />
                </button>
                {showImage && onDelete && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete();
                    }}
                    disabled={isBusy}
                    className="cursor-pointer rounded-full bg-white/90 p-2 text-red-600 hover:bg-white disabled:opacity-60"
                    aria-label={t('profile.avatar.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
