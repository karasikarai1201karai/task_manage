'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './Header';
import { MobileTabBar, type AppTab } from './MobileTabBar';
import { TodayView } from '@/components/today/TodayView';
import { LogView } from '@/components/log/LogView';
import { UndoToast } from '@/components/ui/UndoToast';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useStore } from '@/store/appStore';
import { PRIORITY_RANK } from '@/lib/constants';
import { today } from '@/lib/utils/time';
import { materializeRecurringTasks, materializeOnCompletionTask, hasActiveInstance } from '@/lib/utils/recurring';
import { loadRecurringTemplates } from '@/lib/utils/recurringStorage';

export function AppShell() {
  const [activeTab,       setActiveTab]       = useState<AppTab>('today');
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);

  const tasks    = useStore(s => s.tasks);
  const config   = useStore(s => s.config);
  const isLoaded = useStore(s => s.isLoaded);
  const addTask  = useStore(s => s.addTask);
  const scheduleTask = useStore(s => s.scheduleTask);

  // 定期タスクのマテリアライズ
  useEffect(() => {
    if (!isLoaded) return;
    materializeRecurringTasks(today(), tasks, addTask, scheduleTask);
    loadRecurringTemplates()
      .filter(t => t.recurrenceType === 'onCompletion')
      .forEach(t => {
        if (!hasActiveInstance(t.id, tasks)) materializeOnCompletionTask(t, addTask);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, addTask, scheduleTask]);

  // テーマ反映
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

  // 習慣タスク完了検知 → 次インスタンスを即時生成
  const prevTasksRef = useRef(tasks);
  useEffect(() => {
    const prevTasks = prevTasksRef.current;
    const newlyCompleted = tasks.filter(t => {
      if (!t.recurringTemplateId || t.status !== 'completed') return false;
      const prev = prevTasks.find(p => p.id === t.id);
      return prev && prev.status !== 'completed';
    });
    prevTasksRef.current = tasks;
    if (newlyCompleted.length === 0) return;

    const templates = loadRecurringTemplates();
    newlyCompleted.forEach(task => {
      const tpl = templates.find(t => t.id === task.recurringTemplateId && t.recurrenceType === 'onCompletion');
      if (tpl) materializeOnCompletionTask(tpl, addTask);
    });
  }, [tasks, addTask]);

  // 「今すぐ」: 優先度が最も高い未完了タスクをハイライト
  const handleNowClick = useCallback(() => {
    setActiveTab('today');
    const active = tasks
      .filter(t => t.status !== 'completed' && !t.isDeferred)
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.estimatedMinutes - b.estimatedMinutes);

    const target = active.find(t => t.status === 'in-progress') ?? active[0];
    if (!target) return;

    setHighlightTaskId(target.id);
    setTimeout(() => setHighlightTaskId(null), 2500);
  }, [tasks]);

  const todoCount = tasks.filter(t => t.status !== 'completed' && !t.isDeferred).length;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Header onSettingsClick={() => setSettingsOpen(true)} onNowClick={handleNowClick} />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'today'
          ? <TodayView highlightTaskId={highlightTaskId} />
          : <LogView />
        }
      </main>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} todoCount={todoCount} />

      <UndoToast />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
