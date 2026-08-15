import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Camera } from 'lucide-react';

export default function PersonalInfoPage() {
  const [formData, setFormData] = useState({
    firstName: 'أحمد',
    lastName: 'محمد',
    email: 'ahmed@example.com',
    phone: '0501234567',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
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
            <span className="font-bold text-diyar-dark">البيانات الشخصية</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2">البيانات الشخصية</h1>
          <p className="text-gray-500 text-sm">قم بتحديث بياناتك الشخصية وطرق التواصل الخاصة بك</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-50 text-diyar-brown rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-sm">
                  {formData.firstName.charAt(0)}
                </div>
                <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-diyar-dark text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-black transition-colors">
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* First Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم العائلة</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    dir="ltr"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-4 text-gray-800 text-right focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    dir="ltr"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pr-11 pl-20 text-gray-800 text-right focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-medium text-sm border-r border-gray-200 pr-3">
                    +966
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <Link to="/profile" className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                إلغاء
              </Link>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-8 py-3 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors min-w-[120px] flex justify-center items-center"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'حفظ التغييرات'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
