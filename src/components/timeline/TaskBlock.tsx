'use client';

import { useStore } from '@/store/appStore';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { Task, ScheduledSlot } from '@/types';

interface TaskBlockProps {
  task: Task;
  slot: ScheduledSlot;
  dayStartHour: number;
  isDragging?: boolean;
}

export function TaskBlock({ task, slot, dayStartHour, isDragging }: TaskBlockProps) {
  const { toTop, toHeight } = useTimelineScale(dayStartHour);
  const completeTask        = useStore(s => s.completeTask);

  const isCompleted = task.status === 'completed';
  const top         = toTop(slot.startTime);
  const height      = Math.max(toHeight(task.estimatedMinutes), 24);
  const colorClass  = TASK_COLOR_MAP[task.color];

  return (
    <div
      className={cn(
        'absolute left-1 right-2 rounded-lg border px-2 py-1 overflow-hidden cursor-pointer select-none transition-all',
        colorClass,
        isCompleted && 'opacity-50',
        isDragging && 'shadow-lg ring-2 ring-blue-400 opacity-90',
      )}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={() => !isCompleted && completeTask(task.id)}
      title={task.title}
    >
      <div className="flex items-start gap-1.5">
        <div
          className={cn(
            'mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center',
            isCompleted ? 'bg-current border-current' : 'border-current',
          )}
        >
          {isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </div>
        <span className={cn('text-xs font-medium leading-tight line-clamp-2', isCompleted && 'line-through')}>
          {task.title}
        </span>
      </div>
      {height >= 44 && (
        <p className="text-xs opacity-60 mt-0.5 ml-5.5">{task.estimatedMinutes}分</p>
      )}
    </div>
  );
}
