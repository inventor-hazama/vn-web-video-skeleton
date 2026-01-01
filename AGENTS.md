# AGENTS.md (AI Collaboration Rules)

Date: 2026-01-01

This repository is built for AI-assisted development (GitHub + Antigravity + Codex).

## Non-negotiables
1. Web must support **looping video with overlay choices**.
2. Loop patterns are data-driven via `game/data/segments.json` (`pattern`).
3. Switching can occur during looping (immediate or boundary).
4. Transitions are required for segment switching.

## Source of truth
- `game/data/segments.json` is the single source of truth for segment behavior.
- API contract: `docs/JS_VIDEO_LAYER_API.md`
- Implementation overview: `docs/IMPLEMENTATION_v0.1.2.md`

## Change discipline
- Update docs first, then code.
- Do not hand-edit Ren'Py web build outputs; always patch via `tools/patch_web_build.py`.
- New work must be captured in `HANDOFF/TASKS.md` (with DoD) before implementation.

## Where to implement
- Ren'Py-side UI/state: `game/`
- Web video engine: `web_patch/`
- Build patching/automation: `tools/`
