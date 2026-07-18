'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/appStore';
import { AppShell } from '@/components/layout/AppShell';
import { TimelineSkeleton } from '@/components/timeline/TimelineSkeleton';
import { today } from '@/lib/utils/time';

export default function Page() {
  const isLoaded        = useStore(s => s.isLoaded);
  const loadFromStorage = useStore(s => s.loadFromStorage);
  const setCurrentDate  = useStore(s => s.setCurrentDate);

  useEffect(() => {
    loadFromStorage();

    const handleVisibility = () => {
      if (!document.hidden) setCurrentDate(today());
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoaded) return <TimelineSkeleton />;
  return <AppShell />;
}
