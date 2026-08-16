import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock, Shield, Smartphone, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { formatPhoneDisplay } from '../lib/auth/validation.ts';

export default function SecurityPage() {
  const { user } = useAuth();
  const phoneDisplay = formatPhoneDisplay(user?.phone);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              الرئيسية
            </Link>
            <ChevronLeft size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition cursor-pointer">
              حسابي
            </Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">الأمان وكلمة المرور</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">
            الأمان وكلمة المرور
          </h1>
          <p className="text-gray-500 text-sm">
            استعادة كلمة المرور متاحة عبر OTP على رقم الجوال المسجل.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-diyar-dark">استعادة كلمة المرور</h2>
                <p className="text-xs text-gray-500">
                  تغيير كلمة المرور للمستخدم المسجل الدخول (بكلمة المرور الحالية) غير متاح بعد في
                  Stage 2.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              <p className="text-sm text-gray-600">
                استخدم استعادة كلمة المرور عبر رمز OTP على رقم الجوال:
                <span className="font-bold text-diyar-dark mx-1" dir="ltr">
                  {phoneDisplay || '—'}
                </span>
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                استعادة كلمة المرور عبر البريد الإلكتروني غير متاحة حالياً — رقم الجوال فقط.
              </p>
              <Link
                to="/auth"
                state={{ authView: 'forgot' }}
                className="inline-flex px-6 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-diyar-dark">التحقق بخطوتين (2FA)</h2>
                  <p className="text-xs text-gray-500">قيد التطوير — واجهة تجريبية فقط</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Smartphone size={24} className="text-gray-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm text-gray-800 mb-1">
                    التحقق عبر الرسائل النصية (SMS)
                  </h3>
                  <p className="text-sm text-gray-600">
                    سيتم تفعيل التحقق بخطوتين في مرحلة لاحقة. OTP الحالي يُستخدم للتسجيل واستعادة
                    كلمة المرور.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <LogOut size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-diyar-dark">الأجهزة المتصلة</h2>
                <p className="text-xs text-gray-500">قيد التطوير — واجهة تجريبية فقط</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                إدارة الجلسات النشطة على أجهزة متعددة ستُضاف لاحقاً. يمكنك تسجيل الخروج من صفحة
                حسابي.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
