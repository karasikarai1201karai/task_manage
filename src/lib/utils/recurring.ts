import { getDay, parseISO } from 'date-fns';
import type { DateString, RecurringTemplate, Task, TimeString } from '@/types';
import { loadRecurringTemplates } from './recurringStorage';

export function isTemplateDueOn(template: RecurringTemplate, date: DateString, tasks: Task[]): boolean {
  const alreadyMaterialized = tasks.some(
    t => t.recurringTemplateId === template.id && t.materializedDate === date
  );
  if (alreadyMaterialized) return false;

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
