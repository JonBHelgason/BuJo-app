import Dexie, { type Table } from 'dexie';
import type { Entry, Collection } from '../types/entry';

export class BuJonDatabase extends Dexie {
  entries!: Table<Entry, string>;
  collections!: Table<Collection, string>;

  constructor() {
    super('bujon_db');

    // Schema indexing based on spec:
    // logDate: for Daily & Monthly Log views
    // target: for Future Log and Inbox sorting
    // collection: for Collection / Lists view
    // state: for filtering open tasks during Monthly Review
    // type: for quick filtering
    // createdAt: for chronological ordering
    this.version(1).stores({
      entries: 'id, logDate, target, collection, state, type, order, createdAt',
      collections: 'id, order, createdAt',
    });
  }
}

export const db = new BuJonDatabase();

/**
 * Initialize default collections if empty (e.g. Inbox, Books, Projects)
 */
export async function initDatabaseDefaults(): Promise<void> {
  const count = await db.collections.count();
  if (count === 0) {
    const now = Date.now();
    await db.collections.bulkAdd([
      {
        id: 'inbox',
        title: 'Inbox',
        description: 'Fleeting thoughts and unassigned captures waiting to be triaged.',
        isPinned: true,
        order: 0,
        createdAt: now,
      },
      {
        id: 'reading-list',
        title: 'Books & Reading',
        description: 'Books recommended, in-progress, and reference notes.',
        isPinned: false,
        order: 1,
        createdAt: now + 1,
      },
      {
        id: 'project-ideas',
        title: 'Project Ideas',
        description: 'Incubating concepts, creative initiatives, and explorations.',
        isPinned: false,
        order: 2,
        createdAt: now + 2,
      },
    ]);
  }
}
