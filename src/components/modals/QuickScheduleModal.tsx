'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task, TimeString } from '@/types';

interface QuickScheduleModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

function nearestQuarterTime(): string {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  const snapped = Math.ceil(total / 15) * 15;
  const h = Math.floor(snapped / 60) % 24;
  const m = snapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function QuickScheduleModal({ task, open, onClose }: QuickScheduleModalProps) {
  const scheduleTask = useStore(s => s.scheduleTask);
  const currentDate  = useStore(s => s.currentDate);
  const colorClass   = TASK_COLOR_MAP[task.color];

  const [startTime, setStartTime] = useState('');

  // モーダルが開くたびに現在時刻（15分丸め）をリセット
  useEffect(() => {
    if (open) setStartTime(nearestQuarterTime());
  }, [open]);

  const handleSchedule = () => {
    if (!startTime) return;
    scheduleTask(task.id, currentDate, startTime as TimeString);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />

        {/* ボトムシート（モバイル）/ 中央ダイアログ（デスクトップ） */}
        <Dialog.Content
          className={cn(
            'fixed z-50 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl',
            // モバイル: 下から出てくるボトムシート
            'left-1/2 -translate-x-1/2 bottom-0 rounded-t-2xl',
            'pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
            'animate-in slide-in-from-bottom duration-300',
          )}
          aria-describedby={undefined}
        >
          {/* ドラッグインジケーター */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="px-6 pt-2 pb-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                タイムラインに追加
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* タスク情報チップ */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border mb-5',
              colorClass,
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{task.title}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-60">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{task.estimatedMinutes}分</span>
              </div>
            </div>

            {/* 開始時刻 */}
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              開始時刻
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
            />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSchedule}
                disabled={!startTime}
                className="flex-1 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 transition-colors"
              >
                配置する
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
