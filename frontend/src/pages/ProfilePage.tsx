import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Bookmark,
  MapPin,
  Award,
  Star,
  Bell,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useToast } from '../hooks/useToast.ts';
import { useDeleteAvatar, useUploadAvatar } from '../hooks/profile/useProfile.ts';
import { UserAvatar } from '../components/profile/UserAvatar.tsx';
import { toSaudiPhoneNationalInput } from '../lib/auth/validation.ts';
import { roleLabel } from '../lib/auth/roles.ts';
import { useLocale } from '../lib/i18n/localeContext.ts';
import { collectDisplayErrors, isUnexpectedServerError } from '../utils/errors.ts';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale, dir } = useLocale();
  const { user, logout } = useAuth();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const MenuChevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    const result = await logout();
    toast.success(result.message ?? t('auth.toasts.logoutSuccess'));
    navigate('/');
  };

  const phoneDisplay = user?.phone ? toSaudiPhoneNationalInput(user.phone) : '';
  const roleSummary =
    user?.roles?.map((role) => roleLabel(role.name, t)).join(' • ') ?? t('profile.memberFallback');

  const menuItems = useMemo(
    () => [
      {
        group: t('profile.menu.groups.orders'),
        items: [
          {
            id: 'orders',
            icon: <Package size={20} />,
            title: t('profile.menu.orders.title'),
            subtitle: t('profile.menu.orders.subtitle'),
            link: '/orders',
          },
          {
            id: 'service_requests',
            icon: <Wrench size={20} />,
            title: t('profile.menu.serviceRequests.title'),
            subtitle: t('profile.menu.serviceRequests.subtitle'),
            link: '/profile/service-requests',
          },
          {
            id: 'b2b_offers',
            icon: <Building2 size={20} />,
            title: t('profile.menu.b2bOffers.title'),
            subtitle: t('profile.menu.b2bOffers.subtitle'),
            link: '/orders?tab=b2b',
          },
          {
            id: 'wishlist',
            icon: <Bookmark size={20} />,
            title: t('profile.menu.wishlist.title'),
            subtitle: t('profile.menu.wishlist.subtitle'),
            link: '/wishlist',
          },
          {
            id: 'reviews',
            icon: <Star size={20} />,
            title: t('profile.menu.reviews.title'),
            subtitle: t('profile.menu.reviews.subtitle'),
            link: '/profile/reviews',
          },
        ],
      },
      {
        group: t('profile.menu.groups.account'),
        items: [
          {
            id: 'personal',
            icon: <User size={20} />,
            title: t('profile.menu.personalInfo.title'),
            subtitle: t('profile.menu.personalInfo.subtitle'),
            link: '/profile/personal-info',
          },
          {
            id: 'addresses',
            icon: <MapPin size={20} />,
            title: t('profile.menu.addresses.title'),
            subtitle: t('profile.menu.addresses.subtitle'),
            link: '/profile/addresses',
          },
          {
            id: 'loyalty',
            icon: <Award size={20} />,
            title: t('profile.menu.loyalty.title'),
            subtitle: t('profile.menu.loyalty.subtitle'),
            link: '/loyalty',
          },
        ],
      },
      {
        group: t('profile.menu.groups.settings'),
        items: [
          {
            id: 'security',
            icon: <Shield size={20} />,
            title: t('profile.menu.security.title'),
            subtitle: t('profile.menu.security.subtitle'),
            link: '/profile/security',
          },
          {
            id: 'notifications',
            icon: <Bell size={20} />,
            title: t('profile.menu.notifications.title'),
            subtitle: t('profile.menu.notifications.subtitle'),
            link: '/profile/notifications',
          },
          {
            id: 'language',
            icon: <Globe size={20} />,
            title: t('profile.menu.language.title'),
            subtitle: t('profile.menu.language.subtitle'),
            link: '/profile/language',
          },
        ],
      },
    ],
    [t],
  );

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await uploadAvatar.mutateAsync(file);
      toast.success(result.message ?? t('profile.avatar.uploadSuccess'));
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        throw new Error(collectDisplayErrors(error, locale).message);
      }
      toast.error(collectDisplayErrors(error, locale).message ?? t('profile.avatar.uploadError'));
    }
  };

  const handleAvatarDelete = async () => {
    try {
      const result = await deleteAvatar.mutateAsync();
      toast.success(result.message ?? t('profile.avatar.deleteSuccess'));
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        throw new Error(collectDisplayErrors(error, locale).message);
      }
      toast.error(collectDisplayErrors(error, locale).message ?? t('profile.avatar.deleteError'));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-diyar-dark text-white pt-12 pb-20 px-4 rounded-b-[40px] relative overflow-visible">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:gap-5 md:text-start">
          <UserAvatar
            name={user?.name}
            avatarUrl={user?.avatar_url}
            variant="onDark"
            editable
            isUploading={uploadAvatar.isPending}
            isDeleting={deleteAvatar.isPending}
            onUpload={(file) => void handleAvatarUpload(file)}
            onDelete={() => void handleAvatarDelete()}
          />
          <div className="min-w-0 w-full md:flex-1">
            <h1 className="text-xl md:text-2xl font-bold mb-2 leading-normal wrap-break-word">
              {user?.name ?? t('profile.title')}
            </h1>
            <p className="mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/70 md:justify-start">
              <span className="break-all">{user?.email ?? '—'}</span>
              {phoneDisplay ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span dir="ltr" className="inline-block whitespace-nowrap">
                    +966 {phoneDisplay}
                  </span>
                </>
              ) : null}
            </p>
            <div className="mx-auto flex w-max max-w-full items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md md:mx-0">
              <Award size={14} className="shrink-0 text-amber-400" />
              <span>{roleSummary}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {menuItems.map((group) => (
          <div
            key={group.group}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-sm">{group.group}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-diyar-brown flex items-center justify-center shrink-0 ms-0 me-4 group-hover:bg-diyar-brown group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm mb-0.5 text-balance leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 text-balance">{item.subtitle}</p>
                  </div>
                  <MenuChevron
                    size={18}
                    className="text-gray-300 group-hover:text-diyar-brown transition-colors shrink-0"
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full bg-white rounded-3xl shadow-sm border border-red-100 p-4 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={20} />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );
}
