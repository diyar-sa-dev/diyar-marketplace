import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function AffiliateSettings() {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">الإعدادات</h2>
          <p className="text-gray-500 text-sm mt-1">إعدادات الحساب ومعلومات الدفع للمسوق.</p>
        </div>
      </div>

       <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-gray-100">
        {[
          { id: 'account', label: 'الحساب الشخصي' },
          { id: 'bank', label: 'الحساب البنكي' },
          { id: 'social', label: 'حسابات التواصل الاجتماعي' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-green-600 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        {activeTab === 'account' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                 <input type="text" defaultValue="أحمد المسوق" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                 <input type="email" defaultValue="ahmed@example.com" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رقم الجوال</label>
                 <input type="tel" defaultValue="+966 50 123 4567" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
             </div>
             <div className="flex justify-end pt-4">
               <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">اسم صاحب الحساب</label>
                 <input type="text" defaultValue="أحمد المسوق" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">رقم الآيبان (IBAN)</label>
                 <input type="text" defaultValue="SA1234567890123456789012" className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-left font-mono" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">اسم البنك</label>
                 <select className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white">
                   <option>البنك الأهلي السعودي</option>
                   <option>مصرف الراجحي</option>
                   <option>بنك الإنماء</option>
                   <option>بنك الرياض</option>
                 </select>
               </div>
             </div>
             
             <div className="flex justify-end pt-4">
               <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition">
                 <Save size={18} />
                 حفظ التغييرات
               </button>
             </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رابط حساب تويتر / X</label>
                 <input type="url" placeholder="https://twitter.com/..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رابط حساب انستقرام</label>
                 <input type="url" placeholder="https://instagram.com/..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">رابط حساب تيك توك</label>
                 <input type="url" placeholder="https://tiktok.com/@..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-700">الموقع الإلكتروني / المدونة</label>
                 <input type="url" placeholder="https://..." className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" dir="ltr" />
               </div>
             </div>
             
             <div className="flex justify-end pt-4">
               <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition">
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
