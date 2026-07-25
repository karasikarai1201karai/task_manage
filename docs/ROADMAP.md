# Any Planner — ROADMAP

AIへ: このファイルから **未着手のタスクを1つ** 選んで実装してください。
完了後は `docs/roadmap-done.md` に移動し、このファイルから削除してください。
作業開始時は `[WIP]` マーク、詰まった場合は `[BLOCKED]` を付けてください。

---

## S サイズ（30分以内・最優先）

- [ ] 【バグ修正】タイムラインのscrollRef共有バグを修正する: `AppShell.tsx` はモバイル用・デスクトップ用の2つの `<Timeline>` を常にDOMにマウントしており（Tailwindの `md:hidden`/`hidden md:block` はCSS表示切替のみでReactツリーからは外れない）、両方が同じ `timelineScrollRef` を共有している。後からマウントされる側（デスクトップ用）でrefが上書きされるため、モバイル端末では「起動時に現在時刻へ自動スクロール」する処理も、ドラッグ配置時の座標計算（`handleDragEnd` 内の `yToTime`）も、非表示（高さ0）のデスクトップ用要素に対して行われてしまう。→ モバイル/デスクトップ用に別々のref（例: `mobileScrollRef` / `desktopScrollRef`）を持たせ、`window.matchMedia('(min-width: 768px)')` 等で実際に表示されている方を使うように修正する
- [ ] 短時間タスクのタップ判定領域を拡大する: `useTimelineScale.ts` の `HOUR_HEIGHT_PX = 80` により15分タスクは高さ20px・30分タスクは高さ40pxしかなく、推奨タップサイズ(44px前後)を下回り押しづらい。`TaskBlock.tsx` の見た目の高さ（時間の正確さ）は変えず、実際のタップ判定領域だけ疑似要素や負のmargin等で広げる（見た目は変えずヒットエリアのみ拡大）
- [ ] インボックスのタスクカードに常時表示の完了チェックボックスを追加する: `InboxTaskCard.tsx` は横スワイプでの完了に対応したが、ジェスチャーは発見されにくい。カード左側などに常時見えるチェックボックス（タップで `completeTask` 呼び出し）を追加し、スワイプと併用できるようにする
- [ ] モバイルタブバー（インボックス/タイムライン切替）のタップ領域を拡大する: `MobileTabBar.tsx` のボタンをより大きく・押しやすく調整する（paddingや最小高さの見直し）
- [ ] ヘッダーの日付操作エリアのタップ領域を拡大する: `Header.tsx` の前日/翌日ボタン（約36x36px）や「今日」ボタン（約24px高）が推奨タップサイズを下回っている。ボタンサイズと要素間の余白を広げ、誤タップを減らす

## M サイズ（1〜2時間）

- [ ] 繰り返しタスクのテンプレート編集機能: `SettingsModal.tsx` の繰り返しタスク一覧から既存テンプレートを編集できるようにする（現状は削除のみ）。`TaskEditModal.tsx` に近いUIを流用し、`recurringStorage.ts` に `updateRecurringTemplate()` を追加
- [ ] インボックスに「クイック追加」入力欄を追加する: `InboxPanel.tsx` の上部にタイトルのみ入力してEnterで即座にインボックスへ追加できる軽量な入力欄を置く（所要時間はconfigのデフォルト値、色はデフォルト、優先度は'medium'）。時間や色などの詳細調整は既存のドラッグ配置／長押しのクイックスケジュール（`QuickScheduleModal.tsx`）／編集アイコン（`TaskEditModal.tsx`）で後から行う運用とする

## L サイズ（複数サイクル）

（現在なし）

---

## メモ・制約

- `src/store/appStore.ts` は変更禁止（ロジック上の変更が必要な場合は慎重に）
- `workers/sync.ts` / `wrangler.jsonc` は変更禁止
- 新規 npm パッケージ追加禁止
- 品質ゲート: `npm run build` が通ること
