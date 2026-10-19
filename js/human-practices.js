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
    if (window.AeroSenseToc) return;
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

  function initValueIcons() {
    var marks = {
      early: '<circle cx="24" cy="25" r="14"/><path d="M24 16v10l6 4M17 6h14M24 6v5M35 13l4-4"/>',
      uncertainty: '<path d="M8 25h32M8 18v14M40 18v14M16 12h16M24 8v8"/><circle cx="24" cy="25" r="5"/><path d="M18 38h12"/>',
      modular: '<rect x="6" y="6" width="13" height="13" rx="3"/><rect x="29" y="6" width="13" height="13" rx="3"/><rect x="6" y="29" width="13" height="13" rx="3"/><rect x="29" y="29" width="13" height="13" rx="3"/><path d="M19 12h10M12 19v10M36 19v10M19 36h10"/>'
    };
    qsa('.hp-value-icon[data-value-icon]').forEach(function (slot) {
      var shape = marks[slot.getAttribute('data-value-icon')];
      if (!shape || slot.querySelector('svg')) return;
      slot.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">' + shape + '</svg>';
    });
  }


  // The current interviews remain the sole source of each journey panel.
  function initSourceJourney() {
    var section = qs('#hp-source-story');
    if (!section || section.dataset.journeyReady) return;
    var articles = qsa(':scope > .hp-story-chapter', section);
    if (!articles.length) return;
    var labels = [
      ['Ya-Yun Chang', 'Taoyuan DARES'],
      ['Professor Cheng', 'Enosim Bio-Tech'],
      ['Assistant Professor Huang', 'National Tsing Hua University'],
      ['Founder Lin', 'Challenge Bio'],
      ['Engineering team', 'iST Group'],
      ['Industry mentors', 'FITI'],
      ['NTHU Garage', 'Business development'],
      ['Patent Attorney Hsu', 'Intellectual property'],
      ['Public survey', 'Community perspectives'],
      ['Shan-chi Elementary School', 'Education partnership']
    ];
    section.dataset.journeyReady = 'true';
    var layout = doc.createElement('div');
    layout.className = 'hp-journey';
    var nav = doc.createElement('nav');
    nav.className = 'hp-journey__stops';
    nav.setAttribute('aria-label', 'Interview journey');
    var list = doc.createElement('ol');
    var chooser = doc.createElement('label');
    chooser.className = 'hp-journey__choose';
    var chooserText = doc.createElement('span');
    chooserText.textContent = 'Choose an interview';
    var selectInput = doc.createElement('select');
    chooser.append(chooserText, selectInput);
    nav.append(list);
    var reader = doc.createElement('div');
    reader.className = 'hp-journey__reader';
    reader.setAttribute('role', 'region');
    reader.tabIndex = 0;
    layout.append(nav, chooser, reader);
    section.append(layout);
    var current = 0;
    var buttons = articles.map(function (article, index) {
      var heading = qs('h3', article);
      if (!heading.id) heading.id = article.id + '-heading';
      var number = heading.textContent.match(/^#([\d.]+)/);
      var name = labels[index] ? labels[index][0] : heading.textContent;
      var role = labels[index] ? labels[index][1] : '';
      var item = doc.createElement('li');
      var button = doc.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-controls', article.id);
      var step = doc.createElement('span');
      step.className = 'hp-journey__number';
      step.textContent = number ? number[1].padStart(2, '0') : String(index + 1).padStart(2, '0');
      step.setAttribute('aria-hidden', 'true');
      var text = doc.createElement('span');
      var person = doc.createElement('strong');
      person.textContent = name;
      var organization = doc.createElement('small');
      organization.textContent = role;
      text.append(person, organization);
      button.append(step, text);
      item.append(button);
      list.append(item);
      var option = doc.createElement('option');
      option.value = String(index);
      option.textContent = (number ? number[1] + ' · ' : '') + name;
      selectInput.append(option);
      reader.append(article);
      button.addEventListener('click', function (event) { activate(index, { focus: event.detail === 0 }); });
      button.addEventListener('keydown', function (event) {
        var target;
        if (event.key === 'ArrowDown') target = (index + 1) % articles.length;
        else if (event.key === 'ArrowUp') target = (index + articles.length - 1) % articles.length;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = articles.length - 1;
        if (target === undefined) return;
        event.preventDefault();
        activate(target);
        buttons[target].focus({ preventScroll: true });
      });
      return button;
    });
    function activate(index, options) {
      options = options || {};
      current = index;
      articles.forEach(function (article, i) { article.hidden = i !== index; });
      buttons.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === index)); });
      selectInput.value = String(index);
      var heading = qs('h3', articles[index]);
      reader.setAttribute('aria-labelledby', heading.id);
      reader.scrollTop = 0;
      if (options.focus) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
    function revealTarget(target) {
      var article = target && target.closest ? target.closest('.hp-story-chapter') : null;
      var index = articles.indexOf(article);
      if (index < 0) return;
      activate(index);
      if (target !== article) requestAnimationFrame(function () {
        if (getComputedStyle(reader).position === 'sticky') {
          reader.scrollTop += target.getBoundingClientRect().top - reader.getBoundingClientRect().top - 20;
        }
      });
    }
    function fromHash() {
      try { revealTarget(doc.getElementById(decodeURIComponent(location.hash.slice(1)))); } catch (_) {}
    }
    function headerSpace() {
      var header = qs('.site-header');
      section.style.setProperty('--hp-journey-top', Math.ceil((header ? header.getBoundingClientRect().height : 80) + 16) + 'px');
    }
    selectInput.addEventListener('change', function () { activate(Number(selectInput.value)); });
    doc.addEventListener('aerosense:before-anchor', function (event) { revealTarget(event.detail && event.detail.target); });
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', headerSpace, { passive: true });
    doc.addEventListener('aerosense:languagechange', headerSpace);
    if ('ResizeObserver' in window && qs('.site-header')) new ResizeObserver(headerSpace).observe(qs('.site-header'));
    activate(0);
    headerSpace();
    fromHash();
  }

  function initStakeholderConnections(map) {
    var stage = qs('.hp-stakeholder-map__stage', map);
    var hub = qs('.hp-stakeholder-map__hub', map);
    var groups = qsa('.hp-stakeholder-map__group', map);
    if (!stage || !hub || !groups.length) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(ns, 'svg');
    svg.classList.add('hp-stakeholder-map__connections');
    svg.setAttribute('aria-hidden', 'true');
    var paths = groups.map(function () { var path = doc.createElementNS(ns, 'path'); svg.append(path); return path; });
    stage.prepend(svg);
    var frame = 0;
    function draw() {
      frame = 0;
      var box = stage.getBoundingClientRect();
      var center = hub.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      groups.forEach(function (group, index) {
        var target = group.getBoundingClientRect();
        var left = target.left < center.left;
        var x1 = (left ? center.left : center.right) - box.left;
        var y1 = center.top + center.height / 2 - box.top;
        var x2 = (left ? target.right : target.left) - box.left;
        var y2 = target.top + target.height / 2 - box.top;
        var middle = (x1 + x2) / 2;
        paths[index].setAttribute('d', 'M' + x1 + ' ' + y1 + 'H' + middle + 'V' + y2 + 'H' + x2);
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(stage);
    window.addEventListener('resize', schedule, { passive: true });
    doc.addEventListener('aerosense:languagechange', schedule);
    schedule();
  }

  function initStakeholderMap() {
    var map = qs('[data-hp-stakeholder-map]');
    if (!map) return;
    var people = qsa('.hp-stakeholder-person[data-person]', map);
    var panels = qsa('[data-stakeholder-panel]', map);
    var prompt = qs('[data-stakeholder-prompt]', map);
    var status = qs('[data-stakeholder-status]', map);
    var reader = qs('.hp-stakeholder-map__reader', map);
    var selected = null;
    function select(button, reveal) {
      selected = button;
      var key = button ? button.getAttribute('data-person') : '';
      people.forEach(function (person) { person.setAttribute('aria-pressed', person === button ? 'true' : 'false'); });
      panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-stakeholder-panel') !== key; });
      if (prompt) prompt.hidden = !!button;
      var active = panels.find(function (panel) { return !panel.hidden; });
      if (status) status.textContent = active ? active.textContent.trim().replace(/\s+/g, ' ') : '';
      if (reveal && reader) {
        var bounds = reader.getBoundingClientRect();
        if (bounds.bottom > window.innerHeight || bounds.top < 80) reader.scrollIntoView({block:'nearest', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      }
    }
    people.forEach(function (button, index) {
      button.addEventListener('click', function () { select(button, true); });
      button.addEventListener('keydown', function (event) {
        var next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % people.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + people.length - 1) % people.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = people.length - 1;
        if (next !== undefined) { event.preventDefault(); people[next].focus(); select(people[next], false); }
        if (event.key === 'Escape') { event.preventDefault(); select(null, false); }
      });
    });
    doc.addEventListener('aerosense:languagechange', function () {
      if (selected) window.requestAnimationFrame(function () { select(selected, false); });
    });
    map.classList.add('is-interactive');
    initStakeholderConnections(map);
    select(null, false);
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
        if (drawerTitle) drawerTitle.textContent = name ? (window.AeroSenseI18n?.sourceText(name)||name.textContent) : "";
        if (drawerBody && orgs) drawerBody.appendChild((window.AeroSenseI18n?.cloneSource(orgs)||orgs.cloneNode(true)));
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
    return window.matchMedia("(max-width: 1099px)").matches;
  }

  function initHpDetailPanel() {
    var panel = qs("[data-hp-detail-panel]");
    var empty = qs("[data-hp-detail-empty]", panel);
    var content = qs("#hp-detail-panel-content", panel);
    var closeBtn = qs("[data-hp-detail-close]", panel);
    var buttons = qsa("[data-hp-open-detail]");
    if (!panel || !content || !buttons.length) return;
    var layout = qs(".hp-road-layout");
    var desktop = window.matchMedia("(min-width: 1100px)");
    var currentId = "";

    function placeReader() {
      var checkpoint = currentId && doc.getElementById(currentId);
      var stop = checkpoint && checkpoint.closest(".hp-road-stop");
      if (desktop.matches && layout) layout.prepend(panel);
      else if (stop) stop.appendChild(panel);
    }

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
      setExpanded(null);
      content.hidden = true;
      if (empty) empty.hidden = false;
      var trigger = buttons.find(function (btn) { return btn.getAttribute("data-checkpoint-id") === currentId; });
      if (trigger) trigger.focus({preventScroll:true});
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
      currentId = id;
      if (stop) stop.classList.add("is-active");
      placeReader();
      setExpanded(id);

      var portraits = doc.createElement("div");
      portraits.className = "hp-detail__portraits";
      portraitWraps.forEach(function (wrap) {
        portraits.appendChild((window.AeroSenseI18n?.cloneSource(wrap)||wrap.cloneNode(true)));
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
      cat.textContent = catEl ? (window.AeroSenseI18n?.sourceText(catEl)||catEl.textContent) : "";
      var heading = doc.createElement("h2");
      heading.id = "hp-detail-heading";
      heading.tabIndex = -1;
      heading.textContent = nameEl ? (window.AeroSenseI18n?.sourceText(nameEl)||nameEl.textContent) : "";
      var meta = doc.createElement("p");
      meta.className = "hp-detail__meta";
      meta.textContent = dateEl ? (window.AeroSenseI18n?.sourceText(dateEl)||dateEl.textContent) : "";
      var take = doc.createElement("p");
      take.className = "hp-detail__take";
      take.textContent = decisionEl ? (window.AeroSenseI18n?.sourceText(decisionEl)||decisionEl.textContent) : "";
      who.appendChild(cat);
      who.appendChild(heading);
      who.appendChild(meta);
      who.appendChild(take);
      top.appendChild(who);
      content.appendChild(top);

      if (source) {
        content.appendChild((window.AeroSenseI18n?.cloneSource(source)||source.cloneNode(true)));
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
        if (prevId) renderCheckpointDetail(prevId, { focus: true });
      });
      nextBtn.addEventListener("click", function () {
        if (nextId) renderCheckpointDetail(nextId, { focus: true });
      });

      if (empty) empty.hidden = true;
      content.hidden = false;
      panel.classList.add("is-open");
      var reader = qs(".hp-detail-panel__inner", panel);
      if (reader) reader.scrollTop = 0;

      if (opts.focus) {
        heading.focus();
      } else if (opts.reveal && desktop.matches) {
        var bounds = panel.getBoundingClientRect();
        var header = qs(".site-header");
        var headerBottom = header ? header.getBoundingClientRect().bottom : 80;
        if (bounds.top < headerBottom || bounds.top > window.innerHeight * .5) {
          panel.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
        }
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        var id = button.getAttribute("data-checkpoint-id");
        renderCheckpointDetail(id, { focus: event.detail === 0, reveal:true });
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeMobile);
    }

    doc.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (panel.classList.contains("is-open")) {
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
    if (!currentId && desktop.matches) renderCheckpointDetail(ids[0], {focus:false});
    desktop.addEventListener("change", function () {
      if (!currentId && desktop.matches) renderCheckpointDetail(ids[0], {focus:false});
      else placeReader();
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
    initSourceJourney();
    initHpDetailPanel();
    initEngagements();
    initValueIcons();
    initStakeholderMap();
    initOdorMap();
    setNavHeight();
    window.addEventListener("resize", setNavHeight);
    var mobile = qs(".hp-chapternav__mobile");
    if (mobile) mobile.addEventListener("toggle", setNavHeight);
  });
})();
