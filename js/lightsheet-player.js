(function () {
  "use strict";
  async function fetchFrameBytes(originalUrl, manifestUrl) {
    // Without the new optional manifest attribute, preserve the existing BIN request.
    if (!manifestUrl) {
      var originalResponse = await fetch(originalUrl);
      if (!originalResponse.ok) throw new Error("Frame data unavailable");
      return originalResponse.arrayBuffer();
    }
    function officialUrl(value) {
      var parsed = new URL(value);
      if (parsed.protocol !== "https:" || parsed.hostname !== "static.igem.wiki" || parsed.username || parsed.password) throw new Error("Invalid frame-container URL");
      return parsed.href;
    }
    async function hash(bytes) {
      var digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), function (value) { return value.toString(16).padStart(2, "0"); }).join("");
    }
    function validHash(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
    function positive(value) { return Number.isSafeInteger(value) && value > 0; }
    async function fetchJsonBytes(url) {
      var response = await fetch(officialUrl(url), { mode: "cors", credentials: "omit", redirect: "error" });
      if (!response.ok) throw new Error("Frame container unavailable");
      return response.arrayBuffer();
    }
    var manifestBuffer = await fetchJsonBytes(manifestUrl);
    var manifest = JSON.parse(new TextDecoder().decode(manifestBuffer));
    if (manifest.schema !== "aerosense.frame-bytes-manifest.v1" || manifest.encoding !== "base64" || manifest.ready_for_upload !== true || !positive(manifest.total_bytes) || !validHash(manifest.sha256) || !Array.isArray(manifest.chunks) || !manifest.chunks.length || manifest.chunk_count !== manifest.chunks.length) throw new Error("Invalid frame manifest");
    var expectedOffset = 0;
    manifest.chunks.forEach(function (part, index) {
      if (part.index !== index || part.offset !== expectedOffset || !positive(part.length) || !validHash(part.sha256) || !validHash(part.json_sha256) || !part.official_url) throw new Error("Incomplete or unordered frame manifest");
      officialUrl(part.official_url);
      expectedOffset += part.length;
    });
    if (expectedOffset !== manifest.total_bytes) throw new Error("Frame manifest length mismatch");
    var result = new Uint8Array(manifest.total_bytes);
    // Fetch one part at a time: large JPEG frame buffers need no parallel JSON copies.
    for (var sequence = 0; sequence < manifest.chunks.length; sequence++) {
      var part = manifest.chunks[sequence];
      var container = await fetchJsonBytes(part.official_url);
      if (await hash(container) !== part.json_sha256) throw new Error("Frame chunk JSON checksum mismatch");
      var payload = JSON.parse(new TextDecoder().decode(container));
      if (payload.schema !== "aerosense.frame-bytes-chunk.v1" || payload.encoding !== "base64" || payload.index !== sequence || payload.offset !== part.offset || payload.length !== part.length || payload.sha256 !== part.sha256 || typeof payload.data !== "string" || payload.data.length !== Math.ceil(part.length / 3) * 4) throw new Error("Invalid frame chunk metadata");
      var binary = atob(payload.data);
      if (binary.length !== part.length) throw new Error("Frame chunk decoded length mismatch");
      var decoded = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) decoded[i] = binary.charCodeAt(i);
      if (await hash(decoded) !== part.sha256) throw new Error("Frame chunk decoded checksum mismatch");
      result.set(decoded, part.offset);
    }
    if (await hash(result) !== manifest.sha256) throw new Error("Restored frame checksum mismatch");
    return result.buffer;
  }
  function tr(value) { return window.AeroSenseI18n ? window.AeroSenseI18n.t(value) : value; }
  function timestamp(seconds, precise) {
    var value = Math.max(0, Number(seconds) || 0);
    if (precise) value = Math.round(value * 10) / 10;
    return String(Math.floor(value / 60)).padStart(2, "0") + ":" + (precise ? (value % 60).toFixed(1).padStart(4, "0") : String(Math.floor(value % 60)).padStart(2, "0"));
  }
  function initialize(root) {
    var canvas = root.querySelector("canvas");
    var button = root.querySelector("[data-lightsheet-play]");
    var seek = root.querySelector("[data-lightsheet-seek]");
    var time = root.querySelector("[data-lightsheet-time]");
    var status = root.querySelector("[data-lightsheet-status]");
    var phase = root.querySelector("[data-lightsheet-phase]");
    if (!canvas || !button || !seek || !time || !status) return;
    var context = canvas.getContext("2d");
    if (!context) return;
    var index = null, bytes = null, frame = 0, playing = false, timer = null;
    var drawing = false, requestedFrame = null, loading = null, visible = true, playRequest = 0;
    var statusMessage = "Select Play to load the recording.";
    function setStatus(message) { statusMessage = message; status.textContent = tr(message); }
    function updateControls() {
      var fps = index ? index.fps : 6;
      var count = index ? index.frames : Number(seek.max) + 1;
      var acquired = index && index.acquisitionTimesSeconds ? index.acquisitionTimesSeconds[frame] : null;
      var initialDuration = Number(root.dataset.acquisitionDuration);
      seek.value = String(frame);
      if (acquired !== null) {
        var duration = index.acquisitionTimesSeconds[index.frames - 1];
        time.textContent = tr("Acquisition time") + " " + timestamp(acquired, true) + " / " + timestamp(duration, true);
        seek.setAttribute("aria-valuetext", tr("Acquisition time") + " " + acquired.toFixed(3) + " s");
      } else if (!index && initialDuration > 0) {
        time.textContent = tr("Acquisition time") + " " + timestamp(0, true) + " / " + timestamp(initialDuration, true);
      } else {
        // Earlier indexes without acquisition metadata retain their playback clock.
        time.textContent = timestamp(frame / fps, false) + " / " + timestamp(count / fps, false);
      }
      if (phase && index && Array.isArray(index.odorPhases)) {
        var active = index.odorPhases.find(function (item) {
          return acquired >= item.start && (acquired < item.end || (frame === index.frames - 1 && acquired === item.end));
        });
        phase.textContent = active ? tr(active.label) : tr("Odor off");
        phase.dataset.active = String(Boolean(active));
      }
      button.textContent = tr(playing ? "Pause" : "Play");
      button.setAttribute("aria-label", tr((playing ? "Pause" : "Play") + " light-sheet recording"));
      root.dataset.playing = String(playing);
    }
    function stop() {
      playRequest += 1; playing = false;
      if (timer !== null) window.clearInterval(timer);
      timer = null; updateControls();
    }
    function validIndex(value, length) {
      if (!value || !Number.isInteger(value.frames) || value.frames < 1 || !(value.fps > 0) || !(value.width > 0) || !(value.height > 0)) return false;
      if (!Array.isArray(value.offsets) || value.offsets.length !== value.frames + 1 || value.offsets[0] !== 0 || value.offsets[value.frames] !== length) return false;
      if (!value.offsets.every(function (offset, i) { return Number.isInteger(offset) && (i === 0 || offset > value.offsets[i - 1]); })) return false;
      if (value.acquisitionTimesSeconds && (!Array.isArray(value.acquisitionTimesSeconds) || value.acquisitionTimesSeconds.length !== value.frames || !value.acquisitionTimesSeconds.every(function (second, i) { return Number.isFinite(second) && second >= 0 && (i === 0 || second >= value.acquisitionTimesSeconds[i - 1]); }))) return false;
      return true;
    }
    async function load() {
      if (index && bytes) return;
      if (loading) return loading;
      setStatus("Loading light-sheet frames…"); button.disabled = true;
      loading = Promise.all([
        fetch(root.dataset.index).then(function (response) { if (!response.ok) throw new Error("Frame index unavailable"); return response.json(); }),
        fetchFrameBytes(root.dataset.frames, root.dataset.framesManifest)
      ]).then(function (results) {
        if (!validIndex(results[0], results[1].byteLength)) throw new Error("Frame data is incomplete");
        index = results[0]; bytes = results[1]; canvas.width = index.width; canvas.height = index.height;
        seek.max = String(index.frames - 1);
        setStatus(index.acquisitionTimesSeconds ? "Acquisition clock · playback at 6 frames/s" : "Team recording · 6 frames per second");
        updateControls();
      }).catch(function (error) {
        index = null; bytes = null;
        setStatus("The web player could not load. Zenodo publication is pending."); throw error;
      }).finally(function () { button.disabled = false; loading = null; });
      return loading;
    }
    async function draw(target) {
      requestedFrame = target;
      if (drawing) return;
      drawing = true;
      try {
        while (requestedFrame !== null) {
          var current = requestedFrame; requestedFrame = null;
          var view = new Uint8Array(bytes, index.offsets[current], index.offsets[current + 1] - index.offsets[current]);
          var bitmap = await createImageBitmap(new Blob([view], { type: "image/jpeg" }));
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
          root.classList.add("is-ready"); root.dataset.frame = String(current);
        }
      } catch (error) { stop(); setStatus("The recording stopped because a frame could not be decoded."); }
      finally { drawing = false; }
    }
    button.addEventListener("click", async function () {
      if (playing) { stop(); return; }
      var request = ++playRequest;
      try { await load(); } catch (error) { return; }
      if (request !== playRequest || document.hidden || !visible) { setStatus("Recording paused. Select Play to continue."); updateControls(); return; }
      if (frame >= index.frames - 1) frame = 0;
      playing = true;
      setStatus(index.acquisitionTimesSeconds ? "Acquisition clock · playback at 6 frames/s" : "Team recording · 6 frames per second");
      updateControls(); draw(frame);
      timer = window.setInterval(function () {
        if (frame >= index.frames - 1) { stop(); return; }
        frame += 1; updateControls(); draw(frame);
      }, 1000 / index.fps);
    });
    seek.addEventListener("input", async function () {
      var target = Number(seek.value);
      try { await load(); } catch (error) { return; }
      frame = Math.min(index.frames - 1, Math.max(0, target)); updateControls(); draw(frame);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && (playing || loading)) { stop(); setStatus("Recording paused. Select Play to continue."); }
    });
    document.addEventListener("aerosense:languagechange", function () { updateControls(); status.textContent = tr(statusMessage); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible && (playing || loading)) { stop(); setStatus("Recording paused outside the reading area. Select Play to continue."); }
      }, { threshold: 0 }).observe(root);
    }
    window.addEventListener("pagehide", stop);
    updateControls();
  }
  document.querySelectorAll("[data-lightsheet-player]").forEach(initialize);
})();
