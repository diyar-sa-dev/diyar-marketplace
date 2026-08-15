import React, { useState } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, Wallet, Download, Clock, X, Filter, CheckCircle, TrendingUp, RefreshCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VendorFinance() {
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<'week' | 'month' | 'year'>('month');

  const data = [
    { name: '1 مايو', net: 1200, fee: 120 },
    { name: '5 مايو', net: 1800, fee: 180 },
    { name: '10 مايو', net: 1400, fee: 140 },
    { name: '15 مايو', net: 2200, fee: 220 },
    { name: '20 مايو', net: 1900, fee: 190 },
    { name: '25 مايو', net: 2800, fee: 280 },
    { name: '30 مايو', net: 2400, fee: 240 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">المالية</h2>
          <p className="text-gray-500 text-sm mt-1">متابعة المبيعات، الأرباح، المستحقات وتفاصيل العمولات.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setActiveDateRange('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeDateRange === 'week' ? 'bg-gray-100 text-diyar-dark font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
            >
              أسبوع
            </button>
            <button 
              onClick={() => setActiveDateRange('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeDateRange === 'month' ? 'bg-gray-100 text-diyar-dark font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
            >
              شهر
            </button>
            <button 
              onClick={() => setActiveDateRange('year')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeDateRange === 'year' ? 'bg-gray-100 text-diyar-dark font-bold' : 'text-gray-500 hover:text-diyar-dark'}`}
            >
              سنة
            </button>
          </div>
          <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white" onClick={() => alert('يتم تحضير كشف الحساب...')}>
            <Download size={18} />
            تصدير تقرير
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-diyar-dark text-white p-6 rounded-2xl shadow-sm relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 translate-y-10"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-white/70 font-medium mb-1 flex items-center gap-2">
                <Wallet size={18} />
                الرصيد القابل للسحب
              </h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-bold">12,450</span>
                <span className="text-xl text-white/70 mb-1">ر.س</span>
              </div>
              <p className="text-sm text-white/60 mt-3 flex items-center gap-1.5">
                <CheckCircle size={14} />
                متاح للتحويل إلى حسابك البنكي المعتمد
              </p>
            </div>
            <button onClick={() => setIsPayoutModalOpen(true)} className="w-full sm:w-auto mt-6 bg-white text-diyar-dark px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm flex items-center justify-center gap-2">
              <ArrowUpRight size={18} />
              طلب سحب رصيد
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">إجمالي المبيعات</h3>
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-diyar-dark">45,230</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 mt-4 bg-green-50 px-2.5 py-1.5 rounded-lg w-fit">
            <TrendingUp size={14} />
            <span>+15.3% عن الفترة السابقة</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">العمولات المستقطعة</h3>
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                 <ArrowDownRight size={20} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-diyar-dark">4,523</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-gray-500 mt-4">
            <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">10% عمولة المنصة</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-diyar-dark">تحليل الإيرادات والعمولات</h3>
             <div className="flex items-center gap-4 text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-gray-600">صافي الأرباح</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <span className="text-gray-600">العمولات المستقطعة</span>
               </div>
             </div>
           </div>
           <div className="h-[300px]" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Line name="صافي الأرباح" type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line name="العمولات" type="monotone" dataKey="fee" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-diyar-dark mb-4">ملخص الفترة الحالية</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">عدد الطلبات المكتملة</span>
                <span className="font-bold text-diyar-dark">145 طلب</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600 text-sm">متوسط قيمة الطلب</span>
                <span className="font-bold text-diyar-dark">312 ر.س</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                <span className="text-gray-600 text-sm">المبالغ المستردة</span>
                <span className="font-bold text-red-600">850 ر.س</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="font-bold text-amber-800 mb-2">الدفعات القادمة</h3>
            <p className="text-sm text-amber-700/80 mb-4">سيتم تحويل هذه الدفعة تلقائياً في دورة الدفع القادمة.</p>
            <div className="flex items-center justify-between bg-white/60 p-4 rounded-xl">
              <div>
                <span className="text-xl font-bold text-amber-700 block">4,200 ر.س</span>
                <span className="text-xs text-amber-600 font-medium">مستحقة في 1 يونيو</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <h3 className="font-bold text-diyar-dark">سجل المعاملات</h3>
           <div className="flex items-center gap-2">
             <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
               <Filter size={16} />
               تصفية
             </button>
           </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-right text-sm">
             <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs font-bold text-right">
               <tr>
                 <th className="px-6 py-4">المعاملة</th>
                 <th className="px-6 py-4">المبلغ</th>
                 <th className="px-6 py-4">التاريخ</th>
                 <th className="px-6 py-4">الحالة</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {[
                 { id: 1, type: 'order', label: 'إيراد طلب #10245', amount: '+1,125', date: '16 مايو 2026، 14:30', status: 'مكتمل', statusColor: 'bg-green-100 text-green-700', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                 { id: 2, type: 'fee', label: 'عمولة طلب #10245', amount: '-125', date: '16 مايو 2026، 14:30', status: 'مستقطع', statusColor: 'bg-gray-100 text-gray-700', icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' },
                 { id: 3, type: 'payout', label: 'سحب رصيد (تحويل بنكي)', amount: '-5,000', date: '15 مايو 2026، 10:00', status: 'جاري المعالجة', statusColor: 'bg-amber-100 text-amber-700', icon: Wallet, color: 'text-diyar-dark', bg: 'bg-gray-100' },
                 { id: 4, type: 'order', label: 'إيراد طلب #10244', amount: '+850', date: '14 مايو 2026، 18:45', status: 'مكتمل', statusColor: 'bg-green-100 text-green-700', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                 { id: 5, type: 'refund', label: 'استرجاع طلب #10230', amount: '-450', date: '12 مايو 2026، 09:15', status: 'مكتمل', statusColor: 'bg-green-100 text-green-700', icon: RefreshCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
               ].map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.bg} ${t.color}`}>
                          <t.icon size={18} />
                        </div>
                        <span className="font-bold text-gray-700">{t.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold inline-block text-left whitespace-nowrap ${t.type === 'order' ? 'text-green-600' : t.type === 'fee' ? 'text-red-600' : 'text-diyar-dark'}`} dir="ltr">
                        {t.amount} ر.س
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${t.statusColor}`}>{t.status}</span>
                    </td>
                  </tr>
               ))}
             </tbody>
           </table>
         </div>
         <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
           <button className="text-diyar-brown font-bold text-sm hover:underline">عرض المزيد من المعاملات</button>
         </div>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-xl text-diyar-dark flex items-center gap-2">
                <Wallet className="text-diyar-brown" size={24} />
                طلب سحب رصيد
              </h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                 <span className="text-sm font-bold text-green-800">الرصيد المتاح للسحب</span>
                 <span className="font-bold text-green-700 text-xl">12,450 ر.س</span>
               </div>
               
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-sm font-bold text-gray-700">المبلغ المطلوب سحبه</label>
                   <div className="relative">
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">ر.س</span>
                     <input type="number" placeholder="0.00" className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown text-left text-lg font-bold" dir="ltr" max={12450} />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <label className="text-sm font-bold text-gray-700">الحساب البنكي</label>
                     <button className="text-xs font-bold text-diyar-brown hover:underline">إدارة الحسابات</button>
                   </div>
                   <select className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown appearance-none bg-white">
                     <option>البنك الأهلي السعودي - ينتهي بـ 4567</option>
                     <option>مصرف الراجحي - ينتهي بـ 1234</option>
                   </select>
                   <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
                     <Clock size={14} />
                     <span>يستغرق التحويل من 1-3 أيام عمل</span>
                   </div>
                 </div>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
               <button onClick={() => setIsPayoutModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">إلغاء</button>
               <button onClick={() => setIsPayoutModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-diyar-dark text-white hover:bg-black transition">تأكيد الطلب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
