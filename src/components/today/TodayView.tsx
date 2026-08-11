'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, ChevronDown, Check, Trash2, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP, PRIORITY_RANK } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { today } from '@/lib/utils/time';
import { getTemplateStreak } from '@/lib/utils/recurring';
import { loadRecurringTemplates } from '@/lib/utils/recurringStorage';
import { TodayTaskCard } from './TodayTaskCard';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import type { Task } from '@/types';

function CompletedTaskRow({ task, streak = 0 }: { task: Task; streak?: number }) {
  const uncompleteTask = useStore(s => s.uncompleteTask);
  const deleteTask     = useStore(s => s.deleteTask);
  return (
    <div className={cn('group flex items-center gap-2 px-2 py-1 rounded-lg border opacity-60', TASK_COLOR_MAP[task.color])}>
      <button
        onClick={() => uncompleteTask(task.id)}
        className="shrink-0 min-w-[36px] min-h-[36px] -ml-1 flex items-center justify-center"
        aria-label="未完了に戻す"
      >
        <span className="w-4 h-4 rounded border-2 border-current bg-current flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </span>
      </button>
      <p className="flex-1 min-w-0 text-xs line-through truncate">{task.title}</p>
      {streak > 0 && (
        <span
          className="text-[10px] font-bold text-orange-500 dark:text-orange-400 shrink-0 no-underline"
          title={`${streak}回連続で達成中！`}
        >
          🔥{streak}
        </span>
      )}
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-40 group-hover:opacity-100 min-w-[36px] min-h-[36px] -mr-1 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function DeferredTaskRow({ task }: { task: Task }) {
  const updateTask = useStore(s => s.updateTask);
  const deleteTask  = useStore(s => s.deleteTask);
  return (
    <div className={cn('group flex items-center gap-2 px-2 py-1 rounded-lg border opacity-70', TASK_COLOR_MAP[task.color])}>
      <p className="flex-1 min-w-0 text-xs truncate">{task.title}</p>
      <button
        onClick={() => updateTask(task.id, { isDeferred: false, deferredAt: undefined })}
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="戻す"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-40 group-hover:opacity-100 min-w-[36px] min-h-[36px] -mr-1 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

/** 合計がこの分数を超えたら「積みすぎ」のサインとして色を変える */
const OVERLOAD_MINUTES = 240;

function SectionHeader({ label, count, totalMinutes }: { label: string; count?: number; totalMinutes?: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 px-1">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
      {totalMinutes !== undefined && totalMinutes > 0 && (
        <span className={cn(
          'text-xs',
          totalMinutes > OVERLOAD_MINUTES
            ? 'text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-gray-400 dark:text-gray-600',
        )}>
          合計{formatMinutes(totalMinutes)}
        </span>
      )}
      <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
    </div>
  );
}

const PRAISE_MESSAGES = ['ナイス！', 'いい調子！', 'その調子！', '絶好調！', 'よくやった！', 'すごい！'];

interface TodayViewProps {
  highlightTaskId?: string | null;
}

export function TodayView({ highlightTaskId }: TodayViewProps) {
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeferred,  setShowDeferred]  = useState(false);
  const [quickTitle,    setQuickTitle]    = useState('');
  const [praise,        setPraise]        = useState<string | null>(null);
  const praiseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 完了直後に「今日N件目」の称賛トーストを表示（即時報酬）
  const handleCompleted = useCallback(() => {
    const todayStr = today();
    const count = useStore.getState().tasks
      .filter(t => t.status === 'completed' && t.completedAt?.slice(0, 10) === todayStr).length;
    const msg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
    setPraise(`今日${count}件目！ ${msg}`);
    if (praiseTimer.current) clearTimeout(praiseTimer.current);
    praiseTimer.current = setTimeout(() => setPraise(null), 2200);
  }, []);

  const tasks   = useStore(s => s.tasks);
  const config  = useStore(s => s.config);
  const addTask = useStore(s => s.addTask);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    addTask({ id: crypto.randomUUID(), title, estimatedMinutes: config.defaultTaskDuration, color: 'blue', status: 'pending', priority: 'medium', tags: [] });
    setQuickTitle('');
  };

  const sort = (arr: Task[]) =>
    arr.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.estimatedMinutes - b.estimatedMinutes);

  const activeTasks = tasks.filter(t => t.status !== 'completed' && !t.isDeferred);
  const dailyTasks  = sort(activeTasks.filter(t => !!t.recurringTemplateId));
  const todoTasks   = sort(activeTasks.filter(t => !t.recurringTemplateId));

  // 定期タスクごとの連続達成数（テンプレートIDごとに計算）
  const streakByTemplate = useMemo(() => {
    const templates = loadRecurringTemplates();
    const map: Record<string, number> = {};
    templates.forEach(tpl => {
      map[tpl.id] = getTemplateStreak(tpl.id, tasks, tpl.recurrenceType, today());
    });
    return map;
  }, [tasks]);

  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  // 完了日ごとにグループ化（新しい日付が先頭）
  const completedGroups: { date: string; tasks: Task[] }[] = [];
  completedTasks.forEach(t => {
    const date = t.completedAt?.slice(0, 10) ?? '';
    const last = completedGroups[completedGroups.length - 1];
    if (last && last.date === date) last.tasks.push(t);
    else completedGroups.push({ date, tasks: [t] });
  });

  const formatDateLabel = (date: string) => {
    if (!date) return '日付不明';
    if (date === today()) return '今日';
    return format(parseISO(date), 'M月d日(EEE)', { locale: ja });
  };

  const deferredTasks = tasks.filter(t => t.isDeferred && t.status !== 'completed');
  // 1週間以上眠っている保留タスク（墓場化のサイン）
  const staleDeferredCount = deferredTasks.filter(
    t => t.deferredAt && Date.now() - new Date(t.deferredAt).getTime() > 7 * 24 * 60 * 60 * 1000,
  ).length;

  const dailyTotalMin = dailyTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const todoTotalMin  = todoTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* クイック追加バー */}
      <form
        onSubmit={handleQuickAdd}
        className="flex gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder="タスクを入力してEnter..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          詳細
        </button>
      </form>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* 日次タスク */}
        {dailyTasks.length > 0 && (
          <section>
            <SectionHeader label="日次タスク" count={dailyTasks.length} totalMinutes={dailyTotalMin} />
            <div className="space-y-1.5">
              {dailyTasks.map(task => (
                <TodayTaskCard
                  key={task.id}
                  task={task}
                  isHighlighted={task.id === highlightTaskId}
                  streak={task.recurringTemplateId ? streakByTemplate[task.recurringTemplateId] ?? 0 : 0}
                  onCompleted={handleCompleted}
                />
              ))}
            </div>
          </section>
        )}

        {/* やること */}
        <section>
          <SectionHeader label="やること" count={todoTasks.length} totalMinutes={todoTotalMin} />
          {todoTasks.length === 0 && dailyTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-gray-400 dark:text-gray-600 gap-1">
              <Check className="w-7 h-7 opacity-30" strokeWidth={1.5} />
              <p className="text-xs">タスクがありません</p>
            </div>
          ) : todoTasks.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-600 px-1 py-2">すべて完了！</p>
          ) : (
            <div className="space-y-1.5">
              {todoTasks.map(task => (
                <TodayTaskCard key={task.id} task={task} isHighlighted={task.id === highlightTaskId} onCompleted={handleCompleted} />
              ))}
            </div>
          )}
        </section>

        {/* 完了済み */}
        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-1 w-full px-1 py-1 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showCompleted && 'rotate-180')} />
              完了済み ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="space-y-3 mt-1">
                {completedGroups.map(group => (
                  <div key={group.date || 'unknown'}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className={cn(
                        'text-xs font-semibold',
                        group.date === today() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400',
                      )}>
                        {formatDateLabel(group.date)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{group.tasks.length}件</span>
                      <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
                    </div>
                    <div className="space-y-1.5">
                      {group.tasks.map(task => (
                        <CompletedTaskRow
                          key={task.id}
                          task={task}
                          streak={task.recurringTemplateId ? streakByTemplate[task.recurringTemplateId] ?? 0 : 0}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 保留中 */}
        {deferredTasks.length > 0 && (
          <section>
            <button
              onClick={() => setShowDeferred(v => !v)}
              className="flex items-center gap-1 w-full px-1 py-1 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showDeferred && 'rotate-180')} />
              保留中 ({deferredTasks.length})
              {staleDeferredCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">
                  ・{staleDeferredCount}件が1週間以上眠っています
                </span>
              )}
            </button>
            {showDeferred && (
              <div className="space-y-1.5 mt-1">
                {deferredTasks.map(task => <DeferredTaskRow key={task.id} task={task} />)}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 完了トースト */}
      {praise && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-green-600 text-white text-sm font-medium rounded-full px-4 py-2 shadow-lg animate-in slide-in-from-bottom fade-in duration-200 whitespace-nowrap pointer-events-none"
        >
          🎉 {praise}
        </div>
      )}

      <TaskFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
