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
      "details.hp-checkpoint__evidence, details.hp-disclose, details.hp-chapternav__mobile"
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

  function initOdorMap() {
    var map = qs("[data-hp-odor-map]");
    if (!map) return;
    var cats = qsa("[data-hp-odor-cat]", map);
    var drawer = qs("[data-hp-odor-drawer]", map);
    var drawerTitle = qs("[data-hp-odor-drawer-title]", map);
    var drawerBody = qs("[data-hp-odor-drawer-body]", map);
    var drawerClose = qs("[data-hp-odor-drawer-close]", map);

    function isMobileMap() {
      return window.matchMedia("(max-width: 839px)").matches;
    }

    function closeAll() {
      cats.forEach(function (cat) {
        cat.classList.remove("is-open");
        var btn = qs(".hp-odor__node", cat);
        var pop = qs(".hp-odor__pop", cat);
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (pop) pop.hidden = true;
      });
      if (drawer) drawer.hidden = true;
      if (drawerBody) drawerBody.innerHTML = "";
    }

    function openCat(cat) {
      var btn = qs(".hp-odor__node", cat);
      var pop = qs(".hp-odor__pop", cat);
      var name = qs(".hp-odor__cat-name", cat);
      var orgs = qs(".hp-odor__orgs", cat);
      var wasOpen = cat.classList.contains("is-open");
      closeAll();
      if (wasOpen) return;

      cat.classList.add("is-open");
      if (btn) btn.setAttribute("aria-expanded", "true");

      if (isMobileMap()) {
        if (drawerTitle) drawerTitle.textContent = name ? name.textContent : "";
        if (drawerBody && orgs) drawerBody.appendChild(orgs.cloneNode(true));
        if (drawer) drawer.hidden = false;
      } else if (pop) {
        pop.hidden = false;
      }
    }

    cats.forEach(function (cat) {
      var btn = qs(".hp-odor__node", cat);
      if (!btn) return;
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        openCat(cat);
      });
    });

    if (drawerClose) {
      drawerClose.addEventListener("click", closeAll);
    }

    doc.addEventListener("click", function (event) {
      if (!map.contains(event.target)) closeAll();
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeAll();
    });

    window.addEventListener("resize", closeAll);
  }

  function initRoad() {
    var road = qs("[data-hp-road]");
    if (!road) return;
    var checkpoints = qsa("[data-hp-checkpoint]", road);
    if (!checkpoints.length) return;
    checkpoints.forEach(function (cp) {
      cp.classList.add("is-lit");
    });
  }

  function isMobileDetail() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function initHpDetailPanel() {
    var panel = qs("[data-hp-detail-panel]");
    var empty = qs("[data-hp-detail-empty]", panel);
    var content = qs("#hp-detail-panel-content", panel);
    var closeBtn = qs("[data-hp-detail-close]", panel);
    var buttons = qsa("[data-hp-open-detail]");
    if (!panel || !content || !buttons.length) return;

    var ids = buttons
      .map(function (btn) {
        return btn.getAttribute("data-checkpoint-id");
      })
      .filter(Boolean);

    function setExpanded(id) {
      buttons.forEach(function (btn) {
        btn.setAttribute(
          "aria-expanded",
          btn.getAttribute("data-checkpoint-id") === id ? "true" : "false"
        );
      });
    }

    function closeMobile() {
      panel.classList.remove("is-open");
      if (isMobileDetail()) {
        setExpanded(null);
      }
    }

    function renderCheckpointDetail(id, opts) {
      opts = opts || {};
      var article = doc.getElementById(id);
      if (!article) return;

      var nameEl = qs(".hp-cp__name", article);
      var dateEl = qs(".hp-cp__date", article);
      var catEl = qs(".hp-cp__cat", article);
      var decisionEl = qs(".hp-cp__decision", article);
      var source = qs(".hp-cp__full .hp-cp__dl", article);
      var portraitWraps = qsa(".hp-cp__portrait", article);

      qsa(".hp-cp.is-active, .hp-road-stop.is-active").forEach(function (el) {
        el.classList.remove("is-active");
      });
      article.classList.add("is-active");
      var stop = article.closest(".hp-road-stop");
      if (stop) stop.classList.add("is-active");
      setExpanded(id);

      var portraits = doc.createElement("div");
      portraits.className = "hp-detail__portraits";
      portraitWraps.forEach(function (wrap) {
        portraits.appendChild(wrap.cloneNode(true));
      });

      var idx = ids.indexOf(id);
      var prevId = idx > 0 ? ids[idx - 1] : "";
      var nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : "";

      content.innerHTML = "";
      var top = doc.createElement("div");
      top.className = "hp-detail__top";
      top.appendChild(portraits);

      var who = doc.createElement("div");
      var cat = doc.createElement("p");
      cat.className = "hp-cp__cat";
      cat.textContent = catEl ? catEl.textContent : "";
      var heading = doc.createElement("h2");
      heading.id = "hp-detail-heading";
      heading.tabIndex = -1;
      heading.textContent = nameEl ? nameEl.textContent : "";
      var meta = doc.createElement("p");
      meta.className = "hp-detail__meta";
      meta.textContent = dateEl ? dateEl.textContent : "";
      var take = doc.createElement("p");
      take.className = "hp-detail__take";
      take.textContent = decisionEl ? decisionEl.textContent : "";
      who.appendChild(cat);
      who.appendChild(heading);
      who.appendChild(meta);
      who.appendChild(take);
      top.appendChild(who);
      content.appendChild(top);

      if (source) {
        content.appendChild(source.cloneNode(true));
      }

      var nav = doc.createElement("div");
      nav.className = "hp-detail__nav";
      var prevBtn = doc.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = "Previous checkpoint";
      prevBtn.disabled = !prevId;
      var nextBtn = doc.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = "Next checkpoint";
      nextBtn.disabled = !nextId;
      nav.appendChild(prevBtn);
      nav.appendChild(nextBtn);
      content.appendChild(nav);

      prevBtn.addEventListener("click", function () {
        if (prevId) renderCheckpointDetail(prevId, { focus: opts.focus });
      });
      nextBtn.addEventListener("click", function () {
        if (nextId) renderCheckpointDetail(nextId, { focus: opts.focus });
      });

      if (empty) empty.hidden = true;
      content.hidden = false;
      panel.classList.add("is-open");

      if (opts.focus) {
        heading.focus();
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        var id = button.getAttribute("data-checkpoint-id");
        renderCheckpointDetail(id, { focus: event.detail === 0 });
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeMobile);
    }

    doc.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (isMobileDetail() && panel.classList.contains("is-open")) {
        closeMobile();
      }
    });

    function openFromHash() {
      var hash = (location.hash || "").replace(/^#/, "");
      if (!hash) return;
      if (ids.indexOf(hash) === -1) {
        var host = doc.getElementById(hash);
        if (!host) return;
        var cp = host.closest ? host.closest("[data-hp-checkpoint]") : null;
        if (cp && cp.id) hash = cp.id;
      }
      if (ids.indexOf(hash) !== -1) {
        renderCheckpointDetail(hash, { focus: false });
      }
    }

    qsa("[data-hp-odor-map] a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function () {
        var id = (a.getAttribute("href") || "").slice(1);
        window.setTimeout(function () {
          if (ids.indexOf(id) !== -1) {
            renderCheckpointDetail(id, { focus: false });
            return;
          }
          var target = doc.getElementById(id);
          var cp = target && target.closest ? target.closest("[data-hp-checkpoint]") : null;
          if (cp && ids.indexOf(cp.id) !== -1) {
            renderCheckpointDetail(cp.id, { focus: false });
          }
        }, 0);
      });
    });

    window.addEventListener("hashchange", openFromHash);
    openFromHash();
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
    initHpDetailPanel();
    initEngagements();
    initOdorMap();
    setNavHeight();
    window.addEventListener("resize", setNavHeight);
    var mobile = qs(".hp-chapternav__mobile");
    if (mobile) mobile.addEventListener("toggle", setNavHeight);
  });
})();
