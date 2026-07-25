'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { InboxPanel } from '@/components/inbox/InboxPanel';
import { Timeline } from '@/components/timeline/Timeline';
import { TrashDropZone } from '@/components/inbox/TrashDropZone';
import { UndoToast } from '@/components/ui/UndoToast';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useStore } from '@/store/appStore';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import { TASK_COLOR_MAP } from '@/lib/constants';
import { today, timeToMinutes } from '@/lib/utils/time';
import { materializeRecurringTasks } from '@/lib/utils/recurring';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TimeString } from '@/types';

export function AppShell() {
  const [activeTab,       setActiveTab]       = useState<'inbox' | 'timeline'>('timeline');
  const [activeTaskId,    setActiveTaskId]    = useState<string | null>(null);
  const [activeDragType,  setActiveDragType]  = useState<string | null>(null);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const tasks         = useStore(s => s.tasks);
  const dayPlans      = useStore(s => s.dayPlans);
  const config        = useStore(s => s.config);
  const currentDate   = useStore(s => s.currentDate);
  const isLoaded      = useStore(s => s.isLoaded);
  const addTask       = useStore(s => s.addTask);
  const scheduleTask  = useStore(s => s.scheduleTask);
  const deleteTask    = useStore(s => s.deleteTask);
  const setCurrentDate = useStore(s => s.setCurrentDate);

  const { yToTime, toTop } = useTimelineScale(config.dayStartHour);

  // 定期タスクのマテリアライズ（ロード完了後・日付切替のたびに今日分を生成）
  useEffect(() => {
    if (!isLoaded) return;
    materializeRecurringTasks(currentDate, addTask, scheduleTask);
  }, [isLoaded, currentDate, addTask, scheduleTask]);

  // 現在時刻へ自動スクロール（起動時のみ）
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` as TimeString;
    const y = toTop(timeStr);
    el.scrollTop = Math.max(0, y - 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // テーマをhtmlクラスに反映
  useEffect(() => {
    const apply = (theme: typeof config.theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };
    apply(config.theme);
    if (config.theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) =>
        document.documentElement.classList.toggle('dark', e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [config.theme]);

  // インボックス件数（今日未スケジュール・未完了）
  const todayScheduledIds = new Set((dayPlans[currentDate]?.slots ?? []).map(s => s.taskId));
  const inboxCount = tasks.filter(t => !todayScheduledIds.has(t.id) && t.status !== 'completed').length;

  // 「今すぐやること」: 今日の未完了タスクのうち現在時刻に最も近いものをハイライト＆スクロール
  const handleNowClick = useCallback(() => {
    const targetDate = today();
    if (currentDate !== targetDate) setCurrentDate(targetDate);
    setActiveTab('timeline');

    const plan = dayPlans[targetDate];
    if (!plan || plan.slots.length === 0) return;

    const nowMinutes = timeToMinutes(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` as TimeString,
    );

    let closestTaskId: string | null = null;
    let closestDiff = Infinity;
    plan.slots.forEach(slot => {
      const task = tasks.find(t => t.id === slot.taskId);
      if (!task || task.status === 'completed') return;
      const diff = Math.abs(timeToMinutes(slot.startTime) - nowMinutes);
      if (diff < closestDiff) { closestDiff = diff; closestTaskId = slot.taskId; }
    });
    if (!closestTaskId) return;

    setHighlightTaskId(closestTaskId);
    requestAnimationFrame(() => {
      const el = timelineScrollRef.current?.querySelector(`[data-task-id="${closestTaskId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setTimeout(() => setHighlightTaskId(null), 2500);
  }, [currentDate, dayPlans, tasks, setCurrentDate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const activeTask = activeTaskId
    ? (tasks.find(t => t.id === activeTaskId) ?? null)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.data.current?.taskId as string | undefined;
    const type   = event.active.data.current?.type   as string | undefined;
    setActiveTaskId(taskId ?? null);
    setActiveDragType(type ?? null);
  }, []);

  const resetDragState = useCallback(() => {
    setActiveTaskId(null);
    setActiveDragType(null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    resetDragState();
    const { active, over } = event;
    if (!over) return;

    const taskId = active.data.current?.taskId as string | undefined;
    if (!taskId) return;

    // ゴミ箱ゾーンへのドロップ → 削除
    if (over.id === 'trash-droppable') {
      deleteTask(taskId);
      return;
    }

    // タイムラインへのドロップ → スケジュール
    if (over.id === 'timeline-droppable') {
      const scrollEl = timelineScrollRef.current;
      if (!scrollEl) return;
      const rect       = scrollEl.getBoundingClientRect();
      const scrollTop  = scrollEl.scrollTop;
      const translated = active.rect.current.translated;
      if (!translated) return;
      const time = yToTime(translated.top, scrollTop, rect);
      scheduleTask(taskId, currentDate, time);
    }
  }, [yToTime, currentDate, scheduleTask, deleteTask, resetDragState]);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    resetDragState();
  }, [resetDragState]);

  // インボックスアイテムをドラッグ中のみゴミ箱を表示
  const showTrash = activeDragType === 'inbox';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Header onSettingsClick={() => setSettingsOpen(true)} onNowClick={handleNowClick} />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <InboxPanel />
          </aside>

          <main className="flex-1 overflow-hidden">
            <div className="md:hidden h-full">
              {activeTab === 'inbox'
                ? <InboxPanel />
                : <Timeline scrollRef={timelineScrollRef} highlightTaskId={highlightTaskId} />
              }
            </div>
            <div className="hidden md:block h-full">
              <Timeline scrollRef={timelineScrollRef} highlightTaskId={highlightTaskId} />
            </div>
          </main>
        </div>

        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} inboxCount={inboxCount} />
      </div>

      {/* ゴミ箱ドロップゾーン（インボックスアイテムのドラッグ中のみ表示） */}
      <TrashDropZone isVisible={showTrash} />

      <UndoToast />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
