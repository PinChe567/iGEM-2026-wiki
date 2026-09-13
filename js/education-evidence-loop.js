/**
 * EducationEvidenceLoop
 * One evidence structure for games, workshops, Learning Lab, and teacher activities.
 * No fake counts. Pending fields stay pending.
 *
 * Adding an education evidence case:
 *   1. Push an object onto CASES with a stable id (eel-*), kind
 *      (learning-platform | game | workshop | teacher), status, tags, and
 *      steps.question/design/engage/evidence/learn/change/reuse.
 *   2. Mount it with <div data-eel-mount="KIND"></div> on education.html
 *      (optional data-eel-mode="compact"|"detail").
 *   3. Use pending:true + note for unpublished n/quotes/photos.
 *   4. Images only if both src and alt exist. Links only if href is a real page or file.
 *
 * Adding a downloadable resource: do not invent a file. Link it from the
 * Education toolkit table only when the file exists and is licensed; if the
 * resource is a teacher activity, add a CASES entry of kind "teacher".
 */
(function (root) {
  "use strict";

  var STEPS = [
    {
      id: "question",
      label: "Question",
      prompt: "What did we want to learn or teach?",
    },
    {
      id: "design",
      label: "Design",
      prompt: "How did we design the activity?",
    },
    {
      id: "engage",
      label: "Engage",
      prompt: "Who participated and how?",
    },
    {
      id: "evidence",
      label: "Evidence",
      prompt: "What did we observe / measure?",
    },
    {
      id: "learn",
      label: "Learn",
      prompt: "What did participants learn? What did WE learn?",
    },
    {
      id: "change",
      label: "Change",
      prompt: "What changed afterwards?",
    },
    {
      id: "reuse",
      label: "Reuse",
      prompt: "What can others take from this?",
    },
  ];

  var KIND_LABEL = {
    game: "Game",
    workshop: "Workshop",
    "learning-platform": "Learning Platform",
    teacher: "Teacher activity",
  };

  var STATUS_ATTR = {
    live: { attr: "in-progress", label: "Live on this wiki" },
    "in-development": { attr: "in-progress", label: "In development" },
    "in-preparation": { attr: "in-progress", label: "In preparation" },
    planned: { attr: "planned", label: "Planned" },
    unpublished: { attr: "planned", label: "No delivered event published" },
  };

  var TAG_LABEL = {
    dialogue: "Dialogue",
    measurement: "Measurement",
    iteration: "Iteration",
    "project-change": "Project change",
    "reusable-resource": "Reusable resource",
    limitation: "Limitation",
  };

  function tagIds(tags) {
    if (!tags || !tags.length) return [];
    return tags
      .map(function (tag) {
        return tag && TAG_LABEL[tag.id] ? tag.id : "";
      })
      .filter(Boolean);
  }

  function renderTags(tags) {
    var ids = tagIds(tags);
    if (!ids.length) return "";
    var items = tags
      .map(function (tag) {
        if (!tag || !TAG_LABEL[tag.id]) return "";
        var note = tag.note
          ? '<span class="edu-etag__note">' + escapeHtml(tag.note) + "</span>"
          : "";
        return (
          "<li><span class=\"edu-etag\" data-edu-tag=\"" +
          escapeHtml(tag.id) +
          '"><span class="edu-etag__kind">' +
          escapeHtml(TAG_LABEL[tag.id]) +
          "</span>" +
          note +
          "</span></li>"
        );
      })
      .join("");
    return '<ul class="edu-etags" aria-label="Evidence labels">' + items + "</ul>";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pending(note) {
    return (
      '<p><span class="placeholder-field">' +
      escapeHtml(note || "Not published") +
      "</span></p>"
    );
  }

  function para(text) {
    if (!text) return "";
    return "<p>" + escapeHtml(text) + "</p>";
  }

  function renderLinks(links) {
    if (!links || !links.length) return "";
    return (
      '<ul class="eel__links">' +
      links
        .map(function (link) {
          if (!link || !link.href || !link.label) return "";
          var extra = link.pending
            ? ' <span class="placeholder-field">In preparation</span>'
            : "";
          return (
            "<li><a href=\"" +
            escapeHtml(link.href) +
            '">' +
            escapeHtml(link.label) +
            "</a>" +
            extra +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function renderImages(images) {
    if (!images || !images.length) return "";
    return images
      .map(function (img) {
        if (!img || !img.src || !img.alt) return "";
        var cap = img.caption
          ? "<figcaption>" + escapeHtml(img.caption) + "</figcaption>"
          : "";
        return (
          '<figure class="eel__figure">' +
          '<img src="' +
          escapeHtml(img.src) +
          '" alt="' +
          escapeHtml(img.alt) +
          '" width="' +
          (img.width || 800) +
          '" height="' +
          (img.height || 500) +
          '">' +
          cap +
          "</figure>"
        );
      })
      .join("");
  }

  function renderQuant(rows) {
    if (!rows || !rows.length) return "";
    var body = rows
      .map(function (row) {
        var value;
        if (row.pending || row.value == null || row.value === "") {
          value = '<span class="placeholder-field">' + escapeHtml(row.note || "No published number") + "</span>";
        } else {
          value = escapeHtml(String(row.value)) + (row.unit ? " " + escapeHtml(row.unit) : "");
        }
        return (
          "<tr><th scope=\"row\">" +
          escapeHtml(row.label || "Measure") +
          "</th><td>" +
          value +
          "</td></tr>"
        );
      })
      .join("");
    return (
      '<div class="table-scroll" tabindex="0" role="region" aria-label="Quantitative evidence">' +
      '<table class="goal-table eel__table">' +
      "<caption>Quantitative evidence</caption>" +
      "<thead><tr><th scope=\"col\">Measure</th><th scope=\"col\">Value</th></tr></thead>" +
      "<tbody>" +
      body +
      "</tbody></table></div>"
    );
  }

  function renderQual(rows) {
    if (!rows || !rows.length) return "";
    return (
      '<ul class="eel__qual">' +
      rows
        .map(function (row) {
          if (!row) return "";
          if (row.pending) {
            return (
              "<li><span class=\"placeholder-field\">" +
              escapeHtml(row.note || "No qualitative note published") +
              "</span></li>"
            );
          }
          var src = row.source ? " <span class=\"eel__src\">(" + escapeHtml(row.source) + ")</span>" : "";
          return "<li>" + escapeHtml(row.text || "") + src + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function stepData(entry, id) {
    return (entry && entry.steps && entry.steps[id]) || {};
  }

  function compactLine(block) {
    if (!block) return "";
    if (block.pending) return block.note || "Not published";
    if (block.summary) return block.summary;
    if (block.text) return block.text;
    if (block.participants && block.participants.summary) return block.participants.summary;
    if (block.observe && block.observe.summary) return block.observe.summary;
    return "";
  }

  function renderStepBody(id, block, mode) {
    if (!block) return pending("Not published");
    if (mode === "compact") {
      if (block.pending) return pending(block.note);
      var line = compactLine(block);
      return line ? para(line) : pending("Not published");
    }

    var html = "";
    if (block.pending && !block.text && !block.observe) {
      html += pending(block.note);
    }
    if (block.text) html += para(block.text);
    if (id === "learn") {
      html += '<p class="eel__split-kicker">What did participants learn?</p>';
      if (block.participants && block.participants.pending) {
        html += pending(block.participants.note || "No participant learning result published");
      } else if (block.participants && (block.participants.text || block.participants.summary)) {
        html += para(block.participants.text || block.participants.summary);
      } else {
        html += pending("No participant learning result published");
      }
      html += '<p class="eel__split-kicker">What did we learn?</p>';
      if (block.team && block.team.pending) {
        html += pending(block.team.note || "No team learning note published");
      } else if (block.team && (block.team.text || block.team.summary)) {
        html += para(block.team.text || block.team.summary);
      } else {
        html += pending("No team learning note published");
      }
    }
    if (id === "evidence") {
      if (block.observe) {
        html += block.observe.pending
          ? pending(block.observe.note)
          : para(block.observe.text || block.observe.summary);
      }
      html += renderQuant(block.quantitative);
      html += renderQual(block.qualitative);
    }
    html += renderImages(block.images);
    html += renderLinks(block.links);
    if (!html) html = pending("Not published");
    return html;
  }

  function renderFlow(entry, mode) {
    var parts = [];
    STEPS.forEach(function (meta, i) {
      var block = stepData(entry, meta.id);
      var nextMark = "";
      if (i < STEPS.length - 1) {
        nextMark =
          '<span class="eel__next" aria-hidden="true">' +
          '<span class="eel__next-h">→</span>' +
          '<span class="eel__next-v">↓</span>' +
          "</span>";
      }
      parts.push(
        '<li class="eel__step" data-eel-step="' +
          meta.id +
          '">' +
          '<div class="eel__card">' +
          '<p class="eel__kicker">' +
          escapeHtml(meta.label) +
          "</p>" +
          '<h4 class="eel__prompt">' +
          escapeHtml(meta.prompt) +
          "</h4>" +
          '<div class="eel__body">' +
          renderStepBody(meta.id, block, mode) +
          "</div></div>" +
          nextMark +
          "</li>"
      );
    });
    return '<ol class="eel__flow">' + parts.join("") + "</ol>";
  }

  function render(entry, mode) {
    var view = mode || entry.mode || "detail";
    if (view !== "compact") view = "detail";
    var status = STATUS_ATTR[entry.status] || STATUS_ATTR.planned;
    var kind = KIND_LABEL[entry.kind] || "Activity";
    var ids = tagIds(entry.tags);
    return (
      '<article class="eel eel--' +
      view +
      ' edu-emark" id="' +
      escapeHtml(entry.id) +
      '" data-eel-id="' +
      escapeHtml(entry.id) +
      '" data-eel-mode="' +
      view +
      '"' +
      (ids.length ? ' data-edu-tags="' + escapeHtml(ids.join(" ")) + '"' : "") +
      ">" +
      '<header class="eel__head">' +
      '<p class="eel__kind">' +
      escapeHtml(kind) +
      "</p>" +
      "<h3>" +
      escapeHtml(entry.title) +
      "</h3>" +
      renderTags(entry.tags) +
      '<div class="evidence-status" data-status="' +
      status.attr +
      '"><span class="evidence-status__label">Status</span><span class="evidence-status__value">' +
      escapeHtml(status.label) +
      "</span></div>" +
      '<div class="eel__switch" role="group" aria-label="Evidence loop layout">' +
      '<button type="button" class="eel__switch-btn" data-eel-view="compact" aria-pressed="' +
      (view === "compact" ? "true" : "false") +
      '">Compact timeline</button>' +
      '<button type="button" class="eel__switch-btn" data-eel-view="detail" aria-pressed="' +
      (view === "detail" ? "true" : "false") +
      '">Detailed case study</button>' +
      "</div></header>" +
      (entry.lede ? para(entry.lede) : "") +
      renderFlow(entry, view) +
      "</article>"
    );
  }

  var CASES = [
    {
      id: "eel-lab",
      kind: "learning-platform",
      title: "AeroSense Learning Lab",
      status: "live",
      mode: "detail",
      tags: [
        { id: "measurement", note: "pre/post assessment" },
        { id: "iteration", note: "personal dashboard and QC desk" },
        { id: "project-change", note: "screening is not a verdict" },
        { id: "reusable-resource", note: "Learning Lab and item IDs" },
        { id: "limitation", note: "no published cohort" },
      ],
      lede: "Five wiki modules with the same pre/post concepts. This is the only education channel live on this wiki.",
      steps: {
        question: {
          summary: "Can a visitor question a sensing claim, not only hear it?",
          text: "Teach combinatorial odor coding, mycotoxin misconceptions, a living sensor chain, pattern decoding, and why a screening band is not a verdict.",
        },
        design: {
          summary: "Five open modules, same-item pre/post, local progress.",
          text: "Any order. Illustrative simulations labeled as such. Stable ITEM_BANK IDs so a future survey or game can reuse the same questions. No login.",
          links: [{ href: "learning-platform.html", label: "Open the Learning Lab" }],
        },
        engage: {
          pending: true,
          note: "No identified cohort. Anyone who opens the wiki can use it; we do not know who did.",
          summary: "Unidentified wiki visitors; no published sample.",
        },
        evidence: {
          summary: "Instrument exists. No published cohort table.",
          observe: {
            text: "Each module stores pre/post answers in this browser only. That is not a study dataset.",
          },
          quantitative: [
            {
              label: "Published knowledge gain (cohort)",
              pending: true,
              note: "None published",
            },
          ],
          qualitative: [
            {
              pending: true,
              note: "No consented visitor comments published",
            },
          ],
        },
        learn: {
          summary: "No participant learning result published.",
          participants: {
            pending: true,
            note: "No published participant learning result",
          },
          team: {
            text: "Local scores must not be printed as class averages. Screening language needs a next-action, not a certificate.",
          },
        },
        change: {
          summary: "Personal dashboard; Module 5 boundaries card.",
          text: "Added a personal dashboard that reads only this browser, and a QC desk that treats screening as a next action.",
          links: [
            { href: "learning-platform/progress.html", label: "Personal dashboard" },
            { href: "learning-05-act.html", label: "Module 5 · a signal is not a verdict" },
          ],
        },
        reuse: {
          summary: "Live wiki curriculum and item-ID schema.",
          text: "Future teams can copy the five-module shell, ITEM_BANK IDs, and the local store shape. A downloadable teacher packet is not released.",
          links: [
            { href: "learning-platform.html", label: "Learning Lab" },
            { href: "js/learning-data.js", label: "Question bank (ITEM_BANK)" },
            { href: "js/learning-storage.js", label: "Local analysis schema" },
          ],
        },
      },
    },
    {
      id: "eel-game-pattern",
      kind: "game",
      title: "Pattern Recognition",
      status: "in-development",
      mode: "detail",
      tags: [
        { id: "iteration", note: "moved into Module 1" },
        { id: "limitation", note: "no playtest sample published" },
      ],
      lede: "Odor Pixel Suite · not hosted on this wiki. Teaching idea later moved into Module 1.",
      steps: {
        question: {
          summary: "Stop reading one loud channel as an odor name.",
          text: "People treat one loud sensor channel as an odor name. We needed a way to force a whole-row read.",
        },
        design: {
          summary: "Illustrative multi-channel “LED scent code.”",
          text: "Players match a mystery row to a labeled pattern. Illustrative virtual-receptor model — not experimental data.",
        },
        engage: {
          pending: true,
          note: "No playtest sample published",
          summary: "No playtest sample published.",
        },
        evidence: {
          summary: "Wiki interaction exists. No cohort playtest.",
          observe: { pending: true, note: "No observation log published" },
          quantitative: [{ label: "Playtest n", pending: true, note: "No published number" }],
          qualitative: [{ pending: true, note: "No player quotes published" }],
        },
        learn: {
          summary: "Teaching point is portable; unevaluated as a playtest.",
          participants: { pending: true, note: "No participant learning result published" },
          team: {
            text: "Identification from a combination, not a spike, can live on the wiki without hosting the full suite.",
          },
        },
        change: {
          summary: "Moved into Learning Lab module 1.",
          text: "The same idea is now a wiki interaction (mystery pattern + odor fingerprint), with simulation labels.",
          links: [{ href: "learning-01-smell.html", label: "Module 1 · How do we smell?" }],
        },
        reuse: {
          summary: "Game file not hosted.",
          pending: true,
          note: "In preparation — not a wiki download",
        },
      },
    },
    {
      id: "eel-game-path",
      kind: "game",
      title: "Identity & Path Deduction",
      status: "in-development",
      mode: "detail",
      tags: [{ id: "limitation", note: "not evaluated on this wiki" }],
      lede: "Odor Pixel Suite · not hosted. Sequential deduction under incomplete information.",
      steps: {
        question: {
          summary: "Incomplete information is normal in sensing.",
          text: "A finished label is not the default. Learners should combine clues along a path instead of demanding a name too early.",
        },
        design: {
          summary: "Fictional gate labyrinth.",
          text: "Players gather identity clues along a path to name a “phantom.” Teaching point: sequential deduction under incomplete information.",
        },
        engage: {
          pending: true,
          note: "No playtest sample published",
          summary: "No playtest sample published.",
        },
        evidence: {
          summary: "Description only. Not hosted.",
          observe: { pending: true, note: "No observation log published" },
          quantitative: [{ label: "Playtest n", pending: true, note: "No published number" }],
          qualitative: [{ pending: true, note: "No player quotes published" }],
        },
        learn: {
          summary: "Different skill from pattern matching; not evaluated here.",
          participants: { pending: true, note: "No participant learning result published" },
          team: {
            text: "Sequential deduction is a different skill from pattern matching. It has not been evaluated on this wiki.",
          },
        },
        change: {
          summary: "Not folded into a Learning Lab module.",
          text: "No false “version 2 released” claim. The activity remains a local prototype.",
        },
        reuse: {
          pending: true,
          note: "In preparation",
          summary: "In preparation.",
        },
      },
    },
    {
      id: "eel-game-mixture",
      kind: "game",
      title: "Mixture Inference",
      status: "in-development",
      mode: "detail",
      tags: [
        { id: "iteration", note: "Module 4 reports no accuracy percentage" },
        { id: "project-change", note: "communication change, not a playtest result" },
        { id: "limitation", note: "no playtest sample published" },
      ],
      lede: "Odor Pixel Suite · not hosted. Mixture cartoons are easy to over-claim.",
      steps: {
        question: {
          summary: "Mixtures are not always linear sums.",
          text: "Game outputs must not be read as concentrations or affinities.",
        },
        design: {
          summary: "12-channel illustrative mixture.",
          text: "Players infer simplified sources/ratios from an illustrative mixture signal.",
        },
        engage: {
          pending: true,
          note: "No playtest sample published",
          summary: "No playtest sample published.",
        },
        evidence: {
          summary: "Wiki labeling practice. No hosted game file.",
          observe: { pending: true, note: "No observation log published" },
          quantitative: [{ label: "Playtest n", pending: true, note: "No published number" }],
          qualitative: [{ pending: true, note: "No player quotes published" }],
        },
        learn: {
          summary: "Cartoons over-claim easily.",
          participants: { pending: true, note: "No participant learning result published" },
          team: {
            text: "Mixture cartoons are easy to over-claim. Later modules refuse fake concentrations and fake accuracy.",
          },
        },
        change: {
          summary: "Module 4 reports no accuracy percentage.",
          text: "An educational classifier with no accuracy percentage. That is a communication change, not a playtest result.",
          links: [{ href: "learning-04-decode.html", label: "Module 4 · An odor is a pattern" }],
        },
        reuse: {
          pending: true,
          note: "In preparation",
          summary: "In preparation.",
        },
      },
    },
    {
      id: "eel-workshop",
      kind: "workshop",
      title: "Face-to-face workshop (template)",
      status: "unpublished",
      mode: "compact",
      tags: [
        { id: "dialogue", note: "no participant discussion published" },
        { id: "limitation", note: "no delivered event published" },
      ],
      lede: "No verified workshop is published. The loop is here so the next event cannot skip evidence.",
      steps: {
        question: { pending: true, note: "No published teaching goal for a delivered workshop", summary: "Not published." },
        design: { pending: true, note: "No facilitator plan published", summary: "Not published." },
        engage: { pending: true, note: "No audience, partner, or attendance record", summary: "Not published." },
        evidence: {
          pending: true,
          note: "No observation or instrument published",
          summary: "Not published.",
          quantitative: [{ label: "Attendance", pending: true, note: "No published number" }],
        },
        learn: {
          summary: "Not published.",
          participants: { pending: true, note: "No participant result published" },
          team: { pending: true, note: "No team workshop note published" },
        },
        change: { pending: true, note: "No post-workshop change log", summary: "Not published." },
        reuse: { pending: true, note: "No workshop packet", summary: "Not published." },
      },
    },
    {
      id: "eel-teacher",
      kind: "teacher",
      title: "Facilitator packet",
      status: "in-preparation",
      mode: "compact",
      tags: [
        { id: "reusable-resource", note: "teacher toolkit" },
        { id: "limitation", note: "packet not released" },
      ],
      lede: "A classroom packet is intended. It is not a download until the file exists, opens, and is licensed.",
      steps: {
        question: {
          summary: "Let a facilitator run one activity without inventing performance numbers.",
          text: "A teacher or iGEM team should be able to run one activity from a guide without treating planned AeroSense performance as measured fact.",
        },
        design: {
          summary: "Guide, slides/worksheets, answer key, license — not released.",
          text: "Planned packet: facilitator notes, source list, accessibility check, and a license statement. See pkg-education.",
          links: [{ href: "contribution.html#pkg-education", label: "Contribution · pkg-education" }],
        },
        engage: {
          pending: true,
          note: "No classroom dry-run published",
          summary: "No classroom dry-run published.",
        },
        evidence: {
          summary: "No classroom evaluation published.",
          observe: { pending: true, note: "No classroom observation published" },
          quantitative: [{ label: "Classroom n", pending: true, note: "No published number" }],
        },
        learn: {
          summary: "Not published.",
          participants: { pending: true, note: "No teacher or student result published" },
          team: {
            text: "Wiki scaffolding is not a finished toolkit. Software illustrations are not Education evidence until objectives, delivery, and evaluation exist.",
          },
        },
        change: {
          pending: true,
          note: "Packet not released, so no version log",
          summary: "No released version to change.",
        },
        reuse: {
          summary: "In preparation. Learning Lab can be used now.",
          text: "Until the packet exists, reuse the live Learning Lab and ITEM_BANK. Do not treat a missing PDF as a hidden download.",
          links: [
            { href: "learning-platform.html", label: "Learning Lab" },
            { href: "js/learning-data.js", label: "Question bank" },
          ],
        },
      },
    },
  ];

  function casesFor(kind) {
    return CASES.filter(function (entry) {
      return entry.kind === kind;
    });
  }

  function bind(article, entry) {
    var buttons = article.querySelectorAll("[data-eel-view]");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-eel-view") === "compact" ? "compact" : "detail";
        var wrap = document.createElement("div");
        wrap.innerHTML = render(entry, next);
        var fresh = wrap.firstChild;
        article.replaceWith(fresh);
        bind(fresh, entry);
        var keep = fresh.querySelector('[data-eel-view="' + next + '"]');
        if (keep) keep.focus();
      });
    });
  }

  function mountKind(kind, host) {
    if (!host) return;
    var modeOverride = host.getAttribute("data-eel-mode");
    host.innerHTML = casesFor(kind)
      .map(function (entry) {
        return render(entry, modeOverride || entry.mode);
      })
      .join("");
    CASES.forEach(function (entry) {
      if (entry.kind !== kind) return;
      var article = host.querySelector('[data-eel-id="' + entry.id + '"]');
      if (article) bind(article, entry);
    });
  }

  function mountAll(root) {
    var ctx = root || document;
    mountKind("learning-platform", ctx.querySelector('[data-eel-mount="learning-platform"]'));
    mountKind("game", ctx.querySelector('[data-eel-mount="game"]'));
    mountKind("workshop", ctx.querySelector('[data-eel-mount="workshop"]'));
    mountKind("teacher", ctx.querySelector('[data-eel-mount="teacher"]'));
  }

  root.AerosenseEducation = root.AerosenseEducation || {};
  root.AerosenseEducation.EvidenceLoop = {
    STEPS: STEPS,
    CASES: CASES,
    render: render,
    mountAll: mountAll,
    mountKind: mountKind,
  };

  document.addEventListener("DOMContentLoaded", function () {
    mountAll(document);
  });
})(window);
