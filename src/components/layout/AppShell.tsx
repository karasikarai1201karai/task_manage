'use client';

import { useState } from 'react';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';
import { InboxPanel } from '@/components/inbox/InboxPanel';
import { Timeline } from '@/components/timeline/Timeline';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'timeline'>('timeline');

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <InboxPanel />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {/* Mobile: tab-driven */}
          <div className="md:hidden h-full">
            {activeTab === 'inbox' ? <InboxPanel /> : <Timeline />}
          </div>
          {/* Desktop: always show timeline */}
          <div className="hidden md:block h-full">
            <Timeline />
          </div>
        </main>
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
