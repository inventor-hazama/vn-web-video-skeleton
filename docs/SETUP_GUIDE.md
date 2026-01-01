# Setup Guide (開発者向けセットアップ手順)

Date: 2026-01-01

このガイドでは、VN Web Video プロジェクトをゼロからセットアップし、縦切り（Vertical Slice）を動作させるまでの手順を説明します。

---

## 1. 前提条件

- [Ren'Py 8.x](https://www.renpy.org/latest.html) インストール済み
- Python 3.x（`patch_web_build.py` 実行用）
- ローカルWebサーバ（Python `http.server` または VS Code Live Server 等）

---

## 2. Ren'Py プロジェクトのセットアップ

### 2.1 新規プロジェクト作成

1. **Ren'Py Launcher** を起動
2. 「+ 新しいプロジェクトを作成する」をクリック
3. プロジェクト名を入力（例: `vn_web_video`）
4. 言語・解像度はデフォルトでOK
5. プロジェクトが作成されたら、`game/` フォルダの場所を確認
   - 例: `C:\Users\<user>\renpy\vn_web_video\game\`

### 2.2 game/ のコピー

このリポジトリの `game/` フォルダの中身を、Ren'Pyプロジェクトの `game/` フォルダに **上書きコピー** します。

```powershell
# 例（Windowsの場合）
Copy-Item -Path ".\game\*" -Destination "C:\Users\<user>\renpy\vn_web_video\game\" -Recurse -Force
```

コピー後の構造:
```
vn_web_video/
  game/
    data/
      segments.json
    movie_demo.rpy
    movie_overlay.rpy
    web_video_bridge.rpy
    script.rpy
```

---

## 3. 動画ファイルの配置

### 3.1 配置場所

`game/movies/` フォルダを作成し、A/B/C動画を配置します。

```
game/
  movies/
    A.webm
    B.webm
    C.webm
```

### 3.2 命名規則

- `segments.json` の `clips` セクションで定義されたパス（例: `movies/A.webm`）に一致させる
- **推奨形式**: WebM (VP9) または MP4 (H.264)
- フォールバック: `.webm` が失敗した場合、同名の `.mp4` を試行

### 3.3 動画仕様（推奨）

| 項目 | 値 |
|------|-----|
| 解像度 | 1920x1080 または 1280x720 |
| フレームレート | 30fps または 60fps |
| 長さ | ループ素材として1-5秒程度 |
| 音声 | プロトタイプではミュート前提 |

---

## 4. Web(Beta) ビルド

### 4.1 ビルド実行

1. Ren'Py Launcher でプロジェクトを選択
2. 「ビルド」→「Web(Beta)」を選択
3. ビルド完了後、出力先フォルダを確認
   - 例: `C:\Users\<user>\renpy\vn_web_video\web-build\`

### 4.2 パッチ適用

ビルド成果物に動画レイヤーを注入します。

```powershell
# リポジトリルートから実行
python tools/patch_web_build.py "C:\Users\<user>\renpy\vn_web_video\web-build"
```

成功時の出力:
```
Patched index.html and copied assets.
```

### 4.3 パッチ内容

`patch_web_build.py` は以下を実行:
1. `web_patch/video_layer.js` → ビルド出力にコピー
2. `web_patch/video_layer.css` → ビルド出力にコピー
3. `index.html` に `<script>` と `<link>` タグを注入

---

## 5. Webサーバでホスト

> [!IMPORTANT]
> **ローカルファイル直開き（`file://`）では動作しません。**
> Webサーバ経由でアクセスする必要があります。

### 5.1 Python http.server（最も簡単）

```powershell
cd "C:\Users\<user>\renpy\vn_web_video\web-build"
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開く。

### 5.2 VS Code Live Server

1. VS Code で `web-build` フォルダを開く
2. `index.html` を右クリック → 「Open with Live Server」

---

## 6. トラブルシューティング

### 動画が表示されない

| チェック項目 | 確認方法 |
|-------------|---------|
| パッチ適用済みか | `index.html` を開き、`<!-- Injected by tools/patch_web_build.py -->` が存在するか確認 |
| video_layer.js ロード | ブラウザ開発者ツール → Console で `VideoLayer` が定義されているか確認 |
| 動画ファイル存在 | `web-build/movies/` に A.webm 等が存在するか確認 |
| CORSエラー | `file://` ではなく `http://localhost:...` でアクセスしているか確認 |

### パッチ適用エラー

| エラー | 対処 |
|-------|------|
| `index.html not found` | ビルド出力パスが正しいか確認 |
| `Already patched.` | 正常（再適用不要）。強制再適用は手動で注入コメントを削除後再実行 |
| `Missing source asset` | リポジトリルートから実行しているか、`web_patch/` フォルダが存在するか確認 |

### 再ビルド時の運用

> [!NOTE]
> Ren'Pyで再ビルドすると `index.html` が上書きされ、パッチが消えます。
> **毎回 `patch_web_build.py` を再実行してください。**

```powershell
# 再ビルド後に毎回実行
python tools/patch_web_build.py "<web-build-path>"
```

---

## 7. Codex / Antigravity への引き継ぎ

### 7.1 最小パック生成

```powershell
python tools/make_handoff_bundle.py handoff.zip
```

`HANDOFF/MANIFEST.txt` に記載されたファイルのみを含むzipが生成されます。

### 7.2 運用ルール

- **Codexへ渡す時は必ず `make_handoff_bundle.py` で生成したzipを使用**
- 詳細は [HANDOFF_STRATEGY.md](./HANDOFF_STRATEGY.md) を参照

---

## 8. 次のステップ

1. 動画ファイル（A/B/C.webm）を用意して `game/movies/` に配置
2. Web(Beta)ビルド → パッチ適用 → Webサーバでホスト
3. ブラウザで動作確認（[VALIDATION.md](./VALIDATION.md) の判定観点を参照）
