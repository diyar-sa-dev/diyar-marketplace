import { useLocation, Navigate } from 'react-router-dom';
import { RouteStatusPage } from './RouteStatusPage.tsx';
import { getStaticLocale } from '../../lib/i18n/staticLocale.ts';

export default function ForbiddenPage() {
  const location = useLocation();
  const state = location.state as { from?: string; isForbidden?: boolean } | null;

  // Direct manual navigation without a 403 authorization context redirects to home
  if (!state?.isForbidden && !state?.from) {
    return <Navigate to="/" replace />;
  }

  const { t, dir } = getStaticLocale();
  const from = state?.from;

  return (
    <RouteStatusPage
      dir={dir}
      statusCode={403}
      title={t('status.forbidden.title')}
      description={
        from
          ? t('status.forbidden.descriptionWithPath', { path: from })
          : t('status.forbidden.description')
      }
      primaryLabel={t('common.home')}
      primaryTo="/"
    />
  );
}
