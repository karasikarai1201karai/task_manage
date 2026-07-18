export function TimelineSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 animate-pulse">
      <div className="h-14 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800" />
        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
