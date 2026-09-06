import { Link } from 'react-router-dom';
import { Twitter, Instagram, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAboutModal } from '../../context/AboutModalContext.tsx';
import {
  shouldShowStorefrontDashboardLink,
  resolveDashboardEntryPath,
} from '../../lib/auth/roles.ts';
import {
  getPlatformSupportEmail,
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../../lib/platformContact.ts';

export function Footer() {
  const { t } = useLocale();
  const { openAboutModal } = useAboutModal();
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = resolveDashboardEntryPath(user?.roles);
  const showPartnerPortal = shouldShowStorefrontDashboardLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );
  const year = new Date().getFullYear();
  const supportEmail = getPlatformSupportEmail();
  const supportMailHref = getPlatformSupportMailHref();
  const supportPhoneDisplay = getPlatformSupportPhoneDisplay();
  const supportTelHref = getPlatformSupportTelHref();

  const quickLinks = [
    { label: t('footer.about'), action: 'about' as const },
    { label: t('footer.shopNow'), to: '/category/all' },
    { label: t('footer.specialOffers'), to: '/category/all' },
    { label: t('footer.blog'), to: '/blog' },
    { label: t('footer.joinMerchant'), to: '/auth?role=merchant' },
  ] as const;

  const serviceLinks = [
    { label: t('footer.arExperience'), to: '/ai-designer' },
    { label: t('footer.deliveryInstall'), to: '/services' },
    { label: t('footer.designServices'), to: '/services' },
    {
      label: t('footer.customServiceRequest'),
      to: '/services',
      state: { openRequest: true },
    },
  ] as const;

  return (
    <footer className="bg-diyar-dark text-white pt-6 md:pt-10 pb-4 mt-4">
      <div className="max-w-7xl mx-auto px-6 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-6 md:mb-10 text-start">
          <div>
            <img
              src="/logo_diyar.svg"
              alt=""
              className="h-8 md:h-9 mb-5 brightness-0 invert"
            />
            <p className="text-white/70 leading-relaxed mb-6 text-xs md:text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href={supportMailHref}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-diyar-brown hover:text-white cursor-pointer transition"
                aria-label={t('footer.contactUs')}
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {'action' in item && item.action === 'about' ? (
                    <button
                      type="button"
                      onClick={openAboutModal}
                      className="hover:text-white cursor-pointer transition block text-start w-full"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={'to' in item ? item.to : '/'}
                      className="hover:text-white cursor-pointer transition block"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">{t('footer.ourServices')}</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    state={'state' in item ? item.state : undefined}
                    className="hover:text-white cursor-pointer transition block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-sans font-bold mb-4">{t('footer.contactUs')}</h3>
            <ul className="space-y-2.5 text-white/70 text-xs md:text-sm text-start">
              <li>
                <a
                  href={supportMailHref}
                  className="inline-block hover:text-white transition cursor-pointer"
                  dir="ltr"
                >
                  {supportEmail}
                </a>
              </li>
              <li>
                <a
                  href={supportTelHref}
                  className="inline-block hover:text-white transition cursor-pointer"
                  dir="ltr"
                >
                  {supportPhoneDisplay}
                </a>
              </li>
              <li>{t('footer.address')}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-white/50 text-sm gap-4">
          <div>{t('footer.copyright', { year: String(year) })}</div>
          {showPartnerPortal ? (
            <Link to={dashboardPath} className="hover:text-white transition-colors cursor-pointer">
              {t('footer.partnerPortal')}
            </Link>
          ) : !isAuthenticated ? (
            <Link
              to="/auth"
              state={{ from: '/dashboard', reason: 'auth_required' }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t('footer.partnerPortal')}
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
