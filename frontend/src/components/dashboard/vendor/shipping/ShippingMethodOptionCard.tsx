import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';

type ShippingMethodOptionCardProps = {
  selected: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  onSelect?: () => void;
  children?: React.ReactNode;
  badge?: string;
};

export function ShippingMethodOptionCard({
  selected,
  disabled = false,
  icon: Icon,
  iconClassName,
  title,
  description,
  onSelect,
  children,
  badge,
}: ShippingMethodOptionCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-white opacity-60'
          : selected
            ? 'cursor-pointer border-diyar-brown bg-amber-50/10'
            : 'cursor-pointer border-gray-200 bg-white hover:border-diyar-brown/50'
      }`}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={
        disabled || !onSelect
          ? undefined
          : (event) => {
              const target = event.target as HTMLElement;
              if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT'
              ) {
                return;
              }

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
      }
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
    >
      <div className="absolute inset-s-4 top-4">
        {selected ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-diyar-brown text-xs text-white">
            <Check size={14} />
          </div>
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        )}
      </div>

      {badge ? (
        <span className="absolute inset-e-4 top-4 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
          {badge}
        </span>
      ) : null}

      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon size={24} />
      </div>

      <h4 className="mb-1 font-bold text-diyar-dark">{title}</h4>
      <p className="mb-4 line-clamp-2 text-xs text-gray-500">{description}</p>

      {selected && children ? (
        <div
          className="space-y-3 border-t border-gray-100 pt-4"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
