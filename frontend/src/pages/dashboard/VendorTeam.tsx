import React, { useState } from 'react';
import { Plus, Shield, Trash2, X } from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import {
  useInviteVendorTeamMember,
  useRemoveVendorTeamMember,
  useUpdateVendorTeamMember,
  useVendorTeam,
} from '../../hooks/vendor/useVendorTeam.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError, getFieldErrors } from '../../utils/errors.ts';
import type { VendorTeamMember, VendorTeamRole } from '../../api/vendorTeam.ts';

const INVITABLE_ROLES: Array<Exclude<VendorTeamRole, 'owner'>> = ['manager', 'customer_service'];

export default function VendorTeam() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const [tab, setTab] = useState<'active' | 'invited'>('active');
  const [page, setPage] = useState(1);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<VendorTeamRole, 'owner'>>('manager');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const teamQuery = useVendorTeam(page, 10, tab);
  const inviteMember = useInviteVendorTeamMember();
  const updateMember = useUpdateVendorTeamMember();
  const removeMember = useRemoveVendorTeamMember();

  const members = teamQuery.data?.items ?? [];
  const pagination = teamQuery.data?.pagination;

  const roleLabel = (role: VendorTeamRole) => t(`vendor.team.roles.${role}`);

  const roleBadge = (role: VendorTeamRole) => {
    const base = 'px-2.5 py-1 rounded-full text-xs font-bold w-fit';
    switch (role) {
      case 'owner':
        return (
          <span className={`${base} bg-purple-100 text-purple-700 inline-flex items-center gap-1`}>
            <Shield size={12} />
            {roleLabel(role)}
          </span>
        );
      case 'manager':
        return <span className={`${base} bg-blue-100 text-blue-700`}>{roleLabel(role)}</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-700`}>{roleLabel(role)}</span>;
    }
  };

  const handleInvite = async () => {
    setFieldErrors({});
    try {
      await inviteMember.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
        locale,
      });
      toast.success(t('vendor.team.inviteSuccess'));
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('manager');
      setTab('invited');
      setPage(1);
    } catch (error) {
      const fields = getFieldErrors(error);
      setFieldErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v[0] ?? ''])));
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleRoleChange = async (member: VendorTeamMember, role: Exclude<VendorTeamRole, 'owner'>) => {
    try {
      await updateMember.mutateAsync({ id: member.id, role });
      toast.success(t('vendor.team.updateSuccess'));
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  const handleRemove = async (member: VendorTeamMember) => {
    try {
      await removeMember.mutateAsync(member.id);
      toast.success(
        member.status === 'invited' ? t('vendor.team.cancelSuccess') : t('vendor.team.removeSuccess'),
      );
    } catch (error) {
      toast.error(parseApiError(error, locale).message);
    }
  };

  if (teamQuery.isLoading) {
    return <LoadingState className="min-h-60" />;
  }

  if (teamQuery.isError) {
    return <ErrorState message={t('vendor.team.loadError')} onRetry={() => void teamQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.team.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('vendor.team.subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-diyar-brown text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition cursor-pointer"
        >
          <Plus size={18} />
          {t('vendor.team.inviteButton')}
        </button>
      </div>

      <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
        {(['active', 'invited'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              tab === value ? 'bg-gray-100 text-diyar-dark font-bold' : 'text-gray-500 hover:text-diyar-dark'
            }`}
          >
            {t(`vendor.team.tabs.${value}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {members.map((member) => {
          const displayName = member.name ?? member.email.split('@')[0];

          return (
            <div
              key={member.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className={`flex items-center gap-4 min-w-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
                <UserAvatar name={displayName} avatarUrl={member.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-diyar-dark text-lg flex flex-wrap items-center gap-2">
                    <span className="wrap-break-word">{displayName}</span>
                    {member.status === 'invited' && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 font-normal whitespace-nowrap">
                        {t('vendor.team.pendingInvite')}
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-500 text-sm break-all" dir="ltr">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0">
                <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                  <p className="text-xs text-gray-400 mb-1">{t('vendor.team.permissionLabel')}</p>
                  {!member.is_owner && member.status === 'active' ? (
                    <select
                      value={member.role}
                      onChange={(event) =>
                        void handleRoleChange(member, event.target.value as Exclude<VendorTeamRole, 'owner'>)
                      }
                      disabled={updateMember.isPending}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    >
                      {INVITABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    roleBadge(member.role)
                  )}
                </div>

                {!member.is_owner ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRemove(member)}
                      disabled={removeMember.isPending}
                      className="p-2 text-gray-400 hover:text-red-500 transition bg-gray-50 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-60"
                      title={
                        member.status === 'invited' ? t('vendor.team.cancelInvite') : t('vendor.team.remove')
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">
          {tab === 'invited' ? t('vendor.team.emptyPending') : t('vendor.team.emptyActive')}
        </p>
      ) : null}

      {pagination && pagination.last_page > 1 ? (
        <PaginationBar
          pagination={{
            current_page: pagination.current_page,
            last_page: pagination.last_page,
            per_page: pagination.per_page,
            total: pagination.total,
          }}
          page={page}
          onPageChange={setPage}
        />
      ) : null}

      {isInviteModalOpen ? (
        <div
          className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-xl text-diyar-dark">{t('vendor.team.inviteTitle')}</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('vendor.team.emailLabel')}
                </RequiredLabel>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder={t('vendor.team.emailPlaceholder')}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown text-start"
                  dir="ltr"
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-2">
                <RequiredLabel required className="text-sm font-bold text-gray-700">
                  {t('vendor.team.permissionLabel')}
                </RequiredLabel>
                <select
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.target.value as Exclude<VendorTeamRole, 'owner'>)
                  }
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-diyar-brown appearance-none text-start"
                >
                  {INVITABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleInvite()}
                disabled={inviteMember.isPending}
                className="px-5 py-2.5 rounded-xl font-bold bg-diyar-brown text-white hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60"
              >
                {inviteMember.isPending ? t('vendor.team.sending') : t('vendor.team.sendInvite')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
