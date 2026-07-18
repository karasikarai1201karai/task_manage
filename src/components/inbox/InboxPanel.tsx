'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { InboxTaskCard } from './InboxTaskCard';
import { TaskFormModal } from '@/components/modals/TaskFormModal';

export function InboxPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tasks       = useStore(s => s.tasks);
  const dayPlans    = useStore(s => s.dayPlans);
  const currentDate = useStore(s => s.currentDate);

  // 今日スケジュール済み or 完了済みのタスクをインボックスから除外
  const todayScheduledIds = new Set(
    (dayPlans[currentDate]?.slots ?? []).map(s => s.taskId)
  );
  const inboxTasks = tasks.filter(
    t => !todayScheduledIds.has(t.id) && t.status !== 'completed'
  );

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
      </div>

      <TaskFormModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
