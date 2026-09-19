import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type HomeSectionHeaderProps = {
  badge?: string;
  badgeClassName?: string;
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  extra?: ReactNode;
  className?: string;
};

export function HomeSectionHeader({
  badge,
  badgeClassName = 'text-diyar-brown',
  title,
  subtitle,
  linkTo,
  linkLabel,
  extra,
  className = '',
}: HomeSectionHeaderProps) {
  return (
    <div className={`mb-6 text-center md:mb-8 ${className}`}>
      {badge ? (
        <span className={`mb-2 block text-sm font-medium ${badgeClassName}`}>{badge}</span>
      ) : null}
      <h2 className="font-sans text-2xl font-bold text-diyar-dark md:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-gray-500 md:text-sm">
          {subtitle}
        </p>
      ) : null}
      {extra ? <div className="mt-3 flex justify-center">{extra}</div> : null}
      {linkTo && linkLabel ? (
        <Link
          to={linkTo}
          className="mt-3 inline-block text-sm font-bold text-diyar-brown transition hover:text-diyar-dark cursor-pointer"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
