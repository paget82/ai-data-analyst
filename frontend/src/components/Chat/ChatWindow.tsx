import { useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import type { Message } from '../../types';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSelectSample: (question: string) => void;
  onRetry: () => void;
  isViewingSnapshot: boolean;
  onExitSnapshot: () => void;
}

export function ChatWindow({
  messages,
  isLoading,
  onSelectSample,
  onRetry,
  isViewingSnapshot,
  onExitSnapshot,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex-1 min-h-[500px] max-h-[70vh] overflow-y-auto px-4 sm:px-6 py-6"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {isViewingSnapshot && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-aiPurple/10 border border-aiPurple/30 px-4 py-2.5 animate-fadeSlideIn">
          <div className="flex items-center gap-2 text-xs text-aiPurple-alt">
            <Eye size={14} />
            Viewing a past query (read-only)
          </div>
          <button
            type="button"
            onClick={onExitSnapshot}
            className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Back to chat
          </button>
        </div>
      )}

      {isEmpty ? (
        <EmptyState onSelectSample={onSelectSample} />
      ) : (
        <div className="space-y-5 max-w-full">
          {messages.map((message) =>
            message.isPending ? (
              <TypingIndicator key={message.id} />
            ) : (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={message.isError ? onRetry : undefined}
              />
            )
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
