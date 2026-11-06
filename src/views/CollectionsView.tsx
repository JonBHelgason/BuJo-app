import React, { useState, useEffect, useCallback } from 'react';
import type { Entry, Collection } from '../types/entry';
import { db } from '../db';
import { EntryRow } from '../components/EntryRow';
import { CaptureInput } from '../components/CaptureInput';
import { MoveSheet } from '../components/MoveSheet';
import { Inbox, Folder, Plus, Trash2, Pin } from 'lucide-react';

interface CollectionsViewProps {
  onStateChange: (prev: Entry, actionDesc: string) => void;
}

export function CollectionsView({ onStateChange }: CollectionsViewProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('inbox');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeMigrationEntry, setActiveMigrationEntry] = useState<Entry | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadCollections = useCallback(async () => {
    const list = await db.collections.orderBy('order').toArray();
    setCollections(list);
  }, []);

  const loadEntries = useCallback(async () => {
    if (!activeCollectionId) return;

    if (activeCollectionId === 'inbox') {
      const inboxItems = await db.entries
        .filter((e) => e.collection === 'inbox' || e.target === 'inbox')
        .sortBy('createdAt');
      setEntries(inboxItems);
    } else {
      const items = await db.entries
        .filter((e) => e.collection === activeCollectionId)
        .sortBy('createdAt');
      setEntries(items);
    }
  }, [activeCollectionId]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || collections[0];

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newCol: Collection = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      isPinned: false,
      order: collections.length,
      createdAt: Date.now(),
    };

    await db.collections.add(newCol);
    setNewTitle('');
    setNewDesc('');
    setShowNewCollectionModal(false);
    await loadCollections();
    setActiveCollectionId(newCol.id);
  };

  const handleDeleteCollection = async (colId: string) => {
    if (colId === 'inbox') return; // Cannot delete Inbox
    if (confirm('Delete this collection and its entries?')) {
      await db.transaction('rw', db.collections, db.entries, async () => {
        await db.collections.delete(colId);
        await db.entries.where('collection').equals(colId).delete();
      });
      setActiveCollectionId('inbox');
      await loadCollections();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-3 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-serif-title font-bold text-stone-900 dark:text-stone-100">
              Collections &amp; Lists
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
              Thematic logs, reference lists &amp; inbox
            </p>
          </div>
          <button
            onClick={() => setShowNewCollectionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Collection</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Collection Navigation Tabs / Sidebar & Item List */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Collections Tab Bar / Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/30 p-2 md:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 shrink-0">
          {collections.map((col) => {
            const isActive = col.id === activeCollectionId;
            const isInbox = col.id === 'inbox';

            return (
              <button
                key={col.id}
                onClick={() => setActiveCollectionId(col.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left font-medium whitespace-nowrap transition-colors shrink-0 md:w-full ${
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
                }`}
              >
                {isInbox ? (
                  <Inbox className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : col.isPinned ? (
                  <Pin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                )}
                <span className="flex-1 truncate">{col.title}</span>
              </button>
            );
          })}
        </aside>

        {/* Collection Entries Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden dot-grid">
          {/* Active Collection Header Info */}
          <div className="px-4 py-3 sm:px-6 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between bg-white/40 dark:bg-stone-900/40">
            <div>
              <h3 className="font-serif-title font-bold text-base text-stone-900 dark:text-stone-100">
                {activeCollection?.title || 'Collection'}
              </h3>
              {activeCollection?.description && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {activeCollection.description}
                </p>
              )}
            </div>

            {activeCollection?.id !== 'inbox' && (
              <button
                onClick={() => handleDeleteCollection(activeCollection?.id || '')}
                className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Delete Collection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Entries in Collection */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-1 pb-24">
            {entries.length === 0 ? (
              <div className="max-w-sm mx-auto text-center py-12 text-stone-400 text-xs space-y-2">
                <p>No entries in this collection yet.</p>
                <p className="text-[11px] text-stone-500">
                  Type in the capture bar below to record fleeting notes or tasks for this list.
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  showDate={true}
                  onMigrateRequest={(e) => setActiveMigrationEntry(e)}
                  onStateChange={onStateChange}
                  onEntryUpdated={loadEntries}
                />
              ))
            )}
          </div>

          {/* Sticky Fast Capture for this Collection */}
          <div className="p-3 sm:p-4 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent dark:from-stone-950 dark:via-stone-950/95 z-20">
            <CaptureInput
              currentDate={new Date().toISOString().slice(0, 10)}
              activeCollectionId={activeCollectionId}
              onEntryCreated={loadEntries}
              placeholder={`Add entry to ${activeCollection?.title || 'collection'}...`}
              className="max-w-2xl mx-auto"
            />
          </div>
        </main>
      </div>

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-bold font-serif-title text-stone-900 dark:text-stone-100">
              Create New Collection
            </h3>
            <form onSubmit={handleCreateCollection} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1">
                  Collection Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Packing List, Books to Read"
                  autoFocus
                  required
                  className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Reference notes and recommendations"
                  className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg text-xs font-medium shadow-xs"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MoveSheet
        entry={activeMigrationEntry}
        onClose={() => setActiveMigrationEntry(null)}
        onMigrated={loadEntries}
      />
    </div>
  );
}
