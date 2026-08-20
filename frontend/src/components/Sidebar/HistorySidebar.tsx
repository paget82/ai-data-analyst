import { useEffect } from 'react';
import { History, Trash2, X } from 'lucide-react';
import type { QueryHistoryItem } from '../../types';
import { formatRelativeTime, truncate } from '../../utils/time';
import { HistoryItemIcon } from './HistoryItemIcon';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelectItem: (id: string) => void;
  onClearHistory: () => void;
}

export function HistorySidebar({
  isOpen,
  onClose,
  history,
  onSelectItem,
  onClearHistory,
}: HistorySidebarProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fadeSlideIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="complementary"
        aria-label="Query history"
        aria-expanded={isOpen}
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto lg:max-h-[85vh] w-[280px] z-40
          glass lg:bg-surface/60 border-r lg:border border-border-subtle/40 lg:rounded-card
          flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isOpen ? '' : 'lg:hidden'}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-subtle/40">
          <div className="flex items-center gap-2">
            <History size={16} className="text-teal-start" />
            <h2 className="font-display font-semibold text-sm text-slate-100">History</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="lg:hidden w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 px-4">
              Your past queries will show up here.
            </p>
          ) : (
            <ul className="space-y-1">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0">
                        <HistoryItemIcon type={item.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300 group-hover:text-slate-100 leading-snug">
                          {truncate(item.query)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">
                          {formatRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {history.length > 0 && (
          <div className="px-4 py-3 border-t border-border-subtle/40">
            <button
              type="button"
              onClick={onClearHistory}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-danger transition-colors py-1.5"
            >
              <Trash2 size={13} />
              Clear history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
