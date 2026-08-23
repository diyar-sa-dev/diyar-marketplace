import { ShieldOff } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { EmptyState } from './EmptyState.tsx';

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function ForbiddenState({ title, description, action }: ForbiddenStateProps) {
  const { t } = useLocale();

  return (
    <EmptyState
      icon={<ShieldOff size={28} strokeWidth={1.75} />}
      title={title ?? t('status.forbidden.title')}
      description={description ?? t('status.forbidden.description')}
      action={action}
    />
  );
}
