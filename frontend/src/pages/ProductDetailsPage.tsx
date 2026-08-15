import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Bookmark, Share2, Star, ChevronRight, ChevronLeft, Ruler, Palette, Box, 
  CheckCircle, Store, Truck, ShieldCheck, Sparkles, AlertCircle, ShoppingCart, X,
  Heart
} from 'lucide-react';
import ProductCard from '../components/cards/ProductCard.tsx';

const MOCK_PRODUCT = {
  id: "1",
  title: "أريكة استرخاء كلاسيكية مبطنة",
  vendor: "مفروشات الرقي",
  category: "الصالونات",
  price: 1850,
  oldPrice: 2400,
  rating: 4.8,
  reviewsCount: 124,
  availability: "كمية محدودة", // "متوفر", "كمية محدودة", "غير متوفر"
  type: "مفرد", // "مفرد" أو "مجموعة"
  colors: [
    { name: "رمادي فاتح", hex: "#D1D5DB" },
    { name: "بيج دافئ", hex: "#F5F5DC" },
    { name: "أزرق داكن", hex: "#1E3A8A" },
  ],
  dimensions: {
    width: "210 سم",
    height: "85 سم",
    depth: "90 سم"
  },
  materials: {
    main: "خشب زان روماني صلب",
    fabric: "مخمل عالي الجودة ضد البقع",
    filling: "إسفنج عالي الكثافة (HR)"
  },
  includes: [
    "الأريكة الرئيسية (قطعة واحدة)",
    "وسائد زينة (2 قطعة)"
  ],
  images: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800"
  ],
  description: "أريكة استرخاء مصممة بعناية لتجمع بين الفخامة الكلاسيكية والراحة العصرية. تأتي بنسيج مخملي ناعم الملمس وهيكل خشبي متين يضمن استخداماً يدوم طويلاً.",
};

const SIMILAR_PRODUCTS = [
  { img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400", name: "أريكة استوديو حديثة", vendor: "مفروشات الرقي", price: 1200, category: "الصالونات" },
  { img: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=400", name: "كنبة مقعدين", vendor: "بيت الأناقة", price: 850, category: "الصالونات" },
  { img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=400", name: "طقم كنب زاوية", vendor: "مفروشات الرقي", price: 3200, category: "الصالونات" },
  { img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400", name: "كرسي مفرد مريح", vendor: "أثاث المنزل", price: 450, category: "كراسي" },
];

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(48);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 pt-20">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-diyar-brown">الرئيسية</Link>
          <ChevronRight size={14} className="mx-1" />
          <Link to="/category/living-room" className="hover:text-diyar-brown">{MOCK_PRODUCT.category}</Link>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-diyar-dark font-medium truncate">{MOCK_PRODUCT.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Gallery Section */}
          <div className="lg:w-1/2 flex flex-col gap-4">
            <div 
              className="relative aspect-square md:aspect-[4/3] bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img 
                src={MOCK_PRODUCT.images[activeImage]} 
                alt={MOCK_PRODUCT.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
                }}
              />
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                   خصم 25%
                </span>
              </div>
              <div className="absolute top-4 left-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="bg-white/80 backdrop-blur text-gray-500 hover:text-diyar-brown p-2.5 rounded-full shadow-sm transition-colors"
                  title="حفظ"
                >
                  <Bookmark size={20} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-diyar-brown" : ""} />
                </button>
                <button 
                  className="bg-white/80 backdrop-blur text-gray-500 hover:text-diyar-dark p-2.5 rounded-full shadow-sm transition-colors"
                  title="مشاركة"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
                  }}
                  className="bg-white/80 backdrop-blur text-gray-500 hover:text-red-500 p-2.5 rounded-full shadow-sm transition-colors flex items-center justify-center relative group/btn"
                  title="إعجاب"
                >
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} className={`transition-all ${isLiked ? "text-red-500 scale-110" : "hover:scale-110"}`} />
                  {likesCount > 0 && (
                    <span className="absolute -bottom-1 -left-1 bg-diyar-dark text-white text-[9px] font-bold px-1 rounded-full border border-white">
                      {likesCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* AR / Video Buttons Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 w-max max-w-[90%]" onClick={(e) => e.stopPropagation()}>
                 <button 
                   onClick={() => setIsAiModalOpen(true)}
                   className="bg-diyar-dark/90 backdrop-blur text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
                   title="تجربة في غرفتك بالمساعد الشخصي"
                 >
                   <Sparkles size={16} className="text-yellow-400 shrink-0" />
                   <span className="hidden sm:inline">جرّب في غرفتك </span>بالمساعد الشخصي
                 </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {MOCK_PRODUCT.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 snap-start transition-all border-2 ${
                    activeImage === idx ? 'border-diyar-brown shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=400";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:w-1/2 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-diyar-brown bg-diyar-brown/10 px-3 py-1 rounded-full">
                  {MOCK_PRODUCT.category}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-diyar-dark mb-4 leading-snug">
                {MOCK_PRODUCT.title}
              </h1>
              
              {/* Reviews & Availability */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition">
                  <Star size={18} className="text-yellow-400" fill="currentColor" />
                  <span className="font-bold text-diyar-dark ml-1">{MOCK_PRODUCT.rating}</span>
                  <span className="text-gray-400">({MOCK_PRODUCT.reviewsCount} تقييم)</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <div className={`flex items-center gap-1.5 font-bold ${
                  MOCK_PRODUCT.availability === "متوفر" ? "text-green-600" : 
                  MOCK_PRODUCT.availability === "كمية محدودة" ? "text-orange-500" : "text-red-500"
                }`}>
                  {MOCK_PRODUCT.availability === "كمية محدودة" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                  {MOCK_PRODUCT.availability}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Box size={16} />
                  النوع: {MOCK_PRODUCT.type}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-bold text-diyar-dark">{MOCK_PRODUCT.price}</span>
                <span className="text-xl font-bold text-diyar-dark mb-1">ر.س</span>
                {MOCK_PRODUCT.oldPrice && (
                  <span className="text-lg text-gray-400 line-through mb-1 pr-2">{MOCK_PRODUCT.oldPrice} ر.س</span>
                )}
              </div>

              {/* Vendor */}
              <Link to="/store/1" className="flex items-center justify-between p-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl hover:border-diyar-brown/30 hover:shadow-sm transition-all group">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-400 group-hover:text-diyar-brown transition-colors">
                     <Store size={24} />
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium mb-0.5">مقدم بواسطة</p>
                     <p className="text-sm font-bold text-diyar-dark">{MOCK_PRODUCT.vendor}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 text-xs font-bold text-diyar-brown bg-diyar-brown/10 px-3 py-1.5 rounded-full">
                   زيارة المتجر
                   <ChevronLeft size={14} />
                 </div>
              </Link>
            </div>

            {/* Colors */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-diyar-dark mb-3 flex items-center gap-2">
                <Palette size={18} /> الألوان المتاحة: 
                <span className="font-normal text-gray-500">{MOCK_PRODUCT.colors[selectedColor].name}</span>
              </h3>
              <div className="flex gap-3">
                {MOCK_PRODUCT.colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all ${
                      selectedColor === idx ? 'border-diyar-brown scale-110 shadow-md' : 'border-transparent'
                    }`}
                  >
                    <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: color.hex }}></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions */}
            <div className="mb-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <Ruler size={18} /> القياسات الدقيقة
              </h3>
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <span className="block text-xs text-gray-500 mb-1">الارتفاع</span>
                  <span className="font-bold text-diyar-dark" dir="ltr">{MOCK_PRODUCT.dimensions.height}</span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <span className="block text-xs text-gray-500 mb-1">العرض</span>
                  <span className="font-bold text-diyar-dark" dir="ltr">{MOCK_PRODUCT.dimensions.width}</span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <span className="block text-xs text-gray-500 mb-1">العمق</span>
                  <span className="font-bold text-diyar-dark" dir="ltr">{MOCK_PRODUCT.dimensions.depth}</span>
                </div>
              </div>
            </div>

            {/* Materials & Includes */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-bold text-diyar-dark mb-3 flex items-center gap-2">
                  <Box size={18} /> المواد والجودة
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>الهيكل: <span className="font-semibold text-diyar-dark">{MOCK_PRODUCT.materials.main}</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>القماش: <span className="font-semibold text-diyar-dark">{MOCK_PRODUCT.materials.fabric}</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span>الحشوة: <span className="font-semibold text-diyar-dark">{MOCK_PRODUCT.materials.filling}</span></span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-diyar-dark mb-3 flex items-center gap-2">
                  <Box size={18} /> محتويات المنتج
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {MOCK_PRODUCT.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-diyar-brown mt-2 shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Add to Cart Sticky mobile / Normal desktop */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 md:relative md:p-0 md:border-0 md:bg-transparent flex items-center gap-4">
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-[52px]">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-gray-500 hover:text-diyar-brown text-xl w-6"
                >-</button>
                <span className="font-bold text-diyar-dark w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-gray-500 hover:text-diyar-brown text-xl w-6"
                >+</button>
              </div>
              <button className="flex-1 bg-diyar-dark text-white font-bold h-[52px] rounded-xl flex items-center justify-center gap-2 hover:bg-black transition shadow-lg shadow-black/10">
                <ShoppingCart size={20} />
                إضافة للسلة • {MOCK_PRODUCT.price * quantity} ر.س
              </button>
            </div>
            {/* Safe area padding for mobile */}
            <div className="h-4 md:hidden"></div>
          </div>
        </div>
      </div>

      {/* Description & Policies */}
      <div className="bg-white border-t border-b border-gray-100 py-10 md:py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-xl md:text-2xl font-bold text-diyar-dark mb-4">وصف المنتج</h2>
              <p className="text-gray-600 leading-relaxed max-w-3xl">
                {MOCK_PRODUCT.description}
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-diyar-dark">ضمان شامل</h4>
                  <p className="text-sm text-gray-500 mt-1">ضمان سنة على الهيكل ضد العيوب المصنعية.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-diyar-dark">توصيل سريع</h4>
                  <p className="text-sm text-gray-500 mt-1">توصيل خلال ٣-٥ أيام عمل مع خدمة التركيب.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-diyar-dark">منتجات مشابهة قد تعجبك</h2>
        </div>
        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 scrollbar-hide snap-x pt-2 -mt-2 px-2 -mx-2 md:px-0 md:mx-0">
          {SIMILAR_PRODUCTS.map((p, i) => (
             <div key={i} className="min-w-[200px] md:min-w-[240px] snap-start shrink-0">
               <ProductCard product={p} />
             </div>
          ))}
        </div>
      </div>

      {/* AI Modal Preview */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 bg-white text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10"
            >
              <X size={20} />
            </button>
            <div className="p-6 md:p-8 text-center bg-diyar-dark text-white">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold mb-2">جرّب المنتج في غرفتك</h3>
              <p className="text-diyar-cream text-sm opacity-90 max-w-md mx-auto">
                ارفع صورة لغرفتك، وسيقوم المساعد الشخصي بدمج المنتج في مساحتك بأبعاد واقعية لترى مظهر الغرفة قبل الشراء.
              </p>
            </div>
            <div className="p-8 pb-10 flex flex-col items-center">
               <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 mb-6 cursor-pointer hover:bg-gray-100 transition-colors">
                  <Sparkles size={32} className="mb-3 opacity-50" />
                  <span className="font-medium text-diyar-dark mb-1">التقط صورة لغرفتك</span>
                  <span className="text-xs">أو اسحب الصورة هنا</span>
               </div>
               <button className="w-full bg-diyar-brown text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#A67B5B]/90 transition">
                 <Sparkles size={18} />
                 معاينة في غرفتي
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col justify-center animate-in fade-in duration-300">
           <button 
             onClick={() => setIsGalleryOpen(false)}
             className="absolute top-6 right-6 text-white hover:text-gray-300 transition z-10 bg-white/10 backdrop-blur-md p-2 rounded-full"
           >
             <X size={24} />
           </button>
           
           <div className="relative w-full max-w-5xl mx-auto p-4 md:p-12">
              <div className="aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black flex items-center justify-center">
                 <img 
                   src={MOCK_PRODUCT.images[activeImage]} 
                   alt="Gallery" 
                   className="max-w-full max-h-full object-contain"
                   referrerPolicy="no-referrer"
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800";
                   }}
                 />
              </div>

              {/* Navigation */}
              <div className="absolute inset-y-0 left-4 md:left-8 flex items-center">
                <button 
                  onClick={() => setActiveImage((prev) => (prev + 1) % MOCK_PRODUCT.images.length)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronLeft size={24} />
                </button>
              </div>
              <div className="absolute inset-y-0 right-4 md:right-8 flex items-center">
                <button 
                  onClick={() => setActiveImage((prev) => (prev - 1 + MOCK_PRODUCT.images.length) % MOCK_PRODUCT.images.length)}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
           </div>

           {/* Thumbnails */}
           <div className="mt-8 flex justify-center gap-3 px-4 overflow-x-auto scrollbar-hide pb-4">
              {MOCK_PRODUCT.images.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${activeImage === i ? 'border-diyar-brown scale-105 shadow-lg' : 'border-transparent opacity-50'}`}
                >
                  <img 
                    src={img} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=200";
                    }}
                  />
                </button>
              ))}
           </div>
        </div>
      )}

    </div>
  );
}
