import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fadeSlideIn" role="status" aria-label="AI is thinking">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-aiPurple/20 border border-aiPurple/40 flex items-center justify-center">
        <Sparkles size={15} className="text-aiPurple-alt" />
      </div>
      <div className="bg-bubble-ai rounded-card rounded-tl-md px-4 py-3.5 flex items-center gap-2">
        <span className="text-sm text-slate-400">AI is thinking</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-aiPurple-alt animate-pulseDot" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-aiPurple-alt animate-pulseDot" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-aiPurple-alt animate-pulseDot" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}
