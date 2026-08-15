import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, Filter, LayoutGrid, List, SlidersHorizontal, Star, Search, X, Palette, Wrench } from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';
import ServiceCard from '../components/cards/ServiceCard.tsx';

const CATEGORIES = {
  "bedroom": { name: "غرف النوم", img: "/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png", subcategories: ["أسرة", "خزائن ملابس", "تسريحات", "طاولات جانبية", "مراتب"] },
  "living-room": { name: "الصالونات", img: "/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png", subcategories: ["أطقم كنب", "كراسي استرخاء", "طاولات قهوة", "طاولات تلفزيون", "مكتبات"] },
  "kitchen": { name: "المطابخ", img: "/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png", subcategories: ["خزائن مطابخ", "طاولات طعام", "كراسي طعام", "عربات تقديم"] },
  "office": { name: "المكاتب", img: "/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png", subcategories: ["مكاتب إدارية", "كراسي مكتبية", "وحدات أدراج", "مكتبات مكتبية"] },
  "decor": { name: "ديكورات", img: "/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png", subcategories: ["إضاءة", "سجاد", "لوحات جدارية", "مرايا", "نباتات زينة"] },
  "interior-design": { name: "تصميم داخلي", img: "/categories/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%AF%D8%A7%D8%AE%D9%84%D9%8A.png", subcategories: ["تصميم سكني", "تصميم تجاري", "استشارات", "مخططات معمارية"] },
  "maintenance": { name: "تركيب وصيانة", img: "/categories/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8%20%D9%88%D8%B5%D9%8A%D8%A7%D9%86%D8%A9.png", subcategories: ["تركيب أثاث", "صيانة خشبية", "تنجيد", "دهانات"] },
  "all": { name: "التصنيفات", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1200", subcategories: [] }
};

const MOCK_PRODUCTS = [
  {img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400", name: "أريكة 3 مقاعد مخمل", vendor: "مفروشات الرقي", price: 2400, oldPrice: 3000},
  {img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400", name: "كرسي استرخاء", vendor: "الزاوية الحديثة", price: 850, oldPrice: 1200},
  {img: "https://images.unsplash.com/photo-1540574163026-643ea20d25b5?auto=format&fit=crop&q=80&w=400", name: "طقم غرفة معيشة 5 قطع", vendor: "بيت التصميم", price: 6500, oldPrice: 8500},
  {img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400", name: "طاولة وسط رخام", vendor: "روائع الخشب", price: 1200, oldPrice: 1500},
  {img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400", name: "كرسي جانبي مودرن", vendor: "إضاءات دبي", price: 450, oldPrice: 600},
  {img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400", name: "أريكة زاوية كبيرة", vendor: "مفروشات الرقي", price: 3800, oldPrice: 4200},
  {img: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=400", name: "طاولة جانبي معدنية", vendor: "الزاوية الحديثة", price: 280, oldPrice: 400},
  {img: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&q=80&w=400", name: "كرسي قماش فاخر", vendor: "أناقة المنزل", price: 950, oldPrice: 1300},
];

const MOCK_SERVICES = [
  {id: 101, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400", name: "تصميم داخلي متكامل للشقق", vendor: "ديار ديزاين", price: 150, rating: 4.8, type: "استشارة ومخطط"},
  {id: 102, img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400", name: "تركيب غرف نوم كاملة", vendor: "ورشة الإنجاز", price: 500, rating: 4.5, type: "تركيب وصيانة"},
  {id: 103, img: "https://images.unsplash.com/photo-1581404176840-0255b7bd4b4c?auto=format&fit=crop&q=80&w=400", name: "تصميم 3D للمطابخ", vendor: "مكتب الإبداع", price: 1200, rating: 4.9, type: "التنفيذ بالقطعة"},
  {id: 104, img: "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&q=80&w=400", name: "صيانة وطلاء الأثاث الخشبي", vendor: "مختصي الصيانة", price: 300, rating: 4.2, type: "زيارة فنية"},
];

const FILTER_GROUPS = [
  {
    title: "المتاجر المعتمدة",
    options: ["مفروشات الرقي", "الزاوية الحديثة", "بيت التصميم", "روائع الخشب", "إضاءات دبي", "أناقة المنزل"]
  },
  {
    title: "الفرع / التصنيف",
    options: ["غرف نوم رئيسية", "غرف نوم أطفال", "خزائن ودواليب", "تسريحات", "طاولات جانبية"]
  },
  {
    title: "المادة",
    options: ["خشب طبيعي", "خشب مصنع", "معدن", "زجاج", "جلد", "قماش مخمل"]
  },
  {
    title: "لون المنتج",
    options: [] // Managed specially below
  }
];

const SERVICE_FILTER_GROUPS = [
  {
    title: "مقدمي الخدمة",
    options: ["ديار ديزاين", "شركة الإبداع المعماري", "مؤسسة اللمسة الفنية", "رواد التركيب", "مختصي الصيانة", "ورشة الإنجاز"]
  },
  {
    title: "نوع الخدمة",
    options: ["بالمتر المربع", "بالمقايسة", "سعر ثابت", "بالساعة", "زيارة فنية"]
  },
  {
    title: "موقع تقديم الخدمة",
    options: ["في الموقع", "استشارة عن بعد"]
  }
];

const COLORS = [
  { name: "أسود", hex: "#000000" },
  { name: "أبيض", hex: "#FFFFFF" },
  { name: "بيج", hex: "#F5F5DC" },
  { name: "بني", hex: "#8B4513" },
  { name: "رمادي", hex: "#808080" },
  { name: "أزرق", hex: "#0000FF" },
  { name: "أخضر", hex: "#008000" },
  { name: "أحمر", hex: "#FF0000" },
  { name: "ذهبي", hex: "#FFD700" },
];

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  key?: React.Key;
}

function Accordion({ title, children, defaultOpen = true }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex w-full items-center justify-between font-bold text-diyar-dark outline-none group"
      >
        <span>{title}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 group-hover:text-diyar-brown ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { id } = useParams();
  const categoryId = id && CATEGORIES[id as keyof typeof CATEGORIES] ? id : "all";
  const category = CATEGORIES[categoryId as keyof typeof CATEGORIES];
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [activeSubcategory, setActiveSubcategory] = useState('الكل');

  const isServiceCategory = categoryId === 'interior-design' || categoryId === 'maintenance';
  const currentFilters = isServiceCategory ? SERVICE_FILTER_GROUPS : FILTER_GROUPS;

  if (categoryId === 'all') {
    return (
      <div className="bg-gray-50 min-h-screen pb-10">
        <div className="bg-white border-b border-gray-200 pt-6 pb-6 px-4">
          <div className="max-w-7xl mx-auto text-right">
            <h1 className="text-xl md:text-3xl font-bold text-diyar-dark mb-2">جميع التصنيفات</h1>
            <p className="text-gray-500 text-sm md:text-base">
              تصفح جميع أقسام المنتجات والخدمات والمخططات التي تقدمها منصة ديار.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-16 md:mb-20">
            {Object.entries(CATEGORIES).filter(([k]) => k !== 'all').map(([k, cat]) => (
              <Link to={`/category/${k}`} key={k} className="flex flex-col items-center gap-3 md:gap-4 group cursor-pointer">
                <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative shadow-sm border border-gray-100 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl bg-gray-100">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <span className="font-bold text-diyar-dark text-base md:text-xl group-hover:text-diyar-brown transition-colors text-center">{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="mb-16 md:mb-20">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-diyar-dark flex items-center justify-between">
              <span>أشهر المتاجر والماركات</span>
              <Link to="/" className="text-sm text-diyar-brown font-medium hover:underline">عرض الكل</Link>
            </h2>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="min-w-[100px] md:min-w-[140px] aspect-square rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-4 snap-start hover:shadow-md transition cursor-pointer group">
                  <span className="font-bold text-gray-400 group-hover:text-diyar-brown transition">متجر {i}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-diyar-dark text-white rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-16 md:mb-20 relative overflow-hidden shadow-xl">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-diyar-brown opacity-20 rounded-full blur-3xl"></div>
             
             <div className="relative z-10 text-center md:text-right flex-1">
                <h2 className="text-xl md:text-3xl font-bold mb-3">تفصيل أثاث بمواصفاتك الخاصة؟</h2>
                <p className="text-gray-300 text-sm md:text-base max-w-xl">
                  هل لديك تصميم معين في مخيلتك أو تبحث عن مقاسات خاصة؟ ارفع صورتك أو مخططك وسنقوم بربطك بأفضل ورش التصنيع والمناجر المعتمدة لتقديم عروض أسعار.
                </p>
             </div>
             <button className="bg-diyar-cream text-diyar-dark px-8 py-3.5 rounded-xl font-bold relative z-10 hover:bg-white transition whitespace-nowrap w-full md:w-auto">
               اطلب تسعيرة تخصيص
             </button>
          </div>

          <div className="mb-16">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-diyar-dark">خدمات ديار الشاملة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Link to="/category/interior-design" className="bg-white rounded-3xl p-6 flex items-center gap-6 border border-gray-100 hover:shadow-lg hover:border-diyar-brown/30 transition group">
                <div className="w-20 h-20 rounded-2xl bg-diyar-cream/30 flex items-center justify-center shrink-0">
                  <Palette className="w-10 h-10 text-diyar-brown group-hover:scale-110 transition" />
                </div>
                <div>
                  <h3 className="font-bold text-lg md:text-xl text-diyar-dark mb-1">خدمات التصميم الداخلي</h3>
                  <p className="text-sm text-gray-500">مهندسون ومصممون محترفون لتحويل مساحتك إلى تحفة فنية.</p>
                </div>
              </Link>
              <Link to="/category/maintenance" className="bg-white rounded-3xl p-6 flex items-center gap-6 border border-gray-100 hover:shadow-lg hover:border-diyar-brown/30 transition group">
                <div className="w-20 h-20 rounded-2xl bg-diyar-cream/30 flex items-center justify-center shrink-0">
                  <Wrench className="w-10 h-10 text-diyar-brown group-hover:scale-110 transition" />
                </div>
                <div>
                  <h3 className="font-bold text-lg md:text-xl text-diyar-dark mb-1">خدمات التركيب والصيانة</h3>
                  <p className="text-sm text-gray-500">فنيون معتمدون لتركيب الأثاث وصيانته في منزلك.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200 pt-4 pb-4 md:pt-6 md:pb-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-row items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-28 md:h-28 rounded-2xl md:rounded-3xl overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 shadow-sm border border-gray-100">
            <img src={category.img} alt={category.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-right flex-1">
            <h1 className="text-xl md:text-4xl font-bold text-diyar-dark mb-1 md:mb-2">{category.name}</h1>
            <p className="text-gray-500 max-w-2xl text-xs md:text-base leading-relaxed line-clamp-2 md:line-clamp-none">
              تصفح أحدث وأرقى المنتجات في قسم {category.name}. نقدم لك تشكيلة واسعة من أعرق المتاجر.
            </p>
          </div>
        </div>
      </div>

      {/* Subcategories (only if it has subcategories) */}
      {'subcategories' in category && Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
        <div className="bg-white border-b border-gray-100 shadow-sm relative z-10 w-full mb-6">
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                onClick={() => setActiveSubcategory('الكل')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold shadow-sm shrink-0 transition-colors ${
                  activeSubcategory === 'الكل' ? 'bg-diyar-dark text-white' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                الكل
              </button>
              {category.subcategories.map((sub: string, index: number) => (
                <button 
                  key={index} 
                  onClick={() => setActiveSubcategory(sub)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-colors shrink-0 ${
                    activeSubcategory === sub ? 'bg-diyar-dark text-white border-diyar-dark font-bold' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8 flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block w-72 shrink-0 bg-white border border-gray-200 rounded-3xl p-6 self-start">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-lg text-diyar-dark flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-diyar-brown" />
              تصفية النتائج
            </h3>
            <span className="text-xs text-diyar-brown font-medium cursor-pointer hover:underline">مسح الكل</span>
          </div>

          <Accordion title="نطاق السعر">
            <div className="px-1">
              <input type="range" min="0" max={isServiceCategory ? "5000" : "20000"} step="100" className="w-full accent-diyar-brown mb-4" />
              <div className="flex items-center justify-between gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
                  <span className="text-xs text-gray-500 block mb-1">من</span>
                  <span className="font-bold text-sm">0 ر.س</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
                  <span className="text-xs text-gray-500 block mb-1">إلى</span>
                  <span className="font-bold text-sm">{isServiceCategory ? '5,000' : '10,000'} ر.س</span>
                </div>
              </div>
            </div>
          </Accordion>

          {!isServiceCategory && (
            <Accordion title="اللون">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color, idx) => (
                  <button 
                    key={idx}
                    title={color.name}
                    className="w-8 h-8 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-diyar-brown focus:ring-offset-2 transition-shadow"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </Accordion>
          )}

          {currentFilters.map((group, i) => (
            <Accordion title={group.title} key={i}>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-1 pl-3">
                {(group.title === "المتاجر المعتمدة" || group.title === "مقدمي الخدمة") && (
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder={`ابحث عن ${isServiceCategory ? 'مقدم خدمة' : 'متجر'}...`} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pr-9 pl-3 text-sm outline-none focus:border-diyar-brown" />
                  </div>
                )}
                {group.options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 border border-gray-300 rounded checked:bg-diyar-brown checked:border-diyar-brown transition-colors cursor-pointer" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-diyar-dark transition-colors">{opt}</span>
                    <span className="text-xs text-gray-400 mr-auto">({Math.floor(Math.random() * 50) + 1})</span>
                  </label>
                ))}
              </div>
            </Accordion>
          ))}
          
          <Accordion title="التقييم" defaultOpen={false}>
            <div className="space-y-3">
              {[4, 3, 2, 1].map((rating, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="radio" name="rating" className="peer appearance-none w-5 h-5 border border-gray-300 rounded-full checked:border-4 checked:border-diyar-brown transition-all cursor-pointer" />
                  </div>
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, starIdx) => <Star key={starIdx} size={14} fill={starIdx < rating ? "currentColor" : "none"} strokeWidth={starIdx < rating ? 0 : 2} />)}
                  </div>
                  <span className="text-sm text-gray-500 mr-1">فأكثر</span>
                </label>
              ))}
            </div>
          </Accordion>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Control Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 md:hidden">
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex items-center gap-2 bg-gray-100 text-diyar-dark px-4 py-2 rounded-xl text-sm font-bold"
              >
                <Filter size={18} />
                تصفية
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="hidden md:inline font-medium">إظهار 1-12 من أصل 48 نتيجة</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50">
                <span className="text-gray-500">ترتيب حسب:</span>
                <select className="bg-transparent border-none outline-none font-bold text-diyar-dark pr-1 pl-4 cursor-pointer">
                  <option>المقترحة</option>
                  <option>الأحدث</option>
                  <option>السعر: من الأقل للأعلى</option>
                  <option>السعر: من الأعلى للأقل</option>
                  <option>الأعلى تقييماً</option>
                </select>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-diyar-brown' : 'text-gray-400 hover:text-diyar-dark'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-diyar-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
              السعر: 0 - {isServiceCategory ? '5000' : '10000'}
              <X size={14} className="cursor-pointer hover:text-gray-300" />
            </span>
            <span className="bg-diyar-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
              {isServiceCategory ? 'ديار ديزاين' : 'الزاوية الحديثة'}
              <X size={14} className="cursor-pointer hover:text-gray-300" />
            </span>
            <span className="text-sm text-diyar-brown font-medium cursor-pointer flex items-center px-2 hover:underline">
              مسح فلاتر البحث
            </span>
          </div>

          {/* Product/Service Grid */}
          <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
             {(isServiceCategory ? MOCK_SERVICES : MOCK_PRODUCTS).map((item, i) => (
                <div key={i} className="h-full">
                   {isServiceCategory ? (
                     <ServiceCard service={item} layout={viewMode} />
                   ) : (
                     <ProductCard product={item} layout={viewMode} />
                   )}
                </div>
             ))}
             {/* Duplicate for demo */}
             {(isServiceCategory ? MOCK_SERVICES : MOCK_PRODUCTS).map((item, i) => (
                <div key={`d-${i}`} className="h-full">
                   {isServiceCategory ? (
                     <ServiceCard service={item} layout={viewMode} />
                   ) : (
                     <ProductCard product={item} layout={viewMode} />
                   )}
                </div>
             ))}
          </div>

          {/* Pagination */}
          <div className="mt-12 flex justify-center items-center gap-2">
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              &lt;
            </button>
            <button className="w-10 h-10 rounded-xl bg-diyar-dark text-white font-bold flex items-center justify-center shadow-sm">
              1
            </button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              2
            </button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              3
            </button>
            <span className="text-gray-400 px-1">...</span>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              8
            </button>
            <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              &gt;
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-diyar-dark">تصفية النتائج</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-diyar-dark">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <Accordion title="نطاق السعر">
                <div className="px-1">
                  <input type="range" min="0" max={isServiceCategory ? "5000" : "20000"} step="100" className="w-full accent-diyar-brown mb-4" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
                      <span className="text-xs text-gray-500 block mb-1">من</span>
                      <span className="font-bold text-sm">0 ر.س</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-full">
                      <span className="text-xs text-gray-500 block mb-1">إلى</span>
                      <span className="font-bold text-sm">{isServiceCategory ? '5,000' : '10,000'} ر.س</span>
                    </div>
                  </div>
                </div>
              </Accordion>

              {!isServiceCategory && (
                <Accordion title="اللون">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color, idx) => (
                      <button 
                        key={idx}
                        title={color.name}
                        className="w-8 h-8 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-diyar-brown focus:ring-offset-2 transition-shadow"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </Accordion>
              )}

              {currentFilters.map((group, i) => (
                <Accordion title={group.title} key={i}>
                  <div className="space-y-3 pr-1 pl-3">
                    {(group.title === "المتاجر المعتمدة" || group.title === "مقدمي الخدمة") && (
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder={`ابحث عن ${isServiceCategory ? 'مقدم خدمة' : 'متجر'}...`} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:border-diyar-brown" />
                      </div>
                    )}
                    {group.options.map((opt, idx) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer appearance-none w-5 h-5 border border-gray-300 rounded checked:bg-diyar-brown checked:border-diyar-brown transition-colors" />
                          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Accordion>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3">
              <button className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">مسح الكل</button>
              <button 
                onClick={() => setIsMobileFilterOpen(false)} 
                className="flex-[2] bg-diyar-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-black/10"
              >
                تطبيق الفلاتر (48)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
