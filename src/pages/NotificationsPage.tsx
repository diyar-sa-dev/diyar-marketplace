import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, Package, Tag, Info, CheckCircle2, Settings } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'order',
    icon: <Package size={20} />,
    title: 'تم شحن طلبك بنجاح',
    message: 'طلبك رقم #15243 في طريقه إليك، نرجو التواجد في الموقع لاستلامه غداً.',
    time: 'منذ ساعتين',
    read: false,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 2,
    type: 'promo',
    icon: <Tag size={20} />,
    title: 'عروض نهاية العام بدأت الآن 🎊',
    message: 'خصومات تصل إلى 40% على قسم غرف النوم، انتهز الفرصة الآن.',
    time: 'منذ يوم',
    read: false,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 3,
    type: 'system',
    icon: <CheckCircle2 size={20} />,
    title: 'تأكيد الحساب المستار',
    message: 'تم تأكيد حسابك كمشتري تجاري، يمكنك الآن الاستفادة من أسعار الجملة.',
    time: 'منذ 3 أيام',
    read: true,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 4,
    type: 'order',
    icon: <Package size={20} />,
    title: 'تم استلام طلبك',
    message: 'المتجر يقوم حالياً بتجهيز طلبك رقم #15243، سنقوم بإعلامك فور شحنه.',
    time: 'منذ 4 أيام',
    read: true,
    color: 'text-diyar-brown',
    bgColor: 'bg-diyar-brown/10',
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition">حسابي</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">الإشعارات</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-diyar-dark flex items-center gap-3">
              الإشعارات
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full">
                  {unreadCount} جديدة
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">تتبع أحدث التنبيهات والأحداث الخاصة بحسابك</p>
          </div>
          
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-diyar-brown hover:text-diyar-dark font-bold transition-colors"
              >
                تحديد الكل كمقروء
              </button>
            )}
            <Link to="/profile/notification-settings" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-diyar-dark hover:bg-gray-50 transition-colors">
              <Settings size={20} />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => markAsRead(notification.id)}
                  className={`p-5 md:p-6 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50 ${!notification.read ? 'bg-amber-50/20' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notification.bgColor} ${notification.color}`}>
                    {notification.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                      <h3 className={`font-bold text-base ${!notification.read ? 'text-amber-900' : 'text-gray-800'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-diyar-dark mb-2">لا توجد إشعارات جديدة</h3>
              <p className="text-sm">سنقوم بإبلاغك حينما يكون هناك أي تحديثات عن طلباتك أو عروضنا.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
