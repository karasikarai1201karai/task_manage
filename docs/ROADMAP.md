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

- [ ] 定期タスク（繰り返し機能）: タスク作成時に「繰り返し」トグルを追加し、毎日 / 平日のみ / 毎週X曜日 のパターンで定期実行できるようにする。実装の詳細は以下を参照
  ```
  【データモデル】
  - RecurringTemplate { id, title, estimatedMinutes, color, priority, tags,
                        recurrenceType: 'daily'|'weekdays'|'weekly',
                        weeklyDay?: 0-6, defaultStartTime?, createdAt, lastMaterialized? }
  - Task に recurringTemplateId?: string を追加
  - StoredData に recurringTemplates?: RecurringTemplate[] を追加
  - AppStore に addRecurringTemplate / deleteRecurringTemplate アクションを追加

  【マテリアライズ】
  - loadFromStorage と setCurrentDate の中で materializeForDate(templates, date) を呼ぶ
  - lastMaterialized === date ならスキップ（二重作成防止）
  - 繰り返しタスクは rollover.ts でロールオーバー除外（recurringTemplateId があるものをスキップ）

  【UI】
  - TaskFormModal に「繰り返し」トグル＋パターン選択を追加
  - SettingsModal に「繰り返しタスク」セクションを追加（テンプレート一覧・削除ボタン）

  【注意】appStore.ts は慎重に変更すること
  ```

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
