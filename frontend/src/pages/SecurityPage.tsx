import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock, Shield, Eye, EyeOff, Smartphone, LogOut } from 'lucide-react';

export default function SecurityPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      // Optional: show success message
    }, 1000);
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
            <span className="font-bold text-diyar-dark">الأمان وكلمة المرور</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">الأمان وكلمة المرور</h1>
          <p className="text-gray-500 text-sm">إدارة إعدادات الأمان وتغيير كلمة المرور الخاصة بحسابك</p>
        </div>

        <div className="space-y-6">
          {/* Password Change Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-diyar-dark">تغيير كلمة المرور</h2>
                <p className="text-xs text-gray-500">قم بتحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="space-y-5 mb-8">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input 
                      type={showPassword.current ? "text" : "password"} 
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-4 pl-12 text-gray-800 text-left focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors font-sans"
                      dir="ltr"
                    />
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input 
                      type={showPassword.new ? "text" : "password"} 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-4 pl-12 text-gray-800 text-left focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors font-sans"
                      dir="ltr"
                    />
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">يجب أن تحتوي على 8 أحرف على الأقل، تتضمن حروفاً وأرقاماً</p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input 
                      type={showPassword.confirm ? "text" : "password"} 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-4 pl-12 text-gray-800 text-left focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors font-sans"
                      dir="ltr"
                    />
                    <button 
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={isSaving || !formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors min-w-[150px] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'تحديث كلمة المرور'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-diyar-dark">التحقق بخطوتين (2FA)</h2>
                  <p className="text-xs text-gray-500">أضف طبقة أمان إضافية لحسابك</p>
                </div>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" />
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Smartphone size={24} className="text-gray-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-sm text-gray-800 mb-1">التحقق عبر الرسائل النصية (SMS)</h3>
                  <p className="text-sm text-gray-600">سيتم إرسال رمز تحقق صالح لمرة واحدة إلى رقم هاتفك (050****567) في كل مرة تقوم فيها بتسجيل الدخول.</p>
                </div>
              </div>
              <button className="text-diyar-brown font-bold text-sm hover:underline">إعداد التحقق بخطوتين</button>
            </div>
          </div>

          {/* Device Management */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <LogOut size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-diyar-dark">الأجهزة المتصلة</h2>
                  <p className="text-xs text-gray-500">إدارة الأجهزة التي تم تسجيل الدخول منها</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 flex-1 text-center sm:text-right">إذا لاحظت نشاطاً مريباً، يمكنك تسجيل الخروج من جميع الأجهزة الأخرى.</p>
              <button className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                تسجيل الخروج من الجلسات الأخرى
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #A98759;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #A98759;
        }
        [dir="rtl"] .toggle-checkbox {
          right: 1.5rem;
        }
        [dir="rtl"] .toggle-checkbox:checked {
          right: 0;
        }
      `}</style>
    </div>
  );
}
