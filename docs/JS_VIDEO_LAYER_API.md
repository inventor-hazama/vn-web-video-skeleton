# JS Video Layer API（v0.1.2）

Date: 2026-01-01

## グローバル
- `window.VideoLayer` を提供する。

## init(cfg)
```js
VideoLayer.init({
  baseUrl: "",              // "" なら相対パス
  defaultExt: "webm",       // 既定拡張子
  fallbackExt: "mp4"        // ロード失敗時の差替え
});
```

## playSegment(segObj)
- 新セグメントを開始し、patternの先頭から再生。
- 既存再生を停止し、`segmentTransition` を適用。

### segObj（必要最小）
- `id`: string
- `pattern`: string[]
- `loop`: boolean
- `switchTiming`: "immediate" | "boundary"
- `clipTransition`: {type:"none|dissolve", duration:seconds}
- `segmentTransition`: {type:"none|fade|crossfade", duration:seconds}
- `clips`: { [clipKey]: {path:string} }

## requestSwitch(nextSegObj, timing)
- timing が未指定なら "immediate"。
- "boundary": 次のクリップ境界（ended）で切替。

## popEvent() -> string
- イベントキューをJSON文字列で返す。空なら ""。
- 例: {"type":"segment_switched","segment":"seg_loop_AB"}

## イベント種類（最小）
- segment_started
- segment_switched
- clip_boundary
- error
