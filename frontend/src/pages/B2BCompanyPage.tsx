import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Star, Building2, Phone, Mail, Globe, ArrowRight, CheckCircle2,
  MessageSquare, Briefcase, Users, CalendarClock, Send, X, BadgeCheck,
  Factory, Clock, Quote
} from 'lucide-react';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';

const SERVICES_BY_TYPE: Record<string, string[]> = {
  'تصنيع أثاث': ['تفصيل أثاث حسب الطلب', 'تأثيث الفنادق والمنتجعات', 'بيع بالجملة للمعارض', 'صيانة وتجديد الأثاث'],
  'تصميم داخلي': ['تصميم المساحات السكنية والتجارية', 'تصميم المكاتب والمعارض', 'مخططات ثلاثية الأبعاد', 'الإشراف على التنفيذ'],
  'توريد مواد خام': ['توريد بالجملة للمصانع', 'عقود توريد طويلة الأمد', 'شحن وتوصيل للمشاريع', 'عيّنات مجانية للعملاء'],
};

const PORTFOLIO_POOL = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&q=80&w=600',
];

const COMPANIES = [
  { id: '1', name: 'مصنع الأخشاب الحديثة', slug: 'modernwood', type: 'تصنيع أثاث', rating: 4.8, reviews: 124, location: 'الرياض، الصناعية الثانية', cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600', desc: 'متخصصون في تصنيع الكنب والمجالس العربية بأعلى معايير الجودة للشركات والفنادق والمشاريع الكبرى. نعتمد على أحدث التقنيات وأفضل أنواع الأخشاب والإسفنج لضمان المتانة والراحة.', tags: ['كنب', 'مجالس', 'جملة', 'تأثيث فنادق', 'طاولات خشبية'], stats: { years: 12, employees: '50-100', projects: 300 } },
  { id: '2', name: 'مؤسسة رواد الديكور', slug: 'rowad-decor', type: 'تصميم داخلي', rating: 4.9, reviews: 86, location: 'جدة، شارع التحلية', cover: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1600', desc: 'نقدم خدمات التصميم الداخلي المبتكر للمكاتب والمطاعم والمعارض التجارية، مع فريق من المصممين المعتمدين وحلول تنفيذ متكاملة من الفكرة حتى التسليم.', tags: ['تصميم مكاتب', 'مطاعم', 'تنفيذ ديكور', 'مخططات'], stats: { years: 9, employees: '20-50', projects: 180 } },
  { id: '3', name: 'الشركة العالمية للأقمشة', slug: 'global-fabrics', type: 'توريد مواد خام', rating: 4.7, reviews: 210, location: 'الدمام، الخالدية', cover: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1600', desc: 'موردون معتمدون لأرقى أنواع الأقمشة والإسفنج لمصانع الأثاث في المملكة، مع مخزون دائم وأسعار جملة تنافسية وشبكة توزيع تغطي جميع المناطق.', tags: ['أقمشة', 'إسفنج', 'موردين جملة', 'استيراد'], stats: { years: 18, employees: '100-200', projects: 500 } },
  { id: '4', name: 'مصنع الصلب للأثاث المكتبي', slug: 'steel-office', type: 'تصنيع أثاث', rating: 4.6, reviews: 156, location: 'الرياض، السلي', cover: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600', desc: 'تصنيع الأثاث المكتبي المتين والعصري من مكاتب ودواليب وكراسي مريحة للشركات والمؤسسات، بخطوط إنتاج حديثة وضمان يصل إلى خمس سنوات.', tags: ['أثاث مكتبي', 'كراسي', 'دواليب', 'تجهيز شركات'], stats: { years: 15, employees: '50-100', projects: 260 } },
  { id: '5', name: 'استوديو فينيق للتصميم', slug: 'phoenix-studio', type: 'تصميم داخلي', rating: 5.0, reviews: 64, location: 'الرياض، حي حطين', cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600', desc: 'تصميم وتنفيذ المساحات التجارية والفندقية بلمسة عصرية فاخرة، مع مخططات ثلاثية الأبعاد دقيقة وإشراف هندسي كامل على مراحل التنفيذ.', tags: ['فنادق', 'معارض', 'مخططات 3D', 'فخامة'], stats: { years: 7, employees: '10-20', projects: 95 } },
  { id: '6', name: 'مصنع النخبة للمجالس', slug: 'elite-majlis', type: 'تصنيع أثاث', rating: 4.8, reviews: 98, location: 'القصيم، بريدة', cover: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&q=80&w=1600', desc: 'تفصيل المجالس العربية الفاخرة حسب الطلب للقطاع الفندقي والمشاريع الكبرى، بخبرة عريقة في النقش اليدوي والأقمشة الفاخرة.', tags: ['مجالس', 'تفصيل خاص', 'فنادق', 'نقش يدوي'], stats: { years: 20, employees: '50-100', projects: 410 } },
  { id: '7', name: 'مؤسسة الرواد لتوريد الأخشاب', slug: 'rowad-wood', type: 'توريد مواد خام', rating: 4.5, reviews: 142, location: 'جدة، الصناعية', cover: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=1600', desc: 'توريد الأخشاب الطبيعية والصناعية وألواح MDF والقشرة الخشبية بأسعار الجملة، مع خدمة قص وتجهيز حسب مقاسات العميل.', tags: ['أخشاب', 'MDF', 'قشرة خشبية', 'جملة'], stats: { years: 14, employees: '20-50', projects: 320 } },
  { id: '8', name: 'شركة لمسة للإضاءة والديكور', slug: 'lamsa-lighting', type: 'توريد مواد خام', rating: 4.7, reviews: 73, location: 'الرياض، العليا', cover: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&q=80&w=1600', desc: 'حلول الإضاءة الفاخرة وإكسسوارات الديكور المعدنية والرخامية للمشاريع التجارية والسكنية، بتشكيلات حصرية مستوردة.', tags: ['إضاءة', 'إكسسوارات', 'مشاريع', 'استيراد'], stats: { years: 8, employees: '10-20', projects: 130 } },
  { id: '9', name: 'مصنع المثالية للأثاث المكتبي', slug: 'almithalia', type: 'تصنيع أثاث', rating: 4.6, reviews: 119, location: 'الدمام، الصناعية الأولى', cover: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=1600', desc: 'أثاث مكتبي ومقاعد إرغونومية متينة لتجهيز الشركات والمؤسسات الحكومية، بمعايير جودة عالمية وخدمة ما بعد البيع.', tags: ['مكاتب', 'كراسي إرغونومية', 'تجهيز شركات', 'حكومي'], stats: { years: 11, employees: '50-100', projects: 240 } },
];

const MOCK_REVIEWS = [
  { name: 'شركة الواحة للضيافة', role: 'عميل أعمال', rating: 5, text: 'تعاملنا معهم في تجهيز فرعين كاملين، الالتزام بالمواعيد والجودة كان ممتازاً. شراكة ناجحة بكل المقاييس.' },
  { name: 'مجموعة الأفق العقارية', role: 'مقاول', rating: 5, text: 'أسعار الجملة تنافسية والتعامل احترافي. وفّروا علينا الكثير من الوقت في توريد المشاريع.' },
  { name: 'مكتب إبداع للاستشارات', role: 'مصمم', rating: 4, text: 'جودة التنفيذ مطابقة للمخططات تماماً، وفريق متعاون في التعديلات. أنصح بالتعامل معهم.' },
];

export default function B2BCompanyPage() {
  const { id } = useParams();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  const company = COMPANIES.find(c => c.id === id) || COMPANIES[0];
  const logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=F3ECDB&color=947961&size=200&bold=true`;
  const services = SERVICES_BY_TYPE[company.type] || SERVICES_BY_TYPE['تصنيع أثاث'];
  const idx = COMPANIES.findIndex(c => c.id === company.id);
  const portfolio = [...PORTFOLIO_POOL.slice(idx % 3), ...PORTFOLIO_POOL.slice(0, idx % 3)];
  const contact = { phone: '+966 50 123 4567', email: `info@${company.slug}.sa`, website: `www.${company.slug}.sa` };

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSent(true);
    setTimeout(() => { setIsQuoteModalOpen(false); setQuoteSent(false); }, 3000);
  };

  const stats = [
    { icon: CalendarClock, label: 'سنوات الخبرة', value: `+${company.stats.years}` },
    { icon: Briefcase, label: 'مشروع منجز', value: `+${company.stats.projects}` },
    { icon: Users, label: 'حجم الفريق', value: company.stats.employees },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Cover */}
      <div className="h-56 md:h-72 w-full relative overflow-hidden bg-diyar-dark">
        <img src={company.cover} alt={company.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={onImgError} />
        <div className="absolute inset-0 bg-gradient-to-t from-diyar-dark/90 via-diyar-dark/40 to-diyar-dark/30"></div>
        <Link to="/b2b" className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-diyar-dark transition z-10">
          <ArrowRight size={20} />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative -mt-20 z-10">

        {/* Header card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden shrink-0 -mt-16 md:-mt-20 relative z-20">
              <img src={logo} alt={company.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-diyar-brown bg-diyar-cream/50 px-2.5 py-1 rounded-md">
                  <Building2 size={13} /> {company.type}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                  <BadgeCheck size={13} /> موثّقة
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-diyar-dark mb-2 leading-snug">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><MapPin size={15} className="text-diyar-brown" /> {company.location}</span>
                <span className="flex items-center gap-1.5">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-diyar-dark">{company.rating}</span>
                  <span className="text-gray-400">({company.reviews} تقييم)</span>
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="w-full md:w-auto bg-diyar-brown text-white px-8 py-3 rounded-xl font-bold hover:bg-diyar-dark transition-colors shadow-lg shadow-diyar-brown/20 flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} /> طلب عرض سعر
              </button>
              <div className="flex justify-center gap-2">
                <a href={`tel:${contact.phone}`} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition"><Phone size={18} /></a>
                <a href={`mailto:${contact.email}`} className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition"><Mail size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-white hover:bg-diyar-brown transition"><Globe size={18} /></a>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-gray-100">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-3 bg-gray-50/70 rounded-2xl p-3 md:p-4">
                <div className="w-10 h-10 rounded-xl bg-diyar-cream text-diyar-brown flex items-center justify-center shrink-0">
                  <s.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-diyar-dark text-base md:text-lg leading-none">{s.value}</p>
                  <p className="text-[11px] md:text-xs text-gray-500 mt-1 truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* About */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark mb-4 flex items-center gap-2">
                <Factory size={20} className="text-diyar-brown" /> عن الشركة
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">{company.desc}</p>
              <div className="flex flex-wrap gap-2 mt-6">
                {company.tags.map(tag => (
                  <span key={tag} className="bg-gray-50 text-gray-600 text-sm px-3 py-1.5 rounded-lg border border-gray-100">{tag}</span>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark mb-5 flex items-center gap-2">
                <Briefcase size={20} className="text-diyar-brown" /> معرض الأعمال
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {portfolio.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden group relative bg-gray-100 cursor-pointer">
                    <img src={img} alt={`عمل ${i + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={onImgError} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-diyar-dark mb-5 flex items-center gap-2">
                <Star size={20} className="text-amber-400 fill-amber-400" /> آراء شركاء الأعمال
              </h2>
              <div className="flex flex-col gap-4">
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} className="bg-gray-50/70 rounded-2xl p-4 md:p-5 relative">
                    <Quote size={28} className="absolute top-4 left-4 text-gray-200" />
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center font-bold text-sm shrink-0 border border-diyar-brown/20">
                          {r.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-diyar-dark text-sm truncate">{r.name}</h4>
                          <span className="text-[11px] text-gray-500">{r.role}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Quote CTA card */}
            <div className="bg-diyar-dark text-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-1.5">هل لديك مشروع؟</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-5">احصل على عرض سعر مخصص من {company.name} خلال 24 ساعة.</p>
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="w-full bg-diyar-cream text-diyar-dark py-3 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} /> طلب عرض سعر
              </button>
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-diyar-dark mb-4">الخدمات المقدمة</h3>
              <ul className="flex flex-col gap-3">
                {services.map((service, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-diyar-brown shrink-0 mt-0.5" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact + hours */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-diyar-dark mb-4">معلومات التواصل</h3>
              <div className="flex flex-col gap-3 text-sm">
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition">
                  <Phone size={16} className="text-diyar-brown shrink-0" /> <span dir="ltr">{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition">
                  <Mail size={16} className="text-diyar-brown shrink-0" /> <span dir="ltr" className="truncate">{contact.email}</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-gray-600 hover:text-diyar-brown transition">
                  <Globe size={16} className="text-diyar-brown shrink-0" /> <span dir="ltr">{contact.website}</span>
                </a>
                <div className="flex items-center gap-3 text-gray-600 pt-3 mt-1 border-t border-gray-50">
                  <Clock size={16} className="text-diyar-brown shrink-0" /> الأحد - الخميس، 8ص - 5م
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {quoteSent ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={30} />
                </div>
                <h2 className="text-2xl font-bold text-diyar-dark mb-2">تم الإرسال بنجاح!</h2>
                <p className="text-gray-500">سيتم التواصل معك من قبل الشركة في أقرب وقت ممكن.</p>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center border border-diyar-brown/15">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-diyar-dark leading-tight">طلب عرض سعر</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{company.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsQuoteModalOpen(false)} className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-diyar-dark hover:bg-gray-100 transition">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleQuoteSubmit} className="flex flex-col gap-4 p-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">نوع المشروع / الطلب <span className="text-diyar-brown">*</span></label>
                    <input type="text" required placeholder="مثال: تأثيث فندق، شراء جملة..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">الكمية المقدّرة</label>
                    <input type="text" placeholder="مثال: 50 طقم كنب" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">التفاصيل الكاملة <span className="text-diyar-brown">*</span></label>
                    <textarea rows={4} required placeholder="اشرح احتياجاتك بالتفصيل ليتمكن المورد من تقديم عرض دقيق..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">الميزانية التقديرية (اختياري)</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown transition">
                      <option value="">غير محدد</option>
                      <option value="1">أقل من 10,000 ريال</option>
                      <option value="2">10,000 - 50,000 ريال</option>
                      <option value="3">50,000 - 200,000 ريال</option>
                      <option value="4">أكثر من 200,000 ريال</option>
                    </select>
                  </div>

                  <div className="mt-2 flex gap-3">
                    <button type="submit" className="flex-1 bg-diyar-brown text-white py-3 rounded-xl font-bold hover:bg-diyar-dark transition-colors flex items-center justify-center gap-2">
                      <Send size={16} /> إرسال الطلب
                    </button>
                    <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      إلغاء
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
