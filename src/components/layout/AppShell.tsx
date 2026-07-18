'use client';

import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { InboxPanel } from '@/components/inbox/InboxPanel';
import { Timeline } from '@/components/timeline/Timeline';
import { useStore } from '@/store/appStore';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

export function AppShell() {
  const [activeTab,    setActiveTab]    = useState<'inbox' | 'timeline'>('timeline');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const tasks        = useStore(s => s.tasks);
  const config       = useStore(s => s.config);
  const currentDate  = useStore(s => s.currentDate);
  const scheduleTask = useStore(s => s.scheduleTask);

  const { yToTime } = useTimelineScale(config.dayStartHour);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const activeTask = activeTaskId
    ? (tasks.find(t => t.id === activeTaskId) ?? null)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.data.current?.taskId as string | undefined;
    setActiveTaskId(taskId ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over || over.id !== 'timeline-droppable') return;

    const taskId = active.data.current?.taskId as string | undefined;
    if (!taskId) return;

    const scrollEl = timelineScrollRef.current;
    if (!scrollEl) return;

    const rect       = scrollEl.getBoundingClientRect();
    const scrollTop  = scrollEl.scrollTop;
    const translated = active.rect.current.translated;
    if (!translated) return;

    const time = yToTime(translated.top, scrollTop, rect);
    scheduleTask(taskId, currentDate, time);
  }, [yToTime, currentDate, scheduleTask]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <InboxPanel />
          </aside>

          <main className="flex-1 overflow-hidden">
            <div className="md:hidden h-full">
              {activeTab === 'inbox'
                ? <InboxPanel />
                : <Timeline scrollRef={timelineScrollRef} />
              }
            </div>
            <div className="hidden md:block h-full">
              <Timeline scrollRef={timelineScrollRef} />
            </div>
          </main>
        </div>

        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <OverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function OverlayCard({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg border shadow-xl cursor-grabbing w-52 opacity-95 pointer-events-none',
        TASK_COLOR_MAP[task.color],
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{task.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 opacity-50" />
          <span className="text-xs opacity-60">{task.estimatedMinutes}分</span>
        </div>
      </div>
    </div>
  );
}
