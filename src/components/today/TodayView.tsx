'use client';

import { useState } from 'react';
import { Plus, ChevronDown, Check, Trash2, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP, PRIORITY_RANK } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { TodayTaskCard } from './TodayTaskCard';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import type { Task } from '@/types';

function CompletedTaskRow({ task }: { task: Task }) {
  const uncompleteTask = useStore(s => s.uncompleteTask);
  const deleteTask     = useStore(s => s.deleteTask);
  return (
    <div className={cn('group flex items-center gap-2 p-2 rounded-lg border opacity-60', TASK_COLOR_MAP[task.color])}>
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
  return (
    <div className={cn('group flex items-center gap-2 p-2 rounded-lg border opacity-70', TASK_COLOR_MAP[task.color])}>
      <p className="flex-1 min-w-0 text-xs truncate">{task.title}</p>
      <button
        onClick={() => updateTask(task.id, { isDeferred: false })}
        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="戻す"
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

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5 px-1">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{count}</span>
      )}
      <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
    </div>
  );
}

interface TodayViewProps {
  highlightTaskId?: string | null;
}

export function TodayView({ highlightTaskId }: TodayViewProps) {
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeferred,  setShowDeferred]  = useState(false);
  const [quickTitle,    setQuickTitle]    = useState('');

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

  const completedTasks = tasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const deferredTasks = tasks.filter(t => t.isDeferred && t.status !== 'completed');

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
            <SectionHeader label="日次タスク" count={dailyTasks.length} />
            <div className="space-y-1.5">
              {dailyTasks.map(task => (
                <TodayTaskCard key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />
              ))}
            </div>
          </section>
        )}

        {/* やること */}
        <section>
          <SectionHeader label="やること" count={todoTasks.length} />
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
                <TodayTaskCard key={task.id} task={task} isHighlighted={task.id === highlightTaskId} />
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
              <div className="space-y-1.5 mt-1">
                {completedTasks.map(task => <CompletedTaskRow key={task.id} task={task} />)}
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
            </button>
            {showDeferred && (
              <div className="space-y-1.5 mt-1">
                {deferredTasks.map(task => <DeferredTaskRow key={task.id} task={task} />)}
              </div>
            )}
          </section>
        )}
      </div>

      <TaskFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
