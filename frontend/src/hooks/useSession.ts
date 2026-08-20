import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'ai-data-analyst-session-id';

function loadOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const fresh = uuidv4();
  localStorage.setItem(SESSION_KEY, fresh);
  return fresh;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string>(loadOrCreateSessionId);

  const regenerateSession = useCallback(() => {
    const fresh = uuidv4();
    localStorage.setItem(SESSION_KEY, fresh);
    setSessionId(fresh);
    return fresh;
  }, []);

  return { sessionId, regenerateSession };
}
