import React, { useState, useEffect } from 'react';
import ProductCard from '../cards/ProductCard.tsx';

export default function FeaturedDeals() {
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 14 * 60 + 35);
  
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const products = [
    {img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=400", name: "كرسي مخمل ملكي", vendor: "مفروشات الرقي", price: 850, oldPrice: 1200},
    {img: "https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=400", name: "طاولة قهوة فاخرة", vendor: "الزاوية الحديثة", price: 420, oldPrice: 650},
    {img: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?auto=format&fit=crop&q=80&w=400", name: "طقم إضاءة مودرن", vendor: "إضاءات دبي", price: 1100, oldPrice: 1600},
    {img: "https://images.unsplash.com/photo-1587584160352-736021198642?auto=format&fit=crop&q=80&w=400", name: "مرآة بإطار مذهب", vendor: "أناقة المنزل", price: 340, oldPrice: 500},
    {img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=400", name: "سرير مفرد للأطفال", vendor: "بيت التصميم", price: 650, oldPrice: 900},
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-sans font-bold">عروض مميزة</h2>
        <div className="text-sm md:text-xl font-bold bg-diyar-cream p-2 md:p-3 rounded-lg text-diyar-brown" dir="ltr">{format(timeLeft)}</div>
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
