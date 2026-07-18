import type { TimeString } from '@/types';

export const HOUR_HEIGHT_PX = 80;
export const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;

export function useTimelineScale(dayStartHour = 6) {
  const toTop = (timeStr: TimeString): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return ((h - dayStartHour) * 60 + m) * PX_PER_MINUTE;
  };

  const toHeight = (minutes: number): number => minutes * PX_PER_MINUTE;

  const yToTime = (
    clientY: number,
    scrollTop: number,
    rect: DOMRect
  ): TimeString => {
    const relY = clientY - rect.top + scrollTop;
    const totalMinutes = Math.max(0, relY / PX_PER_MINUTE);
    const snapped = Math.round(totalMinutes / 15) * 15;
    const h = Math.floor(snapped / 60) + dayStartHour;
    const m = snapped % 60;
    const clampedH = Math.min(23, Math.max(dayStartHour, h));
    return `${String(clampedH).padStart(2, '0')}:${String(m).padStart(2, '0')}` as TimeString;
  };

  return { toTop, toHeight, yToTime };
}
