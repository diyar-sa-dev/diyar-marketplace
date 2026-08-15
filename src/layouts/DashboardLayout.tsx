import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Store, 
  Wrench, 
  Megaphone, 
  Menu, 
  Bell, 
  LogOut, 
  Settings, 
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Calendar,
  Link as LinkIcon,
  BarChart,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  const getRoleFromPath = () => {
    if (location.pathname.includes('/vendor')) return 'vendor';
    if (location.pathname.includes('/service')) return 'service';
    if (location.pathname.includes('/affiliate')) return 'affiliate';
    return null;
  };

  const role = getRoleFromPath();

  const NAV_LINKS = {
    vendor: [
      { name: 'الرئيسية', path: '/dashboard/vendor', icon: LayoutDashboard },
      { name: 'الطلبات', path: '/dashboard/vendor/orders', icon: ShoppingCart },
      { name: 'المنتجات', path: '/dashboard/vendor/products', icon: Package },
      { name: 'فريق العمل', path: '/dashboard/vendor/team', icon: Users },
      { name: 'المالية', path: '/dashboard/vendor/finance', icon: Wallet },
      { name: 'إعدادات المتجر', path: '/dashboard/vendor/settings', icon: Settings },
    ],
    service: [
      { name: 'الرئيسية', path: '/dashboard/service', icon: LayoutDashboard },
      { name: 'طلبات العملاء', path: '/dashboard/service/client-requests', icon: Users },
      { name: 'الحجوزات', path: '/dashboard/service/bookings', icon: Calendar },
      { name: 'خدماتي', path: '/dashboard/service/services', icon: Wrench },
      { name: 'المالية', path: '/dashboard/service/finance', icon: Wallet },
      { name: 'الإعدادات', path: '/dashboard/service/settings', icon: Settings },
    ],
    affiliate: [
      { name: 'الرئيسية', path: '/dashboard/affiliate', icon: LayoutDashboard },
      { name: 'المنتجات المتاحة', path: '/dashboard/affiliate/products', icon: Package },
      { name: 'روابطي', path: '/dashboard/affiliate/links', icon: LinkIcon },
      { name: 'التقارير', path: '/dashboard/affiliate/reports', icon: BarChart },
      { name: 'سحب الأرباح', path: '/dashboard/affiliate/payouts', icon: Wallet },
      { name: 'الإعدادات', path: '/dashboard/affiliate/settings', icon: Settings },
    ]
  };

  const links = role ? NAV_LINKS[role] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 right-0 z-50 h-screen bg-diyar-dark text-white flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 md:w-20 translate-x-full md:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          {isSidebarOpen && <span className="font-bold text-xl text-diyar-cream truncate">لوحة التحكم</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          {!role ? (
             <div className="px-4 text-gray-400 text-sm">الرجاء اختيار نوع الحساب</div>
          ) : (
            <ul className="space-y-1 px-3">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isActive ? 'bg-diyar-brown text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                      title={link.name}
                    >
                      <Icon size={20} className="shrink-0" />
                      {isSidebarOpen && <span className="font-medium whitespace-nowrap">{link.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors" title="العودة للمتجر">
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="font-medium whitespace-nowrap">العودة للمتجر</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors -mr-2"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-diyar-dark truncate max-w-[150px] md:max-w-none">
              {role === 'vendor' ? 'بوابة التاجر' : role === 'service' ? 'بوابة مزود الخدمة' : role === 'affiliate' ? 'بوابة المسوق' : 'اختيار البوابة'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Demo Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-lg border border-gray-200 text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors">
                <span className="hidden sm:inline">تبديل الحساب</span>
                <span className="sm:hidden">بوابة</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <Link to="/dashboard/vendor" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                  <Store size={16} className="text-diyar-brown" /> تاجر
                </Link>
                <Link to="/dashboard/service" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                  <Wrench size={16} className="text-blue-500" /> مزود خدمة
                </Link>
                <Link to="/dashboard/affiliate" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm">
                  <Megaphone size={16} className="text-green-500" /> مسوق بالعمولة
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="relative p-2 text-gray-500 hover:text-diyar-dark transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-diyar-dark">الإشعارات</h3>
                      <button className="text-xs text-diyar-brown hover:underline font-medium">تحديد الكل كمقروء</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex gap-3 ${i === 1 ? 'bg-amber-50/30' : ''}`}>
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${i === 1 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                            {i === 1 ? <ShoppingCart size={18} /> : <Megaphone size={18} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-diyar-dark mb-1">
                              {i === 1 ? 'طلب جديد #1024' : 'إشعار تحديث من النظام'}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {i === 1 ? 'تم استلام طلب جديد بقيمة 1,250 ر.س. يرجى تجهيز الطلب بأسرع وقت.' : 'تم تحديث سياسات التسعير، يرجى مراجعة الشروط والأحكام الجديدة.'}
                            </p>
                            <span className="text-[10px] text-gray-400">منذ ساعتين</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <Link 
                        to={`/dashboard/${role}/notifications`} 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block w-full text-center py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-diyar-dark hover:bg-gray-50 hover:border-diyar-brown transition"
                      >
                        عرض جميع الإشعارات
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-diyar-cream flex items-center justify-center text-diyar-dark font-bold">
              ت
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
