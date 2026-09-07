import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type SectionTone = 'light' | 'cream' | 'dark' | 'gradient' | 'how' | 'contact';

export function LandingSectionShell({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  tone = 'light',
  className = '',
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  tone?: SectionTone;
  className?: string;
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-diyar-dark text-white landing-section-dark'
      : tone === 'cream'
        ? 'bg-diyar-cream landing-section-cream'
        : tone === 'how'
          ? 'landing-section-how text-diyar-dark'
          : tone === 'contact'
            ? 'landing-section-contact text-diyar-dark'
            : tone === 'gradient'
              ? 'landing-section-gradient text-diyar-dark'
              : 'bg-white landing-section-light';

  return (
    <section
      id={id}
      className={`relative scroll-mt-24 py-16 md:py-24 landing-section ${toneClass} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <header className="mb-10 max-w-2xl landing-reveal">
          {Icon ? (
            <span className="landing-section-icon mb-4 inline-flex">
              <Icon size={20} aria-hidden />
            </span>
          ) : null}
          <h2
            className={`mb-3 text-2xl font-bold md:text-3xl ${
              tone === 'dark' ? 'text-white' : 'text-diyar-dark'
            }`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={`text-base leading-relaxed md:text-lg ${
                tone === 'dark' ? 'text-white/75' : 'text-gray-600'
              }`}
            >
              {subtitle}
            </p>
          ) : null}
        </header>
        <div className="landing-reveal landing-reveal-delay landing-stagger">{children}</div>
      </div>
    </section>
  );
}
