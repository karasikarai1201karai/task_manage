'use client';

import { useState } from 'react';
import { useTimelineScale } from '@/hooks/useTimelineScale';
import { formatDuration } from '@/lib/utils/time';
import { FreeSlotModal } from '@/components/modals/FreeSlotModal';
import { cn } from '@/lib/utils';
import type { FreeSlot } from '@/types';

interface FreeSlotBlockProps {
  slot: FreeSlot;
  dayStartHour: number;
}

export function FreeSlotBlock({ slot, dayStartHour }: FreeSlotBlockProps) {
  const { toTop, toHeight } = useTimelineScale(dayStartHour);
  const [modalOpen, setModalOpen] = useState(false);

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
    <>
      <div
        data-timeline-block
        role="button"
        tabIndex={0}
        aria-label={`空き ${formatDuration(slot.durationMinutes)} をタップしてタスクを配置`}
        onClick={() => setModalOpen(true)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setModalOpen(true)}
        className={cn(
          'absolute left-1 right-2 flex items-center justify-center select-none cursor-pointer',
          'hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10',
          'rounded transition-colors',
        )}
        style={{ top: `${top}px`, height: `${height}px` }}
      >
        <span className={cn('text-xs font-medium', colorClass)}>
          空き {formatDuration(slot.durationMinutes)}
        </span>
      </div>

      <FreeSlotModal
        slot={slot}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
