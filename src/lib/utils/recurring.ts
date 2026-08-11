import { format, getDay, parseISO, subDays } from 'date-fns';
import type { DateString, RecurrenceType, RecurringTemplate, Task, TimeString } from '@/types';
import { loadRecurringTemplates } from './recurringStorage';

export function isTemplateDueOn(template: RecurringTemplate, date: DateString, tasks: Task[]): boolean {
  const alreadyMaterialized = tasks.some(
    t => t.recurringTemplateId === template.id && t.materializedDate === date
  );
  if (alreadyMaterialized) return false;

  if (template.skipIfPrevIncomplete) {
    const hasIncompletePrev = tasks.some(
      t => t.recurringTemplateId === template.id && t.status !== 'completed'
    );
    if (hasIncompletePrev) return false;
  }

  const dayOfWeek = getDay(parseISO(date));
  switch (template.recurrenceType) {
    case 'daily':    return true;
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':   return template.weeklyDay === dayOfWeek;
    default:         return false;
  }
}

export function getDueTemplates(templates: RecurringTemplate[], date: DateString, tasks: Task[]): RecurringTemplate[] {
  return templates.filter(t => isTemplateDueOn(t, date, tasks));
}

/**
 * 定期タスクの連続達成数を返す。
 * daily/onCompletion: 連続日数、weekdays: 土日を除いた連続日数、weekly: 連続週数。
 * 今日の分が未完了でもストリークは途切れていないとみなす（前回分から数える）。
 */
export function getTemplateStreak(
  templateId: string,
  tasks: Task[],
  recurrenceType: RecurrenceType,
  todayStr: DateString,
): number {
  const doneDates = new Set(
    tasks
      .filter(t => t.recurringTemplateId === templateId && t.status === 'completed' && t.completedAt)
      .map(t => t.completedAt!.slice(0, 10)),
  );
  if (doneDates.size === 0) return 0;

  const step = (d: Date): Date => {
    if (recurrenceType === 'weekly') return subDays(d, 7);
    if (recurrenceType === 'weekdays') {
      let p = subDays(d, 1);
      while (getDay(p) === 0 || getDay(p) === 6) p = subDays(p, 1);
      return p;
    }
    return subDays(d, 1);
  };

  let cur = parseISO(todayStr);
  if (!doneDates.has(format(cur, 'yyyy-MM-dd'))) cur = step(cur);

  let count = 0;
  while (doneDates.has(format(cur, 'yyyy-MM-dd'))) {
    count++;
    cur = step(cur);
  }
  return count;
}

export function materializeRecurringTasks(
  date: DateString,
  tasks: Task[],
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void,
  scheduleTask: (taskId: string, date: DateString, startTime: TimeString) => void,
): void {
  const due = getDueTemplates(loadRecurringTemplates(), date, tasks);
  due.forEach(template => {
    const taskId = crypto.randomUUID();
    addTask({
      id: taskId,
      title: template.title,
      estimatedMinutes: template.estimatedMinutes,
      color: template.color,
      status: 'pending',
      priority: template.priority,
      tags: template.tags,
      recurringTemplateId: template.id,
      materializedDate: date,
    });
    if (template.defaultStartTime) {
      scheduleTask(taskId, date, template.defaultStartTime);
    }
  });
}

// 習慣タスク（onCompletion）: 完了イベントのみをトリガーにするため日付ベースの重複判定を通さない
export function hasActiveInstance(templateId: string, tasks: Task[]): boolean {
  return tasks.some(t => t.recurringTemplateId === templateId && t.status !== 'completed');
}

export function materializeOnCompletionTask(
  template: RecurringTemplate,
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void,
): void {
  addTask({
    id: crypto.randomUUID(),
    title: template.title,
    estimatedMinutes: template.estimatedMinutes,
    color: template.color,
    status: 'pending',
    priority: template.priority,
    tags: template.tags,
    recurringTemplateId: template.id,
  });
}
