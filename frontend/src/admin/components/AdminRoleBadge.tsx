import { useLocale } from '../../hooks/useLocale.ts';

const ROLE_STYLES: Record<string, string> = {
  customer: 'bg-sky-50 text-sky-800 border-sky-200',
  vendor: 'bg-amber-50 text-amber-900 border-amber-200',
  provider: 'bg-violet-50 text-violet-900 border-violet-200',
  marketer: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  admin: 'bg-rose-50 text-rose-900 border-rose-200',
};

type AdminRoleBadgeProps = {
  roleName: string;
  status?: string;
};

export function AdminRoleBadge({ roleName, status }: AdminRoleBadgeProps) {
  const { t } = useLocale();
  const key = `admin.roleBadges.${roleName}` as never;
  const translated = t(key);
  const label = translated === key ? roleName : translated;
  const style = ROLE_STYLES[roleName] ?? 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style}`}
    >
      {label}
      {status && status !== 'active' ? (
        <span className="text-[9px] font-semibold opacity-70">({status})</span>
      ) : null}
    </span>
  );
}

export function AdminUserRoleBadges({
  roles,
}: {
  roles?: Array<{ name: string; label?: string; status?: string }>;
}) {
  const list = roles ?? [];

  if (list.length === 0) {
    return <AdminRoleBadge roleName="customer" />;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {list.map((role) => (
        <AdminRoleBadge key={role.name} roleName={role.name} status={role.status} />
      ))}
    </div>
  );
}
