import React from 'react';
import { Tag, Edit, Trash2, Eye } from 'lucide-react';
import type { ProductCard } from '../../../types/catalog.ts';
import { resolveMediaUrl } from '../../../lib/media.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { stockStatus } from '../../../lib/stockStatus.ts';
import { vendorActionButtonClass } from '../../../lib/vendorProductValidation.ts';

export interface VendorProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

export function mapToVendorProductRow(product: ProductCard): VendorProductRow {
  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? '—',
    price: Number(product.sale_price),
    stock: product.inventory?.available_quantity ?? 0,
    imageUrl: product.image_url,
  };
}

interface VendorProductsTableProps {
  products: VendorProductRow[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function VendorProductsTable({
  products,
  onView,
  onEdit,
  onArchive,
  canEdit = true,
  canDelete = true,
}: VendorProductsTableProps) {
  const { t } = useLocale();
  const currency = t('vendor.products.table.currency');

  return (
    <div className="bg-white border rounded-2xl border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-linear-to-l from-gray-50 to-white text-gray-600 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold text-right">
                {t('vendor.products.table.product')}
              </th>
              <th className="px-6 py-4 font-bold text-right">
                {t('vendor.products.table.category')}
              </th>
              <th className="px-6 py-4 font-bold text-right">{t('vendor.products.table.price')}</th>
              <th className="px-6 py-4 font-bold text-right">{t('vendor.products.table.stock')}</th>
              <th className="px-6 py-4 font-bold text-left">
                {t('vendor.products.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product, index) => {
              const img = resolveMediaUrl(product.imageUrl);
              return (
                <tr
                  key={product.id}
                  className={`group transition-colors duration-200 cursor-default ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  } hover:bg-amber-50/70 hover:shadow-[inset_3px_0_0_0_#A67B5B]`}
                >
                  <td className="px-6 py-4 font-bold text-diyar-dark">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden shrink-0 ring-1 ring-gray-100 group-hover:ring-diyar-brown/20 transition-all">
                        {img ? (
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tag size={16} />
                        )}
                      </div>
                      <span className="group-hover:text-diyar-brown transition-colors line-clamp-1">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-diyar-brown tabular-nums">
                    {product.price} {currency}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const status = stockStatus(product.stock);
                      if (status === 'out_of_stock') {
                        return (
                          <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                            {t('vendor.products.table.outOfStock')}
                          </span>
                        );
                      }
                      if (status === 'limited') {
                        return (
                          <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200">
                            {t('vendor.products.table.limitedStock', { count: product.stock })}
                          </span>
                        );
                      }
                      return (
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                          {t('vendor.products.table.inStock', { count: product.stock })}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onView(product.id)}
                        className={vendorActionButtonClass('view')}
                        title={t('vendor.products.table.view')}
                      >
                        <Eye size={16} />
                      </button>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(product.id)}
                          className={vendorActionButtonClass('edit')}
                          title={t('vendor.products.table.edit')}
                        >
                          <Edit size={16} />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => onArchive(product.id)}
                          className={vendorActionButtonClass('delete')}
                          title={t('vendor.products.table.archive')}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">{t('vendor.products.table.empty')}</div>
        )}
      </div>
    </div>
  );
}
