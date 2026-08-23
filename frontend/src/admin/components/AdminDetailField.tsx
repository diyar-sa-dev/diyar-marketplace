import type { ReactNode } from 'react';

export function AdminDetailField({
  label,
  children,
  icon,
}: {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-4">
      {icon ? <div className="mt-0.5 text-diyar-brown">{icon}</div> : null}
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="mt-1.5 text-sm font-medium text-diyar-dark">{children}</dd>
      </div>
    </div>
  );
}
