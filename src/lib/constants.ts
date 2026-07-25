import type { AppConfig, TaskColor, TaskPriority } from '@/types';

export const DEFAULT_CONFIG: AppConfig = {
  dayStartHour: 6,
  dayEndHour: 22,
  theme: 'system',
  timeFormat: '24h',
  defaultTaskDuration: 30,
  autoRollover: true,
  syncKey: '',
  workerUrl: '',
};

export const TASK_COLOR_MAP: Record<TaskColor, string> = {
  blue:   'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100',
  green:  'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100',
  yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-100',
  red:    'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-100',
  purple: 'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-100',
  orange: 'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-100',
};

export const TASK_COLOR_DOT: Record<TaskColor, string> = {
  blue:   'bg-blue-400',
  green:  'bg-green-400',
  yellow: 'bg-yellow-400',
  red:    'bg-red-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
};

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_BAR_COLOR: Record<TaskPriority, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-gray-300 dark:bg-gray-600',
};
