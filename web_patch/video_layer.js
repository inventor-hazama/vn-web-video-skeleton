/* web_patch/video_layer.js
 * Minimal HTML video layer:
 * - Two videos (v0/v1) for crossfade/dissolve
 * - Pattern playback + loop
 * - requestSwitch(immediate|boundary)
 * - segment transition: none|crossfade|fade
 * - clip transition: none|dissolve
 *
 * NOTE: autoplay policies vary. For the vertical slice, videos are muted by default.
 */

(function () {
  const state = {
    cfg: { baseUrl: "", defaultExt: "webm", fallbackExt: "mp4" },
    segment: null,
    patternIndex: 0,
    active: 0, // 0 or 1
    pendingSwitch: null, // { seg, timing }
    events: [],
    clipPlayId: 0,
  };

  function pushEvent(ev) {
    try { state.events.push(JSON.stringify(ev)); } catch (e) { }
  }

  function popEvent() {
    return state.events.length ? state.events.shift() : "";
  }

  function $(id) { return document.getElementById(id); }

  function ensureDOM() {
    const layer = $("video-layer");
    if (!layer) {
      const msg = "video-layer missing in DOM";
      console.error(msg);
      pushEvent({ type: "error", message: "dom_error", details: msg });
      return null;
    }
    let v0 = $("v0");
    let v1 = $("v1");
    if (!v0 || !v1) {
      const msg = "v0/v1 missing in DOM";
      console.error(msg);
      pushEvent({ type: "error", message: "dom_error", details: msg });
      return null;
    }
    let fade = $("video-fade");
    if (!fade) {
      fade = document.createElement("div");
      fade.id = "video-fade";
      layer.appendChild(fade);
    }
    // Default attributes
    [v0, v1].forEach(v => {
      v.playsInline = true;
      v.preload = "auto";
      v.muted = true; // keep muted for prototype stability
      v.loop = false; // we handle loops manually to get clip boundaries
      v.style.transition = "opacity 250ms linear";
    });
    fade.style.transition = "opacity 250ms linear";
    return { layer, v0, v1, fade };
  }

  function resolveUrl(path, extOverride) {
    const base = state.cfg.baseUrl || "";
    // If path already has an extension, replace it when extOverride is provided.
    let p = path;
    const m = p.match(/\.[a-zA-Z0-9]+$/);
    if (m && extOverride) {
      p = p.slice(0, -m[0].length) + "." + extOverride;
    }
    return base ? (base.replace(/\/+$/, "") + "/" + p.replace(/^\/+/, "")) : p;
  }

  async function setSourceWithFallback(videoEl, clipPath) {
    // If clipPath already has a known video extension, try it first as-is.
    const knownExts = ["mp4", "webm", "m4v", "ogv"];
    const pathExtMatch = clipPath.match(/\.([a-zA-Z0-9]+)$/);
    const pathExt = pathExtMatch ? pathExtMatch[1].toLowerCase() : null;

    let defaultUrl, fallbackUrl;
    if (pathExt && knownExts.includes(pathExt)) {
      // Path has a known extension - use it as primary, generate fallback by swapping
      defaultUrl = resolveUrl(clipPath, null); // No extension override
      const fallbackExt = (pathExt === "mp4") ? "webm" : "mp4";
      fallbackUrl = resolveUrl(clipPath, fallbackExt);
    } else {
      // No known extension in path - use config defaults
      defaultUrl = resolveUrl(clipPath, state.cfg.defaultExt || "mp4");
      fallbackUrl = resolveUrl(clipPath, state.cfg.fallbackExt || "webm");
    }

    const loadTimeoutMs = 10000;

    // If clipPath already ends with .webm and defaultExt is webm, defaultUrl == clipPath; that's fine.
    // Use video.canPlayType as a hint, but still attempt actual load.
    const tried = [];
    async function tryUrl(url) {
      tried.push(url);
      return new Promise((resolve) => {
        let done = false;

        function cleanup() {
          videoEl.removeEventListener("loadedmetadata", onReady);
          videoEl.removeEventListener("canplay", onReady);
          videoEl.removeEventListener("canplaythrough", onReady);
          videoEl.removeEventListener("error", onError);
        }
        function finish(ok) {
          if (done) return;
          done = true;
          cleanup();
          resolve({ ok, url });
        }
        function onReady() {
          finish(true);
        }
        function onError() {
          finish(false);
        }

        videoEl.addEventListener("loadedmetadata", onReady, { once: true });
        videoEl.addEventListener("canplay", onReady, { once: true });
        videoEl.addEventListener("canplaythrough", onReady, { once: true });
        videoEl.addEventListener("error", onError, { once: true });

        videoEl.src = url;
        // Kick loading
        try { videoEl.load(); } catch (e) { }
        // Safety timeout: if neither error nor canplaythrough fires
        setTimeout(() => {
          finish(false);
        }, loadTimeoutMs);
      });
    }

    let res = await tryUrl(defaultUrl);
    if (res.ok) return { ok: true, url: res.url };
    if (fallbackUrl !== defaultUrl) {
      res = await tryUrl(fallbackUrl);
      if (res.ok) return { ok: true, url: res.url };
    }
    pushEvent({ type: "error", message: "clip_load_failed", tried });
    return { ok: false, tried };
  }

  function currentVideos(dom) {
    return state.active === 0
      ? { front: dom.v0, back: dom.v1 }
      : { front: dom.v1, back: dom.v0 };
  }

  async function playClip(dom, clipKey, transition) {
    const seg = state.segment;
    if (!seg) return;
    const clipDef = (seg.clips && seg.clips[clipKey]) || null;
    if (!clipDef) {
      pushEvent({ type: "error", message: "unknown_clip", clip: clipKey });
      return;
    }

    const { front, back } = currentVideos(dom);
    const playId = ++state.clipPlayId;

    // Load into back, then transition to it.
    back.style.opacity = "0";
    const loaded = await setSourceWithFallback(back, clipDef.path);
    if (!loaded.ok) return;
    if (playId !== state.clipPlayId) return; // superseded

    // Start back playback
    try { await back.play(); } catch (e) {
      pushEvent({ type: "error", message: "play_failed", error: String(e) });
    }

    // Apply clip transition (dissolve) by crossfading back over front
    const dur = Math.max(0, (transition?.duration || 0));
    back.style.transition = `opacity ${dur}s linear`;
    front.style.transition = `opacity ${dur}s linear`;

    if (transition?.type === "dissolve" && dur > 0) {
      back.style.opacity = "1";
      front.style.opacity = "0";
      // After transition, pause old front to save CPU
      setTimeout(() => {
        try { front.pause(); } catch (_) { }
      }, Math.floor(dur * 1000) + 30);
    } else {
      // Hard cut
      back.style.opacity = "1";
      front.style.opacity = "0";
      try { front.pause(); } catch (_) { }
    }

    // Swap active
    state.active = (state.active === 0) ? 1 : 0;

    // Attach ended handler on the *new* front (after swap)
    const nowFront = (state.active === 0) ? dom.v0 : dom.v1;
    nowFront.onended = () => onClipEnded(dom);

    pushEvent({ type: "clip_boundary", clip: clipKey, index: state.patternIndex });
  }

  async function onClipEnded(dom) {
    // Boundary-based switch?
    if (state.pendingSwitch && state.pendingSwitch.timing === "boundary") {
      await switchToSegment(dom, state.pendingSwitch.seg, "boundary");
      state.pendingSwitch = null;
      return;
    }

    const seg = state.segment;
    if (!seg) return;
    state.patternIndex += 1;

    if (state.patternIndex >= seg.pattern.length) {
      if (seg.loop) {
        state.patternIndex = 0;
      } else {
        // no loop: stop on last frame behavior is not implemented in JS v0;
        // Instead, keep the last frame by pausing the current front.
        const front = (state.active === 0) ? dom.v0 : dom.v1;
        try { front.pause(); } catch (_) { }
        pushEvent({ type: "segment_ended", segment: seg.id });
        return;
      }
    }

    const nextClip = seg.pattern[state.patternIndex];
    await playClip(dom, nextClip, seg.clipTransition);
  }

  async function switchToSegment(dom, nextSeg, reason) {
    const cur = state.segment;
    const tr = (cur && cur.segmentTransition) || (nextSeg && nextSeg.segmentTransition) || { type: "crossfade", duration: 0.25 };
    const dur = Math.max(0, tr.duration || 0);

    // Segment transition
    if (tr.type === "fade" && dur > 0) {
      dom.fade.style.transition = `opacity ${dur}s linear`;
      dom.fade.style.opacity = "1";
      await new Promise(r => setTimeout(r, Math.floor(dur * 1000) + 20));
    }

    // Apply next segment and start from its first clip
    state.segment = nextSeg;
    state.patternIndex = 0;
    pushEvent({ type: "segment_started", segment: nextSeg.id, reason });

    // If crossfade, we can re-use playClip's dissolve behavior by setting clipTransition temporarily.
    const clipKey = nextSeg.pattern[0];

    if (tr.type === "crossfade" && dur > 0) {
      // Temporary transition treated as dissolve
      const tmp = { type: "dissolve", duration: dur };
      await playClip(dom, clipKey, tmp);
    } else {
      await playClip(dom, clipKey, nextSeg.clipTransition);
    }

    if (tr.type === "fade" && dur > 0) {
      dom.fade.style.opacity = "0";
      await new Promise(r => setTimeout(r, Math.floor(dur * 1000) + 20));
    }

    pushEvent({ type: "segment_switched", segment: nextSeg.id });
  }

  async function playSegment(seg) {
    const dom = ensureDOM();
    if (!dom) return;

    // Normalize fields
    const normalized = {
      id: seg.id,
      pattern: seg.pattern || [],
      loop: !!seg.loop,
      switchTiming: seg.switchTiming || "immediate",
      clipTransition: seg.clipTransition || { type: "none", duration: 0 },
      segmentTransition: seg.segmentTransition || { type: "crossfade", duration: 0.25 },
      clips: seg.clips || {},
    };
    state.pendingSwitch = null;
    state.segment = normalized;
    state.patternIndex = 0;
    pushEvent({ type: "segment_started", segment: normalized.id, reason: "playSegment" });

    // Ensure front/back hidden then start first clip
    dom.v0.style.opacity = "0";
    dom.v1.style.opacity = "0";

    // Start with v0 as front; playClip loads into back and swaps, so start active=1 so it swaps to 0.
    state.active = 1;
    await playClip(dom, normalized.pattern[0], normalized.clipTransition);
    pushEvent({ type: "segment_switched", segment: normalized.id });
  }

  async function requestSwitch(nextSeg, timing) {
    const dom = ensureDOM();
    if (!dom) return;

    const t = timing || nextSeg.switchTiming || "immediate";
    const normalized = {
      id: nextSeg.id,
      pattern: nextSeg.pattern || [],
      loop: !!nextSeg.loop,
      switchTiming: nextSeg.switchTiming || "immediate",
      clipTransition: nextSeg.clipTransition || { type: "none", duration: 0 },
      segmentTransition: nextSeg.segmentTransition || { type: "crossfade", duration: 0.25 },
      clips: nextSeg.clips || {},
    };

    if (t === "boundary") {
      state.pendingSwitch = { seg: normalized, timing: "boundary" };
      pushEvent({ type: "switch_queued", segment: normalized.id, timing: "boundary" });
      return;
    }
    // immediate
    await switchToSegment(dom, normalized, "immediate");
  }

  function stop() {
    const dom = ensureDOM();
    if (!dom) return;
    [dom.v0, dom.v1].forEach(v => { try { v.pause(); } catch (_) { } v.style.opacity = "0"; });
    dom.fade.style.opacity = "0";
    state.segment = null;
    state.pendingSwitch = null;
    pushEvent({ type: "stopped" });
  }

  function init(cfg) {
    state.cfg = Object.assign(state.cfg, cfg || {});
    ensureDOM();
    pushEvent({ type: "init", cfg: state.cfg });
  }

  window.VideoLayer = {
    init,
    playSegment,
    requestSwitch,
    stop,
    popEvent,
  };
})();
