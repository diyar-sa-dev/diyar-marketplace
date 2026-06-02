import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Truck, Gift, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ANNOUNCEMENTS = [
  {
    icon: <Gift className="w-4 h-4 text-diyar-cream shrink-0" />,
    text: "خصومات حصرية تصل إلى 40% على تجهيزات الضيافة الفاخرة والمجالس",
    cta: "تسوق العروض",
    link: "/category/deals",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />,
    text: "جرّب مصمم الغرف التفاعلي بالذكاء الاصطناعي في AI Studio",
    cta: "جرّب الآن",
    link: "/search", // leads to search/AI trial
  },
  {
    icon: <Truck className="w-4 h-4 text-diyar-cream shrink-0" />,
    text: "توصيل آمن وتركيب احترافي مجاني لجميع مدن ومناطق المملكة",
    cta: "احسب التوصيل",
    link: "/profile/addresses",
  },
];

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 6000); // Luxury slow pace: 6 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const current = ANNOUNCEMENTS[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length);
  };

  return (
    <div id="top-announcement-bar" className="w-full bg-[#132624] text-[#f3ecdb] border-b border-[#213f3a] text-xs font-medium py-2.5 relative overflow-hidden transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Navigation arrows (Desktop only) */}
        <button 
          onClick={handlePrev}
          className="hidden md:flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer w-6 h-6 hover:bg-white/5 rounded-full"
          title="السابق"
          id="btn-announcement-prev"
        >
          <ChevronRight size={14} />
        </button>

        {/* Dynamic content */}
        <div className="flex-1 flex justify-center items-center overflow-hidden min-h-[20px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center gap-2 md:gap-3 text-center px-4"
            >
              {current.icon}
              <span className="text-[11px] sm:text-xs tracking-wide">
                {current.text}
              </span>
              <span className="hidden sm:inline-block bg-[#947961] text-white text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-opacity-95 transition-all text-xs mr-2">
                {current.cta}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation & dismiss */}
        <div className="flex items-center gap-2">
          {/* Navigation arrow (Desktop copy, for Right side) */}
          <button 
            onClick={handleNext}
            className="hidden md:flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer w-6 h-6 hover:bg-white/5 rounded-full"
            title="التالي"
            id="btn-announcement-next"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Dismiss button */}
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/40 hover:text-[#f3ecdb] hover:bg-white/10 p-1 rounded-full transition-all cursor-pointer mr-2 shrink-0"
            title="إغلاق التنبيه"
            id="btn-announcement-close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
