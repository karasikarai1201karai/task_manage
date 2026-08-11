'use client';

import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useStore } from '@/store/appStore';
import { today } from '@/lib/utils/time';
import type { DateString } from '@/types';

const LOG_DAYS = 30;

export function LogView() {
  const tasks = useStore(s => s.tasks);

  const completedByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .forEach(t => {
        const date = t.completedAt!.slice(0, 10);
        if (!map[date]) map[date] = [];
        map[date].push(t);
      });
    return map;
  }, [tasks]);

  const streak = useMemo(() => {
    let count = 0;
    let checkDate = today();
    while (completedByDate[checkDate]?.length > 0) {
      count++;
      const prev = subDays(parseISO(checkDate), 1);
      checkDate = format(prev, 'yyyy-MM-dd') as DateString;
    }
    return count;
  }, [completedByDate]);

  const recentDays = useMemo(() => {
    const todayStr = today();
    return Array.from({ length: LOG_DAYS }, (_, i) =>
      format(subDays(parseISO(todayStr), i), 'yyyy-MM-dd') as DateString
    ).filter(date => (completedByDate[date]?.length ?? 0) > 0);
  }, [completedByDate]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {/* ストリーク */}
      <div className="px-4 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-center">
        <div className="text-5xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {streak > 0 ? '🔥' : '⭐'} {streak}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {streak === 0
            ? 'タスクを完了してストリークを始めよう'
            : `日連続達成中`}
        </p>
        {streak > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
            今日も続けよう！
          </p>
        )}
      </div>

      {/* 日別ログ */}
      <div className="flex-1 p-3 space-y-4">
        {recentDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600 gap-2">
            <p className="text-sm">完了したタスクはまだありません</p>
            <p className="text-xs">タスクを完了するとここに記録されます</p>
          </div>
        ) : (
          recentDays.map(date => {
            const dayTasks = completedByDate[date] ?? [];
            const isToday = date === today();
            const label = isToday
              ? '今日'
              : format(parseISO(date), 'M月d日(EEE)', { locale: ja });

            return (
              <section key={date}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className={cn('text-xs font-semibold', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {dayTasks.length}件完了
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
                </div>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500 shrink-0 flex items-center justify-center">
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{task.title}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">{task.estimatedMinutes}分</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
