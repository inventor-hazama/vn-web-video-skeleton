# Workflow 01: Bootstrap Repo + Ren'Py Integration

## Inputs
- This repo skeleton
- A fresh Ren'Py project created via Launcher

## Steps
1. Copy `game/` contents into the Ren'Py project's `game/` folder.
2. Ensure `game/data/segments.json` is present.
3. Add placeholder videos A/B/C into `game/movies/`.
4. Run the project in desktop mode (will show a stub message; web is the target).
5. Build Web (Beta) and patch with `tools/patch_web_build.py`.

## Outputs
- A web build folder with injected video layer
- Browser can run demo and show overlay choices
