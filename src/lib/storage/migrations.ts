import type { StoredData } from '@/types';

export function runMigrations(data: StoredData, targetVersion: number): StoredData {
  // v1 is the initial version — add future migration steps here
  return { ...data, schemaVersion: targetVersion };
}
