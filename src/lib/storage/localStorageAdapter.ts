import type { StorageAdapter } from './types';
import type { StoredData } from '@/types';
import { runMigrations } from './migrations';

const KEY = 'any-planner-v1';
const SCHEMA_VERSION = 1;

export class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<Partial<StoredData>> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const data = JSON.parse(raw) as StoredData;
      if (data.schemaVersion !== SCHEMA_VERSION) {
        return runMigrations(data, SCHEMA_VERSION);
      }
      return data;
    } catch {
      return {};
    }
  }

  async save(data: StoredData): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION }));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }
}
