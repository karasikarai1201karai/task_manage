'use client';

import { format, addDays, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { today } from '@/lib/utils/time';
import type { DateString } from '@/types';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const currentDate    = useStore(s => s.currentDate);
  const setCurrentDate = useStore(s => s.setCurrentDate);

  const date    = parseISO(currentDate);
  const isToday = currentDate === today();

  const goTo = (d: Date) =>
    setCurrentDate(format(d, 'yyyy-MM-dd') as DateString);

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <button
        onClick={() => goTo(subDays(date, 1))}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="前日"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold">
          {format(date, 'M月d日(EEE)', { locale: ja })}
        </h1>
        {!isToday && (
          <button
            onClick={() => goTo(new Date())}
            className="text-xs px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
          >
            今日
          </button>
        )}
      </div>

      <button
        onClick={onSettingsClick}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="設定"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}
