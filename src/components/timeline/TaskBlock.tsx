'use client';

import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { addMinutesToTime } from '@/lib/utils/time';
import { Check } from 'lucide-react';
import type { Task, ScheduledSlot } from '@/types';

interface TaskBlockProps {
  task: Task;
  slot: ScheduledSlot;
  dayStartHour: number;
}

export function TaskBlock({ task, slot, dayStartHour }: TaskBlockProps) {
  const { toTop, toHeight } = useTimelineScale(dayStartHour);
  const completeTask   = useStore(s => s.completeTask);
  const uncompleteTask = useStore(s => s.uncompleteTask);

  const extendTask = (minutes: number) => {
    const newEstimatedMinutes = task.estimatedMinutes + minutes;
    const newEndTime = addMinutesToTime(slot.startTime, newEstimatedMinutes);
    useStore.setState(s => {
      const plan = s.dayPlans[slot.date];
      if (!plan) return s;
      return {
        tasks: s.tasks.map(t =>
          t.id === task.id ? { ...t, estimatedMinutes: newEstimatedMinutes, updatedAt: new Date().toISOString() } : t
        ),
        dayPlans: {
          ...s.dayPlans,
          [slot.date]: {
            ...plan,
            slots: plan.slots.map(sl => sl.taskId === task.id ? { ...sl, endTime: newEndTime } : sl),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    useStore.getState().saveToStorage();
  };

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: { type: 'scheduled', taskId: task.id },
    disabled: task.status === 'completed',
  });

  const wasDragging  = useRef(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (isDragging) wasDragging.current = true;
  }, [isDragging]);

  // アニメーション終了後にフラグをリセット
  useEffect(() => {
    if (!isCompleting) return;
    const timer = setTimeout(() => setIsCompleting(false), 400);
    return () => clearTimeout(timer);
  }, [isCompleting]);

  const isCompleted = task.status === 'completed';
  const top         = toTop(slot.startTime);
  const height      = Math.max(toHeight(task.estimatedMinutes), 24);
  const colorClass  = TASK_COLOR_MAP[task.color];
  const isCompact    = height < 44;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(!isCompleted ? listeners : {})}
      data-timeline-block
      style={{
        top: `${top}px`,
        height: `${height}px`,
        willChange: isCompleting ? 'transform, box-shadow' : 'auto',
      }}
      className={cn(
        'absolute left-1 right-2 rounded-lg border px-2 py-1 overflow-hidden select-none',
        'transition-opacity duration-300',
        colorClass,
        isCompleted && !isCompleting && 'opacity-50',
        isCompleted
          ? 'cursor-pointer'
          : 'cursor-grab active:cursor-grabbing',
        isCompleting && 'animate-task-complete-bounce',
        isDragging && 'opacity-25 cursor-grabbing',
      )}
      onClick={() => {
        if (wasDragging.current) { wasDragging.current = false; return; }
        if (isCompleted) {
          uncompleteTask(task.id);
        } else {
          setIsCompleting(true);
          completeTask(task.id);
        }
      }}
      title={task.title}
    >
      <div className="flex items-start gap-1.5">
        <div
          className={cn(
            'mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center',
            isCompleted ? 'bg-current border-current' : 'border-current',
          )}
        >
          {isCompleted && (
            <Check
              className={cn('w-2.5 h-2.5 text-white', isCompleting && 'animate-check-pop')}
              strokeWidth={3}
            />
          )}
        </div>
        <span className={cn(
          'font-medium leading-tight',
          isCompact ? 'text-[10px] line-clamp-1' : 'text-xs line-clamp-2',
          isCompleted && !isCompleting && 'line-through',
        )}>
          {task.title}
        </span>
      </div>
      {height >= 44 && (
        <div className="flex items-center gap-1.5 mt-0.5 ml-5.5">
          <p className="text-xs opacity-60">{task.estimatedMinutes}分</p>
          {!isCompleted && (
            <div className="flex items-center gap-1 ml-auto">
              {[15, 30].map(minutes => (
                <button
                  key={minutes}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); extendTask(minutes); }}
                  className="text-[10px] leading-none px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`${minutes}分延長`}
                >
                  +{minutes}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
