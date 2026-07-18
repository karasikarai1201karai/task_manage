'use client';

import { create } from 'zustand';
import type { AppStore, Task, DayPlan, DateString, TimeString, StoredData } from '@/types';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { getStorageAdapter } from '@/lib/storage';
import { today, addMinutesToTime } from '@/lib/utils/time';
import { getRolledOverTasks } from '@/lib/utils/rollover';

export const useStore = create<AppStore>((set, get) => ({
  tasks: [],
  dayPlans: {},
  config: DEFAULT_CONFIG,
  currentDate: today(),
  isLoaded: false,

  loadFromStorage: async () => {
    const adapter = getStorageAdapter();
    const data = await adapter.load();

    const tasks = data.tasks ?? [];
    const dayPlans = (data.dayPlans ?? {}) as Record<string, DayPlan>;
    const config = { ...DEFAULT_CONFIG, ...(data.config ?? {}) };
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
    set(s => {
      const newDayPlans = Object.entries(s.dayPlans).reduce<Record<string, DayPlan>>(
        (acc, [date, plan]) => {
          acc[date] = { ...plan, slots: plan.slots.filter(sl => sl.taskId !== taskId) };
          return acc;
        },
        {}
      );
      return { tasks: s.tasks.filter(t => t.id !== taskId), dayPlans: newDayPlans };
    });
    get().saveToStorage();
  },

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
