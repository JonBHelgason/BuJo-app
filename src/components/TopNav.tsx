import React from 'react';
import type { ViewMode } from '../types/entry';
import { Sun, Moon, RotateCcw, CheckSquare, Download } from 'lucide-react';

interface TopNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  canUndo: boolean;
  undoCount: number;
  onUndo: () => void;
  onOpenTestModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  onInstall?: () => void;
  onShowIOSGuide?: () => void;
}

export function TopNav({
  currentView,
  onSelectView,
  canUndo,
  undoCount,
  onUndo,
  onOpenTestModal,
  isDarkMode,
  onToggleDarkMode,
  isInstallable = false,
  isInstalled = false,
  isIOS = false,
  onInstall,
  onShowIOSGuide,
}: TopNavProps) {
  const navItems: { id: ViewMode; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'month', label: 'Month' },
    { id: 'future', label: 'Future' },
    { id: 'collections', label: 'Collections' },
    { id: 'search', label: 'Index' },
  ];

  return (
    <header className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <button
        type="button"
        onClick={() => onSelectView('today')}
        className="font-serif-title text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
      >
        BuJón
      </button>

      {/* Zone 2: 4-5 concise single-line text navigation links (Hidden on mobile phones, powered by bottom tab bar) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`rounded-md transition-colors whitespace-nowrap shrink-0 relative ${
                isActive
                  ? 'text-stone-950 dark:text-white font-semibold'
                  : 'hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-stone-900 dark:bg-stone-100 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* PWA Install Trigger Button */}
        {isInstallable && onInstall && !isInstalled && (
          <button
            onClick={onInstall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            title="Install BuJón to Home Screen"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {isIOS && !isInstalled && onShowIOSGuide && (
          <button
            onClick={onShowIOSGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 transition-colors"
            title="Install instructions for iOS Safari"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {canUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium transition-colors"
            title={`Undo last action (Ctrl+Z) - ${undoCount} left in stack`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
        )}

        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={isDarkMode ? 'Switch to Paper Light' : 'Switch to Ink Dark'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenTestModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors whitespace-nowrap shadow-xs"
          title="Open BuJón Testing Suite & Guide"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Test &amp; Guide</span>
          <span className="md:hidden">Test</span>
        </button>
      </div>
    </header>
  );
}
