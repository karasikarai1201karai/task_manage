# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

### ADHD臨床レビューより（general-purposeエージェントによるコードベース精査済み）

- [ ] タスク作成モーダルの決断項目を減らす: `TaskFormModal.tsx` はタイトル・所要時間・色・繰り返し・追加先・開始時刻を一度に選ばせる構成になっており、着手前の決断疲れ（task-initiation paralysis）を招きやすい。→ 色選択と繰り返し設定を初期状態で折りたたんだ「詳細設定」に格納し、主経路をタイトル＋所要時間＋送信のみにする

## M サイズ（1〜2時間）

- [ ] 繰り返しタスクのテンプレート編集機能: `SettingsModal.tsx` の繰り返しタスク一覧から既存テンプレートを編集できるようにする（現状は削除のみ）。`TaskEditModal.tsx` に近いUIを流用し、`recurringStorage.ts` に `updateRecurringTemplate()` を追加
- [ ] インボックスに「クイック追加」入力欄を追加する: `InboxPanel.tsx` の上部にタイトルのみ入力してEnterで即座にインボックスへ追加できる軽量な入力欄を置く（所要時間はconfigのデフォルト値、色はデフォルト、優先度は'medium'）。時間や色などの詳細調整は既存のドラッグ配置／長押しのクイックスケジュール（`QuickScheduleModal.tsx`）／編集アイコン（`TaskEditModal.tsx`）で後から行う運用とする

### ADHD臨床レビューより（general-purposeエージェントによるコードベース精査済み）

- [ ] 繰越タスクに「今日はやらない」アクションを追加する: `rollover.ts` の `getRolledOverTasks` は未完了タスクを無期限に繰り越し続け、削除以外に手放す手段がない。先延ばしが繰り返されやすいADHDにおいて、失敗が延々と再表示される罪悪感の温床になる。→ `deleteTask` とは別に、以後の繰越対象から外す（繰越を止めるが削除はしない）アクションを追加し、あわせて `InboxPanel.tsx` で数日以上前からの繰越タスクは折りたたみグループ表示にする
- [ ] 「進行中(in-progress)」状態をUIで使えるようにする: `types/index.ts` の `TaskStatus` に `'in-progress'` が定義済みだが、`completeTask`/`uncompleteTask` は pending↔completed の切り替えのみでUIからも一切呼ばれていない。完璧に終わらないと0点という all-or-nothing 思考を助長しかねない。→ `TaskBlock.tsx` にチェックとは別の「着手」操作（長押しや2つ目のアイコン）を追加し、`status: 'in-progress'` を設定・部分的な取り組みを示す見た目（左端バー等）を出す
- [ ] タスク開始時刻の通知を追加する: `CurrentTimeLine.tsx` は「現在時刻」の線を描画するだけで、スケジュールされたタスクの開始時刻が来ても何も知らせない。時間感覚が乏しくなりやすいADHDでは、この瞬間の通知が特に重要。→ 既存の60秒間隔更新にあわせて今日のスロットのstartTimeと現在時刻を比較し、一致したらブラウザNotification API + `navigator.vibrate` で知らせる。オプトイン許可トグルを `SettingsModal.tsx` に追加。**制約**: 静的サイトでpushサーバーがないため、タブを開いている間のみ有効（バックグラウンド通知は不可）
- [ ] タスク完了後に次のタスクへの導線を出す: 完了アニメーションはあるが、その勢いを次のタスクに繋げる仕組みがない。→ `completeTask` 呼び出し直後、既存の `handleNowClick`（`AppShell.tsx`）と同じロジックで次の未完了タスクを数秒間ハイライト表示する（画面遷移はしない）

## L サイズ（複数サイクル）

（現在なし）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
