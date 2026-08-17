import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Store } from 'lucide-react';
import { useCart } from '../../hooks/cart/useCart.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useProductEngagementMutations } from '../../hooks/catalog/useProductEngagement.ts';
import { AuthPromptModal } from '../product/AuthPromptModal.tsx';
import type { UiProductCard } from '../../lib/catalogMappers.ts';
import { availabilityLabel, availabilityTone } from '../../lib/catalogMappers.ts';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400';

type CardInput = Omit<Partial<UiProductCard>, 'id' | 'price'> & {
  id?: string | number;
  store?: string;
  originalPrice?: number;
  oldPrice?: number;
  price?: number | string;
  img?: string;
  rating?: number;
  reviews?: number;
  tag?: string;
};

function normalizeProduct(product: CardInput): UiProductCard {
  const price = Number(product.price ?? 0);
  const oldPrice = product.oldPrice ?? product.originalPrice;

  return {
    id: String(product.id ?? ''),
    name: String(product.name ?? ''),
    img: String(product.img ?? PLACEHOLDER),
    price,
    oldPrice: oldPrice != null ? Number(oldPrice) : undefined,
    discountPercent: product.discountPercent,
    vendor: product.vendor ?? product.store,
    store: product.store ?? product.vendor,
    category: product.category,
    availabilityMode: product.availabilityMode,
    availableQuantity: product.availableQuantity,
    userSaved: product.userSaved,
  };
}

const ProductCard: React.FC<{ product: CardInput; layout?: 'grid' | 'list' }> = ({
  product,
  layout = 'grid',
}) => {
  const item = normalizeProduct(product);
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { wishlist } = useProductEngagementMutations(item.id || undefined);

  const [isSaved, setIsSaved] = useState(Boolean(item.userSaved));
  const [authOpen, setAuthOpen] = useState(false);

  const mode = item.availabilityMode ?? 'in_stock';
  const availableQty = item.availableQuantity ?? 0;
  const stockTone = availabilityTone(mode, availableQty);

  const availabilityLabels = useMemo(
    () => ({
      preorder: t('catalog.product.preorder'),
      outOfStock: t('catalog.product.unavailable'),
      limited: t('catalog.product.limitedStock'),
      inStock: t('catalog.product.inStock'),
    }),
    [t],
  );

  const availability = availabilityLabel(mode, availableQty, availabilityLabels);
  const canPurchase =
    mode === 'preorder' || (mode === 'in_stock' && availableQty > 0);

  const availabilityDetail =
    stockTone === 'limited' && availableQty > 0
      ? t('catalog.product.stockRemaining', { count: availableQty })
      : availability;

  const cartLabel =
    mode === 'preorder'
      ? t('catalog.product.preorder')
      : canPurchase
        ? t('catalog.product.addToCart')
        : t('catalog.product.unavailable');

  useEffect(() => {
    if (isAuthenticated) {
      setIsSaved(Boolean(item.userSaved));
    } else {
      setIsSaved(false);
    }
  }, [isAuthenticated, item.userSaved, item.id]);

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canPurchase || !item.id) {
      return;
    }

    addItem(item.id, 1, null, {
      name: item.name,
      sale_price: item.price,
      image_url: item.img,
      availability_mode: mode,
      vendor: item.vendor ? { store_name: item.vendor } : null,
      inventory: { available_quantity: availableQty },
    });
    toast.success(t('cart.added'));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    void wishlist.mutateAsync().then((result) => {
      setIsSaved(result.saved);
    });
  };

  const badge =
    mode === 'preorder'
      ? t('catalog.product.preorder')
      : mode === 'out_of_stock' || availableQty === 0
        ? t('catalog.product.unavailable')
        : item.discountPercent
          ? t('catalog.product.discount', { percent: item.discountPercent })
          : null;

  const cardInner = (
    <>
      <div
        className={`relative overflow-hidden shrink-0 ${layout === 'list' ? 'w-1/3 min-w-27.5 sm:min-w-32.5 md:min-w-37.5 h-full' : 'mb-2 aspect-4/3 md:h-40'}`}
      >
        <img
          src={item.img}
          alt={item.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        <button
          type="button"
          aria-label={t('catalog.productDetail.save')}
          className={`absolute top-2 right-2 cursor-pointer bg-white/80 backdrop-blur-md p-1.5 rounded-full w-7 h-7 shadow-sm transition-all z-10 flex items-center justify-center ${
            isSaved ? 'text-diyar-brown' : 'text-gray-500 hover:text-diyar-brown'
          }`}
          onClick={handleSave}
        >
          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        {badge && (
          <span
            className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold rounded shadow-sm z-10 ${
              mode === 'out_of_stock' || availableQty === 0
                ? 'bg-gray-700 text-white'
                : mode === 'preorder'
                  ? 'bg-purple-600 text-white'
                  : 'bg-red-500 text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div
        className={`flex flex-col grow ${layout === 'list' ? 'p-2.5 sm:p-4 justify-between h-full' : 'px-3.5 pb-3.5'}`}
      >
        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1 font-medium">
          <Store size={12} className="text-diyar-brown shrink-0" />
          <span className="truncate">{item.vendor || item.store || t('catalog.product.defaultStore')}</span>
        </div>
        <h3
          className={`font-bold text-diyar-dark leading-snug ${layout === 'list' ? 'text-xs sm:text-base mb-1 line-clamp-1 sm:line-clamp-2' : 'text-sm md:text-base mb-1.5 line-clamp-2'}`}
        >
          {item.name}
        </h3>
        <p
          className={`text-[10px] mb-2 tabular-nums ${
            stockTone === 'out'
              ? 'text-red-500 font-medium'
              : stockTone === 'limited'
                ? 'text-orange-500 font-medium'
                : stockTone === 'preorder'
                  ? 'text-purple-600 font-medium'
                  : 'text-green-600 font-medium'
          }`}
        >
          {availabilityDetail}
        </p>
        <div className={`flex items-baseline gap-2 ${layout === 'list' ? 'mb-1' : 'mb-3'}`}>
          <span
            className={`font-bold text-diyar-dark tabular-nums ${layout === 'list' ? 'text-sm sm:text-lg' : 'text-lg'}`}
          >
            {item.price}{' '}
            <span className="text-xs font-medium text-gray-400">{t('vendor.products.table.currency')}</span>
          </span>
          {item.oldPrice && (
            <span className="text-gray-400 line-through text-[10px] tabular-nums">
              {item.oldPrice} {t('vendor.products.table.currency')}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!canPurchase || !item.id}
          className={`${layout === 'list' ? 'self-end py-1 px-3 text-[10px] sm:text-xs' : 'w-full py-1.5 text-xs'} rounded-lg font-bold border transition-all z-10 relative cursor-pointer ${
            canPurchase
              ? 'bg-gray-50 text-diyar-dark border-gray-200 hover:bg-diyar-brown hover:text-white hover:border-diyar-dark'
              : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
          }`}
          onClick={addToCart}
        >
          {cartLabel}
        </button>
      </div>
    </>
  );

  const cardBody =
    layout === 'list' ? (
      <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md bg-white relative flex flex-row h-32 sm:h-36 md:h-40">
        {cardInner}
      </div>
    ) : (
      <div className="border border-gray-100 shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white relative flex flex-col h-full">
        {cardInner}
      </div>
    );

  return (
    <>
      <Link
        to={`/product/${item.id}`}
        className={layout === 'list' ? 'block w-full group' : 'block h-full group'}
      >
        {cardBody}
      </Link>

      <AuthPromptModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        message={t('catalog.product.saveAuthMessage')}
      />
    </>
  );
};

export default ProductCard;
