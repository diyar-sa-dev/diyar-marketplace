import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCategories } from '../../../hooks/catalog/useCatalog.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import {
  HOME_STYLE_SLUGS,
  categoryHref,
  categoryImageForSlug,
  resolveHomeCategoryLabel,
} from '../../../lib/homeCategoryAssets.ts';

export function StyleFilter() {
  const { t, dir } = useLocale();
  const { data: categories = [] } = useCategories('product');

  const styleCards = HOME_STYLE_SLUGS.map((slug) => {
    const fromApi = categories.find((category) => category.slug === slug);
    return {
      slug,
      name: resolveHomeCategoryLabel(slug, t, fromApi?.name),
      img: categoryImageForSlug(slug),
      featured: slug === 'decor',
    };
  });

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4" dir={dir}>
      <div className="text-center mb-6 md:mb-10">
        <span className="text-diyar-brown text-sm md:text-base font-bold mb-3 block">
          {t('home.styleFilter.badge')}
        </span>
        <h2 className="text-2xl md:text-5xl font-sans font-bold text-diyar-dark">
          {t('home.styleFilter.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-5 md:min-h-150">
        {styleCards.map((style) => (
          <StyleCard
            key={style.slug}
            style={style}
            shopNowLabel={t('home.shopByRoom.shopNow')}
            dir={dir}
          />
        ))}
      </div>
    </div>
  );
}

function StyleCard({
  style,
  shopNowLabel,
  dir,
}: {
  style: { slug: string; name: string; img: string; featured: boolean };
  shopNowLabel: string;
  dir: 'ltr' | 'rtl';
}) {
  const [imgSrc, setImgSrc] = useState(style.img);

  return (
    <Link
      to={categoryHref(style.slug)}
      className={`group rounded-2xl overflow-hidden relative flex flex-col justify-end shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 ${
        style.featured
          ? 'md:col-span-2 md:row-span-2 h-72 sm:h-80 md:h-full min-h-72'
          : 'md:col-span-1 md:row-span-1 h-52 sm:h-56 md:h-full min-h-52'
      }`}
    >
      <img
        src={imgSrc}
        alt={style.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={() => {
          setImgSrc((current) =>
            current.includes('unsplash.com')
              ? current
              : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800',
          );
        }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-diyar-dark/90 via-diyar-dark/25 to-transparent" />
      <div className="relative z-10 p-5 md:p-8">
        <span className="block font-sans font-bold text-xl md:text-3xl text-white mb-2">{style.name}</span>
        <span className="inline-flex items-center gap-1.5 text-white/90 text-xs md:text-sm font-semibold border border-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm group-hover:bg-white/10 transition-colors">
          {shopNowLabel}
          <ArrowLeft size={14} className={dir === 'rtl' ? '' : 'rotate-180'} />
        </span>
      </div>
    </Link>
  );
}
