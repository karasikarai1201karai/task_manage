'use client';

import { create } from 'zustand';
import type { AppStore, Task, DayPlan, DateString, TimeString, StoredData, ScheduledSlot } from '@/types';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { getStorageAdapter, setStorageAdapter } from '@/lib/storage';
import { LocalStorageAdapter } from '@/lib/storage/localStorageAdapter';
import { CloudflareKVAdapter } from '@/lib/storage/cloudflareKVAdapter';
import { today, addMinutesToTime } from '@/lib/utils/time';
import { getRolledOverTasks } from '@/lib/utils/rollover';

export const useStore = create<AppStore>((set, get) => ({
  tasks: [],
  dayPlans: {},
  config: DEFAULT_CONFIG,
  currentDate: today(),
  isLoaded: false,
  pendingDelete: null,

  loadFromStorage: async () => {
    // フェーズ1: localStorage から読んで syncKey / workerUrl を確認
    const localAdapter = new LocalStorageAdapter();
    const localData = await localAdapter.load();
    const localConfig = { ...DEFAULT_CONFIG, ...(localData.config ?? {}) };

    // フェーズ2: syncKey が設定されていれば KV アダプターに切り替え
    let data = localData;
    if (localConfig.syncKey && localConfig.workerUrl) {
      const kvAdapter = new CloudflareKVAdapter(localConfig.syncKey, localConfig.workerUrl);
      setStorageAdapter(kvAdapter);
      data = await kvAdapter.load();
    } else {
      setStorageAdapter(localAdapter);
    }

    const tasks = data.tasks ?? [];
    const dayPlans = (data.dayPlans ?? {}) as Record<string, DayPlan>;
    // syncKey / workerUrl はローカルの値を優先（KV には送っていないため）
    const config = {
      ...DEFAULT_CONFIG,
      ...(data.config ?? {}),
      syncKey: localConfig.syncKey,
      workerUrl: localConfig.workerUrl,
    };
    const lastVisitedDate = data.lastVisitedDate ?? today();

    set({ tasks, dayPlans, config, isLoaded: true });

    if (config.autoRollover && lastVisitedDate < today()) {
      const rolledTasks = getRolledOverTasks(
        tasks,
        dayPlans,
        lastVisitedDate as DateString,
        today(),
      );
      if (rolledTasks.length > 0) {
        set(s => ({ tasks: [...s.tasks, ...rolledTasks] }));
      }
    }

    await get().saveToStorage();
  },

  saveToStorage: async () => {
    const { tasks, dayPlans, config } = get();
    const data: StoredData = {
      schemaVersion: 1,
      tasks,
      dayPlans,
      config,
      lastVisitedDate: today(),
    };
    await getStorageAdapter().save(data);
  },

  addTask: (taskData) => {
    const task: Task = {
      ...taskData,
      id: taskData.id ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(s => ({ tasks: [...s.tasks, task] }));
    get().saveToStorage();
  },

  updateTask: (taskId, updates) => {
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    get().saveToStorage();
  },

  deleteTask: (taskId) => {
    const { tasks, dayPlans } = get();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const slots: Record<string, ScheduledSlot[]> = {};
    Object.entries(dayPlans).forEach(([date, plan]) => {
      const taskSlots = plan.slots.filter(sl => sl.taskId === taskId);
      if (taskSlots.length > 0) slots[date] = taskSlots;
    });

    set(s => {
      const newDayPlans = Object.entries(s.dayPlans).reduce<Record<string, DayPlan>>(
        (acc, [date, plan]) => {
          acc[date] = { ...plan, slots: plan.slots.filter(sl => sl.taskId !== taskId) };
          return acc;
        },
        {}
      );
      return { tasks: s.tasks.filter(t => t.id !== taskId), dayPlans: newDayPlans, pendingDelete: { task, slots } };
    });
    get().saveToStorage();
  },

  undoDelete: () => {
    const { pendingDelete } = get();
    if (!pendingDelete) return;
    const { task, slots } = pendingDelete;
    set(s => {
      const newDayPlans = { ...s.dayPlans };
      Object.entries(slots).forEach(([date, taskSlots]) => {
        const existing = newDayPlans[date];
        if (existing) {
          newDayPlans[date] = { ...existing, slots: [...existing.slots, ...taskSlots], updatedAt: new Date().toISOString() };
        }
      });
      return { tasks: [...s.tasks, task], dayPlans: newDayPlans, pendingDelete: null };
    });
    get().saveToStorage();
  },

  commitDelete: () => set({ pendingDelete: null }),

  scheduleTask: (taskId, date, startTime) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const endTime = addMinutesToTime(startTime, task.estimatedMinutes);
    const slot = { taskId, date, startTime, endTime };

    set(s => {
      const existing = s.dayPlans[date];
      const slots = existing
        ? [...existing.slots.filter(sl => sl.taskId !== taskId), slot]
        : [slot];
      return {
        dayPlans: {
          ...s.dayPlans,
          [date]: {
            date,
            slots,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    get().saveToStorage();
  },

  unscheduleTask: (taskId, date) => {
    set(s => {
      const plan = s.dayPlans[date];
      if (!plan) return s;
      return {
        dayPlans: {
          ...s.dayPlans,
          [date]: { ...plan, slots: plan.slots.filter(sl => sl.taskId !== taskId), updatedAt: new Date().toISOString() },
        },
      };
    });
    get().saveToStorage();
  },

  completeTask: (taskId) => {
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    get().saveToStorage();
  },

  uncompleteTask: (taskId) => {
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'pending', completedAt: undefined, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    get().saveToStorage();
  },

  rolloverIncompleteTasks: (fromDate, toDate) => {
    const { tasks, dayPlans } = get();
    const rolledTasks = getRolledOverTasks(tasks, dayPlans, fromDate, toDate);
    if (rolledTasks.length > 0) {
      set(s => ({ tasks: [...s.tasks, ...rolledTasks] }));
      get().saveToStorage();
    }
  },

  updateConfig: (config) => {
    set(s => ({ config: { ...s.config, ...config } }));
    get().saveToStorage();
  },

  setCurrentDate: (date) => set({ currentDate: date }),
}));
