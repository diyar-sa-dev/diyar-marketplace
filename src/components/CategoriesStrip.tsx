import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Sofa, CookingPot, MonitorSmartphone, Paintbrush, Wrench, PackageSearch } from 'lucide-react';
import { assetUrl } from '../utils/assetUrl.ts';

const categories = [
  { id: "bedroom", name: "غرف النوم", icon: BedDouble, img: assetUrl("/categories/%D8%BA%D8%B1%D9%81%20%D8%A7%D9%84%D9%86%D9%88%D9%85.png") },
  { id: "living-room", name: "الصالونات", icon: Sofa, img: assetUrl("/categories/%D8%A7%D9%84%D8%B5%D8%A7%D9%84%D9%88%D9%86%D8%A7%D8%AA.png") },
  { id: "kitchen", name: "المطابخ", icon: CookingPot, img: assetUrl("/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.png") },
  { id: "office", name: "المكاتب", icon: MonitorSmartphone, img: assetUrl("/categories/%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%AA%D8%A8.png") },
  { id: "decor", name: "ديكورات", icon: PackageSearch, img: assetUrl("/categories/%D8%AF%D9%8A%D9%83%D9%88%D8%B1%D8%A7%D8%AA.png") },
  { id: "interior-design", name: "تصميم داخلي", icon: Paintbrush, isService: true, img: assetUrl("/categories/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%AF%D8%A7%D8%AE%D9%84%D9%8A.png") },
  { id: "maintenance", name: "تركيب وصيانة", icon: Wrench, isService: true, img: assetUrl("/categories/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8%20%D9%88%D8%B5%D9%8A%D8%A7%D9%86%D8%A9.png") },
];

export default function CategoriesStrip() {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-6 px-4">
      <div className="flex items-start overflow-x-auto gap-3 md:gap-5 scrollbar-hide snap-x py-6 -my-6 px-4 -mx-4">
        {categories.map((cat, i) => (
          <Link to={`/category/${cat.id}`} key={i} className="flex flex-col items-center flex-shrink-0 cursor-pointer group snap-start w-[115px] md:w-[130px]">
            <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-3xl mb-3 overflow-hidden transition duration-300 group-hover:-translate-y-2 group-hover:shadow-lg flex items-center justify-center ${cat.isService ? 'bg-diyar-dark text-diyar-cream border-2 border-diyar-dark' : 'bg-diyar-cream text-diyar-dark border-2 border-diyar-cream'}`}>
              <img 
                src={cat.img} 
                alt={cat.name} 
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${loadedImages[cat.name] ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoadedImages(prev => ({...prev, [cat.name]: true}))}
                onError={() => setLoadedImages(prev => ({...prev, [cat.name]: false}))}
              />
              <div className={`absolute inset-0 flex items-center justify-center bg-inherit transition-opacity duration-300 ${loadedImages[cat.name] ? 'opacity-0' : 'opacity-100'}`}>
                <cat.icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
            </div>
            <span className="font-medium text-diyar-dark group-hover:text-diyar-brown transition text-xs md:text-sm text-center">{cat.name}</span>
            {cat.isService && <span className="text-[10px] text-diyar-brown mt-1 font-bold">خدمات</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
