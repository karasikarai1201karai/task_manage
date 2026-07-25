'use client';

import { format, addDays, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Settings, Zap } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { today, timeToMinutes } from '@/lib/utils/time';
import type { DateString, TimeString } from '@/types';

interface HeaderProps {
  onSettingsClick: () => void;
  onNowClick: () => void;
}

export function Header({ onSettingsClick, onNowClick }: HeaderProps) {
  const currentDate    = useStore(s => s.currentDate);
  const setCurrentDate = useStore(s => s.setCurrentDate);
  const tasks           = useStore(s => s.tasks);
  const dayPlans        = useStore(s => s.dayPlans);

  const date    = parseISO(currentDate);
  const isToday = currentDate === today();

  const goTo = (d: Date) =>
    setCurrentDate(format(d, 'yyyy-MM-dd') as DateString);

  const todaySlots = dayPlans[currentDate]?.slots ?? [];
  // 進捗の分母は「開始時刻を過ぎたタスク」のみに絞る（未来のタスクまで含めると常に低い数値になり続けるため）
  const nowMinutes = timeToMinutes(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` as TimeString,
  );
  const eligibleSlots = isToday
    ? todaySlots.filter(slot => timeToMinutes(slot.startTime) <= nowMinutes)
    : todaySlots;
  const totalCount = eligibleSlots.length;
  const completedCount = eligibleSlots.filter(slot => {
    const task = tasks.find(t => t.id === slot.taskId);
    return task?.status === 'completed';
  }).length;

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goTo(subDays(date, 1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
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
              className="text-xs px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:active:bg-blue-800"
            >
              今日
            </button>
          )}
          {totalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => goTo(addDays(date, 1))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
          aria-label="翌日"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
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
