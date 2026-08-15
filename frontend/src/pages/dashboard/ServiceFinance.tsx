import React, { useState } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, Wallet, Download, Clock, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ServiceFinance() {
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const data = [
    { name: '1 مايو', net: 400 },
    { name: '5 مايو', net: 1200 },
    { name: '10 مايو', net: 800 },
    { name: '15 مايو', net: 1500 },
    { name: '20 مايو', net: 1100 },
    { name: '25 مايو', net: 2200 },
    { name: '30 مايو', net: 1800 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">المالية</h2>
          <p className="text-gray-500 text-sm mt-1">متابعة الأرباح من الخدمات المقدمة والمستحقات.</p>
        </div>
        
        <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white">
          <Download size={18} />
          تصدير كشف حساب
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="relative z-10">
            <h3 className="text-white/80 font-medium mb-2">رصيد قابل للسحب</h3>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-4xl font-bold">5,450</span>
              <span className="text-lg text-white/80">ر.س</span>
            </div>
            <button onClick={() => setIsPayoutModalOpen(true)} className="w-full bg-white text-blue-600 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
              طلب سحب رصيد
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">إجمالي الأرباح (هذا الشهر)</h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">18,500</span>
            <span className="text-sm font-bold text-gray-500 mb-1">ر.س</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">العمولات والمستقطعات</h3>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
               <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-red-600">- 1,850</span>
            <span className="text-sm font-bold text-gray-500 mb-1">ر.س</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">10% عمولة المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 mt-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-diyar-dark mb-6">صافي الأرباح</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">طلب سحب رصيد</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                 <span className="text-sm text-gray-500">الرصيد المتاح للسحب</span>
                 <span className="font-bold text-blue-600 text-lg">5,450 ر.س</span>
               </div>
               
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">المبلغ المطلوب سحبه</label>
                   <input type="number" placeholder="0.00" className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">الحساب البنكي</label>
                   <select className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 appearance-none bg-white">
                     <option>البنك الأهلي السعودي - ينتهي بـ 4567</option>
                     <option>مصرف الراجحي - ينتهي بـ 1234</option>
                   </select>
                   <p className="text-xs text-gray-400 mt-1">يستغرق التحويل من 1-3 أيام عمل</p>
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
               <button onClick={() => setIsPayoutModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">إلغاء</button>
               <button onClick={() => setIsPayoutModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition">تقديم الطلب</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
