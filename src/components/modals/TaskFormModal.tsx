'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLORS } from '@/types';
import { TASK_COLOR_DOT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { TaskColor, TaskPriority, TimeString, DateString } from '@/types';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: DateString;
  defaultStartTime?: TimeString;
}

export function TaskFormModal({ open, onClose, defaultDate, defaultStartTime }: TaskFormModalProps) {
  const addTask      = useStore(s => s.addTask);
  const scheduleTask = useStore(s => s.scheduleTask);
  const currentDate  = useStore(s => s.currentDate);
  const config       = useStore(s => s.config);

  const [title,        setTitle]        = useState('');
  const [minutes,      setMinutes]      = useState(config.defaultTaskDuration);
  const [color,        setColor]        = useState<TaskColor>('blue');
  const [startTime,    setStartTime]    = useState(defaultStartTime ?? '');
  const [destination,  setDestination]  = useState<'inbox' | 'timeline'>(
    defaultStartTime ? 'timeline' : 'inbox'
  );

  const isValid = title.trim().length > 0 && (destination === 'inbox' || startTime !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const id: string = crypto.randomUUID();

    addTask({
      id,
      title: title.trim(),
      estimatedMinutes: minutes,
      color,
      status: 'pending',
      priority: 'medium' as TaskPriority,
      tags: [],
    });

    if (destination === 'timeline' && startTime) {
      scheduleTask(id, defaultDate ?? currentDate, startTime as TimeString);
    }

    // フォームリセット
    setTitle('');
    setMinutes(config.defaultTaskDuration);
    setColor('blue');
    setStartTime('');
    setDestination('inbox');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
              タスクを追加
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* タイトル */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                タスク名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例：メールを返信する"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                autoFocus
              />
            </div>

            {/* 所要時間 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                所要時間：<span className="text-gray-900 dark:text-gray-100 font-semibold">{minutes}分</span>
              </label>
              <input
                type="range"
                min={5}
                max={240}
                step={5}
                value={minutes}
                onChange={e => setMinutes(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>5分</span><span>4時間</span>
              </div>
            </div>

            {/* 色選択 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                カラー
              </label>
              <div className="flex gap-2.5">
                {TASK_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-transform',
                      TASK_COLOR_DOT[c],
                      color === c
                        ? 'border-gray-700 dark:border-white scale-125'
                        : 'border-transparent scale-100',
                    )}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* 追加先 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                追加先
              </label>
              <div className="flex gap-2">
                {(['inbox', 'timeline'] as const).map(dest => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className={cn(
                      'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                      destination === dest
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {dest === 'inbox' ? 'インボックス' : 'タイムライン'}
                  </button>
                ))}
              </div>
            </div>

            {/* 開始時刻（タイムライン選択時のみ） */}
            {destination === 'timeline' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              追加する
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
