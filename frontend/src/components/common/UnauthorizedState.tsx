import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { EmptyState } from './EmptyState.tsx';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';

interface UnauthorizedStateProps {
  title?: string;
  description?: string;
  returnTo?: string;
}

export function UnauthorizedState({ title, description, returnTo }: UnauthorizedStateProps) {
  const { t } = useLocale();
  const authPath = returnTo ? `/auth?returnTo=${encodeURIComponent(returnTo)}` : '/auth';

  return (
    <EmptyState
      icon={<LogIn size={28} strokeWidth={1.75} />}
      title={title ?? t('status.authRequired.title')}
      description={description ?? t('status.authRequired.description')}
      action={
        <Link to={authPath} className={`${vendorButtonClass} inline-flex rounded-xl px-5 py-2.5 text-sm font-bold`}>
          {t('status.authRequired.primaryAction')}
        </Link>
      }
    />
  );
}
