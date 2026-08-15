import React from 'react';
import { Download, TrendingUp, Users, MousePointerClick, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AffiliateReports() {
  const areaData = [
    { name: '1 مايو', clicks: 120, conversions: 5 },
    { name: '5 مايو', clicks: 250, conversions: 12 },
    { name: '10 مايو', clicks: 180, conversions: 8 },
    { name: '15 مايو', clicks: 350, conversions: 18 },
    { name: '20 مايو', clicks: 290, conversions: 15 },
    { name: '25 مايو', clicks: 520, conversions: 28 },
    { name: '30 مايو', clicks: 450, conversions: 22 },
  ];

  const barData = [
    { name: 'تويتر', value: 450 },
    { name: 'انستقرام', value: 320 },
    { name: 'تيك توك', value: 850 },
    { name: 'سناب شات', value: 620 },
    { name: 'أخرى', value: 120 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">تقارير الأداء</h2>
          <p className="text-gray-500 text-sm mt-1">تحليل مفصل لأداء روابطك والتفاعلات والتحويلات.</p>
        </div>
        <button className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm bg-white">
          <Download size={18} />
          تصدير التقرير
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <MousePointerClick size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">2,160</div>
          <div className="text-sm font-medium text-gray-500">إجمالي النقرات</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <ShoppingBag size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">108</div>
          <div className="text-sm font-medium text-gray-500">إجمالي المبيعات (التحويلات)</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">5%</div>
          <div className="text-sm font-medium text-gray-500">معدل التحويل (CVR)</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div className="text-2xl font-bold text-diyar-dark mb-1">1,450</div>
          <div className="text-sm font-medium text-gray-500">الزوار الفريدين</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
           <h3 className="font-bold text-diyar-dark mb-6">النقرات والتحويلات (آخر شهر)</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <h3 className="font-bold text-diyar-dark mb-6">مصادر الزيارات</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12 }} width={80} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
