import { BarChart3, Menu, RotateCw } from 'lucide-react';

interface HeaderProps {
  onToggleHistory: () => void;
  onNewSession: () => void;
  isHistoryOpen: boolean;
}

export function Header({ onToggleHistory, onNewSession, isHistoryOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle/40 bg-bg/85 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleHistory}
            aria-label="Toggle query history"
            aria-expanded={isHistoryOpen}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors border border-border-subtle/40"
          >
            <Menu size={16} className="text-slate-300" />
          </button>

          <div className="flex-shrink-0 w-8 h-8 rounded-xl gradient-teal flex items-center justify-center">
            <BarChart3 size={16} className="text-bg" strokeWidth={2.5} />
          </div>

          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-sm sm:text-base text-slate-50 truncate">
              AI Data Analyst
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
              Analyze e-commerce data with natural language
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-pill border border-border-subtle/60 px-3 sm:px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-teal-start/60 transition-colors"
        >
          <RotateCw size={13} />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </div>
    </header>
  );
}
