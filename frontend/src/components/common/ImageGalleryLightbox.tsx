import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

type ImageGalleryLightboxProps = {
  images: string[];
  open: boolean;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
  altPrefix?: string;
};

export function ImageGalleryLightbox({
  images,
  open,
  activeIndex,
  onActiveIndexChange,
  onClose,
  altPrefix = 'Image',
}: ImageGalleryLightboxProps) {
  const { dir } = useLocale();

  if (!open || images.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1);
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-center bg-black/95 animate-in fade-in duration-300"
      dir={dir}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 inset-e-6 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-md hover:text-gray-300 cursor-pointer"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div
        className="relative mx-auto w-full max-w-5xl p-4 md:p-12"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl md:aspect-video">
          <img
            src={images[safeIndex]}
            alt={`${altPrefix} ${safeIndex + 1}`}
            className="max-h-full max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {images.length > 1 ? (
          <>
            <div className="absolute inset-y-0 inset-s-4 flex items-center md:inset-s-8">
              <button
                type="button"
                onClick={() => onActiveIndexChange((safeIndex - 1 + images.length) % images.length)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <PrevIcon size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 inset-e-4 flex items-center md:inset-e-8">
              <button
                type="button"
                onClick={() => onActiveIndexChange((safeIndex + 1) % images.length)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <NextIcon size={24} />
              </button>
            </div>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 flex justify-center gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onActiveIndexChange(index);
              }}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer md:h-20 md:w-20 ${
                safeIndex === index
                  ? 'scale-105 border-diyar-brown shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
