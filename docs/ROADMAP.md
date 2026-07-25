# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

- [ ] 【バグ修正・最優先】繰り返しタスクが日付送りで重複生成される問題を修正する: `AppShell.tsx` の定期タスク生成 useEffect が `materializeRecurringTasks(currentDate, ...)` と**閲覧中の日付**を渡しており、`recurring.ts` の `isTemplateDueOn` は `template.lastMaterialized === date` という**単一フィールドとの一致比較**でしか重複判定していない。そのため「前日」「翌日」ボタンで日付を行き来すると、訪れた日付ごとに毎回 `lastMaterialized` が上書きされ、過去に生成済みだった日付が「未生成」扱いに戻って再生成される（例: 今日→前日→今日、と辿ると今日分が重複生成される）。KV書き込み（`addTask`+`scheduleTask`）も伴うため無料枠消費にも影響する。
  - → `AppShell.tsx` の呼び出しを `materializeRecurringTasks(today(), addTask, scheduleTask)` に変更し、**閲覧中の日付にかかわらず実際の今日にのみ生成する**（結果として「当日になるまで生成されない」という挙動も自然に満たされる）
  - → `Task` に `materializedDate?: DateString` を追加し、`materializeRecurringTasks` で生成時に設定する。`isTemplateDueOn`/`getDueTemplates` に `tasks` 配列を渡すよう変更し、`tasks.some(t => t.recurringTemplateId === template.id && t.materializedDate === date)` で重複判定する（テンプレート側の `lastMaterialized` ではなく、KV同期される実際のタスク配列を正とする）
  - **補足**: 繰り返しテンプレート自体は端末ローカル（localStorage）管理・`lastMaterialized` も端末ごとに独立しているため、複数端末を使うユーザーは端末ごとに重複生成される可能性もある。上記のタスク配列ベースの判定に変更すればこの多端末重複も同時に解消する

## M サイズ（1〜2時間）

- [ ] 繰り返しタスクを「前回分が未完了なら次を生成しない」オプションを追加する: 上記バグ修正後の挙動は「当日になれば生成する」だが、ユーザーが対応しきれず未完了のまま溜まっていくケースがある。`RecurringTemplate` に `skipIfPrevIncomplete?: boolean` 等を追加し、ONの場合は「同テンプレートの直近のインスタンスが未完了（pending/in-progress）の間は新規生成をスキップする」ようにする。`TaskFormModal`/`RecurringTemplateEditModal`/`SettingsModal` にトグルを追加
- [ ] 「習慣タスク（都度タスク）」機能を追加する: 洗濯・皿洗いなど、カレンダー上の特定の日ではなく「完了したらまた次が現れる」時間指定不要の日常タスクを実装する。既存の繰り返しテンプレート機構を拡張する形で:
  - → `RecurrenceType` に `'onCompletion'` を追加（`weeklyDay`/`defaultStartTime` は基本的に使わない想定）
  - → `AppShell.tsx` に既存する「タスク完了を検知するuseEffect」（次タスクへのハイライト機能で使っているtasksの差分監視ロジック）を拡張し、完了したタスクが `recurringTemplateId` を持ち、そのテンプレートが `onCompletion` なら即座に新しいインスタンスを1件マテリアライズする（インボックスへ、未スケジュールで追加）
  - → テンプレート作成時や、対応するインスタンスが1件も存在しない場合（削除された等）にも1件だけ生成しておく
  - → `TaskFormModal`/`RecurringTemplateEditModal` の繰り返しパターン選択（毎日/平日のみ/毎週）に「習慣（完了したら次を生成）」を追加。この場合、開始時刻・曜日の入力は非表示にする
  - **重要**: この方式は完了イベントのみをトリガーにし、`isTemplateDueOn` の日付ベースの重複判定（1日1回制限）は通さない。そのため同日中に何度でも完了→次を生成を繰り返せる（例: 皿洗いを朝・昼・晩の3回完了させれば3回とも記録され、そのたびに次が現れる）。実装時に誤って1日1回に制限しないよう注意

## L サイズ（複数サイクル）

（現在なし）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
