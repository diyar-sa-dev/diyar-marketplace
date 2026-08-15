interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: import('react').ReactNode;
}

export function EmptyState({
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على عناصر لعرضها.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
      {action}
    </div>
  );
}
