import React from 'react';
import ProductCard from '../cards/ProductCard.tsx';
import { ProductCardSkeleton } from '../cards/ProductCardSkeleton.tsx';
import { useProducts } from '../../hooks/catalog/useCatalog.ts';
import { mapProductCard } from '../../lib/catalogMappers.ts';
import type { ProductListFilters } from '../../types/catalog.ts';

interface ProductRailProps {
  title?: string;
  filters?: ProductListFilters;
  layout?: 'grid' | 'list';
  className?: string;
}

export default function ProductRail({
  title,
  filters = { per_page: 8 },
  layout = 'grid',
  className = '',
}: ProductRailProps) {
  const { data, isLoading, isError } = useProducts(filters);

  if (isLoading) {
    return (
      <section className={className}>
        {title && <h2 className="text-xl font-bold mb-4 text-diyar-dark">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data?.items?.length) {
    return null;
  }

  const products = data.items.map(mapProductCard);

  return (
    <section className={className}>
      {title && <h2 className="text-xl font-bold mb-4 text-diyar-dark">{title}</h2>}
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4'
            : 'flex flex-col gap-3'
        }
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} layout={layout} />
        ))}
      </div>
    </section>
  );
}
