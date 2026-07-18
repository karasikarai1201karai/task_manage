'use client';

import { useDraggable } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Clock, GripVertical, Trash2 } from 'lucide-react';
import type { Task } from '@/types';

interface InboxTaskCardProps {
  task: Task;
  isHighlighted?: boolean;
}

export function InboxTaskCard({ task, isHighlighted }: InboxTaskCardProps) {
  const deleteTask = useStore(s => s.deleteTask);
  const colorClass = TASK_COLOR_MAP[task.color];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'inbox', taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-2 p-2.5 rounded-lg border transition-all',
        colorClass,
        isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
        isDragging && 'opacity-25',
      )}
    >
      {/* ドラッグハンドル */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 shrink-0 opacity-40 hover:opacity-80 transition-opacity touch-none"
        aria-label="ドラッグして配置"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 opacity-50" />
          <span className="text-xs opacity-60">{task.estimatedMinutes}分</span>
          {isHighlighted && (
            <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">
              今すぐ
            </span>
          )}
          {task.rolledOverFrom && (
            <span className="ml-1 text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded-full leading-none">
              繰越
            </span>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
        aria-label="削除"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
