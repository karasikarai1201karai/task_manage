type Brand<T, B> = T & { readonly _brand: B };
export type TimeString = Brand<string, 'TimeString'>;
export type DateString = Brand<string, 'DateString'>;

export const TASK_COLORS = ['blue', 'green', 'yellow', 'red', 'purple', 'orange'] as const;
export type TaskColor = typeof TASK_COLORS[number];

export type TaskStatus   = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  status: TaskStatus;
  priority: TaskPriority;
  color: TaskColor;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  rolledOverFrom?: DateString;
}

export interface ScheduledSlot {
  taskId: string;
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
}

export interface DayPlan {
  date: DateString;
  slots: ScheduledSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface AppConfig {
  dayStartHour: number;
  dayEndHour: number;
  theme: 'light' | 'dark' | 'system';
  timeFormat: '12h' | '24h';
  defaultTaskDuration: number;
  autoRollover: boolean;
}

export interface AppStore {
  tasks: Task[];
  dayPlans: Record<string, DayPlan>;
  config: AppConfig;
  currentDate: DateString;
  isLoaded: boolean;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  scheduleTask: (taskId: string, date: DateString, startTime: TimeString) => void;
  unscheduleTask: (taskId: string, date: DateString) => void;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  rolloverIncompleteTasks: (fromDate: DateString, toDate: DateString) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  setCurrentDate: (date: DateString) => void;
}

export interface FreeSlot {
  startTime: TimeString;
  endTime: TimeString;
  durationMinutes: number;
}

export interface StoredData {
  schemaVersion: number;
  tasks: Task[];
  dayPlans: Record<string, DayPlan>;
  config: AppConfig;
  lastVisitedDate: string;
}
