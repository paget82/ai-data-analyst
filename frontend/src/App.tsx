import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './components/Chat/ChatInput';
import { ChatWindow } from './components/Chat/ChatWindow';
import { Footer } from './components/Layout/Footer';
import { Header } from './components/Layout/Header';
import { HistorySidebar } from './components/Sidebar/HistorySidebar';
import { useChat } from './hooks/useChat';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    messages,
    isLoading,
    sendQuery,
    retryLast,
    startNewSession,
    history,
    clearHistory,
    viewHistoryItem,
    isViewingSnapshot,
    exitSnapshotView,
  } = useChat();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSend = (text: string) => {
    if (isViewingSnapshot) exitSnapshotView();
    sendQuery(text);
  };

  const handleNewSession = () => {
    startNewSession();
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        onNewSession={handleNewSession}
        isHistoryOpen={isHistoryOpen}
      />

      <div className="flex-1 max-w-[1200px] w-full mx-auto flex gap-6 px-4 sm:px-6 py-6">
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectItem={viewHistoryItem}
          onClearHistory={clearHistory}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 flex flex-col rounded-card bg-surface/60 border border-border-subtle/30 shadow-card overflow-hidden">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSelectSample={handleSend}
              onRetry={retryLast}
              isViewingSnapshot={isViewingSnapshot}
              onExitSnapshot={exitSnapshotView}
            />

            {!isViewingSnapshot && (
              <div className="px-4 sm:px-6 pb-5 pt-2">
                <ChatInput ref={inputRef} onSend={handleSend} disabled={isLoading} />
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
