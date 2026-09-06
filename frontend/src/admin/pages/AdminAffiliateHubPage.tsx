import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';

type AffiliateProfile = {
  id: string;
  status?: string;
  display_name?: string | null;
  referral_code?: string | null;
  user?: { id?: string; name?: string; email?: string | null; phone?: string | null };
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
    perPage,
    setPerPage,
  } = useAdminListQuery<AffiliateProfile>({
    resourceKey: 'admin-affiliate-profiles',
    endpoint: '/admin/affiliate/profiles',
    itemsKey: 'affiliate_profiles',
  });

  const profiles = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.affiliate')}
      subtitle={t('admin.affiliate.profilesSubtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchAffiliateProfiles')}
      filters={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown cursor-pointer"
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
          <th className="px-4 py-3 text-start font-semibold">
            {t('admin.affiliate.referralCode')}
          </th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.contact')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
          <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
        </tr>
      }
      footer={
        <AdminTablePagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={setPerPage}
          isLoading={isLoading}
        />
      }
    >
      {profiles.map((profile) => {
        const name = profile.display_name || profile.user?.name || '—';
        const contact = profile.user?.email ?? formatPhoneDisplay(profile.user?.phone) ?? '—';

        return (
          <tr key={profile.id} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3">
              <Link
                to={`/admin/affiliate/${profile.id}`}
                className="font-semibold text-diyar-dark hover:text-diyar-brown"
              >
                {name}
              </Link>
            </td>
            <td className="px-4 py-3 text-start">
              <TableLtrValue className="font-mono text-xs text-gray-500">
                {profile.referral_code ?? '—'}
              </TableLtrValue>
            </td>
            <td className="px-4 py-3 text-start">
              <TableLtrValue className="text-sm text-gray-600">{contact}</TableLtrValue>
            </td>
            <td className="px-4 py-3">
              {profile.status ? <AdminStatusBadge status={profile.status} /> : '—'}
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <Link
                  to={`/admin/affiliate/${profile.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                  aria-label={t('admin.tables.view')}
                >
                  <Eye size={14} />
                  <span className="hidden sm:inline">{t('admin.tables.view')}</span>
                </Link>
              </div>
            </td>
          </tr>
        );
      })}
    </AdminResourceTable>
  );
}
