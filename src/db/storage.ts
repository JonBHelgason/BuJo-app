import { db, initDatabaseDefaults } from './index';
import type { Entry, ExportData } from '../types/entry';

/**
 * Request persistent browser storage to prevent eviction on iOS Safari & WebKit
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Export complete journal to a single JSON file
 */
export async function exportJournalJSON(): Promise<void> {
  const entries = await db.entries.toArray();
  const collections = await db.collections.toArray();

  const exportPayload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    collections,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bujon-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Import and merge/overwrite journal from JSON backup
 */
export async function importJournalJSON(file: File): Promise<{ count: number; collectionsCount: number }> {
  const content = await file.text();
  const data: ExportData = JSON.parse(content);

  if (!data || data.version !== 1 || !Array.isArray(data.entries)) {
    throw new Error('Invalid or unsupported BuJón backup file (version must be 1)');
  }

  return await db.transaction('rw', db.entries, db.collections, async () => {
    await db.entries.clear();
    await db.entries.bulkPut(data.entries);
    if (data.collections && Array.isArray(data.collections)) {
      await db.collections.clear();
      await db.collections.bulkPut(data.collections);
    }
    return {
      count: data.entries.length,
      collectionsCount: data.collections?.length ?? 0,
    };
  });
}

/**
 * Seed realistic starter bullet journal data adhering to Ryder Carroll's method
 */
export async function seedSampleData(): Promise<void> {
  await db.transaction('rw', db.entries, db.collections, async () => {
    await db.entries.clear();
    await db.collections.clear();
    await initDatabaseDefaults();

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7); // YYYY-MM

    const twoMonthsOut = new Date(today.getFullYear(), today.getMonth() + 2, 10);
    const twoMonthsStr = twoMonthsOut.toISOString().slice(0, 7);

    const now = Date.now();

    const sampleEntries: Entry[] = [
      // Today's log
      {
        id: 'sample-1',
        type: 'task',
        text: 'Morning reflection and deliberate priority review',
        state: 'done',
        signifier: 'priority',
        logDate: todayStr,
        createdAt: now - 3600000 * 4,
        updatedAt: now - 3600000 * 3,
      },
      {
        id: 'sample-2',
        type: 'event',
        text: 'Quarterly team sync on product roadmap',
        signifier: 'none',
        logDate: todayStr,
        createdAt: now - 3600000 * 3,
        updatedAt: now - 3600000 * 3,
      },
      {
        id: 'sample-3',
        type: 'note',
        text: 'Focus on quality over volume; subtraction creates mental clarity',
        signifier: 'inspiration',
        logDate: todayStr,
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2,
      },
      {
        id: 'sample-4',
        type: 'task',
        text: 'Draft summary of architectural decisions for v1',
        state: 'open',
        signifier: 'priority',
        logDate: todayStr,
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
      },
      {
        id: 'sample-5',
        type: 'task',
        text: 'Order archival ink pens and dotted A5 notebook refill',
        state: 'open',
        signifier: 'none',
        logDate: todayStr,
        createdAt: now - 1800000,
        updatedAt: now - 1800000,
      },

      // Yesterday's log with migration example
      {
        id: 'sample-y1',
        type: 'task',
        text: 'Review client feedback on prototype navigation',
        state: 'migrated',
        signifier: 'none',
        logDate: yesterdayStr,
        createdAt: now - 86400000 - 3600000,
        updatedAt: now - 86400000,
      },
      {
        id: 'sample-y2',
        type: 'task',
        text: 'Cancel unused software trial before billing renewal',
        state: 'done',
        signifier: 'none',
        logDate: yesterdayStr,
        createdAt: now - 86400000 - 7200000,
        updatedAt: now - 86400000 - 1800000,
      },
      {
        id: 'sample-y3',
        type: 'task',
        text: 'Browse low-priority design newsletters',
        state: 'struck',
        signifier: 'none',
        logDate: yesterdayStr,
        createdAt: now - 86400000 - 9000000,
        updatedAt: now - 86400000 - 5400000,
      },

      // Future log entries (Scheduled '<')
      {
        id: 'sample-f1',
        type: 'event',
        text: 'Annual design conference & workshop',
        signifier: 'inspiration',
        logDate: todayStr,
        target: nextMonthStr,
        state: 'scheduled',
        createdAt: now - 120000,
        updatedAt: now - 120000,
      },
      {
        id: 'sample-f2',
        type: 'task',
        text: 'File tax return with accountant',
        signifier: 'priority',
        logDate: todayStr,
        target: twoMonthsStr,
        state: 'scheduled',
        createdAt: now - 60000,
        updatedAt: now - 60000,
      },

      // Inbox fleeting capture
      {
        id: 'sample-inbox-1',
        type: 'note',
        text: 'Look into Cal Newport book: "Slow Productivity"',
        signifier: 'none',
        logDate: todayStr,
        target: 'inbox',
        collection: 'inbox',
        createdAt: now - 30000,
        updatedAt: now - 30000,
      },
      {
        id: 'sample-inbox-2',
        type: 'task',
        text: 'Research ergonomic mechanical split keyboard layout',
        signifier: 'none',
        state: 'open',
        logDate: todayStr,
        target: 'inbox',
        collection: 'inbox',
        createdAt: now - 15000,
        updatedAt: now - 15000,
      },

      // Collection entry
      {
        id: 'sample-col-1',
        type: 'note',
        text: 'The Bullet Journal Method – Ryder Carroll (Read Chapters 1–4)',
        signifier: 'priority',
        logDate: todayStr,
        collection: 'reading-list',
        createdAt: now - 5000,
        updatedAt: now - 5000,
      },
    ];

    await db.entries.bulkAdd(sampleEntries);
  });
}

/**
 * Wipe all entries and reset to default collections
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.entries, db.collections, async () => {
    await db.entries.clear();
    await db.collections.clear();
    await initDatabaseDefaults();
  });
}
