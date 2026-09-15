/**
 * Human Practices — chapter navigation spy + sticky offset.
 * Relies on main.js for reveal, mobile nav, reading progress, side TOC.
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
    qsa("details.hp-disclose, details.hp-chapternav__mobile").forEach(function (el) {
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
      ".hp-chapternav__scroller a[href^='#'], .hp-chapternav__list a[href^='#'], .page-toc a[href^='#']"
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

    var ids = Object.keys(map);
    if (!ids.length) return;

    /* Child landmarks still light their parent chapter in the navigator */
    var aliasToParent = {
      "journey-01": "journey",
      "journey-02": "journey",
      "journey-03": "journey",
      "journey-04": "journey",
      "journey-05": "journey",
      "journey-06": "journey",
      "journey-07": "journey",
      "journey-08": "journey",
      "trail-beachhead": "decision-trail",
      "trail-sensing-bar": "decision-trail",
      "trail-claim-boundary": "decision-trail",
      "trail-buyers": "decision-trail",
      "trail-screening-role": "decision-trail",
      "trail-targets": "decision-trail",
      "tgt-banana": "target-selection",
      "tgt-mold": "target-selection",
      "tgt-indole": "target-selection",
      "stakeholder-map": "stakeholders",
      "integration-cases": "decision-trail",
      "how-hp-changed": "decision-trail",
      "ethical-analysis": "responsibility",
      "safety-regulation": "responsibility",
      "engagement-timeline": "engagements",
      "engagement-method": "engagements",
      "public-survey": "public-survey",
      "what-we-still-do-not-know": "limitations",
      "open-technical": "limitations",
      "open-stakeholder": "limitations",
      hero: "summary",
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

    ids.forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });

    Object.keys(aliasToParent).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  function initMobileNavOpen() {
    var nav = qs(".hp-chapternav__mobile");
    if (!nav) return;

    function sync() {
      /* Keep chapters reachable on small screens without forcing always-open clutter */
      if (window.matchMedia("(max-width: 1023px)").matches) {
        /* leave user toggle state; ensure summary remains keyboardable */
        return;
      }
    }

    sync();
    window.addEventListener("resize", sync);
  }

  function initScrollIntoNav() {
    /* When a chapter link is activated, close the mobile disclosure for clarity */
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

  function initHeroArc() {
    var arc = qs("[data-hp-arc]");
    if (!arc) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      arc.setAttribute("data-stage", "3");
      arc.classList.add("is-ready");
      return;
    }

    var stage = 0;
    var timers = [];

    function clearTimers() {
      timers.forEach(function (id) {
        window.clearTimeout(id);
      });
      timers = [];
    }

    function setStage(n) {
      stage = n;
      arc.setAttribute("data-stage", String(n));
    }

    function play() {
      clearTimers();
      arc.classList.add("is-ready");
      setStage(1);
      timers.push(
        window.setTimeout(function () {
          setStage(2);
        }, 420)
      );
      timers.push(
        window.setTimeout(function () {
          setStage(3);
        }, 840)
      );
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (stage >= 3) return;
          play();
          observer.unobserve(arc);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.35 }
    );

    arc.removeAttribute("data-stage");
    observer.observe(arc);
  }

  function initEcosystem() {
    var root = qs("[data-hp-ecosystem]");
    if (!root) return;

    var nodes = qsa(".hp-eco__node", root);
    var cards = qsa(".hp-eco-card", root);
    var links = qsa(".hp-eco__links line", root);
    var panel = qs("[data-hp-eco-panel]", root);
    var panelTitle = qs("[data-hp-eco-panel-title]", root);
    var panelKicker = qs("[data-hp-eco-panel-kicker]", root);
    var panelBody = qs("[data-hp-eco-panel-body]", root);
    var panelClose = qs("[data-hp-eco-close]", root);
    var live = qs("[data-hp-eco-live]", root);
    var cat = "all";
    var status = "all";
    var activeId = "";
    var placeholder =
      '<p class="hp-eco__panel-placeholder">Select a stakeholder node to inspect who they are, what we learned, and what changed. Planned nodes are mapped gaps — not completed interviews.</p>';

    function statusLabel(value) {
      if (value === "engaged") return "Engaged";
      if (value === "ongoing") return "Ongoing";
      return "Planned / not yet engaged";
    }

    function matches(el) {
      var elCat = el.getAttribute("data-cat") || "";
      var elStatus = el.getAttribute("data-status") || "";
      var catOk = cat === "all" || elCat === cat;
      var statusOk = status === "all" || elStatus === status;
      return catOk && statusOk;
    }

    function setChipGroup(groupSel, attr, value) {
      qsa(groupSel + " .hp-eco-chip", root).forEach(function (btn) {
        var on = btn.getAttribute(attr) === value;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function applyFilters() {
      var visible = 0;
      cards.forEach(function (card) {
        var show = matches(card);
        card.hidden = !show;
        if (show) visible += 1;
        if (!show && card.getAttribute("data-stakeholder") === activeId) {
          clearSelection(false);
        }
      });
      nodes.forEach(function (node) {
        var show = matches(node);
        node.hidden = !show;
        node.classList.toggle("is-dim", Boolean(activeId) && show && node.getAttribute("data-stakeholder") !== activeId);
      });
      links.forEach(function (line) {
        var id = line.getAttribute("data-link-for");
        var card = id ? doc.getElementById(id) : null;
        var show = card ? matches(card) : false;
        line.hidden = !show;
        line.classList.toggle("is-active", Boolean(activeId) && id === activeId);
        line.classList.toggle("is-dim", Boolean(activeId) && show && id !== activeId);
      });
      if (live) {
        live.textContent = "Showing " + visible + " stakeholder" + (visible === 1 ? "" : "s") + ".";
      }
    }

    function clearSelection(announce) {
      activeId = "";
      nodes.forEach(function (node) {
        node.setAttribute("aria-pressed", "false");
        node.classList.remove("is-active");
        node.classList.remove("is-dim");
      });
      cards.forEach(function (card) {
        card.classList.remove("is-active");
      });
      links.forEach(function (line) {
        line.classList.remove("is-active");
        line.classList.remove("is-dim");
      });
      if (panel) {
        panel.classList.add("is-empty");
        if (panelTitle) panelTitle.textContent = "Select a stakeholder";
        if (panelKicker) panelKicker.textContent = "Stakeholder detail";
        if (panelBody) panelBody.innerHTML = placeholder;
        if (panelClose) panelClose.hidden = true;
      }
      if (announce && live) live.textContent = "Stakeholder detail closed.";
    }

    function selectStakeholder(id, fromNode) {
      var card = doc.getElementById(id);
      if (!card || card.hidden) return;

      activeId = id;
      nodes.forEach(function (node) {
        var on = node.getAttribute("data-stakeholder") === id;
        node.setAttribute("aria-pressed", on ? "true" : "false");
        node.classList.toggle("is-active", on);
        node.classList.toggle("is-dim", !on && !node.hidden);
      });
      cards.forEach(function (c) {
        c.classList.toggle("is-active", c.id === id);
      });
      links.forEach(function (line) {
        var on = line.getAttribute("data-link-for") === id;
        line.classList.toggle("is-active", on);
        line.classList.toggle("is-dim", !on && !line.hidden);
      });

      var title = qs(".hp-eco-card__title", card);
      var catLabel = qs(".hp-eco-card__cat", card);
      var meta = qs(".hp-eco-card__meta", card);
      var dl = qs(".hp-eco-card__dl", card);

      if (panel && panelTitle && panelBody) {
        panel.classList.remove("is-empty");
        panelTitle.textContent = title ? title.textContent : id;
        if (panelKicker) {
          panelKicker.textContent = catLabel ? catLabel.textContent : "Stakeholder detail";
        }
        var html = "";
        if (meta) html += '<p class="hp-eco-card__meta">' + meta.innerHTML + "</p>";
        if (dl) html += '<dl class="hp-eco-card__dl">' + dl.innerHTML + "</dl>";
        panelBody.innerHTML = html;
        if (panelClose) panelClose.hidden = false;
        if (fromNode && window.matchMedia("(min-width: 1200px)").matches) {
          panel.focus();
        }
      }

      if (window.matchMedia("(max-width: 1199px)").matches) {
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        card.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }

      if (live) {
        live.textContent =
          "Opened " +
          (title ? title.textContent : id) +
          " — " +
          statusLabel(card.getAttribute("data-status") || "");
      }
    }

    qsa("[data-hp-eco-cat] .hp-eco-chip", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        cat = btn.getAttribute("data-filter-cat") || "all";
        setChipGroup("[data-hp-eco-cat]", "data-filter-cat", cat);
        applyFilters();
      });
    });

    qsa("[data-hp-eco-status] .hp-eco-chip", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        status = btn.getAttribute("data-filter-status") || "all";
        setChipGroup("[data-hp-eco-status]", "data-filter-status", status);
        applyFilters();
      });
    });

    nodes.forEach(function (node) {
      node.addEventListener("click", function () {
        var id = node.getAttribute("data-stakeholder");
        if (!id) return;
        if (activeId === id) {
          clearSelection(true);
          return;
        }
        selectStakeholder(id, true);
      });
    });

    /* Mobile / card deep-link activation */
    cards.forEach(function (card) {
      card.addEventListener("click", function (event) {
        if (event.target && event.target.closest && event.target.closest("a")) return;
        if (window.matchMedia("(min-width: 1200px)").matches) return;
        var id = card.id;
        if (!id) return;
        selectStakeholder(id, false);
      });
    });

    if (panelClose) {
      panelClose.addEventListener("click", function () {
        clearSelection(true);
      });
    }

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && activeId) clearSelection(true);
    });

    applyFilters();

    if (location.hash) {
      var hash = location.hash.slice(1);
      if (doc.getElementById(hash) && doc.getElementById(hash).classList.contains("hp-eco-card")) {
        selectStakeholder(hash, false);
      }
    }
  }

  function initDecisionChains() {
    var chains = qsa("[data-hp-chain]");
    if (!chains.length) return;

    qsa(".hp-chain__evidence").forEach(function (el) {
      var summary = qs("summary", el);
      if (!summary) return;
      function sync() {
        summary.setAttribute("aria-expanded", el.open ? "true" : "false");
      }
      sync();
      el.addEventListener("toggle", sync);
    });

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    chains.forEach(function (chain) {
      var steps = qsa(".hp-chain__step, .hp-chain__conn", chain);
      if (!steps.length) return;

      chain.classList.add("is-pending");

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            steps.forEach(function (step, index) {
              window.setTimeout(function () {
                step.classList.add("is-lit");
                if (index === steps.length - 1) {
                  chain.classList.remove("is-pending");
                }
              }, index * 70);
            });
            observer.unobserve(chain);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
      );

      observer.observe(chain);
    });
  }

  function initTargetSelection() {
    var root = qs("[data-hp-targets]");
    if (!root) return;

    var buttons = qsa("[data-target]", root).filter(function (el) {
      return el.tagName === "BUTTON";
    });
    var details = qsa("[data-target-detail]", root);
    var panel = qs("[data-hp-target-panel]", root);
    var panelTitle = qs("[data-hp-target-title]", root);
    var panelKicker = qs("[data-hp-target-kicker]", root);
    var panelBody = qs("[data-hp-target-body]", root);
    var live = qs("[data-hp-target-live]", root);
    var activeId = "tgt-banana";

    function detailById(id) {
      return qs('[data-target-detail="' + id + '"]', root);
    }

    function selectTarget(id, scroll) {
      var detail = detailById(id);
      if (!detail) return;
      activeId = id;

      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-target") === id;
        btn.classList.toggle("is-active", on);
        if (btn.classList.contains("hp-target-rowbtn")) {
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        }
      });

      details.forEach(function (d) {
        d.classList.toggle("is-active", d.getAttribute("data-target-detail") === id);
      });

      if (panel && panelBody && panelTitle) {
        var title = qs("h3", detail);
        panelTitle.textContent = title ? title.textContent.replace(/\s+/g, " ").trim() : id;
        if (panelKicker) {
          var thread = qs(".hp-target-detail__thread", detail);
          panelKicker.textContent = thread
            ? thread.textContent.replace(/\s+/g, " ").trim()
            : "Candidate detail";
        }
        /* Clone detail contents except the h3 */
        var clone = detail.cloneNode(true);
        var cloneTitle = qs("h3", clone);
        if (cloneTitle) cloneTitle.parentNode.removeChild(cloneTitle);
        panelBody.innerHTML = clone.innerHTML;
      }

      if (scroll && window.matchMedia("(max-width: 1199px)").matches) {
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        detail.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }

      if (live) {
        live.textContent = "Opened target candidate: " + (panelTitle ? panelTitle.textContent : id);
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-target");
        if (!id) return;
        selectTarget(id, true);
      });
    });

    selectTarget(activeId, false);

    if (location.hash) {
      var hash = location.hash.slice(1);
      if (detailById(hash)) selectTarget(hash, false);
    }
  }

  function initEngagements() {
    var root = qs("[data-hp-engagements]");
    if (!root) return;

    var cards = qsa("[data-eng-card]", root);
    var groups = qsa("[data-eng-group]", root);
    var empty = qs("[data-hp-eng-empty]", root);
    var live = qs("[data-hp-eng-live]", root);
    var filter = "all";

    function applyOrder() {
      cards.forEach(function (card) {
        var order = parseInt(card.getAttribute("data-eng-order") || "999", 10);
        card.style.order = String(order);
      });
      groups.forEach(function (group, i) {
        var title = qs(".hp-eng-group__title", group);
        var lede = qs(".hp-eng-group__lede", group);
        if (title) title.style.order = String(i * 1000);
        if (lede) lede.style.order = String(i * 1000 + 1);
      });
    }

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
            ? visible + " engagements shown."
            : visible + " engagement" + (visible === 1 ? "" : "s") + " in " + filter + ".";
      }
    }

    qsa("[data-eng-filter]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        setFilter(btn.getAttribute("data-eng-filter") || "all");
      });
    });

    applyOrder();
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
    initScrollIntoNav();
    initHeroArc();
    initEcosystem();
    initDecisionChains();
    initTargetSelection();
    initEngagements();
    setNavHeight();
    window.addEventListener("resize", setNavHeight);
    var mobile = qs(".hp-chapternav__mobile");
    if (mobile) mobile.addEventListener("toggle", setNavHeight);
  });
})();
