'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Clock, GripVertical, Trash2 } from 'lucide-react';
import { QuickScheduleModal } from '@/components/modals/QuickScheduleModal';
import type { Task } from '@/types';

const SWIPE_DELETE_PX = 72;   // 削除確定までのスワイプ量
const SWIPE_MAX_PX    = 88;   // スワイプの最大量
const LONG_PRESS_MS   = 500;  // ロングプレス判定時間

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

  const gripRef   = useRef<HTMLButtonElement>(null);
  const outerRef  = useRef<HTMLDivElement>(null);

  // ポインター追跡（ref で管理 → レンダーに依存しない）
  const ptr = useRef<{
    id: number; startX: number; startY: number;
    determined: boolean; swiping: boolean;
  } | null>(null);
  const swipeXRef = useRef(0);
  const lpTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [swipeX,       setSwipeX]       = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // ドラッグ中はスワイプをリセット
  useEffect(() => {
    if (isDragging) { setSwipeX(0); swipeXRef.current = 0; ptr.current = null; }
  }, [isDragging]);

  const cancelLP = useCallback(() => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
  }, []);

  /* ─── ポインターイベント（タッチ・マウス共通） ─── */

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    // ドラッグハンドル上のポインターは @dnd-kit に任せる
    if (gripRef.current?.contains(e.target as Node)) return;

    ptr.current = {
      id: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      determined: false, swiping: false,
    };
    swipeXRef.current = 0;

    // ロングプレスタイマー開始
    lpTimer.current = setTimeout(() => {
      lpTimer.current = null;
      navigator.vibrate?.(12);
      ptr.current = null;
      setSwipeX(0); swipeXRef.current = 0;
      setScheduleOpen(true);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = ptr.current;
    if (!p || e.pointerId !== p.id) return;

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;

    // 少しでも動いたらロングプレスキャンセル
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) cancelLP();

    // 方向未確定 → 10px 以上動いてから判定
    if (!p.determined && (Math.abs(dx) >= 10 || Math.abs(dy) >= 10)) {
      p.swiping    = Math.abs(dx) > Math.abs(dy) && dx < 0; // 左スワイプのみ
      p.determined = true;

      if (p.swiping) {
        // ポインターキャプチャ → ブラウザスクロールを止め、指が外れても追跡継続
        try { outerRef.current?.setPointerCapture(p.id); } catch (_) { /* noop */ }
      } else {
        ptr.current = null; // 縦スクロール → 追跡を手放す
        return;
      }
    }

    if (p.swiping && dx < 0) {
      const newX = Math.max(dx, -SWIPE_MAX_PX);
      swipeXRef.current = newX;
      setSwipeX(newX);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ptr.current || e.pointerId !== ptr.current.id) return;
    cancelLP();

    if (swipeXRef.current < -SWIPE_DELETE_PX) {
      deleteTask(task.id);
    } else {
      setSwipeX(0); swipeXRef.current = 0;
    }
    ptr.current = null;
  };

  const onPointerCancel = () => {
    cancelLP();
    setSwipeX(0); swipeXRef.current = 0;
    ptr.current = null;
  };

  // PC: 右クリックでスケジュール登録
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    cancelLP();
    setScheduleOpen(true);
  };

  const isDeleting = swipeX < -SWIPE_DELETE_PX;

  return (
    <>
      <div
        ref={outerRef}
        className="relative overflow-hidden rounded-lg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
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
          {/* ドラッグハンドル（@dnd-kit のリスナーはここだけ） */}
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

          {/* PC: ホバーで表示される削除ボタン */}
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
