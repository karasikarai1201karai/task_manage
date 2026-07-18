'use client';

import { useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Clock, GripVertical, Trash2 } from 'lucide-react';
import { QuickScheduleModal } from '@/components/modals/QuickScheduleModal';
import type { Task } from '@/types';

const SWIPE_THRESHOLD = 72; // この距離以上スワイプで削除
const SWIPE_MAX       = 88; // スワイプの最大距離

interface InboxTaskCardProps {
  task: Task;
  isHighlighted?: boolean;
}

export function InboxTaskCard({ task, isHighlighted }: InboxTaskCardProps) {
  const deleteTask = useStore(s => s.deleteTask);
  const colorClass = TASK_COLOR_MAP[task.color];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'inbox', taskId: task.id },
  });

  // スワイプ状態
  const outerRef  = useRef<HTMLDivElement>(null);
  const gripRef   = useRef<HTMLButtonElement>(null);
  const touch     = useRef({ x: 0, y: 0, onHandle: false, determined: false, horizontal: false });
  const [swipeX,        setSwipeX]        = useState(0);
  const [scheduleOpen,  setScheduleOpen]  = useState(false);

  // ドラッグ開始時にスワイプをリセット
  useEffect(() => { if (isDragging) setSwipeX(0); }, [isDragging]);

  /* ── タッチハンドラ ── */
  const onTouchStart = (e: React.TouchEvent) => {
    if (outerRef.current) outerRef.current.style.touchAction = 'auto';
    touch.current = {
      x:          e.touches[0].clientX,
      y:          e.touches[0].clientY,
      onHandle:   gripRef.current?.contains(e.target as Node) ?? false,
      determined: false,
      horizontal: false,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = touch.current;
    if (t.onHandle) return;

    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;

    if (!t.determined && (Math.abs(dx) >= 5 || Math.abs(dy) >= 5)) {
      t.horizontal  = Math.abs(dx) > Math.abs(dy);
      t.determined  = true;
      if (t.horizontal && outerRef.current) {
        // 水平スワイプ確定 → ブラウザスクロールを止める
        outerRef.current.style.touchAction = 'none';
      }
    }

    if (t.horizontal && dx < 0) {
      setSwipeX(Math.max(dx, -SWIPE_MAX));
    }
  };

  const onTouchEnd = () => {
    if (outerRef.current) outerRef.current.style.touchAction = 'auto';
    if (touch.current.horizontal && swipeX < -SWIPE_THRESHOLD) {
      deleteTask(task.id);
    } else {
      setSwipeX(0); // スナップバック
    }
    touch.current.horizontal  = false;
    touch.current.determined  = false;
  };

  // 右クリック / ロングプレス → スケジュールモーダル
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setScheduleOpen(true);
  };

  const isDeleting = swipeX < -SWIPE_THRESHOLD;

  return (
    <>
      {/* スワイプコンテナ */}
      <div
        ref={outerRef}
        className="relative overflow-hidden rounded-lg"
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

        {/* カード本体（スライドする） */}
        <div
          ref={setNodeRef}
          style={{
            transform:  `translateX(${swipeX}px)`,
            transition: swipeX === 0 ? 'transform 0.25s cubic-bezier(0.32,0.72,0,1)' : 'none',
          }}
          className={cn(
            'group relative z-10 flex items-center gap-2 p-2.5 rounded-lg border',
            colorClass,
            isHighlighted && 'ring-2 ring-blue-400 ring-offset-1',
            isDragging && 'opacity-25',
          )}
        >
          {/* ドラッグハンドル */}
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

          {/* 削除ボタン（PC: ホバーで表示 / スマホ: スワイプで削除） */}
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

      {/* ロングプレス / 右クリックで開くスケジュールシート */}
      <QuickScheduleModal
        task={task}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </>
  );
}
