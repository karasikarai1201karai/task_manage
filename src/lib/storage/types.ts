import type { StoredData } from '@/types';

export interface StorageAdapter {
  load(): Promise<Partial<StoredData>>;
  save(data: StoredData): Promise<void>;
}
