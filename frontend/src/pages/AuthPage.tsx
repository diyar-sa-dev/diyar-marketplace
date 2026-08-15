import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Mail, Phone, Lock, Eye, EyeOff, Store, Briefcase, User, Megaphone, Smartphone } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'otp'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone');
  
  // Registration data
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['customer']);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const roles = [
    { id: 'customer', title: 'عميل', icon: <User size={20} /> },
    { id: 'merchant', title: 'تاجر', icon: <Store size={20} /> },
    { id: 'service_provider', title: 'مقدم خدمة', icon: <Briefcase size={20} /> },
    { id: 'marketer', title: 'مسوق', icon: <Megaphone size={20} /> },
  ];

  const handleRoleToggle = (roleId: string) => {
    if (roleId === 'customer' && selectedRoles.length === 1 && selectedRoles[0] === 'customer') return;
    
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const simulateAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = '/'; // Reload to apply state
    }, 1500);
  };

  const simulateOtpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setView('otp');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 text-gray-500 hover:text-diyar-dark transition-colors font-bold px-4 py-2 border border-gray-200 rounded-full bg-white shadow-sm z-10">
        <span className="text-sm">العودة</span>
        <ChevronRight size={20} />
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src="/logo_diyar.svg" alt="DIYAR" className="h-12" />
        </Link>
        
        {view === 'login' && <h2 className="text-center text-2xl md:text-3xl font-extrabold text-diyar-dark mb-2">تسجيل الدخول</h2>}
        {view === 'register' && <h2 className="text-center text-2xl md:text-3xl font-extrabold text-diyar-dark mb-2">إنشاء حساب جديد</h2>}
        {view === 'forgot' && <h2 className="text-center text-2xl md:text-3xl font-extrabold text-diyar-dark mb-2">استعادة كلمة المرور</h2>}
        {view === 'otp' && <h2 className="text-center text-2xl md:text-3xl font-extrabold text-diyar-dark mb-2">التحقق بخطوتين</h2>}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white py-8 px-4 shadow-xl shadow-diyar-brown/5 sm:rounded-xl md:rounded-3xl sm:px-10 border border-gray-100 relative overflow-hidden">
          
          {/* LOGIN VIEW */}
          {view === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Login Method Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loginMethod === 'phone' ? 'bg-white shadow-sm text-diyar-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  الجوال
                </button>
                <button 
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loginMethod === 'email' ? 'bg-white shadow-sm text-diyar-dark' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  البريد الإلكتروني
                </button>
              </div>

              <form onSubmit={simulateAuth} className="space-y-6">
                {loginMethod === 'email' ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input type="email" required defaultValue="demo@diyar.com" className="w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors" placeholder="example@email.com" dir="ltr" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
                    <div className="relative flex">
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 z-10">
                        <Smartphone size={18} />
                      </div>
                      <input type="tel" required defaultValue="501234567" className="flex-1 pl-3 pr-10 py-3 border border-gray-200 rounded-r-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors" placeholder="5X XXX XXXX" dir="ltr" />
                      <div className="bg-gray-50 border border-gray-200 border-l-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-gray-600" dir="ltr">
                        +966
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      defaultValue="password123"
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors font-sans" 
                      placeholder="••••••••" 
                      dir="ltr" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" id="remember" className="w-4 h-4 text-diyar-brown border-gray-300 rounded focus:ring-diyar-brown cursor-pointer" />
                    <label htmlFor="remember" className="text-sm text-gray-600 group-hover:text-diyar-dark cursor-pointer">تذكرني</label>
                  </div>
                  <button type="button" onClick={() => setView('forgot')} className="text-sm font-bold text-diyar-brown hover:text-diyar-dark">نسيت كلمة المرور؟</button>
                </div>

                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'تسجيل الدخول'}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 font-bold">ليس لديك حساب؟</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button onClick={() => setView('register')} className="w-full py-3 px-4 rounded-xl text-diyar-dark font-bold bg-white border-2 border-gray-100 hover:border-diyar-brown hover:text-diyar-brown transition-colors">
                    إنشاء حساب جديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <button onClick={() => setView('login')} className="absolute top-4 right-4 text-gray-400 hover:text-diyar-dark">
                  <ChevronRight size={24} />
               </button>

               <form onSubmit={simulateOtpRequest} className="space-y-5">
                 
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">حدد نوع الحساب (يمكن اختيار أكثر من خيار)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <div 
                        key={role.id}
                        onClick={() => handleRoleToggle(role.id)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-colors ${selectedRoles.includes(role.id) ? 'border-diyar-brown bg-orange-50 text-diyar-dark' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                         <div className={selectedRoles.includes(role.id) ? 'text-diyar-brown' : 'text-gray-400'}>
                           {role.icon}
                         </div>
                         <span className="font-bold text-sm">{role.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    <input type="text" required defaultValue="عبدالله خالد" className="w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors" placeholder="الاسم الكامل" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني (اختياري)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input type="email" defaultValue="abdullah@example.com" className="w-full pl-3 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors" placeholder="example@email.com" dir="ltr" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال *</label>
                  <div className="relative flex">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 z-10">
                      <Smartphone size={18} />
                    </div>
                    <input type="tel" required defaultValue="501234567" className="flex-1 pl-3 pr-10 py-3 border border-gray-200 rounded-r-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors" placeholder="5X XXX XXXX" dir="ltr" />
                    <div className="bg-gray-50 border border-gray-200 border-l-0 rounded-l-xl px-4 flex items-center justify-center font-bold text-gray-600" dir="ltr">
                      +966
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'متابعة'}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-4 leading-relaxed mt-2">
                    بالتسجيل فإنك توافق على <a href="#" className="text-diyar-brown hover:underline">الشروط والأحكام</a> و <a href="#" className="text-diyar-brown hover:underline">سياسة الخصوصية</a>
                  </p>
                </div>
               </form>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === 'forgot' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
               <button onClick={() => setView('login')} className="absolute top-4 right-4 text-gray-400 hover:text-diyar-dark">
                  <ChevronRight size={24} />
               </button>

               <div className="text-center mb-6">
                 <p className="text-gray-600 text-sm">أدخل رقم جوالك أو بريدك الإلكتروني المسجل لدينا وسنرسل لك رمزاً للتحقق (OTP).</p>
               </div>

               <form onSubmit={simulateOtpRequest} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال أو البريد الإلكتروني</label>
                  <div className="relative">
                    <input type="text" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors text-center" placeholder="5XXXXXXX أو user@mail.com" dir="ltr" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'إرسال الرمز'}
                </button>
               </form>
            </div>
          )}

          {/* OTP VIEW */}
          {view === 'otp' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <button onClick={() => setView('login')} className="absolute top-4 right-4 text-gray-400 hover:text-diyar-dark">
                  <ChevronRight size={24} />
               </button>

               <div className="text-center mb-8">
                 <p className="text-gray-600 text-sm">لقد قمنا بإرسال رمز تحقق مكون من 4 أرقام.</p>
                 <p className="font-bold text-diyar-dark mt-1" dir="ltr">+966 50 *** **67</p>
               </div>

               <form onSubmit={simulateAuth} className="space-y-6">
                <div className="flex justify-center gap-3" dir="ltr">
                  {[1, 2, 3, 4].map((i) => (
                    <input 
                      key={i}
                      type="text" 
                      maxLength={1} 
                      className="w-14 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors"
                      required
                    />
                  ))}
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-500 mb-2">لم تستلم الرمز؟</p>
                  <button type="button" className="text-sm font-bold text-diyar-brown hover:text-diyar-dark">إعادة إرسال الرمز (0:59)</button>
                </div>

                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-diyar-dark hover:bg-black transition-colors flex justify-center items-center mt-6">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'تحقق'}
                </button>
               </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
