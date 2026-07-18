'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import type { TimeString } from '@/types';

interface CurrentTimeLineProps {
  dayStartHour: number;
}

export function CurrentTimeLine({ dayStartHour }: CurrentTimeLineProps) {
  const [now, setNow] = useState<Date | null>(null);
  const { toTop } = useTimelineScale(dayStartHour);

  useEffect(() => {
    setNow(new Date());
    const msToNextMinute = 60000 - (Date.now() % 60000);
    let intervalId: ReturnType<typeof setInterval>;

    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 60000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  if (!now) return null;

  const timeStr = format(now, 'HH:mm') as TimeString;
  const top = toTop(timeStr);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}
