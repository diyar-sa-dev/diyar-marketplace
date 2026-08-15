import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Package, 
  Bookmark, 
  MapPin, 
  Award, 
  Star, 
  Bell, 
  Settings, 
  Globe, 
  LogOut,
  ChevronLeft,
  Shield,
  Wrench
} from 'lucide-react';

export default function ProfilePage() {
  const menuItems = [
    {
      group: "الطلبات والمشتريات",
      items: [
        { id: 'orders', icon: <Package size={20} />, title: "طلباتي", subtitle: "تتبع الطلبات، حالة الشحن والتركيب", link: "/orders" },
        { id: 'service_requests', icon: <Wrench size={20} />, title: "طلبات الخدمات والصيانة", subtitle: "عروض الأسعار، طلبات التفصيل والصيانة", link: "/profile/service-requests" },
        { id: 'wishlist', icon: <Bookmark size={20} />, title: "المحفوظات", subtitle: "المنتجات والخدمات التي تم حفظها", link: "/wishlist" },
        { id: 'reviews', icon: <Star size={20} />, title: "تقييماتي ومراجعاتي", subtitle: "سجل التقييمات للمنتجات والخدمات", link: "/profile/reviews" },
      ]
    },
    {
      group: "حسابي",
      items: [
        { id: 'personal', icon: <User size={20} />, title: "البيانات الشخصية", subtitle: "الاسم، رقم الهاتف، البريد الإلكتروني", link: "/profile/personal-info" },
        { id: 'addresses', icon: <MapPin size={20} />, title: "عناوين الشحن", subtitle: "إدارة وإضافة عناوين جديدة", link: "/profile/addresses" },
        { id: 'loyalty', icon: <Award size={20} />, title: "نقاط الولاء (ديار)", subtitle: "الرصيد المتاح وسجل الاستخدام", link: "/loyalty" },
      ]
    },
    {
      group: "الإعدادات",
      items: [
        { id: 'security', icon: <Shield size={20} />, title: "الأمان وكلمة المرور", subtitle: "تغيير كلمة المرور وإعدادات الأمان", link: "/profile/security" },
        { id: 'notifications', icon: <Bell size={20} />, title: "الإشعارات", subtitle: "تفضيلات رسائل التنبيه والعروض", link: "/profile/notifications" },
        { id: 'language', icon: <Globe size={20} />, title: "اللغة", subtitle: "العربية", link: "/profile/language" },
      ]
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Header Profile Info */}
      <div className="bg-diyar-dark text-white pt-10 pb-20 px-4 rounded-b-[40px] relative">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/40 shrink-0">
            أ
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">أحمد محمد</h1>
            <p className="text-white/70 text-sm mb-2">ahmed@example.com <span className="mx-2">•</span> 0501234567</p>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-max text-xs font-semibold backdrop-blur-md">
              <Award size={14} className="text-amber-400" />
              <span>عضو ذهبي - 1,250 نقطة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {menuItems.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">{group.group}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map((item) => (
                <Link 
                  key={item.id} 
                  to={item.link}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-diyar-brown flex items-center justify-center shrink-0 ml-4 group-hover:bg-diyar-brown group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm mb-0.5">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                  <ChevronLeft size={18} className="text-gray-300 group-hover:text-diyar-brown transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button className="w-full bg-white rounded-3xl shadow-sm border border-red-100 p-4 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 transition-colors">
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
