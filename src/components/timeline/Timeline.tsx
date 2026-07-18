'use client';

import { useMemo, useCallback, useRef, useState } from 'react';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import { useStore } from '@/store/appStore';
import { TaskBlock } from './TaskBlock';
import { FreeSlotBlock } from './FreeSlotBlock';
import { CurrentTimeLine } from './CurrentTimeLine';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { HOUR_HEIGHT_PX, useTimelineScale } from '@/hooks/useTimelineScale';
import { computeFreeSlots } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { TimeString } from '@/types';

interface TimelineProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
}

export function Timeline({ scrollRef }: TimelineProps) {
  const tasks       = useStore(s => s.tasks);
  const dayPlans    = useStore(s => s.dayPlans);
  const config      = useStore(s => s.config);
  const currentDate = useStore(s => s.currentDate);
  const { toTop, yToTime } = useTimelineScale(config.dayStartHour);

  const { setNodeRef, isOver } = useDroppable({ id: 'timeline-droppable' });

  const taskAreaRef   = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [createTime, setCreateTime] = useState<string | null>(null);

  useDndMonitor({
    onDragStart:  () => { isDraggingRef.current = true; },
    onDragEnd:    () => { setTimeout(() => { isDraggingRef.current = false; }, 50); },
    onDragCancel: () => { isDraggingRef.current = false; },
  });

  const handleAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if ((e.target as HTMLElement).closest('[data-timeline-block]')) return;
    const taskArea = taskAreaRef.current;
    if (!taskArea) return;
    const rect = taskArea.getBoundingClientRect();
    const scrollTop = scrollRef?.current?.scrollTop ?? 0;
    const time = yToTime(e.clientY, scrollTop, rect);
    setCreateTime(time);
  }, [yToTime, scrollRef]);

  const slots = useMemo(
    () => dayPlans[currentDate]?.slots ?? [],
    [dayPlans, currentDate],
  );

  const freeSlots = useMemo(
    () => computeFreeSlots(slots, tasks, config.dayStartHour, config.dayEndHour),
    [slots, tasks, config.dayStartHour, config.dayEndHour],
  );

  const totalHours  = config.dayEndHour - config.dayStartHour;
  const totalHeight = totalHours * HOUR_HEIGHT_PX;
  const hours       = Array.from({ length: totalHours + 1 }, (_, i) => config.dayStartHour + i);

  // useDroppable の ref と scrollRef を同じ要素にまとめる
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    setNodeRef(el);
    if (scrollRef && typeof scrollRef === 'object') {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  }, [setNodeRef, scrollRef]);

  return (
    <div
      ref={setContainerRef}
      className={cn(
        'h-full overflow-y-auto bg-white dark:bg-gray-900 transition-colors duration-100',
        isOver && 'bg-blue-50 dark:bg-blue-950/20',
      )}
    >
      <div className="relative flex" style={{ height: `${totalHeight}px`, minHeight: '100%' }}>

        {/* 時刻ラベル列 */}
        <div className="w-14 shrink-0 relative select-none">
          {hours.map(h => (
            <div
              key={h}
              className="absolute right-2 text-xs text-gray-400 dark:text-gray-500 font-mono"
              style={{ top: `${toTop(`${String(h).padStart(2, '0')}:00` as TimeString) - 8}px` }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* タスクエリア */}
        <div
          ref={taskAreaRef}
          onClick={handleAreaClick}
          className="flex-1 relative border-l border-gray-200 dark:border-gray-700"
        >

          {/* グリッド線（1時間ごと） */}
          {hours.map(h => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
              style={{ top: `${toTop(`${String(h).padStart(2, '0')}:00` as TimeString)}px` }}
            />
          ))}

          {/* 空き時間ブロック */}
          {freeSlots.map((slot, i) => (
            <FreeSlotBlock key={i} slot={slot} dayStartHour={config.dayStartHour} />
          ))}

          {/* タスクブロック */}
          {slots.map(slot => {
            const task = tasks.find(t => t.id === slot.taskId);
            if (!task) return null;
            return (
              <TaskBlock
                key={slot.taskId}
                task={task}
                slot={slot}
                dayStartHour={config.dayStartHour}
              />
            );
          })}

          {/* 現在時刻ライン */}
          <CurrentTimeLine dayStartHour={config.dayStartHour} />
        </div>
      </div>

      {/* タイムライン背景タップによるタスク作成 */}
      <TaskFormModal
        open={!!createTime}
        onClose={() => setCreateTime(null)}
        defaultDate={currentDate}
        defaultStartTime={createTime as TimeString ?? undefined}
      />
    </div>
  );
}
