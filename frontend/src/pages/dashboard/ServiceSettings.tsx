import React, { useState } from 'react';
import { Camera, Save } from 'lucide-react';

export default function ServiceSettings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">إعدادات الحساب</h2>
          <p className="text-gray-500 text-sm mt-1">إعدادات ملفك الشخصي والتخصص ومناطق العمل.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'profile', label: 'الملف المهني' },
          { id: 'account', label: 'الحساب الشخصي' },
          { id: 'notifications', label: 'الإشعارات' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        {activeTab === 'profile' && (
          <div className="space-y-8">
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">صورة الملف المهني</h3>
               <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/20 transition-colors">
                   <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" alt="Avatar" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white" />
                   </div>
                 </div>
                 <div>
                   <p className="text-sm text-gray-500 mb-2">الصيغ المدعومة: JPG, PNG. الحد الأقصى للحجم 2MB.</p>
                   <button className="text-sm font-bold text-blue-600 border border-blue-600 px-4 py-2 rounded-xl hover:bg-blue-50 transition">تغيير الصورة</button>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">التخصص المهني</label>
                 <input type="text" defaultValue="مصممة ديكور داخلي" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
               </div>
               
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">نبذة تعريفية (Bio)</label>
                 <textarea rows={4} defaultValue="خبرة 5 سنوات في تصميم الداخلي السكني والتجاري..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
               </div>
               
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">مناطق العمل (المدن أو الأحياء)</label>
                 <input type="text" defaultValue="الرياض (جميع الأحياء)، الخرج" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
               </div>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                 <input type="text" defaultValue="سارة الخالد" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                 <input type="email" defaultValue="sara@example.com" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رقم الجوال</label>
                 <input type="tel" defaultValue="+966 50 123 4567" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50" dir="ltr" />
               </div>
             </div>
             
             <hr className="border-gray-100" />
             
             <div>
               <h3 className="font-bold text-diyar-dark mb-4">كلمة المرور</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">كلمة المرور الحالية</label>
                    <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">كلمة المرور الجديدة</label>
                    <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/50" dir="ltr" />
                  </div>
               </div>
             </div>
             
             <div className="flex justify-end pt-4">
               <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
             <div>
               <h3 className="font-bold text-diyar-dark mb-6">إعدادات الإشعارات</h3>
               <div className="space-y-4">
                 {[
                   { id: 1, title: 'حجوزات جديدة', desc: 'إشعار عند استلام طلب حجز خدمة جديد' },
                   { id: 2, title: 'تذكير بالمواعيد', desc: 'تنبيه قبل موعد الخدمة بـ 24 ساعة' },
                   { id: 3, title: 'الرسائل والمحادثات', desc: 'إشعارات الرسائل الجديدة من العملاء' },
                   { id: 4, title: 'تقييمات جديدة', desc: 'إشعار عند تقييم خدمة من قبل عميل' },
                 ].map(item => (
                   <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                     <div>
                       <h4 className="font-bold text-diyar-dark">{item.title}</h4>
                       <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" defaultChecked={item.id !== 4} />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                     </label>
                   </div>
                 ))}
               </div>
             </div>

             <div className="flex justify-end pt-4">
               <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
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
