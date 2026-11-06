import React, { useState, useEffect, useCallback } from 'react';
import type { Entry } from '../types/entry';
import { db } from '../db';
import { EntryRow } from '../components/EntryRow';
import { MoveSheet } from '../components/MoveSheet';
import { parseRawInput } from '../utils/parser';
import { Calendar, Plus, ArrowRight } from 'lucide-react';

interface FutureLogProps {
  onStateChange: (prev: Entry, actionDesc: string) => void;
  onNavigateToMonth?: (monthStr: string) => void;
}

export function FutureLog({ onStateChange, onNavigateToMonth }: FutureLogProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeMigrationEntry, setActiveMigrationEntry] = useState<Entry | null>(null);
  const [addingMonth, setAddingMonth] = useState<string | null>(null);
  const [newEntryText, setNewEntryText] = useState('');

  // Generate 6 upcoming months starting from current month
  const upcomingMonths = React.useMemo(() => {
    const list: { key: string; label: string; year: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ key, label, year: d.getFullYear() });
    }
    return list;
  }, []);

  const loadFutureEntries = useCallback(async () => {
    // Entries where state is 'scheduled' or target matches upcoming months
    const all = await db.entries.toArray();
    const future = all.filter((e) => {
      if (e.state === 'scheduled') return true;
      if (e.target && /^\d{4}-\d{2}/.test(e.target)) return true;
      return false;
    });
    setEntries(future);
  }, []);

  useEffect(() => {
    loadFutureEntries();
  }, [loadFutureEntries]);

  const handleAddFutureEntry = async (monthKey: string) => {
    if (!newEntryText.trim()) return;

    const parsed = parseRawInput(newEntryText);
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      type: parsed.type,
      text: parsed.text,
      signifier: parsed.signifier,
      state: parsed.type === 'task' ? 'scheduled' : undefined,
      logDate: `${monthKey}-01`,
      target: monthKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.entries.add(newEntry);
    setNewEntryText('');
    setAddingMonth(null);
    loadFutureEntries();
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-32 sm:pb-20">
      <header className="px-4 py-3 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-serif-title font-bold text-stone-900 dark:text-stone-100">
              Future Log
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Next 6 Months Overview · Scheduled Tasks (&lt;) &amp; Events (○)
            </p>
          </div>
        </div>
      </header>

      {/* Grid of Future Months */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 dot-grid">
        {upcomingMonths.map(({ key, label }) => {
          const monthEntries = entries.filter((e) => e.target === key || e.logDate.startsWith(key));

          return (
            <div
              key={key}
              className="bg-white/80 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 mb-3">
                  <h3 className="font-serif-title font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{label}</span>
                  </h3>
                  {onNavigateToMonth && (
                    <button
                      onClick={() => onNavigateToMonth(key)}
                      className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 transition-colors"
                    >
                      <span>Open Log</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Entry List for Month */}
                <div className="space-y-1 min-h-[100px]">
                  {monthEntries.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-4 text-center">
                      Nothing scheduled yet.
                    </p>
                  ) : (
                    monthEntries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                        onStateChange={onStateChange}
                        onEntryUpdated={loadFutureEntries}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Quick Add into this Future Month */}
              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                {addingMonth === key ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newEntryText}
                      onChange={(e) => setNewEntryText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddFutureEntry(key);
                        if (e.key === 'Escape') setAddingMonth(null);
                      }}
                      placeholder="Schedule task or event..."
                      autoFocus
                      className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2 py-1 text-stone-900 dark:text-stone-100 outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setAddingMonth(null)}
                        className="text-[11px] px-2 py-0.5 text-stone-500 hover:text-stone-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddFutureEntry(key)}
                        className="text-[11px] px-2.5 py-0.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded font-medium"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingMonth(key);
                      setNewEntryText('');
                    }}
                    className="w-full text-left text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 py-1 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule into {label.split(' ')[0]}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MoveSheet
        entry={activeMigrationEntry}
        onClose={() => setActiveMigrationEntry(null)}
        onMigrated={loadFutureEntries}
      />
    </div>
  );
}
