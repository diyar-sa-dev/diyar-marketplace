import React from 'react';
import { Bell, ShoppingCart, Megaphone, CheckCircle, Clock } from 'lucide-react';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'طلب جديد #1024',
      message: 'تم استلام طلب جديد بقيمة 1,250 ر.س. يرجى تجهيز الطلب بأسرع وقت.',
      time: 'منذ ساعتين',
      read: false,
    },
    {
      id: 2,
      type: 'system',
      title: 'تحديث من النظام',
      message: 'تم تحديث سياسات التسعير، يرجى مراجعة الشروط والأحكام الجديدة لتجنب أي مشاكل في حسابك.',
      time: 'منذ يوم',
      read: true,
    },
    {
      id: 3,
      type: 'system',
      title: 'تم إرسال مستحقاتك',
      message: 'تم تحويل مبلغ 4,500 ر.س إلى حسابك البنكي بنجاح. ستصلك رسالة من البنك قريباً.',
      time: 'منذ يومين',
      read: true,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">جميع الإشعارات</h2>
          <p className="text-gray-500 text-sm mt-1">تابع أحدث الطلبات والتحديثات الخاصة بحسابك.</p>
        </div>
        <button className="text-sm font-bold text-diyar-brown hover:underline flex items-center gap-2">
          <CheckCircle size={16} />
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        { notifications.map((notif) => (
          <div key={notif.id} className={`p-6 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex items-start gap-4 ${!notif.read ? 'bg-amber-50/20' : ''}`}>
            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${notif.type === 'order' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {notif.type === 'order' ? <ShoppingCart size={24} /> : <Megaphone size={24} />}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <h3 className={`font-bold text-lg ${!notif.read ? 'text-diyar-dark' : 'text-gray-700'}`}>{notif.title}</h3>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} /> {notif.time}
                </span>
              </div>
              <p className={`text-sm ${!notif.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{notif.message}</p>
            </div>
            {!notif.read && (
              <span className="w-3 h-3 bg-diyar-brown rounded-full mt-2 shrink-0"></span>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-lg">لا توجد إشعارات</p>
            <p className="text-sm">لم تصلك أي إشعارات جديدة بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
