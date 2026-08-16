import React from 'react';
import { ArrowRight, Edit, Trash2, Tag } from 'lucide-react';
import type { ProductDetail } from '../../../types/catalog.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../../lib/vendorProductValidation.ts';
import { LoadingState } from '../../common/LoadingState.tsx';
import { ErrorState } from '../../common/ErrorState.tsx';

function formatMaterials(materials: ProductDetail['materials']): string {
  if (!materials) {
    return '—';
  }
  if (Array.isArray(materials)) {
    return materials.join('، ');
  }
  return Object.values(materials).join('، ');
}

interface VendorProductDetailPanelProps {
  product?: ProductDetail;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

export function VendorProductDetailPanel({
  product,
  isLoading,
  isError,
  error,
  onRetry,
  onBack,
  onEdit,
  onArchive,
}: VendorProductDetailPanelProps) {
  const { t, dir } = useLocale();

  if (isLoading) {
    return <LoadingState className="min-h-80" />;
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <ErrorState
          error={error}
          onRetry={onRetry}
          title={t('vendor.products.detail.loadError')}
          compact
        />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const stock = product.inventory?.available_quantity ?? 0;
  const imageUrl = resolveMediaUrl(product.images?.[0]?.url);
  const width = product.dimensions?.width ?? '—';
  const depth = product.dimensions?.depth ?? '—';
  const height = product.dimensions?.height ?? '—';
  const currency = t('vendor.products.table.currency');

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`${vendorButtonClass} p-2.5 text-gray-500 hover:text-diyar-dark hover:bg-gray-100 border border-transparent hover:border-gray-200`}
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-diyar-dark">{product.name}</h2>
            <p className="text-sm text-gray-400 mt-1 font-sans">{product.category?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onEdit}
            className={`${vendorButtonClass} px-4 py-2.5 text-xs text-diyar-brown bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow`}
          >
            <Edit size={14} />
            {t('vendor.products.detail.editProduct')}
          </button>
          <button
            type="button"
            onClick={onArchive}
            className={`${vendorButtonClass} px-4 py-2.5 text-xs text-white bg-red-500 hover:bg-red-600 border border-red-500 hover:border-red-600 shadow-sm hover:shadow`}
          >
            <Trash2 size={14} />
            {t('vendor.products.detail.archiveProduct')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
            <div className="w-full md:w-48 h-48 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 text-gray-300 ring-1 ring-gray-100">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Tag size={48} />
              )}
            </div>
            <div className="space-y-4 flex-1 text-right">
              <div>
                <h3 className="font-bold text-xl text-diyar-dark mb-2">{product.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {product.description || t('vendor.products.detail.noDescription')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-right hover:border-diyar-brown/20 transition-colors">
                  <span className="text-xs text-gray-400 block mb-1">
                    {t('vendor.products.detail.price')}
                  </span>
                  <span className="font-bold text-diyar-brown text-lg tabular-nums">
                    {Number(product.sale_price)} {currency}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-right font-sans hover:border-green-200 transition-colors">
                  <span className="text-xs text-gray-400 block mb-1">
                    {t('vendor.products.detail.stock')}
                  </span>
                  <span
                    className={`font-bold text-lg tabular-nums ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {stock} {t('vendor.products.detail.pieces')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-right hover:shadow-md transition-shadow">
            <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-3 text-right">
              {t('vendor.products.detail.specsTitle')}
            </h3>
            <div className="space-y-3 font-sans">
              <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right hover:bg-gray-50/50 rounded-lg px-1 transition-colors">
                <span className="text-gray-400 block font-bold text-sm">
                  {t('vendor.products.detail.dimensions')}
                </span>
                <span className="col-span-2 text-diyar-dark font-medium text-sm tabular-nums">
                  {t('vendor.products.detail.dimensionsValue', {
                    width: String(width),
                    depth: String(depth),
                    height: String(height),
                  })}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right hover:bg-gray-50/50 rounded-lg px-1 transition-colors">
                <span className="text-gray-400 block font-bold text-sm">
                  {t('vendor.products.detail.colors')}
                </span>
                <span className="col-span-2 text-diyar-dark font-medium text-sm flex gap-1.5 items-center justify-start flex-wrap">
                  {product.colors?.length
                    ? product.colors.map((col) => (
                        <span
                          key={col.name}
                          className="bg-stone-50 px-2 py-0.5 rounded-lg border text-xs text-stone-600"
                        >
                          {col.name}
                        </span>
                      ))
                    : t('vendor.products.detail.multiColor')}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right hover:bg-gray-50/50 rounded-lg px-1 transition-colors">
                <span className="text-gray-400 block font-bold text-sm">
                  {t('vendor.products.detail.material')}
                </span>
                <span className="col-span-2 text-diyar-dark font-medium text-sm">
                  {formatMaterials(product.materials)}
                </span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-50 text-right hover:bg-gray-50/50 rounded-lg px-1 transition-colors">
                <span className="text-gray-400 block font-bold text-sm">
                  {t('vendor.products.detail.warranty')}
                </span>
                <span className="col-span-2 font-medium text-sm bg-amber-50/50 text-diyar-brown px-3 py-0.5 rounded-lg border border-amber-100/55 w-fit">
                  {product.warranty || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1 text-right">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-right font-sans hover:shadow-md transition-shadow">
            <h3 className="font-bold text-diyar-dark mb-4 border-b border-gray-100 pb-3 text-right">
              {t('vendor.products.detail.salesStats')}
            </h3>
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 text-sm">{t('vendor.products.detail.ordersCount')}</span>
                <span className="font-bold text-diyar-dark tabular-nums">
                  0 {t('vendor.products.detail.ordersUnit')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 text-sm">{t('vendor.products.detail.totalRevenue')}</span>
                <span className="font-bold text-green-600 tabular-nums">0.00 {currency}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 text-sm">{t('vendor.products.detail.returnRate')}</span>
                <span className="font-bold text-diyar-dark tabular-nums">0%</span>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-50/80 to-orange-50/40 rounded-2xl border border-amber-100 p-6 text-right font-sans space-y-3 shadow-sm">
            <h4 className="font-bold text-diyar-dark text-sm">
              {t('vendor.products.detail.inventoryTitle')}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              {t('vendor.products.detail.inventoryHint')}
            </p>
            <button
              type="button"
              onClick={onEdit}
              className={`${vendorButtonClass} w-full bg-diyar-brown text-white hover:bg-[#A67B5B]/90 py-2.5 text-xs shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]`}
            >
              {t('vendor.products.detail.editSpecs')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
