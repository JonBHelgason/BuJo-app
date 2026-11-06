export type EntryType = 'task' | 'event' | 'note';

export type TaskState = 'open' | 'done' | 'struck' | 'migrated' | 'scheduled';

export type Signifier = 'none' | 'priority' | 'inspiration';

export type TargetType = 'inbox' | string; // 'inbox', 'YYYY-MM-DD', 'YYYY-MM', or 'YYYY'

export interface Entry {
  id: string; // crypto.randomUUID()
  type: EntryType;
  text: string;
  state?: TaskState; // Only applies to 'task'
  signifier: Signifier;
  logDate: string; // ISO date 'YYYY-MM-DD'
  target?: TargetType; // Empty/undefined defaults to logDate
  origin?: string; // id of the parent entry if migrated
  collection?: string | null; // collectionId or null
  createdAt: number; // Unix timestamp for stable sorting
  updatedAt: number;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  isPinned?: boolean; // For 'Inbox'
  createdAt: number;
  order: number;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  entries: Entry[];
  collections: Collection[];
}

export type ViewMode = 'today' | 'month' | 'future' | 'collections' | 'search' | 'review';
