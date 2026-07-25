import type { DateString, RecurringTemplate } from '@/types';

const STORAGE_KEY = 'any-planner-recurring-templates';

export function loadRecurringTemplates(): RecurringTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecurringTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveRecurringTemplates(templates: RecurringTemplate[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function addRecurringTemplate(template: RecurringTemplate): RecurringTemplate[] {
  const templates = [...loadRecurringTemplates(), template];
  saveRecurringTemplates(templates);
  return templates;
}

export function deleteRecurringTemplate(id: string): RecurringTemplate[] {
  const templates = loadRecurringTemplates().filter(t => t.id !== id);
  saveRecurringTemplates(templates);
  return templates;
}

export function markTemplateMaterialized(id: string, date: DateString): void {
  const templates = loadRecurringTemplates().map(t =>
    t.id === id ? { ...t, lastMaterialized: date } : t
  );
  saveRecurringTemplates(templates);
}
