import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble, Sofa, CookingPot, MonitorSmartphone, PackageSearch, Lamp, Blinds,
  UtensilsCrossed, Trees, Bath, Paintbrush, Wrench, PaintRoller, Truck,
  Armchair, Hammer, Lightbulb, SprayCan, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';

type Cat = { id: string; name: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; img?: string };

const PRODUCTS: Cat[] = [
  { id: 'bedroom', name: 'غرف النوم', icon: BedDouble, img: '/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png' },
  { id: 'living-room', name: 'الصالونات', icon: Sofa, img: '/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png' },
  { id: 'kitchen', name: 'المطابخ', icon: CookingPot, img: '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png' },
  { id: 'dining', name: 'غرف الطعام', icon: UtensilsCrossed, img: '/categories/غرف الطعام.png' },
  { id: 'office', name: 'المكاتب', icon: MonitorSmartphone, img: '/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png' },
  { id: 'decor', name: 'ديكورات', icon: PackageSearch, img: '/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png' },
  { id: 'lighting', name: 'الإضاءة', icon: Lamp, img: '/categories/الإضاءة.png' },
  { id: 'curtains', name: 'الستائر', icon: Blinds, img: '/categories/الستائر.png' },
  { id: 'outdoor', name: 'أثاث خارجي', icon: Trees, img: '/categories/أثاث خارجي.png' },
  { id: 'bathroom', name: 'الحمامات', icon: Bath, img: '/categories/الحمامات.png' },
];

const SERVICES: Cat[] = [
  { id: 'interior-design', name: 'تصميم داخلي', icon: Paintbrush, img: '/categories/تصميم داخلي.png' },
  { id: 'maintenance', name: 'تركيب وصيانة', icon: Wrench, img: '/categories/تركيب وصيانة.png' },
  { id: 'painting', name: 'دهانات', icon: PaintRoller, img: '/categories/دهانات.png' },
  { id: 'upholstery', name: 'تنجيد وتجديد', icon: Armchair, img: '/categories/تنجيد وتجديد.png' },
  { id: 'carpentry', name: 'نجارة مخصصة', icon: Hammer, img: '/categories/نجارة مخصصة.png' },
  { id: 'consultation', name: 'استشارات تصميم', icon: Lightbulb, img: '/categories/استشارات تصميم.png' },
  { id: 'moving', name: 'نقل وتغليف', icon: Truck, img: '/categories/نقل وتغليف.png' },
  { id: 'cleaning', name: 'تنظيف وتلميع', icon: SprayCan, img: '/categories/تنظيف وتلميع.png' },
  { id: 'electrical', name: 'إضاءة وكهرباء', icon: Zap, img: '/categories/إضاءة وكهرباء.png' },
  { id: 'curtains-install', name: 'تركيب الستائر', icon: Blinds, img: '/categories/تركيب الستائر.png' },
];

function CategoryRow({ title, items, accent }: { title: string; items: Cat[]; accent: 'product' | 'service' }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const scroll = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const tileBg = accent === 'service'
    ? 'bg-diyar-brown text-diyar-cream'
    : 'bg-diyar-cream text-diyar-dark';

  return (
    <div className="mb-8 md:mb-10 last:mb-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg md:text-xl font-bold text-diyar-dark">{title}</h2>
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll(1)} aria-label="السابق" className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-diyar-dark hover:border-diyar-brown transition-colors">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => scroll(-1)} aria-label="التالي" className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-diyar-dark hover:border-diyar-brown transition-colors">
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      <div ref={scroller} className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x scroll-smooth py-2 -my-2 px-1 -mx-1">
        {items.map((cat) => (
          <Link to={`/category/${cat.id}`} key={cat.id} className="flex flex-col items-center cursor-pointer group snap-start shrink-0 w-24 sm:w-28 md:w-32">
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl mb-3 overflow-hidden transition duration-300 group-hover:-translate-y-2 group-hover:shadow-md flex items-center justify-center ${tileBg}`}>
              <img
                src={cat.img}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${loaded[cat.id] ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(prev => ({ ...prev, [cat.id]: true }))}
                onError={() => setLoaded(prev => ({ ...prev, [cat.id]: false }))}
              />
              <div className={`absolute inset-0 flex items-center justify-center bg-inherit transition-opacity duration-300 ${loaded[cat.id] ? 'opacity-0' : 'opacity-100'}`}>
                <cat.icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
            </div>
            <span className="font-medium text-diyar-dark group-hover:text-diyar-brown transition text-xs md:text-sm text-center leading-snug">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CategoriesStrip() {
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <CategoryRow title="تصفّح الأقسام" items={PRODUCTS} accent="product" />
      <CategoryRow title="خدمات ديار" items={SERVICES} accent="service" />
    </div>
  );
}
