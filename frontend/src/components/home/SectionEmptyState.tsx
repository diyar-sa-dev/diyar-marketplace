import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';

type SectionEmptyStateProps = {
  title: string;
  description: string;
  browseLabel: string;
  browseTo: string;
  icon?: LucideIcon;
  className?: string;
};

export default function SectionEmptyState({
  title,
  description,
  browseLabel,
  browseTo,
  icon: Icon = PackageOpen,
  className = '',
}: SectionEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 md:py-16 px-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 ${className}`}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-diyar-brown mb-4">
        <Icon size={32} className="md:w-9 md:h-9" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-diyar-dark mb-2">{title}</h3>
      <p className="text-sm md:text-base text-gray-500 max-w-md mb-6">{description}</p>
      <Link
        to={browseTo}
        className="inline-flex items-center justify-center rounded-xl bg-diyar-brown px-6 py-3 text-sm font-bold text-white hover:bg-diyar-dark transition cursor-pointer"
      >
        {browseLabel}
      </Link>
    </div>
  );
}
