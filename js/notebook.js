/**
 * AeroSense Notebook page shell + primary Calendar experience.
 * All views consume window.AerosenseNotebook.EVENTS (notebook-data.js).
 */
(function () {
  "use strict";

  var YEAR = 2026;

  var STATUS_LABEL = {
    completed: "Completed",
    ongoing: "Ongoing",
    planned: "Planned",
    "needs-update": "Needs update",
    igem: "iGEM official",
  };

  var STREAM_LABEL = {
    wetlab: "Wet Lab",
    hardware: "Hardware",
    drylab: "Dry Lab",
    igem: "iGEM Official",
  };

  var STREAM_ORDER = ["wetlab", "hardware", "drylab", "igem"];

  var MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  var MONTH_LABEL = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function debounce(fn, wait) {
    var timer = null;
    return function debounced() {
      var ctx = this;
      var args = arguments;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isCoarsePointer() {
    return (
      (window.matchMedia &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches) ||
      false
    );
  }

  /** Ensure future evidence images do not block first paint. */
  function softLazyImages(root) {
    qsa("img:not([loading])", root || document).forEach(function (img) {
      if (img.closest(".site-header, .brand")) return;
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      if (!img.getAttribute("width") && img.naturalWidth) {
        img.setAttribute("width", String(img.naturalWidth));
      }
      if (!img.getAttribute("height") && img.naturalHeight) {
        img.setAttribute("height", String(img.naturalHeight));
      }
    });
  }

  function getApi() {
    return window.AerosenseNotebook || null;
  }

  function getTeamEvents() {
    var api = getApi();
    return api && Array.isArray(api.EVENTS) ? api.EVENTS : [];
  }

  function getOfficialEvents() {
    var api = getApi();
    if (!api || !Array.isArray(api.IGEM_OFFICIAL_EVENTS)) return [];
    if (typeof api.projectOfficialEvent === "function") {
      return api.IGEM_OFFICIAL_EVENTS.map(api.projectOfficialEvent);
    }
    return api.IGEM_OFFICIAL_EVENTS.map(function (official) {
      return {
        id: official.id,
        startDate: official.startDate,
        endDate: official.endDate,
        datePrecision: "day",
        stream: "igem",
        category: official.category || "",
        status: "official",
        title: official.title,
        shortSummary: official.note || "",
        isOfficial: true,
        sourceLabel: official.sourceLabel,
        sourceUrl: official.sourceUrl,
        lastChecked: official.lastChecked,
        note: official.note || "",
        tags: official.tags || [],
      };
    });
  }

  function getEvents() {
    return getTeamEvents();
  }

  function chroniclePool(teamEvents, officialEvents, filters) {
    var pool = teamEvents.slice();
    if (!filters || filters.showIgem !== false) {
      pool = pool.concat(officialEvents);
    }
    return pool;
  }

  function dateSortKey(value) {
    if (!value) return -1;
    var parts = String(value).split("-");
    var y = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    var d = parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0;
    return y * 10000 + m * 100 + d;
  }

  function eventEndKey(ev) {
    return dateSortKey(ev.endDate || ev.startDate);
  }

  function eventsForStream(events, stream) {
    return events.filter(function (ev) {
      return ev.stream === stream;
    });
  }

  function deriveStreamStatus(streamEvents) {
    if (!streamEvents.length) return "planned";
    var i;
    for (i = 0; i < streamEvents.length; i += 1) {
      if (streamEvents[i].status === "ongoing") return "ongoing";
    }
    var nonPlanned = streamEvents.filter(function (ev) {
      return ev.status !== "planned";
    });
    var pool = nonPlanned.length ? nonPlanned : streamEvents;
    var sorted = pool.slice().sort(function (a, b) {
      return eventEndKey(b) - eventEndKey(a);
    });
    return sorted[0].status || "needs-update";
  }

  function latestMilestone(streamEvents) {
    if (!streamEvents.length) return null;
    var nonPlanned = streamEvents.filter(function (ev) {
      return ev.status !== "planned";
    });
    var pool = nonPlanned.length ? nonPlanned : streamEvents;
    return pool.slice().sort(function (a, b) {
      return eventEndKey(b) - eventEndKey(a);
    })[0];
  }

  function nextStepBlurb(streamEvents) {
    var i;
    var ev;
    for (i = 0; i < streamEvents.length; i += 1) {
      ev = streamEvents[i];
      if (ev.status === "ongoing") {
        return ev.nextStep || ev.nextQuestion || ev.shortSummary || null;
      }
    }
    var planned = streamEvents
      .filter(function (e) {
        return e.status === "planned";
      })
      .sort(function (a, b) {
        return eventEndKey(a) - eventEndKey(b);
      });
    if (planned.length) {
      return planned[0].shortSummary || planned[0].title || null;
    }
    return null;
  }

  function truncate(text, max) {
    if (!text) return "";
    var t = String(text).replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  }

  function setStatusEl(el, status) {
    if (!el) return;
    var key = STATUS_LABEL[status] ? status : "needs-update";
    el.className = "nb-status nb-status--" + key;
    el.setAttribute("data-status", key);
    var mark = qs(".nb-status__mark", el);
    var text = qs(".nb-status__text", el);
    if (!mark) {
      mark = document.createElement("span");
      mark.className = "nb-status__mark";
      mark.setAttribute("aria-hidden", "true");
      el.insertBefore(mark, el.firstChild);
    }
    if (!text) {
      text = document.createElement("span");
      text.className = "nb-status__text";
      el.appendChild(text);
    }
    text.textContent = STATUS_LABEL[key] || key;
  }

  function fillStreamCards(root, events) {
    var live = qs("#nb-glance-live", root);
    var streams = ["wetlab", "hardware", "drylab"];
    var total = 0;

    streams.forEach(function (stream) {
      var card = qs('[data-stream-card="' + stream + '"]', root);
      if (!card) return;
      var list = eventsForStream(events, stream);
      total += list.length;
      var status = deriveStreamStatus(list);
      var milestone = latestMilestone(list);
      var next = nextStepBlurb(list);

      card.setAttribute("data-stream-status-value", status);
      setStatusEl(qs("[data-stream-status]", card), status);

      var countEl = qs("[data-stream-count]", card);
      if (countEl) countEl.textContent = String(list.length);

      var mileEl = qs("[data-stream-milestone]", card);
      if (mileEl) {
        mileEl.textContent = milestone
          ? milestone.title
          : "No documented records yet";
      }

      var nextWrap = qs("[data-stream-next-wrap]", card);
      var nextEl = qs("[data-stream-next]", card);
      if (nextWrap && nextEl) {
        if (next) {
          nextWrap.hidden = false;
          nextEl.textContent = truncate(next, 110);
        } else {
          nextWrap.hidden = true;
          nextEl.textContent = "";
        }
      }
    });

    if (live) {
      live.textContent =
        total +
        " documented records across Wet Lab, Hardware and Dry Lab — counts computed from notebook-data.js.";
    }
  }

  function collectMonths(events) {
    var map = {};
    events.forEach(function (ev) {
      [ev.startDate, ev.endDate].forEach(function (d) {
        if (!d) return;
        var parts = String(d).split("-");
        if (parts.length < 2) return;
        map[parts[0] + "-" + parts[1]] = true;
      });
    });
    return Object.keys(map).sort();
  }

  function collectTags(events) {
    var map = {};
    events.forEach(function (ev) {
      if (ev.category) map[ev.category] = true;
      (ev.tags || []).forEach(function (tag) {
        if (tag) map[tag] = true;
      });
    });
    return Object.keys(map).sort();
  }

  function fillFilterOptions(form, events) {
    var monthSel = qs("[data-filter-month]", form);
    var tagSel = qs("[data-filter-tag]", form);
    if (monthSel) {
      collectMonths(events).forEach(function (key) {
        var parts = key.split("-");
        var opt = document.createElement("option");
        opt.value = key;
        opt.textContent = (MONTH_LABEL[parts[1]] || parts[1]) + " " + parts[0];
        monthSel.appendChild(opt);
      });
    }
    if (tagSel) {
      collectTags(events).forEach(function (tag) {
        var opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        tagSel.appendChild(opt);
      });
    }
  }

  function readFilters(form) {
    function val(name, fallback) {
      var el = form.elements.namedItem(name);
      if (!el || el.value == null || el.value === "") return fallback;
      return el.value;
    }
    function checked(name, fallback) {
      var el = form.elements.namedItem(name);
      if (!el || typeof el.checked !== "boolean") return fallback;
      return el.checked;
    }
    return {
      stream: val("stream", "all"),
      status: val("status", "all"),
      month: val("month", "all"),
      tag: val("tag", "all"),
      q: String(val("q", "")).trim().toLowerCase(),
      showIgem: checked("showIgem", true),
    };
  }

  function eventMatchesMonth(ev, month) {
    if (month === "all") return true;
    if (!ev.startDate && !ev.endDate) return month === "undated";
    var start = ev.startDate ? String(ev.startDate) : "";
    var end = ev.endDate ? String(ev.endDate) : start;
    var sm = start.slice(0, 7);
    var em = end.slice(0, 7);
    return sm === month || em === month || (sm <= month && em >= month);
  }

  function filterEvents(teamEvents, filters, officialEvents) {
    var pool = chroniclePool(teamEvents, officialEvents || [], filters);
    return pool.filter(function (ev) {
      if (filters.stream !== "all" && ev.stream !== filters.stream) return false;
      if (filters.status !== "all") {
        if (ev.isOfficial) return false;
        if (ev.status !== filters.status) return false;
      }
      if (!eventMatchesMonth(ev, filters.month)) return false;
      if (filters.tag !== "all") {
        var inCat = ev.category === filters.tag;
        var inTags = (ev.tags || []).indexOf(filters.tag) !== -1;
        if (!inCat && !inTags) return false;
      }
      if (filters.q) {
        var hay = [
          ev.title,
          ev.shortSummary,
          ev.note,
          ev.sourceLabel,
          ev.decision,
          ev.result,
          ev.category,
          (ev.tags || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (hay.indexOf(filters.q) === -1) return false;
      }
      return true;
    });
  }

  function updateViewCounts(root, count) {
    qsa("[data-view-count]", root).forEach(function (el) {
      el.textContent = "Records matching filters: " + count;
    });
  }

  function initViews(root) {
    var tabs = qsa("[data-nb-view]", root);
    var panels = qsa("[data-nb-panel]", root);
    if (!tabs.length || !panels.length) return { select: function () {} };

    function select(view, focusTab) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-nb-view") === view;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute("data-nb-panel") === view;
        panel.classList.toggle("is-active", on);
        panel.hidden = !on;
      });
      if (focusTab) {
        var active = qs('[data-nb-view="' + view + '"]', root);
        if (active) active.focus();
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("data-nb-view"), false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          select(next.getAttribute("data-nb-view"), true);
        }
      });
    });

    select("calendar", false);
    return { select: select };
  }

  /* ========================= Calendar helpers ========================= */

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDateLabel(d) {
    if (!d) return "Date needs update";
    var parts = String(d).split("-");
    if (parts.length === 2) {
      return (MONTH_LABEL[parts[1]] || parts[1]) + " " + parts[0];
    }
    if (parts.length === 3) {
      return (
        (MONTH_LABEL[parts[1]] || parts[1]) +
        " " +
        Number(parts[2]) +
        ", " +
        parts[0]
      );
    }
    return String(d);
  }

  function formatRange(ev) {
    if (!ev.startDate && !ev.endDate) return "Date needs update";
    if (!ev.endDate || ev.startDate === ev.endDate) {
      return formatDateLabel(ev.startDate);
    }
    return formatDateLabel(ev.startDate) + " – " + formatDateLabel(ev.endDate);
  }

  function parseMonthParts(d) {
    if (!d) return null;
    var parts = String(d).split("-");
    if (parts.length < 2) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parts.length > 2 ? parseInt(parts[2], 10) : null,
    };
  }

  /** Month index 0–11 within YEAR, or null if outside / undated. */
  function monthIndexInYear(d, year) {
    var p = parseMonthParts(d);
    if (!p || p.year !== year) return null;
    if (p.month < 1 || p.month > 12) return null;
    return p.month - 1;
  }

  /**
   * Placement in the 2026 year grid.
   * Returns null if the event does not intersect YEAR at all (except undated).
   */
  function placementInYear(ev, year) {
    if (!ev.startDate && !ev.endDate) {
      return { undated: true, start: null, end: null };
    }
    var startP = parseMonthParts(ev.startDate || ev.endDate);
    var endP = parseMonthParts(ev.endDate || ev.startDate);
    if (!startP || !endP) {
      return { undated: true, start: null, end: null };
    }

    var startAbs = startP.year * 12 + (startP.month - 1);
    var endAbs = endP.year * 12 + (endP.month - 1);
    if (endAbs < startAbs) endAbs = startAbs;

    var yearStart = year * 12;
    var yearEnd = year * 12 + 11;
    if (endAbs < yearStart || startAbs > yearEnd) return null;

    var start = Math.max(startAbs, yearStart) - yearStart;
    var end = Math.min(endAbs, yearEnd) - yearStart;
    return { undated: false, start: start, end: end };
  }

  function overlapsMonth(ev, year, monthIndex) {
    var place = placementInYear(ev, year);
    if (!place || place.undated) return false;
    return place.start <= monthIndex && place.end >= monthIndex;
  }

  function assignTracks(placed) {
    var tracks = [];
    placed
      .slice()
      .sort(function (a, b) {
        if (a.start !== b.start) return a.start - b.start;
        return b.end - b.start - (a.end - a.start);
      })
      .forEach(function (item) {
        var t;
        for (t = 0; t < tracks.length; t += 1) {
          if (tracks[t] < item.start) {
            tracks[t] = item.end;
            item.track = t;
            return;
          }
        }
        item.track = tracks.length;
        tracks.push(item.end);
      });
    return tracks.length;
  }

  function statusClass(ev) {
    if (ev.isOfficial || ev.stream === "igem") return "igem";
    return STATUS_LABEL[ev.status] ? ev.status : "needs-update";
  }

  function buildOfficialDrawerBody(bodyEl, ev) {
    bodyEl.innerHTML = "";

    var header = makeEl("header", "nb-event-drawer__header");
    header.appendChild(makeEl("p", "nb-event-drawer__when", formatRange(ev)));
    header.appendChild(
      makeEl("p", "nb-event-drawer__stream", STREAM_LABEL.igem)
    );

    var statusWrap = makeEl("p", "nb-status nb-status--igem");
    statusWrap.appendChild(makeEl("span", "nb-status__mark"));
    statusWrap.lastChild.setAttribute("aria-hidden", "true");
    statusWrap.appendChild(
      makeEl("span", "nb-status__text", STATUS_LABEL.igem)
    );
    header.appendChild(statusWrap);

    var title = makeEl("h2", "nb-event-drawer__title", ev.title);
    title.id = "nb-event-drawer-title";
    header.appendChild(title);

    bodyEl.appendChild(header);

    var banner = makeEl(
      "p",
      "nb-event-drawer__official-banner",
      "Official iGEM competition milestone — sourced externally; not an AeroSense team accomplishment."
    );
    banner.setAttribute("role", "note");
    bodyEl.appendChild(banner);

    if (hasText(ev.note)) {
      appendSection(bodyEl, "Official note", makeTextBlock(ev.note));
    }

    var sourceBlock = makeEl("div", "nb-event-drawer__stack");
    if (hasText(ev.sourceLabel)) {
      sourceBlock.appendChild(
        makeEl("p", "nb-event-drawer__sublabel", "Source label")
      );
      sourceBlock.appendChild(makeTextBlock(ev.sourceLabel));
    }
    if (hasText(ev.sourceUrl)) {
      var sourceList = makeEl("ul", "nb-event-drawer__list");
      var li = makeEl("li");
      var a = makeEl("a", null, ev.sourceUrl);
      a.href = ev.sourceUrl;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      li.appendChild(a);
      sourceList.appendChild(li);
      sourceBlock.appendChild(
        makeEl("p", "nb-event-drawer__sublabel", "Source URL")
      );
      sourceBlock.appendChild(sourceList);
    }
    if (hasText(ev.lastChecked)) {
      sourceBlock.appendChild(
        makeEl("p", "nb-event-drawer__sublabel", "Last checked")
      );
      sourceBlock.appendChild(makeTextBlock(formatDateLabel(ev.lastChecked)));
    }
    appendSection(bodyEl, "Official source", sourceBlock);

    if (hasText(ev.category)) {
      appendSection(bodyEl, "Type", makeTextBlock(ev.category));
    }

    var idLine = makeEl("p", "nb-event-drawer__id");
    idLine.appendChild(document.createTextNode("Record ID: "));
    idLine.appendChild(makeEl("code", null, ev.id));
    bodyEl.appendChild(idLine);
  }

  function conciseTitle(ev) {
    return truncate(ev.title, 42);
  }

  function todayInfo() {
    var now = new Date();
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      monthKey: now.getFullYear() + "-" + pad2(now.getMonth() + 1),
      isChronicleYear: now.getFullYear() === YEAR,
    };
  }

  function eventById(events, id) {
    for (var i = 0; i < events.length; i += 1) {
      if (events[i].id === id) return events[i];
    }
    return null;
  }

  function eventPermalink(id) {
    return String(location.href).split("#")[0] + "#" + id;
  }

  function hasText(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).replace(/\s+/g, " ").trim().length > 0;
  }

  function makeEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== "") node.textContent = text;
    return node;
  }

  function makeTextBlock(value) {
    if (!hasText(value)) return null;
    if (Array.isArray(value)) {
      var ul = makeEl("ul", "nb-event-drawer__list");
      value.forEach(function (item) {
        if (!hasText(item)) return;
        var li = makeEl("li", null, typeof item === "string" ? item : String(item));
        ul.appendChild(li);
      });
      return ul.childNodes.length ? ul : null;
    }
    return makeEl("p", "nb-event-drawer__text", String(value));
  }

  function appendSection(parent, title, content) {
    if (!content) return;
    var section = makeEl("section", "nb-event-drawer__section");
    section.appendChild(makeEl("h3", "nb-event-drawer__section-title", title));
    section.appendChild(content);
    parent.appendChild(section);
  }

  function markEventSelected(id, on) {
    qsa("[data-event-id]").forEach(function (node) {
      var match = node.getAttribute("data-event-id") === id;
      if (!match) {
        if (on) {
          node.classList.remove("is-selected");
          if (node.hasAttribute("aria-pressed")) {
            node.setAttribute("aria-pressed", "false");
          }
        }
        return;
      }
      node.classList.toggle("is-selected", !!on);
      if (node.hasAttribute("aria-pressed")) {
        node.setAttribute("aria-pressed", on ? "true" : "false");
      }
    });
  }

  function clearDeeplinkFlash() {
    qsa(".is-deeplink").forEach(function (node) {
      node.classList.remove("is-deeplink");
    });
  }

  function flashDeeplink(id) {
    clearDeeplinkFlash();
    if (!id || prefersReducedMotion()) return;
    qsa('[data-event-id="' + id + '"]').forEach(function (node) {
      node.classList.add("is-deeplink");
    });
    window.setTimeout(function () {
      clearDeeplinkFlash();
    }, 1400);
  }

  function clearAllSelected() {
    qsa("[data-event-id].is-selected").forEach(function (node) {
      node.classList.remove("is-selected");
      if (node.hasAttribute("aria-pressed")) {
        node.setAttribute("aria-pressed", "false");
      }
    });
  }

  /* ========================= Event detail drawer ========================= */

  function initEventDrawer(allEvents) {
    var dialog = qs("[data-event-drawer]");
    if (!dialog || typeof dialog.showModal !== "function") {
      return {
        open: function () {},
        close: function () {},
        restoreFromHash: function () {},
        isOpen: function () {
          return false;
        },
      };
    }

    var bodyEl = qs("[data-event-drawer-body]", dialog);
    var closeBtn = qs("[data-event-drawer-close]", dialog);
    var copyBtn = qs("[data-event-drawer-copy]", dialog);
    var state = {
      lastTrigger: null,
      currentId: null,
      suppressHashClear: false,
    };

    function buildBody(ev) {
      if (!bodyEl) return;
      if (ev.isOfficial) {
        buildOfficialDrawerBody(bodyEl, ev);
        return;
      }
      bodyEl.innerHTML = "";

      var st = statusClass(ev);
      var planned = ev.status === "planned";

      var header = makeEl("header", "nb-event-drawer__header");
      header.appendChild(makeEl("p", "nb-event-drawer__when", formatRange(ev)));
      header.appendChild(
        makeEl(
          "p",
          "nb-event-drawer__stream",
          STREAM_LABEL[ev.stream] || ev.stream
        )
      );

      var statusWrap = makeEl("p", "nb-status nb-status--" + st);
      statusWrap.appendChild(makeEl("span", "nb-status__mark"));
      statusWrap.lastChild.setAttribute("aria-hidden", "true");
      statusWrap.appendChild(
        makeEl("span", "nb-status__text", STATUS_LABEL[st] || st)
      );
      header.appendChild(statusWrap);

      var title = makeEl("h2", "nb-event-drawer__title", ev.title);
      title.id = "nb-event-drawer-title";
      header.appendChild(title);

      if (hasText(ev.shortSummary)) {
        header.appendChild(
          makeEl("p", "nb-event-drawer__summary", ev.shortSummary)
        );
      }

      bodyEl.appendChild(header);

      if (st === "needs-update" || (ev.needsUpdate && ev.needsUpdate.length)) {
        var warn = makeEl(
          "p",
          "nb-event-drawer__warning",
          "Record incomplete — exact date/evidence still needs to be added before wiki freeze."
        );
        warn.setAttribute("role", "status");
        bodyEl.appendChild(warn);
        if (ev.needsUpdate && ev.needsUpdate.length) {
          appendSection(
            bodyEl,
            "Outstanding updates",
            makeTextBlock(ev.needsUpdate)
          );
        }
      }

      appendSection(bodyEl, "Objective", makeTextBlock(ev.objective));

      if (planned) {
        appendSection(bodyEl, "Planned work", makeTextBlock(ev.work));
        var expected =
          makeTextBlock(ev.pendingOutputs) || makeTextBlock(ev.output);
        appendSection(bodyEl, "Expected output", expected);
      } else {
        appendSection(bodyEl, "Work", makeTextBlock(ev.work));
        appendSection(bodyEl, "Observation", makeTextBlock(ev.observation));
        appendSection(bodyEl, "Result", makeTextBlock(ev.result));
        if (!ev.result && hasText(ev.output)) {
          appendSection(bodyEl, "Output", makeTextBlock(ev.output));
        }
      }

      var decisionLearning = null;
      if (hasText(ev.decision) || hasText(ev.learning)) {
        decisionLearning = makeEl("div", "nb-event-drawer__stack");
        if (hasText(ev.decision)) {
          decisionLearning.appendChild(makeTextBlock(ev.decision));
        }
        if (hasText(ev.learning)) {
          decisionLearning.appendChild(makeTextBlock(ev.learning));
        }
      }
      appendSection(bodyEl, "Decision / learning", decisionLearning);

      if (hasText(ev.hypothesis) || hasText(ev.interpretation)) {
        var interp = makeEl("div", "nb-event-drawer__stack");
        if (hasText(ev.hypothesis)) {
          var hLabel = makeEl("p", "nb-event-drawer__sublabel", "Hypothesis");
          interp.appendChild(hLabel);
          interp.appendChild(makeTextBlock(ev.hypothesis));
        }
        if (hasText(ev.interpretation)) {
          var iLabel = makeEl(
            "p",
            "nb-event-drawer__sublabel",
            "Interpretation"
          );
          interp.appendChild(iLabel);
          interp.appendChild(makeTextBlock(ev.interpretation));
        }
        appendSection(bodyEl, "Hypothesis / interpretation", interp);
      }

      if (hasText(ev.problem)) {
        appendSection(bodyEl, "Problem", makeTextBlock(ev.problem));
      }

      var nextBlock = null;
      if (hasText(ev.nextQuestion) || hasText(ev.nextStep)) {
        nextBlock = makeEl("div", "nb-event-drawer__stack");
        if (hasText(ev.nextQuestion)) {
          nextBlock.appendChild(
            makeEl("p", "nb-event-drawer__sublabel", "Next question")
          );
          nextBlock.appendChild(makeTextBlock(ev.nextQuestion));
        }
        if (hasText(ev.nextStep)) {
          nextBlock.appendChild(
            makeEl("p", "nb-event-drawer__sublabel", "Next step")
          );
          nextBlock.appendChild(makeTextBlock(ev.nextStep));
        }
      }
      appendSection(bodyEl, "Next question / next step", nextBlock);

      var people = [];
      (ev.responsible || []).forEach(function (name) {
        if (hasText(name)) people.push(name);
      });
      (ev.contributors || []).forEach(function (name) {
        if (hasText(name)) people.push(name);
      });
      if (people.length) {
        appendSection(bodyEl, "Responsible / contributors", makeTextBlock(people));
      }

      if (hasText(ev.evidence) || hasText(ev.evidenceImages)) {
        var evidenceWrap = makeEl("div", "nb-event-drawer__stack");

        if (hasText(ev.evidenceImages)) {
          var gallery = makeEl("div", "nb-evidence-gallery");
          (ev.evidenceImages || []).forEach(function (img) {
            if (!img || !img.src) return;
            var figure = makeEl("figure", "nb-evidence-figure");
            var image = document.createElement("img");
            image.src = img.src;
            image.alt = img.alt || "";
            image.loading = "lazy";
            image.decoding = "async";
            if (img.width) image.width = img.width;
            if (img.height) image.height = img.height;
            figure.appendChild(image);
            if (hasText(img.caption)) {
              var cap = makeEl("figcaption", "nb-evidence-figure__caption", img.caption);
              figure.appendChild(cap);
            }
            gallery.appendChild(figure);
          });
          if (gallery.childNodes.length) {
            evidenceWrap.appendChild(gallery);
          }
        }

        if (hasText(ev.evidence)) {
          var evList = makeEl("ul", "nb-event-drawer__list");
          (ev.evidence || []).forEach(function (item) {
            if (!item) return;
            var li = makeEl("li");
            if (typeof item === "string") {
              li.textContent = item;
            } else {
              var label = item.label || item.refId || "Evidence";
              if (item.href) {
                var a = makeEl("a", null, label);
                a.href = item.href;
                a.rel = "noopener noreferrer";
                li.appendChild(a);
              } else {
                li.textContent = label;
              }
              if (item.status) {
                li.appendChild(
                  document.createTextNode(" · " + item.status)
                );
              }
            }
            evList.appendChild(li);
          });
          if (evList.childNodes.length) {
            evidenceWrap.appendChild(evList);
          }
        }

        if (evidenceWrap.childNodes.length) {
          appendSection(bodyEl, "Evidence", evidenceWrap);
        }
      }

      if (hasText(ev.relatedLinks)) {
        var linkList = makeEl("ul", "nb-event-drawer__list");
        (ev.relatedLinks || []).forEach(function (link) {
          if (!link || !link.href) return;
          var li = makeEl("li");
          var a = makeEl("a", null, link.label || link.href);
          a.href = link.href;
          li.appendChild(a);
          linkList.appendChild(li);
        });
        if (linkList.childNodes.length) {
          appendSection(bodyEl, "Related pages", linkList);
        }
      }

      if (hasText(ev.references)) {
        var refList = makeEl("ul", "nb-event-drawer__list");
        (ev.references || []).forEach(function (ref) {
          if (!ref) return;
          var li = makeEl(
            "li",
            null,
            typeof ref === "string" ? ref : ref.text || ref.id || ""
          );
          if (li.textContent) refList.appendChild(li);
        });
        if (refList.childNodes.length) {
          appendSection(bodyEl, "References", refList);
        }
      }

      if (hasText(ev.contradictions)) {
        appendSection(
          bodyEl,
          "Source contradictions (unresolved)",
          makeTextBlock(ev.contradictions)
        );
      }

      var idLine = makeEl("p", "nb-event-drawer__id");
      idLine.appendChild(document.createTextNode("Record ID: "));
      var code = makeEl("code", null, ev.id);
      idLine.appendChild(code);
      bodyEl.appendChild(idLine);
    }

    function setHash(id, fromHash) {
      if (fromHash) return;
      if (history && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      } else {
        location.hash = id;
      }
    }

    function clearHashIfEvent() {
      var id = (location.hash || "").replace(/^#/, "");
      if (!id) return;
      if (!eventById(allEvents, id)) return;
      state.suppressHashClear = true;
      if (history && history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      } else {
        location.hash = "";
      }
      window.setTimeout(function () {
        state.suppressHashClear = false;
      }, 0);
    }

    function closeDrawer() {
      if (!dialog.open) return;
      var trigger = state.lastTrigger;
      var closedId = state.currentId;
      state.currentId = null;
      clearAllSelected();
      clearHashIfEvent();
      dialog.close();
      if (trigger && typeof trigger.focus === "function") {
        try {
          trigger.focus();
        } catch (e) {
          /* ignore */
        }
      }
      return closedId;
    }

    function openDrawer(ev, trigger, fromHash) {
      if (!ev) return;
      state.lastTrigger = trigger || state.lastTrigger;
      state.currentId = ev.id;
      clearAllSelected();
      markEventSelected(ev.id, true);
      buildBody(ev);
      if (copyBtn) {
        copyBtn.hidden = false;
        copyBtn.textContent = "Copy link";
      }
      if (!dialog.open) {
        dialog.classList.remove("is-closing");
        dialog.showModal();
      }
      setHash(ev.id, fromHash);
      if (fromHash) {
        flashDeeplink(ev.id);
      }
      window.setTimeout(function () {
        if (closeBtn) closeBtn.focus();
        else if (bodyEl) bodyEl.focus();
      }, 0);
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeDrawer();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!state.currentId) return;
        var url = eventPermalink(state.currentId);
        function ok() {
          copyBtn.textContent = "Link copied";
          window.setTimeout(function () {
            copyBtn.textContent = "Copy link";
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(ok).catch(function () {
            window.prompt("Copy this link:", url);
          });
        } else {
          window.prompt("Copy this link:", url);
        }
      });
    }

    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDrawer();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeDrawer();
    });

    function restoreFromHash() {
      if (state.suppressHashClear) return;
      var id = (location.hash || "").replace(/^#/, "");
      if (!id) {
        if (dialog.open) closeDrawer();
        return;
      }
      if (id.indexOf("nb-EXP-AS-") === 0 || id.indexOf("fallback-") === 0) {
        return;
      }
      if (id.indexOf("tl-") === 0 || id.indexOf("tp-") === 0) return;
      var ev = eventById(allEvents, id);
      if (!ev) return;
      var trigger =
        qs('[data-event-id="' + id + '"]') ||
        state.lastTrigger;
      openDrawer(ev, trigger, true);
    }

    window.addEventListener("hashchange", restoreFromHash);

    return {
      open: openDrawer,
      close: closeDrawer,
      restoreFromHash: restoreFromHash,
      isOpen: function () {
        return !!dialog.open;
      },
      currentId: function () {
        return state.currentId;
      },
    };
  }

  /* ========================= Calendar UI ========================= */

  function initCalendar(root, teamEvents, officialEvents, getFilters, drawerApi) {
    var calRoot = qs("[data-notebook-calendar]", root);
    if (!calRoot) return { render: function () {} };

    var yearEl = qs("[data-cal-year]", calRoot);
    var stripEl = qs("[data-cal-strip]", calRoot);
    var agendaEl = qs("[data-cal-agenda]", calRoot);
    var previewEl = qs("[data-cal-preview]", calRoot);
    var previewTitle = qs("[data-cal-preview-title]", calRoot);
    var previewMeta = qs("[data-cal-preview-meta]", calRoot);
    var todayBtn = qs("[data-cal-today]", calRoot);

    var state = {
      focusMonth: null,
      selectedId: null,
    };

    var today = todayInfo();
    state.focusMonth = today.isChronicleYear ? today.monthIndex : 8;

    function lookupEvent(id) {
      return eventById(teamEvents, id) || eventById(officialEvents, id);
    }

    function matchedEvents() {
      return filterEvents(teamEvents, getFilters(), officialEvents);
    }

    function setPreview(ev) {
      if (!previewEl) return;
      if (!ev) {
        previewEl.hidden = true;
        return;
      }
      previewEl.hidden = false;
      if (previewTitle) previewTitle.textContent = ev.title;
      if (previewMeta) {
        previewMeta.textContent =
          (STREAM_LABEL[ev.stream] || ev.stream) +
          " · " +
          (STATUS_LABEL[statusClass(ev)] || ev.status) +
          " · " +
          formatRange(ev);
      }
    }

    function openEvent(ev, trigger, fromHash) {
      if (!ev) return;
      state.selectedId = ev.id;
      setPreview(ev);

      var place = placementInYear(ev, YEAR);
      if (place && !place.undated) {
        state.focusMonth = place.start;
        highlightFocusMonth();
        openAgendaMonth(place.start, false);
      } else if (place && place.undated) {
        openAgendaMonth("undated", false);
      }

      if (drawerApi && drawerApi.open) {
        drawerApi.open(ev, trigger, fromHash);
      }
    }

    function highlightFocusMonth() {
      qsa("[data-cal-month]", calRoot).forEach(function (btn) {
        var m = btn.getAttribute("data-cal-month");
        var on = m !== "undated" && Number(m) === state.focusMonth;
        btn.classList.toggle("is-focus-month", on);
        btn.setAttribute("aria-current", on ? "true" : "false");
      });
      qsa("[data-cal-col]", calRoot).forEach(function (col) {
        col.classList.toggle(
          "is-focus-month",
          Number(col.getAttribute("data-cal-col")) === state.focusMonth
        );
      });
    }

    function bindEventControls(node, ev) {
      node.addEventListener("click", function () {
        openEvent(ev, node, false);
      });
      node.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEvent(ev, node, false);
        }
      });
      node.addEventListener("focus", function () {
        setPreview(ev);
      });
      if (!isCoarsePointer()) {
        node.addEventListener("mouseenter", function () {
          setPreview(ev);
        });
        node.addEventListener("mouseleave", function () {
          if (state.selectedId !== ev.id) {
            var active = document.activeElement;
            if (
              !active ||
              !calRoot.contains(active) ||
              !active.getAttribute("data-event-id")
            ) {
              if (!state.selectedId) setPreview(null);
              else setPreview(lookupEvent(state.selectedId));
            }
          }
        });
      }
      node.addEventListener("blur", function () {
        window.setTimeout(function () {
          if (state.selectedId) {
            setPreview(lookupEvent(state.selectedId));
          } else if (
            !calRoot.contains(document.activeElement) ||
            !document.activeElement ||
            !document.activeElement.getAttribute("data-event-id")
          ) {
            setPreview(null);
          }
        }, 0);
      });
    }

    function renderStrip(events) {
      if (!stripEl) return;
      stripEl.innerHTML = "";
      var frag = document.createDocumentFragment();

      MONTH_SHORT.forEach(function (label, index) {
        var count = events.filter(function (ev) {
          return overlapsMonth(ev, YEAR, index);
        }).length;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nb-cal-strip__btn";
        btn.setAttribute("data-cal-month", String(index));
        btn.setAttribute("aria-label", label + " " + YEAR + ", " + count + " records");
        if (today.isChronicleYear && today.monthIndex === index) {
          btn.classList.add("is-today");
        }
        btn.innerHTML =
          '<span class="nb-cal-strip__label">' +
          label +
          "</span>" +
          (count
            ? '<span class="nb-cal-strip__count">' + count + "</span>"
            : '<span class="nb-cal-strip__count nb-cal-strip__count--zero">0</span>');
        btn.addEventListener("click", function () {
          state.focusMonth = index;
          highlightFocusMonth();
          openAgendaMonth(index, true);
        });
        frag.appendChild(btn);
      });

      var undatedCount = events.filter(function (ev) {
        return !ev.startDate && !ev.endDate;
      }).length;
      if (undatedCount) {
        var uBtn = document.createElement("button");
        uBtn.type = "button";
        uBtn.className = "nb-cal-strip__btn nb-cal-strip__btn--undated";
        uBtn.setAttribute("data-cal-month", "undated");
        uBtn.setAttribute(
          "aria-label",
          "Undated records needing update, " + undatedCount
        );
        uBtn.innerHTML =
          '<span class="nb-cal-strip__label">Undated</span>' +
          '<span class="nb-cal-strip__count">' +
          undatedCount +
          "</span>";
        uBtn.addEventListener("click", function () {
          openAgendaMonth("undated", true);
        });
        frag.appendChild(uBtn);
      }

      stripEl.appendChild(frag);
      highlightFocusMonth();
    }

    function renderYear(events) {
      if (!yearEl) return;
      yearEl.innerHTML = "";

      var head = document.createElement("div");
      head.className = "nb-cal-year__head";
      head.setAttribute("aria-hidden", "true");
      head.innerHTML = '<span class="nb-cal-year__lane-label"></span>';
      MONTH_SHORT.forEach(function (label, index) {
        var count = events.filter(function (ev) {
          return overlapsMonth(ev, YEAR, index);
        }).length;
        var cell = document.createElement("span");
        cell.className = "nb-cal-year__month";
        cell.setAttribute("data-cal-col", String(index));
        if (today.isChronicleYear && today.monthIndex === index) {
          cell.classList.add("is-today");
        }
        cell.innerHTML =
          "<strong>" +
          label +
          "</strong>" +
          (count
            ? '<span class="nb-cal-year__month-count">' + count + "</span>"
            : "");
        head.appendChild(cell);
      });
      yearEl.appendChild(head);

      STREAM_ORDER.forEach(function (stream) {
        if (stream === "igem" && getFilters().showIgem === false) return;

        var laneEvents = events.filter(function (ev) {
          return ev.stream === stream;
        });
        var placed = [];
        var milestones = [];
        var undated = [];

        laneEvents.forEach(function (ev) {
          var place = placementInYear(ev, YEAR);
          if (!place) return;
          if (place.undated) {
            undated.push(ev);
            return;
          }
          if (stream === "igem" || ev.isOfficial) {
            milestones.push({
              ev: ev,
              col: place.start,
            });
            return;
          }
          placed.push({
            ev: ev,
            start: place.start,
            end: place.end,
            track: 0,
          });
        });

        var trackCount = Math.max(1, assignTracks(placed));
        var lane = document.createElement("div");
        lane.className =
          "nb-cal-lane nb-cal-lane--" +
          stream +
          (stream === "igem" ? " nb-cal-lane--official" : "");
        lane.style.setProperty("--nb-cal-tracks", String(trackCount));

        var label = document.createElement("div");
        label.className = "nb-cal-lane__label";
        label.innerHTML =
          "<span>" +
          (STREAM_LABEL[stream] || stream) +
          '</span><span class="nb-cal-lane__count">' +
          (placed.length + undated.length) +
          "</span>";
        lane.appendChild(label);

        var track = document.createElement("div");
        track.className = "nb-cal-lane__track";
        track.setAttribute(
          "role",
          "group"
        );
        track.setAttribute(
          "aria-label",
          (STREAM_LABEL[stream] || stream) + " events in " + YEAR
        );

        for (var m = 0; m < 12; m += 1) {
          var col = document.createElement("span");
          col.className = "nb-cal-lane__col";
          col.setAttribute("data-cal-col", String(m));
          if (today.isChronicleYear && today.monthIndex === m) {
            col.classList.add("is-today");
          }
          track.appendChild(col);
        }

        if (today.isChronicleYear) {
          var marker = document.createElement("span");
          marker.className = "nb-cal-lane__today-marker";
          marker.style.gridColumn = String(today.monthIndex + 1);
          marker.setAttribute("aria-hidden", "true");
          track.appendChild(marker);
        }

        placed.forEach(function (item) {
          var st = statusClass(item.ev);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "nb-cal-event nb-cal-event--" +
            st +
            " nb-cal-event--stream-" +
            stream +
            (item.ev.stream === "igem" ? " nb-cal-event--igem" : "");
          btn.style.gridColumn =
            item.start + 1 + " / " + (item.end + 2);
          btn.style.gridRow = String(item.track + 1);
          btn.setAttribute("data-event-id", item.ev.id);
          btn.setAttribute("aria-pressed", "false");
          btn.id = item.ev.id;
          btn.title = item.ev.title + " · " + formatRange(item.ev);
          btn.setAttribute(
            "aria-label",
            item.ev.title +
              ", " +
              (STREAM_LABEL[item.ev.stream] || item.ev.stream) +
              ", " +
              (STATUS_LABEL[st] || st) +
              ", " +
              formatRange(item.ev)
          );

          var badge =
            st === "needs-update"
              ? '<span class="nb-cal-event__badge" aria-hidden="true">!</span>'
              : st === "ongoing"
                ? '<span class="nb-cal-event__badge nb-cal-event__badge--now" aria-hidden="true">●</span>'
                : st === "planned"
                  ? '<span class="nb-cal-event__badge nb-cal-event__badge--plan" aria-hidden="true">◇</span>'
                  : "";

          btn.innerHTML =
            '<span class="nb-cal-event__status" aria-hidden="true"></span>' +
            '<span class="nb-cal-event__body">' +
            '<span class="nb-cal-event__title">' +
            conciseTitle(item.ev) +
            "</span>" +
            '<span class="nb-cal-event__when">' +
            formatRange(item.ev) +
            "</span>" +
            "</span>" +
            badge;

          bindEventControls(btn, item.ev);
          track.appendChild(btn);
        });

        milestones.forEach(function (item) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "nb-cal-milestone nb-cal-event--igem nb-cal-event--milestone";
          btn.style.gridColumn = String(item.col + 1);
          btn.style.gridRow = "1";
          btn.setAttribute("data-event-id", item.ev.id);
          btn.setAttribute("aria-pressed", "false");
          btn.id = item.ev.id;
          btn.title = item.ev.title + " · " + formatRange(item.ev);
          btn.setAttribute(
            "aria-label",
            item.ev.title +
              ", iGEM Official, " +
              formatRange(item.ev)
          );
          btn.innerHTML =
            '<span class="nb-cal-milestone__mark" aria-hidden="true">◆</span>' +
            '<span class="nb-cal-milestone__body">' +
            '<span class="nb-cal-milestone__kicker">iGEM Official</span>' +
            '<span class="nb-cal-milestone__title">' +
            conciseTitle(item.ev) +
            "</span>" +
            '<span class="nb-cal-milestone__when">' +
            formatRange(item.ev) +
            "</span>" +
            "</span>";
          bindEventControls(btn, item.ev);
          track.appendChild(btn);
        });

        if (!placed.length && !milestones.length && !undated.length) {
          var empty = document.createElement("p");
          empty.className = "nb-cal-lane__empty";
          empty.textContent =
            stream === "igem"
              ? getFilters().showIgem === false
                ? "Official iGEM milestones hidden — enable “Show iGEM milestones” in filters."
                : "No official iGEM milestones in the dataset yet."
              : "No matching records in this lane.";
          track.appendChild(empty);
        }

        lane.appendChild(track);

        if (undated.length) {
          var undatedWrap = document.createElement("div");
          undatedWrap.className = "nb-cal-lane__undated";
          undated.forEach(function (ev) {
            var st = statusClass(ev);
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className =
              "nb-cal-event nb-cal-event--compact nb-cal-event--" + st;
            chip.setAttribute("data-event-id", ev.id);
            chip.id = ev.id;
            chip.setAttribute("aria-pressed", "false");
            chip.setAttribute(
              "aria-label",
              ev.title + ", undated, needs update"
            );
            chip.innerHTML =
              '<span class="nb-cal-event__badge" aria-hidden="true">!</span>' +
              '<span class="nb-cal-event__title">' +
              conciseTitle(ev) +
              "</span>";
            bindEventControls(chip, ev);
            undatedWrap.appendChild(chip);
          });
          lane.appendChild(undatedWrap);
        }

        yearEl.appendChild(lane);
      });

      highlightFocusMonth();
    }

    function eventsForAgendaMonth(events, monthKey) {
      if (monthKey === "undated") {
        return events.filter(function (ev) {
          return !ev.startDate && !ev.endDate;
        });
      }
      return events.filter(function (ev) {
        return overlapsMonth(ev, YEAR, monthKey);
      });
    }

    function renderAgenda(events) {
      if (!agendaEl) return;
      agendaEl.innerHTML = "";

      var heading = document.createElement("h3");
      heading.className = "nb-cal-agenda__heading";
      heading.id = "nb-cal-agenda-heading";
      heading.textContent = "Month agenda";
      agendaEl.appendChild(heading);

      var note = document.createElement("p");
      note.className = "nb-cal-agenda__note";
      note.textContent =
        "Inspect records by month. On small screens this agenda is the primary calendar.";
      agendaEl.appendChild(note);

      var list = document.createElement("div");
      list.className = "nb-cal-agenda__list";

      MONTH_SHORT.forEach(function (label, index) {
        var monthEvents = eventsForAgendaMonth(events, index).sort(function (
          a,
          b
        ) {
          return eventEndKey(a) - eventEndKey(b);
        });

        var details = document.createElement("details");
        details.className = "nb-cal-month";
        details.setAttribute("data-cal-agenda-month", String(index));
        if (index === state.focusMonth) details.open = true;
        if (today.isChronicleYear && today.monthIndex === index) {
          details.classList.add("is-today");
        }

        var summary = document.createElement("summary");
        summary.innerHTML =
          "<span>" +
          label +
          " " +
          YEAR +
          "</span>" +
          '<span class="nb-cal-month__count">' +
          monthEvents.length +
          (monthEvents.length === 1 ? " record" : " records") +
          "</span>" +
          (today.isChronicleYear && today.monthIndex === index
            ? '<span class="nb-cal-month__today-tag">Current month</span>'
            : "");
        details.appendChild(summary);

        var body = document.createElement("div");
        body.className = "nb-cal-month__body";

        if (!monthEvents.length) {
          var empty = document.createElement("p");
          empty.className = "nb-cal-month__empty";
          empty.textContent = "No matching records this month.";
          body.appendChild(empty);
        } else {
          monthEvents.forEach(function (ev) {
            body.appendChild(buildAgendaCard(ev));
          });
        }

        details.appendChild(body);
        list.appendChild(details);
      });

      var undated = eventsForAgendaMonth(events, "undated");
      if (undated.length) {
        var uDetails = document.createElement("details");
        uDetails.className = "nb-cal-month nb-cal-month--undated";
        uDetails.setAttribute("data-cal-agenda-month", "undated");
        var uSummary = document.createElement("summary");
        uSummary.innerHTML =
          "<span>Undated · needs update</span>" +
          '<span class="nb-cal-month__count">' +
          undated.length +
          (undated.length === 1 ? " record" : " records") +
          "</span>";
        uDetails.appendChild(uSummary);
        var uBody = document.createElement("div");
        uBody.className = "nb-cal-month__body";
        undated.forEach(function (ev) {
          uBody.appendChild(buildAgendaCard(ev));
        });
        uDetails.appendChild(uBody);
        list.appendChild(uDetails);
      }

      agendaEl.appendChild(list);
    }

    function buildAgendaCard(ev) {
      var st = statusClass(ev);
      var card = document.createElement("article");
      card.className =
        "nb-cal-card nb-cal-card--" +
        st +
        " nb-cal-card--stream-" +
        (ev.stream || "unknown") +
        (ev.stream === "igem" ? " nb-cal-card--igem" : "");
      card.setAttribute("data-event-id", ev.id);
      card.setAttribute("data-stream", ev.stream || "");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nb-cal-card__hit";
      btn.setAttribute("data-event-id", ev.id);
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute(
        "aria-label",
        "Open " +
          ev.title +
          ", " +
          (STATUS_LABEL[st] || st) +
          ", " +
          formatRange(ev)
      );

      btn.innerHTML =
        '<span class="nb-cal-card__top">' +
        '<span class="nb-status nb-status--' +
        st +
        '"><span class="nb-status__mark" aria-hidden="true"></span><span class="nb-status__text">' +
        (STATUS_LABEL[st] || st) +
        "</span></span>" +
        '<span class="nb-cal-card__stream">' +
        (STREAM_LABEL[ev.stream] || ev.stream) +
        "</span>" +
        "</span>" +
        (ev.isOfficial
          ? '<span class="nb-cal-card__kicker">iGEM Official</span>'
          : "") +
        '<span class="nb-cal-card__title">' +
        ev.title +
        "</span>" +
        '<span class="nb-cal-card__when">' +
        formatRange(ev) +
        "</span>";

      bindEventControls(btn, ev);
      card.appendChild(btn);
      return card;
    }

    function openAgendaMonth(monthKey, scroll) {
      qsa("[data-cal-agenda-month]", agendaEl).forEach(function (details) {
        var key = details.getAttribute("data-cal-agenda-month");
        var on =
          monthKey === "undated"
            ? key === "undated"
            : key === String(monthKey);
        details.open = on;
        if (on && scroll) {
          try {
            details.scrollIntoView({
              block: "nearest",
              behavior: prefersReducedMotion() ? "auto" : "smooth",
            });
          } catch (e) {
            details.scrollIntoView(true);
          }
        }
      });
      if (monthKey !== "undated") {
        state.focusMonth = Number(monthKey);
        highlightFocusMonth();
      }
    }

    function shouldRenderYearGrid() {
      return !(
        window.matchMedia &&
        window.matchMedia("(max-width: 768px)").matches
      );
    }

    function render() {
      var events = matchedEvents();
      updateViewCounts(root, events.length);
      renderStrip(events);
      if (shouldRenderYearGrid()) {
        renderYear(events);
      } else if (yearEl) {
        yearEl.innerHTML = "";
      }
      renderAgenda(events);

      var openId =
        (drawerApi && drawerApi.currentId && drawerApi.currentId()) ||
        state.selectedId;
      if (openId) {
        state.selectedId = openId;
        markEventSelected(openId, true);
      }
    }

    if (window.matchMedia) {
      var yearMq = window.matchMedia("(max-width: 768px)");
      var onYearMq = debounce(function () {
        render();
      }, 120);
      if (typeof yearMq.addEventListener === "function") {
        yearMq.addEventListener("change", onYearMq);
      } else if (typeof yearMq.addListener === "function") {
        yearMq.addListener(onYearMq);
      }
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", function () {
        if (today.isChronicleYear) {
          state.focusMonth = today.monthIndex;
          highlightFocusMonth();
          openAgendaMonth(today.monthIndex, true);
        } else {
          state.focusMonth = 8;
          highlightFocusMonth();
          openAgendaMonth(8, true);
          todayBtn.textContent =
            "Not in 2026 — jumped to September (project focus)";
        }
      });
    }

    render();

    return {
      render: render,
      openEvent: openEvent,
    };
  }

  /* ========================= Timeline ========================= */

  function monthGroupKey(ev) {
    if (!ev.startDate) return "undated";
    var parts = String(ev.startDate).split("-");
    if (parts.length < 2) return "undated";
    return parts[0] + "-" + parts[1];
  }

  function monthGroupLabel(key) {
    if (key === "undated") return "Undated · needs update";
    var parts = key.split("-");
    return (MONTH_LABEL[parts[1]] || parts[1]) + " " + parts[0];
  }

  function keyResultOrDecision(ev) {
    if (ev.decision) return truncate(ev.decision, 180);
    if (ev.result) return truncate(String(ev.result), 180);
    return null;
  }

  function initTimeline(root, teamEvents, officialEvents, getFilters, setStreamFilter, openRecord) {
    var tlRoot = qs("[data-notebook-timeline]", root);
    if (!tlRoot) return { render: function () {} };

    var navEl = qs("[data-tl-nav]", tlRoot);
    var streamEl = qs("[data-tl-stream-root]", tlRoot);
    var chips = qsa("[data-tl-stream]", tlRoot);

    function syncChips(stream) {
      chips.forEach(function (chip) {
        var on = chip.getAttribute("data-tl-stream") === stream;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var stream = chip.getAttribute("data-tl-stream") || "all";
        setStreamFilter(stream);
      });
    });

    function lookupEvent(id) {
      return eventById(teamEvents, id) || eventById(officialEvents, id);
    }

    function render() {
      var filters = getFilters();
      syncChips(filters.stream || "all");
      var events = filterEvents(teamEvents, filters, officialEvents)
        .slice()
        .sort(function (a, b) {
          var ka = a.startDate ? String(a.startDate) : "9999";
          var kb = b.startDate ? String(b.startDate) : "9999";
          if (ka < kb) return -1;
          if (ka > kb) return 1;
          return String(a.title).localeCompare(String(b.title));
        });

      updateViewCounts(root, events.length);

      if (!streamEl) return;
      streamEl.innerHTML = "";
      if (navEl) navEl.innerHTML = "";

      if (!events.length) {
        var empty = document.createElement("p");
        empty.className = "nb-timeline__empty";
        empty.textContent = "No records match the current filters.";
        streamEl.appendChild(empty);
        return;
      }

      var groups = [];
      var map = {};
      events.forEach(function (ev) {
        var key = monthGroupKey(ev);
        if (!map[key]) {
          map[key] = { key: key, events: [] };
          groups.push(map[key]);
        }
        map[key].events.push(ev);
      });

      groups.forEach(function (group) {
        if (navEl) {
          var link = document.createElement("a");
          link.href = "#tl-" + group.key;
          link.className = "nb-timeline__nav-link";
          link.textContent = monthGroupLabel(group.key);
          navEl.appendChild(link);
        }

        var section = document.createElement("section");
        section.className = "nb-timeline__month";
        section.id = "tl-" + group.key;

        var heading = document.createElement("h3");
        heading.className = "nb-timeline__month-title";
        heading.textContent = monthGroupLabel(group.key);
        section.appendChild(heading);

        var list = document.createElement("div");
        list.className = "nb-timeline__cards";

        group.events.forEach(function (ev) {
          var st = statusClass(ev);
          var card = document.createElement("article");
          card.className =
            "nb-tl-card nb-tl-card--" +
            st +
            " nb-tl-card--stream-" +
            (ev.stream || "unknown") +
            (ev.stream === "igem" ? " nb-tl-card--igem" : "");
          card.setAttribute("data-event-id", ev.id);
          card.setAttribute("data-stream", ev.stream || "");

          var keyLine = keyResultOrDecision(ev);
          card.innerHTML =
            '<header class="nb-tl-card__meta">' +
            "<time>" +
            formatRange(ev) +
            "</time>" +
            '<span class="nb-tl-card__stream">' +
            (STREAM_LABEL[ev.stream] || ev.stream) +
            "</span>" +
            '<span class="nb-status nb-status--' +
            st +
            '"><span class="nb-status__mark" aria-hidden="true"></span><span class="nb-status__text">' +
            (STATUS_LABEL[st] || st) +
            "</span></span>" +
            "</header>" +
            '<h4 class="nb-tl-card__title">' +
            ev.title +
            "</h4>" +
            '<p class="nb-tl-card__summary">' +
            (ev.shortSummary
              ? truncate(ev.shortSummary, 220)
              : "No short summary recorded.") +
            "</p>" +
            (keyLine
              ? '<p class="nb-tl-card__key"><span>Key result / decision</span> ' +
                keyLine +
                "</p>"
              : "") +
            '<p class="nb-tl-card__actions"><button type="button" class="nb-tl-card__open" data-tl-open="' +
            ev.id +
            '">View record</button></p>';

          list.appendChild(card);
        });

        section.appendChild(list);
        streamEl.appendChild(section);
      });

      qsa("[data-tl-open]", streamEl).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-tl-open");
          var ev = lookupEvent(id);
          if (ev && typeof openRecord === "function") openRecord(ev, btn);
        });
      });
    }

    return { render: render, syncChips: syncChips };
  }

  /* ========================= Gantt ========================= */

  function initGantt(root, teamEvents, officialEvents, getFilters, openRecord) {
    var gRoot = qs("[data-notebook-gantt]", root);
    if (!gRoot) return { render: function () {} };

    var chartEl = qs("[data-gantt-chart]", gRoot);
    var phasesEl = qs("[data-gantt-phases]", gRoot);
    var today = todayInfo();

    function renderChart(events) {
      if (!chartEl) return;
      chartEl.innerHTML = "";

      var head = document.createElement("div");
      head.className = "nb-gantt-chart__head";
      head.innerHTML = '<span class="nb-gantt-chart__corner"></span>';
      MONTH_SHORT.forEach(function (label, index) {
        var cell = document.createElement("span");
        cell.className = "nb-gantt-chart__month";
        if (today.isChronicleYear && today.monthIndex === index) {
          cell.classList.add("is-today");
        }
        cell.textContent = label;
        head.appendChild(cell);
      });
      chartEl.appendChild(head);

      STREAM_ORDER.forEach(function (stream) {
        if (stream === "igem" && getFilters().showIgem === false) return;

        var laneEvents = events.filter(function (ev) {
          return ev.stream === stream;
        });
        var placed = [];
        var markers = [];

        laneEvents.forEach(function (ev) {
          var place = placementInYear(ev, YEAR);
          if (!place) return;
          if (place.undated) {
            markers.push(ev);
            return;
          }
          if (ev.stream === "igem" || ev.isOfficial) {
            markers.push({ ev: ev, start: place.start, end: place.end });
            return;
          }
          placed.push({
            ev: ev,
            start: place.start,
            end: place.end,
            track: 0,
          });
        });

        var trackCount = Math.max(1, assignTracks(placed));
        var row = document.createElement("div");
        row.className =
          "nb-gantt-chart__row" +
          (stream === "igem" ? " nb-gantt-chart__row--official" : "");
        row.style.setProperty("--nb-gantt-tracks", String(trackCount));

        var label = document.createElement("div");
        label.className = "nb-gantt-chart__label";
        label.innerHTML =
          "<span>" +
          (STREAM_LABEL[stream] || stream) +
          '</span><span class="nb-gantt-chart__count">' +
          laneEvents.length +
          "</span>";
        row.appendChild(label);

        var track = document.createElement("div");
        track.className = "nb-gantt-chart__track";
        track.setAttribute("role", "group");
        track.setAttribute(
          "aria-label",
          (STREAM_LABEL[stream] || stream) + " Gantt bands"
        );

        for (var m = 0; m < 12; m += 1) {
          var col = document.createElement("span");
          col.className = "nb-gantt-chart__col";
          if (today.isChronicleYear && today.monthIndex === m) {
            col.classList.add("is-today");
          }
          track.appendChild(col);
        }

        if (today.isChronicleYear) {
          var line = document.createElement("span");
          line.className = "nb-gantt-chart__today";
          line.style.gridColumn = String(today.monthIndex + 1);
          line.setAttribute("aria-hidden", "true");
          track.appendChild(line);
        }

        placed.forEach(function (item) {
          var st = statusClass(item.ev);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nb-gantt-bar nb-gantt-bar--" + st;
          btn.style.gridColumn = item.start + 1 + " / " + (item.end + 2);
          btn.style.gridRow = String(item.track + 1);
          btn.setAttribute("data-event-id", item.ev.id);
          btn.title = item.ev.title + " · " + formatRange(item.ev);
          btn.setAttribute(
            "aria-label",
            item.ev.title +
              ", " +
              (STATUS_LABEL[st] || st) +
              ", " +
              formatRange(item.ev)
          );
          btn.innerHTML =
            '<span class="nb-gantt-bar__title">' +
            conciseTitle(item.ev) +
            "</span>" +
            (st === "ongoing"
              ? '<span class="nb-gantt-bar__now" aria-hidden="true">●</span>'
              : "") +
            (st === "needs-update"
              ? '<span class="nb-gantt-bar__warn" aria-hidden="true">!</span>'
              : "");
          btn.addEventListener("click", function () {
            if (typeof openRecord === "function") openRecord(item.ev, btn);
          });
          track.appendChild(btn);
        });

        markers.forEach(function (item) {
          var ev = item.ev || item;
          var start = item.start != null ? item.start : 0;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "nb-gantt-marker" +
            (ev.stream === "igem" ? " nb-gantt-marker--igem" : " nb-gantt-marker--undated");
          btn.style.gridColumn = String((start || 0) + 1);
          btn.setAttribute("data-event-id", ev.id);
          btn.title = ev.title;
          btn.setAttribute("aria-label", ev.title + " (marker)");
          btn.textContent = "◆";
          btn.addEventListener("click", function () {
            if (typeof openRecord === "function") openRecord(ev, btn);
          });
          track.appendChild(btn);
        });

        if (!placed.length && !markers.length) {
          var empty = document.createElement("p");
          empty.className = "nb-gantt-chart__empty";
          empty.textContent =
            stream === "igem"
              ? "No official iGEM milestones yet."
              : "No matching bands.";
          track.appendChild(empty);
        }

        row.appendChild(track);
        chartEl.appendChild(row);
      });
    }

    function renderPhases(events) {
      if (!phasesEl) return;
      phasesEl.innerHTML = "";
      var heading = document.createElement("h3");
      heading.className = "nb-gantt-phases__heading";
      heading.textContent = "Phase list";
      phasesEl.appendChild(heading);

      STREAM_ORDER.forEach(function (stream) {
        if (stream === "igem" && getFilters().showIgem === false) return;

        var list = events
          .filter(function (ev) {
            return ev.stream === stream;
          })
          .slice()
          .sort(function (a, b) {
            return eventEndKey(a) - eventEndKey(b);
          });
        var block = document.createElement("section");
        block.className = "nb-gantt-phases__stream";
        block.innerHTML =
          "<h4>" +
          (STREAM_LABEL[stream] || stream) +
          " <span>(" +
          list.length +
          ")</span></h4>";
        if (!list.length) {
          var p = document.createElement("p");
          p.className = "nb-gantt-phases__empty";
          p.textContent =
            stream === "igem"
              ? "No official milestones in the dataset."
              : "No matching records.";
          block.appendChild(p);
        } else {
          var ul = document.createElement("ul");
          list.forEach(function (ev) {
            var st = statusClass(ev);
            var li = document.createElement("li");
            li.className = "nb-gantt-phases__item nb-gantt-phases__item--" + st;
            li.innerHTML =
              '<button type="button" data-gantt-phase-open="' +
              ev.id +
              '">' +
              '<span class="nb-status nb-status--' +
              st +
              '"><span class="nb-status__mark" aria-hidden="true"></span><span class="nb-status__text">' +
              (STATUS_LABEL[st] || st) +
              "</span></span> " +
              "<strong>" +
              ev.title +
              "</strong> · <time>" +
              formatRange(ev) +
              "</time></button>";
            ul.appendChild(li);
          });
          block.appendChild(ul);
        }
        phasesEl.appendChild(block);
      });

      qsa("[data-gantt-phase-open]", phasesEl).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var ev =
            eventById(teamEvents, btn.getAttribute("data-gantt-phase-open")) ||
            eventById(officialEvents, btn.getAttribute("data-gantt-phase-open"));
          if (ev && typeof openRecord === "function") openRecord(ev, btn);
        });
      });
    }

    function render() {
      var events = filterEvents(teamEvents, getFilters(), officialEvents);
      updateViewCounts(root, events.length);
      renderChart(events);
      renderPhases(events);
    }

    return { render: render };
  }

  /* ========================= Turning points ========================= */

  function initTurningPoints(root, allEvents) {
    var stage = qs("[data-turning-points]", root);
    if (!stage) return;

    var api = getApi();
    var points =
      api && Array.isArray(api.TURNING_POINTS) ? api.TURNING_POINTS : [];

    stage.innerHTML = "";
    if (!points.length) {
      stage.innerHTML =
        '<p class="notice">No documented turning points are curated in the notebook dataset.</p>';
      return;
    }

    var list = document.createElement("div");
    list.className = "nb-turning__list";

    points.forEach(function (tp, index) {
      var article = document.createElement("article");
      article.className = "nb-tp";
      article.id = tp.id;
      article.setAttribute("data-tp-stream", tp.stream || "");

      var links = (tp.eventIds || [])
        .map(function (id) {
          return (
            '<a href="#' +
            id +
            '"><code>' +
            id +
            "</code></a>"
          );
        })
        .join(" · ");

      article.innerHTML =
        '<header class="nb-tp__head">' +
        '<p class="nb-tp__index">Turning point ' +
        (index + 1 < 10 ? "0" : "") +
        (index + 1) +
        "</p>" +
        "<h3>" +
        tp.title +
        "</h3>" +
        '<p class="nb-tp__stream">' +
        (STREAM_LABEL[tp.stream] || tp.stream || "") +
        "</p>" +
        "</header>" +
        '<ol class="nb-tp__chain">' +
        '<li><span class="nb-tp__step">Before</span><p>' +
        tp.before +
        "</p></li>" +
        '<li><span class="nb-tp__step">Evidence / problem</span><p>' +
        tp.evidence +
        "</p></li>" +
        '<li><span class="nb-tp__step">Decision</span><p>' +
        tp.decision +
        "</p></li>" +
        '<li><span class="nb-tp__step">After</span><p>' +
        tp.after +
        "</p></li>" +
        "</ol>" +
        '<p class="nb-tp__sources">Source records: ' +
        links +
        "</p>";

      list.appendChild(article);
    });

    stage.appendChild(list);
  }

  function setFormStream(form, stream) {
    if (!form) return;
    var el = form.elements.namedItem("stream");
    if (el) el.value = stream || "all";
  }

  function initFilterShell(root) {
    var shell = qs("[data-nb-filters-shell]", root);
    if (!shell || !window.matchMedia) return;
    var mq = window.matchMedia("(min-width: 769px)");
    function sync() {
      if (mq.matches) {
        shell.open = true;
      } else if (!shell.dataset.userToggled) {
        shell.open = false;
      }
    }
    shell.addEventListener("toggle", function () {
      if (!mq.matches) {
        shell.dataset.userToggled = "1";
      }
    });
    sync();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", function () {
        delete shell.dataset.userToggled;
        sync();
      });
    } else if (typeof mq.addListener === "function") {
      mq.addListener(function () {
        delete shell.dataset.userToggled;
        sync();
      });
    }
  }

  function initFilters(root, teamEvents, officialEvents, onChange) {
    var form = qs("[data-notebook-filters]", root);
    if (!form) {
      return {
        getFilters: function () {
          return {
            stream: "all",
            status: "all",
            month: "all",
            tag: "all",
            q: "",
            showIgem: true,
          };
        },
        setStream: function () {},
        apply: function () {},
      };
    }

    fillFilterOptions(form, teamEvents);
    var live = qs("[data-filter-live]", form);
    var searchInput = form.elements.namedItem("q");

    function apply() {
      var filters = readFilters(form);
      var matched = filterEvents(teamEvents, filters, officialEvents);
      var total = chroniclePool(teamEvents, officialEvents, filters).length;
      updateViewCounts(root, matched.length);
      if (live) {
        var msg =
          "Showing " + matched.length + " of " + total + " records.";
        if (officialEvents.length) {
          msg +=
            filters.showIgem === false
              ? " Official iGEM milestones hidden."
              : " Includes " +
                officialEvents.length +
                " verified official milestone(s).";
        }
        live.textContent = msg;
      }
      if (typeof onChange === "function") onChange(filters, matched);
    }

    var applyDebounced = debounce(apply, prefersReducedMotion() ? 0 : 180);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    form.addEventListener("change", function (event) {
      var name = event.target && event.target.name;
      if (
        name === "showIgem" ||
        name === "stream" ||
        name === "status" ||
        name === "month" ||
        name === "tag"
      ) {
        apply();
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        applyDebounced();
      });
    }

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        apply();
      }, 0);
    });

    apply();

    return {
      getFilters: function () {
        return readFilters(form);
      },
      setStream: function (stream) {
        setFormStream(form, stream);
        apply();
      },
      apply: apply,
      form: form,
    };
  }

  function init() {
    var root = qs("[data-notebook-app]");
    if (!root) return;

    var teamEvents = getTeamEvents();
    var officialEvents = getOfficialEvents();
    var lookupEvents = teamEvents.concat(officialEvents);

    if (!teamEvents.length) {
      var live = qs("#nb-glance-live", root);
      if (live) {
        live.textContent =
          "Notebook dataset unavailable. Workstream counts are not shown.";
      }
      return;
    }

    fillStreamCards(root, teamEvents);
    initViews(root);
    initTurningPoints(root, teamEvents);
    initFilterShell(root);
    softLazyImages(root);

    var drawerApi = initEventDrawer(lookupEvents);
    var calendarApi = null;
    var timelineApi = null;
    var ganttApi = null;

    function openRecord(ev, trigger) {
      if (drawerApi && drawerApi.open) {
        drawerApi.open(ev, trigger || null, false);
      }
    }

    function refreshAll() {
      if (calendarApi) calendarApi.render();
      if (timelineApi) timelineApi.render();
      if (ganttApi) ganttApi.render();
    }

    var filterApi = initFilters(root, teamEvents, officialEvents, function () {
      refreshAll();
    });

    calendarApi = initCalendar(
      root,
      teamEvents,
      officialEvents,
      function () {
        return filterApi.getFilters();
      },
      drawerApi
    );

    timelineApi = initTimeline(
      root,
      teamEvents,
      officialEvents,
      function () {
        return filterApi.getFilters();
      },
      function (stream) {
        filterApi.setStream(stream);
      },
      openRecord
    );

    ganttApi = initGantt(
      root,
      teamEvents,
      officialEvents,
      function () {
        return filterApi.getFilters();
      },
      openRecord
    );

    refreshAll();
    drawerApi.restoreFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
