/**
 * Members page — progressive enhancement only.
 * Compact cards and profile copy stay in the HTML when JS is off.
 */
(function () {
  "use strict";

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function initWorkstreamFilter() {
    var form = qs("[data-members-filter]");
    if (!form) return;

    var cards = qsa("#student-team [data-members-grid] > .members-card");
    var live = qs("[data-members-filter-live]", form);
    var empty = qs("[data-members-filter-empty]");
    var labels = {
      all: "all workstreams",
      "wet-lab": "Wet Lab",
      model: "Model",
      hardware: "Hardware",
      design: "Design",
      hp: "Human Practices",
      leadership: "Leadership",
    };

    function currentValue() {
      var checked = qs('input[name="student-workstream"]:checked', form);
      return checked ? checked.value : "all";
    }

    function matches(card, value) {
      if (value === "all") return true;
      var tokens = (card.getAttribute("data-workstreams") || "").split(/\s+/);
      return tokens.indexOf(value) !== -1;
    }

    function apply(announce) {
      var value = currentValue();
      var shown = 0;
      cards.forEach(function (card) {
        var on = matches(card, value);
        if (on) shown += 1;
        if (on) {
          card.removeAttribute("hidden");
          card.removeAttribute("aria-hidden");
        } else {
          card.setAttribute("hidden", "");
          card.setAttribute("aria-hidden", "true");
        }
      });
      if (empty) empty.hidden = shown !== 0;
      if (!live || !announce) return;
      var label = labels[value] || value;
      if (shown === 0) {
        live.textContent = "No student members listed for " + label + " yet.";
        return;
      }
      if (value === "all") {
        live.textContent = "Showing all " + shown + " student members.";
        return;
      }
      live.textContent =
        "Showing " + shown + " student member" + (shown === 1 ? "" : "s") + " in " + label + ".";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
    form.addEventListener("change", function () {
      apply(true);
    });
    apply(false);
  }

  function initProfiles() {
    var book = qs(".members-book");
    var openers = qsa(".members-specimen[aria-controls]");
    if (!book || !openers.length) return;

    function dialogFor(opener) {
      var id = opener.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    }

    function setExpanded(opener, expanded) {
      opener.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function openProfile(opener) {
      var dlg = dialogFor(opener);
      if (!dlg) return false;

      openers.forEach(function (other) {
        if (other !== opener) setExpanded(other, false);
      });

      if (typeof dlg.showModal === "function") {
        if (!dlg.open) dlg.showModal();
      } else if (!dlg.open) {
        dlg.setAttribute("open", "");
      }

      setExpanded(opener, true);
      var closeBtn = qs(".members-spread__close", dlg);
      if (closeBtn) closeBtn.focus();
      return true;
    }

    function closeProfile(opener) {
      setExpanded(opener, false);
      try {
        opener.focus();
      } catch (e) {
        /* ignore */
      }
    }

    openers.forEach(function (opener) {
      setExpanded(opener, false);
    });

    book.addEventListener("click", function (event) {
      var opener = event.target.closest(".members-specimen[aria-controls]");
      if (!opener || !book.contains(opener)) return;
      if (openProfile(opener)) event.preventDefault();
    });

    book.addEventListener("keydown", function (event) {
      if (event.key !== " " && event.key !== "Spacebar") return;
      var opener = event.target.closest(".members-specimen[aria-controls]");
      if (!opener || event.target !== opener) return;
      event.preventDefault();
      openProfile(opener);
    });

    qsa(".members-spread").forEach(function (dlg) {
      var opener = qs('.members-specimen[aria-controls="' + dlg.id + '"]');
      if (!opener) return;

      dlg.addEventListener("close", function () {
        closeProfile(opener);
      });

      if (typeof dlg.showModal !== "function") {
        dlg.addEventListener("keydown", function (event) {
          if (event.key !== "Escape") return;
          dlg.removeAttribute("open");
          closeProfile(opener);
        });
      }
    });
  }

  function openFromHash() {
    var id = location.hash ? location.hash.slice(1) : "";
    if (!id) return;
    var target = document.getElementById(id);
    if (!target || !target.classList.contains("members-spread")) return;
    var opener = qs('.members-specimen[aria-controls="' + id + '"]');
    if (opener) opener.click();
  }

  function initImageFallback() {
    var root = qs(".members-book");
    if (!root) return;

    root.addEventListener(
      "error",
      function (event) {
        var img = event.target;
        if (!img || img.tagName !== "IMG") return;
        var media = img.closest(".members-photo");
        if (!media || media.querySelector(".members-card__placeholder")) return;
        var picture = img.closest("picture");
        if (picture) picture.remove();
        else img.remove();
        var mark = document.createElement("span");
        mark.className = "members-card__placeholder";
        mark.textContent = "Portrait coming soon";
        media.appendChild(mark);
      },
      true
    );
  }

  function initMemoryStack() {
    var stack = qs("[data-memory-stack]");
    if (!stack) return;

    var cards = qsa("[data-memory-card]", stack);
    if (!cards.length) return;

    cards.sort(function (a, b) {
      var ai = parseInt(a.getAttribute("data-memory-index"), 10);
      var bi = parseInt(b.getAttribute("data-memory-index"), 10);
      if (isNaN(ai) && isNaN(bi)) return 0;
      if (isNaN(ai)) return 1;
      if (isNaN(bi)) return -1;
      return ai - bi;
    });

    var section = stack.closest(".members-memory");
    var status = qs("[data-memory-status]", section || document);
    var prevBtn = qs("[data-memory-prev]", section || document);
    var nextBtn = qs("[data-memory-next]", section || document);
    var currentIndex = 0;
    var lastIndex = cards.length - 1;
    var photoNumbers = [];
    var photoCount = 0;
    var locked = false;
    var lockTimer = null;
    var liftTimer = 0;
    var movingTimer = 0;
    var pointer = { id: null, x: 0, y: 0, skipClick: false };
    var narrow = window.matchMedia("(max-width: 639px)");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var SLOT_COUNT = 4;
    var VISIBLE_VIEWED = 3;
    var LOCK_MS = 400;
    var SLOT_CLASS_RE = /^is-viewed--slot-\d+$/;

    function sheetOf(card) {
      return qs(".members-memory__sheet", card);
    }

    function isEndCard(card) {
      return Boolean(card && card.hasAttribute("data-memory-end"));
    }

    cards.forEach(function (card, i) {
      if (i === 0 || isEndCard(card)) {
        photoNumbers[i] = 0;
        return;
      }
      photoCount += 1;
      photoNumbers[i] = photoCount;
    });

    function photoNumber(index) {
      return photoNumbers[index] || 0;
    }

    function sheetLabel(index) {
      if (index === 0) return "Open team memory book";
      if (isEndCard(cards[index])) return "To be continued.";
      var n = photoNumber(index);
      if (index >= lastIndex) return "Memory " + n + " of " + photoCount;
      return "Open memory " + n + " of " + photoCount;
    }

    function liveText(index) {
      if (index === 0) return "Showing team memory book cover";
      if (isEndCard(cards[index])) return "To be continued. NTHU iGEM 2026";
      return "Showing memory " + photoNumber(index) + " of " + photoCount;
    }

    function clearSlotClasses(card) {
      var className = card.className;
      if (!className) return;
      var tokens = className.split(/\s+/);
      var i;
      for (i = 0; i < tokens.length; i += 1) {
        if (SLOT_CLASS_RE.test(tokens[i])) card.classList.remove(tokens[i]);
      }
    }

    function setLock() {
      if (reduce.matches) {
        locked = false;
        return;
      }
      locked = true;
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(function () {
        locked = false;
      }, LOCK_MS);
    }

    function render(opts) {
      opts = opts || {};
      var departing = opts.departing || null;
      var behindOrder = 0;
      var viewedOrder = 0;
      var viewedTotal = currentIndex;
      var visibleStart = Math.max(0, viewedTotal - VISIBLE_VIEWED);

      cards.forEach(function (card, i) {
        var sheet = sheetOf(card);
        var active = i === currentIndex;
        var viewed = i < currentIndex;
        var behind = i > currentIndex;
        var lifting = departing === card;
        var archived = false;
        var slot = -1;

        if (viewed) {
          slot = viewedOrder % SLOT_COUNT;
          archived = viewedOrder < visibleStart;
          viewedOrder += 1;
        }

        clearSlotClasses(card);
        card.classList.toggle("is-active", active);
        card.classList.toggle("is-viewed", viewed && !lifting);
        card.classList.toggle("is-behind", behind);
        card.classList.toggle("is-archived", archived);
        card.classList.toggle("is-lifting", lifting);
        card.classList.toggle("is-moving", lifting || Boolean(opts.moving && (active || (viewed && !archived))));
        card.classList.remove("is-aside");
        card.style.removeProperty("--memory-rest");

        if (viewed && !lifting) {
          card.classList.add("is-viewed--slot-" + slot);
        }

        if (behind) {
          card.setAttribute("data-memory-depth", String(behindOrder));
          behindOrder += 1;
        } else {
          card.removeAttribute("data-memory-depth");
        }

        if (!sheet) return;

        sheet.setAttribute("aria-label", sheetLabel(i));
        if (active) {
          sheet.removeAttribute("tabindex");
          sheet.setAttribute("aria-current", "true");
        } else {
          sheet.setAttribute("tabindex", "-1");
          sheet.removeAttribute("aria-current");
        }
      });

      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.setAttribute(
          "aria-label",
          currentIndex >= lastIndex ? "Back to cover" : "Next memory"
        );
      }

      if (status && opts.announce) {
        status.textContent = liveText(currentIndex);
      }

      if (opts.moving) {
        window.clearTimeout(movingTimer);
        movingTimer = window.setTimeout(function () {
          cards.forEach(function (card) {
            card.classList.remove("is-moving", "is-lifting");
          });
        }, 700);
      }

      if (opts.focus) {
        var activeSheet = sheetOf(cards[currentIndex]);
        if (!activeSheet) return;
        try {
          activeSheet.focus();
        } catch (e) {
          /* ignore */
        }
      }
    }

    function goTo(nextIndex, opts) {
      opts = opts || {};
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex > lastIndex) nextIndex = lastIndex;
      if (nextIndex === currentIndex) return false;
      if (locked && !opts.force) return false;

      var previous = currentIndex;
      var forward = nextIndex > previous;
      currentIndex = nextIndex;

      if (!opts.force) setLock();

      window.cancelAnimationFrame(liftTimer);

      var shouldLift = forward && !reduce.matches && !opts.instant;
      var departing = shouldLift ? cards[previous] : null;

      render({
        departing: departing,
        moving: !reduce.matches,
        announce: opts.announce !== false,
        focus: opts.focus,
      });

      if (!departing) return true;

      liftTimer = window.requestAnimationFrame(function () {
        liftTimer = window.requestAnimationFrame(function () {
          render({
            moving: !reduce.matches,
            announce: false,
            focus: false,
          });
        });
      });
      return true;
    }

    function goNext(opts) {
      if (currentIndex >= lastIndex) return restart();
      return goTo(currentIndex + 1, opts || {});
    }

    function goPrev(opts) {
      if (currentIndex <= 0) return false;
      return goTo(currentIndex - 1, opts || {});
    }

    function restart() {
      locked = false;
      window.clearTimeout(lockTimer);
      window.clearTimeout(movingTimer);
      window.cancelAnimationFrame(liftTimer);
      return goTo(0, { force: true, instant: true, announce: true, focus: true });
    }

    stack.addEventListener("click", function (event) {
      if (pointer.skipClick) {
        event.preventDefault();
        pointer.skipClick = false;
        return;
      }
      var sheet = event.target.closest(".members-memory__sheet");
      if (!sheet || !stack.contains(sheet)) return;
      var card = sheet.closest("[data-memory-card]");
      if (!card || card !== cards[currentIndex]) return;
      goNext({ focus: true });
    });

    stack.addEventListener("pointerdown", function (event) {
      if (narrow.matches) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      var sheet = event.target.closest(".members-memory__sheet");
      if (!sheet || !stack.contains(sheet)) return;
      var card = sheet.closest("[data-memory-card]");
      if (!card || card !== cards[currentIndex]) return;
      pointer.id = event.pointerId;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.skipClick = false;
      try {
        sheet.setPointerCapture(event.pointerId);
      } catch (e) {
        /* ignore */
      }
    });

    stack.addEventListener("pointerup", function (event) {
      if (narrow.matches) return;
      if (pointer.id !== event.pointerId) return;
      var dx = event.clientX - pointer.x;
      var dy = event.clientY - pointer.y;
      pointer.id = null;
      if (Math.hypot(dx, dy) < 55) return;
      pointer.skipClick = true;
      goNext({ focus: true });
    });

    stack.addEventListener("pointercancel", function (event) {
      if (pointer.id !== event.pointerId) return;
      pointer.id = null;
      pointer.skipClick = false;
    });

    stack.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext({ focus: true });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev({ focus: true });
      } else if (event.key === "Home") {
        event.preventDefault();
        restart();
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(lastIndex, { focus: true, announce: true });
      }
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goPrev();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goNext();
      });
    }

    if (typeof reduce.addEventListener === "function") {
      reduce.addEventListener("change", function () {
        if (reduce.matches) {
          locked = false;
          window.clearTimeout(lockTimer);
        }
        render({ moving: false, announce: false });
      });
    }

    render({ announce: false });
  }

  function start() {
    if (!document.body || !document.body.classList.contains("page-members")) return;
    initImageFallback();
    initMemoryStack();
    initWorkstreamFilter();
    initProfiles();
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
