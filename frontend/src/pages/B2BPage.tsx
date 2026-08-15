import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Building2, Briefcase, Factory, Plus, BadgeCheck } from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600';

const B2B_COMPANIES = [
  {
    id: '1',
    name: 'مصنع الأخشاب الحديثة',
    logo: 'https://ui-avatars.com/api/?name=م+أ&background=F3ECDB&color=947961&size=100',
    type: 'تصنيع أثاث',
    rating: 4.8,
    reviews: 124,
    location: 'الرياض، الصناعية الثانية',
    description: 'متخصصون في تصنيع الكنب والمجالس العربية بأعلى معايير الجودة للشركات والفنادق.',
    tags: ['كنب', 'مجالس', 'جملة'],
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    name: 'مؤسسة رواد الديكور',
    logo: 'https://ui-avatars.com/api/?name=ر+د&background=F3ECDB&color=947961&size=100',
    type: 'تصميم داخلي',
    rating: 4.9,
    reviews: 86,
    location: 'جدة، شارع التحلية',
    description: 'نقدم خدمات التصميم الداخلي المبتكر للمكاتب والمطاعم والمعارض التجارية.',
    tags: ['تصميم مكاتب', 'مطاعم', 'تنفيذ ديكور'],
    coverImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '3',
    name: 'الشركة العالمية للأقمشة',
    logo: 'https://ui-avatars.com/api/?name=ش+ع&background=F3ECDB&color=947961&size=100',
    type: 'توريد مواد خام',
    rating: 4.7,
    reviews: 210,
    location: 'الدمام، الخالدية',
    description: 'موردون معتمدون لأرقى أنواع الأقمشة والإسفنج لمصانع الأثاث في المملكة.',
    tags: ['أقمشة', 'إسفنج', 'موردين جملة'],
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '4',
    name: 'مصنع الصلب للأثاث المكتبي',
    logo: 'https://ui-avatars.com/api/?name=م+ص&background=F3ECDB&color=947961&size=100',
    type: 'تصنيع أثاث',
    rating: 4.6,
    reviews: 156,
    location: 'الرياض، السلي',
    description: 'تصنيع الأثاث المكتبي المتين والعصري: مكاتب، دواليب، كراسي مريحة للشركات.',
    tags: ['أثاث مكتبي', 'كراسي', 'دواليب'],
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '5',
    name: 'استوديو فينيق للتصميم',
    logo: 'https://ui-avatars.com/api/?name=ف+ت&background=F3ECDB&color=947961&size=100',
    type: 'تصميم داخلي',
    rating: 5.0,
    reviews: 64,
    location: 'الرياض، حي حطين',
    description: 'تصميم وتنفيذ المساحات التجارية والفندقية بلمسة عصرية فاخرة ومخططات ثلاثية الأبعاد.',
    tags: ['فنادق', 'معارض', 'مخططات 3D'],
    coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '6',
    name: 'مصنع النخبة للمجالس',
    logo: 'https://ui-avatars.com/api/?name=ن+م&background=F3ECDB&color=947961&size=100',
    type: 'تصنيع أثاث',
    rating: 4.8,
    reviews: 98,
    location: 'القصيم، بريدة',
    description: 'تفصيل المجالس العربية الفاخرة حسب الطلب للقطاع الفندقي والمشاريع الكبرى.',
    tags: ['مجالس', 'تفصيل خاص', 'فنادق'],
    coverImage: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '7',
    name: 'مؤسسة الرواد لتوريد الأخشاب',
    logo: 'https://ui-avatars.com/api/?name=ر+خ&background=F3ECDB&color=947961&size=100',
    type: 'توريد مواد خام',
    rating: 4.5,
    reviews: 142,
    location: 'جدة، الصناعية',
    description: 'توريد الأخشاب الطبيعية والصناعية وألواح MDF والقشرة الخشبية بأسعار الجملة.',
    tags: ['أخشاب', 'MDF', 'قشرة خشبية'],
    coverImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '8',
    name: 'شركة لمسة للإضاءة والديكور',
    logo: 'https://ui-avatars.com/api/?name=ل+إ&background=F3ECDB&color=947961&size=100',
    type: 'توريد مواد خام',
    rating: 4.7,
    reviews: 73,
    location: 'الرياض، العليا',
    description: 'حلول الإضاءة الفاخرة وإكسسوارات الديكور المعدنية والرخامية للمشاريع التجارية.',
    tags: ['إضاءة', 'إكسسوارات', 'مشاريع'],
    coverImage: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '9',
    name: 'مصنع المثالية للأثاث المكتبي',
    logo: 'https://ui-avatars.com/api/?name=م+م&background=F3ECDB&color=947961&size=100',
    type: 'تصنيع أثاث',
    rating: 4.6,
    reviews: 119,
    location: 'الدمام، الصناعية الأولى',
    description: 'أثاث مكتبي ومقاعد إرغونومية متينة لتجهيز الشركات والمؤسسات الحكومية.',
    tags: ['مكاتب', 'كراسي إرغونومية', 'تجهيز شركات'],
    coverImage: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=800',
  },
];

const typeIcon = (type: string, size = 14) =>
  type === 'تصنيع أثاث' ? <Factory size={size} /> : type === 'تصميم داخلي' ? <Briefcase size={size} /> : <Building2 size={size} />;

export default function B2BPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');

  const types = ['الكل', 'تصنيع أثاث', 'تصميم داخلي', 'توريد مواد خام'];

  const filteredCompanies = B2B_COMPANIES.filter(company => {
    const matchesSearch = company.name.includes(searchTerm) || company.description.includes(searchTerm);
    const matchesType = selectedType === 'الكل' || company.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = [
    { value: `${B2B_COMPANIES.length}+`, label: 'شركة موثّقة' },
    { value: '٦٠+', label: 'مصنع ومورّد' },
    { value: '١٢٠٠+', label: 'صفقة ناجحة' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">

      {/* Full-width mini hero (edge-to-edge, banner height) */}
      <div className="relative w-full min-h-[300px] md:min-h-[360px] flex items-end overflow-hidden mb-8">
        <img
          src={HERO_IMAGE}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/hero_2.jpg'; }}
        />
        {/* overlays for legibility */}
        <div className="absolute inset-0 bg-diyar-dark/45"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark via-diyar-dark/75 to-transparent"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 text-white">
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-diyar-cream text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Building2 size={14} /> حلول الأعمال والجملة
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-snug drop-shadow-sm">بوابة الأعمال (B2B)</h1>
          <p className="text-white/80 max-w-2xl text-sm md:text-lg leading-relaxed mb-6">
            دليلك الشامل لأفضل المصانع، شركات التصميم، وموردي المواد الخام. تواصل مباشرة مع شركاء النجاح واطلب عروض أسعار لمشاريعك.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 bg-diyar-cream text-diyar-dark font-bold text-sm px-5 py-3 rounded-xl hover:bg-white transition-colors shadow-lg">
              <Plus size={18} /> سجّل شركتك
            </button>
            <div className="flex flex-wrap gap-2">
              {stats.map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5 text-center">
                  <div className="font-bold text-lg leading-none">{s.value}</div>
                  <div className="text-[11px] text-white/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن شركة، مصنع، أو تخصص..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-diyar-brown outline-none"
            />
          </div>
        </div>

        {/* Type filter chips + count */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {types.map(type => {
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${active ? 'bg-diyar-brown text-white border-diyar-brown shadow-sm shadow-diyar-brown/20' : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown/40 hover:text-diyar-dark'}`}
                >
                  {type !== 'الكل' && typeIcon(type, 14)}
                  {type}
                </button>
              );
            })}
          </div>
          <span className="text-sm text-gray-400 font-medium shrink-0">{filteredCompanies.length} شركة</span>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
             <div key={company.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
               <div className="h-40 relative overflow-hidden bg-gray-100">
                 <img
                   src={company.coverImage}
                   alt={company.name}
                   referrerPolicy="no-referrer"
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_COVER; }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <div className="absolute bottom-4 left-4 bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-diyar-dark flex items-center gap-1 shadow">
                   {typeIcon(company.type)}
                   {company.type}
                 </div>
               </div>

               <div className="p-5 relative flex-1 flex flex-col">
                 <div className="w-16 h-16 rounded-xl bg-white shadow-md border border-gray-100 absolute -top-8 right-5 overflow-hidden flex items-center justify-center p-1">
                    <img src={company.logo} alt={company.name} className="w-full h-full object-contain rounded-lg" />
                 </div>

                 <div className="mt-8 flex justify-between items-start mb-2 gap-2">
                   <h3 className="font-bold text-lg text-diyar-dark line-clamp-1 flex items-center gap-1.5">
                     {company.name}
                     <BadgeCheck size={16} className="text-diyar-brown shrink-0" />
                   </h3>
                   <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-xs shrink-0">
                     <Star size={12} className="text-amber-500 fill-amber-500" />
                     <span className="font-bold text-diyar-dark">{company.rating}</span>
                     <span className="text-gray-400">({company.reviews})</span>
                   </div>
                 </div>

                 <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                   <MapPin size={14} className="text-diyar-brown" />
                   <span>{company.location}</span>
                 </div>

                 <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                   {company.description}
                 </p>

                 <div className="flex flex-wrap gap-2 mb-6">
                   {company.tags.map(tag => (
                     <span key={tag} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-md border border-gray-100">
                       {tag}
                     </span>
                   ))}
                 </div>

                 <div className="mt-auto pt-4 border-t border-gray-50">
                    <Link
                      to={`/b2b/${company.id}`}
                      className="block w-full text-center bg-diyar-cream/20 text-diyar-brown border border-diyar-brown hover:bg-diyar-brown hover:text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      زيارة ملف الشركة
                    </Link>
                 </div>
               </div>
             </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">لم يتم العثور على شركات تطابق بحثك</p>
          </div>
        )}

      </div>
    </div>
  );
}
