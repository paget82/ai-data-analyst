import { BarChart3 } from 'lucide-react';
import { SampleChips } from './SampleChips';

interface EmptyStateProps {
  onSelectSample: (question: string) => void;
}

export function EmptyState({ onSelectSample }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 px-4 animate-fadeSlideIn">
      <div className="w-14 h-14 rounded-2xl gradient-teal flex items-center justify-center shadow-card animate-glow">
        <BarChart3 size={26} className="text-bg" strokeWidth={2.25} />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display font-bold text-lg text-slate-100">
          Ask anything about your data
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Query orders, customers, revenue, and reviews in plain language.
          I'll turn it into SQL and show you the answer.
        </p>
      </div>
      <SampleChips onSelect={onSelectSample} />
    </div>
  );
}
