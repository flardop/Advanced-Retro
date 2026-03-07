import Link from 'next/link';

type BreadcrumbItem = {
  name: string;
  href?: string;
};

type BreadcrumbsNavProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function BreadcrumbsNav({ items, className = '' }: BreadcrumbsNavProps) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <nav
      aria-label="Migas de pan"
      className={`w-full rounded-xl border border-line/70 bg-[rgba(8,18,31,0.55)] px-3 py-2.5 text-sm ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-textMuted">
        {items.map((item, index) => {
          const key = `${item.name}-${index}`;
          const isLast = index === items.length - 1;
          return (
            <li key={key} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span className="text-textMuted/60">/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-text font-medium' : ''}>{item.name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

