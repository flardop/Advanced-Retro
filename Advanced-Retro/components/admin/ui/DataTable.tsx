'use client';

import { Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DataTableBulkAction, DataTableColumn } from '@/types/admin';
import { convertRowsToCsv } from '@/lib/admin/csv';

function inferCellValue<T>(row: T, column: DataTableColumn<T>) {
  if (column.accessor) return column.accessor(row);
  return (row as any)[column.key];
}

export function DataTable<T extends { id?: string | number }>({
  rows,
  columns,
  bulkActions = [],
  search,
  searchKeys = [],
  pageSize = 10,
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  bulkActions?: DataTableBulkAction<T>[];
  search?: string;
  searchKeys?: Array<keyof T | string>;
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Array<string | number>>([]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = String(search || '').trim().toLowerCase();
    const base = !normalizedSearch
      ? rows
      : rows.filter((row) =>
          searchKeys.some((key) => String((row as any)[key] || '').toLowerCase().includes(normalizedSearch))
        );

    if (!sortKey) return base;
    return [...base].sort((left, right) => {
      const column = columns.find((entry) => entry.key === sortKey);
      if (!column) return 0;
      const leftValue = inferCellValue(left, column);
      const rightValue = inferCellValue(right, column);
      const a = leftValue == null ? '' : String(leftValue).toLowerCase();
      const b = rightValue == null ? '' : String(rightValue).toLowerCase();
      return sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  }, [columns, rows, search, searchKeys, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const selectedRows = filteredRows.filter((row) => selected.includes(row.id ?? ''));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const downloadCsv = () => {
    const csv = convertRowsToCsv(
      filteredRows.map((row) =>
        columns.reduce<Record<string, unknown>>((acc, column) => {
          acc[column.header] = inferCellValue(row, column);
          return acc;
        }, {})
      )
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
        <div className="text-sm text-[var(--admin-text-muted)]">{filteredRows.length} registros</div>
        <div className="flex flex-wrap items-center gap-2">
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={selectedRows.length === 0}
              className={`rounded-2xl px-3 py-2 text-sm ${action.variant === 'danger' ? 'bg-[rgba(239,68,68,0.14)] text-[var(--admin-error)]' : 'bg-[var(--admin-surface-2)] text-[var(--admin-text)]'} disabled:opacity-40`}
              onClick={() => void action.onClick(selectedRows)}
            >
              {action.label}
            </button>
          ))}
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-surface-2)] px-3 py-2 text-sm text-[var(--admin-text)]" onClick={downloadCsv}>
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--admin-border)] text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={paginatedRows.length > 0 && paginatedRows.every((row) => selected.includes(row.id ?? ''))}
                  onChange={(event) => {
                    setSelected(event.target.checked ? paginatedRows.map((row) => row.id ?? '') : []);
                  }}
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-left font-medium text-[var(--admin-text-muted)] ${column.className || ''}`}>
                  {column.sortable ? (
                    <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleSort(column.key)}>
                      {column.header}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">
            {paginatedRows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id ?? '')}
                    onChange={(event) => {
                      const key = row.id ?? '';
                      setSelected((prev) =>
                        event.target.checked ? [...prev, key] : prev.filter((value) => value !== key)
                      );
                    }}
                  />
                </td>
                {columns.map((column) => (
                  <td key={`${String(row.id ?? index)}-${column.key}`} className="px-4 py-3 align-top text-[var(--admin-text)]">
                    {column.render ? column.render(row) : String(inferCellValue(row, column) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-5 py-4 text-sm text-[var(--admin-text-muted)]">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border border-[var(--admin-border)] p-2 disabled:opacity-40" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full border border-[var(--admin-border)] p-2 disabled:opacity-40" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
