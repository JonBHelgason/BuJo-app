import React, { useState, useRef } from 'react';
import type { Entry, TaskState, Signifier } from '../types/entry';
import { db } from '../db';
import { getBulletGlyph } from '../utils/parser';
import { MoreHorizontal, ArrowRight, Edit3, Trash2, Star, Sparkles, Check, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface EntryRowProps {
  entry: Entry;
  onMigrateRequest: (entry: Entry) => void;
  onStateChange: (prev: Entry, actionDesc: string) => void;
  onEntryUpdated?: () => void;
  showDate?: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  dropPosition?: 'top' | 'bottom' | null;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function EntryRow({
  entry,
  onMigrateRequest,
  onStateChange,
  onEntryUpdated,
  showDate = false,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  dropPosition = null,
  onMoveUp,
  onMoveDown,
}: EntryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const glyph = getBulletGlyph(entry.type, entry.state, entry.signifier);

  // Cycle Task State: open -> done -> struck -> open
  const cycleTaskState = async () => {
    if (entry.type !== 'task') return;
    onStateChange(entry, `Toggle "${entry.text.slice(0, 20)}..."`);

    let nextState: TaskState = 'open';
    if (entry.state === 'open') nextState = 'done';
    else if (entry.state === 'done') nextState = 'struck';
    else if (entry.state === 'struck') nextState = 'open';
    else if (entry.state === 'migrated' || entry.state === 'scheduled') nextState = 'open';

    await db.entries.update(entry.id, {
      state: nextState,
      updatedAt: Date.now(),
    });
    onEntryUpdated?.();
  };

  // Strike task directly
  const strikeTask = async () => {
    if (entry.type !== 'task') return;
    onStateChange(entry, `Strike "${entry.text.slice(0, 20)}..."`);
    await db.entries.update(entry.id, {
      state: 'struck',
      updatedAt: Date.now(),
    });
    onEntryUpdated?.();
  };

  // Cycle signifier: none -> priority -> inspiration -> none
  const cycleSignifier = async () => {
    onStateChange(entry, `Signifier change`);
    let nextSig: Signifier = 'none';
    if (entry.signifier === 'none') nextSig = 'priority';
    else if (entry.signifier === 'priority') nextSig = 'inspiration';
    else nextSig = 'none';

    await db.entries.update(entry.id, {
      signifier: nextSig,
      updatedAt: Date.now(),
    });
    onEntryUpdated?.();
  };

    // Keyboard shortcut listener on entry container
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;

    if (e.altKey) {
      if (e.key === 'ArrowUp' && onMoveUp) {
        e.preventDefault();
        onMoveUp();
        return;
      } else if (e.key === 'ArrowDown' && onMoveDown) {
        e.preventDefault();
        onMoveDown();
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'Enter') {
        e.preventDefault();
        cycleTaskState();
      } else if (e.key === 'Backspace' && entry.type === 'task') {
        e.preventDefault();
        strikeTask();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onMigrateRequest(entry);
      }
    }
  };

  // Touch long press to trigger migration sheet
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onMigrateRequest(entry);
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Double click handler to strike task
  const handleDoubleClick = () => {
    if (entry.type === 'task') {
      strikeTask();
    }
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    onStateChange(entry, `Edit text`);
    await db.entries.update(entry.id, {
      text: editText.trim(),
      updatedAt: Date.now(),
    });
    setIsEditing(false);
    onEntryUpdated?.();
  };

  const deleteEntry = async () => {
    onStateChange(entry, `Delete entry`);
    await db.entries.delete(entry.id);
    onEntryUpdated?.();
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      draggable={isDraggable && !isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative flex items-baseline gap-1.5 sm:gap-2 py-1.5 px-2 rounded-lg transition-all outline-none focus-visible:ring-1 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 hover:bg-stone-100/70 dark:hover:bg-stone-900/60 ${
        entry.state === 'struck' ? 'opacity-60' : ''
      } ${
        isDragging
          ? 'opacity-30 scale-[0.99] border-dashed border-2 border-stone-400 dark:border-stone-600 bg-stone-100/50 dark:bg-stone-800/40 shadow-inner'
          : ''
      }`}
    >
      {/* Drop Target Indicator Lines */}
      {dropPosition === 'top' && (
        <div
          aria-hidden="true"
          className="absolute -top-1 left-1.5 right-1.5 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full z-20 pointer-events-none shadow-sm"
        />
      )}
      {dropPosition === 'bottom' && (
        <div
          aria-hidden="true"
          className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full z-20 pointer-events-none shadow-sm"
        />
      )}

      {/* Drag & Drop Grip Handle */}
      {isDraggable && (
        <div
          className="shrink-0 flex items-center justify-center w-3 sm:w-3.5 h-6 text-stone-300 dark:text-stone-700 hover:text-stone-600 dark:hover:text-stone-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity select-none"
          title="Drag to reorder (or press Alt+Up / Alt+Down)"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Interactive Bullet Symbol - Min 44px tap target on mobile */}
      <div className="shrink-0 flex items-center justify-center min-w-[28px] min-h-[30px]">
        <button
          type="button"
          onClick={cycleTaskState}
          onDoubleClick={handleDoubleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            onMigrateRequest(entry);
          }}
          className={`w-7 h-7 flex items-center justify-center rounded transition-transform active:scale-90 select-none ${
            entry.type === 'task'
              ? 'cursor-pointer hover:bg-stone-200/60 dark:hover:bg-stone-800'
              : 'cursor-default'
          }`}
          title={
            entry.type === 'task'
              ? 'Click to complete, double-click to strike, right-click/Ctrl+M to migrate'
              : glyph.label
          }
          aria-label={glyph.label}
        >
          <span className={`${glyph.className} text-base`}>
            {glyph.symbol}
          </span>
        </button>
      </div>

      {/* Entry Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
              className="flex-1 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded px-2 py-0.5 text-sm text-stone-900 dark:text-stone-100 outline-none"
            />
            <button
              onClick={saveEdit}
              className="p-1 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <span
              onClick={cycleTaskState}
              className={`text-sm leading-relaxed transition-all cursor-pointer ${
                entry.state === 'struck'
                  ? 'line-through text-stone-400 dark:text-stone-500'
                  : entry.state === 'done'
                  ? 'text-stone-500 dark:text-stone-400 line-through decoration-stone-300 dark:decoration-stone-600'
                  : 'text-stone-800 dark:text-stone-100'
              }`}
            >
              {entry.text}
            </span>

            {/* Subtle Origin Lineage or Date Metadata (Unboxed) */}
            {(entry.origin || showDate || entry.target) && (
              <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                {showDate && <span>{entry.logDate}</span>}
                {entry.origin && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="italic">migrated from previous log</span>
                  </>
                )}
                {entry.target && entry.target !== entry.logDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-stone-500 dark:text-stone-400">target: {entry.target}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row Hover / Focus Action Bar */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onMigrateRequest(entry)}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800"
          title="Migrate or Move (Ctrl+M)"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded hover:bg-stone-200/50 dark:hover:bg-stone-800"
            title="More actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg py-1 w-36 z-30 text-xs font-sans"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit text
              </button>
              <button
                type="button"
                onClick={() => {
                  cycleSignifier();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
              >
                {entry.signifier === 'priority' ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  <Star className="w-3.5 h-3.5" />
                )}
                Toggle signifier
              </button>
              {entry.type === 'task' && (
                <button
                  type="button"
                  onClick={() => {
                    strikeTask();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                >
                  Strike out (Ctrl+Bksp)
                </button>
              )}
              {onMoveUp && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveUp();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Move up (Alt+Up)
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveDown();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Move down (Alt+Down)
                </button>
              )}
              <div className="border-t border-stone-200 dark:border-stone-800 my-1" />
              <button
                type="button"
                onClick={() => {
                  deleteEntry();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
