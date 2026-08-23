interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: import('react').ReactNode;
  icon?: import('react').ReactNode;
}

export function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على عناصر لعرضها.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
      {icon ? (
        <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f4f1] text-diyar-brown">
          {icon}
        </div>
      ) : null}
      <p className="text-lg font-bold text-diyar-dark">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-gray-500">{description}</p>
      {action}
    </div>
  );
}
