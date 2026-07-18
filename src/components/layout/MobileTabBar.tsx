'use client';

import { Inbox, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTabBarProps {
  activeTab: 'inbox' | 'timeline';
  onTabChange: (tab: 'inbox' | 'timeline') => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      className="md:hidden flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {(['inbox', 'timeline'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
            activeTab === tab
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
        >
          {tab === 'inbox' ? <Inbox className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
          {tab === 'inbox' ? 'インボックス' : 'タイムライン'}
        </button>
      ))}
    </nav>
  );
}
