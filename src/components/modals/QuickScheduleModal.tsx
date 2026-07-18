'use client';

import { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { addMinutesToTime, timeToMinutes } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { Task, TimeString } from '@/types';

interface QuickScheduleModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  initialTime?: string;
}

function nearestQuarterTime(): string {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  const snapped = Math.ceil(total / 15) * 15;
  const h = Math.floor(snapped / 60) % 24;
  const m = snapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMinutesToStr(base: string, delta: number): string {
  const [h, m] = base.split(':').map(Number);
  const total = h * 60 + m + delta;
  const nh = Math.min(23, Math.floor(total / 60));
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

const QUICK_CHIPS = [
  { label: '今すぐ', fn: () => nearestQuarterTime() },
  { label: '+15m',  fn: (t: string) => addMinutesToStr(t, 15) },
  { label: '+30m',  fn: (t: string) => addMinutesToStr(t, 30) },
  { label: '+1h',   fn: (t: string) => addMinutesToStr(t, 60) },
];

export function QuickScheduleModal({ task, open, onClose, initialTime }: QuickScheduleModalProps) {
  const scheduleTask = useStore(s => s.scheduleTask);
  const currentDate  = useStore(s => s.currentDate);
  const dayPlans     = useStore(s => s.dayPlans);
  const colorClass   = TASK_COLOR_MAP[task.color];

  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    if (open) setStartTime(initialTime ?? nearestQuarterTime());
  }, [open, initialTime]);

  const endTime = useMemo(
    () => startTime ? addMinutesToTime(startTime as TimeString, task.estimatedMinutes) : '',
    [startTime, task.estimatedMinutes],
  );

  const hasOverlap = useMemo(() => {
    if (!startTime) return false;
    const slots = dayPlans[currentDate]?.slots ?? [];
    const newStart = timeToMinutes(startTime as TimeString);
    const newEnd   = timeToMinutes(endTime as TimeString);
    return slots.some(sl => {
      if (sl.taskId === task.id) return false;
      const slStart = timeToMinutes(sl.startTime);
      const slEnd   = timeToMinutes(sl.endTime);
      return newStart < slEnd && newEnd > slStart;
    });
  }, [startTime, endTime, dayPlans, currentDate, task.id]);

  const handleSchedule = () => {
    if (!startTime) return;
    scheduleTask(task.id, currentDate, startTime as TimeString);
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
            'pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
            'animate-in slide-in-from-bottom duration-300',
          )}
          aria-describedby={undefined}
        >
          {/* ドラッグインジケーター */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="px-6 pt-2 pb-4">
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
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border mb-4', colorClass)}>
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
              step={900}
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />

            {/* クイック選択チップ */}
            <div className="flex gap-1.5 mb-3">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setStartTime(chip.fn(startTime))}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* 終了時刻プレビュー */}
            {endTime && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                終了予定: <span className="font-semibold text-gray-700 dark:text-gray-200">{endTime}</span>
              </p>
            )}

            {/* 重複警告 */}
            {hasOverlap && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">この時間帯には別のタスクがあります</p>
              </div>
            )}

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
