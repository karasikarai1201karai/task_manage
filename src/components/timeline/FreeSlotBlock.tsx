import { useTimelineScale } from '@/hooks/useTimelineScale';
import { formatDuration } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { FreeSlot } from '@/types';

interface FreeSlotBlockProps {
  slot: FreeSlot;
  dayStartHour: number;
}

export function FreeSlotBlock({ slot, dayStartHour }: FreeSlotBlockProps) {
  const { toTop, toHeight } = useTimelineScale(dayStartHour);

  const top    = toTop(slot.startTime);
  const height = toHeight(slot.durationMinutes);

  if (height < 18) return null;

  const colorClass =
    slot.durationMinutes >= 60
      ? 'text-green-600 dark:text-green-400'
      : slot.durationMinutes >= 30
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-500 dark:text-red-400';

  return (
    <div
      className="absolute left-1 right-2 flex items-center justify-center pointer-events-none select-none"
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <span className={cn('text-xs font-medium', colorClass)}>
        空き {formatDuration(slot.durationMinutes)}
      </span>
    </div>
  );
}
