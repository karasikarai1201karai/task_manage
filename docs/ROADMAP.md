# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

- [ ] 通知の許可が拒否されたときにフィードバックを出す: `SettingsModal.tsx` の `handleNotifyToggle` は `Notification.requestPermission()` が `'granted'` 以外を返した場合、何もメッセージを出さずトグルがOFFのまま戻る。ユーザーには「なぜONにならないのか」が分からない。→ 既存の `syncStatus` と同じパターンで、拒否時に「通知が許可されていません。ブラウザの設定から許可してください」等のメッセージを数秒間表示する

## M サイズ（1〜2時間）

（現在なし）

## L サイズ（複数サイクル）

（現在なし）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
