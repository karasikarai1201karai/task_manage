'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { TASK_COLORS } from '@/types';
import { TASK_COLOR_DOT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task, TaskColor, TaskPriority } from '@/types';

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high',   label: '高' },
];

export interface TaskEditValues {
  title: string;
  estimatedMinutes: number;
  color: TaskColor;
  priority: TaskPriority;
}

interface TaskEditModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSave: (updates: TaskEditValues) => void;
}

export function TaskEditModal({ task, open, onClose, onSave }: TaskEditModalProps) {
  const [title,    setTitle]    = useState(task.title);
  const [minutes,  setMinutes]  = useState(task.estimatedMinutes);
  const [color,    setColor]    = useState<TaskColor>(task.color);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);

  // モーダルを開くたびに対象タスクの現在値でフォームを初期化する
  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setMinutes(task.estimatedMinutes);
    setColor(task.color);
    setPriority(task.priority);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task.id]);

  const isValid = title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({ title: title.trim(), estimatedMinutes: minutes, color, priority });
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
              タスクを編集
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

            {/* 優先度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                優先度
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                      priority === p.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
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

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              保存する
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
