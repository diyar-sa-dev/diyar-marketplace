import React, { useState } from 'react';
import { Search, Filter, Link as LinkIcon, Share2, Copy } from 'lucide-react';

export default function AffiliateProducts() {
  const [searchTerm, setSearchTerm] = useState('');

  const MOCK_PRODUCTS = [
    { id: 1, name: 'أريكة استرخاء مخملية', store: 'مفروشات الرياض', price: 1250, commission: '10%', earn: 125, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300' },
    { id: 2, name: 'طاولة طعام خشبية', store: 'روائع الخشب', price: 2400, commission: '8%', earn: 192, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=300' },
    { id: 3, name: 'كرسي مكتب مريح', store: 'عالم المكاتب', price: 450, commission: '15%', earn: 67.5, image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=300' },
    { id: 4, name: 'طقم إضاءة حديثة', store: 'الإنارة الذكية', price: 320, commission: '12%', earn: 38.4, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=300' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">المنتجات المتاحة للتسويق</h2>
          <p className="text-gray-500 text-sm mt-1">اكتشف المنتجات التي تقدم عمولة، وقم بتوليد روابط التسويق الخاصة بك.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث عن منتج..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm w-full md:w-64"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map(product => (
          <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
            <div className="relative h-48 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded w-fit">
                عمولة {product.commission}
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-1">
              <div className="text-xs text-gray-500 mb-1">{product.store}</div>
              <h3 className="font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
              
               <div className="flex items-center justify-between mb-4 mt-auto">
                 <div>
                   <div className="text-xs text-gray-500">سعر المنتج</div>
                   <div className="font-medium text-gray-900">{product.price} ر.س</div>
                 </div>
                 <div className="text-left">
                   <div className="text-xs text-gray-500">الربح المتوقع</div>
                   <div className="font-bold text-green-600">{product.earn} ر.س</div>
                 </div>
               </div>

              <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                <LinkIcon size={16} />
                توليد رابط تسويق
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
