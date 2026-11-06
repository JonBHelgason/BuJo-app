import React, { useState, useEffect } from 'react';
import type { Entry, Collection, TargetType } from '../types/entry';
import { db } from '../db';
import { Calendar, ArrowRight, Clock, FolderPlus, X, Ban, CornerUpRight } from 'lucide-react';

interface MoveSheetProps {
  entry: Entry | null;
  onClose: () => void;
  onMigrated?: () => void;
}

export function MoveSheet({ entry, onClose, onMigrated }: MoveSheetProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customDate, setCustomDate] = useState(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.toISOString().slice(0, 10);
  });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  useEffect(() => {
    if (entry) {
      db.collections.toArray().then(setCollections);
    }
  }, [entry]);

  if (!entry) return null;

  const handleMigration = async (
    targetType: 'tomorrow' | 'month' | 'year' | 'date' | 'collection',
    customDestination?: string
  ) => {
    let target: TargetType = '';
    const now = new Date();
    let targetDate = entry.logDate;
    let targetCollection: string | null = null;

    if (targetType === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().slice(0, 10);
      target = targetDate;
    } else if (targetType === 'month') {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      target = nextMonth.toISOString().slice(0, 7); // 'YYYY-MM'
      targetDate = `${target}-01`;
    } else if (targetType === 'year') {
      const nextYear = `${now.getFullYear() + 1}`;
      target = nextYear;
      targetDate = `${nextYear}-01-01`;
    } else if (targetType === 'date' && customDestination) {
      target = customDestination;
      targetDate = customDestination;
    } else if (targetType === 'collection' && customDestination) {
      targetCollection = customDestination;
      target = customDestination === 'inbox' ? 'inbox' : targetDate;
    }

    // Deliberate migration logic:
    // Distance determines state:
    // Tomorrow or same month = migrated ('>')
    // Future month or year = scheduled ('<')
    const isScheduled = targetType === 'month' || targetType === 'year';
    const originalNextState = isScheduled ? 'scheduled' : 'migrated';

    await db.transaction('rw', db.entries, async () => {
      // 1. Mark original entry as migrated or scheduled
      await db.entries.update(entry.id, {
        state: entry.type === 'task' ? originalNextState : entry.state,
        updatedAt: Date.now(),
      });

      // 2. Spawn linked entry at destination preserving origin lineage
      await db.entries.add({
        id: crypto.randomUUID(),
        type: entry.type,
        text: entry.text,
        state: 'open',
        signifier: entry.signifier,
        logDate: targetDate,
        target: target,
        origin: entry.id, // Track lineage per spec
        collection: targetCollection,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    onMigrated?.();
    onClose();
  };

  const handleStrike = async () => {
    await db.entries.update(entry.id, {
      state: 'struck',
      updatedAt: Date.now(),
    });
    onMigrated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-end sm:items-center sm:justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-stone-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Deliberate Migration
            </span>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-0.5 line-clamp-2">
              &quot;{entry.text}&quot;
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          The Bullet Journal Method requires conscious decision: Is this task worth rewriting into the future, or should it be discarded?
        </p>

        {/* Action Options */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleMigration('tomorrow')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/70 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">&gt;</span>
              <span>Migrate to Tomorrow</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => handleMigration('month')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/70 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">&lt;</span>
              <span>Schedule in Future Log (Next Month)</span>
            </span>
            <Clock className="w-4 h-4 text-stone-400" />
          </button>

          {/* Custom Date Pick */}
          {!showCustomDate ? (
            <button
              type="button"
              onClick={() => setShowCustomDate(true)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/70 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-stone-500" />
                <span>Move to Specific Date...</span>
              </span>
              <CornerUpRight className="w-4 h-4 text-stone-400" />
            </button>
          ) : (
            <div className="p-3 bg-stone-100 dark:bg-stone-800/90 rounded-lg space-y-2">
              <label className="text-xs text-stone-600 dark:text-stone-300 font-medium block">
                Choose destination date:
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded px-2 py-1 text-sm text-stone-900 dark:text-stone-100"
                />
                <button
                  type="button"
                  onClick={() => handleMigration('date', customDate)}
                  className="px-3 py-1 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded text-xs font-medium"
                >
                  Move
                </button>
              </div>
            </div>
          )}

          {/* Collections Selector */}
          {collections.length > 0 && (
            <div className="pt-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1.5">
                Move to Collection or List
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleMigration('collection', col.id)}
                    className="text-left px-2.5 py-1.5 rounded-md text-xs bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 truncate flex items-center gap-1.5 border border-stone-200/50 dark:border-stone-800"
                  >
                    <FolderPlus className="w-3.5 h-3.5 shrink-0 text-stone-500" />
                    <span className="truncate">{col.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Strike Out Alternative */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
            <button
              type="button"
              onClick={handleStrike}
              className="flex-1 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>No longer relevant (Strike ×)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
