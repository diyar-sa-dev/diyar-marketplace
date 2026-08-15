import React, { useState } from 'react';
import { Camera, Save, Info, Link as LinkIcon, HelpCircle, Wallet, Truck, MapPin, Package, Check, DollarSign } from 'lucide-react';

export default function VendorSettings() {
  const [activeTab, setActiveTab] = useState('store');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">إعدادات المتجر والحساب</h2>
          <p className="text-gray-500 text-sm mt-1">تعديل بيانات المتجر، الملف الشخصي، وطرق التواصل.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'store', label: 'بيانات المتجر' },
          { id: 'appearance', label: 'المظهر والتخصيص' },
          { id: 'business', label: 'المعلومات القانونية والبنكية' },
          { id: 'shipping', label: 'الشحن والتوصيل' },
          { id: 'account', label: 'الحساب الشخصي' },
          { id: 'notifications', label: 'الإشعارات' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-diyar-brown text-diyar-brown' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        {activeTab === 'store' && (
          <div className="space-y-8">
             {/* Logo */}
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">شعار المتجر</h3>
               <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors">
                   <img src="https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=200" alt="Logo" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white" />
                   </div>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500 mb-2">الصيغ المدعومة: JPG, PNG, SGV. الحد الأقصى للحجم 2MB.</p>
                   <button className="text-sm font-bold text-diyar-brown border border-diyar-brown px-4 py-2 rounded-xl hover:bg-amber-50 transition">تغيير الشعار</button>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">اسم المتجر</label>
                 <input type="text" defaultValue="الروائع للأثاث" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رابط المتجر</label>
                 <div className="relative">
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                     <LinkIcon size={16} />
                   </span>
                   <input type="text" defaultValue="alrawaea" className="w-full pl-3 pr-9 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50 text-left dir-ltr" dir="ltr" />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dir-ltr">.diyar.sa</span>
                 </div>
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">وصف المتجر (نبذة)</label>
                 <textarea rows={4} defaultValue="متجر متخصص في الأثاث الكلاسيكي والحديث، نقدم قطعاً فريدة..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50"></textarea>
                 <p className="text-xs text-gray-500">هذا الوصف سيظهر للعملاء في صفحة المتجر الرئيسية وعلى محركات البحث.</p>
               </div>
             </div>

             <hr className="border-gray-100" />
             
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">طرق التواصل والدعم الفني</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">رقم جوال الدعم</label>
                    <input type="tel" defaultValue="+966 50 123 4567" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">البريد الإلكتروني للدعم</label>
                    <input type="email" defaultValue="support@alrawaea.com" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" dir="ltr" />
                  </div>
               </div>
             </div>
             
             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">غلاف المتجر / البانر الإعلاني</h3>
               <div className="w-full h-48 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors">
                 <img src="https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex flex-col items-center text-white">
                     <Camera size={32} className="mb-2" />
                     <span className="font-bold">تغيير الغلاف</span>
                   </div>
                 </div>
               </div>
               <p className="text-sm text-gray-500 mt-2">الأبعاد المقترحة: 1200px × 400px</p>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition shadow-sm">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {/* Business Tab (The new tab) */}
        {activeTab === 'business' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
               <Info className="text-amber-600 mt-0.5 shrink-0" size={20} />
               <div className="text-sm text-amber-800 leading-relaxed">
                 تُستخدم هذه المعلومات لإصدار الفواتير وتحويل مستحقاتك المالية. تأكد من أن جميع البيانات المدخلة مطابقة للوثائق الرسمية التي قدمتها أثناء التسجيل لتجنب أي تأخير في التحويلات المالية.
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">المعلومات القانونية والضريبية</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                 <div className="space-y-2 md:col-span-2">
                   <label className="text-sm font-bold text-gray-700">نوع الكيان التجاري</label>
                   <select className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50 appearance-none">
                     <option>مؤسسة فردية</option>
                     <option>وثيقة عمل حر</option>
                     <option>شركة</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">رقم السجل التجاري / وثيقة العمل الحر</label>
                   <input type="text" defaultValue="1010123456" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700 flex items-center gap-1">الرقم الضريبي <span className="text-gray-400 font-normal">(اختياري)</span></label>
                   <input type="text" defaultValue="310123456700003" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50" />
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">الحساب البنكي المعتمد للمدفوعات</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">اسم البنك</label>
                   <select defaultValue="البنك السعودي الفرنسي" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50 appearance-none">
                     <option>البنك الأهلي السعودي (SNB)</option>
                     <option>مصرف الراجحي</option>
                     <option>بنك الرياض</option>
                     <option>البنك السعودي الفرنسي</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">اسم المستفيد (كما هو في الحساب)</label>
                   <input type="text" defaultValue="مؤسسة الروائع للأثاث" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50" />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                   <label className="text-sm font-bold text-gray-700">رقم الآيبان (IBAN)</label>
                   <div className="relative">
                     <input type="text" defaultValue="SA45 8010 0000 0000 0000 0000" className="w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown bg-gray-50/50 text-left font-mono" dir="ltr" />
                     <div className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                       <Wallet size={18} />
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition shadow-sm">
                 <Save size={18} />
                 حفظ المعلومات القانونية والمصرفية
               </button>
             </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
               <Info className="text-amber-600 mt-0.5 shrink-0" size={20} />
               <div className="text-sm text-amber-800 leading-relaxed">
                 تحكم في خيارات التسليم والشحن المتاحة لعملائك واسعارها. يمكنك الجمع بين عدة طرق في نفس الوقت.
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">خيارات التسليم المتاحة</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                 
                 {/* Option 1: Shipping Companies */}
                 <div className="border-2 border-diyar-brown bg-amber-50/10 rounded-2xl p-5 relative overflow-hidden transition-all">
                   <div className="absolute top-4 left-4">
                     <div className="w-5 h-5 rounded-full bg-diyar-brown flex items-center justify-center text-white text-xs">
                       <Check size={14} />
                     </div>
                   </div>
                   <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-4">
                     <Truck size={24} />
                   </div>
                   <h4 className="font-bold text-diyar-dark mb-1">شركات الشحن</h4>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">توصيل لجميع مناطق المملكة عبر شركات الشحن المعتمدة (سمسا، أرامكس...)</p>
                   
                   <div className="space-y-3 pt-4 border-t border-gray-100">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-700">تكلفة الشحن (ر.س)</label>
                       <input type="number" defaultValue="28" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-sm" />
                     </div>
                     <div className="flex items-center gap-2">
                       <input type="checkbox" id="free-shipping-threshold" className="rounded text-diyar-brown focus:ring-diyar-brown" defaultChecked />
                       <label htmlFor="free-shipping-threshold" className="text-xs text-gray-700">شحن مجاني للطلبات فوق:</label>
                     </div>
                     <div className="relative">
                       <input type="number" defaultValue="300" className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-sm" />
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ر.س</span>
                     </div>
                   </div>
                 </div>

                 {/* Option 2: Store's Own Delivery */}
                 <div className="border border-gray-200 bg-white rounded-2xl p-5 relative overflow-hidden opacity-60 hover:opacity-100 transition-all cursor-pointer hover:border-diyar-brown/50">
                   <div className="absolute top-4 left-4">
                     <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                   </div>
                   <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center mb-4">
                     <Package size={24} />
                   </div>
                   <h4 className="font-bold text-diyar-dark mb-1">توصيل خاص بالمستودع</h4>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">توصيل للمناطق المجاورة فقط يتم عبر مندوبيكم الخاص</p>
                   
                   <div className="space-y-3 pt-4 border-t border-gray-100 pointer-events-none">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-700">النطاق المدعوم</label>
                       <select className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-sm bg-gray-50">
                         <option>نفس مدينة المستودع فقط</option>
                         <option>قطر 50 كيلو متر</option>
                       </select>
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-700">التكلفة (ر.س)</label>
                       <input type="number" defaultValue="0" disabled className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-sm bg-gray-50" />
                     </div>
                   </div>
                 </div>

                 {/* Option 3: Local Pickup */}
                 <div className="border border-gray-200 bg-white rounded-2xl p-5 relative overflow-hidden transition-all hover:border-diyar-brown/50 cursor-pointer">
                   <div className="absolute top-4 left-4">
                     <div className="w-5 h-5 rounded-full bg-diyar-brown flex items-center justify-center text-white text-xs">
                       <Check size={14} />
                     </div>
                   </div>
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                     <MapPin size={24} />
                   </div>
                   <h4 className="font-bold text-diyar-dark mb-1">الاستلام من المعرض (Pickup)</h4>
                   <p className="text-xs text-gray-500 mb-4 line-clamp-2">يتيح للعميل الطلب والدفع واستلام الشحنة بنفسه من المعرض</p>
                   
                   <div className="space-y-3 pt-4 border-t border-gray-100">
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-700">الفرع المعتمد للاستلام</label>
                       <select className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-sm">
                         <option>الفرع الرئيسي (الرياض)</option>
                         <option>مستودع جدة</option>
                       </select>
                     </div>
                     <div className="bg-blue-50/50 p-2 text-xs text-blue-700 rounded-lg flex items-center gap-1">
                       <Info size={14} />
                       لا توجد تكاليف توصيل لهذه الطريقة
                     </div>
                   </div>
                 </div>

               </div>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition shadow-sm">
                 <Save size={18} />
                 حفظ إعدادات الشحن
               </button>
             </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-8">
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">الصورة الشخصية</h3>
               <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors">
                   <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" alt="Avatar" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white" />
                   </div>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500 mb-2">الصيغ المدعومة: JPG, PNG. الحد الأقصى للحجم 2MB.</p>
                   <button className="text-sm font-bold text-diyar-brown border border-diyar-brown px-4 py-2 rounded-xl hover:bg-amber-50 transition">تغيير الصورة</button>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                 <input type="text" defaultValue="خالد عبدالله" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                 <input type="email" defaultValue="khalid@example.com" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" dir="ltr" />
               </div>
             </div>
             
             <hr className="border-gray-100" />
             
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">كلمة المرور</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">كلمة المرور الحالية</label>
                    <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">كلمة المرور الجديدة</label>
                    <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50" dir="ltr" />
                  </div>
               </div>
             </div>
             
             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-8">
             <div>
               <h3 className="font-bold text-diyar-dark mb-6">إعدادات الإشعارات</h3>
               <div className="space-y-4">
                 {[
                   { id: 1, title: 'طلبات جديدة', desc: 'إشعار عند استلام طلب جديد في متجرك' },
                   { id: 2, title: 'تحديثات المخزون', desc: 'تنبيه عندما يقل مخزون منتج عن الحد الأدنى' },
                   { id: 3, title: 'الرسائل والمحادثات', desc: 'إشعارات الرسائل الجديدة من العملاء' },
                   { id: 4, title: 'تقارير مالية', desc: 'استلام ملخص مالي نهاية كل أسبوع' },
                 ].map(item => (
                   <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                     <div>
                       <h4 className="font-bold text-diyar-dark">{item.title}</h4>
                       <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" defaultChecked={item.id !== 4} />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown"></div>
                     </label>
                   </div>
                 ))}
               </div>
             </div>
             
             <hr className="border-gray-100" />
             
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">إعدادات اللغة</h3>
               <div className="w-full md:w-1/2 space-y-2">
                 <label className="text-sm font-bold text-gray-700">لغة لوحة التحكم</label>
                 <select className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50 appearance-none">
                   <option value="ar">العربية (Arabic)</option>
                   <option value="en">الإنجليزية (English)</option>
                 </select>
               </div>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
