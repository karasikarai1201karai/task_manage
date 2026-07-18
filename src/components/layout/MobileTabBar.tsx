'use client';

import { Inbox, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTabBarProps {
  activeTab: 'inbox' | 'timeline';
  onTabChange: (tab: 'inbox' | 'timeline') => void;
  inboxCount?: number;
}

export function MobileTabBar({ activeTab, onTabChange, inboxCount = 0 }: MobileTabBarProps) {
  return (
    <nav
      className="md:hidden flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={() => onTabChange('inbox')}
        className={cn(
          'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors relative',
          activeTab === 'inbox'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400',
        )}
      >
        <span className="relative">
          <Inbox className="w-5 h-5" />
          {inboxCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-0.5 leading-none">
              {inboxCount > 99 ? '99+' : inboxCount}
            </span>
          )}
        </span>
        インボックス
      </button>
      <button
        onClick={() => onTabChange('timeline')}
        className={cn(
          'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
          activeTab === 'timeline'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400',
        )}
      >
        <Calendar className="w-5 h-5" />
        タイムライン
      </button>
    </nav>
  );
}
