import React, { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Store, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptTeamInvite,
  fetchTeamInvitePreview,
  rejectTeamInvite,
} from '../api/vendorTeamInvite.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { parseApiError } from '../utils/errors.ts';
import { vendorAccessKeys } from '../hooks/vendor/useVendorTeam.ts';

export default function TeamInvitePage() {
  const { t, dir, locale } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const inviteQuery = useQuery({
    queryKey: ['team-invite', token],
    queryFn: () => fetchTeamInvitePreview(token),
    enabled: token.length > 0,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptTeamInvite(token),
    onSuccess: async () => {
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: vendorAccessKeys.all });
      toast.success(t('vendor.teamInvite.acceptSuccess'));
      navigate('/dashboard/vendor', { replace: true });
    },
    onError: (error) => toast.error(parseApiError(error, locale).message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectTeamInvite(token),
    onSuccess: async () => {
      toast.success(t('vendor.teamInvite.rejectSuccess'));
      await inviteQuery.refetch();
    },
    onError: (error) => toast.error(parseApiError(error, locale).message),
  });

  const emailMatches = useMemo(() => {
    if (!user?.email || !inviteQuery.data?.email) {
      return false;
    }
    return user.email.toLowerCase() === inviteQuery.data.email.toLowerCase();
  }, [inviteQuery.data?.email, user?.email]);

  useEffect(() => {
    if (inviteQuery.data?.status === 'accepted') {
      navigate('/dashboard/vendor', { replace: true });
    }
  }, [inviteQuery.data?.status, navigate]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (inviteQuery.isLoading) {
    return <LoadingState className="min-h-screen" message={t('vendor.teamInvite.loading')} />;
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={dir}>
        <ErrorState
          message={t('vendor.teamInvite.notFound')}
          onRetry={() => void inviteQuery.refetch()}
        />
      </div>
    );
  }

  const invite = inviteQuery.data;
  const isPending = invite.status === 'pending';
  const isRejected = invite.status === 'rejected';
  const isExpired = invite.status === 'expired';
  const busy = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50/80 via-gray-50 to-orange-50/40 flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-linear-to-br from-diyar-dark to-[#4a382f] px-6 py-8 text-center text-white">
          <img src="/logo_diyar.svg" alt="Diyar" className="h-10 mx-auto mb-4 brightness-0 invert" />
          <h1 className="text-xl font-bold">{t('vendor.teamInvite.title')}</h1>
          <p className="text-sm text-white/75 mt-2">{t('vendor.teamInvite.subtitle')}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
            <div className="w-12 h-12 rounded-xl bg-white border border-amber-100 flex items-center justify-center shrink-0">
              <Store className="text-diyar-brown" size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{t('vendor.teamInvite.storeLabel')}</p>
              <p className="font-bold text-diyar-dark truncate">{invite.store_name ?? '—'}</p>
              {invite.store_slug ? (
                <p className="text-xs text-diyar-brown font-mono truncate" dir="ltr">
                  /store/{invite.store_slug}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">{t('vendor.teamInvite.roleLabel')}</p>
              <p className="font-bold text-diyar-dark">
                {t(`vendor.team.roles.${invite.role}` as 'vendor.team.roles.manager')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-1">{t('vendor.teamInvite.emailLabel')}</p>
              <p className="font-bold text-diyar-dark truncate" dir="ltr">
                {invite.email}
              </p>
            </div>
          </div>

          {isRejected ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <XCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{t('vendor.teamInvite.rejectedMessage')}</p>
            </div>
          ) : null}

          {isExpired ? (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
              <XCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{t('vendor.teamInvite.expiredMessage')}</p>
            </div>
          ) : null}

          {isPending && !emailMatches ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
              {t('vendor.teamInvite.signInHint', { email: invite.email })}
              <Link to="/auth" className="block mt-3 font-bold text-diyar-brown hover:underline">
                {t('vendor.teamInvite.signInCta')}
              </Link>
            </div>
          ) : null}

          {isPending && emailMatches ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void acceptMutation.mutateAsync()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-diyar-brown text-white font-bold py-3 px-4 hover:bg-[#856b54] transition cursor-pointer disabled:opacity-60"
              >
                {acceptMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                {t('vendor.teamInvite.accept')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void rejectMutation.mutateAsync()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-700 font-bold py-3 px-4 hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
              >
                {rejectMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <XCircle size={18} />
                )}
                {t('vendor.teamInvite.reject')}
              </button>
            </div>
          ) : null}

          <div className="text-center pt-2">
            <Link to="/" className="text-sm text-gray-500 hover:text-diyar-brown transition">
              {t('vendor.teamInvite.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
