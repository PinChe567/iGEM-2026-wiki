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
    drylab: "Dry Lab",
    hardware: "Dry Lab · Hardware",
    model: "Dry Lab · Model",
    igem: "iGEM Official",
  };

  var SUBSTREAM_LABEL = {
    hardware: "Hardware",
    model: "Model",
  };

  var LANE_DEFS = [
    {
      id: "wetlab",
      stream: "wetlab",
      substream: null,
      label: "Wet Lab",
      workstream: "Wet Lab",
    },
    {
      id: "hardware",
      stream: "drylab",
      substream: "hardware",
      label: "Hardware",
      workstream: "Dry Lab",
    },
    {
      id: "model",
      stream: "drylab",
      substream: "model",
      label: "Model",
      workstream: "Dry Lab",
    },
    {
      id: "igem",
      stream: "igem",
      substream: null,
      label: "iGEM Official",
      workstream: "iGEM Official",
    },
  ];

  var DAY_MS = 86400000;

  var GANTT_PERIODS = [
    {
      id: "discover",
      label: "DISCOVER & DESIGN",
      shortLabel: "APR–JUN",
      start: Date.UTC(YEAR, 3, 1),
      end: Date.UTC(YEAR, 5, 30),
    },
    {
      id: "build",
      label: "BUILD & ITERATE",
      shortLabel: "JUL–SEP",
      start: Date.UTC(YEAR, 6, 1),
      end: Date.UTC(YEAR, 8, 30),
    },
    {
      id: "validate",
      label: "VALIDATE & INTEGRATE",
      shortLabel: "OCT–NOV",
      start: Date.UTC(YEAR, 9, 1),
      end: Date.UTC(YEAR, 10, 30),
    },
  ];

  var GANTT_AXIS = {
    start: GANTT_PERIODS[0].start,
    end: inclusiveEndMs(GANTT_PERIODS[GANTT_PERIODS.length - 1].end),
  };

  function inclusiveEndMs(ms) {
    return ms + DAY_MS;
  }

  function eventStream(ev) {
    if (!ev) return "";
    if (ev.stream === "hardware") return "drylab";
    return ev.stream || "";
  }

  function eventSubstream(ev) {
    if (!ev) return null;
    if (ev.substream) return ev.substream;
    if (ev.stream === "hardware") return "hardware";
    if (ev.stream === "drylab") return "model";
    return null;
  }

  function visualStreamKey(ev) {
    var sub = eventSubstream(ev);
    if (sub === "hardware") return "hardware";
    return eventStream(ev) || "unknown";
  }

  function eventWorkstreamLabel(ev) {
    var stream = eventStream(ev);
    var sub = eventSubstream(ev);
    if (stream === "igem") return STREAM_LABEL.igem;
    if (stream === "wetlab") return STREAM_LABEL.wetlab;
    if (stream === "drylab") {
      if (sub === "hardware") return STREAM_LABEL.hardware;
      if (sub === "model") return STREAM_LABEL.model;
      return STREAM_LABEL.drylab;
    }
    return STREAM_LABEL[stream] || stream || "";
  }

  function turningPointLabel(tp) {
    if (!tp) return "";
    if (tp.substream === "hardware" || tp.stream === "hardware") {
      return STREAM_LABEL.hardware;
    }
    if (tp.substream === "model" || (tp.stream === "drylab" && !tp.substream)) {
      return STREAM_LABEL.model;
    }
    return STREAM_LABEL[tp.stream] || tp.stream || "";
  }

  function turningPointDate(tp, allEvents) {
    var ids = tp.eventIds || [];
    var i;
    for (i = 0; i < ids.length; i += 1) {
      var ev = eventById(allEvents, ids[i]);
      if (ev && ev.startDate) return formatDateLabel(ev.startDate);
    }
    return "Undated";
  }

  function eventMatchesLane(ev, lane) {
    if (!lane) return false;
    if (eventStream(ev) !== lane.stream) return false;
    if (lane.substream) return eventSubstream(ev) === lane.substream;
    return true;
  }

  function laneVisible(lane, filters) {
    if (!lane) return false;
    if (lane.stream === "igem") return !filters || filters.showIgem !== false;
    if (!filters || !filters.stream || filters.stream === "all") return true;
    if (filters.stream === "wetlab") return lane.stream === "wetlab";
    if (filters.stream === "drylab" || filters.stream === "drylab-all") {
      if (lane.stream !== "drylab") return false;
      if (!filters.substream || filters.substream === "all") return true;
      return lane.substream === filters.substream;
    }
    if (filters.stream === "hardware") {
      return lane.id === "hardware";
    }
    if (filters.stream === "model") {
      return lane.id === "model";
    }
    return lane.stream === filters.stream;
  }

  function streamMatches(ev, filterStream, filterSubstream) {
    var stream = eventStream(ev);
    if (!filterStream || filterStream === "all") return true;
    if (filterStream === "drylab-all" || filterStream === "drylab") {
      if (stream !== "drylab") return false;
      if (!filterSubstream || filterSubstream === "all") return true;
      return eventSubstream(ev) === filterSubstream;
    }
    if (filterStream === "hardware") {
      return stream === "drylab" && eventSubstream(ev) === "hardware";
    }
    if (filterStream === "model") {
      return stream === "drylab" && eventSubstream(ev) === "model";
    }
    return stream === filterStream;
  }

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

  var MONTH_FULL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var WEEKDAY_FULL = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
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
        substream: null,
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
      return eventStream(ev) === stream;
    });
  }

  function eventsForSubstream(events, substream) {
    return events.filter(function (ev) {
      return eventStream(ev) === "drylab" && eventSubstream(ev) === substream;
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
    var streams = ["wetlab", "drylab"];
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

      if (stream === "drylab") {
        ["hardware", "model"].forEach(function (sub) {
          var subCard = qs('[data-substream-card="' + sub + '"]', card);
          if (!subCard) return;
          var subList = eventsForSubstream(list, sub);
          var subStatus = deriveStreamStatus(subList);
          var subMile = latestMilestone(subList);
          subCard.setAttribute("data-stream-status-value", subStatus);
          setStatusEl(qs("[data-substream-status]", subCard), subStatus);
          var subCount = qs("[data-substream-count]", subCard);
          if (subCount) subCount.textContent = String(subList.length);
          var subMileEl = qs("[data-substream-milestone]", subCard);
          if (subMileEl) {
            subMileEl.textContent = subMile
              ? subMile.title
              : "No documented records yet";
          }
        });
      }
    });

    if (live) {
      live.textContent =
        total +
        " documented records across Wet Lab and Dry Lab (Hardware | Model) — counts computed from notebook-data.js.";
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
      substream: val("substream", "all"),
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
      if (!streamMatches(ev, filters.stream, filters.substream)) return false;
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

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function dateBoundMs(value, bound) {
    if (!value) return null;
    var parts = String(value).split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!y || !m) return null;
    var d =
      parts.length >= 3 ? parseInt(parts[2], 10) : NaN;
    if (!d) {
      d = bound === "end" ? daysInMonth(y, m) : 1;
    }
    return Date.UTC(y, m - 1, d);
  }

  function eventSpanMs(ev) {
    if (!ev) return null;
    var start = dateBoundMs(ev.startDate || ev.endDate, "start");
    var end = dateBoundMs(ev.endDate || ev.startDate, "end");
    if (start == null && end == null) return null;
    if (start == null) start = end;
    if (end == null) end = start;
    if (end < start) end = start;
    return { start: start, end: inclusiveEndMs(end) };
  }

  function axisPercent(ms, axis) {
    var span = axis.end - axis.start;
    if (!span) return 0;
    var pct = ((ms - axis.start) / span) * 100;
    if (pct < 0) return 0;
    if (pct > 100) return 100;
    return pct;
  }

  function overlapSpan(span, period) {
    if (!span || !period) return null;
    var start = Math.max(span.start, period.start);
    var end = Math.min(span.end, inclusiveEndMs(period.end));
    if (end <= start) return null;
    return { start: start, end: end };
  }

  function assignTracksMs(placed) {
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
          if (tracks[t] <= item.start) {
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
    if (ev.isOfficial || eventStream(ev) === "igem") return "igem";
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
      day: now.getDate(),
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
          eventWorkstreamLabel(ev)
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
        var scholarlyList = makeEl("ul", "nb-event-drawer__list");
        var technicalList = makeEl("ul", "nb-event-drawer__list");
        (ev.references || []).forEach(function (ref) {
          if (!ref) return;
          var id = typeof ref === "string" ? "" : ref.id || "";
          var li = makeEl(
            "li",
            null,
            typeof ref === "string" ? ref : ref.text || ref.id || ""
          );
          if (!li.textContent) return;
          if (id.indexOf("hw-ref-") === 0) {
            technicalList.appendChild(li);
          } else {
            scholarlyList.appendChild(li);
          }
        });
        if (scholarlyList.childNodes.length) {
          appendSection(bodyEl, "References", scholarlyList);
        }
        if (technicalList.childNodes.length) {
          appendSection(bodyEl, "Technical sources & project files", technicalList);
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

    var monthRoot = qs("[data-month-calendar]", calRoot);
    var gridEl = qs("[data-cal-grid]", calRoot);
    var agendaEl = qs("[data-cal-day-agenda]", calRoot);
    var titleEl = qs("[data-cal-month-title]", calRoot);
    var yearEl = qs(".nb-monthcal__year", calRoot);
    var prevBtn = qs("[data-cal-prev]", calRoot);
    var nextBtn = qs("[data-cal-next]", calRoot);
    var todayBtn = qs("[data-cal-today]", calRoot);
    var monthSelect = qs("[data-cal-month-select]", calRoot);

    var today = todayInfo();
    var state = {
      focusMonth: today.isChronicleYear ? today.monthIndex : 8,
      selectedDate: null,
      selectedId: null,
    };

    if (today.isChronicleYear) {
      state.selectedDate = makeDate(YEAR, today.monthIndex, today.day);
    } else {
      state.selectedDate = makeDate(YEAR, state.focusMonth, 1);
    }

    function makeDate(year, month, day) {
      return new Date(year, month, day);
    }

    function lookupEvent(id) {
      return eventById(teamEvents, id) || eventById(officialEvents, id);
    }

    function matchedEvents() {
      return filterEvents(teamEvents, getFilters(), officialEvents);
    }

    function daysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    function firstWeekday(year, month) {
      return new Date(year, month, 1).getDay();
    }

    function dateKey(year, month, day) {
      return year + "-" + pad2(month + 1) + "-" + pad2(day);
    }

    function keyFromDate(date) {
      if (!date) return "";
      return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function eventsForDate(events, date) {
      if (!date) return [];
      var start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
      var end = start + DAY_MS;
      return events.filter(function (ev) {
        var span = eventSpanMs(ev);
        if (!span) return false;
        return span.start < end && span.end > start;
      });
    }

    function indicatorStream(ev) {
      if (eventStream(ev) === "igem") return "igem";
      var vis = visualStreamKey(ev);
      if (vis === "hardware") return "hardware";
      if (vis === "model" || vis === "drylab") return "model";
      return "wetlab";
    }

    function fillMonthSelect() {
      if (!monthSelect || monthSelect.options.length) return;
      MONTH_FULL.forEach(function (label, index) {
        var opt = document.createElement("option");
        opt.value = String(index);
        opt.textContent = label;
        monthSelect.appendChild(opt);
      });
    }

    function syncChrome() {
      if (titleEl) titleEl.textContent = MONTH_FULL[state.focusMonth] || "";
      if (yearEl) yearEl.textContent = String(YEAR);
      if (monthSelect) monthSelect.value = String(state.focusMonth);
      if (prevBtn) prevBtn.disabled = state.focusMonth <= 0;
      if (nextBtn) nextBtn.disabled = state.focusMonth >= 11;
    }

    function goToMonth(month) {
      var next = Math.max(0, Math.min(11, Number(month)));
      state.focusMonth = next;
      if (
        !state.selectedDate ||
        state.selectedDate.getFullYear() !== YEAR ||
        state.selectedDate.getMonth() !== state.focusMonth
      ) {
        if (today.isChronicleYear && today.monthIndex === state.focusMonth) {
          state.selectedDate = makeDate(YEAR, state.focusMonth, today.day);
        } else {
          state.selectedDate = makeDate(YEAR, state.focusMonth, 1);
        }
      }
      renderMonth();
      renderDayAgenda(state.selectedDate);
    }

    function selectDate(date) {
      if (!date) return;
      if (date.getFullYear() !== YEAR) return;
      state.selectedDate = makeDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      if (state.focusMonth !== date.getMonth()) {
        state.focusMonth = date.getMonth();
      }
      renderMonth();
      renderDayAgenda(state.selectedDate);
    }

    function openEvent(ev, trigger, fromHash) {
      if (!ev) return;
      state.selectedId = ev.id;
      var span = eventSpanMs(ev);
      if (span) {
        var start = new Date(span.start);
        var pick = makeDate(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate()
        );
        if (today.isChronicleYear) {
          var todayDate = makeDate(YEAR, today.monthIndex, today.day);
          var todayMs = Date.UTC(YEAR, today.monthIndex, today.day);
          if (span.start <= todayMs && span.end > todayMs) {
            pick = todayDate;
          }
        }
        if (pick.getFullYear() === YEAR) {
          selectDate(pick);
        }
      }
      if (drawerApi && drawerApi.open) {
        drawerApi.open(ev, trigger, fromHash);
      }
    }


    function renderEventMarks(holder, dayEvents) {
      holder.innerHTML = "";
      var shown = dayEvents.slice(0, 3);
      shown.forEach(function (ev) {
        var st = statusClass(ev);
        var mark = document.createElement("span");
        mark.className =
          "nb-monthcal__mark nb-monthcal__mark--" +
          indicatorStream(ev) +
          " nb-monthcal__mark--" +
          st;
        mark.setAttribute("aria-hidden", "true");
        mark.title = ev.title || "";
        if (st === "needs-update") mark.textContent = "!";
        holder.appendChild(mark);
      });
      if (dayEvents.length > 3) {
        var extra = document.createElement("span");
        extra.className = "nb-monthcal__more";
        extra.textContent = "+" + (dayEvents.length - 3);
        holder.appendChild(extra);
      }
    }

    function renderMonth() {
      if (!gridEl) return;
      var events = matchedEvents();
      var year = YEAR;
      var month = state.focusMonth;
      var lead = firstWeekday(year, month);
      var count = daysInMonth(year, month);
      var selectedKey = keyFromDate(state.selectedDate);
      var todayKey =
        today.isChronicleYear && today.monthIndex === month
          ? dateKey(YEAR, today.monthIndex, today.day)
          : "";

      gridEl.innerHTML = "";
      syncChrome();

      var cell;
      for (cell = 0; cell < lead; cell += 1) {
        var pad = document.createElement("div");
        pad.className = "nb-monthcal__day nb-monthcal__day--pad";
        pad.setAttribute("aria-hidden", "true");
        gridEl.appendChild(pad);
      }

      var day;
      for (day = 1; day <= count; day += 1) {
        var date = makeDate(year, month, day);
        var key = dateKey(year, month, day);
        var dayEvents = eventsForDate(events, date);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nb-monthcal__day";
        btn.setAttribute("role", "gridcell");
        btn.setAttribute("data-cal-day", key);
        btn.setAttribute(
          "aria-label",
          WEEKDAY_FULL[date.getDay()] +
            " " +
            MONTH_FULL[month] +
            " " +
            day +
            ", " +
            year +
            (dayEvents.length
              ? ", " +
                dayEvents.length +
                (dayEvents.length === 1 ? " record" : " records")
              : ", no records")
        );
        btn.setAttribute("aria-pressed", key === selectedKey ? "true" : "false");
        if (key === selectedKey) btn.classList.add("is-selected");
        if (key === todayKey) {
          btn.classList.add("is-today");
          btn.setAttribute("aria-current", "date");
        }
        if (dayEvents.length) btn.classList.add("has-events");

        var num = document.createElement("span");
        num.className = "nb-monthcal__daynum";
        num.textContent = String(day);
        btn.appendChild(num);

        var marks = document.createElement("div");
        marks.className = "nb-monthcal__events";
        renderEventMarks(marks, dayEvents);
        btn.appendChild(marks);

        btn.addEventListener(
          "click",
          (function (captured) {
            return function () {
              selectDate(captured);
            };
          })(date)
        );

        gridEl.appendChild(btn);
      }

      var trailing = (7 - ((lead + count) % 7)) % 7;
      for (cell = 0; cell < trailing; cell += 1) {
        var tail = document.createElement("div");
        tail.className = "nb-monthcal__day nb-monthcal__day--pad";
        tail.setAttribute("aria-hidden", "true");
        gridEl.appendChild(tail);
      }
    }

    function renderDayAgenda(date) {
      if (!agendaEl) return;
      agendaEl.innerHTML = "";
      if (!date) return;

      var heading = document.createElement("h3");
      heading.className = "nb-day-agenda__heading";
      heading.id = "nb-cal-agenda-heading";
      heading.textContent =
        WEEKDAY_FULL[date.getDay()] +
        " · " +
        MONTH_FULL[date.getMonth()] +
        " " +
        date.getDate();
      agendaEl.appendChild(heading);

      var dayEvents = eventsForDate(matchedEvents(), date)
        .slice()
        .sort(function (a, b) {
          return (
            dateSortKey(a.startDate || a.endDate) -
            dateSortKey(b.startDate || b.endDate)
          );
        });

      if (!dayEvents.length) {
        var empty = document.createElement("p");
        empty.className = "nb-day-agenda__empty";
        empty.textContent = "No project records on this date.";
        agendaEl.appendChild(empty);
        return;
      }

      var list = document.createElement("div");
      list.className = "nb-day-agenda__list";

      dayEvents.forEach(function (ev) {
        var st = statusClass(ev);
        var card = document.createElement("article");
        card.className =
          "nb-day-agenda__item nb-day-agenda__item--" +
          st +
          " nb-day-agenda__item--" +
          indicatorStream(ev);
        card.setAttribute("data-event-id", ev.id);
        card.setAttribute("data-stream", visualStreamKey(ev));

        var status = document.createElement("p");
        status.className = "nb-status nb-status--" + st;
        var mark = document.createElement("span");
        mark.className = "nb-status__mark";
        mark.setAttribute("aria-hidden", "true");
        var statusText = document.createElement("span");
        statusText.className = "nb-status__text";
        statusText.textContent = STATUS_LABEL[st] || ev.status;
        status.appendChild(mark);
        status.appendChild(statusText);

        var stream = document.createElement("p");
        stream.className = "nb-day-agenda__stream";
        stream.textContent = eventWorkstreamLabel(ev);

        var title = document.createElement("h4");
        title.className = "nb-day-agenda__title";
        title.textContent = ev.title;

        var summary = document.createElement("p");
        summary.className = "nb-day-agenda__summary";
        summary.textContent = ev.shortSummary
          ? truncate(String(ev.shortSummary), 220)
          : formatRange(ev);

        var openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "nb-day-agenda__open";
        openBtn.setAttribute("data-event-id", ev.id);
        openBtn.textContent = "View record →";
        openBtn.addEventListener("click", function () {
          openEvent(ev, openBtn, false);
        });

        card.appendChild(status);
        card.appendChild(stream);
        card.appendChild(title);
        card.appendChild(summary);
        card.appendChild(openBtn);
        list.appendChild(card);
      });

      agendaEl.appendChild(list);
    }

    function render() {
      var events = matchedEvents();
      updateViewCounts(root, events.length);
      fillMonthSelect();
      renderMonth();
      renderDayAgenda(state.selectedDate);

      var openId =
        (drawerApi && drawerApi.currentId && drawerApi.currentId()) ||
        state.selectedId;
      if (openId) {
        state.selectedId = openId;
        markEventSelected(openId, true);
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goToMonth(state.focusMonth - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goToMonth(state.focusMonth + 1);
      });
    }
    if (monthSelect) {
      monthSelect.addEventListener("change", function () {
        goToMonth(Number(monthSelect.value));
      });
    }
    if (todayBtn) {
      todayBtn.addEventListener("click", function () {
        if (today.isChronicleYear) {
          goToMonth(today.monthIndex);
          selectDate(makeDate(YEAR, today.monthIndex, today.day));
        } else {
          goToMonth(8);
          selectDate(makeDate(YEAR, 8, 1));
          todayBtn.textContent = "Not in 2026 — jumped to September";
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
    var streamChips = qsa("[data-tl-stream]", tlRoot);
    var subChips = qsa("[data-tl-substream]", tlRoot);
    var subWrap = qs("[data-tl-substreams]", tlRoot);

    function syncChips(filters) {
      var stream = filters.stream || "all";
      var sub = filters.substream || "all";
      if (stream === "drylab-all") stream = "drylab";
      streamChips.forEach(function (chip) {
        var on = chip.getAttribute("data-tl-stream") === stream;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (subWrap) subWrap.hidden = stream !== "drylab";
      subChips.forEach(function (chip) {
        var on = stream === "drylab" && chip.getAttribute("data-tl-substream") === sub;
        chip.classList.toggle("is-active", on);
        chip.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    streamChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var stream = chip.getAttribute("data-tl-stream") || "all";
        setStreamFilter(stream, "all");
      });
    });

    subChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var sub = chip.getAttribute("data-tl-substream") || "all";
        setStreamFilter("drylab", sub);
      });
    });

    function lookupEvent(id) {
      return eventById(teamEvents, id) || eventById(officialEvents, id);
    }

    function render() {
      var filters = getFilters();
      syncChips(filters);
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
          var visual = visualStreamKey(ev);
          card.className =
            "nb-tl-card nb-tl-card--" +
            st +
            " nb-tl-card--stream-" +
            visual +
            (eventStream(ev) === "igem" ? " nb-tl-card--igem" : "");
          card.setAttribute("data-event-id", ev.id);
          card.setAttribute("data-stream", visual);
          card.setAttribute("data-substream", eventSubstream(ev) || "");

          var keyLine = keyResultOrDecision(ev);
          card.innerHTML =
            '<header class="nb-tl-card__meta">' +
            "<time>" +
            formatRange(ev) +
            "</time>" +
            '<span class="nb-tl-card__stream">' +
            eventWorkstreamLabel(ev) +
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

    function periodFlex(period) {
      return inclusiveEndMs(period.end) - period.start;
    }

    function todayMs() {
      if (!today.isChronicleYear) return null;
      return Date.UTC(YEAR, today.monthIndex, today.day);
    }

    function todayOnAxis() {
      var t = todayMs();
      return t != null && t >= GANTT_AXIS.start && t < GANTT_AXIS.end;
    }

    function laneDisplayLabel(lane) {
      if (lane.id === "igem") return "iGEM milestones";
      return lane.label;
    }

    function spanDurationLabel(span) {
      if (!span) return "Undated";
      var days = Math.max(1, Math.round((span.end - span.start) / DAY_MS));
      if (days === 1) return "1 day";
      if (days < 14) return days + " days";
      var weeks = Math.round(days / 7);
      if (weeks < 9) return weeks + (weeks === 1 ? " week" : " weeks");
      var months = Math.max(1, Math.round(days / 30.44));
      return months + (months === 1 ? " month" : " months");
    }

    function ganttRowItems(filters) {
      var items = [];
      var wet = LANE_DEFS[0];
      var hardware = LANE_DEFS[1];
      var model = LANE_DEFS[2];
      var igem = LANE_DEFS[3];
      if (laneVisible(wet, filters)) {
        items.push({ kind: "lane", lane: wet, branch: "" });
      }
      var showHw = laneVisible(hardware, filters);
      var showModel = laneVisible(model, filters);
      if (showHw || showModel) {
        items.push({ kind: "group", id: "drylab", label: "Dry Lab" });
        if (showHw && showModel) {
          items.push({ kind: "lane", lane: hardware, branch: "├" });
          items.push({ kind: "lane", lane: model, branch: "└" });
        } else if (showHw) {
          items.push({ kind: "lane", lane: hardware, branch: "└" });
        } else {
          items.push({ kind: "lane", lane: model, branch: "└" });
        }
      }
      if (laneVisible(igem, filters)) {
        items.push({ kind: "lane", lane: igem, branch: "" });
      }
      return items;
    }

    function appendPhaseGuides(track) {
      GANTT_PERIODS.forEach(function (period, index) {
        var guide = document.createElement("span");
        guide.className =
          "nb-gantt-chart__guide nb-gantt-chart__guide--" + period.id;
        if (index === 0) guide.classList.add("is-first");
        guide.style.left = axisPercent(period.start, GANTT_AXIS) + "%";
        guide.style.width =
          axisPercent(inclusiveEndMs(period.end), GANTT_AXIS) -
          axisPercent(period.start, GANTT_AXIS) +
          "%";
        guide.setAttribute("aria-hidden", "true");
        track.appendChild(guide);
      });
      if (todayOnAxis()) {
        var line = document.createElement("span");
        line.className = "nb-gantt-chart__today";
        line.style.left = axisPercent(todayMs(), GANTT_AXIS) + "%";
        line.setAttribute("aria-hidden", "true");
        track.appendChild(line);
      }
    }

    function renderChart(events) {
      if (!chartEl) return;
      chartEl.innerHTML = "";
      chartEl.className = "nb-gantt-view__chart nb-gantt-chart";

      var filters = getFilters();
      var head = document.createElement("div");
      head.className = "nb-gantt-chart__head";
      head.appendChild(document.createElement("span")).className =
        "nb-gantt-chart__corner";

      var axis = document.createElement("div");
      axis.className = "nb-gantt-chart__axis";
      axis.setAttribute("aria-hidden", "true");
      GANTT_PERIODS.forEach(function (period) {
        var cell = document.createElement("span");
        cell.className =
          "nb-gantt-chart__period nb-gantt-chart__period--" + period.id;
        cell.style.flexGrow = String(periodFlex(period));
        cell.style.flexBasis = "0";
        cell.innerHTML =
          '<span class="nb-gantt-chart__period-range">' +
          period.shortLabel +
          '</span><span class="nb-gantt-chart__period-name">' +
          period.label +
          "</span>";
        axis.appendChild(cell);
      });
      if (todayOnAxis()) {
        var todayMark = document.createElement("span");
        todayMark.className = "nb-gantt-chart__today";
        todayMark.style.left = axisPercent(todayMs(), GANTT_AXIS) + "%";
        axis.appendChild(todayMark);
      }
      head.appendChild(axis);
      chartEl.appendChild(head);

      function renderGroupRow(item) {
        var row = document.createElement("div");
        row.className =
          "nb-gantt-chart__row nb-gantt-chart__row--group nb-gantt-chart__row--" +
          item.id;
        var label = document.createElement("div");
        label.className = "nb-gantt-chart__label";
        label.innerHTML = "<span>" + item.label + "</span>";
        row.appendChild(label);
        var track = document.createElement("div");
        track.className = "nb-gantt-chart__track";
        track.setAttribute("aria-hidden", "true");
        appendPhaseGuides(track);
        row.appendChild(track);
        chartEl.appendChild(row);
      }

      function renderLaneRow(item) {
        var lane = item.lane;
        var laneEvents = events.filter(function (ev) {
          return eventMatchesLane(ev, lane);
        });
        var placed = [];
        var markers = [];

        laneEvents.forEach(function (ev) {
          var span = eventSpanMs(ev);
          if (!span) {
            markers.push({ ev: ev, undated: true });
            return;
          }
          if (span.end <= GANTT_AXIS.start || span.start >= GANTT_AXIS.end) {
            return;
          }
          var start = Math.max(span.start, GANTT_AXIS.start);
          var end = Math.min(span.end, GANTT_AXIS.end);
          if (lane.stream === "igem" || ev.isOfficial) {
            markers.push({ ev: ev, start: start, end: end });
            return;
          }
          placed.push({
            ev: ev,
            start: start,
            end: end,
            track: 0,
          });
        });

        var trackCount = Math.max(1, assignTracksMs(placed));
        var row = document.createElement("div");
        row.className =
          "nb-gantt-chart__row nb-gantt-chart__row--" +
          lane.id +
          (item.branch ? " nb-gantt-chart__row--sub" : "") +
          (lane.stream === "igem" ? " nb-gantt-chart__row--official" : "");
        row.style.setProperty("--nb-gantt-tracks", String(trackCount));

        var name = laneDisplayLabel(lane);
        var label = document.createElement("div");
        label.className = "nb-gantt-chart__label";
        label.innerHTML =
          (item.branch
            ? '<span class="nb-gantt-chart__branch" aria-hidden="true">' +
              item.branch +
              "</span>"
            : "") +
          "<span>" +
          name +
          '</span><span class="nb-gantt-chart__count">' +
          laneEvents.length +
          "</span>";
        row.appendChild(label);

        var track = document.createElement("div");
        track.className = "nb-gantt-chart__track";
        track.setAttribute("role", "group");
        track.setAttribute("aria-label", name + " Gantt bands");
        appendPhaseGuides(track);

        placed.forEach(function (placedItem) {
          var st = statusClass(placedItem.ev);
          var visual = visualStreamKey(placedItem.ev);
          var left = axisPercent(placedItem.start, GANTT_AXIS);
          var right = axisPercent(placedItem.end, GANTT_AXIS);
          var width = Math.max(right - left, 0.8);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "nb-gantt-bar nb-gantt-bar--" +
            st +
            " nb-gantt-bar--lane-" +
            visual;
          btn.style.left = left + "%";
          btn.style.width = width + "%";
          btn.style.top = "calc(0.35rem + " + placedItem.track + " * 2.55rem)";
          btn.setAttribute("data-event-id", placedItem.ev.id);
          btn.title = placedItem.ev.title + " · " + formatRange(placedItem.ev);
          btn.setAttribute(
            "aria-label",
            placedItem.ev.title +
              ", " +
              name +
              ", " +
              (STATUS_LABEL[st] || st) +
              ", " +
              formatRange(placedItem.ev)
          );
          btn.innerHTML =
            '<span class="nb-gantt-bar__title">' +
            conciseTitle(placedItem.ev) +
            "</span>" +
            (st === "ongoing"
              ? '<span class="nb-gantt-bar__now" aria-hidden="true">●</span>'
              : "") +
            (st === "needs-update"
              ? '<span class="nb-gantt-bar__warn" aria-hidden="true">!</span>'
              : "");
          btn.addEventListener("click", function () {
            if (typeof openRecord === "function") {
              openRecord(placedItem.ev, btn);
            }
          });
          track.appendChild(btn);
        });

        markers.forEach(function (markerItem) {
          var ev = markerItem.ev;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "nb-gantt-marker" +
            (eventStream(ev) === "igem"
              ? " nb-gantt-marker--igem"
              : " nb-gantt-marker--undated");
          btn.style.left = markerItem.undated
            ? "0%"
            : axisPercent(markerItem.start, GANTT_AXIS) + "%";
          btn.setAttribute("data-event-id", ev.id);
          btn.title = ev.title + (markerItem.undated ? "" : " · " + formatRange(ev));
          btn.setAttribute(
            "aria-label",
            ev.title +
              (markerItem.undated
                ? " (undated marker)"
                : ", " + formatRange(ev) + " (marker)")
          );
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
            lane.stream === "igem"
              ? "No official iGEM milestones yet."
              : "No matching bands.";
          track.appendChild(empty);
        }

        row.appendChild(track);
        chartEl.appendChild(row);
      }

      ganttRowItems(filters).forEach(function (item) {
        if (item.kind === "group") renderGroupRow(item);
        else renderLaneRow(item);
      });
    }

    function appendPhaseEventList(container, list) {
      var ul = document.createElement("ul");
      list
        .slice()
        .sort(function (a, b) {
          return eventEndKey(a) - eventEndKey(b);
        })
        .forEach(function (ev) {
          var st = statusClass(ev);
          var span = eventSpanMs(ev);
          var li = document.createElement("li");
          li.className =
            "nb-gantt-duration nb-gantt-duration--" +
            st +
            " nb-gantt-duration--lane-" +
            visualStreamKey(ev);
          var btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("data-gantt-phase-open", ev.id);
          btn.innerHTML =
            '<span class="nb-gantt-duration__meta">' +
            '<span class="nb-status nb-status--' +
            st +
            '"><span class="nb-status__mark" aria-hidden="true"></span><span class="nb-status__text">' +
            (STATUS_LABEL[st] || st) +
            "</span></span>" +
            '<span class="nb-gantt-duration__stream">' +
            spanDurationLabel(span) +
            "</span></span>" +
            "<strong>" +
            ev.title +
            "</strong>";
          li.appendChild(btn);
          ul.appendChild(li);
        });
      container.appendChild(ul);
    }

    function laneEventsInPeriod(events, lane, period) {
      return events.filter(function (ev) {
        if (!eventMatchesLane(ev, lane)) return false;
        var span = eventSpanMs(ev);
        if (!span) return false;
        return overlapSpan(span, period);
      });
    }

    function renderPhases(events) {
      if (!phasesEl) return;
      phasesEl.innerHTML = "";
      var filters = getFilters();
      var heading = document.createElement("h3");
      heading.className = "nb-gantt-phases__heading";
      heading.textContent = "By project phase";
      phasesEl.appendChild(heading);
      var lede = document.createElement("p");
      lede.className = "nb-gantt-phases__lede";
      lede.textContent =
        "Stacked by Discover, Build, and Validate. Duration and status are on the card; exact dates open in the record.";
      phasesEl.appendChild(lede);

      var rowItems = ganttRowItems(filters);
      GANTT_PERIODS.forEach(function (period) {
        var periodBlock = document.createElement("section");
        periodBlock.className =
          "nb-gantt-phases__period nb-gantt-phases__period--" + period.id;
        periodBlock.innerHTML =
          '<p class="nb-gantt-phases__when">' +
          period.shortLabel +
          "</p><h4>" +
          period.label +
          "</h4>";
        var hasAny = false;
        var dryGroup = null;

        rowItems.forEach(function (item) {
          if (item.kind === "group") {
            dryGroup = document.createElement("div");
            dryGroup.className =
              "nb-gantt-phases__group nb-gantt-phases__group--" + item.id;
            dryGroup.innerHTML = "<h5>" + item.label + "</h5>";
            return;
          }
          var list = laneEventsInPeriod(events, item.lane, period);
          if (!list.length) return;
          hasAny = true;
          var streamBlock = document.createElement("div");
          streamBlock.className =
            "nb-gantt-phases__stream nb-gantt-phases__stream--" + item.lane.id;
          streamBlock.innerHTML =
            "<h5>" +
            (item.branch
              ? '<span class="nb-gantt-chart__branch" aria-hidden="true">' +
                item.branch +
                "</span>"
              : "") +
            laneDisplayLabel(item.lane) +
            " <span>(" +
            list.length +
            ")</span></h5>";
          appendPhaseEventList(streamBlock, list);
          if (item.branch && dryGroup) {
            dryGroup.appendChild(streamBlock);
            if (!dryGroup.parentNode) periodBlock.appendChild(dryGroup);
          } else {
            periodBlock.appendChild(streamBlock);
          }
        });

        if (!hasAny) {
          var empty = document.createElement("p");
          empty.className = "nb-gantt-phases__empty";
          empty.textContent = "No matching records in this phase.";
          periodBlock.appendChild(empty);
        }
        phasesEl.appendChild(periodBlock);
      });

      var undated = events.filter(function (ev) {
        return !eventSpanMs(ev);
      });
      if (undated.length) {
        var uBlock = document.createElement("section");
        uBlock.className = "nb-gantt-phases__period";
        uBlock.innerHTML = "<h4>Undated</h4>";
        appendPhaseEventList(uBlock, undated);
        phasesEl.appendChild(uBlock);
      }

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

    points.forEach(function (tp) {
      var details = document.createElement("details");
      details.className = "nb-turning-point";
      details.id = tp.id;
      details.setAttribute("data-tp-stream", tp.stream || "");
      details.setAttribute("data-tp-substream", tp.substream || "");

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

      details.innerHTML =
        '<summary class="nb-turning-point__summary">' +
        '<span class="nb-turning-point__date">' +
        turningPointDate(tp, allEvents) +
        "</span>" +
        '<span class="nb-turning-point__title">' +
        tp.title +
        "</span>" +
        "</summary>" +
        '<div class="nb-turning-point__body">' +
        (turningPointLabel(tp)
          ? '<p class="nb-turning-point__stream">' +
            turningPointLabel(tp) +
            "</p>"
          : "") +
        "<p><strong>Before.</strong> " +
        tp.before +
        "</p>" +
        "<p><strong>Evidence.</strong> " +
        tp.evidence +
        "</p>" +
        "<p><strong>Decision.</strong> " +
        tp.decision +
        "</p>" +
        "<p><strong>After.</strong> " +
        tp.after +
        "</p>" +
        (links
          ? '<p class="nb-turning-point__sources">Source records: ' +
            links +
            "</p>"
          : "") +
        "</div>";

      list.appendChild(details);
    });

    stage.appendChild(list);

    function openFromHash() {
      var id = (location.hash || "").replace(/^#/, "");
      if (!id) return;
      var el = document.getElementById(id);
      if (el && el.classList.contains("nb-turning-point")) {
        el.open = true;
      }
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  function setFormStream(form, stream, substream) {
    if (!form) return;
    var mapped = stream || "all";
    if (mapped === "drylab-all") mapped = "drylab";
    if (mapped === "hardware" || mapped === "model") {
      if (form.elements.namedItem("substream")) {
        form.elements.namedItem("substream").value = mapped;
      }
      mapped = "drylab";
    }
    var el = form.elements.namedItem("stream");
    if (el) el.value = mapped;
    var subEl = form.elements.namedItem("substream");
    if (subEl) {
      subEl.value = mapped === "drylab" ? substream || "all" : "all";
    }
    syncSubstreamFilter(form);
  }

  function syncSubstreamFilter(form) {
    if (!form) return;
    var streamEl = form.elements.namedItem("stream");
    var isDry = streamEl && streamEl.value === "drylab";
    var wrap = qs("[data-substream-filter]", form);
    if (wrap) wrap.hidden = !isDry;
    var subEl = form.elements.namedItem("substream");
    if (subEl && !isDry) subEl.value = "all";
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
            substream: "all",
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
    syncSubstreamFilter(form);

    function apply() {
      syncSubstreamFilter(form);
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
        name === "substream" ||
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
      setStream: function (stream, substream) {
        setFormStream(form, stream, substream);
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
      function (stream, substream) {
        filterApi.setStream(stream, substream);
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
