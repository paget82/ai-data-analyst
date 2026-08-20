import { useCallback, useEffect, useState } from 'react';
import type { ChatSnapshot, HistoryItemType, Message, QueryHistoryItem } from '../types';

const HISTORY_KEY = 'ai-data-analyst-history';
const SNAPSHOTS_KEY = 'ai-data-analyst-history-snapshots';
const MAX_HISTORY_ITEMS = 20;

function loadHistory(): QueryHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as QueryHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function loadSnapshots(): Record<string, ChatSnapshot> {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ChatSnapshot>) : {};
  } catch {
    return {};
  }
}

function deriveType(message: Message): HistoryItemType {
  if (message.visualization) return 'chart';
  if (message.data) return 'table';
  return 'text';
}

export function useHistory() {
  const [history, setHistory] = useState<QueryHistoryItem[]>(loadHistory);
  const [snapshots, setSnapshots] = useState<Record<string, ChatSnapshot>>(loadSnapshots);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const addHistoryItem = useCallback((userMessage: Message, aiMessage: Message) => {
    const item: QueryHistoryItem = {
      id: `${userMessage.id}-${aiMessage.id}`,
      query: userMessage.content,
      timestamp: aiMessage.timestamp,
      type: deriveType(aiMessage),
      userMessageId: userMessage.id,
      aiMessageId: aiMessage.id,
    };

    setHistory((prev) => [item, ...prev].slice(0, MAX_HISTORY_ITEMS));
    setSnapshots((prev) => ({
      ...prev,
      [item.id]: { userMessage, aiMessage },
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSnapshots({});
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SNAPSHOTS_KEY);
  }, []);

  const getSnapshot = useCallback(
    (id: string): ChatSnapshot | undefined => snapshots[id],
    [snapshots]
  );

  return { history, addHistoryItem, clearHistory, getSnapshot };
}
