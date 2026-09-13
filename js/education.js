/**
 * Education page — philosophy loop + Story / Evidence view.
 * Evidence View highlights existing labels. It does not hide content or invent results.
 */
(function (root) {
  "use strict";

  var COPY = {
    learn: {
      title: "Learn",
      body: "Expose the idea. Put the claim in front of someone before asking them to defend it.",
    },
    play: {
      title: "Play",
      body: "Interact with it. A decision, a mismatch, or a failed guess is more informative than a paragraph.",
    },
    question: {
      title: "Question",
      body: "Challenge assumptions. Screening is not confirmation. A glow is not a measurement. A score is not literacy.",
    },
    measure: {
      title: "Measure",
      body: "Test what changed. Same-concept pre/post items, not satisfaction scores dressed up as learning.",
    },
    listen: {
      title: "Listen",
      body: "Collect feedback. Local reflections and future approved instruments — not invented quotes.",
    },
    iterate: {
      title: "Iterate",
      body: "Change the material, or change how AeroSense talks about risk. Education is unfinished if nothing moved.",
    },
  };

  var EVIDENCE_TAGS = [
    { id: "dialogue", label: "Dialogue", hint: "participant discussion" },
    { id: "measurement", label: "Measurement", hint: "pre/post assessment" },
    { id: "iteration", label: "Iteration", hint: "game redesign" },
    { id: "project-change", label: "Project change", hint: "risk communication revision" },
    { id: "reusable-resource", label: "Reusable resource", hint: "teacher toolkit" },
    { id: "limitation", label: "Limitation", hint: "unpublished or bounded claim" },
  ];

  function tagMeta(id) {
    var i;
    for (i = 0; i < EVIDENCE_TAGS.length; i++) {
      if (EVIDENCE_TAGS[i].id === id) return EVIDENCE_TAGS[i];
    }
    return null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function noteFor(el, id) {
    return el.getAttribute("data-note-" + id) || "";
  }

  function hydrateEvidenceMarks(scope) {
    var rootEl = scope || document;
    var marks = rootEl.querySelectorAll("[data-edu-tags]");
    Array.prototype.forEach.call(marks, function (el) {
      if (el.querySelector(".edu-etags")) return;
      var ids = (el.getAttribute("data-edu-tags") || "")
        .trim()
        .split(/\s+/)
        .filter(function (id) {
          return tagMeta(id);
        });
      if (!ids.length) return;
      var list = document.createElement("ul");
      list.className = "edu-etags";
      list.setAttribute("aria-label", "Evidence labels");
      ids.forEach(function (id) {
        var meta = tagMeta(id);
        var note = noteFor(el, id);
        var item = document.createElement("li");
        var chip = document.createElement("span");
        chip.className = "edu-etag";
        chip.setAttribute("data-edu-tag", id);
        var kind = document.createElement("span");
        kind.className = "edu-etag__kind";
        kind.textContent = meta.label;
        chip.appendChild(kind);
        if (note) {
          var extra = document.createElement("span");
          extra.className = "edu-etag__note";
          extra.textContent = note;
          chip.appendChild(extra);
        }
        item.appendChild(chip);
        list.appendChild(item);
      });
      var heading = el.querySelector(":scope > h2, :scope > h3, :scope > h4");
      if (heading) heading.parentNode.insertBefore(list, heading.nextSibling);
      else el.insertBefore(list, el.firstChild);
    });
  }

  function setView(view, persist) {
    var next = view === "evidence" ? "evidence" : "story";
    document.body.setAttribute("data-edu-view", next);
    document.body.classList.toggle("page-education--evidence", next === "evidence");
    var buttons = document.querySelectorAll("button[data-edu-view]");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-edu-view") === next ? "true" : "false");
    });
    var live = document.querySelector("[data-edu-view-live]");
    if (live) {
      live.textContent =
        next === "evidence"
          ? "Evidence View on. Labels are highlighted. No content was hidden."
          : "Story View on. Narrative reading order is unchanged.";
    }
    if (next !== "evidence") setFilter("");
    if (persist) {
      try {
        var url = new URL(window.location.href);
        if (next === "evidence") url.searchParams.set("view", "evidence");
        else url.searchParams.delete("view");
        history.replaceState({}, "", url);
      } catch (err) {
        /* ignore */
      }
    }
    var legend = document.querySelector("[data-edu-legend]");
    if (legend && next === "evidence" && window.matchMedia("(max-width: 839px)").matches) {
      setLegendOpen(false);
    }
  }

  function setFilter(id) {
    var next = tagMeta(id) ? id : "";
    if (next) document.body.setAttribute("data-edu-filter", next);
    else document.body.removeAttribute("data-edu-filter");
    var chips = document.querySelectorAll("button[data-edu-filter]");
    Array.prototype.forEach.call(chips, function (btn) {
      var on = next && btn.getAttribute("data-edu-filter") === next;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setLegendOpen(open) {
    var legend = document.querySelector("[data-edu-legend]");
    var toggle = legend && legend.querySelector("[data-edu-legend-toggle]");
    if (!legend || !toggle) return;
    legend.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function initPhilosophyLoop() {
    var loopRoot = document.querySelector("[data-edu-loop]");
    if (!loopRoot) return;
    var buttons = loopRoot.querySelectorAll("[data-step]");
    var title = loopRoot.querySelector("[data-loop-title]");
    var body = loopRoot.querySelector("[data-loop-body]");
    if (!buttons.length || !title || !body) return;

    function show(id) {
      var item = COPY[id] || COPY.learn;
      title.textContent = item.title;
      body.textContent = item.body;
      Array.prototype.forEach.call(buttons, function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-step") === id ? "true" : "false");
      });
    }

    loopRoot.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-step]");
      if (!btn || !loopRoot.contains(btn)) return;
      show(btn.getAttribute("data-step"));
    });

    show("learn");
  }

  function initEvidenceView() {
    var switcher = document.querySelector("[data-edu-view-switch]");
    if (!switcher) return;

    switcher.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-edu-view]");
      if (!btn || !switcher.contains(btn)) return;
      setView(btn.getAttribute("data-edu-view"), true);
    });

    var legend = document.querySelector("[data-edu-legend]");
    if (legend) {
      legend.addEventListener("click", function (event) {
        var toggle = event.target.closest("[data-edu-legend-toggle]");
        if (toggle) {
          setLegendOpen(toggle.getAttribute("aria-expanded") !== "true");
          return;
        }
        var filterBtn = event.target.closest("[data-edu-filter]");
        if (!filterBtn || !legend.contains(filterBtn)) return;
        var id = filterBtn.getAttribute("data-edu-filter");
        setFilter(document.body.getAttribute("data-edu-filter") === id ? "" : id);
      });
    }

    var requested = "";
    try {
      requested = new URL(window.location.href).searchParams.get("view") || "";
    } catch (err) {
      requested = "";
    }
    setView(requested === "evidence" ? "evidence" : "story", false);
  }

  root.AerosenseEducation = root.AerosenseEducation || {};
  root.AerosenseEducation.EVIDENCE_TAGS = EVIDENCE_TAGS;
  root.AerosenseEducation.hydrateEvidenceMarks = hydrateEvidenceMarks;
  root.AerosenseEducation.escapeEvidenceHtml = escapeHtml;

  document.addEventListener("DOMContentLoaded", function () {
    initPhilosophyLoop();
    hydrateEvidenceMarks(document);
    initEvidenceView();
  });
})(window);
