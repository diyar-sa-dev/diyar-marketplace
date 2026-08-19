import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronDown,
  Grid,
  Home,
  ShoppingCart,
  Info,
  Phone,
  Package,
  Compass,
  Sparkles,
  FolderGit2,
  ArrowLeft,
  Send,
  CheckCircle,
  ExternalLink,
  Calendar,
  MapPin,
  Eye,
  Wrench,
  RefreshCw,
  Layers,
  PhoneCall,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import {
  shouldShowStorefrontDashboardLink,
  resolveAccountHubPath,
  resolveDashboardEntryPath,
} from '../../lib/auth/roles.ts';

const CATEGORIES = {
  bedroom: {
    name: 'غرف النوم',
    subcategories: ['أسرة', 'خزائن ملابس', 'تسريحات', 'طاولات جانبية', 'مراتب'],
  },
  'living-room': {
    name: 'الصالونات',
    subcategories: ['أطقم كنب', 'كراسي استرخاء', 'طاولات قهوة', 'طاولات تلفزيون', 'مكتبات'],
  },
  kitchen: {
    name: 'المطابخ',
    subcategories: ['خزائن مطابخ', 'طاولات طعام', 'كراسي طعام', 'عربات تقديم'],
  },
  office: {
    name: 'المكاتب',
    subcategories: ['مكاتب إدارية', 'كراسي مكتبية', 'وحدات أدراج', 'مكتبات مكتبية'],
  },
  decor: {
    name: 'ديكورات',
    subcategories: ['إضاءة', 'سجاد', 'لوحات جدارية', 'mraia', 'نباتات زينة'],
  },
  'interior-design': {
    name: 'تصميم داخلي',
    subcategories: ['تصميم سكني', 'تصميم تجاري', 'استشارات', 'مخططات معمارية'],
  },
  maintenance: {
    name: 'تركيب وصيانة',
    subcategories: ['تركيب أثاث', 'صيانة خشبية', 'تنجيد', 'دهانات'],
  },
};

const MOCK_PROJECTS = [
  {
    id: 1,
    title: 'مجلس الفرسان الفاخر',
    location: 'الرياض - حي حطين',
    category: 'تصميم وتجهيز كلي',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600',
    desc: 'مجلس رسمي على الطراز الأندلسي الفخم مع استخدام أخشاب الزان الطبيعية والنقش اليدوي المذهب، مغطى بالمخمل الإيطالي المتين ليناسب تجهيزات الضيافة الراقية.',
  },
  {
    id: 2,
    title: 'صالون نيوكلاسيك متكامل',
    location: 'جدة - أبحر الشمالية',
    category: 'تنسيق أثاث وديكور',
    img: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=600',
    desc: 'تصميم داخلي لغرفة معيشة مفتوحة تعزز الضوء الطبيعي، بلمسات نيوكلاسيك كلاسيكية دافئة وتوزيع دقيق لطاولات الخدمة ووحدات الإضاءة الجانبية.',
  },
  {
    id: 3,
    title: 'جناح ضيافة وادي حنيفة',
    location: 'الدرعية التاريخية',
    category: 'استشارات ومخططات ثلاثية الأبعاد',
    img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
    desc: 'مشروع دمج بين التراث النجدي العريق والأثاث المعاصر المعزز بتفاصيل السدو المحلي، مما شكل تحفة معمارية حازت على تقييمات استثنائية.',
  },
];

const ROOM_BACKGROUNDS = [
  {
    id: 'majlis',
    name: 'المجلس التراثي الأصيل',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'salon',
    name: 'صالون مودرن دافئ',
    img: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'bedroom',
    name: 'جناح النوم الفاخر',
    img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
  },
];

const STICKERS = [
  {
    id: 'sofa1',
    name: 'كنبة ملكية كرزية',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 160,
  },
  {
    id: 'table',
    name: 'طاولة قهوة رخامية',
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 110,
  },
  {
    id: 'chair',
    name: 'كرسي استرخاء مخمل',
    img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 100,
  },
  {
    id: 'plant',
    name: 'نبات زينة داخلي',
    img: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=400',
    defaultWidth: 80,
  },
];

export function SidebarMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showCategoriesSection, setShowCategoriesSection] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = resolveDashboardEntryPath(user?.roles);
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const showDashboardLink = shouldShowStorefrontDashboardLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );

  // Dialog / Subview states
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  // Contacts Form state
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  // AI Design Simulator states
  const [selectedBg, setSelectedBg] = useState(ROOM_BACKGROUNDS[0]);
  const [activeItems, setActiveItems] = useState<
    Array<{
      id: string;
      stickerId: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      img: string;
      name: string;
    }>
  >([]);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 4000);
  };

  const addStickerToRoom = (sticker: (typeof STICKERS)[0]) => {
    const newItem = {
      id: `${sticker.id}-${Date.now()}`,
      stickerId: sticker.id,
      x: 100 + activeItems.length * 15,
      y: 120 + activeItems.length * 15,
      scale: 1,
      rotation: 0,
      img: sticker.img,
      name: sticker.name,
    };
    setActiveItems([...activeItems, newItem]);
    setSelectedStickerIndex(activeItems.length);
  };

  const updateStickerItem = (index: number, fields: Partial<(typeof activeItems)[0]>) => {
    const next = [...activeItems];
    next[index] = { ...next[index], ...fields };
    setActiveItems(next);
  };

  const removeStickerItem = (index: number) => {
    const next = activeItems.filter((_, i) => i !== index);
    setActiveItems(next);
    setSelectedStickerIndex(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Primary Sidebar Container */}
      <div className="fixed top-0 right-0 h-full w-[320px] md:w-95 bg-white z-60 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <img src="/logo_diyar.svg" alt="DIYAR" className="h-9" />
            <div>
              <h2 className="font-bold text-base text-diyar-dark leading-snug">ديار للضيافة</h2>
              <p className="text-[10px] text-gray-500 font-semibold">
                أناقة وأصالة الضيافة العربية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-diyar-dark hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-hide space-y-6">
          {/* Main navigation (mirrors the top navbar — for mobile access) */}
          <div className="space-y-1">
            <h3 className="font-bold text-gray-400 mb-2 px-3 text-[11px]">التصفح</h3>

            <button
              onClick={() => handleNavigate('/')}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Home
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                الرئيسية
              </span>
            </button>

            {showDashboardLink && (
              <button
                onClick={() => handleNavigate(dashboardPath)}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
              >
                <LayoutDashboard
                  size={18}
                  className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
                />
                <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                  لوحة التحكم
                </span>
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={() => handleNavigate(accountHubPath)}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
              >
                <User
                  size={18}
                  className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
                />
                <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                  حسابي
                </span>
              </button>
            )}

            <button
              onClick={() => handleNavigate('/services')}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Wrench
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                خدمات
              </span>
            </button>

            <button
              onClick={() => handleNavigate('/b2b')}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Layers
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                B2B
              </span>
            </button>

            <button
              onClick={() => handleNavigate('/ai-designer')}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Sparkles
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                المساعد الشخصي
              </span>
            </button>
          </div>

          {/* Quick access utilities */}
          <div className="space-y-1">
            <h3 className="font-bold text-gray-400 mb-2 px-3 text-[11px]">الوصول السريع</h3>

            {/* المنتجات */}
            <button
              onClick={() => handleNavigate('/category/all')}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Grid
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                المنتجات
              </span>
            </button>

            {/* المشاريع */}
            <button
              onClick={() => setIsProjectsOpen(true)}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <FolderGit2
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                المشاريع
              </span>
            </button>

            {/* 5. AI Studio */}
            <button
              onClick={() => setIsAiStudioOpen(true)}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Sparkles
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                استوديو التصميم
              </span>
            </button>

            {/* 6. من نحن */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Info
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                من نحن
              </span>
            </button>

            {/* 7. تواصل معنا */}
            <button
              onClick={() => setIsContactOpen(true)}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
            >
              <Phone
                size={18}
                className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
              />
              <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
                تواصل معنا
              </span>
            </button>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <button
              onClick={() => setShowCategoriesSection(!showCategoriesSection)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <span>تصفح الأثاث حسب الفئات</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${showCategoriesSection ? 'rotate-180 text-diyar-brown' : ''}`}
              />
            </button>

            {showCategoriesSection && (
              <div className="mt-3 space-y-1 pl-1 pr-1 bg-gray-50/50 rounded-2xl p-1.5 border border-gray-100/70 animate-in fade-in duration-200">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <div key={key}>
                    <button
                      onClick={() => setOpenCategory(openCategory === key ? null : key)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white transition-all text-xs font-bold text-diyar-dark cursor-pointer"
                    >
                      <span className={openCategory === key ? 'text-diyar-brown' : ''}>
                        {cat.name}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`opacity-60 transition-transform ${openCategory === key ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openCategory === key && (
                      <div className="px-3 py-1 space-y-1 bg-white mx-1 my-1 rounded-xl border border-gray-100 animate-in fade-in duration-150">
                        <button
                          onClick={() => handleNavigate(`/category/${key}`)}
                          className="text-right w-full text-[11px] text-diyar-brown font-bold py-1.5 flex items-center gap-1 cursor-pointer"
                        >
                          الكل في {cat.name}
                          <ChevronLeft size={12} />
                        </button>
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() =>
                              handleNavigate(`/category/${key}?q=${encodeURIComponent(sub)}`)
                            }
                            className="text-right w-full text-[11px] text-gray-500 py-1.5 hover:text-diyar-brown transition-all pr-1 cursor-pointer"
                          >
                            • {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
          <p className="text-[10px] text-gray-400 font-medium">كل ركن يروي قصة أصالة • ديار 2026</p>
        </div>
      </div>

      {/* 4. MODAL: معرض المشاريع (Hospitality Projects Showcase) */}
      {isProjectsOpen && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsProjectsOpen(false)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-500 hover:text-black p-2.5 rounded-full shadow-md z-10 transition-all border border-gray-200"
              title="إغلاق"
            >
              <X size={18} />
            </button>

            <div className="p-6 md:p-8 bg-[#132624] text-diyar-cream shrink-0 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -mr-8 -mt-8" />
              <FolderGit2 className="w-12 h-12 text-diyar-brown mx-auto mb-3" />
              <h3 className="text-xl md:text-2xl font-bold mb-1.5 font-sans">
                معرض مشاريع ديار العقارية والهندسية
              </h3>
              <p className="text-xs md:text-sm text-diyar-cream max-w-lg mx-auto opacity-90 leading-relaxed">
                نفخر بتنفيذ وتجهيز الفلل الفاخرة والمجالس الرسمية في مختلف مناطق المملكة بأرقى
                الخامات المطابقة لتقاليد الضيافة الأصيلة.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-gray-50">
              {MOCK_PROJECTS.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow"
                >
                  <div className="w-full md:w-2/5 h-44 md:h-auto relative shrink-0">
                    <img
                      src={proj.img}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-3 right-3 bg-[#132624] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      {proj.category}
                    </span>
                  </div>
                  <div className="p-5 md:py-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                        <MapPin size={12} className="text-diyar-brown" />
                        <span>{proj.location}</span>
                      </div>
                      <h4 className="text-base font-bold text-diyar-dark mb-2.5 leading-snug">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        {proj.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-bold">
                        2026 م • تم التسليم
                      </span>
                      <button className="text-xs font-bold text-diyar-brown hover:text-[#132624] flex items-center gap-1 transition-colors">
                        تفاصيل المخطط <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: AI Studio Custom Simulator Workspace */}
      {isAiStudioOpen && (
        <div className="fixed inset-0 bg-black/85 z-100 flex items-center justify-center p-2 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1c] text-[#fbfbf9] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col">
            {/* Topbar */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-diyar-brown rounded-lg flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">مصمم الغرف التفاعلي</h3>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    تخيّل مكانك، ورتّب قطع أثاث ديار كيفما تشاء
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiStudioOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all border border-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-white/5 bg-[#121212]">
              {/* Canvas Preview */}
              <div className="flex-1 relative bg-black flex flex-col items-center justify-center p-4">
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <button
                    onClick={() => setActiveItems([])}
                    className="bg-black/60 text-white hover:bg-black p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur transition border border-white/10"
                  >
                    <RefreshCw size={12} /> إفراغ الغرفة
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-20 text-center pointer-events-none">
                  <span className="bg-[#132624]/90 text-diyar-cream text-[10px] md:text-xs font-bold py-1.5 px-3.5 rounded-full shadow-lg border border-diyar-brown/30">
                    اسحب القطع، كبّرها أو دوّرها لترتيب غرفتك بسهولة
                  </span>
                </div>

                {activeItems.length === 0 && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-diyar-cream mb-3">
                      <Sparkles size={22} />
                    </div>
                    <p className="text-white/90 text-sm font-bold mb-1">ابدأ بتأثيث غرفتك</p>
                    <p className="text-white/50 text-xs max-w-55 leading-relaxed">
                      اختر طابع الغرفة، ثم اضغط على أي قطعة أثاث من القائمة لإضافتها هنا.
                    </p>
                  </div>
                )}

                {/* Simulated 2.5D Canvas Container */}
                <div className="relative w-full aspect-4/3 max-w-2xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5 select-none">
                  {/* Background image */}
                  <img
                    src={selectedBg.img}
                    alt="Room background"
                    className="w-full h-full object-cover opacity-85 transition-all duration-300 pointer-events-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Draggable/Toggled Stickers overlay */}
                  {activeItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`absolute cursor-grab active:cursor-grabbing border ${
                        selectedStickerIndex === index
                          ? 'border-yellow-400 bg-black/20 ring-2 ring-yellow-400/50'
                          : 'border-transparent'
                      } rounded-xl p-1 transition-all duration-75`}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        width: `${item.scale * 120}px`,
                        transform: `rotate(${item.rotation}deg)`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStickerIndex(index);
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] pointer-events-none rounded-lg"
                        referrerPolicy="no-referrer"
                      />

                      {/* Selected Sticker Controls overlay */}
                      {selectedStickerIndex === index && (
                        <div
                          className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-white rounded-md px-2 py-0.5 flex items-center gap-2 text-[9px] font-bold pointer-events-auto border border-white/10 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              updateStickerItem(index, { scale: Math.max(0.6, item.scale - 0.15) })
                            }
                            className="hover:text-yellow-400 font-bold px-1"
                            title="تصغير"
                          >
                            -
                          </button>
                          <span>الحجم</span>
                          <button
                            onClick={() =>
                              updateStickerItem(index, { scale: Math.min(1.8, item.scale + 0.15) })
                            }
                            className="hover:text-yellow-400 font-bold px-1"
                            title="تكبير"
                          >
                            +
                          </button>
                          <span className="w-px h-2.5 bg-white/20"></span>
                          <button
                            onClick={() =>
                              updateStickerItem(index, { rotation: item.rotation + 45 })
                            }
                            className="hover:text-yellow-400 px-1"
                            title="تدوير"
                          >
                            ↻
                          </button>
                          <span className="w-px h-2.5 bg-white/20"></span>
                          <button
                            onClick={() => removeStickerItem(index)}
                            className="text-red-400 hover:text-red-500 font-bold px-1"
                            title="حذف"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Asset Controls (320px) */}
              <div className="w-full lg:w-80 shrink-0 p-5 space-y-6 flex flex-col overflow-y-auto max-h-[40vh] lg:max-h-none">
                {/* Scene background selection */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 mb-2.5">
                    1. حدد طابع الغرفة (المساحة)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {ROOM_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setSelectedBg(bg);
                          setSelectedStickerIndex(null);
                        }}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all p-0 truncate ${selectedBg.id === bg.id ? 'border-diyar-brown' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img
                          src={bg.img}
                          alt={bg.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-1">
                          <span className="text-[10px] font-bold text-white block leading-snug">
                            {bg.name.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furniture selections to place */}
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-300 mb-2.5">
                    2. اضغط على قطعة الأثاث لتجربتها
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {STICKERS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addStickerToRoom(item)}
                        className="bg-[#242424] hover:bg-zinc-800 rounded-2xl p-2 text-right border border-white/5 hover:border-white/15 transition-all text-xs flex gap-2 items-center"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <span className="font-bold block truncate text-[11px]">{item.name}</span>
                          <span className="text-[9px] text-diyar-brown block font-semibold">
                            بأبعاد دقيقة
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active stickers controllers on manual positioning */}
                {activeItems.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <h4 className="text-[11px] font-bold text-gray-400 mb-2">
                      3. توجيه الأثاث النشط
                    </h4>
                    <div className="flex flex-col gap-2">
                      {activeItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-[11px] transition-colors ${selectedStickerIndex === idx ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'bg-black/30 text-gray-300'}`}
                          onClick={() => setSelectedStickerIndex(idx)}
                        >
                          <span className="truncate">
                            {item.name} #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStickerItem(idx, { x: Math.max(0, item.x - 5) });
                              }}
                              className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                              title="يسار"
                            >
                              ←
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStickerItem(idx, { y: Math.max(0, item.y - 5) });
                              }}
                              className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                              title="أعلى"
                            >
                              ↑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStickerItem(idx, { y: Math.min(100, item.y + 5) });
                              }}
                              className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                              title="أسفل"
                            >
                              ↓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStickerItem(idx, { x: Math.min(100, item.x + 5) });
                              }}
                              className="bg-white/5 hover:bg-white/20 p-1 rounded font-mono"
                              title="يمين"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: من نحن (About DIYAR) */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] text-diyar-dark rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col border border-diyar-brown/10">
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10 transition-colors border border-gray-200"
              title="إغلاق"
            >
              <X size={18} />
            </button>

            {/* Visual Header */}
            <div className="p-8 bg-[#132624] text-white shrink-0 text-center relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-white/2 rounded-full" />
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-diyar-cream">
                عرين الكرم والضيافة والعزة
              </h3>
              <p className="text-xs text-diyar-brown font-bold leading-6">
                عن منصة ديار لأثاث وتجهيزات الضيافة
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 leading-relaxed text-sm scrollbar-hide">
              {/* Brand Story */}
              <div>
                <h4 className="text-[#132624] font-bold text-base mb-2 border-r-4 border-diyar-brown pr-3">
                  حكايتنا وأصالتنا
                </h4>
                <p className="text-gray-600 font-normal text-xs md:text-sm">
                  تأسست منصة **ديار** بدافع إحياء الفنون الزخرفية والتراثية للبيوت ومجالس الضيافة في
                  شبه الجزيرة العربية، ودمجها برؤية حديثة لترقى إلى أعلى درجات الفخامة العالمية.
                  نختار أفخر أنواع الأخشاب الطبيعية، والأقمشة التي تجمع روعة الألوان وتماسك النسيج
                  لنحاكي الفترات الذهبية للفن المعمري النجدي والأندلسي والحجازي.
                </p>
              </div>

              {/* Vision, Mission, Values */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <h5 className="font-bold text-diyar-dark mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#132624]"></span>
                    رؤيتنا
                  </h5>
                  <p className="text-xs text-gray-500 font-normal">
                    أن نكون المقصد الأول في دول الخليج لتغطية الاحتياجات الهندسية للمجالس ومفروشات
                    السكن الفخم، وربط كبار الملاك والصناع محلياً.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <h5 className="font-bold text-diyar-dark mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-diyar-brown"></span>
                    الجودة والضمان
                  </h5>
                  <p className="text-xs text-gray-500 font-normal">
                    جميع أعمال ديار الخشبية والتنجيدية مصحوبة بضمانات حقيقية تصل إلى 10 سنوات
                    لمكافحة عيوب الهيكل وضمان جودة الكرم والمسؤولية.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 text-center">
                <div
                  id="experience-stat"
                  className="inline-block bg-[#132624]/5 text-diyar-dark text-xs font-bold px-4 py-2 rounded-full"
                >
                  تجهيز 2,400+ مجلس فخم في المملكة منذ انطلاقنا
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: تواصل معنا (Contact us) */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-diyar-dark rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10 transition-colors border border-gray-200"
              title="إغلاق"
            >
              <X size={18} />
            </button>

            {/* Left/Right Visual layout for contact options */}
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Contact details Sidebar (dark) */}
              <div className="bg-[#132624] text-white p-6 md:p-8 md:w-2/5 flex flex-col justify-between shrink-0">
                <div>
                  <PhoneCall className="w-10 h-10 text-diyar-brown mb-4" />
                  <h4 className="text-lg font-bold mb-2 text-diyar-cream">سررنا بخدمتك</h4>
                  <p className="text-xs text-diyar-cream opacity-80 leading-relaxed mb-6 font-normal">
                    تواصل مع فريق المبيعات وتخطيط الديكور لطلب معاينات مجانية لمشروعك السكني أو
                    التجاري.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin size={16} className="text-diyar-brown shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">المقر الرئيسي</p>
                      <p className="opacity-70">طريق الملك عبدالعزيز، حي الياسمين، الرياض</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <Phone size={16} className="text-diyar-brown shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">قسم المبيعات</p>
                      <p className="opacity-70" dir="ltr">
                        +966 50 123 4567
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forms main layout */}
              <div className="p-6 md:p-8 flex-1 bg-white">
                <h4 className="font-bold text-base text-diyar-dark mb-4 pr-1">أرسل لنا استشارتك</h4>

                {contactSuccess ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={28} />
                    </div>
                    <h5 className="font-bold text-sm text-diyar-dark mb-1">
                      تم إرسال استشارتك بنجاح!
                    </h5>
                    <p className="text-xs text-gray-500 font-normal">
                      سيتصل بك مهندس الديكور المختص من ديار خلال 24 ساعة كحد أقصى.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-gray-50 outline-none border border-gray-100 focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark"
                        placeholder="مثال: فيصل بن سلمان"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                          رقم الجوال
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full bg-gray-50 outline-none border border-gray-100 focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark text-right"
                          placeholder="050XXXXXXXX"
                          value={contactForm.phone}
                          onChange={(e) =>
                            setContactForm({ ...contactForm, phone: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          className="w-full bg-gray-50 outline-none border border-gray-100 focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark"
                          placeholder="faisal@example.com"
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm({ ...contactForm, email: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">
                        تفاصيل استشارتك أو طلبك
                      </label>
                      <textarea
                        className="w-full bg-gray-50 outline-none border border-gray-100 focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark h-24 resize-none"
                        placeholder="اكتب هنا تفاصيل مشروعك ومساحة المجالس المطلوبة..."
                        required
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, message: e.target.value })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#132624] text-white hover:bg-black font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/5 cursor-pointer"
                    >
                      <Send size={14} /> إرسال الاستشارة
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
