# Codex Prompt Pack (copy/paste)

## Prompt: Implement fade transition in video_layer.js
You are working in repo `vn-web-video-skeleton`.
Goal: Implement segment transition type "fade" (to black, then switch, then fade out).
Constraints:
- Use existing #video-layer structure and add a #video-fade overlay div if missing.
- Duration comes from segmentTransition.duration (seconds).
- Must work when switching during looping.
DoD:
- seg_loop_ACBABC uses fade in segments.json and visually fades to black during switch.

## Prompt: Add robust fallback from webm -> mp4
Goal: When a clip fails to load/play, automatically try swapping extension to mp4.
DoD:
- If A.webm missing but A.mp4 exists, playback proceeds.
- Emit error event only after both attempts fail.
