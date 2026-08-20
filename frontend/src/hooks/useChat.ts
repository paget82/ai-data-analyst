import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSnapshot, Message } from '../types';
import { ApiError, sendMessage } from '../utils/api';
import { useHistory } from './useHistory';
import { useSession } from './useSession';

const ERROR_MESSAGE = 'Sorry, I encountered an error. Please try again.';
const TIMEOUT_MESSAGE = 'That took too long to answer. Please try again.';

export function useChat() {
  const { sessionId, regenerateSession } = useSession();
  const { history, addHistoryItem, clearHistory, getSnapshot } = useHistory();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingSnapshotId, setViewingSnapshotId] = useState<string | null>(null);
  const lastUserMessage = useRef<string | null>(null);

  const runQuery = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setViewingSnapshotId(null);
      lastUserMessage.current = trimmed;

      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const pendingId = uuidv4();
      const pendingMessage: Message = {
        id: pendingId,
        role: 'ai',
        content: '',
        timestamp: Date.now(),
        isPending: true,
      };

      setMessages((prev) => [...prev, userMessage, pendingMessage]);
      setIsLoading(true);

      try {
        const result = await sendMessage({ message: trimmed, session_id: sessionId });

        const aiMessage: Message = {
          id: pendingId,
          role: 'ai',
          content: result.response,
          data: result.data,
          visualization: result.visualization,
          sql: result.sql_executed,
          timestamp: Date.now(),
        };

        setMessages((prev) => prev.map((m) => (m.id === pendingId ? aiMessage : m)));
        addHistoryItem(userMessage, aiMessage);
      } catch (err) {
        const isTimeout = err instanceof ApiError && err.isTimeout;
        const errorMessage: Message = {
          id: pendingId,
          role: 'ai',
          content: isTimeout ? TIMEOUT_MESSAGE : ERROR_MESSAGE,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? errorMessage : m)));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, addHistoryItem]
  );

  const retryLast = useCallback(() => {
    if (lastUserMessage.current) {
      runQuery(lastUserMessage.current);
    }
  }, [runQuery]);

  const startNewSession = useCallback(() => {
    setMessages([]);
    setViewingSnapshotId(null);
    lastUserMessage.current = null;
    regenerateSession();
  }, [regenerateSession]);

  const viewHistoryItem = useCallback(
    (id: string) => {
      const snapshot: ChatSnapshot | undefined = getSnapshot(id);
      if (!snapshot) return;
      setViewingSnapshotId(id);
    },
    [getSnapshot]
  );

  const exitSnapshotView = useCallback(() => {
    setViewingSnapshotId(null);
  }, []);

  const activeSnapshot = viewingSnapshotId ? getSnapshot(viewingSnapshotId) : undefined;
  const displayedMessages: Message[] = activeSnapshot
    ? [activeSnapshot.userMessage, activeSnapshot.aiMessage]
    : messages;

  return {
    messages: displayedMessages,
    isLoading,
    sendQuery: runQuery,
    retryLast,
    startNewSession,
    history,
    clearHistory,
    viewHistoryItem,
    isViewingSnapshot: Boolean(viewingSnapshotId),
    exitSnapshotView,
    hasLiveMessages: messages.length > 0,
  };
}
