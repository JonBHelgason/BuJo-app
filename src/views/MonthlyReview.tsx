import React, { useState, useEffect } from 'react';
import type { Entry } from '../types/entry';
import { db } from '../db';
import { ArrowRight, Clock, Ban, SkipForward, CheckCircle2, RotateCcw } from 'lucide-react';

interface MonthlyReviewProps {
  closingMonth: string; // 'YYYY-MM'
  onComplete: () => void;
  onStateChange: (prev: Entry, actionDesc: string) => void;
}

export function MonthlyReview({ closingMonth, onComplete, onStateChange }: MonthlyReviewProps) {
  const [tasks, setTasks] = useState<Entry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<{
    migrated: number;
    scheduled: number;
    struck: number;
    skipped: number;
  }>({ migrated: 0, scheduled: 0, struck: 0, skipped: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Find all uncompleted tasks for the closing month
    db.entries
      .filter((e) => e.logDate.startsWith(closingMonth) && e.type === 'task' && e.state === 'open')
      .toArray()
      .then((items) => {
        setTasks(items);
        setIsLoading(false);
      });
  }, [closingMonth]);

  const currentTask = tasks[currentIndex];

  const handleDecision = async (action: 'migrate' | 'schedule' | 'strike' | 'skip') => {
    if (!currentTask) return;

    if (action === 'strike') {
      onStateChange(currentTask, `Struck in monthly review`);
      await db.entries.update(currentTask.id, {
        state: 'struck',
        updatedAt: Date.now(),
      });
      setDecisions((d) => ({ ...d, struck: d.struck + 1 }));
    } else if (action === 'migrate') {
      onStateChange(currentTask, `Migrated in monthly review`);
      // Compute next month
      const [year, month] = closingMonth.split('-').map(Number);
      const nextMonthDate = new Date(year, month, 1);
      const nextMonthStr = nextMonthDate.toISOString().slice(0, 7);

      await db.transaction('rw', db.entries, async () => {
        await db.entries.update(currentTask.id, {
          state: 'migrated',
          updatedAt: Date.now(),
        });
        await db.entries.add({
          id: crypto.randomUUID(),
          type: 'task',
          text: currentTask.text,
          state: 'open',
          signifier: currentTask.signifier,
          logDate: `${nextMonthStr}-01`,
          origin: currentTask.id, // Linked by origin
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
      setDecisions((d) => ({ ...d, migrated: d.migrated + 1 }));
    } else if (action === 'schedule') {
      onStateChange(currentTask, `Scheduled to future log`);
      // Scheduled to future month (2 months ahead)
      const [year, month] = closingMonth.split('-').map(Number);
      const futureMonthDate = new Date(year, month + 1, 1);
      const futureMonthStr = futureMonthDate.toISOString().slice(0, 7);

      await db.transaction('rw', db.entries, async () => {
        await db.entries.update(currentTask.id, {
          state: 'scheduled',
          updatedAt: Date.now(),
        });
        await db.entries.add({
          id: crypto.randomUUID(),
          type: 'task',
          text: currentTask.text,
          state: 'scheduled',
          signifier: currentTask.signifier,
          logDate: currentTask.logDate,
          target: futureMonthStr,
          origin: currentTask.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
      setDecisions((d) => ({ ...d, scheduled: d.scheduled + 1 }));
    } else if (action === 'skip') {
      setDecisions((d) => ({ ...d, skipped: d.skipped + 1 }));
    }

    if (currentIndex + 1 < tasks.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const [y, m] = closingMonth.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs font-mono text-stone-400">
        Preparing monthly review...
      </div>
    );
  }

  if (tasks.length === 0 || isFinished) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center min-h-[60vh] text-center space-y-5 animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold font-serif-title text-stone-900 dark:text-stone-100">
            Monthly Review Complete
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {monthName} has been deliberately examined.
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 text-xs font-mono space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-stone-500">Migrated (&gt;):</span>
              <span className="font-bold text-amber-600">{decisions.migrated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Scheduled to Future (&lt;):</span>
              <span className="font-bold text-sky-600">{decisions.scheduled}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Discarded / Struck (×):</span>
              <span className="font-bold text-stone-500">{decisions.struck}</span>
            </div>
            {decisions.skipped > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-500">Skipped (left open):</span>
                <span className="font-bold text-stone-700 dark:text-stone-300">{decisions.skipped}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onComplete}
          className="px-5 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs"
        >
          Return to Journal
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / tasks.length) * 100);

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-between min-h-[75vh]">
      {/* Top Header & Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-stone-500 font-mono">
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            Monthly Review · {monthName}
          </span>
          <span>
            Task {currentIndex + 1} of {tasks.length}
          </span>
        </div>

        {/* Quiet Progress Bar */}
        <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-800 dark:bg-stone-200 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Prominent Contemplation Card for Current Task */}
      <div className="my-8 p-6 sm:p-8 bg-white/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm text-center space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
          Does this task still matter?
        </span>

        <h3 className="text-lg sm:text-xl font-serif-title font-medium text-stone-900 dark:text-stone-100 leading-snug">
          &quot;{currentTask.text}&quot;
        </h3>

        <div className="text-xs text-stone-400 font-mono">
          Logged on {currentTask.logDate}
        </div>
      </div>

      {/* Decision Actions */}
      <div className="space-y-2 font-medium text-xs sm:text-sm">
        <button
          onClick={() => handleDecision('migrate')}
          className="w-full py-3 px-4 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-white flex items-center justify-between transition-colors shadow-xs"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono text-amber-400 font-bold">&gt;</span>
            <span>Migrate to Next Month</span>
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleDecision('schedule')}
          className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">&lt;</span>
            <span>Schedule in Future Log</span>
          </span>
          <Clock className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleDecision('strike')}
          className="w-full py-2.5 px-4 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-xl flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="font-mono">×</span>
            <span>Strike Out (Irrelevant / Not Worth It)</span>
          </span>
          <Ban className="w-4 h-4 text-stone-400" />
        </button>

        <div className="pt-2 flex justify-between items-center text-xs">
          <button
            onClick={() => handleDecision('skip')}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center gap-1"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip for now</span>
          </button>

          <button
            onClick={onComplete}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            Exit Review
          </button>
        </div>
      </div>
    </div>
  );
}
