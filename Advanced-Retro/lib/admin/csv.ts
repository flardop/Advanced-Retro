export function convertRowsToCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escapeCell = (value: unknown) => {
    const raw = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    const escaped = raw.replace(/"/g, '""');
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ].join('\n');
}
