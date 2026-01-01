# VN Web Video Skeleton (Ren'Py + Web Video Layer)

This repository is a **starter skeleton** for a Ren'Py visual novel that requires:

- Looping video playback (single clip / playlist / arbitrary pattern)
- Choices overlaid on top of looping video
- Switching to next video segment from choices during looping
- Transitions during clip/segment switching (fade/crossfade)
- Web-first delivery (Ren'Py Web/HTML5), with a clean handoff structure for AI-assisted development (Antigravity/Codex)

## What you get
- `game/` Ren'Py bridge + demo scene + overlay screen
- `game/data/segments.json` segment/pattern definition (edit here to add scenes)
- `web_patch/video_layer.js` + `video_layer.css` HTML video layer (two-video crossfade)
- `tools/patch_web_build.py` to inject the video layer into a Ren'Py Web build output

## Quick start (web)
1. Create a new Ren'Py project in the Ren'Py Launcher.
2. Copy this repo's `game/` folder contents into your project's `game/` folder.
3. Put sample videos at:
   - `game/movies/A.webm`
   - `game/movies/B.webm`
   - `game/movies/C.webm`
   (Optional Safari fallback: also place `A.mp4`, `B.mp4`, `C.mp4` in the same folder.)
4. Build **Web (Beta)** from the Ren'Py Launcher.
5. Run the patcher to inject the video layer into the web build output:
   ```bash
   python tools/patch_web_build.py /path/to/<your_web_build_output>
   ```
6. Host the web build output directory on a web server and open it in a browser.

## Handoff
See `docs/HANDOFF_STRATEGY.md` and `HANDOFF/` for the packaging strategy and Codex/Antigravity prompts.
This repo also includes `GEMINI.md` and `AGENTS.md` to pin project context/rules for AI agents.

---

Date: 2026-01-01
