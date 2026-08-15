import React from 'react';
import { Calendar, DollarSign, Wrench, Clock, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ServiceDashboard() {
  const data = [
    { name: 'السبت', earnings: 1500 },
    { name: 'الأحد', earnings: 1200 },
    { name: 'الإثنين', earnings: 1800 },
    { name: 'الثلاثاء', earnings: 1400 },
    { name: 'الأربعاء', earnings: 2100 },
    { name: 'الخميس', earnings: 1900 },
    { name: 'الجمعة', earnings: 2500 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">أرباح هذا الشهر</h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">18,500</span>
            <span className="text-sm font-bold text-diyar-dark mb-1">ر.س</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">حجوزات نشطة</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">12</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">خدمات مقدمة</h3>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
               <Wrench size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">5</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">ساعات العمل</h3>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
               <Clock size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">84</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-diyar-dark mb-6">الأرباح خلال 7 أيام</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-diyar-dark">مواعيد اليوم</h3>
             <button className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1">
               <Plus size={14} /> إضافة
             </button>
           </div>
           
           <div className="space-y-4">
             <div className="border-l-2 border-amber-400 pl-4 py-2">
               <p className="text-sm text-gray-500 mb-1">10:00 صباحاً - 12:00 ظهراً</p>
               <h4 className="font-bold text-diyar-dark">تصميم داخلي لغرفة جلوس</h4>
               <p className="text-xs text-gray-400 mt-1">العميل: أحمد محمد (حي الياسمين)</p>
             </div>
             
             <div className="border-l-2 border-blue-400 pl-4 py-2">
               <p className="text-sm text-gray-500 mb-1">02:00 مساءً - 05:00 مساءً</p>
               <h4 className="font-bold text-diyar-dark">استشارة ميدانية</h4>
               <p className="text-xs text-gray-400 mt-1">العميل: سارة خالد (حي الملقا)</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
