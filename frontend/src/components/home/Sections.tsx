import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../cards/ProductCard.tsx';
import { Star, Quote, ArrowLeft, Send, Sparkles, UploadCloud, Grid, Store, Briefcase, Paintbrush, Smartphone, Scan, Box, BellRing, Wrench, ShieldCheck, Truck, HeadphonesIcon, CreditCard, PenTool, Twitter, Instagram, MessageCircle, Heart, Bookmark, Eye, Gift, ChevronLeft, ChevronRight } from 'lucide-react';

// Edge-overlay left/right scroll arrows for horizontal card rails (desktop only).
// Must be placed inside a `relative` wrapper around the scroll container.
function RailArrows({ scroller }: { scroller: React.RefObject<HTMLDivElement | null> }) {
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  const base = 'hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 items-center justify-center text-diyar-dark hover:bg-diyar-brown hover:text-white hover:border-diyar-brown transition-colors';
  return (
    <>
      <button onClick={() => scroll(1)} aria-label="السابق" className={`${base} -right-3`}>
        <ChevronRight size={20} />
      </button>
      <button onClick={() => scroll(-1)} aria-label="التالي" className={`${base} -left-3`}>
        <ChevronLeft size={20} />
      </button>
    </>
  );
}

export function BestSellers() {
  const [tab, setTab] = useState(0);
  const products = [
    {img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400", name: "أريكة مخملية فاخرة", vendor: "مفروشات الرقي", price: 2499, oldPrice: 3200},
    {img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400", name: "طقم صالون عصري", vendor: "الزاوية الحديثة", price: 5800, oldPrice: 7500},
    {img: "https://images.unsplash.com/photo-1583847268964-b28ce8f30e9b?auto=format&fit=crop&q=80&w=400", name: "طاولة خشب طبيعي", vendor: "روائع الخشب", price: 1200, oldPrice: 1600},
    {img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400", name: "سرير كينج ملكي", vendor: "أناقة المنزل", price: 4200, oldPrice: 5500},
    {img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400", name: "خزانة ملابس مبتكرة", vendor: "بيت التصميم", price: 3100, oldPrice: 4000},
    {img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400", name: "مكتب عمل مريح", vendor: "ركن المكاتب", price: 850, oldPrice: 1100},
    {img: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=400", name: "كرسي استرخاء", vendor: "زاوية الراحة", price: 1450, oldPrice: 1900},
    {img: "https://images.unsplash.com/photo-1560606177-063fb90494f4?auto=format&fit=crop&q=80&w=400", name: "طقم طعام كلاسيك", vendor: "مفروشات الرقي", price: 9200, oldPrice: 12000},
  ];
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <h2 className="text-xl md:text-3xl font-sans font-bold mb-4 md:mb-8 text-center">الأعلى مبيعاً</h2>
      <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 overflow-x-auto scrollbar-hide snap-x justify-start md:justify-center">
        {["الكل", "المنصة", "غرف النوم", "الصالونات", "المطابخ"].map((t, i) => <button key={i} onClick={() => setTab(i)} className={`px-4 md:px-6 py-2 rounded-full transition whitespace-nowrap snap-start text-sm md:text-base ${tab === i ? 'bg-diyar-brown text-white shadow-md' : 'bg-diyar-cream text-diyar-dark hover:bg-diyar-brown/20'}`}>{t}</button>)}
      </div>
      <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-6 -my-6">
        {products.map((p, i) => (
          <div key={i} className="w-[200px] md:w-auto flex-shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewArrivals() {
  const products = [
    {img: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?auto=format&fit=crop&q=80&w=400", name: "مصباح أرضي مودرن", vendor: "إضاءات دبي", price: 350, oldPrice: 480},
    {img: "https://images.unsplash.com/photo-1618220179428-22790b46a013?auto=format&fit=crop&q=80&w=400", name: "طاولة جانبية رخام", vendor: "روائع الخشب", price: 720, oldPrice: 950},
    {img: "https://images.unsplash.com/photo-1598300042247-d317bd127e7b?auto=format&fit=crop&q=80&w=400", name: "وحدة تخزين خشبية", vendor: "بيت التصميم", price: 1850, oldPrice: 2400},
    {img: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400", name: "مرآة حائط كلاسيك", vendor: "أناقة المنزل", price: 540, oldPrice: 700},
    {img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400", name: "طقم سجاد يدوي", vendor: "سجاد الشرق", price: 2100, oldPrice: 2800},
    {img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=400", name: "لوحة جدارية فنية", vendor: "لمسات فنية", price: 120, oldPrice: 200},
  ];
  const railRef = useRef<HTMLDivElement>(null);
  return (
    <div className="bg-diyar-cream/30 py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-4xl font-sans font-bold">وصل حديثاً</h2>
          <button className="text-diyar-brown text-sm md:text-base font-semibold flex items-center gap-1 md:gap-2 hover:text-diyar-dark transition">
            عرض الكل <ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>
        <div className="relative">
          <RailArrows scroller={railRef} />
          <div ref={railRef} className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-6 -my-6">
            {products.map((p, i) => (
              <div className="w-[200px] md:w-[230px] shrink-0 snap-start" key={i}>
                 <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuggestedForYou() {
  const products = [
    {img: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&q=80&w=400", name: "أريكة استرخاء مخمل", vendor: "زاوية الراحة", price: 3400, oldPrice: 4200},
    {img: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=400", name: "طاولة وسط ذهبية", vendor: "الزاوية الحديثة", price: 890, oldPrice: 1200},
    {img: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&q=80&w=400", name: "كرسي طعام جلدي", vendor: "مفروشات الرقي", price: 450, oldPrice: 600},
    {img: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&q=80&w=400", name: "مكتب دراسة أطفال", vendor: "بيت التصميم", price: 1100, oldPrice: 1500},
    {img: "https://images.unsplash.com/photo-1583847268964-b28ce8f30e9b?auto=format&fit=crop&q=80&w=400", name: "طاولة جانبية خشبية", vendor: "روائع الخشب", price: 350, oldPrice: 480},
  ];
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
       <div className="text-center mb-6 md:mb-8">
        <span className="text-diyar-brown text-sm font-medium mb-2 block">بناءً على تصفحك</span>
        <h2 className="text-2xl md:text-3xl font-sans font-bold">مقترح لك</h2>
       </div>
      <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x py-6 -my-6">
        {products.map((p, i) => (
          <div key={i} className="w-[200px] md:w-auto flex-shrink-0 snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Reviews() {
  const reviews = [
    { name: "أحمد عبدالله", text: "جودة الأثاث ممتازة جداً والتوصيل كان في الموعد المحدد. تجربة شراء رائعة تفوق التوقعات.", product: "طقم كنب مودرن" },
    { name: "سارة محمد", text: "خدمة العملاء راقية جداً والمنتجات مطابقة للصور تماماً. شكراً لمنصة ديار على هذا التميز.", product: "طاولة طعام خشبية" },
    { name: "عبدالرحمن علي", text: "تجربة الواقع المعزز ساعدتني كثيراً في اختيار القطعة المناسبة لغرفتي قبل الشراء.", product: "سرير نيو كلاسيك" }
  ];
  return (
    <div className="bg-diyar-cream/50 py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-3xl font-sans font-bold mb-6 md:mb-8 text-center">ماذا قال عملاؤنا</h2>
        <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
          {reviews.map((r, i) => (
             <div key={i} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 relative min-w-[280px] md:min-w-0 snap-start flex-shrink-0 flex flex-col">
               <Quote className="absolute top-6 right-6 text-diyar-cream w-8 md:w-12 h-8 md:h-12 opacity-50 -z-0" />
               <div className="relative z-10 flex flex-col h-full">
                 <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                 </div>
                 <p className="text-gray-700 leading-relaxed mb-6 text-sm md:text-base flex-1">"{r.text}"</p>
                 <div className="flex flex-col border-t border-gray-100 pt-4 mt-auto">
                    <span className="font-bold text-diyar-dark text-sm md:text-base">{r.name}</span>
                    <span className="text-xs md:text-sm text-gray-400">اشترى: {r.product}</span>
                 </div>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Newsletter() {
  return (
    <div className="bg-white py-6 md:py-8">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-sans font-bold mb-4 text-diyar-dark">اشترك في نشرتنا البريدية</h2>
        <p className="text-lg text-gray-500 mb-8">احصل على أحدث العروض، ونصائح الديكور، والمنتجات الجديدة مباشرة في صندوق الوارد الخاص بك.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <input 
            type="email" 
            placeholder="أدخل بريدك الإلكتروني" 
            className="flex-1 bg-diyar-cream/50 border border-gray-200 rounded-lg px-6 py-4 outline-none focus:border-diyar-brown transition"
          />
          <button className="bg-diyar-brown text-white px-8 py-4 rounded-lg hover:bg-diyar-brown transition flex items-center justify-center gap-2">
            <span>اشتراك</span>
            <Send className="w-5 h-5 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StyleFilter() {
  const styles = [
    { name: "كلاسيكي", desc: "أناقة خالدة وتفاصيل فاخرة", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800" },
    { name: "مودرن", desc: "خطوط نظيفة وتصميم عملي", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600" },
    { name: "نيو كلاسيك", desc: "مزيج بين الفخامة والعملية", img: "https://images.unsplash.com/photo-1595428774223-ef52624120ec?auto=format&fit=crop&q=80&w=600" },
    { name: "بساطة (Minimal)", desc: "هدوء وتصميم خالي من التعقيد", img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600" },
    { name: "خشبي طبيعي", desc: "دفء الطبيعة في منزلك", img: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&q=80&w=600" }
  ];
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="text-center mb-6 md:mb-10">
        <span className="text-diyar-brown text-sm md:text-base font-bold mb-3 block">تنوع الأذواق</span>
        <h2 className="text-2xl md:text-5xl font-sans font-bold text-diyar-dark">تسوق حسب الأسلوب</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-5 md:h-[600px]">
        {styles.map((s, i) => (
          <div key={i} className={`rounded-xl md:rounded-xl overflow-hidden relative group cursor-pointer flex flex-col justify-end ${
            i === 0 ? 'md:col-span-2 md:row-span-2 h-80 md:h-full' : 'md:col-span-1 md:row-span-1 h-56 md:h-full'
          }`}>
            <img 
              src={s.img} 
              alt={s.name} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark/90 via-diyar-dark/20 to-transparent"></div>
            <div className="relative z-10 p-6 md:p-8 transform transition-transform duration-500 md:translate-y-4 group-hover:translate-y-0">
              <span className="block font-sans font-bold text-xl md:text-3xl text-white mb-2">{s.name}</span>
              <span className="block text-white/80 text-sm md:text-base opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIBanner() {
  return (
    <div className="bg-[#132624] text-white py-8 md:py-12 my-8 md:my-10 mx-4 md:mx-auto relative overflow-hidden rounded-3xl max-w-7xl shadow-md">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#947961]/20 rounded-full blur-[130px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#1a4a42]/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        
        <div className="w-full md:w-1/2 text-center md:text-right order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md shadow-md text-[#d2b694] font-bold rounded-full mb-6 md:mb-8 text-sm">
            <Sparkles size={16} className="animate-pulse" />
            <span>تقنية المساعد الشخصي من ديار</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-bold mb-6 text-[#f3ecdb] leading-[1.4]">
            المستقبل هنا. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#d2b694] to-white">صمم غرفتك بلمسة خيال!</span>
          </h2>
          <p className="mb-8 md:mb-10 text-gray-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0 font-light">
            لا داعي للتخيل بعد الآن. صور مساحتك، وسيقوم المساعد الشخصي المتقدم بتحليل الأبعاد والنمط، ليدمج قطع الأثاث المثالية بواقعية مذهلة، لترى غرفتك قبل التنفيذ.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button className="flex items-center justify-center gap-3 bg-[#947961] text-white px-8 py-4 rounded-lg hover:bg-[#7a6450] hover:scale-105 transition-all duration-300 text-lg shadow-md font-bold group border border-[#947961]/50 w-full sm:w-auto">
              <UploadCloud className="group-hover:-translate-y-1 transition-transform" />
              <span>جرب غرفتك الآن</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 px-8 py-4 rounded-lg hover:bg-white/5 transition-colors text-lg font-bold w-full sm:w-auto">
              شاهد التفاصيل
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center">
          <div className="relative w-full max-w-lg aspect-[4/3] bg-[#1a3330] rounded-xl overflow-hidden shadow-md border border-white/10 ring-1 ring-white/5 mx-auto">
            
            {/* Before Image */}
            <img src="/before.png" alt="Empty Room Before" className="absolute inset-0 w-full h-full object-cover filter grayscale-[20%] opacity-90" />
            
            {/* After Image and Clip */}
            <div className="absolute inset-0 animate-[sweep_4s_ease-in-out_infinite]">
               <img src="/after.png" alt="Room After AI Placement" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            
            {/* Animated scanning line synced with clip path */}
            <div className="absolute top-0 bottom-0 w-1 bg-[#d2b694] shadow-md animate-[scan-x_4s_ease-in-out_infinite] -ml-[2px] z-10 flex flex-col items-center justify-center">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-[#132624] border-2 border-[#d2b694] rounded-full shadow-md flex items-center justify-center -translate-x-[14px] md:-translate-x-[18px]">
                 <Sparkles size={16} className="text-[#d2b694]" />
               </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-black/50 border border-white/10 backdrop-blur-md px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-xs font-bold text-gray-300 shadow-md z-0">
               المساحة الأصلية
            </div>
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-gradient-to-r from-[#947961] to-[#7a6450] px-4 py-1.5 md:px-5 md:py-2 rounded-lg text-xs md:text-sm font-bold text-white shadow-md z-20 flex items-center gap-2 border border-white/20">
               <Sparkles size={16} className="text-yellow-200" />
               ترتيب المساعد الشخصي
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export function PartnerBanner() {
  return (
    <div className="max-w-7xl mx-auto px-4 my-8 md:my-12">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl p-8 md:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-md">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-diyar-brown/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-diyar-cream/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>

        {/* Text and Actions Content */}
        <div className="w-full lg:translate-x-0 lg:w-1/2 relative z-10 text-center lg:text-right flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 shadow-sm self-center lg:self-start">
            <Store size={16} className="text-diyar-cream" />
            <span className="text-diyar-cream text-sm font-bold">شركاء النجاح في ديار</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-white mb-6 leading-snug">
            انضم إلى مجتمع ديار <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#d4b08c] to-yellow-500">وابدأ قصة نجاحك</span>
          </h2>
          
          <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-light">
            سواءً كنت تاجر أثاث تبحث عن توسيع نطاق أعمالك، أو مقدم خدمات، أو مسوق مبدع، منصة ديار هي بوابتك للنمو المالي والمهني.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button className="flex items-center justify-center gap-2 bg-diyar-cream text-diyar-dark px-8 py-4 rounded-xl font-bold hover:bg-white hover:-translate-y-1 transition-all duration-300 shadow-md group">
              <Store className="group-hover:scale-110 transition-transform text-diyar-brown" size={20} />
              <span>سجل كتاجر</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 group">
              <Sparkles className="group-hover:scale-110 transition-transform text-yellow-500" size={20} />
              <span>اكتشف المزيد</span>
            </button>
          </div>
        </div>

        {/* Bento Grid layout for cards */}
        <div className="w-full lg:w-1/2 relative z-10 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[1.5rem] hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden backdrop-blur-sm flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-diyar-brown/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="w-14 h-14 bg-diyar-brown/20 border border-diyar-brown/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                 <Briefcase className="text-diyar-cream" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">مسوق بالعمولة</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">سوق لمنتجات ديار واحصل على عمولات وتتبع أرباحك لحظة بلحظة.</p>
              <div className="inline-flex items-center gap-1.5 text-diyar-brown text-sm font-bold group-hover:text-[#d4b08c] transition-colors mt-6">
                <span>انضم كمسوق</span>
                <ArrowLeft size={16} />
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[1.5rem] hover:bg-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden backdrop-blur-sm flex flex-col">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-diyar-cream/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2"></div>
              <div className="w-14 h-14 bg-diyar-cream/20 border border-diyar-cream/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                 <Paintbrush className="text-diyar-cream" size={28} />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">مقدم خدمات</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">قدم خدماتك في التصميم والتركيب والصيانة لشريحة واسعة من العملاء.</p>
              <div className="inline-flex items-center gap-1.5 text-diyar-cream/80 text-sm font-bold group-hover:text-diyar-cream transition-colors mt-6">
                <span>سجل مهنتك</span>
                <ArrowLeft size={16} />
              </div>
            </div>
          </div>
          
          <div className="bg-diyar-brown/10 border border-diyar-brown/20 p-6 md:p-8 rounded-[1.5rem] hover:bg-diyar-brown/20 transition-all duration-300 group cursor-pointer flex flex-col sm:flex-row items-center gap-6 justify-between relative overflow-hidden backdrop-blur-sm">
            <div className="relative z-10 text-center sm:text-right w-full sm:w-[60%] flex flex-col items-center sm:items-start">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">لوحة تحكم متكاملة</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">أدوات احترافية لإدارة مبيعاتك، متابعة طلباتك، والتواصل مع عملائك بسهولة.</p>
              <div className="inline-flex items-center gap-2 text-white bg-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
                <Store size={16} />
                <span>شاهد العرض التجريبي</span>
              </div>
            </div>
            <div className="w-full sm:w-[40%] flex justify-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
               <img src="/laptop.png" alt="لوحة تحكم" className="w-40 md:w-56 object-contain drop-shadow-md" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export function ShopByRoom() {
  const rooms = [
    { name: "غرفة المعيشة", img: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=600" },
    { name: "غرفة النوم", img: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600" },
    { name: "غرفة الطعام", img: "https://images.unsplash.com/photo-1617806118233-0011f1823578?auto=format&fit=crop&q=80&w=600" },
    { name: "المكتب المنزلي", img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600" },
    { name: "الحديقة والجلسات الخارجية", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600" }
  ];
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
       <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-4xl font-sans font-bold text-diyar-dark mb-4">تسوق حسب غرفتك</h2>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto">تصفح منتجاتنا مصنفة حسب مساحات منزلك لتجربة تسوق أسهل وأكثر إلهاماً.</p>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {rooms.map((room, i) => (
            <div key={i} className="h-44 md:h-60 rounded-xl overflow-hidden relative group cursor-pointer shadow-sm border border-gray-100">
               <img
                 src={room.img}
                 alt={room.name}
                 referrerPolicy="no-referrer"
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600";
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark/80 via-black/20 to-transparent transition-opacity group-hover:from-diyar-dark/90"></div>
               <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 text-white text-center">
                 <h3 className="text-lg md:text-2xl font-bold font-sans mb-1 md:mb-2">{room.name}</h3>
                 <span className="text-xs md:text-sm border border-white/40 px-3 md:px-4 py-1 md:py-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 inline-block">تسوق الآن</span>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

export function FeaturedStores() {
  const stores = [
    { name: "مفروشات الرقي", rating: 4.8, products: 340, logo: "https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=200" },
    { name: "روائع الخشب", rating: 4.9, products: 120, logo: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=200" },
    { name: "الزاوية الحديثة", rating: 4.7, products: 890, logo: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=200" },
    { name: "أناقة المنزل", rating: 4.6, products: 45, logo: "https://images.unsplash.com/photo-1510511459019-5dee99c4bd16?auto=format&fit=crop&q=80&w=200" },
    { name: "لمسات فنية", rating: 4.9, products: 210, logo: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=200" },
    { name: "بيت التصميم", rating: 4.5, products: 86, logo: "https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=200" }
  ];
  return (
    <div className="bg-gray-50 py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6 md:mb-10">
           <div>
             <span className="text-diyar-brown text-sm font-bold mb-2 block">شركاء النجاح</span>
             <h2 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark">متاجر مميزة على ديار</h2>
           </div>
           <button className="hidden md:flex text-diyar-brown font-bold items-center gap-2 hover:text-diyar-dark transition">
             عرض كل المتاجر <ArrowLeft size={18} />
           </button>
        </div>
        <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 md:gap-4 pb-2 scrollbar-hide snap-x">
          {stores.map((store, i) => (
             <Link to={`/store/${i+1}`} key={i} className="min-w-[140px] md:min-w-0 bg-white rounded-xl p-4 md:p-3 border border-gray-100 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center shrink-0 snap-start">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 p-1 mb-3 overflow-hidden border border-gray-200">
                  <img 
                    src={store.logo} 
                    alt={store.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=60&w=200";
                    }}
                  />
                </div>
                <h3 className="text-sm md:text-base font-bold text-diyar-dark mb-1 line-clamp-1">{store.name}</h3>
                <div className="flex flex-col xl:flex-row items-center gap-1 text-yellow-500 mb-3 md:mb-3">
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="currentColor" className="md:w-[14px] md:h-[14px]" />
                    <span className="text-gray-600 text-[10px] md:text-xs font-medium mr-0.5">{store.rating}</span>
                  </div>
                  <span className="text-gray-400 text-[9px] md:text-[10px] font-normal">({store.products} منتج)</span>
                </div>
                <div className="w-full py-1.5 md:py-2 text-xs md:text-sm auto rounded-lg border border-gray-200 text-diyar-dark font-medium group-hover:bg-diyar-brown group-hover:text-white group-hover:border-diyar-dark transition mt-auto">
                   تصفح المتجر
                </div>
             </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SummerBanner() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-8">
      <div className="rounded-xl md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
        <img 
          src="/بنر عروض الصيف.png" 
          alt="عروض الصيف" 
          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700" 
        />
      </div>
    </div>
  );
}

export function SummerBanner2() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="rounded-xl md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group bg-diyar-cream/20">
        <img 
          src="/بنر عروض الصيف 2.png" 
          alt="عروض الصيف 2" 
          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-700" 
        />
      </div>
    </div>
  );
}

export function WhyChooseDiyar() {
  const features = [
    { title: "خيارات لا محدودة", desc: "آلاف القطع من عشرات المتاجر الموثوقة", icon: <Grid size={32} /> },
    { title: "الواقع المعزز", desc: "جرّب الأثاث في مساحتك قبل الشراء", icon: <Sparkles size={32} /> },
    { title: "شحن وتركيب", desc: "خدمات شحن آمنة مع خيارات للتركيب", icon: <UploadCloud size={32} /> },
    { title: "دفع آمن ومرن", desc: "طرق دفع متعددة مع خيارات التقسيط", icon: <Quote size={32} className="opacity-0 hidden" /> } // Note: using dummy icons if specific ones are missing, replacing below
  ];
  return (
    <div className="py-6 md:py-8 border-b border-gray-100">
       <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 md:gap-8 text-center pb-4 md:pb-0 scrollbar-hide snap-x">
             <div className="flex flex-col items-center bg-gray-50 md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-xl md:rounded-none min-w-[240px] md:min-w-0 snap-start border border-gray-100 md:border-none">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white md:bg-diyar-cream rounded-xl flex items-center justify-center text-diyar-brown mb-4 md:mb-6 rotate-3 hover:rotate-0 transition-transform shadow-sm md:shadow-none">
                   <Star size={28} className="md:w-8 md:h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2 md:mb-3">خيارات لا محدودة</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">آلاف القطع الفريدة من عشرات المتاجر والمصانع الموثوقة في مكان واحد.</p>
             </div>
             <div className="flex flex-col items-center bg-gray-50 md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-xl md:rounded-none min-w-[240px] md:min-w-0 snap-start border border-gray-100 md:border-none">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white md:bg-diyar-cream rounded-xl flex items-center justify-center text-diyar-brown mb-4 md:mb-6 -rotate-3 hover:rotate-0 transition-transform shadow-sm md:shadow-none">
                   <Sparkles size={28} className="md:w-8 md:h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2 md:mb-3">تقنية الواقع المعزز</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">خاصية تجربة الأثاث في غرفتك وتخيل المساحة قبل إتمام الشراء.</p>
             </div>
             <div className="flex flex-col items-center bg-gray-50 md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-xl md:rounded-none min-w-[240px] md:min-w-0 snap-start border border-gray-100 md:border-none">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white md:bg-diyar-cream rounded-xl flex items-center justify-center text-diyar-brown mb-4 md:mb-6 rotate-3 hover:rotate-0 transition-transform shadow-sm md:shadow-none">
                   <svg width="28" height="28" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2 md:mb-3">توصيل سريع وتركيب</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">نوفر خدمات شحن آمنة وسريعة مع خيارات التركيب لراحتك التامة.</p>
             </div>
             <div className="flex flex-col items-center bg-gray-50 md:bg-transparent p-6 md:p-0 rounded-xl md:rounded-xl md:rounded-none min-w-[240px] md:min-w-0 snap-start border border-gray-100 md:border-none">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white md:bg-diyar-cream rounded-xl flex items-center justify-center text-diyar-brown mb-4 md:mb-6 -rotate-3 hover:rotate-0 transition-transform shadow-sm md:shadow-none">
                   <svg width="28" height="28" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2 md:mb-3">دفع آمن ومرن</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">بوابات دفع مشفرة وآمنة بالكامل مع توفر خيارات التقسيط السهلة الميسرة.</p>
             </div>
          </div>
       </div>
    </div>
  );
}

export function DesignBlog() {
  const posts = [
    { title: "الدليل الشامل لاختيار ألوان غرفة المعيشة في 2024", category: "نصائح ديكور", date: "١٥ مايو", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600" },
    { title: "كيف تدمج النمط الكلاسيكي مع العصري بدون أخطاء؟", category: "أفكار تصميمية", date: "١٠ مايو", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600" },
    { title: "٥ قطع أساسية لا غنى عنها في منزلك الجديد", category: "أساسيات المنزل", date: "٠٢ مايو", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600" }
  ];
  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-end mb-6 md:mb-10">
        <div>
           <span className="text-diyar-brown text-sm font-bold mb-2 block">مدونة ديار</span>
           <h2 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark">أفكار وإلهام لمنزلك</h2>
        </div>
        <button className="hidden md:flex text-diyar-brown font-bold items-center gap-2 hover:text-diyar-dark transition">
           كل المقالات <ArrowLeft size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {posts.map((post, i) => (
           <Link to={`/blog/${i + 1}`} key={i} className="group cursor-pointer block">
              <div className="w-full h-60 rounded-xl md:rounded-xl overflow-hidden mb-6 relative">
                 <img 
                   src={post.img} 
                   alt={post.title} 
                   referrerPolicy="no-referrer"
                   className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                   onError={(e) => {
                     (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=60&w=600";
                   }}
                 />
                 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-diyar-brown">
                   {post.category}
                 </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                 <span>{post.date}</span>
                 <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                 <span>يستغرق ٣ دقائق قراءة</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-sans text-diyar-dark leading-snug group-hover:text-diyar-brown transition">
                {post.title}
              </h3>
           </Link>
        ))}
      </div>
    </div>
  );
}

export function AppPromo() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-8 md:pb-12">
      <div className="bg-gradient-to-br from-diyar-dark to-[#342D25] rounded-3xl relative flex flex-col md:flex-row items-stretch shadow-md">

        {/* Abstract shapes (clipped to the rounded box) */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-diyar-brown/30 rounded-full mix-blend-color-dodge filter blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-full mix-blend-color-dodge filter blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 relative z-10 text-center md:text-right flex flex-col justify-center">
          <div className="inline-flex self-center md:self-start items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-diyar-cream mb-6 backdrop-blur-md border border-white/10">
            <Smartphone size={14} />
            <span className="text-xs font-bold">تطبيق ديار الجديد</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.4] font-sans">
            تسوق أثاثك المفضل <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-diyar-cream to-amber-300">أينما كنت!</span>
          </h2>
          
          <p className="text-base text-white/70 mb-8 leading-relaxed font-medium">
            حمل الإلهام في جيبك. تجربة تسوق أسرع، عروض حصرية، وميزة الواقع المعزز.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8 text-right hidden lg:grid">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                <Box size={16} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">الواقع المعزز</h4>
                <p className="text-white/60 text-[10px]">جرب الأثاث في غرفتك</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-diyar-cream shrink-0">
                <Scan size={16} />
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">بحث بالصور</h4>
                <p className="text-white/60 text-[10px]">ابحث بعدسة الكاميرا</p>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center md:justify-start gap-3">
             <button className="transition-transform hover:scale-105 active:scale-95">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-10 md:h-12 w-auto" />
             </button>
             <button className="transition-transform hover:scale-105 active:scale-95">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10 md:h-12 w-auto" />
             </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 relative min-h-[230px] md:min-h-[260px] flex justify-center items-end mt-4 md:mt-0">
            <img
              src="/app mockup.png"
              alt="Diyar App Mockup"
              referrerPolicy="no-referrer"
              className="w-[62%] sm:w-[46%] md:w-auto md:h-[120%] md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 max-w-[420px] h-auto object-contain z-20 drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500"
            />
        </div>

      </div>
    </div>
  );
}

export function FastOffersSlider() {
  const offers = [
    { 
      img: "/panel%204.png",
      color: "bg-diyar-brown",
      span: "md:col-span-3"
    },
    { 
      img: "/panel%205.png",
      color: "bg-diyar-brown",
      span: "md:col-span-3"
    },
    { 
      img: "/panel%201.png",
      color: "bg-diyar-brown",
      span: "md:col-span-2"
    },
    { 
      img: "/panel%202.png",
      color: "bg-diyar-brown",
      span: "md:col-span-2"
    },
    { 
      img: "/panel%203.png",
      color: "bg-gray-800",
      span: "md:col-span-2"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
        {offers.map((offer, i) => (
          <div key={i} className={`col-span-1 ${offer.span} w-full aspect-[2/1] rounded-lg overflow-hidden relative shadow-md hover:shadow-md transition-all duration-300 group cursor-pointer ${offer.color}`}>
            <img 
              src={offer.img} 
              alt={`Banner ${i + 1}`} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoyaltyPromo() {
  return (
    <div className="max-w-7xl mx-auto px-4 my-8 md:my-12">
      <div className="bg-[#FFFDF8] rounded-3xl border border-[#F2DEB4]/50 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-[#F9E8C8]/80 to-transparent blur-3xl z-0 -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10 w-full items-center">
          
          {/* Content side */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center text-right order-2 lg:order-1">
            <div className="w-fit bg-amber-100/80 border border-amber-200/60 rounded-full px-4 py-1.5 flex items-center gap-2 mb-6">
               <span className="flex items-center justify-center w-5 h-5 bg-amber-500 rounded-full text-white">
                 <Sparkles size={12} />
               </span>
               <span className="text-amber-800 text-sm font-bold">برنامج ولاء ديار</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold text-[#3D2E1F] leading-[1.4] mb-5">
              كل عملية شراء هي بداية <br /> لمكافأة جديدة
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-lg leading-relaxed">
              تسوق، اجمع النقاط، وحولها إلى قسائم شرائية. استمتع بتجربة تسوق فريدة ومربحة مع ديار لأن ولائك يستحق التقدير والعطاء.
            </p>

            <div className="flex flex-col gap-5 mb-10">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm relative overflow-hidden group">
                   <div className="absolute inset-0 bg-amber-50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                   <Gift size={24} className="relative z-10" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#3D2E1F] text-lg mb-1">تسوق واربح</h4>
                   <p className="text-gray-500 text-sm leading-relaxed">اكسب النقاط بشكل تلقائي مع كل عملية دفع ناجحة عبر المنصة.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm relative overflow-hidden group">
                   <div className="absolute inset-0 bg-amber-50 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                   <ShieldCheck size={24} className="relative z-10" />
                 </div>
                 <div>
                   <h4 className="font-bold text-[#3D2E1F] text-lg mb-1">استبدال مرن</h4>
                   <p className="text-gray-500 text-sm leading-relaxed">استخدم نقاطك في أي وقت لشراء منتجاتك المفضلة بخصومات حصرية.</p>
                 </div>
              </div>
            </div>

            <Link to="/loyalty" className="bg-[#3D2E1F] text-white px-8 py-4 rounded-full font-bold hover:bg-[#2A1F15] transition-all inline-flex items-center gap-3 w-fit group">
              <span>استكشف عروض الولاء</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={14} />
              </div>
            </Link>
          </div>

          {/* Visual side */}
          <div className="bg-[#F8EBCD] h-full min-h-[400px] flex items-center justify-center p-8 lg:p-0 relative overflow-hidden order-1 lg:order-2 border-b lg:border-b-0 lg:border-r border-amber-200/50">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] z-0"></div>
             
             {/* Circular decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] xl:w-[400px] h-[300px] xl:h-[400px] border border-amber-200 rounded-full z-0"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] xl:w-[540px] h-[400px] xl:h-[540px] border border-amber-200/50 rounded-full z-0 border-dashed"></div>

             <div className="relative z-10 w-full max-w-[280px] md:max-w-[340px] xl:max-w-[420px] transition-transform duration-700 hover:scale-105">
                <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-2xl -z-10"></div>
                <img src="/صورة نقاط الولاء.png" alt="ديار ولاء" className="w-full drop-shadow-md" />
             </div>

             {/* Floating elements */}
             <div className="absolute top-[20%] right-[15%] w-14 h-14 bg-white rounded-xl rotate-12 shadow-md flex items-center justify-center animate-bounce">
                <Sparkles size={24} className="text-amber-500" />
             </div>
             <div className="absolute bottom-[20%] left-[15%] w-12 h-12 bg-white rounded-full -rotate-12 shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                <Gift size={20} className="text-amber-600" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function BrandsStrip() {
  const brands = [
    {
      name: "إيكيا",
      logo: (
        <svg viewBox="0 0 120 40" className="h-8 md:h-12 w-auto">
          <rect width="120" height="40" fill="#0051ba" />
          <ellipse cx="60" cy="20" rx="55" ry="18" fill="#ffda1a" />
          <text x="60" y="28" fill="#0051ba" fontFamily="Impact, Arial Black, sans-serif" fontSize="24" fontWeight="bold" textAnchor="middle" letterSpacing="1">IKEA</text>
        </svg>
      )
    },
    {
      name: "أشلي",
      logo: (
        <svg viewBox="0 0 140 40" className="h-8 md:h-10 w-auto">
          <text x="70" y="28" fill="#e87722" fontFamily="Georgia, serif" fontSize="26" fontWeight="bold" fontStyle="italic" textAnchor="middle">Ashley.</text>
        </svg>
      )
    },
    {
      name: "ويست إلم",
      logo: (
        <svg viewBox="0 0 140 30" className="h-6 md:h-8 w-auto">
          <text x="70" y="22" fill="#333" fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="bold" textAnchor="middle" letterSpacing="2">WEST ELM</text>
        </svg>
      )
    },
    {
      name: "بوكونسبت",
      logo: (
        <svg viewBox="0 0 140 30" className="h-6 md:h-8 w-auto">
          <text x="70" y="22" fill="#000" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" textAnchor="middle" letterSpacing="1">BoConcept</text>
        </svg>
      )
    },
    {
      name: "بوتري بارن",
      logo: (
        <svg viewBox="0 0 200 30" className="h-5 md:h-7 w-auto">
          <text x="100" y="22" fill="#111" fontFamily="Times New Roman, serif" fontSize="22" fontWeight="normal" textAnchor="middle" letterSpacing="1">P O T T E R Y  B A R N</text>
        </svg>
      )
    },
    {
      name: "ناتوزي",
      logo: (
        <svg viewBox="0 0 140 30" className="h-5 md:h-7 w-auto">
          <text x="70" y="22" fill="#000" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" letterSpacing="4">NATUZZI</text>
        </svg>
      )
    },
    {
      name: "هيرمان ميلر",
      logo: (
        <svg viewBox="0 0 180 40" className="h-8 md:h-12 w-auto">
          <circle cx="20" cy="20" r="14" fill="#d00000" />
          <text x="100" y="26" fill="#000" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" textAnchor="middle" letterSpacing="1">HermanMiller</text>
        </svg>
      )
    },
    {
      name: "موجي",
      logo: (
        <svg viewBox="0 0 100 30" className="h-6 md:h-9 w-auto">
          <rect width="100" height="30" fill="#7f0019" />
          <text x="50" y="21" fill="white" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="bold" textAnchor="middle" letterSpacing="2">MUJI</text>
        </svg>
      )
    },
  ];

  return (
    <div className="bg-white py-8 border-y border-gray-100 overflow-hidden flex" dir="ltr">
        <div className="flex animate-marquee shrink-0 gap-16 md:gap-32 pr-16 md:pr-32 items-center w-max">
          {[...brands, ...brands, ...brands, ...brands].map((brand, i) => (
             <div key={i} className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer shrink-0 min-w-[120px] md:min-w-[160px] min-h-[60px]">
               {brand.logo}
             </div>
          ))}
        </div>
    </div>
  );
}

export function ServicesSection() {
  const services = [
    { id: 1, name: "تصميم داخلي متكامل", provider: "إيوان للتصميم", rating: 4.9, price: "يبدأ من 50 ر.س/م٢", image: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "تفصيل خزائن غرف نوم", provider: "نجارة الأحمد", rating: 4.7, price: "حسب المقاس", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400" },
    { id: 3, name: "صيانة وتنجيد الكنب", provider: "لمسة خبير", rating: 4.8, price: "يبدأ من 200 ر.س", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=400" },
    { id: 4, name: "تنسيق حدائق منزلية", provider: "طبيعة للتنسيق", rating: 4.6, price: "يبدأ من 100 ر.س/م٢", image: "https://images.unsplash.com/photo-1558904541-efa843a96f0f?auto=format&fit=crop&q=80&w=400" },
  ];

  return (
    <div className="py-6 md:py-8 bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
           <div>
             <span className="text-purple-600 text-sm font-bold mb-2 block">خدمات ديار</span>
             <h2 className="text-2xl md:text-3xl font-sans font-bold text-diyar-dark flex items-center gap-3">
               <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                 <Paintbrush size={20} />
               </div>
               خدمات التصميم والصيانة
             </h2>
           </div>
           <Link to="/search?q=services" className="hidden md:flex text-diyar-brown font-bold items-center gap-2 hover:text-diyar-dark transition">
             عرض كل الخدمات <ArrowLeft size={18} />
           </Link>
        </div>
        <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-4 pb-4 scrollbar-hide snap-x pt-2">
          {services.map((service, i) => (
            <Link to={`/service/${service.id}`} key={i} className="min-w-[280px] md:min-w-0 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all snap-start group">
              <div className="h-40 relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-200" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400";
                  }}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> {service.rating}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-diyar-dark text-base mb-1">{service.name}</h3>
                <p className="text-gray-500 mb-3 text-sm flex items-center gap-1.5">
                  <Store size={14} /> <span className="font-medium text-diyar-dark">{service.provider}</span>
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                   <span className="font-bold text-diyar-brown text-sm">{service.price}</span>
                   <div className="flex items-center text-xs text-diyar-dark font-medium gap-1 bg-diyar-cream/30 px-3 py-1.5 rounded-lg border border-diyar-cream group-hover:bg-diyar-brown group-hover:text-white transition-colors">
                     طلب تنفيذ
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MostInteractiveProducts() {
  const railRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState([
    {
      id: 1,
      name: "طقم كنب زاوية مخملي رويال فاخر",
      vendor: "مفروشات الرقي",
      price: 4500,
      oldPrice: 5600,
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400",
      views: 2450,
      likes: 312,
      saves: 184,
      liked: false,
      saved: false,
      hotScore: 94
    },
    {
      id: 2,
      name: "سرير مزدوج مودرن بتصميم هادئ",
      vendor: "بيت الراحة",
      price: 2200,
      oldPrice: 3100,
      img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400",
      views: 1890,
      likes: 245,
      saves: 142,
      liked: false,
      saved: false,
      hotScore: 89
    },
    {
      id: 3,
      name: "طاولة طعام إكسباند دائرية من الخشب الطبيعي",
      vendor: "روائع الخشب",
      price: 2100,
      oldPrice: 2800,
      img: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=600",
      views: 1530,
      likes: 198,
      saves: 95,
      liked: false,
      saved: false,
      hotScore: 85
    },
    {
      id: 4,
      name: "خزانة ملابس 6 أبواب واسعة وعملية",
      vendor: "إيكيا",
      price: 1950,
      oldPrice: 2400,
      img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400",
      views: 3120,
      likes: 421,
      saves: 233,
      liked: false,
      saved: false,
      hotScore: 98
    },
    {
      id: 5,
      name: "كرسي استرخاء مخملي مريح جداً",
      vendor: "أشلي",
      price: 1200,
      oldPrice: 1700,
      img: "https://images.unsplash.com/photo-1598300042247-d317bd127e7b?auto=format&fit=crop&q=80&w=400",
      views: 1210,
      likes: 156,
      saves: 78,
      liked: false,
      saved: false,
      hotScore: 78
    }
  ]);

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          liked: !item.liked,
          likes: item.liked ? item.likes - 1 : item.likes + 1,
          hotScore: item.liked ? item.hotScore - 1 : item.hotScore + 2
        };
      }
      return item;
    }));
  };

  const handleSave = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          saved: !item.saved,
          saves: item.saved ? item.saves - 1 : item.saves + 1,
          hotScore: item.saved ? item.hotScore - 2 : item.hotScore + 3
        };
      }
      return item;
    }));
  };

  return (
    <div className="bg-gradient-to-b from-white to-diyar-cream/10 py-8 md:py-8 border-t border-b border-gray-100/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-diyar-brown text-xs md:text-sm font-bold">الآن مباشر</span>
            </div>
            <h2 className="text-xl md:text-3xl font-sans font-bold text-diyar-dark flex items-center gap-2">
              الأكثر تفاعلاً ونشاطاً 🔥
            </h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">المنتجات الأكثر تصفحاً، إعجاباً وحفظاً من قبل المتسوقين في الساعات الماضية</p>
          </div>
          <Link to="/category/all" className="text-diyar-brown text-xs md:text-sm font-bold hover:text-diyar-dark transition shrink-0">
            تصفح الكل
          </Link>
        </div>

        <div className="relative">
        <RailArrows scroller={railRef} />
        <div ref={railRef} className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x py-4">
          {items.map((item) => (
            <div key={item.id} className="w-[280px] md:w-[320px] bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all shrink-0 snap-start overflow-hidden flex flex-col group relative">
              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                  🔥 {item.hotScore}% تفاعل
                </span>
              </div>

              {/* Product Image */}
              <Link to={`/product/${item.id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-50">
                <img 
                  src={item.img} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=60&w=600";
                  }}
                />
                
                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                  <button 
                    onClick={(e) => handleSave(item.id, e)}
                    className={`p-2 rounded-full shadow-md bg-white/90 backdrop-blur-md transition-all ${item.saved ? 'text-diyar-brown scale-105' : 'text-gray-400 hover:text-diyar-brown'}`}
                  >
                    <Bookmark size={18} fill={item.saved ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={(e) => handleLike(item.id, e)}
                    className={`p-2 rounded-full shadow-md bg-white/90 backdrop-blur-md transition-all ${item.liked ? 'text-red-500 scale-105 animate-pulse' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={18} fill={item.liked ? "currentColor" : "none"} />
                  </button>
                </div>
              </Link>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-diyar-brown font-semibold mb-1">
                    <span>{item.vendor}</span>
                  </div>
                  <Link to={`/product/${item.id}`} className="block hover:text-diyar-brown transition">
                    <h3 className="font-bold text-diyar-dark text-sm leading-snug line-clamp-2 min-h-[40px] mb-2">{item.name}</h3>
                  </Link>
                </div>

                <div>
                  {/* Prices & Stats */}
                  <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 line-through">د.إ {item.oldPrice}</span>
                      <span className="text-base font-bold text-diyar-dark">د.إ {item.price}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100/50">
                      <span className="text-[10px] font-bold text-red-600">نشط جداً</span>
                    </div>
                  </div>

                  {/* Real-time Interaction Bar */}
                  <div className="mt-3 bg-gray-50 p-2 rounded-lg flex items-center justify-between text-[11px] text-gray-500 border border-gray-100/40">
                    <span className="flex items-center gap-1">
                      <Eye size={13} className="text-gray-400" />
                      <strong>{item.views}</strong> مشاهدة
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={13} className="text-red-400 fill-red-400" />
                      <strong>{item.likes}</strong> إعجاب
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark size={13} className="text-diyar-brown fill-diyar-brown" />
                      <strong>{item.saves}</strong> حفظ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
