import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Sofa,
  CookingPot,
  MonitorSmartphone,
  PackageSearch,
  Lamp,
  Blinds,
  UtensilsCrossed,
  Trees,
  Bath,
  Paintbrush,
  Wrench,
  PaintRoller,
  Truck,
  Armchair,
  Hammer,
  Lightbulb,
  SprayCan,
  Zap,
} from 'lucide-react';
import { useCategories } from '../../hooks/catalog/useCatalog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  PRODUCT_CATEGORY_WEBP,
  SERVICE_CATEGORY_WEBP,
  resolveCategoryImageUrl,
  resolveHomeCategoryLabel,
} from '../../lib/homeCategoryAssets.ts';
import { RailControls } from './sections/HorizontalRail.tsx';

type CategoryIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type Cat = {
  id: string;
  name: string;
  icon: CategoryIcon;
  imageUrl?: string;
};

const PRODUCT_ICON_BY_SLUG: Record<string, CategoryIcon> = {
  bedroom: BedDouble,
  'living-room': Sofa,
  kitchen: CookingPot,
  dining: UtensilsCrossed,
  office: MonitorSmartphone,
  decor: PackageSearch,
  lighting: Lamp,
  curtains: Blinds,
  outdoor: Trees,
  bathroom: Bath,
};

const SERVICE_ICON_BY_SLUG: Record<string, CategoryIcon> = {
  'interior-design': Paintbrush,
  maintenance: Wrench,
  painting: PaintRoller,
  upholstery: Armchair,
  carpentry: Hammer,
  consultation: Lightbulb,
  moving: Truck,
  cleaning: SprayCan,
  electrical: Zap,
  'curtains-install': Blinds,
};

const SERVICE_FALLBACK_NAMES: Record<string, string> = {
  'interior-design': 'تصميم داخلي',
  maintenance: 'تركيب وصيانة',
  painting: 'دهانات',
  upholstery: 'تنجيد وتجديد',
  carpentry: 'نجارة مخصصة',
  consultation: 'استشارات تصميم',
  moving: 'نقل وتغليف',
  cleaning: 'تنظيف وتلميع',
  electrical: 'إضاءة وكهرباء',
  'curtains-install': 'تركيب الستائر',
};

function fallbackProductCategories(t: (key: string) => string): Cat[] {
  return Object.keys(PRODUCT_CATEGORY_WEBP).map((slug) => ({
    id: slug,
    name: resolveHomeCategoryLabel(slug, t),
    icon: PRODUCT_ICON_BY_SLUG[slug] ?? PackageSearch,
    imageUrl: resolveCategoryImageUrl(slug, null, 'product'),
  }));
}

function fallbackServiceCategories(): Cat[] {
  return Object.keys(SERVICE_CATEGORY_WEBP).map((slug) => ({
    id: slug,
    name: SERVICE_FALLBACK_NAMES[slug] ?? slug,
    icon: SERVICE_ICON_BY_SLUG[slug] ?? Paintbrush,
    imageUrl: resolveCategoryImageUrl(slug, null, 'service'),
  }));
}

function CategoryTile({
  cat,
  accent,
}: {
  cat: Cat;
  accent: 'product' | 'service';
}) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(!cat.imageUrl);
  const showIcon = !cat.imageUrl || imageFailed || !imageLoaded;

  useEffect(() => {
    if (!cat.imageUrl) {
      return;
    }

    const node = tileRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cat.imageUrl]);

  const tileBg =
    accent === 'service' ? 'bg-diyar-brown text-diyar-cream' : 'bg-diyar-cream text-diyar-dark';

  return (
    <Link
      to={`/category/${cat.id}`}
      className="flex flex-col items-center cursor-pointer group snap-start shrink-0 w-24 sm:w-28 md:w-32"
    >
      <div
        ref={tileRef}
        className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl mb-3 overflow-hidden transition duration-300 group-hover:-translate-y-2 group-hover:shadow-md flex items-center justify-center ${tileBg}`}
      >
        {cat.imageUrl && shouldLoadImage && !imageFailed ? (
          <img
            src={cat.imageUrl}
            alt=""
            width={128}
            height={128}
            decoding="async"
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageFailed(true);
              setImageLoaded(false);
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${showIcon ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden="true"
        >
          <cat.icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
        </div>
      </div>
      <span className="font-medium text-diyar-dark group-hover:text-diyar-brown transition text-xs md:text-sm text-center leading-snug">
        {cat.name}
      </span>
    </Link>
  );
}

function CategoryRow({
  title,
  items,
  accent,
}: {
  title: string;
  items: Cat[];
  accent: 'product' | 'service';
}) {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-8 md:mb-10 last:mb-0">
      <div className="flex items-center justify-between mb-3 px-1 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-diyar-dark min-w-0">{title}</h2>
        <RailControls scroller={scroller} className="shrink-0" />
      </div>

      <div
        ref={scroller}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x scroll-smooth py-2 -my-2 px-1 -mx-1"
      >
        {items.map((cat) => (
          <CategoryTile key={cat.id} cat={cat} accent={accent} />
        ))}
      </div>
    </div>
  );
}

export default function CategoriesStrip() {
  const { t } = useLocale();
  const { data: productCategories, isLoading: productsLoading } = useCategories('product');
  const { data: serviceCategories, isLoading: servicesLoading } = useCategories('service');

  const productItems: Cat[] =
    productsLoading || !productCategories?.length
      ? fallbackProductCategories(t)
      : productCategories.map((cat) => ({
          id: cat.slug,
          name: cat.name,
          icon: PRODUCT_ICON_BY_SLUG[cat.slug] ?? PackageSearch,
          imageUrl: resolveCategoryImageUrl(cat.slug, cat.image_url, 'product'),
        }));

  const serviceItems: Cat[] =
    servicesLoading || !serviceCategories?.length
      ? fallbackServiceCategories()
      : serviceCategories.map((cat) => ({
          id: cat.slug,
          name: cat.name,
          icon: SERVICE_ICON_BY_SLUG[cat.slug] ?? Paintbrush,
          imageUrl: resolveCategoryImageUrl(cat.slug, cat.image_url, 'service'),
        }));

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <CategoryRow
        title={t('home.categoriesStrip.browseCategories')}
        items={productItems}
        accent="product"
      />
      <CategoryRow
        title={t('home.categoriesStrip.diyarServices')}
        items={serviceItems}
        accent="service"
      />
    </div>
  );
}
