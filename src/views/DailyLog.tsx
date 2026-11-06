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

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    // Show entries logged for this day or targeted for this day (excluding items strictly stored in custom collections other than inbox)
    const rawData = await db.entries
      .filter((e) => {
        const isThisDate = e.logDate === selectedDate || e.target === selectedDate;
        return isThisDate && (!e.collection || e.collection === 'inbox');
      })
      .toArray();

    // Stable sort: by manual 'order' if defined, fallback to 'createdAt'
    rawData.sort((a, b) => {
      const orderA = a.order ?? a.createdAt;
      const orderB = b.order ?? b.createdAt;
      return orderA - orderB;
    });

    setEntries(rawData);
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Persist updated entry sequence to IndexedDB
  const persistReorderedEntries = async (reordered: Entry[]) => {
    setEntries(reordered);
    await db.transaction('rw', db.entries, async () => {
      for (let i = 0; i < reordered.length; i++) {
        const item = reordered[i];
        const newOrder = (i + 1) * 1000;
        item.order = newOrder;
        item.updatedAt = Date.now();
        await db.entries.update(item.id, {
          order: newOrder,
          updatedAt: item.updatedAt,
        });
      }
    });
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entries[index].id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isTopHalf = offsetY < rect.height / 2;

    setDragOverIndex(targetIndex);
    setDropPosition(isTopHalf ? 'top' : 'bottom');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    // Only clear if mouse is leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientY < rect.top ||
      e.clientY >= rect.bottom ||
      e.clientX < rect.left ||
      e.clientX >= rect.right
    ) {
      if (dragOverIndex === index) {
        setDragOverIndex(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === undefined) return;

    if (draggedIndex === targetIndex && (
      (dropPosition === 'top' && draggedIndex === 0) ||
      (dropPosition === 'bottom' && draggedIndex === entries.length - 1)
    )) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    const newEntries = [...entries];
    const [movedItem] = newEntries.splice(draggedIndex, 1);

    let destinationIndex = targetIndex;
    if (dropPosition === 'bottom') {
      destinationIndex = targetIndex + 1;
    }
    if (draggedIndex < destinationIndex) {
      destinationIndex -= 1;
    }

    // Clamp between 0 and array length
    destinationIndex = Math.max(0, Math.min(newEntries.length, destinationIndex));
    newEntries.splice(destinationIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);

    onStateChange(movedItem, `Reordered "${movedItem.text.slice(0, 18)}..."`);
    await persistReorderedEntries(newEntries);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  // Keyboard / Click reordering helper
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= entries.length) return;

    const newEntries = [...entries];
    const item = newEntries[index];
    newEntries.splice(index, 1);
    newEntries.splice(targetIdx, 0, item);

    onStateChange(item, `Moved "${item.text.slice(0, 18)}..." ${direction}`);
    await persistReorderedEntries(newEntries);
  };

  // Touch swipe gesture detection to flip between days
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeNotice, setSwipeNotice] = useState<string | null>(null);

  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEndCanvas = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartRef.current.x;
    const deltaY = touchEnd.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Pure horizontal swipe: deltaX > 60px, dominates vertical scroll, time < 600ms
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 650) {
      if (deltaX < 0) {
        // Swiped left -> Tomorrow
        changeDay(1);
        setSwipeNotice('Tomorrow →');
        setTimeout(() => setSwipeNotice(null), 1000);
      } else {
        // Swiped right -> Yesterday
        changeDay(-1);
        setSwipeNotice('← Yesterday');
        setTimeout(() => setSwipeNotice(null), 1000);
      }
    }
  };

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

      {/* Main Entry List (Styled as notebook page with touch swipe support) */}
      <div
        onTouchStart={handleTouchStartCanvas}
        onTouchEnd={handleTouchEndCanvas}
        className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-1 pb-36 sm:pb-24 dot-grid relative"
      >
        {/* Swipe Feedback Banner */}
        {swipeNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-stone-900/90 text-stone-100 dark:bg-stone-100/95 dark:text-stone-900 px-3 py-1 rounded-full text-xs font-mono shadow-md z-30 pointer-events-none animate-in fade-in zoom-in-95">
            {swipeNotice}
          </div>
        )}

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
            <p className="text-[11px] text-stone-400 font-mono pt-2">
              Tip: Swipe left/right on mobile to flip days
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {entries.length > 1 && (
              <div className="flex justify-between items-center px-2 pb-1 text-[11px] text-stone-400 dark:text-stone-500 font-mono select-none">
                <span className="hidden sm:inline">Drag to reorder · Alt+↑/↓</span>
                <span className="sm:hidden">Swipe left/right to change day</span>
                <span className="sm:hidden">Drag handle to reorder</span>
              </div>
            )}
            {entries.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isDraggable={true}
                isDragging={draggedIndex === index}
                dropPosition={dragOverIndex === index ? dropPosition : null}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={(e) => handleDragLeave(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onMoveUp={index > 0 ? () => handleMove(index, 'up') : undefined}
                onMoveDown={index < entries.length - 1 ? () => handleMove(index, 'down') : undefined}
                onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                onStateChange={onStateChange}
                onEntryUpdated={loadEntries}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Fast Capture Bar at Bottom - Elevated above mobile bottom nav bar */}
      <div className="sticky bottom-16 md:bottom-0 p-3 sm:p-4 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-20">
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
