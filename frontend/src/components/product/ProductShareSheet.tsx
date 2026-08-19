import type { ReactNode } from 'react';
import {
  Facebook,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Twitter,
  X,
} from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';

export interface ShareTarget {
  id: string;
  label: string;
  href: string;
  color: string;
  icon: ReactNode;
  external?: boolean;
}

export function buildShareTargets(url: string, title: string): ShareTarget[] {
  const text = `${title}\n${url}`;

  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
      color: 'bg-[#25D366]',
      icon: <MessageCircle size={22} className="text-white" />,
      external: true,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'bg-[#0088cc]',
      icon: <Send size={20} className="text-white" />,
      external: true,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'bg-[#1877F2]',
      icon: <Facebook size={22} className="text-white" />,
      external: true,
    },
    {
      id: 'twitter',
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'bg-black',
      icon: <Twitter size={20} className="text-white" />,
      external: true,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'bg-[#0A66C2]',
      icon: <Linkedin size={20} className="text-white" />,
      external: true,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: `https://www.instagram.com/`,
      color: 'bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]',
      icon: <Instagram size={22} className="text-white" />,
      external: true,
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`,
      color: 'bg-gray-600',
      icon: <Mail size={20} className="text-white" />,
    },
  ];
}

interface ProductShareSheetProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  context?: 'product' | 'store' | 'service' | 'provider';
}

export function ProductShareSheet({
  open,
  onClose,
  url,
  title,
  context = 'product',
}: ProductShareSheetProps) {
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const targets = buildShareTargets(url, title);
  const canNativeShare = typeof navigator.share === 'function';
  const prefix =
    context === 'store'
      ? 'store'
      : context === 'service'
        ? 'serviceMarketplace.detail'
        : context === 'provider'
          ? 'serviceMarketplace.providerPage'
          : 'catalog.productDetail';

  if (!open) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t(`${prefix}.shareCopied`));
      onClose();
    } catch {
      toast.error(t(`${prefix}.shareCopyFailed`));
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: title, url });
      onClose();
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') {
        toast.error(t(`${prefix}.shareCopyFailed`));
      }
    }
  };

  const handleAppShare = async (target: ShareTarget) => {
    if (target.id === 'instagram') {
      try {
        await navigator.clipboard.writeText(`${title}\n${url}`);
        toast.success(t(`${prefix}.shareInstagramHint`));
      } catch {
        toast.error(t(`${prefix}.shareCopyFailed`));
      }
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }

    if (target.external) {
      window.open(target.href, '_blank', 'noopener,noreferrer,width=600,height=520');
    } else {
      window.location.href = target.href;
    }
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 md:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="font-bold text-diyar-dark text-lg">{t(`${prefix}.shareTitle`)}</h3>
          <button
            type="button"
            onClick={onClose}
            className={`${vendorButtonClass} p-2 rounded-full text-gray-400 hover:text-diyar-dark hover:bg-gray-100 cursor-pointer`}
            aria-label={t('catalog.productDetail.reviewCancel')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-gray-500 mb-4 text-right line-clamp-2">{title}</p>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => void handleAppShare(target)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${target.color}`}
                >
                  {target.icon}
                </span>
                <span className="text-[10px] md:text-xs font-medium text-gray-600 text-center leading-tight">
                  {target.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={`${vendorButtonClass} w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-diyar-dark font-bold text-sm hover:bg-gray-50 cursor-pointer`}
            >
              <Link2 size={18} />
              {t(`${prefix}.shareCopy`)}
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className={`${vendorButtonClass} w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-diyar-dark text-white font-bold text-sm hover:bg-black cursor-pointer`}
              >
                <Share2 size={18} />
                {t(`${prefix}.shareMoreApps`)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
