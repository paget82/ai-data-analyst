import { useState } from 'react';
import { Download } from 'lucide-react';
import type { TableData } from '../../types';
import { downloadCsv } from '../../utils/csv';

interface DataTableProps {
  data: TableData;
}

const PAGE_SIZE = 20;

export function DataTable({ data }: DataTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleRows = data.rows.slice(0, visibleCount);
  const hasMore = visibleCount < data.rows.length;

  return (
    <div className="mt-3 rounded-2xl border border-border-subtle/60 bg-black/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle/40">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {data.rows.length} row{data.rows.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => downloadCsv(data)}
          className="flex items-center gap-1.5 text-xs font-medium text-teal-start hover:text-teal-end transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-surface z-10">
            <tr>
              {data.headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2.5 font-semibold text-slate-300 whitespace-nowrap border-b border-border-subtle/40"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'}
              >
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2 text-slate-300 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2.5 border-t border-border-subtle/40 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="text-xs font-medium text-teal-start hover:text-teal-end transition-colors"
          >
            Show more ({data.rows.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
