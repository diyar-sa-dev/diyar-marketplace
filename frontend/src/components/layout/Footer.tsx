import { Link } from 'react-router-dom';
import { Twitter, Instagram, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-diyar-dark text-white pt-6 md:pt-10 pb-4 mt-4">
      <div className="max-w-7xl mx-auto px-6 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-6 md:mb-10 text-right">
          <div>
            <img src="/logo_diyar.svg" alt="DIYAR" className="h-8 md:h-9 mb-5 brightness-0 invert" />
            <p className="text-white/70 leading-relaxed mb-6 text-xs md:text-sm">المنصة الأولى في المملكة لبيع الأثاث الفاخر من أعرق المتاجر والتجار لتجهيز منزلك بأرقى التصاميم.</p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition">
                <Twitter size={18} />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition">
                <Instagram size={18} />
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition">
                <MessageCircle size={18} />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm">
              <li className="hover:text-white cursor-pointer transition">عن ديار</li>
              <li className="hover:text-white cursor-pointer transition">تسوق الآن</li>
              <li className="hover:text-white cursor-pointer transition">العروض الخاصة</li>
              <li><Link to="/blog/1" className="hover:text-white cursor-pointer transition block">مدونة ديار</Link></li>
              <li className="hover:text-white cursor-pointer transition">انضم كتاجر</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">خدماتنا</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm">
              <li className="hover:text-white cursor-pointer transition">الواقع المعزز</li>
              <li className="hover:text-white cursor-pointer transition">التوصيل والتركيب</li>
              <li className="hover:text-white cursor-pointer transition">استشارات الديكور</li>
              <li className="hover:text-white cursor-pointer transition">سياسة الاسترجاع</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">تواصل معنا</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm">
              <li>support@diyar.com</li>
              <li>+966 50 000 0000</li>
              <li>الرياض، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-white/50 text-sm gap-4">
          <div>جميع الحقوق محفوظة منصة ديار &copy; {new Date().getFullYear()}</div>
          <Link to="/dashboard" className="hover:text-white transition-colors" title="Dashboard Preview">
            بوابة الشركاء (معاينة)
          </Link>
        </div>
      </div>
    </footer>
  );
}
