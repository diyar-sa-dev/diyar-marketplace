import { RouteStatusPage } from './RouteStatusPage.tsx';
import { getStaticLocale } from '../../lib/i18n/staticLocale.ts';

export default function NotFoundPage() {
  const { t, dir } = getStaticLocale();

  return (
    <RouteStatusPage
      dir={dir}
      statusCode={404}
      title={t('status.notFound.title')}
      description={t('status.notFound.description')}
      primaryLabel={t('common.home')}
      primaryTo="/"
    />
  );
}
