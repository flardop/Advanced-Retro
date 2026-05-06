import Link from 'next/link';
import { ReactNode } from 'react';

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {breadcrumbs?.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-2">
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                {index < breadcrumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--admin-text)]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-[var(--admin-text-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
