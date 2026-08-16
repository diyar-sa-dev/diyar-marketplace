import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'منصة ديار — أثاث وخدمات متكاملة',
    sub: 'المنصة الأولى التي تجمع بين أفضل تجار الأثاث، ومقدمي خدمات التصميم والتركيب في مكان واحد.',
    btnText: 'تسوق الأثاث',
    img: '/hero_1.jpg',
  },
  {
    title: 'جرّب الأثاث في منزلك بالمساعد الشخصي',
    sub: 'لا تتردد في الاختيار. استخدم تقنيتنا المتطورة لدمج الأثاث في مساحتك الخاصة قبل الشراء.',
    btnText: 'جرب الآن',
    img: '/hero_2.jpg',
  },
  {
    title: 'برنامج ديار للولاء والتسويق بالشراكة',
    sub: 'تسوق واكسب نقاط الولاء، أو انضم كمسوق بالعمولة وابدأ بجني الأرباح مع منصة ديار.',
    btnText: 'انضم كشريك',
    img: '/hero_3.jpg',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white">
      <div className="relative h-[calc(100vh-40px)] w-full overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={slide.img}
              alt={slide.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/80 via-black/40 to-transparent"></div>
            <div className="relative h-full max-w-7xl mx-auto px-6 md:px-20 flex items-end md:items-center justify-center md:justify-start pb-20 md:pb-0 text-center md:text-right">
              <div className="text-white max-w-lg mb-10 md:mb-0">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-sans font-bold mb-4 md:mb-6 leading-snug">
                  {slide.title}
                </h1>
                <p className="text-base md:text-xl mb-8 leading-relaxed opacity-90">{slide.sub}</p>
                <button className="bg-diyar-brown text-white px-8 py-3.5 rounded-xl md:rounded-lg font-sans text-lg hover:bg-[#856b54] transition shadow-lg w-full md:w-auto">
                  {slide.btnText}
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
          className="hidden md:block absolute left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition z-20"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
          className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition z-20"
        >
          <ChevronRight size={24} />
        </button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === current ? 'bg-diyar-brown scale-125' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
