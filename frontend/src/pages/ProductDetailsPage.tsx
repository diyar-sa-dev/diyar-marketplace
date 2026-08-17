import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bookmark,
  Share2,
  Star,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Palette,
  Box,
  CheckCircle,
  Store,
  Truck,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  X,
  Heart,
} from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import { ProductReviewsSection } from '../components/product/ProductReviewsSection.tsx';
import { AuthPromptModal } from '../components/product/AuthPromptModal.tsx';
import { ProductShareSheet } from '../components/product/ProductShareSheet.tsx';
import { StarRating } from '../components/product/StarRating.tsx';
import { useProduct } from '../hooks/catalog/useCatalog.ts';
import { useProductEngagementMutations } from '../hooks/catalog/useProductEngagement.ts';
import { useCart } from '../hooks/cart/useCart.ts';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import {
  availabilityLabel,
  availabilityTone,
  formatDimension,
  mapProductCard,
  productTypeLabel,
} from '../lib/catalogMappers.ts';
import { formatMaterialLines } from '../lib/formatMaterials.ts';
import { isValidStoreSlug, storePath } from '../lib/storePath.ts';
import { resolveMediaUrl } from '../lib/media.ts';
import { vendorButtonClass } from '../lib/vendorProductValidation.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { EmptyState } from '../components/common/EmptyState.tsx';
import { isApiErrorDetail, isNotFound, parseApiError } from '../utils/errors.ts';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { t, dir } = useLocale();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { like, wishlist } = useProductEngagementMutations(id);
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [cartAddedFlash, setCartAddedFlash] = useState(false);

  useEffect(() => {
    if (!product) {
      return;
    }
    setActiveImage(0);
    setSelectedColor(0);
    setQuantity(1);
    setLikesCount(product.likes_count ?? 0);
    if (isAuthenticated) {
      setIsFavorite(Boolean(product.user_saved));
      setIsLiked(Boolean(product.user_liked));
    } else {
      setIsFavorite(false);
      setIsLiked(false);
    }
  }, [
    product?.id,
    product?.user_saved,
    product?.user_liked,
    product?.likes_count,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (id) {
      void refetch();
    }
  }, [isAuthenticated, id, refetch]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!isAuthenticated) {
        setAuthOpen(true);
        return;
      }
      action();
    },
    [isAuthenticated],
  );

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleToggleLike = () => {
    requireAuth(async () => {
      try {
        const result = await like.mutateAsync();
        setIsLiked(result.liked);
        setLikesCount(result.likes_count);
      } catch {
        toast.error(t('catalog.productDetail.reviewError'));
      }
    });
  };

  const handleToggleSave = () => {
    requireAuth(async () => {
      try {
        const result = await wishlist.mutateAsync();
        setIsFavorite(result.saved);
      } catch {
        toast.error(t('catalog.productDetail.reviewError'));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <LoadingState className="min-h-80" />
      </div>
    );
  }

  if (isError) {
    if (isApiErrorDetail(error) && isNotFound(error)) {
      return (
        <div className="min-h-screen bg-gray-50 pt-20">
          <EmptyState
            title={t('catalog.productDetail.notFoundTitle')}
            description={t('catalog.productDetail.notFoundDescription')}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <ErrorState error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <EmptyState
          title={t('catalog.productDetail.notFoundTitle')}
          description={t('catalog.productDetail.notFoundDescription')}
        />
      </div>
    );
  }

  const salePrice = Number(product.sale_price);
  const comparePrice = product.compare_price != null ? Number(product.compare_price) : undefined;
  const oldPrice = comparePrice && comparePrice > salePrice ? comparePrice : undefined;
  const discountPct =
    oldPrice != null ? Math.round(((oldPrice - salePrice) / oldPrice) * 100) : null;
  const images =
    product.images && product.images.length > 0
      ? [...product.images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => resolveMediaUrl(img.url) ?? PLACEHOLDER_IMAGE)
      : [PLACEHOLDER_IMAGE];
  const colors = product.colors?.map((color) => ({ name: color.name, hex: color.hex_code })) ?? [];
  const availableQty = product.inventory?.available_quantity ?? 0;
  const availabilityLabels = {
    preorder: t('catalog.product.preorder'),
    outOfStock: t('catalog.product.unavailable'),
    limited: t('catalog.product.limitedStock'),
    inStock: t('catalog.product.inStock'),
  };
  const availability = availabilityLabel(
    product.availability_mode,
    availableQty,
    availabilityLabels,
  );
  const stockTone = availabilityTone(product.availability_mode, availableQty);
  const canPurchase =
    product.availability_mode === 'preorder' ||
    (product.availability_mode === 'in_stock' && availableQty > 0);
  const maxQuantity =
    product.availability_mode === 'preorder' ? 99 : Math.max(availableQty, 1);
  const productType = productTypeLabel(product.product_type);
  const materialLines = formatMaterialLines(product.materials, {
    main: t('catalog.productDetail.materialStructure'),
    fabric: t('catalog.productDetail.materialFabric'),
    filling: t('catalog.productDetail.materialFilling'),
  });
  const similarProducts = product.related_products?.map(mapProductCard) ?? [];
  const categoryLabel = product.category?.name ?? t('catalog.search.products');
  const categorySlug = product.category?.slug ?? 'all';
  const vendorName = product.vendor?.store_name ?? t('catalog.product.defaultStore');
  const vendorSlug = isValidStoreSlug(product.vendor?.slug) ? product.vendor?.slug : null;
  const vendorStorePath = storePath(vendorSlug);
  const rating = product.rating_avg ?? 0;
  const reviewsCount = product.reviews_count ?? 0;
  const description = product.description ?? t('catalog.productDetail.noDescription');
  const warrantyText = product.warranty ?? t('catalog.productDetail.defaultWarranty');
  const currency = t('vendor.products.table.currency');

  const setQuantitySafe = (next: number) => {
    if (!canPurchase) {
      return;
    }
    const clamped = Math.min(Math.max(1, next), maxQuantity);
    setQuantity(clamped);
  };

  const handleAddToCart = () => {
    if (!product.id || !canPurchase) {
      return;
    }

    const selected = colors[selectedColor];

    addItem(
      product.id,
      quantity,
      selected ? { name: selected.name, hex_code: selected.hex } : null,
      {
        name: product.name,
        sale_price: product.sale_price,
        slug: product.slug,
        image_url: images[0] ?? null,
        availability_mode: product.availability_mode,
        vendor: product.vendor
          ? { store_name: product.vendor.store_name, slug: product.vendor.slug }
          : null,
        inventory: product.inventory ? { available_quantity: availableQty } : null,
      },
    );
    toast.success(t('cart.added'));
    setCartAddedFlash(true);
    setQuantity(1);
    window.setTimeout(() => setCartAddedFlash(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 pt-20" dir={dir}>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-diyar-brown cursor-pointer">
            {t('catalog.productDetail.home')}
          </Link>
          <ChevronRight size={14} className="mx-1" />
          <Link to={`/category/${categorySlug}`} className="hover:text-diyar-brown cursor-pointer">
            {categoryLabel}
          </Link>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-diyar-dark font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="lg:w-1/2 flex flex-col gap-4">
            <div
              className="relative aspect-square md:aspect-4/3 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={images[activeImage]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {discountPct != null && discountPct > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {t('catalog.productDetail.discount', { percent: discountPct })}
                  </span>
                )}
              </div>
              <div
                className="absolute top-4 left-4 flex flex-col gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`${vendorButtonClass} bg-white/80 backdrop-blur text-gray-500 hover:text-diyar-brown p-2.5 rounded-full shadow-sm`}
                  title={t('catalog.productDetail.save')}
                >
                  <Bookmark
                    size={20}
                    fill={isFavorite ? 'currentColor' : 'none'}
                    className={isFavorite ? 'text-diyar-brown' : ''}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className={`${vendorButtonClass} bg-white/80 backdrop-blur text-gray-500 hover:text-diyar-dark p-2.5 rounded-full shadow-sm`}
                  title={t('catalog.productDetail.share')}
                >
                  <Share2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`${vendorButtonClass} bg-white/80 backdrop-blur text-gray-500 hover:text-red-500 p-2.5 rounded-full shadow-sm relative`}
                  title={t('catalog.productDetail.like')}
                >
                  <Heart
                    size={20}
                    fill={isLiked ? 'currentColor' : 'none'}
                    className={`transition-all ${isLiked ? 'text-red-500 scale-110' : 'hover:scale-110'}`}
                  />
                  {likesCount > 0 && (
                    <span className="absolute -bottom-1 -left-1 bg-diyar-dark text-white text-[9px] font-bold px-1 rounded-full border border-white tabular-nums">
                      {likesCount}
                    </span>
                  )}
                </button>
              </div>
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 w-max max-w-[90%]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className={`${vendorButtonClass} bg-diyar-dark/90 backdrop-blur text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium hover:bg-black shadow-lg`}
                >
                  <Sparkles size={16} className="text-yellow-400 shrink-0 inline mr-1" />
                  <span className="hidden sm:inline">{t('catalog.productDetail.tryInRoomShort')} </span>
                  {t('catalog.productDetail.tryInRoom')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 snap-start transition-all border-2 cursor-pointer ${
                    activeImage === idx
                      ? 'border-diyar-brown shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col">
            <div className="mb-6">
              <span className="text-sm font-medium text-diyar-brown bg-diyar-brown/10 px-3 py-1 rounded-full">
                {categoryLabel}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-diyar-dark mb-4 leading-snug mt-3">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <StarRating value={rating} readOnly size={18} />
                  <span className="font-bold text-diyar-dark tabular-nums">{rating.toFixed(1)}</span>
                  <span className="text-gray-400">
                    {t('catalog.productDetail.reviews', { count: reviewsCount })}
                  </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <div
                  className={`flex items-center gap-1.5 font-bold ${
                    stockTone === 'in_stock' || stockTone === 'preorder'
                      ? stockTone === 'preorder'
                        ? 'text-blue-600'
                        : 'text-green-600'
                      : stockTone === 'limited'
                        ? 'text-orange-500'
                        : 'text-red-500'
                  }`}
                >
                  {stockTone === 'limited' ? (
                    <AlertCircle size={16} />
                  ) : stockTone === 'out' ? (
                    <AlertCircle size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {availability}
                </div>
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-bold text-diyar-dark tabular-nums">
                  {salePrice}
                </span>
                <span className="text-xl font-bold text-diyar-dark mb-1">{currency}</span>
                {oldPrice && (
                  <span className="text-lg text-gray-400 line-through mb-1 tabular-nums">
                    {oldPrice} {currency}
                  </span>
                )}
              </div>

              {vendorStorePath ? (
                <Link
                  to={vendorStorePath}
                  className="flex items-center justify-between p-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl hover:border-diyar-brown/30 hover:shadow-sm transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-400 group-hover:text-diyar-brown transition-colors">
                      <Store size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-0.5">
                        {t('catalog.productDetail.providedBy')}
                      </p>
                      <p className="text-sm font-bold text-diyar-dark">{vendorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-diyar-brown bg-diyar-brown/10 px-3 py-1.5 rounded-full">
                    {t('catalog.productDetail.visitStore')}
                    <ChevronLeft size={14} />
                  </div>
                </Link>
              ) : null}
            </div>

            {colors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-diyar-dark mb-3 flex items-center gap-2">
                  <Palette size={18} /> {t('catalog.productDetail.colors')}
                  <span className="font-normal text-gray-500">{colors[selectedColor]?.name}</span>
                </h3>
                <div className="flex gap-3">
                  {colors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(idx)}
                      className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all cursor-pointer ${
                        selectedColor === idx
                          ? 'border-diyar-brown scale-110 shadow-md'
                          : 'border-transparent'
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-full border border-black/10"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <Ruler size={18} /> {t('catalog.productDetail.dimensionsTitle')}
              </h3>
              <div className="flex gap-4">
                {[
                  ['height', product.dimensions.height],
                  ['width', product.dimensions.width],
                  ['depth', product.dimensions.depth],
                ].map(([key, value]) => (
                  <div
                    key={key as string}
                    className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                  >
                    <span className="block text-xs text-gray-500 mb-1">
                      {t(`catalog.productDetail.${key as 'height' | 'width' | 'depth'}`)}
                    </span>
                    <span className="font-bold text-diyar-dark tabular-nums" dir="ltr">
                      {formatDimension(value as string | number | null)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {materialLines.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-diyar-dark mb-3 flex items-center gap-2">
                  <Box size={18} /> {t('catalog.productDetail.materialsTitle')}
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {materialLines.map((line) => (
                    <li key={line.key} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <span>
                        {line.label ? (
                          <>
                            {line.label}:{' '}
                            <span className="font-semibold text-diyar-dark">{line.value}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-diyar-dark">{line.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 md:relative md:p-0 md:border-0 md:bg-transparent flex items-center gap-4">
              <div
                className={`flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-13 ${
                  !canPurchase ? 'opacity-50 pointer-events-none select-none' : ''
                }`}
              >
                <button
                  type="button"
                  disabled={!canPurchase}
                  onClick={() => setQuantitySafe(quantity - 1)}
                  className={`${vendorButtonClass} text-gray-500 hover:text-diyar-brown text-xl w-6 disabled:cursor-not-allowed`}
                >
                  -
                </button>
                <span className="font-bold text-diyar-dark w-8 text-center tabular-nums">{quantity}</span>
                <button
                  type="button"
                  disabled={!canPurchase || quantity >= maxQuantity}
                  onClick={() => setQuantitySafe(quantity + 1)}
                  className={`${vendorButtonClass} text-gray-500 hover:text-diyar-brown text-xl w-6 disabled:cursor-not-allowed`}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={!canPurchase}
                onClick={handleAddToCart}
                className={`${vendorButtonClass} flex-1 font-bold h-13 rounded-xl gap-2 shadow-lg shadow-black/10 ${
                  canPurchase
                    ? cartAddedFlash
                      ? 'bg-green-700 text-white cursor-pointer'
                      : 'bg-diyar-dark text-white hover:bg-black cursor-pointer'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {cartAddedFlash ? <CheckCircle size={20} /> : <ShoppingCart size={20} />}
                {canPurchase
                  ? cartAddedFlash
                    ? t('cart.added')
                    : product.availability_mode === 'preorder'
                      ? `${t('catalog.productDetail.preorder')} • ${salePrice * quantity} ${currency}`
                      : `${t('catalog.productDetail.addToCart')} • ${salePrice * quantity} ${currency}`
                  : t('catalog.productDetail.unavailable')}
              </button>
            </div>
            <div className="h-4 md:hidden" />
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-b border-gray-100 py-10 md:py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-xl md:text-2xl font-bold text-diyar-dark mb-4">
                {t('catalog.productDetail.descriptionTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-3xl">{description}</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-diyar-dark">{t('catalog.productDetail.warrantyTitle')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{warrantyText}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-diyar-dark">{t('catalog.productDetail.deliveryTitle')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t('catalog.productDetail.deliveryHint')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductReviewsSection productId={product.id} />

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-xl md:text-3xl font-bold text-diyar-dark mb-8">
          {t('catalog.productDetail.similarTitle')}
        </h2>
        {similarProducts.length > 0 ? (
          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x pt-2 -mt-2 px-2 -mx-2 md:px-0 md:mx-0">
            {similarProducts.map((p) => (
              <div key={p.id} className="min-w-50 md:min-w-60 snap-start shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{t('catalog.search.noResults')}</p>
        )}
      </div>

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className={`${vendorButtonClass} absolute top-4 right-4 bg-white text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10`}
            >
              <X size={20} />
            </button>
            <div className="p-6 md:p-8 text-center bg-diyar-dark text-white">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold mb-2">{t('catalog.productDetail.tryInRoomShort')}</h3>
            </div>
          </div>
        </div>
      )}

      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-200 flex flex-col justify-center animate-in fade-in duration-300">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(false)}
            className={`${vendorButtonClass} absolute top-6 right-6 text-white hover:text-gray-300 bg-white/10 backdrop-blur-md p-2 rounded-full z-10`}
          >
            <X size={24} />
          </button>
          <div className="relative w-full max-w-5xl mx-auto p-4 md:p-12">
            <div className="aspect-4/3 md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-y-0 left-4 md:left-8 flex items-center">
              <button
                type="button"
                onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                className={`${vendorButtonClass} w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white`}
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
              <button
                type="button"
                onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                className={`${vendorButtonClass} w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3 px-4 overflow-x-auto scrollbar-hide pb-4">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImage === i ? 'border-diyar-brown scale-105 shadow-lg' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ProductShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={window.location.href}
        title={product.name}
      />

      <AuthPromptModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
