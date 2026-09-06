import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Grid, Home as HomeIcon, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../hooks/cart/useCart.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type MobileBottomNavProps = {
  onOpenCart: () => void;
  isLoggedIn: boolean;
  accountHubHref: string;
  accountHubIsExternal: boolean;
  isAccountActive: boolean;
};

export function MobileBottomNav({
  onOpenCart,
  isLoggedIn,
  accountHubHref,
  accountHubIsExternal,
  isAccountActive,
}: MobileBottomNavProps) {
  const location = useLocation();
  const { count } = useCart();
  const { t } = useLocale();
  const isHome = location.pathname === '/';
  const isCategory = location.pathname.startsWith('/category');

  if (['/auth', '/dashboard'].some((path) => location.pathname.startsWith(path))) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center h-17.5 z-50 px-2 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.08)]">
      <Link
        to="/"
        aria-label={t('layout.nav.home')}
        className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 cursor-pointer transition ${isHome ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-dark'}`}
      >
        <HomeIcon size={22} className="mb-1" />
        <span className="text-[11px] font-bold">{t('layout.nav.home')}</span>
      </Link>
      <Link
        to="/category/all"
        aria-label={t('layout.nav.categories')}
        className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 cursor-pointer transition ${isCategory ? 'text-diyar-dark' : 'text-gray-400 hover:text-diyar-dark'}`}
      >
        <Grid size={22} className="mb-1" />
        <span className="text-[11px] font-medium">{t('layout.nav.categories')}</span>
      </Link>
      <button
        type="button"
        className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 text-gray-400 hover:text-diyar-dark cursor-pointer transition ${isHome ? 'text-diyar-dark' : ''}`}
        onClick={onOpenCart}
        aria-label={t('layout.nav.cart')}
      >
        <div className="relative">
          <ShoppingCart size={22} className="mb-1" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-diyar-dark text-diyar-cream text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium">{t('layout.nav.cart')}</span>
      </button>
      <Link
        to="/wishlist"
        aria-label={t('layout.nav.wishlist')}
        className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 text-gray-400 hover:text-diyar-dark cursor-pointer transition ${location.pathname === '/wishlist' ? 'text-diyar-dark' : ''}`}
      >
        <Bookmark size={22} className="mb-1" />
        <span className="text-[11px] font-medium">{t('layout.nav.wishlist')}</span>
      </Link>
      {isLoggedIn && accountHubIsExternal ? (
        <a
          href={accountHubHref}
          className={`flex flex-col items-center justify-center flex-1 h-full text-gray-400 hover:text-diyar-dark cursor-pointer transition ${isAccountActive ? 'text-diyar-dark' : ''}`}
        >
          <User size={22} className="mb-1" />
          <span className="text-[11px] font-medium">{t('layout.nav.myAccount')}</span>
        </a>
      ) : (
        <Link
          to={isLoggedIn ? accountHubHref : '/auth'}
          aria-label={t('layout.nav.myAccount')}
          className={`flex flex-col items-center justify-center flex-1 min-h-11 min-w-11 text-gray-400 hover:text-diyar-dark cursor-pointer transition ${isAccountActive ? 'text-diyar-dark' : ''}`}
        >
          <User size={22} className="mb-1" />
          <span className="text-[11px] font-medium">{t('layout.nav.myAccount')}</span>
        </Link>
      )}
    </div>
  );
}
