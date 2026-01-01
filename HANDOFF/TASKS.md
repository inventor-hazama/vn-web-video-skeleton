# TASKS (GitHub Issue Ready)

以下のタスクはそれぞれGitHub Issueとして起票可能な形式です。

---

## T1: Make vertical slice run with real assets

### 目的
縦切りを実際の動画アセットで動作させ、基本機能の動作を確認する。

### DoD (Definition of Done)
- [ ] A/B/C動画を配置し、以下を検証:
  - [ ] `seg_loop_A`: Aがループ再生され、選択肢が表示・クリック可能
  - [ ] `seg_loop_AB`: ABパターンでループし、boundary切替が動作
  - [ ] `seg_loop_ACBABC`: ACBABCパターンでループし、immediate切替が動作
  - [ ] セグメント遷移時に `crossfade` または `fade` トランジションが適用される
  - [ ] クリップ間遷移で `dissolve` が適用される（JSON設定時）

### 関連ファイル
- `game/data/segments.json` - セグメント定義
- `game/movie_demo.rpy` - デモ実行ループ
- `web_patch/video_layer.js` - 動画再生エンジン
- `docs/VALIDATION.md` - 判定観点

### テスト手順
1. `game/movies/` に A.webm, B.webm, C.webm を配置
2. Ren'Py で Web(Beta) ビルド
3. `python tools/patch_web_build.py <web-build-path>` 実行
4. `python -m http.server 8000` でホスト
5. ブラウザで `http://localhost:8000` を開く
6. `docs/VALIDATION.md` のチェックリストに従って動作確認

---

## T2: Improve transition quality

### 目的
`fade`（黒への遷移）トランジションの品質を向上させる。

### DoD (Definition of Done)
- [ ] JSで overlay div を使った `fade` 実装
- [ ] duration が JSON 設定値と一致する
- [ ] ループ中のセグメント切替でも正しく動作する

### 関連ファイル
- `web_patch/video_layer.js` - `switchToSegment()` 関数
- `web_patch/video_layer.css` - `#video-fade` スタイル
- `game/data/segments.json` - `segment_transition.type: "fade"`

### テスト手順
1. `seg_loop_ACBABC` のセグメント遷移で fade が適用されることを確認
2. 画面が黒くなり、0.2秒後に新セグメントが開始されることを確認
3. 複数回遷移しても安定動作することを確認

---

## T3: Error handling + fallback

### 目的
動画ロード失敗時のフォールバックとエラー通知を実装する。

### DoD (Definition of Done)
- [ ] webm ロード失敗時に mp4 を試行
- [ ] 両方失敗時に `{type:"error", message, clip/path}` をイベントキューに送出
- [ ] Ren'Py デモ側でエラーを画面/ログに表示

### 関連ファイル
- `web_patch/video_layer.js` - `setSourceWithFallback()` 関数
- `game/movie_demo.rpy` - エラーイベント処理（80-82行目）
- `docs/JS_VIDEO_LAYER_API.md` - error イベント仕様

### テスト手順
1. 存在しない動画パスを `segments.json` に設定
2. Web実行し、Console に `clip_load_failed` イベントが出力されることを確認
3. Ren'Py 側でエラーメッセージが表示されることを確認

---

## T4: Add switch_timing="boundary" for immediate user choice

### 目的
`boundary` タイミングでのセグメント切替を完全実装する。

### DoD (Definition of Done)
- [ ] 選択時に `timing=boundary` の場合、次のクリップ境界で切替
- [ ] パターン長1の場合、現在のループ終端で切替（クリップ再生完了を境界と見なす）

### 関連ファイル
- `web_patch/video_layer.js` - `requestSwitch()`, `onClipEnded()`
- `game/data/segments.json` - `switch_timing: "boundary"`
- `game/movie_demo.rpy` - `video_request_switch()` 呼び出し

### テスト手順
1. `seg_loop_AB` で選択肢をクリック
2. 即座に遷移せず、現在のクリップ（AまたはB）が終わるまで待機することを確認
3. クリップ終端で次セグメントへ遷移することを確認

---

## T5: Add auto-select hooks (stub)

### 目的
タイマーベースの自動選択のプラミングを用意する（スコアリングは後日）。

### DoD (Definition of Done)
- [ ] `movie_overlay.rpy` にタイマーベースの自動Return追加
- [ ] 設定された choice id を返す
- [ ] スコアリングロジックは不要（プラミングのみ）

### 関連ファイル
- `game/movie_overlay.rpy` - `autosel` パラメータ
- `game/data/segments.json` - 将来的に `auto_select` 設定追加

### テスト手順
1. `movie_overlay.rpy` の `autosel` パラメータに `{"enabled": True, "delay": 1.5, "pick_id": "to_AB"}` を渡す
2. 1.5秒後に自動的に `to_AB` が選択されることを確認
