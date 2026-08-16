import { useLocation } from 'react-router-dom';
import { RouteStatusPage } from './RouteStatusPage.tsx';
import { getStaticLocale } from '../../lib/i18n/staticLocale.ts';

export default function ForbiddenPage() {
  const location = useLocation();
  const { t, dir } = getStaticLocale();
  const from = (location.state as { from?: string } | null)?.from;

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
