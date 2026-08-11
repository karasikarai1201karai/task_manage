'use client';

import { CheckSquare, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppTab = 'today' | 'log';

interface MobileTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  todoCount?: number;
}

export function MobileTabBar({ activeTab, onTabChange, todoCount = 0 }: MobileTabBarProps) {
  return (
    <nav
      className="flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={() => onTabChange('today')}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-1 min-h-[60px] py-2.5 text-xs transition-colors relative active:bg-gray-100 dark:active:bg-gray-800',
          activeTab === 'today' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400',
        )}
      >
        <span className="relative">
          <CheckSquare className="w-6 h-6" />
          {todoCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-0.5 leading-none">
              {todoCount > 99 ? '99+' : todoCount}
            </span>
          )}
        </span>
        今日
      </button>
      <button
        onClick={() => onTabChange('log')}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-1 min-h-[60px] py-2.5 text-xs transition-colors active:bg-gray-100 dark:active:bg-gray-800',
          activeTab === 'log' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400',
        )}
      >
        <BookOpen className="w-6 h-6" />
        ログ
      </button>
    </nav>
  );
}
