import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Store, Wrench, Megaphone } from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { getAccessibleDashboardPortals, type DashboardPortalKey } from '../../lib/auth/roles.ts';

const PORTAL_ICONS: Record<DashboardPortalKey, typeof Store> = {
  vendor: Store,
  service: Wrench,
  affiliate: Megaphone,
};

export default function DashboardIndex() {
  const { status, user } = useAuthContext();
  const portals = getAccessibleDashboardPortals(user?.roles);

  if (status === 'loading') {
    return <LoadingState message="جاري التحقق من الجلسة..." />;
  }

  if (portals.length === 0) {
    return <Navigate to="/" replace />;
  }

  if (portals.length === 1) {
    return <Navigate to={portals[0].path} replace />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center -mt-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-diyar-dark mb-4">بوابات الشركاء</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          الرجاء اختيار نوع الحساب الذي ترغب بمعاينة لوحة التحكم الخاصة به.
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 max-w-4xl w-full ${
          portals.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
        }`}
      >
        {portals.map((portal) => {
          const Icon = PORTAL_ICONS[portal.key];

          return (
            <Link
              key={portal.key}
              to={portal.path}
              className={`bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl ${portal.hoverBorderClass} transition-all group flex flex-col items-center text-center`}
            >
              <div
                className={`w-20 h-20 ${portal.iconBgClass} ${portal.iconTextClass} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <Icon size={40} />
              </div>
              <h3 className="text-xl font-bold text-diyar-dark mb-2">{portal.title}</h3>
              <p className="text-sm text-gray-500">{portal.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
