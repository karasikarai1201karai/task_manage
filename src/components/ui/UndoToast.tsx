'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/appStore';

const UNDO_TIMEOUT_MS = 5000;

export function UndoToast() {
  const pendingDelete = useStore(s => s.pendingDelete);
  const undoDelete    = useStore(s => s.undoDelete);
  const commitDelete  = useStore(s => s.commitDelete);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (pendingDelete) {
      timerRef.current = setTimeout(() => {
        commitDelete();
        timerRef.current = null;
      }, UNDO_TIMEOUT_MS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pendingDelete, commitDelete]);

  if (!pendingDelete) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-full px-4 py-2.5 shadow-xl animate-in slide-in-from-bottom duration-200 whitespace-nowrap"
    >
      <span className="truncate max-w-48">
        「{pendingDelete.task.title}」を削除しました
      </span>
      <button
        onClick={undoDelete}
        className="font-semibold text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-700 transition-colors shrink-0"
      >
        元に戻す
      </button>
    </div>
  );
}
