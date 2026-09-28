(function () {
  "use strict";

  var root = document.querySelector("[data-lightsheet-player]");
  if (!root) return;

  var canvas = root.querySelector("canvas");
  var context = canvas.getContext("2d");
  var button = root.querySelector("[data-lightsheet-play]");
  var seek = root.querySelector("[data-lightsheet-seek]");
  var time = root.querySelector("[data-lightsheet-time]");
  var status = root.querySelector("[data-lightsheet-status]");
  var index = null;
  var bytes = null;
  var frame = 0;
  var playing = false;
  var timer = null;
  var drawing = false;
  var requestedFrame = null;
  var loading = null;

  function timestamp(seconds) {
    var value = Math.floor(seconds);
    return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
  }

  function updateControls() {
    var fps = index ? index.fps : 6;
    var count = index ? index.frames : Number(seek.max) + 1;
    seek.value = String(frame);
    time.textContent = timestamp(frame / fps) + " / " + timestamp(count / fps);
    button.textContent = playing ? "Pause" : "Play";
    button.setAttribute("aria-label", (playing ? "Pause" : "Play") + " light-sheet recording");
  }

  function stop() {
    playing = false;
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    updateControls();
  }

  async function load() {
    if (index && bytes) return;
    if (loading) return loading;
    status.textContent = "Loading light-sheet frames…";
    button.disabled = true;
    loading = Promise.all([
      fetch(root.dataset.index).then(function (response) {
        if (!response.ok) throw new Error("Frame index unavailable");
        return response.json();
      }),
      fetch(root.dataset.frames).then(function (response) {
        if (!response.ok) throw new Error("Frame data unavailable");
        return response.arrayBuffer();
      }),
    ]).then(function (results) {
      index = results[0];
      bytes = results[1];
      if (!index || !Array.isArray(index.offsets) || index.offsets.length !== index.frames + 1 || index.offsets[index.frames] !== bytes.byteLength) {
        throw new Error("Frame data is incomplete");
      }
      canvas.width = index.width;
      canvas.height = index.height;
      seek.max = String(index.frames - 1);
      status.textContent = "Team recording · 6 frames per second";
      updateControls();
    }).catch(function (error) {
      index = null;
      bytes = null;
      status.textContent = "The web player could not load. The original AVI remains available below.";
      throw error;
    }).finally(function () {
      button.disabled = false;
      loading = null;
    });
    return loading;
  }

  async function draw(target) {
    requestedFrame = target;
    if (drawing) return;
    drawing = true;
    try {
      while (requestedFrame !== null) {
        var current = requestedFrame;
        requestedFrame = null;
        var jpeg = new Blob([bytes.slice(index.offsets[current], index.offsets[current + 1])], { type: "image/jpeg" });
        var bitmap = await createImageBitmap(jpeg);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        root.classList.add("is-ready");
      }
    } catch (error) {
      stop();
      status.textContent = "The recording stopped because a frame could not be decoded.";
    } finally {
      drawing = false;
    }
  }

  button.addEventListener("click", async function () {
    if (playing) {
      stop();
      return;
    }
    try {
      await load();
    } catch (error) {
      return;
    }
    playing = true;
    updateControls();
    draw(frame);
    timer = window.setInterval(function () {
      if (frame >= index.frames - 1) {
        stop();
        return;
      }
      frame += 1;
      updateControls();
      draw(frame);
    }, 1000 / index.fps);
  });

  seek.addEventListener("input", async function () {
    try {
      await load();
    } catch (error) {
      return;
    }
    frame = Math.min(index.frames - 1, Math.max(0, Number(seek.value)));
    updateControls();
    draw(frame);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && playing) stop();
  });
})();
