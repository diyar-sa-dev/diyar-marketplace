import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';

type AffiliateProfile = {
  id: string;
  status?: string;
  user?: { id?: string; name?: string; email?: string | null; phone?: string | null };
  commission_rate?: string | number | null;
};

export default function AdminAffiliateHubPage() {
  const { t } = useLocale();
  const {
    data,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
  } = useAdminListQuery<AffiliateProfile>({
    resourceKey: 'admin-affiliate-profiles',
    endpoint: '/admin/affiliate/profiles',
    itemsKey: 'profiles',
  });

  const profiles = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.nav.affiliate')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.affiliate.profilesSubtitle')}</p>
      </div>

      <AdminResourceTable
        title={t('admin.nav.affiliateProfiles')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.tables.searchAffiliateProfiles')}
        filters={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          >
            <option value="">{t('admin.tables.allStatuses')}</option>
            <option value="active">{t('admin.tables.active')}</option>
            <option value="suspended">{t('admin.tables.suspended')}</option>
            <option value="pending">{t('admin.tables.pending')}</option>
          </select>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={profiles.length === 0}
        emptyTitle={t('admin.affiliate.profilesEmpty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.contact')}</th>
            <th className="px-4 py-3 text-start font-semibold">
              {t('admin.affiliate.commissionRate')}
            </th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        }
      >
        {profiles.map((profile) => (
          <tr key={profile.id} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3 font-semibold text-diyar-dark">{profile.user?.name ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">
              {profile.user?.email ?? profile.user?.phone ?? '—'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700">
              {profile.commission_rate != null ? `${profile.commission_rate}%` : '—'}
            </td>
            <td className="px-4 py-3">
              {profile.status ? <AdminStatusBadge status={profile.status} /> : '—'}
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                {profile.user?.id ? (
                  <Link
                    to={`/admin/users/${profile.user.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                  >
                    {t('admin.tables.view')}
                  </Link>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </AdminResourceTable>

      <p className="text-sm text-gray-500">
        {t('admin.affiliate.configHint')}{' '}
        <Link to="/admin/settings" className="font-semibold text-diyar-brown hover:text-diyar-dark">
          {t('admin.nav.settings')}
          <ExternalLink size={12} className="ms-1 inline" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
