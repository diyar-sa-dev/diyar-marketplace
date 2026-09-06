import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../../hooks/catalog/useCatalog.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import {
  HOME_ROOM_SLUGS,
  categoryImageForSlug,
  categoryHref,
  resolveHomeCategoryLabel,
} from '../../../lib/homeCategoryAssets.ts';

export function ShopByRoom() {
  const { t, dir } = useLocale();
  const { data: categories = [] } = useCategories('product');

  const roomCards = HOME_ROOM_SLUGS.map((slug) => {
    const fromApi = categories.find((category) => category.slug === slug);
    return {
      slug,
      name: resolveHomeCategoryLabel(slug, t, fromApi?.name),
      img: categoryImageForSlug(slug),
    };
  });

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4" dir={dir}>
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-4xl font-sans font-bold text-diyar-dark mb-4">
          {t('home.shopByRoom.title')}
        </h2>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">
          {t('home.shopByRoom.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {roomCards.map((room) => (
          <RoomCard key={room.slug} room={room} shopNowLabel={t('home.shopByRoom.shopNow')} />
        ))}
      </div>
    </div>
  );
}

function RoomCard({
  room,
  shopNowLabel,
}: {
  room: { slug: string; name: string; img: string };
  shopNowLabel: string;
}) {
  const [imgSrc, setImgSrc] = useState(room.img);

  return (
    <Link
      to={categoryHref(room.slug)}
      className="group h-44 md:h-56 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
    >
      <img
        src={imgSrc}
        alt={room.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        onError={() => {
          setImgSrc((current) =>
            current.includes('unsplash.com')
              ? current
              : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
          );
        }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-diyar-dark/85 via-black/25 to-transparent" />
      <div className="absolute bottom-4 md:bottom-5 inset-x-3 text-white text-center">
        <h3 className="text-sm md:text-lg font-bold font-sans mb-1 md:mb-2 line-clamp-2">{room.name}</h3>
        <span className="text-[10px] md:text-xs border border-white/35 px-2.5 md:px-3 py-1 rounded-full backdrop-blur-sm inline-block group-hover:bg-white/10 transition-colors">
          {shopNowLabel}
        </span>
      </div>
    </Link>
  );
}
