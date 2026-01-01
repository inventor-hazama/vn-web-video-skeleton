# 実装仕様（v0.1.2）: Web Video Layer + Segment Engine

Date: 2026-01-01

## 1. アーキテクチャ（最小）
- Ren'Py（Web/WASM）は **UI（選択肢・テキスト）とゲーム状態**を管理。
- Web動画は `web_patch/video_layer.js` が HTMLVideoElement で再生し、
  Ren’Py の canvas を上に重ねることで「動画の上に選択肢UI」を成立させる。

構成:
- `game/web_video_bridge.rpy`: Ren’Py ⇄ JS ブリッジ
- `game/movie_demo.rpy`: セグメント実行ループ（デモ）
- `web_patch/video_layer.js`: 2枚videoで crossfade、pattern loop、switch_timing を実装
- `tools/patch_web_build.py`: Webビルド成果物へ video-layer を注入

## 2. データ駆動（Single Source of Truth）
- `game/data/segments.json` がセグメント定義の唯一の正。
- 追加シーンは JSON に追記し、Ren’Pyは同じループで実行する。

### 2.1 Segment 定義（要点）
- `pattern`: ["A","B",...]
- `loop`: true/false（trueの場合 pattern を繰り返す）
- `switch_timing`: "immediate" | "boundary"
- `clip_transition`: クリップ間のトランジション
- `segment_transition`: セグメント切替のトランジション
- `choices`: overlay表示（always/timed）

## 3. Ren’Py ⇄ JS I/F（契約）
- Ren’Py -> JS
  - `VideoLayer.init(cfg)`
  - `VideoLayer.playSegment(segObj)`
  - `VideoLayer.requestSwitch(segObj, timing)`
  - `VideoLayer.popEvent() -> JSON string | ""`
- JS -> Ren’Py
  - イベントは `VideoLayer.popEvent()` でプル型（Ren’Py側がポーリング）に統一
    - 例: {"type":"segment_switched","segment":"seg_loop_AB"}

## 3.1 動画ロード判定（clip_load_failed回避）
- `setSourceWithFallback()` は `loadedmetadata`/`canplay`/`canplaythrough` を成功判定に利用する。
- ロードタイムアウトは短すぎると誤判定になるため、余裕のある値を使う。
- 両拡張子で失敗した場合のみ `clip_load_failed` をイベント送出する。

## 4. Vertical Slice（DoD）
- seg_loop_A: Aループ＋常時選択肢
- seg_loop_AB: ABループ（boundary切替）
- seg_loop_ACBABC: 任意パターンループ（immediate切替）
- セグメント切替時に crossfade または fade が適用される
- クリップ間切替に dissolve が適用される（JSON指定時）

## 5. 次の実装拡張（v0.1.3候補）
- 自動選択（goal/スコア）を movie overlay に統合
- 動画立ち絵（別レイヤー）対応
- 事前プリロード戦略（クリップ先読み）
- モバイル最適化（UI safe area、タップ領域）
