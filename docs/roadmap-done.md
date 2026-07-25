# Any Planner — 完了済みタスク

AIが実装を完了したタスクをここに記録する。

---

<!-- 例:
[DONE 2026-07-25] feat: インボックスに所要時間表示を追加
-->

[DONE 2026-07-25] インボックスパネルのタスクカードに所要時間を表示する（`InboxTaskCard.tsx` に既に実装済みと確認）
[DONE 2026-07-25] style: タイムラインのタスクブロックが44px未満のとき、フォントサイズをtext-[10px]・line-clamp-1に切り替えてタイトルの途切れを防止
[DONE 2026-07-25] feat: タスクブロックに +15分 / +30分 延長ボタンを追加（estimatedMinutesとスロットのendTimeを同時更新）
[DONE 2026-07-25] feat: ヘッダーに「翌日」矢印ボタンを追加（ChevronRight/addDaysは既にimport済みだが未接続だったため配線）
[DONE 2026-07-25] feat: 「今すぐやること」ボタンを追加（今日に切替→現在時刻に最も近い未完了タスクをハイライト＆スクロール）
[DONE 2026-07-25] style: タスクブロックのホバー時にscale-[1.02]とshadow-mdを追加してインタラクション改善
[DONE 2026-07-25] feat: タスクブロックの編集機能を追加（編集アイコンタップ／右クリックでTaskEditModalを開き、タイトル・所要時間・優先度・色を変更可能に。優先度editorはアプリ全体で初めて追加）
[DONE 2026-07-25] feat: 定期タスク（繰り返し）機能を追加。appStore.ts改変禁止のためテンプレートはlocalStorage独立管理＋AppShellのuseEffectでマテリアライズする方式を採用。TaskFormModalに繰り返しトグル（毎日/平日のみ/毎週）、SettingsModalにテンプレート一覧・削除UIを追加、rollover.tsで繰り返しタスクを繰越除外
[DONE 2026-07-25] feat: ヘッダーに本日の完了進捗（X/Y件・プログレスバー）を表示（ROADMAPが空だったため、コードベース調査で新規タスクを起票し実装。あわせて振動フィードバック追加・繰り返しテンプレート編集機能をバックログに追加）
[DONE 2026-07-25] feat: タスクブロック完了時に軽い振動フィードバック（navigator.vibrate）を追加
[DONE 2026-07-25] feat: インボックスのタスクカードを横スワイプするとタスク完了にできるようにした（ドラッグハンドル操作とは独立して検知し、既存のドラッグ配置・長押しスケジュールと共存）
[DONE 2026-07-25] feat: インボックスパネルに「完了済み」の折りたたみセクションを追加。全タスクから完了済みを一覧表示し、未完了に戻す／削除が可能に
[DONE 2026-07-26] fix: タイムラインのscrollRef共有バグを修正。モバイル/デスクトップ用に別々のref（mobileScrollRef/desktopScrollRef）を持たせ、window.matchMediaで実際に表示されている方を選ぶgetActiveScrollEl()を導入。これにより起動時の現在時刻への自動スクロールとドラッグ配置時の座標計算がモバイルで正しく動作するようになった
[DONE 2026-07-26] style: 短時間タスクのタップ判定領域を拡大。TaskBlock.tsxの見た目のサイズ・ドラッグ用ref（座標計算に影響するため）はそのままに、高さ44px未満のタスクにだけ上下8pxの透明な当たり判定レイヤーをDOM順で背面に追加。タップで完了/未完了トグル
[DONE 2026-07-26] feat: インボックスのタスクカードに常時表示の完了チェックボックスを追加。グリップとタイトルの間に配置し、既存の横スワイプ完了と併用可能
[DONE 2026-07-26] style: モバイルタブバーのタップ領域を拡大。min-h-[60px]・py-2.5・アイコンをw-6 h-6に拡大し、active時の背景ハイライトを追加
[DONE 2026-07-26] style: ヘッダーの日付操作エリアのタップ領域を拡大。前日/翌日/設定ボタンをmin-w/min-h 44pxに、「今日」ボタンのpaddingも拡大し、要素間の余白もgap-1→gap-1.5に
[DONE 2026-07-26] feat: ヘッダー進捗バーの分母を「開始時刻を過ぎたタスクのみ」に変更。当日は未来のタスクを含めないため、朝から夜のタスク分だけ低い数値が表示され続ける問題を解消（過去日/未来日は従来通り全件）
[DONE 2026-07-26] feat: 優先度をUIに反映。InboxTaskCardに左端の優先度カラーバーを追加し、InboxPanelのinboxTasksを優先度→所要時間の順でソート。PRIORITY_RANK/PRIORITY_BAR_COLORをconstants.tsに追加
[DONE 2026-07-26] style: 空き時間30分未満の色を赤からグレー系の中立色に変更（短い空き時間は本来中立な情報であり、常時視界に入る赤が不安を煽る可能性への対応）
[DONE 2026-07-26] refactor: TaskFormModalの決断項目を削減。色・繰り返し・追加先・開始時刻を初期状態で折りたたんだ「詳細設定」に格納し、主経路をタイトル＋所要時間＋送信のみに（タイムライン背景タップ経由でdefaultStartTimeが渡された場合は自動展開）
[DONE 2026-07-26] feat: 繰り返しタスクのテンプレート編集機能を追加。RecurringTemplateEditModal.tsxを新設し、recurringStorage.tsにupdateRecurringTemplate()を追加。SettingsModalのテンプレート一覧に編集ボタンを追加
[DONE 2026-07-26] feat: インボックスにクイック追加入力欄を追加。タイトルのみ入力してEnterで即座に追加（所要時間・色はデフォルト値）
[DONE 2026-07-26] feat: 繰越タスクに「今日はやらない」アクションを追加。Taskに`isDeferred`フィールドを追加し、既存の`updateTask`アクションで更新。InboxPanelに「保留中」の折りたたみセクションを新設（削除ではなく保留として退避、復元・削除が可能）
[DONE 2026-07-26] feat: 「進行中(in-progress)」状態をTaskBlockで使えるように。チェックボックスとは別のCircleDotボタンでpending⇄in-progressを切替、進行中はチェックボックスを破線＋ドット表示に
[DONE 2026-07-26] feat: タスク開始時刻の通知を追加。AppConfigに`notifyOnTaskStart`を追加し、SettingsModalでオプトイン（Notification.requestPermission）。AppShellの60秒間隔チェックで開始時刻に達したタスクをNotification+vibrateで通知（タブを開いている間のみ有効）
[DONE 2026-07-26] feat: タスク完了直後に次の未完了タスクへの導線を追加。tasksの変化を監視してpending/in-progress→completedへの遷移を検知し、handleNowClickと共通化したfindClosestIncompleteTaskId()で次のタスクを数秒間ハイライト
[DONE 2026-07-26] fix: 繰り返しタスクが日付送りナビゲーションで重複生成されるバグを修正。AppShellのマテリアライズ呼び出しをcurrentDate（閲覧中の日付）からtoday()（実際の今日）に変更し、重複判定もテンプレート側の単一フィールド`lastMaterialized`ではなく、Taskに追加した`materializedDate`を実際のtasks配列から検索する方式に変更（KV同期されるタスク配列を正とすることで、日付送りだけでなく複数端末での重複生成も同時に解消）。不要になったlastMaterialized/markTemplateMaterializedは削除
