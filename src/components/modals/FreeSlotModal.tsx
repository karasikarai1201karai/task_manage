'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { formatDuration } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { FreeSlot } from '@/types';

interface FreeSlotModalProps {
  slot: FreeSlot;
  open: boolean;
  onClose: () => void;
}

export function FreeSlotModal({ slot, open, onClose }: FreeSlotModalProps) {
  const tasks        = useStore(s => s.tasks);
  const dayPlans     = useStore(s => s.dayPlans);
  const currentDate  = useStore(s => s.currentDate);
  const scheduleTask = useStore(s => s.scheduleTask);

  const todayScheduledIds = new Set((dayPlans[currentDate]?.slots ?? []).map(s => s.taskId));
  const inboxTasks = tasks.filter(t => !todayScheduledIds.has(t.id) && t.status !== 'completed');

  const handleSelect = (taskId: string) => {
    scheduleTask(taskId, currentDate, slot.startTime);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />

        <Dialog.Content
          className={cn(
            'fixed z-50 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl',
            'left-1/2 -translate-x-1/2 bottom-0 rounded-t-2xl',
            'pb-[calc(1rem+env(safe-area-inset-bottom))]',
            'animate-in slide-in-from-bottom duration-300',
          )}
          aria-describedby={undefined}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="px-6 pt-2">
            <div className="flex items-center justify-between mb-1">
              <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {slot.startTime} の空き枠に配置
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              空き時間: {formatDuration(slot.durationMinutes)}（{slot.startTime}〜{slot.endTime}）
            </p>

            {inboxTasks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">
                配置できるタスクがありません
              </p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pb-2">
                {inboxTasks.map(task => {
                  const fits = task.estimatedMinutes <= slot.durationMinutes;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelect(task.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98]',
                        TASK_COLOR_MAP[task.color],
                        fits ? 'opacity-100' : 'opacity-50',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-60">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{task.estimatedMinutes}分</span>
                      </div>
                      {!fits && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 shrink-0">超過</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
