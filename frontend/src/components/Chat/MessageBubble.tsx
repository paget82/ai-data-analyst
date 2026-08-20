import { AlertTriangle, RotateCcw, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';
import { BarChart } from '../Visualizations/BarChart';
import { ChartErrorBoundary } from '../Visualizations/ChartErrorBoundary';
import { DataTable } from '../Visualizations/DataTable';
import { LineChart } from '../Visualizations/LineChart';
import { PieChart } from '../Visualizations/PieChart';

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
}

function VisualizationSwitch({ message }: { message: Message }) {
  const { visualization, data } = message;
  if (!visualization) return null;

  const chart = (() => {
    switch (visualization.type) {
      case 'bar':
        return <BarChart visualization={visualization} />;
      case 'line':
        return <LineChart visualization={visualization} />;
      case 'pie':
        return <PieChart visualization={visualization} />;
      default:
        return null;
    }
  })();

  return (
    <div className="mt-3 rounded-2xl border border-border-subtle/60 bg-black/20 p-4">
      <ChartErrorBoundary fallbackData={data}>{chart}</ChartErrorBoundary>
    </div>
  );
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end animate-fadeSlideIn" role="article" aria-label="Your message">
        <div className="bg-bubble-user rounded-card rounded-tr-md px-4 py-3 max-w-[80%]">
          <p className="text-sm text-slate-100 whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bubble-input border border-border-subtle/60 flex items-center justify-center">
          <User size={15} className="text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-fadeSlideIn" role="article" aria-label="AI response">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
          message.isError
            ? 'bg-danger/15 border-danger/40'
            : 'bg-aiPurple/20 border-aiPurple/40'
        }`}
      >
        {message.isError ? (
          <AlertTriangle size={15} className="text-danger" />
        ) : (
          <Sparkles size={15} className="text-aiPurple-alt" />
        )}
      </div>
      <div className="max-w-[85%] min-w-0 flex-1">
        <div
          className={`rounded-card rounded-tl-md px-4 py-3.5 ${
            message.isError ? 'bg-danger/10 border border-danger/30' : 'bg-bubble-ai'
          }`}
        >
          <div className="markdown-body text-sm text-slate-200">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger hover:text-danger-alt transition-colors"
            >
              <RotateCcw size={13} />
              Try again
            </button>
          )}

          <VisualizationSwitch message={message} />

          {!message.visualization && message.data && <DataTable data={message.data} />}
        </div>
      </div>
    </div>
  );
}
