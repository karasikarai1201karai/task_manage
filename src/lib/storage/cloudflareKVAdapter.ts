'use client';

import type { StorageAdapter } from './types';
import type { StoredData } from '@/types';
import { LocalStorageAdapter } from './localStorageAdapter';

// syncKey の SHA-256 ハッシュを 16 進数文字列で返す
async function sha256hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// keyHex を鍵として message に HMAC-SHA-256 を計算し 16 進数文字列で返す
async function hmacSHA256(keyHex: string, message: string): Promise<string> {
  const keyBytes = new Uint8Array(
    (keyHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class CloudflareKVAdapter implements StorageAdapter {
  private local = new LocalStorageAdapter();
  private _keyHash: string | null = null;

  constructor(
    private readonly syncKey: string,
    private readonly workerUrl: string,
  ) {}

  private async keyHash(): Promise<string> {
    if (!this._keyHash) this._keyHash = await sha256hex(this.syncKey);
    return this._keyHash;
  }

  async load(): Promise<Partial<StoredData>> {
    const localData = await this.local.load();
    try {
      const hash = await this.keyHash();
      const res = await fetch(`${this.workerUrl}/sync/${hash}`, {
        cache: 'no-store',
      });
      if (!res.ok) return localData; // 404 含む → ローカルにフォールバック
      const kvData = (await res.json()) as Partial<StoredData>;

      // KV が同じか新しい日付ならKVデータを採用
      if ((kvData.lastVisitedDate ?? '') >= (localData.lastVisitedDate ?? '')) {
        return {
          ...kvData,
          // syncKey / workerUrl はローカルのものを維持（クラウドには送っていない）
          config: {
            ...kvData.config,
            syncKey: localData.config?.syncKey ?? '',
            workerUrl: localData.config?.workerUrl ?? '',
          } as StoredData['config'],
        };
      }
    } catch {
      // ネットワークエラーはローカルにフォールバック
    }
    return localData;
  }

  async save(data: StoredData): Promise<void> {
    // 1. ローカルに即時保存（同期）
    await this.local.save(data);
    // 2. KV に非同期プッシュ（失敗しても動作継続）
    this.pushToKV(data).catch((err) => {
      console.warn('[sync] KV push failed:', err);
    });
  }

  private async pushToKV(data: StoredData): Promise<void> {
    const hash = await this.keyHash();
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = await hmacSHA256(hash, `${ts}:PUT:${hash}`);

    // syncKey / workerUrl はクラウドに送らない（セキュリティ）
    const sanitized: StoredData = {
      ...data,
      config: { ...data.config, syncKey: '', workerUrl: '' },
    };

    const res = await fetch(`${this.workerUrl}/sync/${hash}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Ts': ts,
        'X-Sync-Sig': sig,
      },
      body: JSON.stringify(sanitized),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

// 設定画面での接続テスト用
export async function testKVConnection(
  syncKey: string,
  workerUrl: string,
): Promise<'ok' | 'no_data' | 'error'> {
  if (!syncKey || !workerUrl) return 'error';
  try {
    const hash = await sha256hex(syncKey);
    const res = await fetch(`${workerUrl}/sync/${hash}`, { cache: 'no-store' });
    if (res.ok) return 'ok';
    if (res.status === 404) return 'no_data';
    return 'error';
  } catch {
    return 'error';
  }
}
