import React, { useState } from 'react';
import { Gift, ArrowUpRight, ArrowDownRight, Clock, Star, ShieldCheck } from 'lucide-react';

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'used'>('all');

  const history = [
    { id: 1, type: 'earned', points: 150, date: '10 مايو 2026', desc: 'مكافأة شراء: طقم كنب مودرن', amount: '1500 ر.س' },
    { id: 2, type: 'earned', points: 50, date: '05 مايو 2026', desc: 'مكافأة تسجيل حساب جديد', amount: '-' },
    { id: 3, type: 'used', points: 100, date: '28 أبريل 2026', desc: 'استبدال نقاط في متجر مفروشات الرقي', amount: '-100 ر.س' },
    { id: 4, type: 'earned', points: 300, date: '15 أبريل 2026', desc: 'مكافأة شراء: طاولة طعام', amount: '3000 ر.س' },
    { id: 5, type: 'used', points: 200, date: '10 أبريل 2026', desc: 'خصم على ديكورات منوعة', amount: '-200 ر.س' }
  ];

  const filteredHistory = history.filter(item => activeTab === 'all' || item.type === activeTab);

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-sans font-bold text-diyar-dark mb-4">برنامج ولاء ديار</h1>
          <p className="text-gray-500 text-lg">مكافآت حصرية وعروض مميزة بانتظارك مع كل عملية شراء.</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-diyar-dark to-black rounded-[2rem] p-8 md:p-12 text-white shadow-2xl mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
             <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-400 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-diyar-brown rounded-full blur-3xl"></div>
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                  <Star size={40} className="text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <span className="text-white/80 font-medium mb-1 block text-lg">رصيد النقاط المتاح</span>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl md:text-7xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">200</span>
                    <span className="text-xl md:text-2xl font-bold text-amber-500 mb-2">نقطة</span>
                  </div>
                </div>
             </div>
             
             <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 text-center w-full md:w-auto">
               <span className="text-white/80 text-sm mb-1 block">القيمة المعادلة</span>
               <span className="text-3xl font-bold font-sans">200 <span className="text-lg font-normal">ر.س</span></span>
             </div>
           </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <span className="text-gray-500 text-sm block">إجمالي النقاط المكتسبة</span>
                <span className="font-bold text-xl text-diyar-dark">500 نقطة</span>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <span className="text-gray-500 text-sm block">النقاط المستبدلة</span>
                <span className="font-bold text-xl text-diyar-dark">300 نقطة</span>
              </div>
           </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <Clock className="text-diyar-brown" size={24} />
               <h3 className="text-xl font-bold text-diyar-dark">سجل العمليات</h3>
             </div>
             <div className="flex items-center p-1 bg-gray-50 rounded-xl w-full md:w-auto">
               <button onClick={() => setActiveTab('all')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-diyar-dark' : 'text-gray-500 hover:text-diyar-dark'}`}>الكل</button>
               <button onClick={() => setActiveTab('earned')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'earned' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-green-600'}`}>اكتساب</button>
               <button onClick={() => setActiveTab('used')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'used' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-red-600'}`}>استبدال</button>
             </div>
           </div>

           <div className="divide-y divide-gray-100">
             {filteredHistory.map((item) => (
                <div key={item.id} className="p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.type === 'earned' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                       {item.type === 'earned' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-diyar-dark mb-1">{item.desc}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{item.date}</span>
                        {item.amount !== '-' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>الطلب: {item.amount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl font-sans font-bold flex items-center gap-1 ${item.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'earned' ? '+' : '-'}{item.points} 
                    <span className="text-sm font-normal">نقطة</span>
                  </div>
                </div>
             ))}
             {filteredHistory.length === 0 && (
               <div className="p-12 text-center text-gray-500">
                 لا توجد عمليات مطابقة للبحث
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
