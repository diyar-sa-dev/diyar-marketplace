import React from 'react';
import { staticAsset } from '../../../lib/media/pictureSources.ts';

const OFFERS = [
  { img: '/panel 4.webp', color: 'bg-diyar-brown', span: 'md:col-span-3' },
  { img: '/panel 5.webp', color: 'bg-diyar-brown', span: 'md:col-span-3' },
  { img: '/panel 1.webp', color: 'bg-diyar-brown', span: 'md:col-span-2' },
  { img: '/panel 2.webp', color: 'bg-diyar-brown', span: 'md:col-span-2' },
  { img: '/panel 3.webp', color: 'bg-gray-800', span: 'md:col-span-2' },
] as const;

const FALLBACK =
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=60&w=800';

export function FastOffersSlider() {
  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
        {OFFERS.map((offer, i) => (
          <div
            key={offer.img}
            className={`col-span-1 ${offer.span} w-full aspect-2/1 rounded-lg overflow-hidden relative shadow-md hover:shadow-md transition-all duration-300 group cursor-pointer ${offer.color}`}
          >
            <img
              src={staticAsset(offer.img)}
              alt={`Banner ${i + 1}`}
              width={800}
              height={400}
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
