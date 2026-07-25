# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

- [ ] タスク完了時に軽い振動フィードバックを追加する（`InboxTaskCard.tsx` の長押し時と同様に `navigator.vibrate?.(...)` を `TaskBlock.tsx` の `completeTask` 呼び出し時にも追加）

## M サイズ（1〜2時間）

- [ ] 繰り返しタスクのテンプレート編集機能: `SettingsModal.tsx` の繰り返しタスク一覧から既存テンプレートを編集できるようにする（現状は削除のみ）。`TaskEditModal.tsx` に近いUIを流用し、`recurringStorage.ts` に `updateRecurringTemplate()` を追加

## L サイズ（複数サイクル）

（現在なし）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
