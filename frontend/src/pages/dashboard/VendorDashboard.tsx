import React from 'react';
import { ShoppingCart, DollarSign, Package, TrendingUp, TrendingDown, Eye, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function VendorDashboard() {
  const data = [
    { name: 'السبت', sales: 4000 },
    { name: 'الأحد', sales: 3000 },
    { name: 'الإثنين', sales: 2000 },
    { name: 'الثلاثاء', sales: 2780 },
    { name: 'الأربعاء', sales: 1890 },
    { name: 'الخميس', sales: 2390 },
    { name: 'الجمعة', sales: 3490 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">إجمالي المبيعات (هذا الشهر)</h3>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">45,230</span>
            <span className="text-sm font-bold text-diyar-dark mb-1">ر.س</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
            <TrendingUp size={16} /> <span>+12.5%</span> <span className="text-gray-400">عن الشهر الماضي</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">الطلبات الجديدة</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">128</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
            <TrendingUp size={16} /> <span>+5.2%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">المنتجات النشطة</h3>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
               <Package size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">342</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-red-500 mt-2">
            <TrendingDown size={16} /> <span>-2 منتجات نفذت</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">التقييم العام</h3>
            <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
               <Star size={20} fill="currentColor" />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-diyar-dark">4.8</span>
            <span className="text-sm font-bold text-gray-500 mb-1">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
            <span>من 256 تقييم</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
           <h3 className="font-bold text-diyar-dark mb-6">المبيعات خلال 7 أيام</h3>
           <div className="h-72" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="sales" stroke="#A67B5B" strokeWidth={3} dot={{ r: 4, fill: '#A67B5B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-diyar-dark">أحدث الطلبات</h3>
             <Link to="/dashboard/vendor/orders" className="text-sm text-diyar-brown hover:underline">عرض الكل</Link>
           </div>
           
           <div className="space-y-4">
             {[1, 2, 3, 4, 5].map((i) => (
                <Link to="/dashboard/vendor/orders" key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100 block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                      #{1024 + i}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-diyar-dark truncate max-w-[120px] text-right">أريكة استرخاء مخملية</h4>
                      <p className="text-xs text-gray-500 text-right">منذ ساعتين</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="block text-sm font-bold text-diyar-dark">1,250 ر.س</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block mt-1">قيد التجهيز</span>
                  </div>
                </Link>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Top Selling Products */}
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-diyar-dark flex items-center gap-2">
               المنتجات الأكثر مبيعاً
             </h3>
           </div>
           <div className="space-y-4">
             {[
               {name: 'طاولة طعام خشبية', sales: 45, rev: '108,000', stock: 12},
               {name: 'أريكة استرخاء مخملية', sales: 38, rev: '47,500', stock: 5},
               {name: 'كرسي مكتب مريح', sales: 29, rev: '13,050', stock: 8},
             ].map((product, i) => (
               <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                     <img src={`https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=100`} alt={product.name} className="w-full h-full object-cover" />
                   </div>
                   <div>
                     <h4 className="font-bold text-sm text-diyar-dark">{product.name}</h4>
                     <p className="text-xs text-gray-500 mt-0.5">{product.sales} طلب • {product.stock} متبقي</p>
                   </div>
                 </div>
                 <div className="text-left font-bold text-diyar-dark">
                   {product.rev} ر.س
                 </div>
               </div>
             ))}
           </div>
         </div>

         {/* Inventory Alerts */}
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-diyar-dark text-red-600 flex items-center gap-2">
               تنبيهات المخزون
             </h3>
           </div>
           <div className="space-y-4">
             {[
               {name: 'طقم إضاءة حديثة', status: 'نفذت الكمية', stock: 0, color: 'text-red-600 bg-red-50'},
               {name: 'طاولة قهوة دائرية', status: 'كمية منخفضة', stock: 2, color: 'text-amber-600 bg-amber-50'},
               {name: 'سجادة بوهيمية', status: 'كمية منخفضة', stock: 3, color: 'text-amber-600 bg-amber-50'},
             ].map((product, i) => (
               <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
                     <Package size={20} />
                   </div>
                   <div>
                     <h4 className="font-bold text-sm text-diyar-dark">{product.name}</h4>
                     <p className="text-xs text-gray-500 mt-0.5">المتبقي: {product.stock}</p>
                   </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold ${product.color}`}>
                   {product.status}
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    </div>
  );
}
