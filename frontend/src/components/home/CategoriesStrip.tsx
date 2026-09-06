import React, { useRef, useState } from 'react';
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
import { staticAsset } from '../../lib/media/pictureSources.ts';
import { RailControls } from './sections/HorizontalRail.tsx';

type Cat = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  img?: string;
};

const PRODUCTS: Cat[] = [
  {
    id: 'bedroom',
    name: 'غرف النوم',
    icon: BedDouble,
    img: '/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.webp',
  },
  {
    id: 'living-room',
    name: 'الصالونات',
    icon: Sofa,
    img: '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.webp',
  },
  {
    id: 'kitchen',
    name: 'المطابخ',
    icon: CookingPot,
    img: '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.webp',
  },
  { id: 'dining', name: 'غرف الطعام', icon: UtensilsCrossed, img: '/categories/غرف الطعام.webp' },
  {
    id: 'office',
    name: 'المكاتب',
    icon: MonitorSmartphone,
    img: '/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.webp',
  },
  {
    id: 'decor',
    name: 'ديكورات',
    icon: PackageSearch,
    img: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.webp',
  },
  { id: 'lighting', name: 'الإضاءة', icon: Lamp, img: '/categories/الإضاءة.webp' },
  { id: 'curtains', name: 'الستائر', icon: Blinds, img: '/categories/الستائر.webp' },
  { id: 'outdoor', name: 'أثاث خارجي', icon: Trees, img: '/categories/أثاث خارجي.webp' },
  { id: 'bathroom', name: 'الحمامات', icon: Bath, img: '/categories/الحمامات.webp' },
];

const SERVICES: Cat[] = [
  {
    id: 'interior-design',
    name: 'تصميم داخلي',
    icon: Paintbrush,
    img: '/categories/تصميم داخلي.webp',
  },
  { id: 'maintenance', name: 'تركيب وصيانة', icon: Wrench, img: '/categories/تركيب وصيانة.webp' },
  { id: 'painting', name: 'دهانات', icon: PaintRoller, img: '/categories/دهانات.webp' },
  { id: 'upholstery', name: 'تنجيد وتجديد', icon: Armchair, img: '/categories/تنجيد وتجديد.webp' },
  { id: 'carpentry', name: 'نجارة مخصصة', icon: Hammer, img: '/categories/نجارة مخصصة.webp' },
  {
    id: 'consultation',
    name: 'استشارات تصميم',
    icon: Lightbulb,
    img: '/categories/استشارات تصميم.webp',
  },
  { id: 'moving', name: 'نقل وتغليف', icon: Truck, img: '/categories/نقل وتغليف.webp' },
  { id: 'cleaning', name: 'تنظيف وتلميع', icon: SprayCan, img: '/categories/تنظيف وتلميع.webp' },
  { id: 'electrical', name: 'إضاءة وكهرباء', icon: Zap, img: '/categories/إضاءة وكهرباء.webp' },
  {
    id: 'curtains-install',
    name: 'تركيب الستائر',
    icon: Blinds,
    img: '/categories/تركيب الستائر.webp',
  },
];

const STATIC_ICON_BY_SLUG = Object.fromEntries(PRODUCTS.map((cat) => [cat.id, cat.icon])) as Record<
  string,
  Cat['icon']
>;

const STATIC_IMG_BY_SLUG = Object.fromEntries(
  PRODUCTS.filter((cat) => cat.img).map((cat) => [cat.id, cat.img]),
) as Record<string, string>;

const SERVICE_ICON_BY_SLUG = Object.fromEntries(
  SERVICES.map((cat) => [cat.id, cat.icon]),
) as Record<string, Cat['icon']>;

const SERVICE_STATIC_IMG_BY_SLUG = Object.fromEntries(
  SERVICES.filter((cat) => cat.img).map((cat) => [cat.id, cat.img]),
) as Record<string, string>;

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
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const tileBg =
    accent === 'service' ? 'bg-diyar-brown text-diyar-cream' : 'bg-diyar-cream text-diyar-dark';

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
          <Link
            to={`/category/${cat.id}`}
            key={cat.id}
            className="flex flex-col items-center cursor-pointer group snap-start shrink-0 w-24 sm:w-28 md:w-32"
          >
            <div
              className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl mb-3 overflow-hidden transition duration-300 group-hover:-translate-y-2 group-hover:shadow-md flex items-center justify-center ${tileBg}`}
            >
              {cat.img && (
                <img
                  src={staticAsset(cat.img)}
                  alt={cat.name}
                  width={128}
                  height={128}
                  decoding="async"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover absolute inset-0"
                  onLoad={() => setLoaded((prev) => ({ ...prev, [cat.id]: true }))}
                  onError={() => setLoaded((prev) => ({ ...prev, [cat.id]: false }))}
                />
              )}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-inherit ${cat.img && loaded[cat.id] ? 'opacity-0' : 'opacity-100'}`}
              >
                <cat.icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
            </div>
            <span className="font-medium text-diyar-dark group-hover:text-diyar-brown transition text-xs md:text-sm text-center leading-snug">
              {cat.name}
            </span>
          </Link>
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
      ? PRODUCTS
      : productCategories.map((cat) => ({
          id: cat.slug,
          name: cat.name,
          icon: STATIC_ICON_BY_SLUG[cat.slug] ?? PackageSearch,
          img: STATIC_IMG_BY_SLUG[cat.slug],
        }));

  const serviceItems: Cat[] =
    servicesLoading || !serviceCategories?.length
      ? SERVICES
      : serviceCategories.map((cat) => ({
          id: cat.slug,
          name: cat.name,
          icon: SERVICE_ICON_BY_SLUG[cat.slug] ?? Paintbrush,
          img: SERVICE_STATIC_IMG_BY_SLUG[cat.slug] ?? STATIC_IMG_BY_SLUG[cat.slug],
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
