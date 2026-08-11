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
  const [focusTaskId,     setFocusTaskId]     = useState<string | null>(null);

  const tasks    = useStore(s => s.tasks);
  const config   = useStore(s => s.config);
  const isLoaded = useStore(s => s.isLoaded);
  const addTask  = useStore(s => s.addTask);
  const updateTask   = useStore(s => s.updateTask);
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

  // 「今すぐ」: 最優先タスク1枚だけをオーバーレイ表示（課題の孤立提示）
  const handleNowClick = useCallback(() => {
    setActiveTab('today');
    const active = tasks
      .filter(t => t.status !== 'completed' && !t.isDeferred)
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.estimatedMinutes - b.estimatedMinutes);

    const target = active.find(t => t.status === 'in-progress') ?? active[0];
    if (!target) return;
    setFocusTaskId(target.id);
  }, [tasks]);

  const focusTask = focusTaskId ? tasks.find(t => t.id === focusTaskId) : null;

  // 「5分だけ始める」: 着手状態にして経過タイマーを開始し、リスト上でハイライト
  const handleStartFocus = useCallback(() => {
    if (!focusTaskId) return;
    updateTask(focusTaskId, { status: 'in-progress', startedAt: new Date().toISOString() });
    setFocusTaskId(null);
    setHighlightTaskId(focusTaskId);
    setTimeout(() => setHighlightTaskId(null), 2500);
  }, [focusTaskId, updateTask]);

  const todoCount = tasks.filter(t => t.status !== 'completed' && !t.isDeferred).length;

  return (
    <div className="app-viewport flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Header onSettingsClick={() => setSettingsOpen(true)} onNowClick={handleNowClick} />

      <main className="flex-1 overflow-hidden">
        {activeTab === 'today'
          ? <TodayView highlightTaskId={highlightTaskId} />
          : <LogView />
        }
      </main>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} todoCount={todoCount} />

      {/* フォーカスオーバーレイ: 「今はこれだけ」を1枚提示して着手障壁を下げる */}
      {focusTask && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setFocusTaskId(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
              今はこれだけ
            </p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 break-words">
              {focusTask.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              見積もり {focusTask.estimatedMinutes}分
            </p>
            <button
              onClick={handleStartFocus}
              className="w-full mt-5 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              ▶ 5分だけ始める
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              5分やって嫌ならやめてOK
            </p>
            <button
              onClick={() => setFocusTaskId(null)}
              className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[40px] px-4"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <UndoToast />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
