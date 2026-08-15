import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, Smartphone, Mail, Package, Tag, Info } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    push: true,
    email: true,
    sms: false,
    orders: true,
    promotions: false,
    system: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition">الرئيسية</Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition">حسابي</Link>
            <ChevronLeft size={16} />
            <Link to="/profile/notifications" className="hover:text-diyar-dark transition">الإشعارات</Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">إعدادات الإشعارات</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">إعدادات الإشعارات</h1>
          <p className="text-gray-500 text-sm">تحكم في كيفية تلقيك للتنبيهات والرسائل</p>
        </div>

        <div className="space-y-6">
          {/* Channels */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-lg text-diyar-dark">قنوات التواصل</h2>
              <p className="text-xs text-gray-500 mt-1">اختر الطرق التي تفضل أن نتواصل معك من خلالها</p>
            </div>
            
            <div className="divide-y divide-gray-50">
              {/* Push Notes */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">إشعارات التطبيق / المتصفح</h3>
                    <p className="text-xs text-gray-500">تلقي التنبيهات المباشرة على جهازك</p>
                  </div>
                </div>
                <Toggle isChecked={settings.push} onToggle={() => toggleSetting('push')} />
              </div>

              {/* Email */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">البريد الإلكتروني</h3>
                    <p className="text-xs text-gray-500">تلقي التحديثات عبر البريد الإلكتروني</p>
                  </div>
                </div>
                <Toggle isChecked={settings.email} onToggle={() => toggleSetting('email')} />
              </div>

              {/* SMS */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">الرسائل النصية (SMS)</h3>
                    <p className="text-xs text-gray-500">تلقي التحديثات الهامة عبر رسائل الجوال</p>
                  </div>
                </div>
                <Toggle isChecked={settings.sms} onToggle={() => toggleSetting('sms')} />
              </div>
            </div>
          </div>

          {/* Types */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-lg text-diyar-dark">أنواع الإشعارات</h2>
              <p className="text-xs text-gray-500 mt-1">اختر أنواع التنبيهات التي تود استلامها</p>
            </div>
            
            <div className="divide-y divide-gray-50">
              {/* Orders */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">تحديثات الطلبات</h3>
                    <p className="text-xs text-gray-500">تنبيهات حول حالة الطلب، الشحن، ومواعيد التركيب</p>
                  </div>
                </div>
                <Toggle isChecked={settings.orders} onToggle={() => toggleSetting('orders')} />
              </div>

              {/* Promotions */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">العروض والخصومات</h3>
                    <p className="text-xs text-gray-500">أحدث العروض الحصرية وإشعارات التخفيضات</p>
                  </div>
                </div>
                <Toggle isChecked={settings.promotions} onToggle={() => toggleSetting('promotions')} />
              </div>

              {/* System */}
              <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 mb-1">تحديثات الحساب</h3>
                    <p className="text-xs text-gray-500">تنبيهات الأمان وتغييرات ملفك الشخصي</p>
                  </div>
                </div>
                <Toggle isChecked={settings.system} onToggle={() => toggleSetting('system')} disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Component
function Toggle({ isChecked, onToggle, disabled = false }: { isChecked: boolean, onToggle: () => void, disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-diyar-dark focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        isChecked ? 'bg-diyar-dark' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out rtl:translate-x-0 ${
          isChecked ? '-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
