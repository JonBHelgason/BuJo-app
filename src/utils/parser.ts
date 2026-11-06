import type { EntryType, Signifier, TaskState } from '../types/entry';

export interface ParsedInput {
  type: EntryType;
  signifier: Signifier;
  text: string;
  initialState?: TaskState;
}

/**
 * Fast capture parser based on BuJón specification:
 * Prefixes:
 * '.' or none -> Task ('•')
 * 'o ' or 'O ' -> Event ('○')
 * '- '         -> Note ('—')
 * '* '         -> Priority Signifier ('*')
 * '! '         -> Inspiration Signifier ('!')
 */
export function parseRawInput(raw: string): ParsedInput {
  let str = raw.trim();
  let signifier: Signifier = 'none';

  // 1. Detect and strip leading signifiers (* or !)
  if (str.startsWith('* ')) {
    signifier = 'priority';
    str = str.slice(2).trim();
  } else if (str.startsWith('! ')) {
    signifier = 'inspiration';
    str = str.slice(2).trim();
  }

  // 2. Detect entry type prefix
  if (str.startsWith('o ') || str.startsWith('O ') || str.startsWith('0 ')) {
    return {
      type: 'event',
      signifier,
      text: str.slice(2).trim(),
    };
  }

  if (str.startsWith('- ')) {
    return {
      type: 'note',
      signifier,
      text: str.slice(2).trim(),
    };
  }

  if (str.startsWith('. ')) {
    str = str.slice(2).trim();
  }

  // Default: task
  return {
    type: 'task',
    signifier,
    text: str,
    initialState: 'open',
  };
}

/**
 * Format bullet symbol glyphs based on entry type, task state, and signifiers
 */
export function getBulletGlyph(
  type: EntryType,
  state?: TaskState,
  signifier?: Signifier
): { symbol: string; label: string; className: string } {
  const isPriority = signifier === 'priority';
  const isInspiration = signifier === 'inspiration';

  if (type === 'event') {
    return {
      symbol: isPriority ? '* ○' : isInspiration ? '! ○' : '○',
      label: 'Event',
      className: 'text-stone-700 dark:text-stone-300 font-mono',
    };
  }

  if (type === 'note') {
    return {
      symbol: isPriority ? '* —' : isInspiration ? '! —' : '—',
      label: 'Note',
      className: 'text-stone-600 dark:text-stone-400 font-mono font-bold',
    };
  }

  // Task states
  switch (state) {
    case 'done':
      return {
        symbol: '✕',
        label: 'Completed Task',
        className: 'text-stone-900 dark:text-stone-100 font-mono font-bold',
      };
    case 'struck':
      return {
        symbol: '—',
        label: 'Irrelevant / Struck',
        className: 'text-stone-400 dark:text-stone-600 font-mono line-through',
      };
    case 'migrated':
      return {
        symbol: '>',
        label: 'Migrated Task',
        className: 'text-amber-700 dark:text-amber-400 font-mono font-bold',
      };
    case 'scheduled':
      return {
        symbol: '<',
        label: 'Scheduled Task (Future Log)',
        className: 'text-sky-700 dark:text-sky-400 font-mono font-bold',
      };
    case 'open':
    default:
      return {
        symbol: isPriority ? '* •' : isInspiration ? '! •' : '•',
        label: isPriority ? 'Priority Task' : isInspiration ? 'Inspiration Task' : 'Open Task',
        className: isPriority
          ? 'text-stone-900 dark:text-stone-100 font-mono font-bold'
          : 'text-stone-800 dark:text-stone-200 font-mono font-bold text-base',
      };
  }
}
