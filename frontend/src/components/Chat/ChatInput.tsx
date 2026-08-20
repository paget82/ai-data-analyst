import { forwardRef, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSend, disabled }, forwardedRef) {
    const [value, setValue] = useState('');
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [value]);

    const handleSend = () => {
      if (!value.trim() || disabled) return;
      onSend(value);
      setValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="flex items-end gap-2 rounded-card bg-bubble-input border border-border-subtle/50 p-2 pl-4 focus-within:border-teal-start/60 transition-colors">
        <textarea
          ref={setRefs}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Ask about orders, revenue, customers…"
          aria-label="Message input"
          className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none py-2.5 max-h-40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex-shrink-0 w-10 h-10 rounded-full gradient-teal flex items-center justify-center text-bg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
        >
          <Send size={17} strokeWidth={2.25} />
        </button>
      </div>
    );
  }
);
