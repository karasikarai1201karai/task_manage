'use client';

import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrashDropZoneProps {
  isVisible: boolean;
}

export function TrashDropZone({ isVisible }: TrashDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-droppable' });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3',
        'transition-transform duration-250 ease-out',
        isOver
          ? 'bg-red-500'
          : 'bg-red-400',
      )}
      style={{
        height: 'calc(5rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <Trash2
        className="text-white transition-transform duration-150"
        style={{
          width: 24, height: 24,
          transform: isOver ? 'scale(1.3)' : 'scale(1)',
        }}
      />
      <span className="text-sm font-semibold text-white select-none">
        {isOver ? 'はなして削除' : 'ここにドロップして削除'}
      </span>
    </div>
  );
}
