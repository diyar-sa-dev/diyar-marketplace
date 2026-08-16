import { RouteStatusPage } from '../../pages/errors/RouteStatusPage.tsx';
import { getStaticLocale } from '../../lib/i18n/staticLocale.ts';

type AppErrorFallbackProps = {
  message?: string;
};

export function AppErrorFallback({ message }: AppErrorFallbackProps) {
  const { t, dir } = getStaticLocale();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign('/');
  };

  return (
    <RouteStatusPage
      dir={dir}
      statusCode={500}
      title={t('status.unexpected.title')}
      description={message?.trim() || t('status.unexpected.description')}
      primaryLabel={t('status.unexpected.reload')}
      primaryOnClick={handleReload}
      secondaryLabel={t('status.unexpected.goBack')}
      secondaryOnClick={handleGoBack}
    />
  );
}
