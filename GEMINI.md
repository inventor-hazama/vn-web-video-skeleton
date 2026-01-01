# Project Context: VN Web Video (Ren'Py + Web Video Layer)

Date: 2026-01-01

## Goal (must)
- Web(HTML5)で「ループ動画の上に選択肢UIを重ねる」を必須で実現する。
- 任意パターンループ: A..., AB..., ACBABC... を `game/data/segments.json` の `pattern` で表現する。
- ループ中に選択で次セグメントへ遷移する（`immediate` / `boundary`）。
- 遷移時トランジション必須（`fade` / `crossfade`）。クリップ間は `dissolve` を許容。

## Single Source of Truth
- セグメント定義は `game/data/segments.json` が唯一の正。
- I/F契約は `docs/JS_VIDEO_LAYER_API.md`。
- 実装の全体像は `docs/IMPLEMENTATION_v0.1.2.md`。
- 次の作業は `HANDOFF/TASKS.md`（Issue化して進める）。

## Repo structure (do not break)
- Ren'Py側: `game/`（UI・状態管理・ブリッジ）
- Web動画レイヤー: `web_patch/`（`video_layer.js` / `video_layer.css`）
- Webビルド注入: `tools/patch_web_build.py`（生成物を手編集しない）
- 引き継ぎ最小パック: `HANDOFF/`（`MANIFEST.txt` / `TASKS.md` / `CONTEXT.md`）

## Working rules
- 変更は「docs → code」の順で整合させる。
- Webビルド成果物（`index.html` 等）は生成物。修正は `patch_web_build.py` で注入して再現性を担保する。
- 仕様の追加/変更はまず `docs/` と `HANDOFF/TASKS.md` に反映してから実装する。
