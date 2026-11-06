import React from 'react';
import type { ViewMode } from '../types/entry';
import { Calendar, CalendarDays, Clock, Folder, Search } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
}

export function MobileBottomNav({ currentView, onSelectView }: MobileBottomNavProps) {
  const tabs: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'month', label: 'Month', icon: CalendarDays },
    { id: 'future', label: 'Future', icon: Clock },
    { id: 'collections', label: 'Lists', icon: Folder },
    { id: 'search', label: 'Index', icon: Search },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800/80 md:hidden pb-safe shadow-lg"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-stone-950 dark:text-stone-50 font-bold'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500"
                  />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
