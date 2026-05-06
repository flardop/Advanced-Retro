'use client';

export function LoadingSkeleton({ lines = 4, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 ${className}`}>
      <div className="h-5 w-32 rounded bg-[var(--admin-surface-2)]/80" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 rounded bg-[var(--admin-surface-2)]/80" />
        ))}
      </div>
    </div>
  );
}
