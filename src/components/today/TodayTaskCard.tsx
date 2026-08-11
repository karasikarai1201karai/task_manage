'use client';

import { useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP, PRIORITY_BAR_COLOR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Clock, Trash2, Check, CalendarX, CircleDot, RefreshCw } from 'lucide-react';
import type { Task } from '@/types';

const CANCEL_MOVE_PX    = 8;
const SWIPE_ACTIVATE_PX = 12;
const SWIPE_COMPLETE_PX = 80;

interface TodayTaskCardProps {
  task: Task;
  isHighlighted?: boolean;
}

export function TodayTaskCard({ task, isHighlighted }: TodayTaskCardProps) {
  const deleteTask   = useStore(s => s.deleteTask);
  const completeTask = useStore(s => s.completeTask);
  const updateTask   = useStore(s => s.updateTask);
  const colorClass   = TASK_COLOR_MAP[task.color];

  const pressStart = useRef({ x: 0, y: 0 });
  const swipeXRef  = useRef(0);
  const multiTouch = useRef(false);

  const [swipeX, setSwipeXState] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const setSwipeX = (x: number) => { swipeXRef.current = x; setSwipeXState(x); };

  const cancelSwipe = useCallback(() => {
    setIsSwiping(false);
    setSwipeX(0);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) {
      // 2本目の指 = ピンチ操作。スワイプ判定を無効化する
      multiTouch.current = true;
      cancelSwipe();
      return;
    }
    multiTouch.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary || multiTouch.current) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_ACTIVATE_PX) {
      setIsSwiping(true);
      setSwipeX(dx);
    } else if (Math.abs(dy) > CANCEL_MOVE_PX) {
      cancelSwipe();
    }
  }, [cancelSwipe]);

  const endSwipe = useCallback((e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    if (!multiTouch.current && Math.abs(swipeXRef.current) > SWIPE_COMPLETE_PX) {
      navigator.vibrate?.(12);
      completeTask(task.id);
    }
    cancelSwipe();
  }, [completeTask, task.id, cancelSwipe]);

  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_COMPLETE_PX, 1);
  const isInProgress  = task.status === 'in-progress';

  return (
    <div className="relative" data-task-card>
      <div
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-green-500 text-white"
        style={{ opacity: swipeProgress }}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
        <span className="text-xs font-medium opacity-80">スワイプで完了</span>
      </div>

      <div
        className={cn(
          'group relative flex items-center gap-2 p-2.5 rounded-lg border select-none',
          !isSwiping && 'transition-[transform] duration-200',
          colorClass,
          isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
        )}
        style={{ transform: `translateX(${swipeX}px)`, WebkitTouchCallout: 'none' } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={cancelSwipe}
      >
        {/* 優先度バー */}
        <div className={cn('w-1 self-stretch rounded-full shrink-0', PRIORITY_BAR_COLOR[task.priority])} aria-hidden="true" />

        {/* 完了チェックボックス */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); navigator.vibrate?.(12); completeTask(task.id); }}
          className="shrink-0 min-w-[40px] min-h-[40px] -my-1.5 -ml-1.5 flex items-center justify-center"
          aria-label="完了にする"
        >
          <span
            className={cn(
              'w-5 h-5 rounded border-2 border-current opacity-50 hover:opacity-90 hover:bg-current/10 transition-colors flex items-center justify-center',
              isInProgress && 'border-dashed',
            )}
          >
            {isInProgress && <span className="w-2 h-2 rounded-full bg-current" />}
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{task.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 opacity-50" />
            <span className="text-xs opacity-60">{task.estimatedMinutes}分</span>
            {task.recurringTemplateId && (
              <RefreshCw className="w-2.5 h-2.5 opacity-40 ml-0.5" />
            )}
            {task.rolledOverFrom && (
              <span className="text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded-full leading-none">繰越</span>
            )}
            {isHighlighted && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">→ 今すぐ</span>
            )}
          </div>
        </div>

        {/* 繰越タスク: 今日はやらない */}
        {task.rolledOverFrom && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); navigator.vibrate?.(12); updateTask(task.id, { isDeferred: true }); }}
            className="opacity-40 group-hover:opacity-100 min-w-[40px] min-h-[40px] -my-1.5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
            aria-label="今日はやらない"
            title="今日はやらない"
          >
            <CalendarX className="w-4 h-4" />
          </button>
        )}

        {/* 着手トグル */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            updateTask(task.id, { status: isInProgress ? 'pending' : 'in-progress' });
          }}
          className={cn(
            'min-w-[40px] min-h-[40px] -my-1.5 flex items-center justify-center rounded transition-opacity shrink-0',
            isInProgress
              ? 'opacity-100 bg-amber-500/30'
              : 'opacity-40 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10',
          )}
          aria-label={isInProgress ? '進行中を解除' : '着手する'}
          title={isInProgress ? '進行中を解除' : '着手する'}
        >
          <CircleDot className="w-4 h-4" />
        </button>

        {/* 削除ボタン */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
          className="opacity-40 group-hover:opacity-100 min-w-[40px] min-h-[40px] -my-1.5 -mr-1.5 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
          aria-label="削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
