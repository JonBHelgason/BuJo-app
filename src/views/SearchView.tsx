import React, { useState, useEffect, useCallback } from 'react';
import type { Entry } from '../types/entry';
import { db } from '../db';
import { EntryRow } from '../components/EntryRow';
import { MoveSheet } from '../components/MoveSheet';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';

interface SearchViewProps {
  onStateChange: (prev: Entry, actionDesc: string) => void;
  onNavigateToDate?: (dateStr: string) => void;
}

type FilterType = 'all' | 'task' | 'event' | 'note' | 'priority' | 'inspiration' | 'open' | 'done' | 'struck' | 'migrated';

export function SearchView({ onStateChange, onNavigateToDate }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [activeMigrationEntry, setActiveMigrationEntry] = useState<Entry | null>(null);

  const loadAllEntries = useCallback(async () => {
    const list = await db.entries.orderBy('createdAt').reverse().toArray();
    setEntries(list);
  }, []);

  useEffect(() => {
    loadAllEntries();
  }, [loadAllEntries]);

  // Apply search query and filter
  useEffect(() => {
    let result = entries;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.text.toLowerCase().includes(q) ||
          e.logDate.includes(q) ||
          (e.target && e.target.toLowerCase().includes(q))
      );
    }

    if (filter === 'task') {
      result = result.filter((e) => e.type === 'task');
    } else if (filter === 'event') {
      result = result.filter((e) => e.type === 'event');
    } else if (filter === 'note') {
      result = result.filter((e) => e.type === 'note');
    } else if (filter === 'priority') {
      result = result.filter((e) => e.signifier === 'priority');
    } else if (filter === 'inspiration') {
      result = result.filter((e) => e.signifier === 'inspiration');
    } else if (filter === 'open') {
      result = result.filter((e) => e.type === 'task' && e.state === 'open');
    } else if (filter === 'done') {
      result = result.filter((e) => e.type === 'task' && e.state === 'done');
    } else if (filter === 'struck') {
      result = result.filter((e) => e.type === 'task' && e.state === 'struck');
    } else if (filter === 'migrated') {
      result = result.filter((e) => e.type === 'task' && (e.state === 'migrated' || e.state === 'scheduled'));
    }

    setFilteredEntries(result);
  }, [entries, query, filter]);

  const filterTabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Entries' },
    { id: 'task', label: 'Tasks •' },
    { id: 'event', label: 'Events ○' },
    { id: 'note', label: 'Notes —' },
    { id: 'priority', label: 'Priority *' },
    { id: 'inspiration', label: 'Ideas !' },
    { id: 'open', label: 'Open' },
    { id: 'done', label: 'Completed ✕' },
    { id: 'migrated', label: 'Migrated >' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search Bar Header */}
      <header className="px-4 py-3 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 sticky top-0 z-10 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-serif-title font-bold text-stone-900 dark:text-stone-100">
              Index &amp; Search
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Dynamic replacement for the analogue paper index
            </p>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {filteredEntries.length} found
          </span>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, tasks, dates (e.g. 2026-11)..."
            autoFocus
            className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-8 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Segmented Controls (Interactive buttons per frontend design constitution) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors shrink-0 ${
                filter === tab.id
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Results List */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-1 dot-grid pb-20">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs space-y-2">
            <p>No entries match your search &amp; filter criteria.</p>
            <p className="text-[11px] text-stone-500">
              Try clearing filters or searching for partial words.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="group/item flex items-center justify-between"
            >
              <div className="flex-1">
                <EntryRow
                  entry={entry}
                  showDate={true}
                  onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                  onStateChange={onStateChange}
                  onEntryUpdated={loadAllEntries}
                />
              </div>
              {onNavigateToDate && entry.logDate && (
                <button
                  onClick={() => onNavigateToDate(entry.logDate)}
                  className="opacity-0 group-hover/item:opacity-100 text-[11px] font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline ml-2 shrink-0 transition-opacity"
                >
                  Go to log &rarr;
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <MoveSheet
        entry={activeMigrationEntry}
        onClose={() => setActiveMigrationEntry(null)}
        onMigrated={loadAllEntries}
      />
    </div>
  );
}
