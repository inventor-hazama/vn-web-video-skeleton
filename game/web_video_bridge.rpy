# game/web_video_bridge.rpy
# Ren'Py <-> JS bridge for Web video layer.
# Web-only: uses renpy.emscripten.run_script* when available.

init -1 python:
    import json

    def is_web():
        # In Ren'Py, renpy.emscripten is truthy when running in web/emscripten.
        return bool(getattr(renpy, "emscripten", None))

    def _js(script):
        if not is_web():
            return
        renpy.emscripten.run_script(script)

    def _js_str(script):
        if not is_web():
            return ""
        return renpy.emscripten.run_script_string(script)

    def video_init(base_url="", default_ext="webm", fallback_ext="mp4"):
        cfg = {"baseUrl": base_url, "defaultExt": default_ext, "fallbackExt": fallback_ext}
        _js("window.VideoLayer && VideoLayer.init(%s);" % json.dumps(cfg))

    def video_play_segment(seg_obj):
        _js("window.VideoLayer && VideoLayer.playSegment(%s);" % json.dumps(seg_obj))

    def video_request_switch(seg_obj, timing="immediate"):
        _js("window.VideoLayer && VideoLayer.requestSwitch(%s, %s);" % (json.dumps(seg_obj), json.dumps(timing)))

    def video_pop_event():
        raw = _js_str("window.VideoLayer && VideoLayer.popEvent ? VideoLayer.popEvent() : '' ;")
        if not raw:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return {"type": "error", "message": "bad_event_json", "raw": raw}
