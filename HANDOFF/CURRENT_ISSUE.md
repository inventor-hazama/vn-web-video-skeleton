# Current Issue: Video Playback Failure (clip_load_failed)

## Problem Summary
Web video layer fails to load video files with `clip_load_failed` error despite:
- Video files existing at correct paths (`game/movies/A.mp4`, etc.)
- Canvas transparency configured
- Path settings synchronized

## Error Message
```
Video Error: 'type': 'error', 'message': 'clip_load_failed', 'tried': ['game/movies/A.mp4', 'game/movies/A.webm']
```

## What Has Been Tried
1. **Path Synchronization**: Set `base_url: "game/"` in `segments.json`
2. **Canvas Transparency**: 
   - `config.gl_clear_color = "#0000"` in `movie_demo.rpy`
   - `#canvas { background: transparent; }` via `patch_web_build.py`
   - Removed `scene black` from Ren'Py script
3. **Patch Script Updates**: Modified to always copy movies and apply CSS fixes
4. **Error Handling**: Added timeout and error reporting to prevent freezing

## Files to Investigate
- `web_patch/video_layer.js` - `setSourceWithFallback()` function (line 78-144)
- `vn_web_video/game/data/segments.json` - video configuration
- `tools/patch_web_build.py` - build patching logic

## Suspected Root Causes
1. **Path resolution in browser context**: The JavaScript may be constructing incorrect URLs
2. **MIME type or CORS issues**: Server may not be serving correct headers
3. **Video element initialization timing**: Videos may not be ready when playback is attempted

## How to Reproduce
1. Open Ren'Py Launcher, select `vn_web_video` project
2. Build → Web(Beta)
3. Run: `python tools/patch_web_build.py "vn_web_video-1.0-dists/vn_web_video-1.0-web"`
4. Run: `cd vn_web_video-1.0-dists/vn_web_video-1.0-web && python -m http.server 8000`
5. Open http://localhost:8000 in browser
6. Observe: Black screen with "Video Error: clip_load_failed" message

## Expected Behavior
Video A.mp4 should play in background, with choice buttons overlaid.

## Key Documentation
- `docs/JS_VIDEO_LAYER_API.md` - API contract
- `docs/IMPLEMENTATION_v0.1.2.md` - Architecture overview
- `HANDOFF/TASKS.md` - Task definitions
