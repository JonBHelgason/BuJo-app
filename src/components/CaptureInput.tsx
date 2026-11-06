import React, { useState, useRef, useEffect } from 'react';
import { parseRawInput, getBulletGlyph } from '../utils/parser';
import { db } from '../db';
import type { Entry } from '../types/entry';
import { Calendar, Inbox, Sparkles, ChevronDown, CornerDownLeft } from 'lucide-react';

interface CaptureInputProps {
  currentDate: string; // ISO 'YYYY-MM-DD'
  activeCollectionId?: string | null;
  onEntryCreated?: () => void;
  className?: string;
  placeholder?: string;
}

export function CaptureInput({
  currentDate,
  activeCollectionId,
  onEntryCreated,
  className = '',
  placeholder = 'Capture anything... (o for event, - for note, * for priority)',
}: CaptureInputProps) {
  const [text, setText] = useState('');
  const [targetMode, setTargetMode] = useState<'current' | 'inbox' | 'custom'>(
    activeCollectionId === 'inbox' ? 'inbox' : 'current'
  );
  const [customDate, setCustomDate] = useState(currentDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount (Spec: Cursor focused immediately for <3s capture)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Global key listener to refocus input on '/' or 'c'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || (e.key === 'c' && (e.ctrlKey || e.metaKey))) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Live syntax parsing
  const parsed = parseRawInput(text);
  const glyph = getBulletGlyph(parsed.type, parsed.initialState, parsed.signifier);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const parsedData = parseRawInput(text);
    if (!parsedData.text) return;

    const isInbox = targetMode === 'inbox' || activeCollectionId === 'inbox';
    const selectedDate = targetMode === 'custom' ? customDate : currentDate;

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      type: parsedData.type,
      text: parsedData.text,
      signifier: parsedData.signifier,
      state: parsedData.type === 'task' ? 'open' : undefined,
      logDate: selectedDate,
      target: isInbox ? 'inbox' : undefined,
      collection: activeCollectionId && activeCollectionId !== 'inbox' ? activeCollectionId : isInbox ? 'inbox' : null,
      order: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.entries.add(newEntry);
    setText('');
    onEntryCreated?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Syntax Quick Reference Popover */}
      {showHelp && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-stone-900 text-stone-100 p-3 rounded-lg shadow-xl text-xs space-y-1.5 z-30 font-sans border border-stone-800">
          <div className="flex justify-between items-center font-medium border-b border-stone-800 pb-1 text-stone-300">
            <span>Bullet Journal Rapid Syntax</span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-stone-400 hover:text-stone-200"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] pt-1">
            <div><span className="text-amber-400 font-bold">•</span> task: <span className="text-stone-400">text</span> or <span className="text-stone-400">. text</span></div>
            <div><span className="text-sky-400 font-bold">○</span> event: <span className="text-stone-400">o text</span></div>
            <div><span className="text-stone-400 font-bold">—</span> note: <span className="text-stone-400">- text</span></div>
            <div><span className="text-emerald-400 font-bold">* •</span> priority: <span className="text-stone-400">* text</span></div>
            <div><span className="text-violet-400 font-bold">! •</span> inspiration: <span className="text-stone-400">! text</span></div>
            <div className="text-stone-400 italic">Press / to focus anytime</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 rounded-xl px-2.5 py-1.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-stone-400 dark:focus-within:ring-stone-600 focus-within:border-transparent focus-within:bg-white dark:focus-within:bg-stone-900"
      >
        {/* Target Destination Selector */}
        {!activeCollectionId && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (targetMode === 'current') setTargetMode('inbox');
                else if (targetMode === 'inbox') setShowDatePicker(true);
                else setTargetMode('current');
              }}
              className="text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1 rounded bg-stone-200/70 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-800 flex items-center gap-1 transition-colors select-none"
              title="Click to cycle capture target: Today -> Inbox -> Date"
            >
              {targetMode === 'current' && <span>Log</span>}
              {targetMode === 'inbox' && (
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <Inbox className="w-3 h-3" /> Inbox
                </span>
              )}
              {targetMode === 'custom' && (
                <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
                  <Calendar className="w-3 h-3" /> {customDate.slice(5)}
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showDatePicker && (
              <div className="absolute left-0 bottom-full mb-1.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 shadow-xl z-20">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block mb-1">
                  Target Log Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setTargetMode('custom');
                    setShowDatePicker(false);
                    inputRef.current?.focus();
                  }}
                  onBlur={() => setShowDatePicker(false)}
                  className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1 text-stone-900 dark:text-stone-100 outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Live Bullet Preview Glyph */}
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-stone-200/60 dark:hover:bg-stone-800 text-sm select-none transition-colors"
          title={`Click for syntax cheatsheet. Currently: ${glyph.label}`}
        >
          <span className={glyph.className}>
            {text.trim() ? glyph.symbol : '•'}
          </span>
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none min-w-0"
        />

        {/* Enter Indicator / Submit Button */}
        {text.trim() && (
          <button
            type="submit"
            className="flex items-center gap-1 text-xs px-2 py-1 bg-stone-800 hover:bg-stone-900 text-stone-100 dark:bg-stone-200 dark:hover:bg-white dark:text-stone-900 rounded font-medium transition-colors shrink-0"
            title="Press Enter to save entry"
          >
            <span>Add</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        )}

        {!text.trim() && (
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 p-1"
            title="Syntax guide"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
    </div>
  );
}
