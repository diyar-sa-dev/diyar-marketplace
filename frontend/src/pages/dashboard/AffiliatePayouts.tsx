import React, { useState } from 'react';
import { Wallet, History, ArrowRightLeft, Building2, CheckCircle2 } from 'lucide-react';

export default function AffiliatePayouts() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TRANSACTIONS = [
    { id: 'TRX-9801', date: '2024-05-01', amount: 1500, status: 'completed', method: 'تحويل بنكي' },
    { id: 'TRX-8765', date: '2024-04-15', amount: 2300, status: 'completed', method: 'تحويل بنكي' },
    { id: 'TRX-7432', date: '2024-03-30', amount: 850, status: 'completed', method: 'تحويل بنكي' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">سحب الأرباح</h2>
          <p className="text-gray-500 text-sm mt-1">إدارة رصيدك المتاح وسجل مسحوبات الأرباح.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-green-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden lg:col-span-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-20 -translate-y-20"></div>
          <div className="relative z-10 space-y-6">
            <div>
              <h3 className="text-white/80 font-medium mb-1">الرصيد المتاح للسحب</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">3,750</span>
                <span className="text-lg text-white/80 pb-1">ر.س</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <h3 className="text-white/80 text-sm mb-1">الأرباح قيد المراجعة</h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">450</span>
                <span className="text-sm text-white/80 pb-1">ر.س</span>
              </div>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="w-full bg-white text-green-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2 mt-4">
              <Wallet size={18} />
              طلب سحب جديد
            </button>
          </div>
        </div>

        {/* Bank Account Info & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-100">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="font-bold text-diyar-dark">نموذج الحساب البنكي الافتراضي</h4>
                <p className="text-sm text-gray-500 mt-1" dir="ltr">SA 12 3456 7890 1234 5678 9012</p>
              </div>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">تغيير الحساب</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
               <h3 className="font-bold text-diyar-dark flex items-center gap-2">
                 <History size={18} className="text-gray-400" />
                 سجل المسحوبات السابقة
               </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {TRANSACTIONS.map(trx => (
                <div key={trx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{trx.method}</h4>
                      <div className="text-sm text-gray-500 mt-1 flex gap-3">
                        <span>{trx.date}</span>
                        <span className="text-gray-300">|</span>
                        <span>{trx.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-diyar-dark text-lg">{trx.amount} ر.س</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">طلب سحب جديد</h3>
            </div>
            <div className="p-6 space-y-4 text-center pb-8">
               <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle2 size={40} />
               </div>
               <h4 className="font-bold text-xl text-gray-900">تم استلام طلبك بنجاح</h4>
               <p className="text-gray-500 text-sm">سيتم تحويل مبلغ <span className="font-bold text-diyar-dark">3,750 ر.س</span> إلى حسابك البنكي خلال 1-3 أيام عمل.</p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="w-full px-5 py-3 rounded-xl font-bold bg-diyar-dark text-white hover:bg-black transition">حسناً، إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
