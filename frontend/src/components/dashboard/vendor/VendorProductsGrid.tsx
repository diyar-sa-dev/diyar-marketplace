import React from 'react';
import { Tag, Edit, Trash2, Eye } from 'lucide-react';
import type { VendorProductRow } from './VendorProductsTable.tsx';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { vendorActionButtonClass } from '../../../lib/vendorProductValidation.ts';

interface VendorProductsGridProps {
  products: VendorProductRow[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

export function VendorProductsGrid({
  products,
  onView,
  onEdit,
  onArchive,
}: VendorProductsGridProps) {
  const { t } = useLocale();
  const currency = t('vendor.products.table.currency');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const img = resolveMediaUrl(product.imageUrl);
        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:border-diyar-brown/20 transition-all duration-200 group"
          >
            <div
              className="aspect-4/3 bg-gray-100 flex items-center justify-center text-gray-300 relative group cursor-pointer"
              onClick={() => onView(product.id)}
              onKeyDown={(e) => e.key === 'Enter' && onView(product.id)}
              role="button"
              tabIndex={0}
            >
              {img ? (
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Tag size={48} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-white text-diyar-dark px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                  <Eye size={16} />
                  {t('vendor.products.table.view')}
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col text-right">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-bold text-diyar-dark line-clamp-2 leading-snug text-right">
                  {product.name}
                </h3>
                <span className="font-bold text-diyar-brown shrink-0">
                  {product.price} {currency}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{product.category}</p>
              <div className="mt-auto flex items-center gap-2 pt-1">
                <div className="flex-1 text-right">
                  {product.stock > 0 ? (
                    <span className="text-green-650 text-xs font-bold flex items-center gap-1 justify-start">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {t('vendor.products.table.inStock', { count: product.stock })}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs font-bold flex items-center gap-1 justify-start">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {t('vendor.products.table.outOfStock')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onView(product.id)}
                  className={vendorActionButtonClass('view')}
                  title={t('vendor.products.table.view')}
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product.id)}
                  className={vendorActionButtonClass('edit')}
                  title={t('vendor.products.table.edit')}
                >
                  <Edit size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onArchive(product.id)}
                  className={vendorActionButtonClass('delete')}
                  title={t('vendor.products.table.archive')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {products.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
          {t('vendor.products.table.empty')}
        </div>
      )}
    </div>
  );
}
