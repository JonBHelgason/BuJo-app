import React, { useState, useEffect, useCallback } from 'react';
import type { ViewMode, Entry } from './types/entry';
import { db, initDatabaseDefaults } from './db';
import { ensurePersistentStorage, seedSampleData } from './db/storage';
import { useUndoStack } from './hooks/useUndoStack';
import { TopNav } from './components/TopNav';
import { DailyLog } from './views/DailyLog';
import { MonthlyLog } from './views/MonthlyLog';
import { FutureLog } from './views/FutureLog';
import { CollectionsView } from './views/CollectionsView';
import { SearchView } from './views/SearchView';
import { MonthlyReview } from './views/MonthlyReview';
import { TestVerificationModal } from './components/TestVerificationModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [reviewMonth, setReviewMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('bujon_theme') === 'dark' ||
        (!localStorage.getItem('bujon_theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  const { pushUndo, undo, canUndo, undoCount, lastUndoneText } = useUndoStack();

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bujon_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bujon_theme', 'light');
    }
  }, [isDarkMode]);

  // Initial database bootstrapping & auto-seed if first launch
  useEffect(() => {
    const bootstrap = async () => {
      await initDatabaseDefaults();
      await ensurePersistentStorage();

      // Check if entries table is completely empty on first launch
      const count = await db.entries.count();
      if (count === 0) {
        await seedSampleData();
        setRefreshKey((k) => k + 1);
      }
    };
    bootstrap();
  }, []);

  // Global key bindings: Ctrl+Z for undo
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          undo().then(() => setRefreshKey((k) => k + 1));
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [undo]);

  const handleStateChange = useCallback(
    (prev: Entry, actionDesc: string) => {
      pushUndo(prev, actionDesc);
    },
    [pushUndo]
  );

  const handleStartReview = useCallback((monthStr: string) => {
    setReviewMonth(monthStr);
    setCurrentView('review');
  }, []);

  const handleDataChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors selection:bg-stone-200 dark:selection:bg-stone-800">
      {/* Top Navigation conforming to Top Bar Contract */}
      <TopNav
        currentView={currentView}
        onSelectView={setCurrentView}
        canUndo={canUndo}
        undoCount={undoCount}
        onUndo={() => undo().then(() => setRefreshKey((k) => k + 1))}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Undo Notification Pill */}
      {lastUndoneText && (
        <div className="fixed top-16 right-6 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-xs px-3 py-1.5 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 font-mono">
          Restored: {lastUndoneText}
        </div>
      )}

      {/* Main Workspace Canvas (Centered peaceful notebook container with responsive width) */}
      <div className="flex-1 flex justify-center w-full">
        <main
          key={refreshKey}
          className="w-full max-w-4xl bg-stone-50 dark:bg-stone-900/60 min-h-[calc(100vh-56px)] border-x border-stone-200/80 dark:border-stone-800/80 flex flex-col shadow-xs"
        >
          {currentView === 'today' && (
            <DailyLog
              onStateChange={handleStateChange}
              onRequestReview={handleStartReview}
            />
          )}

          {currentView === 'month' && (
            <MonthlyLog
              onStateChange={handleStateChange}
              onStartReview={handleStartReview}
            />
          )}

          {currentView === 'future' && (
            <FutureLog
              onStateChange={handleStateChange}
              onNavigateToMonth={(m) => {
                setReviewMonth(m);
                setCurrentView('month');
              }}
            />
          )}

          {currentView === 'collections' && (
            <CollectionsView onStateChange={handleStateChange} />
          )}

          {currentView === 'search' && (
            <SearchView
              onStateChange={handleStateChange}
              onNavigateToDate={() => setCurrentView('today')}
            />
          )}

          {currentView === 'review' && (
            <MonthlyReview
              closingMonth={reviewMonth}
              onComplete={() => setCurrentView('month')}
              onStateChange={handleStateChange}
            />
          )}
        </main>
      </div>

      {/* Interactive Testing & Verification Modal */}
      <TestVerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onDataChanged={handleDataChanged}
      />
    </div>
  );
}
