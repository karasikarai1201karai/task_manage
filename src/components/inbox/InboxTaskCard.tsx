'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Clock, GripVertical, Trash2 } from 'lucide-react';
import { QuickScheduleModal } from '@/components/modals/QuickScheduleModal';
import type { Task } from '@/types';

const SWIPE_THRESHOLD = 72;   // この距離を超えたら削除
const SWIPE_MAX       = 88;   // スワイプの最大量
const LONG_PRESS_MS   = 500;  // ロングプレス判定 (ms)

interface InboxTaskCardProps {
  task: Task;
  isHighlighted?: boolean;
}

export function InboxTaskCard({ task, isHighlighted }: InboxTaskCardProps) {
  const deleteTask = useStore(s => s.deleteTask);
  const colorClass  = TASK_COLOR_MAP[task.color];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'inbox', taskId: task.id },
  });

  const gripRef  = useRef<HTMLButtonElement>(null);
  const touch    = useRef({ x: 0, y: 0, determined: false, horizontal: false });
  const lpTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [swipeX,       setSwipeX]       = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // ドラッグ開始時はスワイプをリセット
  useEffect(() => { if (isDragging) setSwipeX(0); }, [isDragging]);

  const cancelLP = useCallback(() => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
  }, []);

  /* ─── タッチハンドラ ─── */
  const onTouchStart = (e: React.TouchEvent) => {
    const onHandle = gripRef.current?.contains(e.target as Node) ?? false;

    touch.current = {
      x:          e.touches[0].clientX,
      y:          e.touches[0].clientY,
      determined: false,
      horizontal: false,
    };

    // ハンドル以外の長押しでスケジュールモーダルを開く
    if (!onHandle) {
      lpTimer.current = setTimeout(() => {
        navigator.vibrate?.(12);   // 触覚フィードバック（対応端末のみ）
        setSwipeX(0);
        setScheduleOpen(true);
      }, LONG_PRESS_MS);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;

    // 少しでも動いたらロングプレスをキャンセル
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) cancelLP();

    // 方向を確定（8px 以上動いてから判定）
    if (!touch.current.determined && (Math.abs(dx) >= 8 || Math.abs(dy) >= 8)) {
      touch.current.horizontal = Math.abs(dx) > Math.abs(dy);
      touch.current.determined = true;
    }

    // 左スワイプのみ追跡
    if (touch.current.horizontal && dx < 0) {
      setSwipeX(Math.max(dx, -SWIPE_MAX));
    }
  };

  const onTouchEnd = () => {
    cancelLP();
    if (touch.current.horizontal && swipeX < -SWIPE_THRESHOLD) {
      deleteTask(task.id);
    } else {
      setSwipeX(0); // スナップバック
    }
    touch.current.horizontal = false;
    touch.current.determined = false;
  };

  // PC: 右クリックでスケジュールモーダルを開く
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelLP();
    setScheduleOpen(true);
  };

  const isDeleting = swipeX < -SWIPE_THRESHOLD;

  return (
    <>
      {/*
        touch-action: pan-y を最初から設定する。
        「縦スクロールはブラウザ、横方向はJSで処理」という契約をジェスチャー開始前に宣言。
        動的に変更しても効果がないためここで固定する。
      */}
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={onContextMenu}
      >
        {/* スワイプ削除の赤背景 */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-lg flex items-center justify-end px-4 transition-colors duration-150',
            isDeleting ? 'bg-red-500' : 'bg-red-400',
          )}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </div>

        {/* カード本体（横にスライドする） */}
        <div
          ref={setNodeRef}
          style={{
            transform:  `translateX(${swipeX}px)`,
            // swipeX=0 のとき（スナップバック）だけトランジションをかける
            transition: swipeX === 0
              ? 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
              : 'none',
          }}
          className={cn(
            'group relative z-10 flex items-center gap-2 p-2.5 rounded-lg border',
            colorClass,
            isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
            isDragging && 'opacity-25',
          )}
        >
          {/* ドラッグハンドル（DnD のリスナーはここだけ） */}
          <button
            ref={gripRef}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 shrink-0 opacity-40 hover:opacity-80 transition-opacity touch-none"
            aria-label="ドラッグして配置"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{task.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 opacity-50" />
              <span className="text-xs opacity-60">{task.estimatedMinutes}分</span>
              {isHighlighted && (
                <span className="ml-1 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                  今すぐ
                </span>
              )}
              {task.rolledOverFrom && (
                <span className="ml-1 text-xs bg-orange-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                  繰越
                </span>
              )}
            </div>
          </div>

          {/* PC 用削除ボタン（ホバーで表示）/ スマホはスワイプで削除 */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
            aria-label="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <QuickScheduleModal
        task={task}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </>
  );
}
