import type { ReactNode } from 'react';

type PartnerB2bFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PartnerB2bFormSection({ title, description, children }: PartnerB2bFormSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 md:p-6 space-y-4">
      <div>
        <h2 className="text-base font-bold text-diyar-dark">{title}</h2>
        {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
