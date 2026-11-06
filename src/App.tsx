import React, { useState, useEffect, useCallback } from 'react';
import type { ViewMode, Entry } from './types/entry';
import { db, initDatabaseDefaults } from './db';
import { ensurePersistentStorage, seedSampleData } from './db/storage';
import { useUndoStack } from './hooks/useUndoStack';
import { usePWAInstall } from './hooks/usePWAInstall';
import { TopNav } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DailyLog } from './views/DailyLog';
import { MonthlyLog } from './views/MonthlyLog';
import { FutureLog } from './views/FutureLog';
import { CollectionsView } from './views/CollectionsView';
import { SearchView } from './views/SearchView';
import { MonthlyReview } from './views/MonthlyReview';
import { TestVerificationModal } from './components/TestVerificationModal';
import { Share, PlusSquare, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('today');
  const [reviewMonth, setReviewMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

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
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={install}
        onShowIOSGuide={() => setShowIOSModal(true)}
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

      {/* Mobile Bottom Thumb Navigation Bar (< 768px viewports) */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
      />

      {/* iOS Safari Home Screen Installation Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-5 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-serif-title font-bold text-stone-900 dark:text-stone-100">
                  Add BuJón to Home Screen
                </h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  Install as a standalone iOS web app
                </p>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-stone-700 dark:text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-600 dark:text-stone-400 shrink-0">
                  1
                </span>
                <span className="flex-1">
                  In Safari, tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-sky-600" /> at the bottom of your screen.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-600 dark:text-stone-400 shrink-0">
                  2
                </span>
                <span className="flex-1">
                  Scroll down the menu and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-amber-600" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-600 dark:text-stone-400 shrink-0">
                  3
                </span>
                <span className="flex-1">
                  Tap <strong>Add</strong> in the top-right corner. BuJón will launch full-screen from your home screen.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Interactive Testing & Verification Modal */}
      <TestVerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onDataChanged={handleDataChanged}
      />
    </div>
  );
}
