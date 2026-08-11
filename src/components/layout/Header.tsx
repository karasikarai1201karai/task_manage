'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Settings, Zap } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { today } from '@/lib/utils/time';

interface HeaderProps {
  onSettingsClick: () => void;
  onNowClick: () => void;
}

export function Header({ onSettingsClick, onNowClick }: HeaderProps) {
  const tasks = useStore(s => s.tasks);

  const todayStr       = today();
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt?.slice(0, 10) === todayStr).length;
  const activeCount    = tasks.filter(t => t.status !== 'completed' && !t.isDeferred).length;
  const total          = completedToday + activeCount;

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {format(new Date(), 'M月d日(EEE)', { locale: ja })}
        </h1>
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedToday / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {completedToday}/{total}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onNowClick}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          今すぐ
        </button>
        <button
          onClick={onSettingsClick}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
          aria-label="設定"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
