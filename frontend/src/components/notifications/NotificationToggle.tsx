type NotificationToggleProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  size?: 'sm' | 'md';
};

export function NotificationToggle({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
}: NotificationToggleProps) {
  const trackClass = size === 'sm' ? 'h-6 w-11' : 'h-7 w-12';
  const thumbClass = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`group relative inline-flex shrink-0 items-center overflow-hidden rounded-full p-0.5 transition-colors duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-diyar-dark focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] cursor-pointer ${trackClass} ${
        checked ? 'bg-diyar-dark' : 'bg-gray-200'
      }`}
    >
      <span
        aria-hidden="true"
        className={`rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out ${thumbClass} ${
          checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
