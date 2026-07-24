# Any Planner — ADHD フォーカス タイムライン型タスク管理

## プロジェクト概要

ADHDユーザーのための視覚的タイムライン型タスク管理アプリ。
「今何をすべきか」を一目でわかるタイムライン UI を中心に設計。

- **フレームワーク**: Next.js 14 App Router (`output: 'export'`) → Cloudflare Pages
- **状態管理**: Zustand v5
- **UI**: Tailwind CSS / Radix UI / @dnd-kit/core
- **同期**: Cloudflare Workers KV（`workers/sync.ts`）
- **品質ゲート**: `npm run build`（TypeScript 型チェック込み）

## ディレクトリ構造

```
src/
  app/           # Next.js App Router (page.tsx, layout.tsx)
  components/
    timeline/    # タイムライン・タスクブロック
    inbox/       # インボックスパネル
    modals/      # タスク作成・設定モーダル
    ui/          # 共通UIコンポーネント
  store/         # appStore.ts（変更禁止）
  lib/           # ユーティリティ・定数
  types/         # index.ts（型定義）
workers/         # Cloudflare Workers 同期（変更禁止）
docs/
  ROADMAP.md         # 未着手タスク一覧
  roadmap-done.md    # 完了済みタスク記録
```

## キーファイル

| 役割 | ファイル |
|------|---------|
| 状態管理（保護）| `src/store/appStore.ts` |
| 型定義 | `src/types/index.ts` |
| 定数 | `src/lib/constants.ts` |
| タイムライン | `src/components/timeline/Timeline.tsx` |
| タスクブロック | `src/components/timeline/TaskBlock.tsx` |
| インボックス | `src/components/inbox/InboxPanel.tsx` |

## 絶対に変更してはいけないファイル

- `src/store/appStore.ts` — 全機能に影響するコアストア
- `workers/sync.ts` — Cloudflare KV 同期（安定稼働中）
- `wrangler.jsonc` — Workers 設定

## 開発ルール

- 新規 npm パッケージ追加禁止
- `npm run build` が通ること（Cloudflare Pages ビルド枠 500回/月）
- KV 書き込み（`saveToStorage()`）はユーザー操作後 1回のみ
- 詳細は `.claude/skills/evolve/SKILL.md` を参照

## Loop Engineering

`/loop 2h /evolve` で 2時間ごとに自律的に機能開発を進める。
タスク一覧は `docs/ROADMAP.md`、完了記録は `docs/roadmap-done.md`。
