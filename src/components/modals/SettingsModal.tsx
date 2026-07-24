'use client';

import { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Sun, Moon, Monitor, Download, Upload, RefreshCw, Wifi } from 'lucide-react';
import { useStore } from '@/store/appStore';
import { getStorageAdapter } from '@/lib/storage';
import { testKVConnection } from '@/lib/storage/cloudflareKVAdapter';
import { cn } from '@/lib/utils';
import type { AppConfig, StoredData } from '@/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

function HourSelect({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="text-sm px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {HOUR_OPTIONS.filter(h => (min == null || h >= min) && (max == null || h <= max)).map(h => (
        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
      ))}
    </select>
  );
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const config          = useStore(s => s.config);
  const updateConfig    = useStore(s => s.updateConfig);
  const loadFromStorage = useStore(s => s.loadFromStorage);

  const set = (patch: Partial<AppConfig>) => updateConfig(patch);

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [syncStatus, setSyncStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const handleTestConnection = async () => {
    if (!config.syncKey || !config.workerUrl) {
      setSyncStatus('URLとキーを入力してください');
      return;
    }
    setSyncStatus('接続確認中…');
    const result = await testKVConnection(config.syncKey, config.workerUrl);
    if (result === 'error') setSyncStatus('接続失敗 — URLまたはキーを確認してください');
    else setSyncStatus('接続成功');
    setTimeout(() => setSyncStatus(''), 5000);
  };

  const handleSyncNow = async () => {
    if (!config.syncKey || !config.workerUrl) return;
    setSyncing(true);
    setSyncStatus('同期中…');
    await loadFromStorage();
    setSyncing(false);
    setSyncStatus('同期しました');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleExport = async () => {
    const data = await getStorageAdapter().load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `any-planner-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as StoredData;
      if (!Array.isArray(data.tasks) || !data.dayPlans) throw new Error('invalid');
      await getStorageAdapter().save(data);
      await loadFromStorage();
      setImportStatus('success');
    } catch {
      setImportStatus('error');
    } finally {
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />

        <Dialog.Content
          className={cn(
            'fixed z-50 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl',
            'left-1/2 -translate-x-1/2 bottom-0 rounded-t-2xl',
            'pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
            'animate-in slide-in-from-bottom duration-300',
          )}
          aria-describedby={undefined}
        >
          {/* ドラッグインジケーター */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="px-6 pt-2 max-h-[80vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
                設定
              </Dialog.Title>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* テーマ */}
            <section className="mb-5">
              <SectionLabel>テーマ</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'light',  label: 'ライト',   Icon: Sun },
                    { value: 'dark',   label: 'ダーク',   Icon: Moon },
                    { value: 'system', label: 'システム', Icon: Monitor },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => set({ theme: value })}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all',
                      config.theme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* 稼働時間 */}
            <section className="mb-5">
              <SectionLabel>稼働時間</SectionLabel>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow label="開始時刻">
                  <HourSelect
                    value={config.dayStartHour}
                    min={0}
                    max={config.dayEndHour - 1}
                    onChange={v => set({ dayStartHour: v })}
                  />
                </SettingRow>
                <SettingRow label="終了時刻">
                  <HourSelect
                    value={config.dayEndHour}
                    min={config.dayStartHour + 1}
                    max={23}
                    onChange={v => set({ dayEndHour: v })}
                  />
                </SettingRow>
              </div>
            </section>

            {/* タスク設定 */}
            <section className="mb-5">
              <SectionLabel>タスク</SectionLabel>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                <SettingRow label="デフォルト時間">
                  <select
                    value={config.defaultTaskDuration}
                    onChange={e => set({ defaultTaskDuration: Number(e.target.value) })}
                    className="text-sm px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>{d}分</option>
                    ))}
                  </select>
                </SettingRow>
              </div>
            </section>

            {/* 自動繰越 */}
            <section className="mb-5">
              <SectionLabel>繰越</SectionLabel>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                <SettingRow label="未完了タスクを翌日に自動繰越">
                  <Toggle
                    checked={config.autoRollover}
                    onChange={v => set({ autoRollover: v })}
                  />
                </SettingRow>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 px-1">
                アプリを開いた際、前日の未完了タスクをインボックスに追加します
              </p>
            </section>

            {/* 同期 */}
            <section className="mb-5">
              <SectionLabel>端末間同期</SectionLabel>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Workers URL
                  </label>
                  <input
                    type="url"
                    value={config.workerUrl}
                    onChange={e => set({ workerUrl: e.target.value })}
                    placeholder="https://any-planner-sync.xxxx.workers.dev"
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    同期キー
                  </label>
                  <input
                    type="password"
                    value={config.syncKey}
                    onChange={e => set({ syncKey: e.target.value })}
                    placeholder="12文字以上のパスフレーズ"
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {config.syncKey.length > 0 && config.syncKey.length < 12 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      ⚠ 12文字以上のキーを推奨します
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleTestConnection}
                  disabled={!config.syncKey || !config.workerUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  接続テスト
                </button>
                <button
                  onClick={handleSyncNow}
                  disabled={!config.syncKey || !config.workerUrl || syncing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
                  今すぐ同期
                </button>
              </div>
              {syncStatus && (
                <p className={cn(
                  'text-xs mt-2 text-center',
                  syncStatus.includes('失敗') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400',
                )}>
                  {syncStatus}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 px-1">
                同じキーを別の端末に入力すると自動的に同期します
              </p>
            </section>

            {/* データ */}
            <section className="mb-2">
              <SectionLabel>データ</SectionLabel>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  エクスポート
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  インポート
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              {importStatus === 'success' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                  データをインポートしました
                </p>
              )}
              {importStatus === 'error' && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">
                  ファイルを読み込めませんでした
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 px-1">
                別の端末へデータを移行する際に使用します
              </p>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
