import React from 'react';

export function ServiceTypeBadge({
  label,
  overlay = false,
  className = '',
}: {
  label: string;
  overlay?: boolean;
  className?: string;
}) {
  if (overlay) {
    return (
      <span
        className={`absolute top-3 end-3 inline-flex max-w-[85%] items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-diyar-brown/95 text-white shadow-md backdrop-blur-sm line-clamp-2 ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-diyar-brown/10 text-diyar-brown border border-diyar-brown/20 ${className}`}
    >
      {label}
    </span>
  );
}
