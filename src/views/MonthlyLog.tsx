import React, { useState, useEffect, useCallback } from 'react';
import type { Entry } from '../types/entry';
import { db } from '../db';
import { EntryRow } from '../components/EntryRow';
import { CaptureInput } from '../components/CaptureInput';
import { MoveSheet } from '../components/MoveSheet';
import { ChevronLeft, ChevronRight, Compass, AlertCircle } from 'lucide-react';

interface MonthlyLogProps {
  onStateChange: (prev: Entry, actionDesc: string) => void;
  onStartReview: (monthStr: string) => void;
}

export function MonthlyLog({ onStateChange, onStartReview }: MonthlyLogProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [activeMigrationEntry, setActiveMigrationEntry] = useState<Entry | null>(null);

  const loadMonthEntries = useCallback(async () => {
    // Entries logged in this month or targeted for this month
    const entries = await db.entries
      .filter((e) => e.logDate.startsWith(currentMonth) || e.target === currentMonth)
      .sortBy('createdAt');
    setMonthEntries(entries);
  }, [currentMonth]);

  useEffect(() => {
    loadMonthEntries();
  }, [loadMonthEntries]);

  // Month navigation
  const changeMonth = (offset: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const [year, month] = currentMonth.split('-').map(Number);
  const monthDate = new Date(year, month - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Compute days in this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group events by day number
  const eventsByDay: Record<number, Entry[]> = {};
  monthEntries
    .filter((e) => e.type === 'event' || e.logDate.startsWith(currentMonth))
    .forEach((e) => {
      const dayNum = parseInt(e.logDate.slice(8, 10), 10);
      if (!isNaN(dayNum)) {
        if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
        eventsByDay[dayNum].push(e);
      }
    });

  // Filter monthly tasks
  const tasks = monthEntries.filter((e) => e.type === 'task');
  const openTasks = tasks.filter((e) => e.state === 'open');

  return (
    <div className="flex flex-col h-full">
      {/* Month Navigation & Review Banner Header */}
      <header className="px-4 py-3 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 rounded text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-serif-title font-bold text-stone-900 dark:text-stone-100">
                {monthName}
              </h2>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                Monthly Log
              </span>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 rounded text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartReview(currentMonth)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-all shadow-xs"
              title="Initiate deliberate review of open tasks"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Review Month</span>
              {openTasks.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px]">
                  {openTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Review Alert Notice if tasks remain open */}
      {openTasks.length > 0 && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>{openTasks.length} open {openTasks.length === 1 ? 'task requires' : 'tasks require'} deliberate choice:</strong> migrate, schedule, or strike.
            </span>
          </div>
          <button
            onClick={() => onStartReview(currentMonth)}
            className="underline font-medium hover:text-amber-950 dark:hover:text-white shrink-0 ml-2"
          >
            Start Review &rarr;
          </button>
        </div>
      )}

      {/* Two Column Layout (Ryder Carroll Classic: Left = Calendar, Right = Monthly Tasks) */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 dot-grid">
        {/* Left Column: Date-by-date calendar (Cols 1-5) */}
        <div className="lg:col-span-5 bg-white/70 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-200 dark:border-stone-800 h-fit space-y-2">
          <h3 className="font-serif-title font-semibold text-sm text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
            Calendar & Events
          </h3>

          <div className="space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto pr-1">
            {daysArray.map((day) => {
              const dayStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
              const dayDate = new Date(year, month - 1, day);
              const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'narrow' });
              const isToday = dayStr === new Date().toISOString().slice(0, 10);
              const dayEvents = eventsByDay[day] || [];

              return (
                <div
                  key={day}
                  className={`flex items-start gap-2 py-1 px-1.5 rounded transition-colors ${
                    isToday
                      ? 'bg-amber-100/60 dark:bg-amber-950/40 font-bold'
                      : 'hover:bg-stone-100/50 dark:hover:bg-stone-800/40'
                  }`}
                >
                  <span className={`w-10 shrink-0 ${isToday ? 'text-amber-800 dark:text-amber-300' : 'text-stone-500'}`}>
                    {String(day).padStart(2, ' ')} {dayOfWeek}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {dayEvents.length === 0 ? (
                      <span className="text-stone-300 dark:text-stone-700 select-none">·</span>
                    ) : (
                      dayEvents.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-1.5 font-sans text-xs text-stone-800 dark:text-stone-200 truncate">
                          <span className="text-sky-600 dark:text-sky-400 font-mono">○</span>
                          <span className="truncate">{ev.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Monthly Tasks & Notes (Cols 6-12) */}
        <div className="lg:col-span-7 bg-white/70 dark:bg-stone-900/50 p-4 rounded-xl border border-stone-200 dark:border-stone-800 h-fit space-y-3">
          <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-2">
            <h3 className="font-serif-title font-semibold text-sm text-stone-900 dark:text-stone-100">
              Monthly Tasks & Focus
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              {tasks.length} total · {openTasks.length} open
            </span>
          </div>

          <div className="space-y-1">
            {monthEntries.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                No entries logged for {monthName} yet.
              </p>
            ) : (
              monthEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  showDate={true}
                  onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                  onStateChange={onStateChange}
                  onEntryUpdated={loadMonthEntries}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Capture Bar */}
      <div className="sticky bottom-0 p-3 sm:p-4 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-20">
        <CaptureInput
          currentDate={`${currentMonth}-01`}
          onEntryCreated={loadMonthEntries}
          className="max-w-2xl mx-auto"
        />
      </div>

      <MoveSheet
        entry={activeMigrationEntry}
        onClose={() => setActiveMigrationEntry(null)}
        onMigrated={loadMonthEntries}
      />
    </div>
  );
}
