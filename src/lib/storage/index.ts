import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './localStorageAdapter';

let adapter: StorageAdapter = new LocalStorageAdapter();

export const getStorageAdapter = (): StorageAdapter => adapter;
export const setStorageAdapter = (a: StorageAdapter): void => { adapter = a; };
