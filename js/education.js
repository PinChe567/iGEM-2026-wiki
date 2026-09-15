/**
 * Education page — ephemeral misconception check.
 * Visitor answers are not stored, sent, or logged.
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
    { id: "status", label: "Status", hint: "delivery vs evaluation" },
    { id: "measurement", label: "Evidence", hint: "what was measured" },
    { id: "method", label: "Method", hint: "how we would measure" },
    { id: "dialogue", label: "Dialogue", hint: "participant discussion" },
    { id: "iteration", label: "Iteration", hint: "what changed" },
    { id: "reusable-resource", label: "Reuse", hint: "what others can run" },
    { id: "limitation", label: "Limitation", hint: "what evidence does not show" },
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
      if (el.closest("[data-chain-static]")) return;
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
          ? "Evidence View on. Scanning labels are highlighted. No facts or limitations were hidden."
          : "Story View on. Narrative reading order is unchanged. Limitations remain visible.";
    }
    if (next !== "evidence") {
      setFilter("");
      setLegendOpen(false);
    }
    syncChainView(next);
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

  function fillLegend(legend) {
    var list = legend.querySelector("[data-edu-legend-list]");
    if (!list || list.children.length) return;
    EVIDENCE_TAGS.forEach(function (meta) {
      var item = document.createElement("li");
      var btn = document.createElement("button");
      var chip = document.createElement("span");
      var kind = document.createElement("span");
      var hint = document.createElement("span");
      btn.type = "button";
      btn.setAttribute("data-edu-filter", meta.id);
      btn.setAttribute("aria-pressed", "false");
      chip.className = "edu-etag";
      chip.setAttribute("data-edu-tag", meta.id);
      kind.className = "edu-etag__kind";
      kind.textContent = meta.label;
      hint.className = "edu-etag__note";
      hint.textContent = meta.hint;
      chip.appendChild(kind);
      chip.appendChild(hint);
      btn.appendChild(chip);
      item.appendChild(btn);
      list.appendChild(item);
    });
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
      fillLegend(legend);
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

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var search = document.getElementById("project-search");
      if (search && search.open) return;
      var openLegend = document.querySelector("[data-edu-legend].is-open");
      if (openLegend) {
        setLegendOpen(false);
        return;
      }
      if (document.body.getAttribute("data-edu-filter")) {
        setFilter("");
        return;
      }
      if (document.body.getAttribute("data-edu-view") === "evidence") {
        setView("story", true);
      }
    });

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

  function initDecideFirst() {
    var root = document.querySelector("[data-edu-decide]");
    if (!root) return;

    var items = root.querySelectorAll("[data-edu-item]");
    var coda = root.querySelector("[data-edu-coda]");

    function paintDots(holder, rejected, held, revealed) {
      if (!holder) return;
      holder.textContent = "";
      var total = rejected + held;
      var i;
      var cell;
      for (i = 0; i < total; i++) {
        cell = document.createElement("span");
        cell.className = "edu-decide__cell";
        cell.setAttribute("aria-hidden", "true");
        cell.style.setProperty("--cell-i", String(i));
        if (revealed) {
          cell.setAttribute("data-kind", i < rejected ? "rejected" : "held");
        }
        holder.appendChild(cell);
      }
    }

    function markChoice(item, selectedInput) {
      var labels = item.querySelectorAll(".edu-decide__choice");
      Array.prototype.forEach.call(labels, function (label) {
        var radio = label.querySelector("input");
        label.classList.toggle("is-selected", radio === selectedInput);
      });
    }

    function visitorLine(choseCorrect, rejected, held) {
      if (choseCorrect) {
        return (
          "You disagreed. In the initial sample, " +
          rejected +
          " of 28 also rejected this statement. Your choice is not recorded and is not part of that sample."
        );
      }
      return (
        "You agreed. In the initial sample, " +
        held +
        " of 28 also did not reject this statement. Your choice is not recorded and is not part of that sample."
      );
    }

    function liveLine(choseCorrect, rejected, held) {
      var result =
        rejected +
        " of 28 rejected this statement; " +
        held +
        " of 28 did not. Scientifically, the claim should be rejected.";
      if (choseCorrect) {
        return "You disagreed. " + result;
      }
      return "You agreed. " + result;
    }

    function allAnswered() {
      var i;
      for (i = 0; i < items.length; i++) {
        if (!items[i].classList.contains("is-answered")) return false;
      }
      return true;
    }

    Array.prototype.forEach.call(items, function (item) {
      var rejected = parseInt(item.getAttribute("data-rejected"), 10);
      var held = parseInt(item.getAttribute("data-held"), 10);
      var holder = item.querySelector(".edu-decide__dots");
      paintDots(holder, rejected, held, false);
    });

    root.addEventListener("change", function (event) {
      var input = event.target;
      if (!input || input.type !== "radio") return;
      var item = input.closest("[data-edu-item]");
      if (!item || !root.contains(item)) return;

      var rejected = parseInt(item.getAttribute("data-rejected"), 10);
      var held = parseInt(item.getAttribute("data-held"), 10);
      var correct = item.getAttribute("data-correct");
      var choseCorrect = input.value === correct;
      var result = item.querySelector(".edu-decide__result");
      var live = item.querySelector(".edu-decide__live");
      var visitor = item.querySelector("[data-edu-visitor]");
      var holder = item.querySelector(".edu-decide__dots");

      var legend = item.querySelector(".edu-decide__legend");
      var chartText = item.querySelector(".edu-decide__chart-text");

      item.classList.add("is-answered");
      markChoice(item, input);
      paintDots(holder, rejected, held, true);
      if (legend) legend.hidden = false;
      if (holder) {
        holder.setAttribute(
          "aria-label",
          rejected + " of 28 respondents rejected this statement; " + held + " of 28 did not."
        );
      }
      if (chartText) {
        chartText.textContent = "Filled squares rejected the claim. Slashed squares did not. Each square is one of the 28 respondents.";
      }
      if (visitor) visitor.textContent = visitorLine(choseCorrect, rejected, held);
      if (live) live.textContent = liveLine(choseCorrect, rejected, held);
      if (result) result.hidden = false;

      if (coda && allAnswered()) coda.hidden = false;
    });
  }

  function syncChainView(view) {
    var root = document.querySelector("[data-edu-chain]");
    if (!root) return;
    var next = view === "evidence" ? "evidence" : "story";
    root.setAttribute("data-chain-view", next);
    var live = root.querySelector("[data-chain-view-live]");
    var tags = root.querySelectorAll(".edu-chain__tags");
    Array.prototype.forEach.call(tags, function (el) {
      el.setAttribute("aria-hidden", next === "story" ? "true" : "false");
    });
    if (live) {
      live.textContent =
        next === "evidence"
          ? "Chain scanning labels are visible. No chain content was hidden."
          : "Chain scanning labels are tucked. The measurement path is unchanged.";
    }
  }

  function initMeasurementChain() {
    var root = document.querySelector("[data-edu-chain]");
    if (!root) return;

    var panel = root.querySelector("[data-chain-panel]");
    var nodes = root.querySelectorAll("[data-chain-node]");
    var staticList = root.querySelector("[data-chain-static]");

    if (staticList) staticList.setAttribute("hidden", "");
    if (panel) panel.removeAttribute("hidden");

    function showNode(id, fromKeyboard) {
      var source = root.querySelector('[data-chain-source="' + id + '"]');
      if (!source || !panel) return;
      var clone = source.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("data-chain-source");
      var heading = clone.querySelector("h4");
      if (heading) {
        var title = document.createElement("h3");
        title.id = "edu-chain-panel-title";
        title.textContent = heading.textContent;
        heading.parentNode.replaceChild(title, heading);
      }
      while (panel.firstChild) panel.removeChild(panel.firstChild);
      panel.appendChild(clone);
      Array.prototype.forEach.call(nodes, function (node) {
        var on = node.getAttribute("data-chain-node") === id;
        if (on) node.setAttribute("aria-current", "true");
        else node.removeAttribute("aria-current");
      });
      if (fromKeyboard && panel.focus) {
        panel.setAttribute("tabindex", "-1");
      }
    }

    root.addEventListener("click", function (event) {
      var node = event.target.closest("[data-chain-node]");
      if (!node || !root.contains(node)) return;
      event.preventDefault();
      showNode(node.getAttribute("data-chain-node"), false);
    });

    root.addEventListener("keydown", function (event) {
      var node = event.target.closest("[data-chain-node]");
      if (!node || !root.contains(node)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      showNode(node.getAttribute("data-chain-node"), true);
    });

    syncChainView(document.body.getAttribute("data-edu-view") || "story");
    showNode("a-survey", false);
  }

  function initLabPath() {
    var nav = document.querySelector("[data-edu-labpath]");
    if (!nav) return;
    var links = nav.querySelectorAll("[data-lab-node]");
    function setCurrent(id) {
      Array.prototype.forEach.call(links, function (link) {
        var on = link.getAttribute("data-lab-node") === id;
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("[data-lab-node]");
      if (!link || !nav.contains(link)) return;
      setCurrent(link.getAttribute("data-lab-node"));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPhilosophyLoop();
    hydrateEvidenceMarks(document);
    initEvidenceView();
    initDecideFirst();
    initMeasurementChain();
    initLabPath();
  });
})(window);
