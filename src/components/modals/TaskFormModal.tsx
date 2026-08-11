'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { TASK_COLORS } from '@/types';
import { TASK_COLOR_DOT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { addRecurringTemplate } from '@/lib/utils/recurringStorage';
import { materializeRecurringTasks, materializeOnCompletionTask } from '@/lib/utils/recurring';
import { today } from '@/lib/utils/time';
import type { TaskColor, TaskPriority, DateString, RecurrenceType, RecurringTemplate } from '@/types';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: DateString;
  defaultStartTime?: string;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'daily',        label: '毎日' },
  { value: 'weekdays',     label: '平日のみ' },
  { value: 'weekly',       label: '毎週' },
  { value: 'onCompletion', label: '習慣' },
];

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; activeClass: string }[] = [
  { value: 'high',   label: '高', activeClass: 'bg-red-500 border-red-500 text-white' },
  { value: 'medium', label: '中', activeClass: 'bg-amber-500 border-amber-500 text-white' },
  { value: 'low',    label: '低', activeClass: 'bg-gray-500 border-gray-500 text-white' },
];

export function TaskFormModal({ open, onClose, defaultDate, defaultStartTime }: TaskFormModalProps) {
  const addTask      = useStore(s => s.addTask);
  const scheduleTask = useStore(s => s.scheduleTask);
  const tasks        = useStore(s => s.tasks);
  const config       = useStore(s => s.config);

  const [title,        setTitle]        = useState('');
  const [minutes,      setMinutes]      = useState(config.defaultTaskDuration);
  const [priority,     setPriority]     = useState<TaskPriority>('medium');
  const [color,        setColor]        = useState<TaskColor>('blue');
  const [isRecurring,    setIsRecurring]    = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [weeklyDay,      setWeeklyDay]      = useState(new Date().getDay());
  const [showDetails,    setShowDetails]    = useState(false);
  const [skipIfPrevIncomplete, setSkipIfPrevIncomplete] = useState(false);

  // モーダルを開くたびにフォームをリセット（キャンセル後に前回の入力が残らないようにする）
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setMinutes(config.defaultTaskDuration);
    setPriority('medium');
    setColor('blue');
    setIsRecurring(false);
    setRecurrenceType('daily');
    setWeeklyDay(new Date().getDay());
    setShowDetails(false);
    setSkipIfPrevIncomplete(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isHabit = isRecurring && recurrenceType === 'onCompletion';
  const isValid = title.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (isRecurring) {
      const template: RecurringTemplate = {
        id: crypto.randomUUID(),
        title: title.trim(),
        estimatedMinutes: minutes,
        color,
        priority,
        tags: [],
        recurrenceType,
        weeklyDay: recurrenceType === 'weekly' ? weeklyDay : undefined,
        defaultStartTime: undefined,
        createdAt: new Date().toISOString(),
        skipIfPrevIncomplete: isHabit ? undefined : skipIfPrevIncomplete,
      };
      addRecurringTemplate(template);
      if (isHabit) {
        materializeOnCompletionTask(template, addTask);
      } else {
        materializeRecurringTasks(defaultDate ?? today(), tasks, addTask, scheduleTask);
      }
    } else {
      addTask({
        id: crypto.randomUUID(),
        title: title.trim(),
        estimatedMinutes: minutes,
        color,
        status: 'pending',
        priority,
        tags: [],
      });
    }

    // フォームリセット
    setTitle('');
    setMinutes(config.defaultTaskDuration);
    setColor('blue');
    setIsRecurring(false);
    setRecurrenceType('daily');
    setSkipIfPrevIncomplete(false);
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

            {/* 優先度 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                優先度
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'flex-1 py-2 text-sm font-medium rounded-lg border transition-colors',
                      priority === opt.value
                        ? opt.activeClass
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 詳細設定（折りたたみ） */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(v => !v)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showDetails && 'rotate-90')} />
                詳細設定（色・繰り返し）
              </button>

              {showDetails && (
                <div className="space-y-4 mt-3">
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

                  {/* 繰り返し */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        繰り返し
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRecurring(v => !v)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                          isRecurring
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                        )}
                      >
                        {isRecurring ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    {isRecurring && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {RECURRENCE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRecurrenceType(opt.value)}
                              className={cn(
                                'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                                recurrenceType === opt.value
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {recurrenceType === 'weekly' && (
                          <div className="flex gap-1">
                            {WEEKDAY_LABELS.map((label, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setWeeklyDay(i)}
                                className={cn(
                                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                                  weeklyDay === i
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                        {recurrenceType !== 'onCompletion' && (
                          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={skipIfPrevIncomplete}
                              onChange={e => setSkipIfPrevIncomplete(e.target.checked)}
                              className="accent-blue-600"
                            />
                            前回分が未完了のときは次を生成しない
                          </label>
                        )}
                        {recurrenceType === 'onCompletion' && (
                          <p className="text-xs text-gray-400 dark:text-gray-600">
                            時間指定なしでインボックスに追加され、完了するたびに次が生成されます
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isRecurring ? '繰り返しタスクを追加' : '追加する'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
