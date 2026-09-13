/**
 * AeroSense Learning Lab — local progress only.
 * Namespace: aerosense.learn.v2
 * No names, emails, IPs, ages, or other identifiers.
 *
 * `feedback` is shaped as a future approved POST body (itemId, source,
 * selected/text, savedAt). Nothing is sent until a backend, consent,
 * and minimization exist. Do not add identifiers if that POST is added.
 *
 * Adding a new module: append its two-digit id to IDS below so pre/post
 * scores persist. Question item.id values live in js/learning-data.js and
 * must not be renamed.
 */
(function (root) {
  "use strict";

  var KEY = "aerosense.learn.v2";
  var LEGACY_KEY = "aerosense.learn.v1";
  var IDS = ["01", "02", "03", "04", "05"];

  function emptyModule(id) {
    return {
      moduleId: id,
      status: "not-started",
      preAnswers: {},
      preScore: null,
      postAnswers: {},
      postScore: null,
      reflection: "",
      completed: false,
    };
  }

  function emptyState() {
    var state = { v: 2, modules: {}, feedback: {} };
    IDS.forEach(function (id) {
      state.modules[id] = emptyModule(id);
    });
    return state;
  }

  function isoNow() {
    try {
      return new Date().toISOString();
    } catch (err) {
      return "";
    }
  }

  function copyFeedback(raw) {
    var out = {};
    var key;
    if (!raw || typeof raw !== "object") return out;
    for (key in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, key) && raw[key] && typeof raw[key] === "object") {
        out[key] = raw[key];
      }
    }
    return out;
  }

  function feedbackRecord(itemId, extra) {
    var rec = {
      itemId: itemId,
      source: "learning-platform",
      savedAt: isoNow(),
    };
    var key;
    extra = extra || {};
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) rec[key] = extra[key];
    }
    return rec;
  }

  function clampScore(value) {
    if (typeof value !== "number" || isNaN(value)) return null;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  }

  function normalizeModule(id, raw) {
    var base = emptyModule(id);
    if (typeof raw === "string") {
      base.status = raw === "completed" || raw === "in-progress" || raw === "not-started" ? raw : "not-started";
      base.completed = raw === "completed";
      return base;
    }
    if (!raw || typeof raw !== "object") return base;
    base.status =
      raw.status === "completed" || raw.status === "in-progress" || raw.status === "not-started"
        ? raw.status
        : base.status;
    base.preAnswers = raw.preAnswers && typeof raw.preAnswers === "object" ? raw.preAnswers : {};
    base.postAnswers = raw.postAnswers && typeof raw.postAnswers === "object" ? raw.postAnswers : {};
    base.preScore = clampScore(raw.preScore);
    base.postScore = clampScore(raw.postScore);
    base.reflection = typeof raw.reflection === "string" ? raw.reflection.slice(0, 2000) : "";
    base.completed = !!raw.completed || base.status === "completed";
    if (base.completed) base.status = "completed";
    return base;
  }

  function migrateLegacy(state) {
    try {
      var raw = window.localStorage.getItem(LEGACY_KEY);
      if (!raw) return state;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.modules) return state;
      IDS.forEach(function (id) {
        if (parsed.modules[id] && state.modules[id].status === "not-started") {
          state.modules[id] = normalizeModule(id, parsed.modules[id]);
        }
      });
    } catch (err) {
      /* ignore */
    }
    return state;
  }

  function read() {
    var state = emptyState();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.modules) {
          IDS.forEach(function (id) {
            state.modules[id] = normalizeModule(id, parsed.modules[id]);
          });
          state.feedback = copyFeedback(parsed.feedback);
        }
      } else {
        state = migrateLegacy(state);
        write(state);
      }
    } catch (err) {
      /* private mode */
    }
    return state;
  }

  function write(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getModule(state, id) {
    return (state && state.modules && state.modules[id]) || emptyModule(id);
  }

  function completedCount(state) {
    return IDS.reduce(function (n, id) {
      return n + (getModule(state, id).completed ? 1 : 0);
    }, 0);
  }

  function markInProgress(state, id) {
    var rec = getModule(state, id);
    if (rec.completed) return state;
    if (rec.status === "not-started") rec.status = "in-progress";
    state.modules[id] = rec;
    write(state);
    return state;
  }

  function savePre(state, id, answers, score) {
    var rec = getModule(state, id);
    rec.preAnswers = answers || {};
    rec.preScore = clampScore(score);
    if (rec.status === "not-started") rec.status = "in-progress";
    state.modules[id] = rec;
    write(state);
    return rec;
  }

  function savePost(state, id, answers, score) {
    var rec = getModule(state, id);
    rec.postAnswers = answers || {};
    rec.postScore = clampScore(score);
    rec.completed = true;
    rec.status = "completed";
    state.modules[id] = rec;
    write(state);
    return rec;
  }

  function saveReflection(state, id, text) {
    var rec = getModule(state, id);
    rec.reflection = String(text || "").slice(0, 2000);
    if (rec.status === "not-started") rec.status = "in-progress";
    state.modules[id] = rec;
    write(state);
    return rec;
  }

  function saveFeedback(state, itemId, payload) {
    var selected = payload && Array.isArray(payload.selected) ? payload.selected.slice() : [];
    state.feedback = state.feedback || {};
    state.feedback[itemId] = feedbackRecord(itemId, {
      selected: selected,
      other: String((payload && payload.other) || "").slice(0, 500),
    });
    write(state);
    return state.feedback[itemId];
  }

  function saveQcDesk(state, moduleId, batches) {
    state.feedback = state.feedback || {};
    state.feedback.ACT_QC_DECISIONS = feedbackRecord("ACT_QC_DECISIONS", {
      moduleId: moduleId || "05",
      batches: batches && typeof batches === "object" ? batches : {},
    });
    write(state);
    return state.feedback.ACT_QC_DECISIONS;
  }

  function saveThresholdNote(state, text) {
    state.feedback = state.feedback || {};
    state.feedback.ACT_THRESHOLD_NOTE = feedbackRecord("ACT_THRESHOLD_NOTE", {
      text: String(text || "").slice(0, 2000),
    });
    write(state);
    return state.feedback.ACT_THRESHOLD_NOTE;
  }

  function feedbackPayload(state) {
    return {
      v: 2,
      source: "learning-platform",
      items: (state && state.feedback) || {},
    };
  }

  function resetAll() {
    var state = emptyState();
    try {
      window.localStorage.removeItem(LEGACY_KEY);
    } catch (err) {
      /* ignore */
    }
    write(state);
    return state;
  }

  root.AerosenseLearn = root.AerosenseLearn || {};
  root.AerosenseLearn.STORAGE = {
    KEY: KEY,
    IDS: IDS,
    read: read,
    write: write,
    getModule: getModule,
    completedCount: completedCount,
    markInProgress: markInProgress,
    savePre: savePre,
    savePost: savePost,
    saveReflection: saveReflection,
    saveFeedback: saveFeedback,
    saveQcDesk: saveQcDesk,
    saveThresholdNote: saveThresholdNote,
    feedbackPayload: feedbackPayload,
    resetAll: resetAll,
    emptyModule: emptyModule,
    emptyState: emptyState,
  };
})(window);
