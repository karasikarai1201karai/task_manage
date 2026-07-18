import { format } from 'date-fns';
import type { TimeString, DateString, ScheduledSlot, FreeSlot, Task } from '@/types';

export function timeToMinutes(time: TimeString): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): TimeString {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` as TimeString;
}

export function addMinutesToTime(time: TimeString, minutes: number): TimeString {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function diffMinutes(from: TimeString, to: TimeString): number {
  return timeToMinutes(to) - timeToMinutes(from);
}

export function today(): DateString {
  return format(new Date(), 'yyyy-MM-dd') as DateString;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function computeFreeSlots(
  slots: ScheduledSlot[],
  tasks: Task[],
  dayStartHour: number,
  dayEndHour: number,
): FreeSlot[] {
  const nowTime = format(new Date(), 'HH:mm') as TimeString;
  const dayStart = `${String(dayStartHour).padStart(2, '0')}:00` as TimeString;
  const dayEnd   = `${String(dayEndHour).padStart(2, '0')}:00` as TimeString;

  const sorted = [...slots].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const freeSlots: FreeSlot[] = [];
  let cursor: TimeString = nowTime > dayStart ? nowTime : dayStart;

  for (const slot of sorted) {
    const task = tasks.find(t => t.id === slot.taskId);
    if (task?.status === 'completed') continue;

    if (timeToMinutes(slot.startTime) > timeToMinutes(cursor)) {
      const duration = diffMinutes(cursor, slot.startTime);
      if (duration >= 10) {
        freeSlots.push({ startTime: cursor, endTime: slot.startTime, durationMinutes: duration });
      }
    }
    if (timeToMinutes(slot.endTime) > timeToMinutes(cursor)) {
      cursor = slot.endTime;
    }
  }

  if (timeToMinutes(dayEnd) > timeToMinutes(cursor)) {
    const duration = diffMinutes(cursor, dayEnd);
    if (duration >= 10) {
      freeSlots.push({ startTime: cursor, endTime: dayEnd, durationMinutes: duration });
    }
  }

  return freeSlots;
}
