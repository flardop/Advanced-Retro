'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/admin/useDebouncedValue';

export function SearchInput({
  placeholder,
  value,
  onChange,
  delay = 250,
}: {
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  delay?: number;
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounced = useDebouncedValue(localValue, delay);

  useEffect(() => {
    onChange(debounced);
  }, [debounced, onChange]);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text-muted)]">
      <Search className="h-4 w-4" />
      <input
        className="w-full bg-transparent text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)]"
        placeholder={placeholder}
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
      />
    </label>
  );
}
