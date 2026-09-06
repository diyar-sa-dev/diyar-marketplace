import type { ReactNode } from 'react';

type TableLtrValueProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Renders numbers/latin strings LTR without flipping the table cell,
 * so values stay under their RTL/LTR column headers.
 */
export function TableLtrValue({ children, className = '' }: TableLtrValueProps) {
  return (
    <span className={`inline-block tabular-nums [unicode-bidi:isolate] ${className}`} dir="ltr">
      {children}
    </span>
  );
}
