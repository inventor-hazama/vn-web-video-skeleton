# Handoff Strategy (GitHub + Antigravity + Codex)

Date: 2026-01-01

このプロジェクトは、途中で **GitHub / Antigravity / Codex** に引き継いで
共同作業でスケールさせる前提です。そのために次を“固定”します。

## 1) 私（ChatGPT）がここまで進める範囲
- 仕様 v0.1.1 の **実装可能な形**への落とし込み（v0.1.2）
- Webの必須要件（動画上にUI）を満たす **動画レイヤー最小実装**
- Ren’Py側のブリッジ、データ駆動、デモ縦切り（Vertical Slice）
- 引き継ぎに必要な文書（契約、マニフェスト、タスク）

## 2) 引き継ぎの形（Codex / Antigravityに渡す最小パック）
- `HANDOFF/CONTEXT.md` … 仕様の要点、決定事項、用語
- `HANDOFF/MANIFEST.txt` … AIに渡すべきファイル一覧（最小）
- `HANDOFF/TASKS.md` … 次の実装タスク（DoD付き）
- `docs/JS_VIDEO_LAYER_API.md` … I/F契約（破ると壊れる場所）
- `game/` … Ren’Py側の実体
- `web_patch/` … Web側の実体（JS/CSS）
- `tools/` … patcher/bundler（自動化）

## 3) 運用ルール（破綻防止）
- “Single Source of Truth”: `game/data/segments.json`
- 仕様変更はまず docs を更新し、その後コードを更新
- Web build成果物は生成物。編集点は `tools/patch_web_build.py` に集約
- PRは「Spec/Impl/Code」の3点セットでレビュー

## 4) いつ引き継ぐか（推奨）
- v0.1.2（縦切りが動いた）時点で GitHubへ初回投入
- 以降は Codex / Antigravity に issue単位で実装を割り当て

## 5) Codex への引き継ぎ運用ルール

> [!IMPORTANT]
> **Codex に渡す時は必ず `make_handoff_bundle.py` で生成した zip を使用してください。**

### 引き継ぎパック生成

```powershell
python tools/make_handoff_bundle.py handoff.zip
```

### 生成される内容
- `HANDOFF/MANIFEST.txt` に記載されたファイルのみ
- 余分なファイル（ビルド成果物、動画ファイル等）は含まれない

### なぜこのルールが必要か
- **文脈の最小化**: Codex のコンテキストウィンドウを有効活用
- **一貫性**: 毎回同じ構造のパックを渡すことで、AIの理解が安定
- **セキュリティ**: 不要なファイル（秘密鍵、大容量バイナリ等）の混入を防止

