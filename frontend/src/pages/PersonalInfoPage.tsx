import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { formatPhoneDisplay } from '../lib/auth/validation.ts';

export default function PersonalInfoPage() {
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
            <span className="font-bold text-diyar-dark">البيانات الشخصية</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">البيانات الشخصية</h1>
          <p className="text-gray-500 text-sm">
            بياناتك من حساب DIYAR الحالي. تحديث الملف الشخصي عبر API سيُضاف في مرحلة لاحقة.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  readOnly
                  value={user?.name ?? ''}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  readOnly
                  value={user?.email ?? '—'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  readOnly
                  value={phoneDisplay}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
