import { Link } from 'react-router-dom';
import { HorizontalRail } from '../home/sections/HorizontalRail.tsx';
import { resolveMediaUrl } from '../../lib/media.ts';
import { isValidStoreSlug, storePath } from '../../lib/storePath.ts';
import { useLocale } from '../../hooks/useLocale.ts';

export type VerifiedStoreItem = {
  id: string;
  store_name: string;
  slug?: string | null;
  logo_url?: string | null;
  product_count?: number | null;
};

type VerifiedStoresRailProps = {
  vendors: VerifiedStoreItem[];
  mode?: 'link' | 'filter';
  selectedVendorId?: string;
  onSelectVendor?: (vendorId: string | undefined) => void;
  className?: string;
};

const FILTER_CARD =
  'h-[7.25rem] w-[6.75rem] sm:h-[7.75rem] sm:w-28 shrink-0 snap-start overflow-hidden rounded-xl border p-2.5';
const LINK_CARD =
  'h-36 w-32 sm:h-40 sm:w-36 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4';

function StoreAvatar({ vendor, size }: { vendor: VerifiedStoreItem; size: 'sm' | 'md' }) {
  const avatarClass = size === 'sm' ? 'size-9' : 'size-11';

  if (vendor.logo_url) {
    return (
      <img
        src={resolveMediaUrl(vendor.logo_url) ?? ''}
        alt=""
        className={`${avatarClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${avatarClass} flex shrink-0 items-center justify-center rounded-full bg-diyar-cream/40 text-sm font-bold text-diyar-brown`}
    >
      {vendor.store_name.charAt(0)}
    </div>
  );
}

function StoreCardBody({ vendor, size }: { vendor: VerifiedStoreItem; size: 'sm' | 'md' }) {
  const { t } = useLocale();

  return (
    <div className="flex h-full w-full min-w-0 flex-col items-center justify-between gap-1">
      <StoreAvatar vendor={vendor} size={size} />
      <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
        <p
          className="w-full truncate text-center text-xs font-bold leading-tight text-diyar-dark"
          title={vendor.store_name}
        >
          {vendor.store_name}
        </p>
        <p className="w-full truncate text-center text-[10px] leading-tight text-gray-400">
          {t('catalog.category.productCount', { count: vendor.product_count ?? 0 })}
        </p>
      </div>
    </div>
  );
}

export function VerifiedStoresRail({
  vendors,
  mode = 'link',
  selectedVendorId,
  onSelectVendor,
  className = '',
}: VerifiedStoresRailProps) {
  const items = vendors.filter((vendor) =>
    mode === 'link' ? isValidStoreSlug(vendor.slug) : true,
  );

  if (items.length === 0) {
    return null;
  }

  if (mode === 'filter') {
    return (
      <div className={className}>
        <HorizontalRail
          controlsClassName="mb-1"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
        >
          {items.map((vendor) => {
            const isSelected = selectedVendorId === vendor.id;
            return (
              <button
                key={vendor.id}
                type="button"
                onClick={() => onSelectVendor?.(isSelected ? undefined : vendor.id)}
                className={`${FILTER_CARD} cursor-pointer transition ${
                  isSelected
                    ? 'border-diyar-brown bg-diyar-brown/10'
                    : 'border-gray-200 bg-gray-50 hover:border-diyar-brown/40'
                }`}
              >
                <StoreCardBody vendor={vendor} size="sm" />
              </button>
            );
          })}
        </HorizontalRail>
      </div>
    );
  }

  return (
    <HorizontalRail
      className={`flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x sm:gap-4 md:gap-6 ${className}`}
    >
      {items.map((vendor) => (
        <Link
          key={vendor.id}
          to={storePath(vendor.slug)!}
          className={`${LINK_CARD} group text-center transition hover:shadow-md`}
        >
          <StoreCardBody vendor={vendor} size="md" />
        </Link>
      ))}
    </HorizontalRail>
  );
}
