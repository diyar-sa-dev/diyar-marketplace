import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Wrench, Megaphone } from 'lucide-react';

export default function DashboardIndex() {
  return (
    <div className="h-full flex flex-col items-center justify-center -mt-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-diyar-dark mb-4">بوابات الشركاء (نسخة تجريبية)</h2>
        <p className="text-gray-500 max-w-md mx-auto">الرجاء اختيار نوع الحساب الذي ترغب بمعاينة لوحة التحكم الخاصة به.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <Link to="/dashboard/vendor" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-diyar-brown/30 transition-all group flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-50 text-diyar-brown rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Store size={40} />
          </div>
          <h3 className="text-xl font-bold text-diyar-dark mb-2">التاجر / المتجر</h3>
          <p className="text-sm text-gray-500">إدارة المنتجات، الطلبات، المخزون، وتحليل المبيعات.</p>
        </Link>
        
        <Link to="/dashboard/service" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all group flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Wrench size={40} />
          </div>
          <h3 className="text-xl font-bold text-diyar-dark mb-2">مقدم خدمة</h3>
          <p className="text-sm text-gray-500">صيانة، تصميم، تركيب، وإدارة مواعيد الحجوزات.</p>
        </Link>
        
        <Link to="/dashboard/affiliate" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-500/30 transition-all group flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Megaphone size={40} />
          </div>
          <h3 className="text-xl font-bold text-diyar-dark mb-2">مسوق بالعمولة</h3>
          <p className="text-sm text-gray-500">تتبع الزيارات، الطلبات المحققة، وطلب سحب الأرباح.</p>
        </Link>
      </div>
    </div>
  );
}
