import { format, parseISO, addDays } from 'date-fns';
import type { DateString, Task, DayPlan } from '@/types';

export function getRolledOverTasks(
  tasks: Task[],
  dayPlans: Record<string, DayPlan>,
  fromDate: DateString,
  toDate: DateString,
): Task[] {
  const rolledTasks: Task[] = [];
  let current = parseISO(fromDate);
  const to = parseISO(toDate);

  while (current < to) {
    const dateStr = format(current, 'yyyy-MM-dd') as DateString;
    const plan = dayPlans[dateStr];

    if (plan) {
      for (const slot of plan.slots) {
        const task = tasks.find(t => t.id === slot.taskId);
        if (!task || task.status === 'completed') continue;

        const alreadyRolled = tasks.some(
          t => t.rolledOverFrom === dateStr && t.title === task.title && t.status !== 'completed'
        );
        if (alreadyRolled) continue;

        rolledTasks.push({
          ...task,
          id: crypto.randomUUID(),
          status: 'pending',
          rolledOverFrom: dateStr,
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    current = addDays(current, 1);
  }

  return rolledTasks;
}
