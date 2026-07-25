'use client';

import { useState } from 'react';
import { Plus, ChevronDown, Check, Trash2, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP, PRIORITY_RANK } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { InboxTaskCard } from './InboxTaskCard';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import type { Task } from '@/types';

function CompletedTaskRow({ task }: { task: Task }) {
  const uncompleteTask = useStore(s => s.uncompleteTask);
  const deleteTask     = useStore(s => s.deleteTask);
  const colorClass     = TASK_COLOR_MAP[task.color];

  return (
    <div className={cn('group flex items-center gap-2 p-2 rounded-lg border opacity-60', colorClass)}>
      <button
        onClick={() => uncompleteTask(task.id)}
        className="w-4 h-4 shrink-0 rounded border-2 border-current bg-current flex items-center justify-center"
        aria-label="未完了に戻す"
      >
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
      </button>
      <p className="flex-1 min-w-0 text-xs line-through truncate">{task.title}</p>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DeferredTaskRow({ task }: { task: Task }) {
  const updateTask = useStore(s => s.updateTask);
  const deleteTask  = useStore(s => s.deleteTask);
  const colorClass  = TASK_COLOR_MAP[task.color];

  return (
    <div className={cn('group flex items-center gap-2 p-2 rounded-lg border opacity-70', colorClass)}>
      <p className="flex-1 min-w-0 text-xs truncate">{task.title}</p>
      <button
        onClick={() => updateTask(task.id, { isDeferred: false })}
        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="インボックスに戻す"
        title="インボックスに戻す"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function InboxPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const tasks       = useStore(s => s.tasks);
  const dayPlans    = useStore(s => s.dayPlans);
  const currentDate = useStore(s => s.currentDate);
  const config      = useStore(s => s.config);
  const addTask     = useStore(s => s.addTask);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    addTask({
      id: crypto.randomUUID(),
      title,
      estimatedMinutes: config.defaultTaskDuration,
      color: 'blue',
      status: 'pending',
      priority: 'medium',
      tags: [],
    });
    setQuickTitle('');
  };

  // 今日スケジュール済み or 完了済みのタスクをインボックスから除外
  const todayScheduledIds = new Set(
    (dayPlans[currentDate]?.slots ?? []).map(s => s.taskId)
  );
  const inboxTasks = tasks
    .filter(t => !todayScheduledIds.has(t.id) && t.status !== 'completed' && !t.isDeferred)
    .sort((a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.estimatedMinutes - b.estimatedMinutes
    );

  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const deferredTasks = tasks.filter(t => t.isDeferred && t.status !== 'completed');

  // 最短タスク = 次の空きに収まりやすい候補としてハイライト
  const minDuration  = inboxTasks.length > 0 ? Math.min(...inboxTasks.map(t => t.estimatedMinutes)) : null;
  const highlightId  = inboxTasks.find(t => t.estimatedMinutes === minDuration)?.id;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          インボックス
          {inboxTasks.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
              {inboxTasks.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          追加
        </button>
      </div>

      {/* クイック追加 */}
      <form onSubmit={handleQuickAdd} className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <input
          type="text"
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          placeholder="タスクを入力してEnter"
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </form>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {inboxTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm gap-1">
            <Plus className="w-8 h-8 opacity-30" />
            <p>タスクがありません</p>
          </div>
        ) : (
          inboxTasks.map(task => (
            <InboxTaskCard
              key={task.id}
              task={task}
              isHighlighted={task.id === highlightId}
            />
          ))
        )}

        {/* 完了済みタスク */}
        {completedTasks.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className="flex items-center gap-1 w-full px-1 py-1.5 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showCompleted && 'rotate-180')} />
              完了済み ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="space-y-1.5 mt-1">
                {completedTasks.map(task => (
                  <CompletedTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 保留中タスク（今日はやらない） */}
        {deferredTasks.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowDeferred(v => !v)}
              className="flex items-center gap-1 w-full px-1 py-1.5 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showDeferred && 'rotate-180')} />
              保留中 ({deferredTasks.length})
            </button>
            {showDeferred && (
              <div className="space-y-1.5 mt-1">
                {deferredTasks.map(task => (
                  <DeferredTaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TaskFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
