import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, Wrench, Palette, PenTool, LayoutDashboard, Truck, MessageSquare, Plus, User } from 'lucide-react';
import { RequestServiceModal } from '../components/modals/RequestServiceModal.tsx';

const SERVICE_CATEGORIES = [
  { id: 'interior-design', name: 'تصميم داخلي', icon: Palette },
  { id: 'maintenance', name: 'تركيب وصيانة', icon: Wrench },
  { id: 'upholstery', name: 'تنجيد وتجديد', icon: PenTool },
  { id: 'floor-plan', name: 'مخططات معمارية', icon: LayoutDashboard },
  { id: 'moving', name: 'نقل وتغليف', icon: Truck },
];

const MOCK_SERVICES = [
  {
    id: 101,
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400",
    name: "تصميم داخلي متكامل للشقق",
    vendor: "ديار ديزاين",
    price: 150,
    rating: 4.8,
    reviews: 124,
    type: "استشارة ومخطط",
    category: "تصميم داخلي",
  },
  {
    id: 102,
    img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400",
    name: "تركيب غرف نوم كاملة",
    vendor: "ورشة الإنجاز",
    price: 500,
    rating: 4.5,
    reviews: 86,
    type: "تركيب وصيانة",
    category: "تركيب وصيانة",
  },
  {
    id: 103,
    img: "https://images.unsplash.com/photo-1581404176840-0255b7bd4b4c?auto=format&fit=crop&q=80&w=400",
    name: "تصميم 3D للمطابخ",
    vendor: "مكتب الإبداع",
    price: 1200,
    rating: 4.9,
    reviews: 210,
    type: "التنفيذ بالقطعة",
    category: "تصميم داخلي",
  },
  {
    id: 104,
    img: "https://images.unsplash.com/photo-1621293954908-907159247fc8?auto=format&fit=crop&q=80&w=400",
    name: "صيانة وطلاء الأثاث الخشبي",
    vendor: "مختصي الصيانة",
    price: 300,
    rating: 4.2,
    reviews: 45,
    type: "زيارة فنية",
    category: "تنجيد وتجديد",
  },
  {
    id: 105,
    img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    name: "تنجيد كنب ومجالس",
    vendor: "لمسة أناقة للتنجيد",
    price: 800,
    rating: 4.7,
    reviews: 156,
    type: "التنفيذ بالقطعة",
    category: "تنجيد وتجديد",
  },
  {
    id: 106,
    img: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&q=80&w=400",
    name: "نقل أثاث مع الفك والتركيب",
    vendor: "سرعة الإنجاز للنقل",
    price: 600,
    rating: 4.6,
    reviews: 320,
    type: "خدمة متكاملة",
    category: "نقل وتغليف",
  }
];

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const filteredServices = MOCK_SERVICES.filter(service => {
    const matchesSearch = service.name.includes(searchTerm) || service.vendor.includes(searchTerm);
    const matchesCategory = selectedCategory === 'الكل' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-diyar-dark mb-3">الخدمات المتخصصة</h1>
            <p className="text-gray-600 max-w-2xl text-sm md:text-base">
              اكتشف مجموعة واسعة من الخدمات التي يقدمها أفضل الخبراء والمختصين. من التصميم الداخلي إلى التركيب والصيانة، كل ما تحتاجه لتجهيز مساحتك بكل سهولة وموثوقية.
            </p>
          </div>
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="shrink-0 bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold hover:bg-[#8A6D46] transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            طلب تنفيذ مخصص
          </button>
        </div>

        {/* Categories Grid */}
        <div className="flex overflow-x-auto snap-x gap-4 mb-8 pb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('الكل')}
            className={`flex-none min-w-[120px] sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center ${
              selectedCategory === 'الكل'
                ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
            }`}
          >
            <LayoutDashboard className={`w-8 h-8 mb-3 ${selectedCategory === 'الكل' ? 'text-white' : 'text-diyar-brown'}`} />
            <span className="font-bold text-sm">الكل</span>
          </button>
          
          {SERVICE_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`flex-none min-w-[120px] sm:flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 snap-center ${
                selectedCategory === category.name
                  ? 'bg-diyar-dark border-diyar-dark text-white shadow-lg'
                  : 'bg-white border-gray-100 text-gray-600 hover:border-diyar-brown/30 hover:shadow-md'
              }`}
            >
              <category.icon className={`w-8 h-8 mb-3 ${selectedCategory === category.name ? 'text-white' : 'text-diyar-brown'}`} />
              <span className="font-bold text-sm text-center">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ابحث عن خدمة أو مقدم خدمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
          <div className="relative md:w-48 shrink-0">
             <button className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors">
               <Filter size={18} className="text-gray-500" />
               <span>تصفية النتائج</span>
             </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
             <Link to={`/service/${service.id}`} key={service.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
               <div className="relative h-48 overflow-hidden bg-gray-100">
                 <img src={service.img} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-diyar-dark shadow-sm">
                   {service.type}
                 </div>
               </div>
               
               <div className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-diyar-dark line-clamp-2 leading-snug group-hover:text-diyar-brown transition-colors">
                     {service.name}
                   </h3>
                 </div>
                 
                 <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                   <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0 text-gray-500">
                      <User size={12} />
                   </div>
                   <span className="line-clamp-1">{service.vendor}</span>
                 </div>
                 
                 <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                   <div>
                     <span className="text-xs text-gray-400 block mb-0.5">تبدأ من</span>
                     <div className="font-bold text-lg text-diyar-dark">
                       {service.price} <span className="text-xs font-normal text-gray-500">ر.س</span>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs">
                     <Star size={12} className="text-yellow-500 fill-yellow-500" />
                     <span className="font-bold text-yellow-700">{service.rating}</span>
                     <span className="text-yellow-600/60">({service.reviews})</span>
                   </div>
                 </div>
               </div>
             </Link>
          ))}
        </div>
        
        {filteredServices.length === 0 && (
          <div className="text-center py-20">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">لم يتم العثور على خدمات تطابق بحثك</p>
          </div>
        )}

      </div>
      <RequestServiceModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
    </div>
  );
}
