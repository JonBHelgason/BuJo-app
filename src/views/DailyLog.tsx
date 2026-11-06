import React, { useState, useEffect, useCallback } from 'react';
import type { Entry } from '../types/entry';
import { db } from '../db';
import { EntryRow } from '../components/EntryRow';
import { CaptureInput } from '../components/CaptureInput';
import { MoveSheet } from '../components/MoveSheet';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, RotateCcw } from 'lucide-react';

interface DailyLogProps {
  initialDate?: string;
  onStateChange: (prev: Entry, actionDesc: string) => void;
  onRequestReview?: (monthStr: string) => void;
}

export function DailyLog({ initialDate, onStateChange, onRequestReview }: DailyLogProps) {
  const [selectedDate, setSelectedDate] = useState(() => initialDate || new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeMigrationEntry, setActiveMigrationEntry] = useState<Entry | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    // Show entries logged for this day or targeted for this day (excluding items strictly stored in custom collections other than inbox)
    const data = await db.entries
      .filter((e) => {
        const isThisDate = e.logDate === selectedDate || e.target === selectedDate;
        return isThisDate && (!e.collection || e.collection === 'inbox');
      })
      .sortBy('createdAt');
    setEntries(data);
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Date manipulation helpers
  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const jumpToToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  // Format header date (e.g., "Friday, November 6, 2026")
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDateFull = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const openTasksCount = entries.filter((e) => e.type === 'task' && e.state === 'open').length;
  const doneTasksCount = entries.filter((e) => e.type === 'task' && e.state === 'done').length;
  const eventsCount = entries.filter((e) => e.type === 'event').length;
  const notesCount = entries.filter((e) => e.type === 'note').length;

  return (
    <div className="flex flex-col h-full">
      {/* Date Navigation & Summary Header */}
      <header className="px-4 py-3 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-1 rounded text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="Previous day (Left Arrow)"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
                title="Pick date"
              >
                <div>
                  <h2 className="text-base sm:text-lg font-serif-title font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    {formattedDayName}
                  </h2>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    {formattedDateFull}
                  </span>
                </div>
                <CalendarIcon className="w-4 h-4 text-stone-400" />
              </button>

              {showDatePicker && (
                <div className="absolute left-0 top-full mt-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xl z-20">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="text-xs bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1.5 text-stone-900 dark:text-stone-100"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => changeDay(1)}
              className="p-1 rounded text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="Next day (Right Arrow)"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={jumpToToday}
                className="text-xs px-2.5 py-1 rounded-md bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
              >
                Today
              </button>
            )}

            {/* Quiet metadata stats - Unboxed per design spec */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono">
              <span>{openTasksCount} open</span>
              <span aria-hidden="true">·</span>
              <span>{doneTasksCount} done</span>
              {eventsCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{eventsCount} events</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Entry List (Styled as notebook page) */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-1 pb-24 dot-grid">
        {isLoading ? (
          <div className="text-center py-16 text-stone-400 text-xs font-mono">
            Loading log...
          </div>
        ) : entries.length === 0 ? (
          <div className="max-w-sm mx-auto text-center py-16 px-4 space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-stone-200/50 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <span className="font-mono text-lg">•</span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 font-serif-title text-lg">
              Blank page for {formattedDayName}
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
              Rapid log your tasks (<span className="font-mono font-bold">•</span>), events (<span className="font-mono font-bold">○</span>), or notes (<span className="font-mono font-bold">—</span>) in the bar below.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                onStateChange={onStateChange}
                onEntryUpdated={loadEntries}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Fast Capture Bar at Bottom */}
      <div className="sticky bottom-0 p-3 sm:p-4 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-20">
        <CaptureInput
          currentDate={selectedDate}
          onEntryCreated={loadEntries}
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* Move Sheet */}
      <MoveSheet
        entry={activeMigrationEntry}
        onClose={() => setActiveMigrationEntry(null)}
        onMigrated={loadEntries}
      />
    </div>
  );
}
