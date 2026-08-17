import type { PaginationMeta } from '../../types/catalog.ts';

interface PaginationBarProps {
  pagination: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  className?: string;
  alwaysShow?: boolean;
}

export function PaginationBar({
  pagination,
  page,
  onPageChange,
  className = '',
  alwaysShow = false,
}: PaginationBarProps) {
  if (pagination.last_page <= 1 && !alwaysShow) {
    return null;
  }

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        aria-label="الصفحة السابقة"
      >
        &lt;
      </button>
      <span className="px-3 text-sm text-gray-600">
        {pagination.current_page} / {pagination.last_page}
      </span>
      <button
        type="button"
        disabled={page >= pagination.last_page}
        onClick={() => onPageChange(page + 1)}
        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
        aria-label="الصفحة التالية"
      >
        &gt;
      </button>
    </div>
  );
}
