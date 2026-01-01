# CONTEXT (AI Handoff)

Date: 2026-01-01

## Must-have
- Looping video with overlay choices (required)
- Arbitrary loop patterns: A..., AB..., ACBABC...
- Switch during loop (immediate or boundary)
- Transition on switch (fade/crossfade) required
- Web-first delivery

## Key decision
- For Web, implement video playback in JavaScript (HTMLVideoElement) behind Ren’Py canvas.
- Ren’Py manages UI/choices/state; JS manages video/pattern/transition.

## Single Source of Truth
- `game/data/segments.json`

## Interfaces
- See `docs/JS_VIDEO_LAYER_API.md`
