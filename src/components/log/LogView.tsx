'use client';

import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { today } from '@/lib/utils/time';
import type { DateString } from '@/types';

const LOG_DAYS = 30;
const MILESTONES = [3, 7, 14, 30, 50, 100];

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

  // 直近7日間の達成状況（左が6日前、右端が今日）
  const weekDays = useMemo(() => {
    const t = parseISO(today());
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(t, 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      return {
        key,
        label: format(d, 'EEEEE', { locale: ja }),
        done: (completedByDate[key]?.length ?? 0) > 0,
        isToday: i === 6,
      };
    });
  }, [completedByDate]);

  // 累計・今日・最長ストリーク
  const stats = useMemo(() => {
    const totalCount = Object.values(completedByDate).reduce((sum, arr) => sum + arr.length, 0);
    const todayCount = completedByDate[today()]?.length ?? 0;

    const dates = Object.keys(completedByDate).sort();
    let longest = 0;
    let run = 0;
    let prev: string | null = null;
    dates.forEach(d => {
      run = prev && format(subDays(parseISO(d), 1), 'yyyy-MM-dd') === prev ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    });
    return { totalCount, todayCount, longest };
  }, [completedByDate]);

  // 次のマイルストーンへの進捗
  const nextMilestone = MILESTONES.find(m => m > streak);
  const prevMilestone = MILESTONES.filter(m => m <= streak).pop() ?? 0;
  const milestoneProgress = nextMilestone
    ? (streak - prevMilestone) / (nextMilestone - prevMilestone)
    : 1;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {/* ストリークヒーロー */}
      <div className="px-4 pt-6 pb-5 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/25 dark:to-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <div className="text-6xl leading-none">{streak > 0 ? '🔥' : stats.longest > 0 ? '💪' : '🌱'}</div>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{streak}</span>
            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">日連続</span>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {streak === 0
              ? stats.longest > 0
                ? `最長${stats.longest}日の記録はちゃんと残ってる。今日1件で再スタート！`
                : '今日タスクを1つ完了してストリークを始めよう！'
              : stats.todayCount > 0
                ? '今日も達成！この調子！🎉'
                : '今日1つ完了してストリークをつなごう'}
          </p>
        </div>

        {/* 直近7日間ドット */}
        <div className="flex justify-center gap-2 mt-4">
          {weekDays.map(d => (
            <div key={d.key} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  d.done
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600',
                  d.isToday && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
                )}
              >
                {d.done ? <Check className="w-4 h-4" strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
              </div>
              <span className={cn('text-[10px]', d.isToday ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600')}>
                {d.label}
              </span>
            </div>
          ))}
        </div>

        {/* マイルストーン進捗 */}
        {nextMilestone && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">🏆 次の目標: {nextMilestone}日連続</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">あと{nextMilestone - streak}日</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.max(milestoneProgress * 100, streak > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* 実績タイル */}
        <div className="grid grid-cols-3 gap-2 mt-4 max-w-xs mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl px-2 py-2.5 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{stats.todayCount}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">今日の完了</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl px-2 py-2.5 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{stats.totalCount}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">累計完了</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl px-2 py-2.5 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{stats.longest}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">最長記録(日)</div>
          </div>
        </div>
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
