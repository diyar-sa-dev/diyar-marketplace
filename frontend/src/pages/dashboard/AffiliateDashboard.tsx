import React from 'react';
import { MousePointerClick, ShoppingCart, DollarSign, Target, Copy, Link as LinkIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AffiliateDashboard() {
  const data = [
    { name: 'يناير', clicks: 400, conversions: 24, earnings: 1200 },
    { name: 'فبراير', clicks: 300, conversions: 18, earnings: 900 },
    { name: 'مارس', clicks: 550, conversions: 34, earnings: 1700 },
    { name: 'أبريل', clicks: 450, conversions: 28, earnings: 1400 },
    { name: 'مايو', clicks: 600, conversions: 45, earnings: 2250 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">النقرات (هذا الشهر)</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <MousePointerClick size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">2,450</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">الطلبات المحققة</h3>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">142</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">معدل التحويل</h3>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
               <Target size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">5.8%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">العمولات المكتسبة</h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
               <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">7,100</span>
            <span className="text-sm font-bold text-diyar-dark mb-1">ر.س</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-diyar-dark mb-6">أداء التسويق (آخر 5 أشهر)</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f9fafb' }} />
                  <Bar yAxisId="left" dataKey="clicks" name="النقرات" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="earnings" name="الأرباح (ر.س)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
               <DollarSign size={28} />
             </div>
             <p className="text-sm text-gray-500 mb-1">الرصيد القابل للسحب</p>
             <h3 className="text-3xl font-bold text-diyar-dark mb-4">4,500 <span className="text-sm">ر.س</span></h3>
             <button className="w-full bg-diyar-dark text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
               طلب سحب الأرباح
             </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="font-bold text-diyar-dark mb-4">أفضل الروابط أداءً</h3>
             <div className="space-y-3">
               {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-diyar-brown shadow-sm">
                        <LinkIcon size={14} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-diyar-dark">أريكة استرخاء مخملية</p>
                         <p className="text-xs text-gray-500">{320 - i*40} نقرة</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-diyar-dark transition bg-white rounded-lg shadow-sm">
                      <Copy size={16} />
                    </button>
                  </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
