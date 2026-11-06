import { useState, useCallback } from 'react';
import { db } from '../db';
import type { Entry } from '../types/entry';

interface UndoAction {
  entryId: string;
  previousEntry: Entry;
  actionDescription: string;
}

export function useUndoStack() {
  const [history, setHistory] = useState<UndoAction[]>([]);
  const [lastUndoneText, setLastUndoneText] = useState<string | null>(null);

  const pushUndo = useCallback((previousEntry: Entry, actionDescription = 'State change') => {
    setHistory((prev) => [
      {
        entryId: previousEntry.id,
        previousEntry: { ...previousEntry },
        actionDescription,
      },
      ...prev.slice(0, 4), // Cap strictly at max 5 steps per spec
    ]);
  }, []);

  const undo = useCallback(async () => {
    if (history.length === 0) return null;
    const [lastAction, ...remaining] = history;

    // Restore previous entry state directly in IndexedDB
    await db.entries.put(lastAction.previousEntry);
    setHistory(remaining);
    setLastUndoneText(lastAction.actionDescription);

    setTimeout(() => {
      setLastUndoneText(null);
    }, 2500);

    return lastAction.previousEntry;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    pushUndo,
    undo,
    canUndo: history.length > 0,
    undoCount: history.length,
    lastUndoneText,
    clearHistory,
  };
}
