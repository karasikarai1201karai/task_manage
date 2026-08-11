'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
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
  /** 定期タスクの連続達成数（1以上でバッジ表示） */
  streak?: number;
  /** 完了アニメーション終了後（store反映後）に呼ばれる */
  onCompleted?: () => void;
}

/** 継続日数に応じたバッジの見た目（数字が伸びるほど豪華に進化する） */
function streakBadgeStyle(streak: number): { emoji: string; className: string } {
  if (streak >= 30) return { emoji: '👑', className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
  if (streak >= 14) return { emoji: '🔥', className: 'bg-red-500 text-white' };
  if (streak >= 7)  return { emoji: '🔥', className: 'bg-orange-500 text-white' };
  if (streak >= 3)  return { emoji: '🔥', className: 'bg-amber-500 text-white' };
  return { emoji: '✨', className: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' };
}

export function TodayTaskCard({ task, isHighlighted, streak = 0, onCompleted }: TodayTaskCardProps) {
  const deleteTask   = useStore(s => s.deleteTask);
  const completeTask = useStore(s => s.completeTask);
  const updateTask   = useStore(s => s.updateTask);
  const colorClass   = TASK_COLOR_MAP[task.color];

  const pressStart = useRef({ x: 0, y: 0 });
  const swipeXRef  = useRef(0);
  const multiTouch = useRef(false);

  const [swipeX, setSwipeXState] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const setSwipeX = (x: number) => { swipeXRef.current = x; setSwipeXState(x); };

  const cancelSwipe = useCallback(() => {
    setIsSwiping(false);
    setSwipeX(0);
  }, []);

  // 完了演出を再生してから store に反映する（即時報酬）
  const triggerComplete = useCallback(() => {
    if (isCompleting) return;
    navigator.vibrate?.(12);
    setIsCompleting(true);
    setTimeout(() => {
      completeTask(task.id);
      onCompleted?.();
    }, 350);
  }, [isCompleting, completeTask, task.id, onCompleted]);

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
      triggerComplete();
    }
    cancelSwipe();
  }, [triggerComplete, cancelSwipe]);

  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_COMPLETE_PX, 1);
  const isInProgress  = task.status === 'in-progress';

  // 着手中は経過時間を表示（30秒ごとに更新）— 過集中の外部化
  const [, tick] = useState(0);
  useEffect(() => {
    if (!isInProgress || !task.startedAt) return;
    const id = setInterval(() => tick(v => v + 1), 30_000);
    return () => clearInterval(id);
  }, [isInProgress, task.startedAt]);
  const elapsedMin = isInProgress && task.startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(task.startedAt).getTime()) / 60_000))
    : null;

  return (
    <div className="relative" data-task-card>
      <div
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-green-500 text-white"
        style={{ opacity: isCompleting ? 1 : swipeProgress }}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
        <span className="text-xs font-medium opacity-80">{isCompleting ? '完了！' : 'スワイプで完了'}</span>
      </div>

      <div
        className={cn(
          'group relative flex items-center gap-2 p-2.5 rounded-lg border select-none',
          !isSwiping && 'transition-[transform] duration-200',
          colorClass,
          isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
          isCompleting && 'task-completing',
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
          onClick={e => { e.stopPropagation(); triggerComplete(); }}
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
            {elapsedMin !== null && (
              <span className={cn(
                'text-xs font-medium ml-0.5',
                elapsedMin > task.estimatedMinutes
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'opacity-60',
              )}>
                ・{elapsedMin}分経過
              </span>
            )}
            {task.recurringTemplateId && (
              <RefreshCw className="w-2.5 h-2.5 opacity-40 ml-0.5" />
            )}
            {streak > 0 && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-0.5',
                  streakBadgeStyle(streak).className,
                )}
                title={`${streak}回連続で達成中！`}
              >
                {streakBadgeStyle(streak).emoji}{streak}
              </span>
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
            onClick={e => { e.stopPropagation(); navigator.vibrate?.(12); updateTask(task.id, { isDeferred: true, deferredAt: new Date().toISOString() }); }}
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
            updateTask(task.id, isInProgress
              ? { status: 'pending', startedAt: undefined }
              : { status: 'in-progress', startedAt: new Date().toISOString() });
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
