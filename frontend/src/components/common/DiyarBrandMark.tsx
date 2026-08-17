import type { CSSProperties } from 'react';

const BRAND_LETTERS = [
  { char: 'D', final: '#947961' },
  { char: 'I', final: '#1f3d3a' },
  { char: 'Y', final: '#b45309' },
  { char: 'A', final: '#047857' },
  { char: 'R', final: '#947961' },
] as const;

type DiyarBrandMarkProps = {
  size?: 'sm' | 'lg';
};

export function DiyarBrandMark({ size = 'lg' }: DiyarBrandMarkProps) {
  const textClass =
    size === 'lg'
      ? 'text-5xl sm:text-6xl tracking-[0.24em] drop-shadow-[0_6px_24px_rgba(31,61,58,0.16)]'
      : 'text-xl tracking-[0.2em]';

  return (
    <span
      className={`relative inline-flex min-w-[5.5em] justify-center font-black select-none text-diyar-brown transform-gpu ${textClass}`}
      dir="ltr"
      aria-hidden="true"
    >
      {BRAND_LETTERS.map((letter, index) => (
        <span
          key={letter.char}
          className="inline-block min-w-[0.62em] text-center animate-diyar-letter-wave will-change-transform"
          style={
            {
              animationDelay: `${index * 180}ms`,
              '--diyar-letter-final': letter.final,
            } as CSSProperties
          }
        >
          {letter.char}
        </span>
      ))}
    </span>
  );
}
