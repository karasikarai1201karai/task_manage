# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

（現在なし）

## M サイズ（1〜2時間）

（現在なし）

## L サイズ（複数サイクル）

- [WIP] 定期タスク（繰り返し機能）: タスク作成時に「繰り返し」トグルを追加し、毎日 / 平日のみ / 毎週X曜日 のパターンで定期実行できるようにする。

  **重要な設計変更**: 元の実装メモは AppStore に addRecurringTemplate/deleteRecurringTemplate アクションを追加し、
  loadFromStorage/setCurrentDate 内で materialize を呼ぶ想定だったが、appStore.ts は変更禁止のため、
  以下の方式に変更した。次サイクルはこの方式を踏襲すること。

  - テンプレート定義は appStore/KV 同期を経由せず、`src/lib/utils/recurringStorage.ts` が
    localStorage キー `any-planner-recurring-templates` に直接読み書きする（端末ローカル、KV書き込み回数に影響しない）
  - マテリアライズされた実体タスク（Task）は既存の `addTask` / `scheduleTask` アクション経由で作成されるため、
    通常のタスクとして KV 同期・ロールオーバー対象になる（`recurringTemplateId` を持つものはロールオーバー除外済み）
  - マテリアライズの発火は appStore.ts 内ではなく `AppShell.tsx` の useEffect（`isLoaded` && `currentDate` 変化時）で行う

  **完了済み**:
  - [x] `types/index.ts` に `RecurringTemplate` / `RecurrenceType` / `Task.recurringTemplateId?` を追加
  - [x] `lib/utils/recurringStorage.ts`（load/add/delete/markMaterialized）
  - [x] `lib/utils/recurring.ts`（isTemplateDueOn / getDueTemplates / materializeRecurringTasks）
  - [x] `AppShell.tsx` に materialize 用 useEffect を配線
  - [x] `rollover.ts` で `recurringTemplateId` を持つタスクをロールオーバー除外

  **未着手（次サイクル）**:
  - [ ] `TaskFormModal.tsx` に「繰り返し」トグル＋パターン選択（毎日/平日のみ/毎週X曜日）UIを追加し、
        `addRecurringTemplate()` でテンプレートを保存 → 当日分を即時マテリアライズ
  - [ ] `SettingsModal.tsx` に「繰り返しタスク」セクションを追加（`loadRecurringTemplates()` で一覧表示・`deleteRecurringTemplate()` で削除）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
