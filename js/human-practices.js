/**
 * Human Practices — road journey.
 * Relies on main.js for reveal, mobile nav, reading progress, side TOC.
 * Cards stay in document flow. Decorative SVG is never used to place interviews.
 */
(function () {
  "use strict";

  var doc = document;
  if (!doc.body || !doc.body.classList.contains("page-human-practices")) return;

  function qs(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  function setNavHeight() {
    var nav = qs("[data-hp-chapternav]");
    if (!nav) return;
    var h = Math.ceil(nav.getBoundingClientRect().height);
    doc.body.style.setProperty("--hp-nav-h", h + "px");
  }

  function initDiscloseAria() {
    qsa(
      "details.hp-checkpoint__evidence, details.hp-cp__more, details.hp-disclose, details.hp-chapternav__mobile"
    ).forEach(function (el) {
      var summary = qs("summary", el);
      if (!summary) return;
      function sync() {
        summary.setAttribute("aria-expanded", el.open ? "true" : "false");
      }
      sync();
      el.addEventListener("toggle", sync);
    });
  }

  function initChapterSpy() {
    var links = qsa(
      ".page-toc a[href^='#']"
    );
    if (!links.length) return;

    var currentLabel = qs("[data-hp-nav-current]");
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      if (!map[id]) map[id] = [];
      map[id].push(a);
    });

    var aliasToParent = {
      "journey-01": "road",
      "journey-02": "road",
      "journey-03": "road",
      "journey-04": "road",
      "journey-05": "road",
      "journey-06": "road",
      "journey-07": "road",
      "journey-08": "responsibility",
      journey: "road",
      "decision-trail": "road",
      "decision-beachhead": "road",
      "decision-buyers": "road",
      "decision-screening": "road",
      "decision-claims": "road",
      "decision-targets": "road",
      "decision-sensing": "road",
      "trail-beachhead": "road",
      "trail-sensing-bar": "road",
      "trail-claim-boundary": "road",
      "trail-buyers": "road",
      "trail-screening-role": "road",
      "trail-targets": "road",
      "target-selection": "road",
      "survey-changes": "engagements",
      "public-survey": "engagements",
      summary: "ihp",
      values: "how-we-worked",
      stakeholders: "how-we-worked",
      "stakeholder-map": "how-we-worked",
      "stakeholders-title": "how-we-worked",
      "integration-cases": "road",
      "how-hp-changed": "road",
      decisions: "road",
      "ethical-analysis": "responsibility",
      "safety-regulation": "responsibility",
      "engagement-timeline": "engagements",
      "engagement-method": "engagements",
      "eng-feedback": "engagements",
      "eng-network": "engagements",
      "eng-public": "engagements",
      "eng-mentorship": "engagements",
      "what-we-still-do-not-know": "limitations",
      "open-technical": "limitations",
      "open-stakeholder": "limitations",
      conclusion: "limitations",
      "phase-listen": "road",
      "phase-challenge": "road",
      "phase-decide": "road",
      "phase-rebuild": "road",
      "phase-revalidate": "road",
      "cp-taoyuan": "road",
      "cp-field": "road",
      "cp-survey": "engagements",
      "cp-enose": "road",
      "cp-challenge": "road",
      "cp-analytical": "road",
      "cp-fiti": "road",
      "cp-garage": "road",
      "cp-revalidate": "road",
      "st-taoyuan": "road",
      "st-associations": "road",
      "st-farms": "road",
      "st-enose": "road",
      "st-chianien": "road",
      "st-analytical": "road",
      "st-fiti": "road",
      "st-garage": "road",
      "st-public": "engagements",
      "st-exporters": "road",
      hero: "ihp",
    };

    function mark(id) {
      var navId = aliasToParent[id] || id;
      links.forEach(function (a) {
        a.removeAttribute("aria-current");
      });
      (map[navId] || []).forEach(function (a) {
        a.setAttribute("aria-current", "true");
      });
      if (currentLabel) {
        var mobile = qs('.hp-chapternav__scroller a[href="#' + navId + '"]');
        var text = mobile
          ? mobile.textContent.replace(/\s+/g, " ").trim()
          : ((map[navId] || [])[0] || { textContent: "" }).textContent.replace(/\s+/g, " ").trim();
        if (text) currentLabel.textContent = text;
      }
    }

    if (location.hash) {
      var hashId = location.hash.slice(1);
      if (map[hashId] || aliasToParent[hashId]) mark(hashId);
    }

    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          mark(entry.target.id);
        });
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: 0 }
    );

    Object.keys(map).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
    Object.keys(aliasToParent).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  function initMobileNavOpen() {
    var mobile = qs(".hp-chapternav__mobile");
    if (!mobile) return;
    qsa(".hp-chapternav__scroller a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 1023px)").matches) {
          mobile.open = false;
        }
      });
    });
  }

  function initPortraits() {
    qsa("[data-hp-portrait]").forEach(function (img) {
      var wrap = img.closest(".hp-cp__portrait");
      if (!wrap) return;

      function fallback() {
        wrap.classList.add("is-fallback");
        img.setAttribute("hidden", "hidden");
      }

      function ok() {
        if (img.naturalWidth) {
          wrap.classList.remove("is-fallback");
          img.removeAttribute("hidden");
        } else {
          fallback();
        }
      }

      img.addEventListener("error", fallback);
      img.addEventListener("load", ok);
      if (img.complete) ok();
    });
  }

  function initRelmap() {
    var map = qs("[data-hp-relmap]");
    if (!map) return;
    qsa(".hp-relmap__node--side", map).forEach(function (a) {
      a.addEventListener("click", function () {
        var all = qs("[data-eng-filter='all']");
        if (all) all.click();
      });
    });
  }

  function initRoad() {
    var road = qs("[data-hp-road]");
    if (!road) return;
    var checkpoints = qsa("[data-hp-checkpoint]", road);
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!checkpoints.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      checkpoints.forEach(function (cp) {
        cp.classList.add("is-lit");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-lit");
        });
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.28 }
    );
    checkpoints.forEach(function (cp) {
      observer.observe(cp);
    });
  }

  function initEngagements() {
    var root = qs("[data-hp-engagements]");
    if (!root) return;

    var cards = qsa("[data-eng-card]", root);
    var groups = qsa("[data-eng-group]", root);
    var empty = qs("[data-hp-eng-empty]", root);
    var live = qs("[data-hp-eng-live]", root);
    var filter = "all";

    function setFilter(next) {
      filter = next || "all";
      qsa("[data-eng-filter]", root).forEach(function (btn) {
        var on = btn.getAttribute("data-eng-filter") === filter;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });

      var visible = 0;
      cards.forEach(function (card) {
        var themes = (card.getAttribute("data-eng-themes") || "").split(/\s+/);
        var show = filter === "all" || themes.indexOf(filter) !== -1;
        card.hidden = !show;
        if (show) visible += 1;
      });

      groups.forEach(function (group) {
        var any = qsa("[data-eng-card]", group).some(function (c) {
          return !c.hidden;
        });
        group.hidden = !any;
      });

      if (empty) empty.hidden = visible > 0;
      if (live) {
        live.textContent =
          filter === "all"
            ? visible + " secondary engagements shown."
            : visible + " item" + (visible === 1 ? "" : "s") + " in " + filter + ".";
      }
    }

    qsa("[data-eng-filter]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        setFilter(btn.getAttribute("data-eng-filter") || "all");
      });
    });

    setFilter("all");
  }

  function onReady(fn) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    initDiscloseAria();
    initChapterSpy();
    initMobileNavOpen();
    initPortraits();
    initRoad();
    initEngagements();
    initRelmap();
    setNavHeight();
    window.addEventListener("resize", setNavHeight);
    var mobile = qs(".hp-chapternav__mobile");
    if (mobile) mobile.addEventListener("toggle", setNavHeight);
  });
})();
