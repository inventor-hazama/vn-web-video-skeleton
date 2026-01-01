# game/movie_demo.rpy
# Vertical slice demo: looping video + overlay choices + segment switching (web).

init python:
    import json

    def load_segments():
        raw = renpy.file("data/segments.json").read()
        try:
            txt = raw.decode("utf-8")
        except Exception:
            txt = raw
        return json.loads(txt)
    
    # Ensure the canvas is transparent so we can see the video layer behind it.
    config.gl_clear_color = "#0000"

label movie_demo_start:
    # scene black  <-- Removed to prevent covering the video layer
    "Demo: Web video layer + overlay choices."
    if not is_web():
        "This demo is intended for Web build. On desktop, it will not show the HTML video layer."
        "Build Web (Beta), patch with tools/patch_web_build.py, then run in a browser."
        return

    $ data = load_segments()
    $ segments = data["segments"]
    $ clips = data["clips"]
    $ video_cfg = data.get("video", {})

    $ video_init(video_cfg.get("base_url",""), video_cfg.get("default_ext","webm"), video_cfg.get("fallback_ext","mp4"))

    $ current = data.get("start_segment", "seg_loop_A")

    while True:
        $ seg = segments[current]

        # Build segment object for JS.
        $ seg_obj = {
            "id": current,
            "pattern": seg["pattern"],
            "loop": seg.get("loop", True),
            "switchTiming": seg.get("switch_timing", "immediate"),
            "clipTransition": seg.get("clip_transition", {"type":"none","duration":0.0}),
            "segmentTransition": seg.get("segment_transition", {"type":"crossfade","duration":0.25}),
            "clips": clips,
            "video": video_cfg,
        }

        $ video_play_segment(seg_obj)

        # Display overlay choices (looping video continues behind).
        call screen movie_choice_overlay(seg["choices"]["items"])
        $ r = _return

        # Resolve next segment.
        $ next_seg = None
        python:
            for c in seg["choices"]["items"]:
                if c["id"] == r:
                    next_seg = c["next"]
                    break
        if next_seg is None:
            return

        # Request switch (JS performs transition and starts next segment playback).
        $ next_obj = {
            "id": next_seg,
            "pattern": segments[next_seg]["pattern"],
            "loop": segments[next_seg].get("loop", True),
            "switchTiming": segments[next_seg].get("switch_timing", "immediate"),
            "clipTransition": segments[next_seg].get("clip_transition", {"type":"none","duration":0.0}),
            "segmentTransition": segments[next_seg].get("segment_transition", {"type":"crossfade","duration":0.25}),
            "clips": clips,
            "video": video_cfg,
        }
        $ video_request_switch(next_obj, seg.get("switch_timing","immediate"))

        # Wait for confirmation from JS (optional but keeps state aligned).
        $ switched = False
        $ wait_timeout = 50  # ~2.5 seconds (50 * 0.05)
        while not switched and wait_timeout > 0:
            $ ev = video_pop_event()
            if ev:
                # renpy.log("Video Event: [ev]") # Optional: debug log
                if ev.get("type") == "segment_switched":
                    $ switched = True
                    $ current = ev.get("segment", next_seg)
                elif ev.get("type") == "error":
                    "Video Error: [ev]"
                    $ switched = True
                    $ current = next_seg
            
            if not switched:
                $ renpy.pause(0.05, hard=True)
                $ wait_timeout -= 1

        if not switched:
            "Warning: Video switch timed out. Forcing state sync."
            $ current = next_seg
