# evolve — Any Planner 自動改善スキル

1サイクルで1タスクを実装し、`next build` が通れば commit + push する。

## プロジェクト概要

- **フレームワーク**: Next.js 14 App Router (`output: 'export'`) / Cloudflare Pages
- **状態管理**: Zustand v5 (`useStore`, `create`)
- **UI**: Tailwind CSS / Radix UI / @dnd-kit/core
- **品質ゲート**: `npm run build`（TypeScript 型チェック込み）
- **デプロイ**: Cloudflare Pages（push → 自動ビルド）

## サイクル手順

### Step 1: 状態確認（毎回必須）

```
1. git status で未コミット変更を確認
2. docs/ROADMAP.md を読む
3. docs/roadmap-done.md を読んで直前の作業を把握する
```

前サイクルで中断したタスクがあれば、そちらを優先して継続する。

### Step 2: タスク選択

サイズ優先順位: **S → M → L**

| サイズ | 目安 | 1サイクルの扱い |
|--------|------|----------------|
| S      | 30分以内 | 1サイクルで完結 |
| M      | 1〜2時間 | 1サイクルで完結を目指す |
| L      | 半日以上 | 複数サイクルに分割して実装 |

タスクを1つ選んだら、`docs/ROADMAP.md` に `[WIP]` マークを付ける。

### Step 3: 実装ルール

- 既存のコンポーネント・パターンを最大限再利用する
- 新規 npm パッケージのインストール禁止（既存ライブラリで解決する）
- コメントは書かない（自明でない箇所のみ1行）
- UI変更は Tailwind クラスで完結させる
- `src/store/appStore.ts` は**触れない**（全機能に影響するコア）

### Step 4: 品質チェック

```bash
npm run build
```

- **成功**: Step 5 へ
- **型エラー / ビルドエラー**: その場で修正してから再実行
- **修正しきれない**: 変更を `git stash` して ROADMAP に `[BLOCKED]` と残す

### Step 5: Commit & Push

build が通ったときのみ push する。

```bash
git add <変更ファイルのみ>
git commit -m "<prefix>: <変更内容の要約>"
git push
```

**commit prefix**:
- `feat:` 新機能
- `fix:` バグ修正
- `style:` 見た目のみ（ロジック変更なし）
- `refactor:` 動作変化なしのリファクタ

build が失敗して stash した場合はコミットしない。

### Step 6: ROADMAP 更新

完了したタスクを `docs/roadmap-done.md` に移す。

```
[DONE 2026-07-25] タスクの説明文
```

`docs/ROADMAP.md` から完了タスクを削除し、`[WIP]` マークも外す。

---

## 禁止事項

### コード・アーキテクチャ

- `src/store/appStore.ts` の状態管理ロジックを変更すること
- `workers/sync.ts` / `wrangler.jsonc` を変更すること（同期機能は安定稼働中）
- 既存機能の削除・破壊的変更
- `npm install` で新規パッケージを追加すること
- セキュリティ関連コード（HMAC、syncKey処理）の変更

### Cloudflare コスト（無料枠を超えない）

- `saveToStorage()` の呼び出し回数を増やさない — KV 書き込みは 1,000回/日の無料枠。ポーリング・定期バッチ・キーストロークごとの auto-save は禁止。既存の「ユーザー操作後に 1回 save」パターンを維持すること
- `setInterval` + `fetch` によるバックグラウンドポーリングを追加しない — Workers リクエストは 100,000回/日の無料枠
- 外部有料 API（OpenAI・Google・AWS 等）を呼び出す機能を追加しない
- KV に画像・バイナリ・大きなデータを保存しない — 1ユーザーのペイロードは常に数 KB 以内に収める
- build が通らない変更を push しない — Cloudflare Pages ビルドは 500回/月の無料枠

### Claude Code コスト（Pro プランの枠内で動作する）

- 1サイクルで読み込むファイルは必要最小限にとどめる — 全ファイルを一括 Read しない
- Agent（サブエージェント）の起動は必要な場合のみ — 単純な検索・Read で済む作業にはサブエージェントを使わない
- Web 検索・Web フェッチは行わない — コードベースとドキュメントのみを参照する
- 1サイクルで完結しない大規模リファクタを始めない — L タスクは必ず分割して着手する
- ループを自己増殖させない — ScheduleWakeup の間隔を短縮したり追加の wakeup を登録しない

---

## キーファイル早見表

| 役割 | ファイル |
|------|---------|
| 状態管理（保護）| `src/store/appStore.ts` |
| 型定義 | `src/types/index.ts` |
| 定数 | `src/lib/constants.ts` |
| タイムライン | `src/components/timeline/Timeline.tsx` |
| タスクブロック | `src/components/timeline/TaskBlock.tsx` |
| インボックス | `src/components/inbox/InboxPanel.tsx` |
| 設定モーダル | `src/components/modals/SettingsModal.tsx` |
| タスク作成モーダル | `src/components/modals/TaskFormModal.tsx` |
| CF Workers 同期 | `workers/sync.ts` |
