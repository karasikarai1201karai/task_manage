import { getDay, parseISO } from 'date-fns';
import type { DateString, RecurringTemplate, Task, TimeString } from '@/types';
import { loadRecurringTemplates, markTemplateMaterialized } from './recurringStorage';

export function isTemplateDueOn(template: RecurringTemplate, date: DateString): boolean {
  if (template.lastMaterialized === date) return false;
  const dayOfWeek = getDay(parseISO(date));
  switch (template.recurrenceType) {
    case 'daily':    return true;
    case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':   return template.weeklyDay === dayOfWeek;
    default:         return false;
  }
}

export function getDueTemplates(templates: RecurringTemplate[], date: DateString): RecurringTemplate[] {
  return templates.filter(t => isTemplateDueOn(t, date));
}

export function materializeRecurringTasks(
  date: DateString,
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void,
  scheduleTask: (taskId: string, date: DateString, startTime: TimeString) => void,
): void {
  const due = getDueTemplates(loadRecurringTemplates(), date);
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
    });
    if (template.defaultStartTime) {
      scheduleTask(taskId, date, template.defaultStartTime);
    }
    markTemplateMaterialized(template.id, date);
  });
}
