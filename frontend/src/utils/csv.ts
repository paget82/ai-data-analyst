import type { TableData } from '../types';

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function tableToCsv(table: TableData): string {
  const headerRow = table.headers.map(escapeCsvCell).join(',');
  const bodyRows = table.rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerRow, ...bodyRows].join('\n');
}

export function downloadCsv(table: TableData, filename = 'query-results.csv') {
  const csv = tableToCsv(table);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
