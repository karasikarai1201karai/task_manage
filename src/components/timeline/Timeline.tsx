'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '@/store/appStore';
import { TaskBlock } from './TaskBlock';
import { FreeSlotBlock } from './FreeSlotBlock';
import { CurrentTimeLine } from './CurrentTimeLine';
import { HOUR_HEIGHT_PX, useTimelineScale } from '@/hooks/useTimelineScale';
import { computeFreeSlots } from '@/lib/utils/time';
import type { TimeString } from '@/types';

export function Timeline() {
  const tasks       = useStore(s => s.tasks);
  const dayPlans    = useStore(s => s.dayPlans);
  const config      = useStore(s => s.config);
  const currentDate = useStore(s => s.currentDate);
  const { toTop }   = useTimelineScale(config.dayStartHour);

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

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
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
        <div className="flex-1 relative border-l border-gray-200 dark:border-gray-700">

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
    </div>
  );
}
