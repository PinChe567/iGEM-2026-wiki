/**
 * AeroSense Learning Lab — reusable module renderer, quiz, and interaction shell.
 */
(function () {
  "use strict";

  var STAGES = [
    { id: "pre", label: "Pre-test" },
    { id: "learn", label: "Explore" },
    { id: "interact", label: "Interact" },
    { id: "post", label: "Post-test" },
    { id: "reflect", label: "Reflect" },
  ];

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shuffle(list) {
    var copy = list.slice();
    var i;
    var j;
    var tmp;
    for (i = copy.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1));
      tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function formatTeach(n) {
    return (Math.round(clamp01(n) * 100) / 100).toFixed(2);
  }

  function applyNoise(values, noiseAmp, noiseVec) {
    return values.map(function (v, i) {
      var n = noiseVec && noiseVec[i] != null ? noiseVec[i] : 0;
      return clamp01(v + noiseAmp * n);
    });
  }

  function contrastEnhance(values) {
    var sum = 0;
    var i;
    for (i = 0; i < values.length; i += 1) sum += values[i];
    var mean = values.length ? sum / values.length : 0;
    return values.map(function (v) {
      return clamp01((v - 0.55 * mean) * 1.4);
    });
  }

  function sparseCode(values) {
    var contrasted = contrastEnhance(values);
    var ranked = contrasted.map(function (v, i) {
      return { v: v, i: i };
    });
    ranked.sort(function (a, b) {
      return b.v - a.v;
    });
    var out = contrasted.map(function () {
      return 0;
    });
    var kept = 0;
    ranked.forEach(function (item) {
      if (kept < 2 && item.v > 0.12) {
        out[item.i] = item.v;
        kept += 1;
      }
    });
    return out;
  }

  function transformVector(values, mode) {
    if (mode === "contrast") return contrastEnhance(values);
    if (mode === "sparse") return sparseCode(values);
    return values.slice();
  }

  function vecDist(a, b) {
    var s = 0;
    var i;
    var n = Math.min(a.length, b.length);
    for (i = 0; i < n; i += 1) {
      var d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  function teachingClass(vec, refA, refB) {
    var dA = vecDist(vec, refA);
    var dB = vecDist(vec, refB);
    var sum = dA + dB;
    if (sum < 0.0001) return "ambiguous";
    var rel = Math.abs(dA - dB) / sum;
    if (rel < 0.12) return "ambiguous";
    return dA < dB ? "a-like" : "b-like";
  }

  function scoreAnswers(quiz, answers) {
    if (!quiz || !quiz.length) return null;
    var correct = 0;
    quiz.forEach(function (item) {
      if (answers && answers[item.id] === item.correctAnswer) correct += 1;
    });
    return Math.round((correct / quiz.length) * 100);
  }

  function visualSvg(kind) {
    if (kind === "receptors") {
      return (
        '<svg class="lm-visual" viewBox="0 0 360 120" role="img" aria-label="Five receptor cells, three of them active for one odor.">' +
        '<text x="8" y="18" fill="#555" font-size="11" font-family="ui-monospace, monospace">ILLUSTRATIVE</text>' +
        '<rect x="20" y="40" width="44" height="56" fill="none" stroke="#0a0a0a"/>' +
        '<rect x="84" y="40" width="44" height="56" fill="#f5f5f1" stroke="#0a0a0a"/>' +
        '<rect x="148" y="40" width="44" height="56" fill="none" stroke="#0b6b35" stroke-width="2"/>' +
        '<rect x="212" y="40" width="44" height="56" fill="#f5f5f1" stroke="#0a0a0a"/>' +
        '<rect x="276" y="40" width="44" height="56" fill="none" stroke="#0b6b35" stroke-width="2"/>' +
        "</svg>"
      );
    }
    if (kind === "combo") {
      return (
        '<svg class="lm-visual" viewBox="0 0 360 140" role="img" aria-label="Two odor patterns sharing one receptor channel.">' +
        '<text x="8" y="16" fill="#555" font-size="11" font-family="ui-monospace, monospace">ODOR A</text>' +
        '<rect x="20" y="28" width="28" height="18" fill="#0b6b35"/><rect x="56" y="28" width="28" height="18" fill="#d8d8d2"/><rect x="92" y="28" width="28" height="18" fill="#0b6b35"/><rect x="128" y="28" width="28" height="18" fill="#d8d8d2"/><rect x="164" y="28" width="28" height="18" fill="#0b6b35"/>' +
        '<text x="8" y="78" fill="#555" font-size="11" font-family="ui-monospace, monospace">ODOR B</text>' +
        '<rect x="20" y="90" width="28" height="18" fill="#d8d8d2"/><rect x="56" y="90" width="28" height="18" fill="#0b6b35"/><rect x="92" y="90" width="28" height="18" fill="#0b6b35"/><rect x="128" y="90" width="28" height="18" fill="#0b6b35"/><rect x="164" y="90" width="28" height="18" fill="#d8d8d2"/>' +
        '<text x="210" y="70" fill="#0a0a0a" font-size="12" font-family="Georgia, serif">Shared channel →</text>' +
        "</svg>"
      );
    }
    if (kind === "fly") {
      return (
        '<svg class="lm-visual" viewBox="0 0 360 100" role="img" aria-label="Antenna receptors feeding a pattern into a simple circuit.">' +
        '<ellipse cx="48" cy="50" rx="22" ry="28" fill="none" stroke="#0a0a0a"/>' +
        '<path d="M70 50 H130" stroke="#1fd36a" stroke-width="2"/>' +
        '<rect x="130" y="28" width="70" height="44" fill="none" stroke="#0a0a0a"/>' +
        '<text x="140" y="54" font-size="11" font-family="ui-monospace, monospace">PATTERN</text>' +
        '<path d="M200 50 H250" stroke="#0a0a0a"/>' +
        '<rect x="250" y="28" width="88" height="44" fill="#f5f5f1" stroke="#0a0a0a"/>' +
        '<text x="258" y="54" font-size="11" font-family="ui-monospace, monospace">NOT A NAME</text>' +
        "</svg>"
      );
    }
    if (kind === "food") {
      return (
        '<svg class="lm-visual" viewBox="0 0 360 100" role="img" aria-label="Air pattern arriving before visible spoilage.">' +
        '<rect x="24" y="30" width="90" height="48" fill="none" stroke="#0a0a0a"/>' +
        '<text x="36" y="58" font-size="11" font-family="Georgia, serif">Stored food</text>' +
        '<circle cx="160" cy="40" r="4" fill="#1fd36a"/><circle cx="176" cy="58" r="3" fill="#0b6b35"/><circle cx="148" cy="64" r="3" fill="#1fd36a"/>' +
        '<text x="200" y="44" font-size="12" font-family="Georgia, serif">Odor pattern</text>' +
        '<text x="200" y="64" font-size="11" font-family="ui-monospace, monospace">before visible mold</text>' +
        "</svg>"
      );
    }
    return (
      '<div class="lm-visual lm-visual--empty" role="img" aria-label="Visual placeholder for this lesson block.">Visual placeholder</div>'
    );
  }

  function renderIdeaCard(text) {
    if (!text) return "";
    return (
      '<p class="lm-idea" role="note"><span class="lm-idea__kicker">Key idea</span><strong>' +
      escapeHtml(text) +
      "</strong></p>"
    );
  }

  function renderMoleculeDrift() {
    var moles = [
      { cls: "hex", delay: "0s", y: "16%", dur: "11s" },
      { cls: "dot", delay: "1.3s", y: "40%", dur: "9s" },
      { cls: "dia", delay: "2.6s", y: "62%", dur: "12s" },
      { cls: "hex", delay: "4s", y: "26%", dur: "10s" },
      { cls: "dot", delay: "5.4s", y: "50%", dur: "13s" },
      { cls: "dia", delay: "6.8s", y: "72%", dur: "9.5s" },
      { cls: "hex", delay: "8.1s", y: "34%", dur: "11.5s" },
    ];
    var moleHtml = moles
      .map(function (m, i) {
        return (
          '<span class="lm-drift__mole lm-drift__mole--' +
          m.cls +
          '" style="--delay:' +
          m.delay +
          ";--y:" +
          m.y +
          ";--dur:" +
          m.dur +
          ";--rest:" +
          (10 + i * 9) +
          '%"></span>'
        );
      })
      .join("");
    return (
      '<div class="lm-drift" role="img" aria-label="Generic airborne molecules drift toward stylized receptor pockets. Animation pauses if reduced motion is requested.">' +
      '<p class="lm-sim-label">Conceptual sketch — generic airborne molecules, not a named VOC panel</p>' +
      '<div class="lm-drift__stage" aria-hidden="true">' +
      '<div class="lm-drift__moles">' +
      moleHtml +
      "</div>" +
      '<svg class="lm-drift__receptors" viewBox="0 0 140 120" focusable="false">' +
      '<text x="18" y="14" fill="#555" font-size="9" font-family="ui-monospace, monospace">RECEPTORS</text>' +
      '<path d="M48 26 C22 26 22 58 48 58 H66 M48 26 H66" fill="none" stroke="#0a0a0a" stroke-width="1.75"/>' +
      '<path d="M48 64 C22 64 22 96 48 96 H66 M48 64 H66" fill="none" stroke="#0b6b35" stroke-width="1.75"/>' +
      '<rect x="92" y="34" width="28" height="18" fill="none" stroke="#0a0a0a"/>' +
      '<rect x="92" y="72" width="28" height="18" fill="none" stroke="#0b6b35"/>' +
      "</svg></div>" +
      '<p class="visually-hidden">Several generic molecules move through air toward receptor shapes. This is a teaching animation, not experimental AeroSense data.</p>' +
      "</div>"
    );
  }

  function renderReceptorMatrix(mod) {
    var teach = mod.teaching || {};
    var receptors = teach.receptors || ["R1", "R2", "R3", "R4", "R5", "R6"];
    var odors = teach.odors || [];
    var head = odors
      .map(function (odor) {
        return (
          '<th scope="col"><button type="button" class="lm-matrix__pick" data-matrix-odor="' +
          escapeHtml(odor.id) +
          '">' +
          escapeHtml(odor.name) +
          "</button></th>"
        );
      })
      .join("");
    var rows = receptors
      .map(function (name, r) {
        var cells = odors
          .map(function (odor) {
            var v = odor.values[r];
            var pct = Math.round(clamp01(v) * 100);
            return (
              '<td><button type="button" class="lm-matrix__cell" data-matrix-odor="' +
              escapeHtml(odor.id) +
              '" style="--fill:' +
              pct +
              '" aria-label="' +
              escapeHtml(name + " · " + odor.name + " · teaching value " + formatTeach(v)) +
              '"><span>' +
              formatTeach(v) +
              "</span></button></td>"
            );
          })
          .join("");
        return '<tr><th scope="row">' + escapeHtml(name) + "</th>" + cells + "</tr>";
      })
      .join("");
    var bars = receptors
      .map(function (name, i) {
        return (
          '<div class="lm-chan">' +
          '<span class="lm-chan__lab">' +
          escapeHtml(name) +
          '</span><span class="lm-chan__track"><span class="lm-chan__fill" data-matrix-fill="' +
          i +
          '"></span></span>' +
          '<span class="lm-chan__val" data-matrix-val="' +
          i +
          '"></span></div>'
        );
      })
      .join("");
    return (
      '<div class="lm-matrix" data-receptor-matrix>' +
      '<p class="lm-sim-label">' +
      escapeHtml(teach.label || "Illustrative simulation") +
      "</p>" +
      '<p class="lm-matrix__scale">' +
      escapeHtml(teach.scale || "") +
      "</p>" +
      '<div class="lm-matrix__table-wrap"><table class="lm-matrix__table">' +
      '<caption class="visually-hidden">Illustrative receptor-response matrix for three fictional odors</caption>' +
      '<thead><tr><th scope="col">Receptor</th>' +
      head +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>" +
      '<p class="lm-matrix__selected" data-matrix-selected>Selected: Odor A</p>' +
      '<div class="lm-matrix__bars" data-matrix-bars>' +
      bars +
      "</div></div>"
    );
  }

  function renderMethodStrip(block) {
    var steps =
      (block && block.steps && block.steps.length
        ? block.steps
        : ["Myth", "Your guess", "Evidence", "Verdict", "What should you do?"]);
    return (
      '<ol class="lm-method" aria-label="Sequence">' +
      steps
        .map(function (step) {
          return "<li>" + escapeHtml(step) + "</li>";
        })
        .join("") +
      "</ol>"
    );
  }

  function renderMythCase(block) {
    var guesses = [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
      { id: "depends", label: "It depends" },
    ];
    var guessHtml = guesses
      .map(function (g) {
        return (
          '<label class="lm-chip"><input type="radio" name="guess-' +
          escapeHtml(block.itemId) +
          '" value="' +
          g.id +
          '"><span>' +
          escapeHtml(g.label) +
          "</span></label>"
        );
      })
      .join("");
    var evidence = (block.evidence || [])
      .map(function (p) {
        return "<p>" + escapeHtml(p) + "</p>";
      })
      .join("");
    return (
      '<div class="lm-case" data-myth-case data-item-id="' +
      escapeHtml(block.itemId || "") +
      '" data-item-source="learning-platform">' +
      '<blockquote class="lm-case__myth"><p>' +
      escapeHtml(block.myth) +
      "</p></blockquote>" +
      '<form class="lm-case__guess">' +
      "<fieldset><legend>" +
      escapeHtml(block.guessPrompt || "Your guess") +
      '</legend><div class="lm-chip-row">' +
      guessHtml +
      "</div></fieldset></form>" +
      '<div class="lm-case__after" data-myth-after hidden>' +
      '<section class="lm-case__step"><h4>Evidence</h4>' +
      evidence +
      "</section>" +
      '<section class="lm-case__step"><h4>Verdict</h4><p>' +
      escapeHtml(block.verdict || "") +
      "</p></section>" +
      '<section class="lm-case__step"><h4>What should you do?</h4><p>' +
      escapeHtml(block.action || "") +
      "</p></section></div>" +
      '<p class="lm-case__live" data-myth-live aria-live="polite"></p></div>'
    );
  }

  function renderClaimPaths() {
    return (
      '<div class="lm-split" role="group" aria-label="Two measurement paths that must stay separate">' +
      '<p class="lm-split__banner">AeroSense is being developed as an early fungal-risk screening tool. It is not a legal food-safety certification tool and does not directly quantify mycotoxin concentration.</p>' +
      '<div class="lm-split__cols">' +
      '<div class="lm-split__col">' +
      "<h4>Odor-pattern screening</h4>" +
      '<ol class="lm-split__path">' +
      "<li>Mold growth</li>" +
      "<li>Metabolism changes</li>" +
      "<li>VOC profile may change</li>" +
      "<li>AeroSense screens odor-pattern changes</li>" +
      "</ol></div>" +
      '<div class="lm-split__col lm-split__col--separate">' +
      '<p class="lm-split__kicker">Separate path</p>' +
      "<h4>Confirmatory chemistry</h4>" +
      '<ol class="lm-split__path">' +
      "<li>Mycotoxin</li>" +
      "<li>Requires appropriate confirmatory testing</li>" +
      "</ol>" +
      "<p>This path is a different measurement. An odor screen does not stand in for it.</p>" +
      "</div></div></div>"
    );
  }

  function renderFoodInvestigate(mod) {
    var spec = mod.interaction || {};
    var exhibits = spec.exhibits || [];
    var options = spec.options || [];
    var exhibitBtns = exhibits
      .map(function (ex, i) {
        return (
          '<button type="button" class="lm-file__tab" data-exhibit="' +
          escapeHtml(ex.id) +
          '" aria-pressed="' +
          (i === 0 ? "true" : "false") +
          '" aria-controls="lm-file-detail">' +
          escapeHtml(ex.label) +
          "</button>"
        );
      })
      .join("");
    var optionHtml = options
      .map(function (opt) {
        return (
          '<label class="lm-choice"><input type="radio" name="lm-file-verdict" value="' +
          escapeHtml(opt.id) +
          '"><span>' +
          escapeHtml(opt.label) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<div class="lm-file" data-food-investigate>' +
      '<p class="lm-sim-label">' +
      escapeHtml(spec.disclaimer || "") +
      "</p>" +
      '<p class="lm-file__setting"><strong>' +
      escapeHtml((spec.scenario && spec.scenario.name) || "Teaching file") +
      "</strong> " +
      escapeHtml((spec.scenario && spec.scenario.setting) || "") +
      "</p>" +
      '<div class="lm-file__layout">' +
      '<div class="lm-file__exhibits" role="group" aria-label="Inspection exhibits">' +
      exhibitBtns +
      "</div>" +
      '<div class="lm-file__detail" id="lm-file-detail" data-file-detail tabindex="-1"></div></div>' +
      '<form class="lm-file__form" data-file-form>' +
      "<fieldset><legend>" +
      escapeHtml(spec.prompt || "What would you conclude?") +
      "</legend>" +
      optionHtml +
      '</fieldset>' +
      '<button class="btn btn--primary" type="submit">Record conclusion</button>' +
      '<p class="lm-file__error" data-file-error aria-live="polite"></p></form>' +
      '<div class="lm-file__reveal" data-file-reveal hidden>' +
      '<p class="lm-file__live" data-file-live></p>' +
      '<p class="lm-file__caption" data-file-caption></p>' +
      renderClaimPaths() +
      "</div></div>"
    );
  }

  function renderSensorBench(mod) {
    var spec = mod.interaction || {};
    var parts = spec.parts || [];
    var zones = spec.zones || [];
    var partBtns = parts
      .map(function (part) {
        return (
          '<button type="button" class="lm-part" draggable="true" data-part="' +
          escapeHtml(part.id) +
          '" aria-pressed="false" title="' +
          escapeHtml(part.role) +
          '">' +
          escapeHtml(part.label) +
          "</button>"
        );
      })
      .join("");
    var zoneHtml = zones
      .map(function (zone) {
        return (
          '<div class="lm-zone" data-zone="' +
          escapeHtml(zone.id) +
          '">' +
          "<h3>" +
          escapeHtml(zone.label) +
          '</h3><p class="lm-zone__hint">' +
          escapeHtml(zone.hint || "") +
          '</p>' +
          '<button type="button" class="lm-zone__hit" data-zone-hit="' +
          escapeHtml(zone.id) +
          '" aria-label="Place selected part in ' +
          escapeHtml(zone.label) +
          '">Drop or tap to place</button>' +
          '<div class="lm-zone__slots" data-zone-slots="' +
          escapeHtml(zone.id) +
          '"></div></div>'
        );
      })
      .join("");
    return (
      '<div class="lm-bench" data-sensor-bench>' +
      '<p class="lm-sim-label">' +
      escapeHtml(spec.disclaimer || "") +
      "</p>" +
      '<p class="lm-bench__task">Build the minimum biological sensing chain.</p>' +
      '<div class="lm-bench__tray" data-bench-tray aria-label="Component tray">' +
      partBtns +
      "</div>" +
      '<div class="lm-bench__zones">' +
      zoneHtml +
      "</div>" +
      '<p class="lm-bench__live" data-bench-live aria-live="polite">Tap a part, then tap a zone. You can also drag with a pointer.</p>' +
      '<div class="lm-fail" data-fail-panel hidden>' +
      "<h3>Failure modes</h3>" +
      "<p>The chain is in place. Remove one required piece and watch the conceptual consequence.</p>" +
      '<div class="lm-chip-row">' +
      '<label class="lm-chip"><input type="checkbox" data-fail="or"><span>Remove OR</span></label>' +
      '<label class="lm-chip"><input type="checkbox" data-fail="orco"><span>Remove Orco</span></label>' +
      '<label class="lm-chip"><input type="checkbox" data-fail="gcamp"><span>Remove GCaMP</span></label>' +
      "</div>" +
      '<p class="lm-fail__note" data-fail-note></p></div>' +
      '<div class="lm-trace" data-signal-sim>' +
      "<h3>Signal simulator</h3>" +
      '<p class="lm-sim-label">Illustrative response, not experimental data.</p>' +
      '<label class="lm-noise" for="lm-stimulus">Stimulus</label>' +
      '<input id="lm-stimulus" type="range" min="0" max="100" value="55" step="1">' +
      '<p class="lm-noise__val">Level <span data-stim-label>55</span></p>' +
      '<svg class="lm-trace__svg" viewBox="0 0 360 120" role="img" aria-label="Conceptual fluorescence trace with baseline, stimulus, and response.">' +
      '<text x="8" y="14" fill="#555" font-size="10" font-family="ui-monospace, monospace">BASELINE</text>' +
      '<text x="148" y="14" fill="#555" font-size="10" font-family="ui-monospace, monospace">STIMULUS</text>' +
      '<text x="268" y="14" fill="#555" font-size="10" font-family="ui-monospace, monospace">RESPONSE</text>' +
      '<line x1="20" y1="100" x2="340" y2="100" stroke="#d8d8d2"/>' +
      '<path data-trace-path fill="none" stroke="#0b6b35" stroke-width="2" d="M20 88 H340"/>' +
      "</svg></div>" +
      renderContainment() +
      "</div>"
    );
  }

  function renderContainment() {
    return (
      '<div class="lm-contain" data-containment>' +
      "<h3>Containment</h3>" +
      '<p class="lm-sim-label">Conceptual cartridge sketch — not a validated enclosure</p>' +
      '<p>Tap a layer. Engineered living cells stay inside a barrier. Food, environment, and the user stay outside.</p>' +
      '<div class="lm-contain__cross" role="group" aria-label="Containment cross-section">' +
      '<button type="button" class="lm-contain__layer lm-contain__layer--out" data-layer="out" aria-pressed="false">Outside · food / environment / user</button>' +
      '<button type="button" class="lm-contain__layer lm-contain__layer--bar" data-layer="bar" aria-pressed="false">Barrier · sealed cartridge / containment concept</button>' +
      '<button type="button" class="lm-contain__layer lm-contain__layer--in" data-layer="in" aria-pressed="true">Inside · engineered living sensing cells</button>' +
      "</div>" +
      '<p class="lm-contain__note" data-contain-note></p>' +
      '<form class="lm-contain__q" data-contain-form>' +
      "<fieldset><legend>Should engineered cells contact the food being screened?</legend>" +
      '<label class="lm-choice"><input type="radio" name="lm-contact" value="yes"><span>Yes</span></label>' +
      '<label class="lm-choice"><input type="radio" name="lm-contact" value="no"><span>No</span></label>' +
      '</fieldset>' +
      '<button class="btn btn--secondary" type="submit">Check</button>' +
      '<p class="lm-contain__live" data-contain-live aria-live="polite"></p></form></div>'
    );
  }

  function renderSignalPath() {
    var steps = [
      { kicker: "Biology", label: "Receptor fluorescence" },
      { kicker: "Hardware", label: "Calibrated signal" },
      { kicker: "Model", label: "Pattern representation" },
      { kicker: "User interface", label: "Risk information" },
    ];
    return (
      '<ol class="lm-sigpath" aria-label="From measurement to a person">' +
      steps
        .map(function (step) {
          return (
            "<li><span class=\"lm-sigpath__kicker\">" +
            escapeHtml(step.kicker) +
            "</span><span class=\"lm-sigpath__label\">" +
            escapeHtml(step.label) +
            "</span></li>"
          );
        })
        .join("") +
      "</ol>" +
      '<p class="lm-sigpath__note">A reliable model requires a reliable upstream measurement. AI does not sit at the start of this chain.</p>'
    );
  }

  function renderPatternLab(mod) {
    var teach = mod.teaching || {};
    var samples = teach.samples || [];
    var sampleRadios = samples
      .map(function (s, i) {
        return (
          '<label class="lm-chip"><input type="radio" name="lm-lab-sample" value="' +
          escapeHtml(s.id) +
          '"' +
          (i === 0 ? " checked" : "") +
          "><span>" +
          escapeHtml(s.name) +
          "</span></label>"
        );
      })
      .join("");
    var modes = [
      { id: "raw", label: "No preprocessing" },
      { id: "contrast", label: "Contrast enhancement only" },
      { id: "sparse", label: "Contrast + sparse representation" },
    ];
    var modeRadios = modes
      .map(function (m, i) {
        return (
          '<label class="lm-chip"><input type="radio" name="lm-lab-ablate" value="' +
          m.id +
          '"' +
          (i === 2 ? " checked" : "") +
          "><span>" +
          escapeHtml(m.label) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<div class="lm-lab" data-pattern-lab>' +
      '<p class="lm-sim-label">' +
      escapeHtml((mod.interaction && mod.interaction.disclaimer) || "") +
      "</p>" +
      '<div class="lm-lab__layout">' +
      '<div class="lm-lab__controls">' +
      '<fieldset><legend>Sample</legend><div class="lm-chip-row">' +
      sampleRadios +
      "</div></fieldset>" +
      '<fieldset><legend>Ablation</legend><div class="lm-chip-row">' +
      modeRadios +
      "</div></fieldset>" +
      '<div class="lm-noise"><label for="lm-lab-noise">Add measurement noise</label>' +
      '<input id="lm-lab-noise" type="range" min="0" max="40" value="8" step="1">' +
      '<p class="lm-noise__val"><span data-lab-noise>8</span>% teaching noise</p></div></div>' +
      '<div class="lm-lab__viz">' +
      '<p class="lm-sim-label">' +
      escapeHtml(teach.label || "Illustrative educational classifier") +
      "</p>" +
      '<div class="lm-heat-wrap"><table class="lm-heat" data-lab-heat><caption class="visually-hidden">Receptor by sample teaching heatmap</caption></table></div>' +
      '<div class="lm-stages" data-lab-stages></div>' +
      '<p class="lm-lab__out" data-lab-out aria-live="polite"></p>' +
      "</div></div>" +
      '<form class="lm-lab__q" data-lab-q>' +
      "<fieldset><legend>Which representation keeps the samples easiest to distinguish?</legend>" +
      '<label class="lm-choice"><input type="radio" name="lm-lab-which" value="raw"><span>Raw input</span></label>' +
      '<label class="lm-choice"><input type="radio" name="lm-lab-which" value="contrast"><span>Contrast enhancement only</span></label>' +
      '<label class="lm-choice"><input type="radio" name="lm-lab-which" value="sparse"><span>Contrast + sparse representation</span></label>' +
      '</fieldset>' +
      '<button class="btn btn--secondary" type="submit">Check</button>' +
      '<p class="lm-lab__q-live" data-lab-q-live aria-live="polite"></p></form>' +
      renderSignalPath() +
      "</div>"
    );
  }

  function renderBoundsCard(suffix) {
    var titleId = suffix ? "lm-bounds-title-" + suffix : "lm-bounds-title";
    return (
      '<aside class="lm-bounds" aria-labelledby="' +
      titleId +
      '">' +
      '<p class="lm-bounds__kicker">Boundaries · read this before you act</p>' +
      '<h3 id="' +
      titleId +
      '">What AeroSense may and may not claim</h3>' +
      '<div class="lm-bounds__cols">' +
      '<div class="lm-bounds__col">' +
      "<h4>AeroSense may aim to</h4>" +
      "<ul>" +
      "<li>Provide earlier screening information</li>" +
      "<li>Prioritize batches</li>" +
      "<li>Trigger retesting, monitoring, or confirmation</li>" +
      "</ul></div>" +
      '<div class="lm-bounds__col lm-bounds__col--not">' +
      "<h4>AeroSense does not</h4>" +
      "<ul>" +
      "<li>Certify food as legally safe</li>" +
      "<li>Directly determine exact mycotoxin concentration</li>" +
      "<li>Replace validated laboratory testing</li>" +
      "</ul></div></div>" +
      '<p class="lm-bounds__foot">Screening can change the next action. It cannot finish the chemical or legal question.</p>' +
      "</aside>"
    );
  }

  function renderConfusion() {
    var quads = [
      {
        id: "tn",
        title: "True negative",
        axis: "Actual negative · predicted negative",
      },
      {
        id: "fp",
        title: "False positive",
        axis: "Actual negative · predicted positive",
      },
      {
        id: "fn",
        title: "False negative",
        axis: "Actual positive · predicted negative",
      },
      {
        id: "tp",
        title: "True positive",
        axis: "Actual positive · predicted positive",
      },
    ];
    var cells = quads
      .map(function (q) {
        return (
          '<button type="button" class="lm-conf__cell" data-quad="' +
          q.id +
          '" aria-pressed="false">' +
          '<span class="lm-conf__axis">' +
          escapeHtml(q.axis) +
          "</span>" +
          '<span class="lm-conf__name">' +
          escapeHtml(q.title) +
          "</span></button>"
        );
      })
      .join("");
    return (
      '<div class="lm-conf" data-confusion>' +
      '<p class="lm-sim-label">Teaching 2 × 2 — not a measured AeroSense performance matrix and not a claimed accuracy.</p>' +
      '<p class="lm-conf__legend">Columns are predicted negative / positive. Rows are actual negative / positive. Open a quadrant.</p>' +
      '<div class="lm-conf__quads" role="group" aria-label="Confusion matrix quadrants">' +
      cells +
      "</div>" +
      '<p class="lm-conf__live" data-conf-live aria-live="polite">Choose a quadrant to see the consequence.</p>' +
      '<form class="lm-conf__ask" data-threshold-form>' +
      '<label for="lm-threshold">If missing a dangerous batch is much more costly than sending one additional sample for confirmation, should the decision threshold stay the same?</label>' +
      '<textarea id="lm-threshold" name="threshold" rows="4" maxlength="2000" placeholder="There is no universal numeric answer. Write a short policy note."></textarea>' +
      "<p>Discussion, not a score. Stored only in this browser. Nothing is sent to a server.</p>" +
      '<button class="btn btn--secondary" type="submit">Save note</button>' +
      '<p class="lm-conf__saved" data-threshold-live aria-live="polite"></p></form></div>'
    );
  }

  function renderQcDesk(mod) {
    var spec = mod.interaction || {};
    var actions = spec.actions || [];
    var batches = spec.batches || [];
    var cards = batches
      .map(function (batch) {
        var qualityClass = /poor/i.test(batch.quality) ? "is-poor" : "is-good";
        var riskClass = /high/i.test(batch.risk)
          ? "is-high"
          : /medium/i.test(batch.risk)
            ? "is-medium"
            : "is-low";
        var radios = actions
          .map(function (act) {
            return (
              '<label class="lm-choice"><input type="radio" name="qc-' +
              escapeHtml(batch.id) +
              '" value="' +
              escapeHtml(act.id) +
              '"><span>' +
              escapeHtml(act.label) +
              "</span></label>"
            );
          })
          .join("");
        return (
          '<article class="lm-qc__card' +
          (/poor/i.test(batch.quality) ? " lm-qc__card--weak" : "") +
          '" data-batch="' +
          escapeHtml(batch.id) +
          '">' +
          "<h3>" +
          escapeHtml(batch.name) +
          "</h3>" +
          '<dl class="lm-qc__meta">' +
          "<div><dt>Screening result</dt><dd class=\"lm-qc__band " +
          riskClass +
          '">' +
          escapeHtml(batch.risk) +
          "</dd></div>" +
          "<div><dt>Signal quality</dt><dd class=\"" +
          qualityClass +
          '">' +
          escapeHtml(batch.quality) +
          "</dd></div>" +
          "<div><dt>Confidence</dt><dd>" +
          escapeHtml(batch.confidence) +
          "</dd></div>" +
          "<div><dt>History</dt><dd>" +
          escapeHtml(batch.history) +
          "</dd></div>" +
          "<div><dt>Storage context</dt><dd>" +
          escapeHtml(batch.storage) +
          "</dd></div></dl>" +
          "<fieldset><legend>Next action</legend>" +
          '<div class="lm-qc__actions">' +
          radios +
          "</div></fieldset>" +
          '<p class="lm-qc__note" data-batch-note="' +
          escapeHtml(batch.id) +
          '" hidden></p></article>'
        );
      })
      .join("");
    return (
      '<div class="lm-qc" data-qc-desk>' +
      '<p class="lm-sim-label">' +
      escapeHtml(spec.disclaimer || "") +
      "</p>" +
      '<form class="lm-qc__form" data-qc-form>' +
      '<div class="lm-qc__grid">' +
      cards +
      "</div>" +
      '<button class="btn btn--primary" type="submit">Review my decisions</button>' +
      '<p class="lm-qc__error" data-qc-error aria-live="polite"></p></form>' +
      '<div class="lm-qc__review" data-qc-review hidden>' +
      '<p class="lm-qc__live" data-qc-live></p>' +
      "<p>There is not one stamp for every file. Screening should guide the next action — not replace confirmatory analysis.</p></div>" +
      renderBoundsCard("desk") +
      "</div>"
    );
  }

  function renderFeedback(mod) {
    var spec = mod.feedback;
    if (!spec) return "";
    var opts = (spec.options || [])
      .map(function (opt) {
        return (
          '<label class="lm-choice"><input type="checkbox" name="lm-trust" value="' +
          escapeHtml(opt.id) +
          '"><span>' +
          escapeHtml(opt.label) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<section class="lm-section" id="lm-feedback">' +
      '<p class="learn-kicker">Project feedback</p>' +
      "<h2>Before you trust a warning</h2>" +
      '<form class="lm-feedback" data-feedback>' +
      "<fieldset><legend>" +
      escapeHtml(spec.question) +
      "</legend>" +
      '<div class="lm-feedback__opts">' +
      opts +
      "</div></fieldset>" +
      '<label class="lm-feedback__other" for="lm-feedback-other">If you chose Other, what else would you need?</label>' +
      '<textarea id="lm-feedback-other" name="other" rows="3" maxlength="500" placeholder="Optional. Stored only in this browser."></textarea>' +
      "<p>You may select more than one. Stored only on this device. Structured so it could later be sent to an approved backend — nothing is sent now.</p>" +
      '<button class="btn btn--secondary" type="submit">Save feedback</button>' +
      '<p class="lm-feedback__live" data-feedback-live aria-live="polite"></p></form></section>'
    );
  }

  function renderBlockMedia(block, mod) {
    if (block.widget === "molecule-drift") return renderMoleculeDrift();
    if (block.widget === "receptor-matrix") return renderReceptorMatrix(mod);
    if (block.widget === "method-strip") return renderMethodStrip(block);
    if (block.widget === "myth-case") return renderMythCase(block);
    if (block.widget === "claim-paths") return renderClaimPaths();
    if (block.widget === "signal-path") return renderSignalPath();
    if (block.widget === "bounds-card") return renderBoundsCard();
    if (block.widget === "confusion-matrix") return renderConfusion();
    if (block.visual) return visualSvg(block.visual);
    return "";
  }

  function renderPathway() {
    var nodes = [
      { id: "orn", label: "ORN" },
      { id: "al", label: "Antennal Lobe" },
      { id: "pn", label: "Projection Neurons" },
      { id: "mb", label: "Mushroom Body" },
      { id: "kc", label: "Kenyon Cells" },
    ];
    var buttons = nodes
      .map(function (node, i) {
        var arrow = i ? '<span class="lm-path__arrow" aria-hidden="true">→</span>' : "";
        return (
          arrow +
          '<button type="button" class="lm-path__node" data-path-node="' +
          node.id +
          '" aria-pressed="' +
          (i === 0 ? "true" : "false") +
          '">' +
          escapeHtml(node.label) +
          "</button>"
        );
      })
      .join("");
    return (
      '<div class="lm-path" data-olfactory-path>' +
      "<h3>Optional pathway</h3>" +
      '<p class="lm-path__lede">A simplified insect sketch. Select a node for a short note. This is not an anatomical diagram of AeroSense.</p>' +
      '<div class="lm-path__row">' +
      buttons +
      "</div>" +
      '<p class="lm-path__note" data-path-note></p></div>'
    );
  }

  function renderOdorFingerprint(mod) {
    var spec = mod.interaction || {};
    var teach = mod.teaching || {};
    var odors = teach.odors || [];
    var odorRadios = odors
      .map(function (odor, i) {
        return (
          '<label class="lm-chip"><input type="radio" name="lm-odor" value="' +
          escapeHtml(odor.id) +
          '"' +
          (i === 0 ? " checked" : "") +
          "><span>" +
          escapeHtml(odor.name) +
          "</span></label>"
        );
      })
      .join("");
    var modes = [
      { id: "raw", label: "Raw receptor response" },
      { id: "contrast", label: "Contrast-enhanced response" },
      { id: "sparse", label: "Sparse representation" },
    ];
    var modeRadios = modes
      .map(function (mode, i) {
        return (
          '<label class="lm-chip"><input type="radio" name="lm-mode" value="' +
          mode.id +
          '"' +
          (i === 0 ? " checked" : "") +
          "><span>" +
          escapeHtml(mode.label) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<div class="lm-finger" data-odor-fingerprint>' +
      '<p class="lm-sim-label">' +
      escapeHtml(spec.disclaimer || "Conceptual simulation — not experimental AeroSense data.") +
      "</p>" +
      '<div class="lm-finger__layout">' +
      '<div class="lm-finger__controls">' +
      '<fieldset><legend>Step 1 · Fictional odor sample</legend><div class="lm-chip-row">' +
      odorRadios +
      "</div></fieldset>" +
      '<p class="lm-finger__step">Step 2 · Six receptor channels appear in the visualization. Tap a channel to inspect its relative teaching level.</p>' +
      '<div class="lm-noise"><label for="lm-noise">Step 3 · Background noise</label>' +
      '<input id="lm-noise" type="range" min="0" max="40" value="8" step="1">' +
      '<p class="lm-noise__val"><span data-noise-label>8</span>% teaching noise</p></div>' +
      '<fieldset><legend>Step 4 · Representation</legend><div class="lm-chip-row">' +
      modeRadios +
      "</div></fieldset>" +
      '<button type="button" class="btn btn--secondary lm-finger__compare-btn" data-compare aria-pressed="false">Compare Odors A and B</button>' +
      "</div>" +
      '<div class="lm-finger__viz">' +
      '<p class="lm-finger__view-label" data-view-label>Odor A · six receptor channels</p>' +
      '<div class="lm-finger__stage" data-finger-stage></div>' +
      '<p class="lm-finger__inspect" data-finger-inspect aria-live="polite">Tap a channel to inspect its relative teaching level.</p>' +
      "</div></div>" +
      '<p class="lm-finger__caption" data-finger-caption></p>' +
      '<p class="lm-finger__live" data-finger-live aria-live="polite"></p>' +
      renderPathway() +
      "</div>"
    );
  }

  function renderSidebar(mod, store, currentId) {
    var count = store.completedCount(store.state);
    var items = root.AerosenseLearn.MODULES.map(function (m) {
      var rec = store.getModule(store.state, m.id);
      var current = m.id === currentId ? ' aria-current="page"' : "";
      var mark =
        rec.completed ? "Completed" : rec.status === "in-progress" ? "In progress" : "Not started";
      return (
        '<li><a class="learn-rail__link" href="' +
        escapeHtml(m.href) +
        '"' +
        current +
        ">" +
        '<span class="learn-rail__num">' +
        escapeHtml(m.number) +
        "</span>" +
        '<span class="learn-rail__name">' +
        escapeHtml(m.shortTitle) +
        "</span>" +
        '<span class="learn-rail__state">' +
        mark +
        "</span></a></li>"
      );
    }).join("");

    return (
      '<aside class="learn-rail" aria-label="Learning Lab">' +
      '<p class="learn-rail__brand">AeroSense Learning Lab</p>' +
      '<p class="learn-rail__progress">Progress: <strong>' +
      count +
      " / 5</strong> modules</p>" +
      '<ol class="learn-rail__list">' +
      items +
      "</ol>" +
      '<div class="learn-rail__foot">' +
      '<a href="learning-platform/progress.html">My Progress</a>' +
      '<a href="education.html">Back to Education</a>' +
      "</div></aside>"
    );
  }

  function renderMobileBar(mod) {
    return (
      '<div class="lm-sticky" role="navigation" aria-label="Module stages">' +
      '<button type="button" class="lm-sticky__modules" data-learn-dock aria-expanded="false" aria-controls="learn-modules-drawer">Modules</button>' +
      '<ol class="lm-sticky__stages">' +
      STAGES.map(function (stage, i) {
        return (
          '<li><a href="#lm-' +
          stage.id +
          '"><span class="visually-hidden">Stage ' +
          (i + 1) +
          "</span>" +
          escapeHtml(stage.label) +
          "</a></li>"
        );
      }).join("") +
      "</ol></div>"
    );
  }

  function renderDrawer(currentId) {
    var items = root.AerosenseLearn.MODULES.map(function (m) {
      var current = m.id === currentId ? ' aria-current="page"' : "";
      return (
        "<li><a href=\"" +
        escapeHtml(m.href) +
        '"' +
        current +
        ">" +
        escapeHtml(m.number + " " + m.shortTitle) +
        "</a></li>"
      );
    }).join("");
    return (
      '<dialog class="learn-drawer" id="learn-modules-drawer" aria-labelledby="lm-drawer-title">' +
      '<div class="learn-drawer__panel">' +
      '<div class="learn-drawer__header"><h2 id="lm-drawer-title">Modules</h2>' +
      '<button type="button" class="learn-drawer__close" data-learn-drawer-close>Close</button></div>' +
      '<ul class="learn-drawer__list">' +
      items +
      "</ul>" +
      '<p class="learn-drawer__hint">Open any module. None are locked. Progress stays in this browser.</p>' +
      "</div></dialog>"
    );
  }

  function renderHero(mod) {
    var kicker = mod.eyebrow
      ? escapeHtml(mod.eyebrow)
      : "Module " + escapeHtml(mod.number) + " · " + escapeHtml(mod.category);
    var titleInner;
    if (mod.heroTitleLines && mod.heroTitleLines.length) {
      titleInner = mod.heroTitleLines
        .map(function (line, i) {
          return (i ? "<br>" : "") + escapeHtml(line);
        })
        .join("");
    } else {
      titleInner = escapeHtml(mod.heroTitle || mod.title);
    }
    return (
      '<header class="lm-hero" id="lm-hero">' +
      '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
      '<li><a href="index.html">Home</a></li>' +
      '<li><a href="education.html">Education</a></li>' +
      '<li><a href="learning-platform.html">Learning Lab</a></li>' +
      '<li aria-current="page">' +
      escapeHtml(mod.shortTitle) +
      "</li></ol></nav>" +
      '<p class="learn-kicker">' +
      kicker +
      "</p>" +
      "<h1>" +
      titleInner +
      "</h1>" +
      '<p class="lm-hero__hook">' +
      escapeHtml(mod.hook) +
      "</p>" +
      '<p class="lm-hero__time">' +
      escapeHtml(mod.duration) +
      "</p>" +
      '<ol class="lm-pipeline" aria-label="Module sequence">' +
      STAGES.map(function (stage) {
        return "<li>" + escapeHtml(stage.label) + "</li>";
      }).join("") +
      "</ol></header>"
    );
  }

  function renderObjectives(mod) {
    return (
      '<section class="lm-section" id="lm-objectives">' +
      "<h2>Learning objectives</h2>" +
      '<ol class="lm-objectives">' +
      mod.objectives
        .map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        })
        .join("") +
      "</ol></section>"
    );
  }

  function renderLearn(mod) {
    var blocks = mod.sections && mod.sections.length ? mod.sections : null;
    if (!blocks) {
      return (
        '<section class="lm-section" id="lm-learn">' +
        "<h2>Learn</h2>" +
        '<div class="lm-placeholder notice"><p>Lesson blocks for this module are not written yet. The page shell, quiz engine, and progress store are already reusable.</p></div>' +
        "</section>"
      );
    }
    return (
      '<section class="lm-section" id="lm-learn">' +
      "<h2>Learn</h2>" +
      blocks
        .map(function (block) {
          var deeper = block.deeper
            ? '<details class="lm-deeper"><summary>Go deeper</summary><p>' +
              escapeHtml(block.deeper) +
              "</p></details>"
            : "";
          var paras =
            block.paragraphs && block.paragraphs.length
              ? block.paragraphs
                  .map(function (p) {
                    return "<p>" + escapeHtml(p) + "</p>";
                  })
                  .join("")
              : "";
          return (
            '<article class="lm-block" id="' +
            escapeHtml(block.id) +
            '"><h3>' +
            escapeHtml(block.heading) +
            "</h3>" +
            paras +
            renderBlockMedia(block, mod) +
            renderIdeaCard(block.ideaCard) +
            deeper +
            "</article>"
          );
        })
        .join("") +
      "</section>"
    );
  }

  function renderInteraction(mod) {
    var spec = mod.interaction || {};
    var body;
    if (spec.type === "pattern-match") {
      body =
        '<div class="lm-interact__canvas" data-pattern-match>' +
        '<p class="lm-interact__kicker">Mystery pattern · illustrative</p>' +
        '<div class="lm-bars" data-mystery-bars aria-hidden="true"></div>' +
        '<p class="visually-hidden" data-mystery-label></p>' +
        '<fieldset class="lm-interact__choices"><legend>Which labeled pattern matches the whole row?</legend>' +
        '<div class="lm-interact__options" data-pattern-options></div></fieldset>' +
        '<p class="lm-interact__live" data-pattern-live aria-live="polite"></p>' +
        "</div>";
    } else if (spec.type === "odor-fingerprint") {
      body = renderOdorFingerprint(mod);
    } else if (spec.type === "food-investigate") {
      body = renderFoodInvestigate(mod);
    } else if (spec.type === "sensor-bench") {
      body = renderSensorBench(mod);
    } else if (spec.type === "pattern-lab") {
      body = renderPatternLab(mod);
    } else if (spec.type === "qc-desk") {
      body = renderQcDesk(mod);
    } else {
      body =
        '<div class="lm-interact__canvas lm-interact__canvas--placeholder">' +
        "<p>Interactive canvas placeholder. Controls will load here without a fixed height that clips on small screens.</p>" +
        '<p class="lm-interact__live">No live challenge is published in this module yet.</p></div>';
    }
    return (
      '<section class="lm-section lm-section--spotlight" id="lm-interact">' +
      '<p class="learn-kicker">Try it yourself</p>' +
      "<h2>" +
      escapeHtml(spec.title || "Try it yourself") +
      "</h2>" +
      '<p class="lm-lede">' +
      escapeHtml(spec.challenge || "") +
      "</p>" +
      body +
      '<p class="lm-interact__explain">' +
      escapeHtml(spec.explanation || "") +
      "</p></section>"
    );
  }

  function renderQuizMount(kind, title, lede) {
    return (
      '<section class="lm-section" id="lm-' +
      kind +
      '">' +
      "<h2>" +
      escapeHtml(title) +
      "</h2>" +
      '<p class="lm-lede">' +
      escapeHtml(lede) +
      "</p>" +
      '<div class="lm-quiz" data-quiz="' +
      kind +
      '"></div></section>'
    );
  }

  function renderGain() {
    return (
      '<section class="lm-section" id="lm-gain" hidden>' +
      "<h2>Your learning change</h2>" +
      '<div class="lm-gain" data-gain>' +
      '<p class="lm-gain__row"><span>Pre</span> <strong data-gain-pre>—</strong></p>' +
      '<p class="lm-gain__row"><span>Post</span> <strong data-gain-post>—</strong></p>' +
      '<p class="lm-gain__row"><span>Knowledge gain</span> <strong data-gain-delta>—</strong></p>' +
      '<p class="lm-gain__note">This comparison shows your score change within this module. It is not a claim about learning effectiveness for a class or for AeroSense education as a whole.</p>' +
      "</div></section>"
    );
  }

  function renderReflect(mod) {
    return (
      '<section class="lm-section" id="lm-reflect">' +
      "<h2>Reflect</h2>" +
      '<form class="lm-reflect" data-reflect>' +
      '<label for="lm-reflect-text">' +
      escapeHtml(mod.reflection) +
      "</label>" +
      '<textarea id="lm-reflect-text" name="reflection" rows="4" maxlength="2000" placeholder="Optional. Write a sentence or two."></textarea>' +
      "<p>Optional. Stored only in this browser. No name, email, or other identifier is collected. Nothing is sent to a server.</p>" +
      '<button class="btn btn--secondary" type="submit">Save reflection</button>' +
      '<p class="lm-reflect__live" data-reflect-live aria-live="polite"></p>' +
      "</form></section>"
    );
  }

  function renderTakeaway(mod) {
    var next = root.AerosenseLearn.nextModule(mod.id);
    var nextCard;
    if (mod.capstone || !next) {
      nextCard =
        '<p class="lm-complete">' +
        escapeHtml(
          (mod.takeaway && mod.takeaway.completeLine) ||
            "You completed: From Nose → Biosensor → Decision"
        ) +
        "</p>" +
        '<div class="lm-cta">' +
        '<a class="btn btn--primary" href="learning-platform.html#learn-journey">View My Learning Journey</a>' +
        '<a class="btn btn--secondary" href="education.html">Return to Education</a>' +
        '<a class="btn btn--secondary" href="index.html">Explore the AeroSense Project</a>' +
        "</div>";
    } else {
      nextCard =
        '<a class="lm-next" href="' +
        escapeHtml(next.href) +
        '"><span class="lm-next__dir">Next module</span><span class="lm-next__title">' +
        escapeHtml(
          (mod.takeaway && mod.takeaway.nextPrompt) || next.number + " · " + next.shortTitle
        ) +
        "</span></a>";
    }
    return (
      '<section class="lm-section" id="lm-takeaway">' +
      "<h2>Takeaway</h2>" +
      '<p class="lm-takeaway">' +
      escapeHtml(mod.takeaway.sentence) +
      "</p>" +
      "<p>Three things you should now be able to explain:</p>" +
      "<ol>" +
      mod.takeaway.canExplain
        .map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        })
        .join("") +
      "</ol></section>" +
      renderFeedback(mod) +
      '<section class="lm-section" id="lm-next"><h2>Next</h2>' +
      nextCard +
      (mod.capstone
        ? ""
        : '<p><a class="btn btn--secondary" href="learning-platform.html#learn-journey">Return to journey</a></p>') +
      "</section>"
    );
  }

  function renderPage(mod, store) {
    var notice = mod.ready
      ? ""
      : '<p class="notice">Placeholder module. Objectives and the page architecture are in place; full lesson blocks and the central activity are not populated yet.</p>';
    return (
      '<div class="learn-app">' +
      renderSidebar(mod, store, mod.id) +
      '<div class="learn-module">' +
      renderMobileBar(mod) +
      '<article class="lm-article' +
      (mod.theme ? " lm-article--" + escapeHtml(mod.theme) : "") +
      '">' +
      renderHero(mod) +
      notice +
      renderObjectives(mod) +
      renderQuizMount(
        "pre",
        "Before you begin",
        "Three questions. One at a time. Your starting point is stored only on this device. Explanations come after the lesson."
      ) +
      renderLearn(mod) +
      renderInteraction(mod) +
      renderQuizMount(
        "post",
        "Check your understanding",
        "The same ideas as the pre-test, with explanations after each answer. Option order may differ."
      ) +
      renderGain() +
      renderReflect(mod) +
      renderTakeaway(mod) +
      "</article></div></div>" +
      renderDrawer(mod.id)
    );
  }

  function quizComplete(quiz, answers) {
    if (!quiz || !quiz.length) return true;
    if (!answers) return false;
    return quiz.every(function (item) {
      return Object.prototype.hasOwnProperty.call(answers, item.id);
    });
  }

  function paintQuiz(mount, quiz, kind, existingAnswers, onComplete) {
    if (!mount) return;
    if (!quiz || !quiz.length) {
      mount.innerHTML =
        '<p class="lm-placeholder">Quiz items will be added when this lesson is written. The quiz engine is ready.</p>';
      return;
    }

    var index = 0;
    var answers = existingAnswers ? Object.assign({}, existingAnswers) : {};
    var isPost = kind === "post";
    var locked = quizComplete(quiz, answers);

    function showQuestion(moveFocus) {
      if (locked && !isPost) {
        mount.innerHTML =
          '<p class="lm-recorded" role="status">Your starting point has been recorded.</p>';
        return;
      }
      if (index >= quiz.length) {
        if (!isPost) {
          mount.innerHTML =
            '<p class="lm-recorded" role="status">Your starting point has been recorded.</p>';
        } else {
          mount.innerHTML = '<p class="lm-recorded" role="status">Post-test complete.</p>';
        }
        return;
      }

      var item = quiz[index];
      var name = kind + "-" + item.id;
      var choices = isPost ? shuffle(item.choices) : item.choices.slice();
      var choiceHtml = choices
        .map(function (choice) {
          var inputId = name + "-" + choice.id;
          return (
            '<label class="lm-choice">' +
            '<input type="radio" id="' +
            escapeHtml(inputId) +
            '" name="' +
            escapeHtml(name) +
            '" value="' +
            escapeHtml(choice.id) +
            '">' +
            "<span>" +
            escapeHtml(choice.text) +
            "</span></label>"
          );
        })
        .join("");

      mount.innerHTML =
        '<form class="lm-quiz__card" data-item-id="' +
        escapeHtml(item.id) +
        '" data-item-source="learning-platform">' +
        '<p class="lm-quiz__count">Question ' +
        (index + 1) +
        " / " +
        quiz.length +
        "</p>" +
        "<fieldset><legend>" +
        escapeHtml(item.question) +
        "</legend>" +
        choiceHtml +
        "</fieldset>" +
        '<button class="btn btn--primary" type="submit">Continue</button>' +
        '<div class="lm-quiz__feedback" data-feedback role="status" hidden></div>' +
        "</form>";

      var form = qs("form", mount);
      var feedback = qs("[data-feedback]", mount);
      var submitted = false;

      if (moveFocus && form) {
        form.setAttribute("tabindex", "-1");
        form.focus();
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = form.querySelector("input[type='radio']:checked");
        if (!selected) {
          if (feedback) {
            feedback.hidden = false;
            feedback.textContent = "Choose one option to continue.";
          }
          return;
        }

        if (isPost && submitted) {
          index += 1;
          if (index >= quiz.length && typeof onComplete === "function") onComplete(answers);
          showQuestion(true);
          return;
        }

        answers[item.id] = selected.value;
        submitted = true;

        if (!isPost) {
          index += 1;
          if (index >= quiz.length && typeof onComplete === "function") onComplete(answers);
          showQuestion(true);
          return;
        }

        var ok = selected.value === item.correctAnswer;
        Array.prototype.forEach.call(form.querySelectorAll("input"), function (input) {
          input.disabled = true;
          var lab = input.closest(".lm-choice");
          if (!lab) return;
          if (input.value === item.correctAnswer) lab.classList.add("is-key");
          if (input.checked) lab.classList.add(ok ? "is-right" : "is-wrong");
        });
        feedback.hidden = false;
        feedback.innerHTML =
          '<p class="lm-quiz__verdict">' +
          (ok ? "Correct" : "Not quite") +
          "</p><p>" +
          escapeHtml(item.explanation) +
          "</p>";
        qs("button[type='submit']", form).textContent =
          index === quiz.length - 1 ? "See my change" : "Next question";
      });
    }

    showQuestion(false);
  }

  function initReceptorMatrix(rootEl, mod) {
    var host = qs("[data-receptor-matrix]", rootEl);
    if (!host || !mod || !mod.teaching) return;

    var odors = mod.teaching.odors;
    var selected = odors[0] ? odors[0].id : "A";

    function odorById(id) {
      var i;
      for (i = 0; i < odors.length; i += 1) {
        if (odors[i].id === id) return odors[i];
      }
      return odors[0];
    }

    function paint() {
      var odor = odorById(selected);
      var selectedEl = qs("[data-matrix-selected]", host);
      if (selectedEl) selectedEl.textContent = "Selected: " + odor.name + " · illustrative pattern";
      Array.prototype.forEach.call(host.querySelectorAll("[data-matrix-odor]"), function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-matrix-odor") === selected);
      });
      odor.values.forEach(function (v, i) {
        var fill = qs('[data-matrix-fill="' + i + '"]', host);
        var val = qs('[data-matrix-val="' + i + '"]', host);
        if (fill) fill.style.width = Math.round(clamp01(v) * 100) + "%";
        if (val) val.textContent = formatTeach(v);
      });
    }

    host.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-matrix-odor]");
      if (!btn || !host.contains(btn)) return;
      selected = btn.getAttribute("data-matrix-odor");
      paint();
    });

    paint();
  }

  function initPathway(rootEl) {
    var host = qs("[data-olfactory-path]", rootEl);
    if (!host) return;
    var notes = {
      orn:
        "ORN — olfactory receptor neurons. Receptor proteins bind airborne odorant molecules and start the first neural signal.",
      al:
        "Antennal lobe — the first insect brain relay. Neighboring channels can interact. This lesson uses that as an analogy for contrast enhancement, not as a map of AeroSense hardware.",
      pn: "Projection neurons — they carry processed activity out of the antennal lobe toward later centers.",
      mb: "Mushroom body — a later insect center involved in odor learning and in forming more selective odor codes.",
      kc:
        "Kenyon cells — mushroom-body neurons. For a given odor, typically only a small fraction fire strongly: a sparse representation.",
    };
    var noteEl = qs("[data-path-note]", host);

    function show(id) {
      Array.prototype.forEach.call(host.querySelectorAll("[data-path-node]"), function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-path-node") === id ? "true" : "false");
      });
      if (noteEl) noteEl.textContent = notes[id] || notes.orn;
    }

    host.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-path-node]");
      if (!btn || !host.contains(btn)) return;
      show(btn.getAttribute("data-path-node"));
    });

    show("orn");
  }

  function initOdorFingerprint(rootEl, mod) {
    var host = qs("[data-odor-fingerprint]", rootEl);
    if (!host || !mod || !mod.teaching) return;

    var teach = mod.teaching;
    var spec = mod.interaction || {};
    var receptors = teach.receptors;
    var odorIndex = {};
    teach.odors.forEach(function (odor) {
      odorIndex[odor.id] = odor;
    });

    var state = {
      odor: teach.odors[0].id,
      mode: "raw",
      noise: 8,
      compare: false,
    };

    var stage = qs("[data-finger-stage]", host);
    var viewLabel = qs("[data-view-label]", host);
    var inspect = qs("[data-finger-inspect]", host);
    var caption = qs("[data-finger-caption]", host);
    var live = qs("[data-finger-live]", host);
    var noiseLabel = qs("[data-noise-label]", host);
    var compareBtn = qs("[data-compare]", host);

    function noisy(id) {
      var odor = odorIndex[id];
      var amp = state.noise / 100;
      return applyNoise(odor.values, amp, teach.noise[id] || []);
    }

    function coded(id) {
      return transformVector(noisy(id), state.mode);
    }

    function keptClass(v) {
      return state.mode === "sparse" && v > 0.12 ? " is-kept" : "";
    }

    function channelButton(name, index, value, ghost, odorId) {
      var width = Math.round(clamp01(value) * 100);
      var ghostHtml = "";
      if (ghost != null) {
        ghostHtml =
          '<span class="lm-chan__fill lm-chan__fill--ghost" style="width:' +
          Math.round(clamp01(ghost) * 100) +
          '%"></span>';
      }
      return (
        '<button type="button" class="lm-chan' +
        keptClass(value) +
        '" data-chan="' +
        index +
        '" data-odor="' +
        escapeHtml(odorId) +
        '" aria-label="' +
        escapeHtml(
          name +
            " · " +
            odorId +
            " · relative teaching level " +
            formatTeach(value)
        ) +
        '"><span class="lm-chan__lab">' +
        escapeHtml(name) +
        '</span><span class="lm-chan__track">' +
        ghostHtml +
        '<span class="lm-chan__fill" style="width:' +
        width +
        '%"></span></span><span class="lm-chan__val">' +
        formatTeach(value) +
        "</span></button>"
      );
    }

    function column(id, ghostId) {
      var values = coded(id);
      var ghosts = ghostId && state.mode === "raw" ? coded(ghostId) : null;
      var channels = receptors
        .map(function (name, i) {
          return channelButton(name, i, values[i], ghosts ? ghosts[i] : null, id);
        })
        .join("");
      return (
        '<div class="lm-finger__col"><p class="lm-finger__col-title">' +
        escapeHtml(odorIndex[id].name) +
        '</p><div class="lm-finger__channels">' +
        channels +
        "</div></div>"
      );
    }

    function teachingCopy() {
      if (state.compare && state.mode === "raw") {
        return "Raw rows for A and B occupy similar heights on R1–R4. The overlapping pattern is easy to confuse. Ghost fills show the other odor on the same channel.";
      }
      if (state.compare && state.mode === "contrast") {
        return "Contrast enhancement reduces shared background and lifts stronger channels. Differences on R5 and R6 become easier to see, still without naming either odor.";
      }
      if (state.compare && state.mode === "sparse") {
        return "Sparse coding keeps a small active subset. Shared activity can remain, while the distinct channels (here R5 versus R6 in this teaching example) are easier for a later step to separate. That is not identification.";
      }
      if (state.mode === "raw") {
        return "This raw row is a combination across six channels. No single bar names the odor.";
      }
      if (state.mode === "contrast") {
        return "Contrast enhancement is a teaching transform: shared background is reduced so stronger channels stand out more.";
      }
      return "Sparse representation keeps only a small active subset after contrast. It can make patterns easier to separate. It does not magically identify the odor.";
    }

    function paint() {
      if (noiseLabel) noiseLabel.textContent = String(state.noise);
      if (compareBtn) {
        compareBtn.setAttribute("aria-pressed", state.compare ? "true" : "false");
        compareBtn.textContent = state.compare ? "Exit compare mode" : "Compare Odors A and B";
      }
      Array.prototype.forEach.call(host.querySelectorAll('input[name="lm-odor"]'), function (input) {
        input.disabled = state.compare;
      });
      if (viewLabel) {
        viewLabel.textContent = state.compare
          ? "Compare · Odor A beside Odor B"
          : odorIndex[state.odor].name + " · six receptor channels";
      }
      if (state.compare) {
        stage.innerHTML =
          '<div class="lm-finger__compare">' + column("A", "B") + column("B", "A") + "</div>";
        if (caption) caption.textContent = spec.compareCaption || "";
      } else {
        stage.innerHTML = column(state.odor, null);
        if (caption) caption.textContent = spec.patternCaption || "";
      }
      if (live) live.textContent = teachingCopy();
      if (inspect) {
        inspect.textContent = "Tap a channel to inspect its relative teaching level.";
      }
    }

    host.addEventListener("change", function (event) {
      var t = event.target;
      if (t.name === "lm-odor") state.odor = t.value;
      if (t.name === "lm-mode") state.mode = t.value;
      if (t.id === "lm-noise") state.noise = Number(t.value) || 0;
      paint();
    });
    host.addEventListener("input", function (event) {
      if (event.target.id !== "lm-noise") return;
      state.noise = Number(event.target.value) || 0;
      paint();
    });
    if (compareBtn) {
      compareBtn.addEventListener("click", function () {
        state.compare = !state.compare;
        paint();
      });
    }
    host.addEventListener("click", function (event) {
      var chan = event.target.closest("[data-chan]");
      if (!chan || !host.contains(chan)) return;
      var name = receptors[Number(chan.getAttribute("data-chan"))];
      var odorId = chan.getAttribute("data-odor");
      var val = chan.querySelector(".lm-chan__val");
      if (inspect && val) {
        inspect.textContent =
          name +
          " on " +
          odorIndex[odorId].name +
          ": relative teaching level " +
          val.textContent +
          " (0–1 scale, not a biological unit).";
      }
    });

    paint();
  }

  function initMythCases(rootEl) {
    var cards = rootEl.querySelectorAll("[data-myth-case]");
    Array.prototype.forEach.call(cards, function (card) {
      var after = qs("[data-myth-after]", card);
      var live = qs("[data-myth-live]", card);
      card.addEventListener("change", function (event) {
        if (!event.target || event.target.type !== "radio") return;
        if (after) after.hidden = false;
        if (live) {
          live.textContent = "Guess recorded. Read the evidence, verdict, and what to do — this step is not scored.";
        }
      });
    });
  }

  function initFoodInvestigate(rootEl, mod) {
    var host = qs("[data-food-investigate]", rootEl);
    if (!host || !mod || !mod.interaction) return;
    var spec = mod.interaction;
    var exhibits = spec.exhibits || [];
    var detail = qs("[data-file-detail]", host);
    var form = qs("[data-file-form]", host);
    var reveal = qs("[data-file-reveal]", host);
    var live = qs("[data-file-live]", host);
    var caption = qs("[data-file-caption]", host);
    var err = qs("[data-file-error]", host);

    function exhibitById(id) {
      var i;
      for (i = 0; i < exhibits.length; i += 1) {
        if (exhibits[i].id === id) return exhibits[i];
      }
      return exhibits[0];
    }

    function showExhibit(id) {
      var ex = exhibitById(id);
      if (!ex) return;
      Array.prototype.forEach.call(host.querySelectorAll("[data-exhibit]"), function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-exhibit") === id ? "true" : "false");
      });
      if (detail) {
        detail.innerHTML =
          '<p class="lm-file__exhibit-kicker">Exhibit · ' +
          escapeHtml(ex.label) +
          "</p><p>" +
          escapeHtml(ex.note) +
          "</p>";
      }
    }

    host.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-exhibit]");
      if (!btn || !host.contains(btn)) return;
      showExhibit(btn.getAttribute("data-exhibit"));
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = form.querySelector("input[name='lm-file-verdict']:checked");
        if (!selected) {
          if (err) err.textContent = "Choose a conclusion to continue.";
          return;
        }
        if (err) err.textContent = "";
        Array.prototype.forEach.call(form.querySelectorAll("input"), function (input) {
          input.disabled = true;
        });
        var submit = qs("button[type='submit']", form);
        if (submit) submit.disabled = true;
        if (reveal) reveal.hidden = false;
        var fb = (spec.feedback && spec.feedback[selected.value]) || "";
        if (live) live.textContent = fb;
        if (caption) caption.textContent = spec.reveal || "";
        if (reveal && typeof reveal.scrollIntoView === "function") {
          reveal.scrollIntoView({ block: "nearest" });
        }
      });
    }

    if (exhibits[0]) showExhibit(exhibits[0].id);
  }

  function initContainment(rootEl) {
    var host = qs("[data-containment]", rootEl);
    if (!host) return;
    var notes = {
      out: "Outside: food, storeroom air, and people. Engineered cells should not be here.",
      bar: "Barrier: a sealed cartridge or other containment concept. This sketch is not a validated enclosure.",
      in: "Inside: engineered living sensing cells. They stay isolated, with responsible handling and waste.",
    };
    var note = qs("[data-contain-note]", host);
    var form = qs("[data-contain-form]", host);
    var live = qs("[data-contain-live]", host);

    function show(id) {
      Array.prototype.forEach.call(host.querySelectorAll("[data-layer]"), function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-layer") === id ? "true" : "false");
      });
      if (note) note.textContent = notes[id] || notes.in;
    }

    host.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-layer]");
      if (!btn || !host.contains(btn)) return;
      show(btn.getAttribute("data-layer"));
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = form.querySelector("input[name='lm-contact']:checked");
        if (!selected) {
          if (live) live.textContent = "Choose yes or no.";
          return;
        }
        Array.prototype.forEach.call(form.querySelectorAll("input"), function (input) {
          input.disabled = true;
        });
        var submit = qs("button[type='submit']", form);
        if (submit) submit.disabled = true;
        if (selected.value === "no") {
          live.textContent =
            "Correct. Engineered cells should not contact the food. Physical isolation, sealed handling, and contained waste keep a living sensor from becoming a release pathway. This is a teaching sketch, not a certified device.";
        } else {
          live.textContent =
            "No. A living HEK293T sensor belongs behind a barrier. Contact with food or users would mix a genetically modified culture with the thing being screened. Isolation is the responsible default.";
        }
      });
    }

    show("in");
  }

  function initSensorBench(rootEl, mod) {
    var host = qs("[data-sensor-bench]", rootEl);
    if (!host || !mod || !mod.interaction) return;
    var spec = mod.interaction;
    var parts = spec.parts || [];
    var partIndex = {};
    parts.forEach(function (p) {
      partIndex[p.id] = p;
    });
    var placement = {};
    parts.forEach(function (p) {
      placement[p.id] = "tray";
    });
    var selected = null;
    var assembled = false;
    var fail = { or: false, orco: false, gcamp: false };
    var live = qs("[data-bench-live]", host);
    var failPanel = qs("[data-fail-panel]", host);
    var failNote = qs("[data-fail-note]", host);
    var stim = qs("#lm-stimulus", host);
    var stimLabel = qs("[data-stim-label]", host);
    var pathEl = qs("[data-trace-path]", host);

    function coreComplete() {
      var i;
      var ids = spec.coreCell || ["hek", "or", "orco", "gcamp"];
      for (i = 0; i < ids.length; i += 1) {
        if (placement[ids[i]] !== "cell") return false;
      }
      if (placement.diode && placement.diode !== "readout") return false;
      if (placement.ai && placement.ai !== "computation") return false;
      if (placement.mcherry && placement.mcherry !== "tray" && placement.mcherry !== "cell") {
        return false;
      }
      return placement.diode === "readout" && placement.ai === "computation";
    }

    function coaching() {
      if (placement.diode === "cell") {
        return "The photodiode is an optical detector. It belongs in readout, outside the cell.";
      }
      if (placement.ai === "cell" || placement.ai === "readout") {
        return "The AI classifier reads a pattern after measurement. Park it in computation.";
      }
      if (placement.mcherry === "readout" || placement.mcherry === "computation") {
        return "mCherry is an expression reporter inside the cell, not a detector or an algorithm.";
      }
      if (placement.hek === "readout" || placement.hek === "computation") {
        return "HEK293T is the living chassis. It belongs in the cell zone.";
      }
      if (
        (placement.or && placement.or !== "cell" && placement.or !== "tray") ||
        (placement.orco && placement.orco !== "cell" && placement.orco !== "tray") ||
        (placement.gcamp && placement.gcamp !== "cell" && placement.gcamp !== "tray")
      ) {
        return "OR, Orco, and GCaMP are molecular components of the living sensor. They belong in the cell.";
      }
      if (coreComplete()) {
        return "That is the minimum biological sensing chain, with a detector outside the cell and computation after measurement. mCherry may sit in the cell as an expression reporter.";
      }
      return "Minimum biology in the cell: HEK293T, OR, Orco, GCaMP. Photodiode in readout. AI in computation.";
    }

    function paintSlots() {
      var tray = qs("[data-bench-tray]", host);
      Array.prototype.forEach.call(host.querySelectorAll("[data-zone-slots]"), function (slot) {
        slot.innerHTML = "";
      });
      if (tray) {
        Array.prototype.forEach.call(tray.querySelectorAll("[data-part]"), function (btn) {
          btn.hidden = placement[btn.getAttribute("data-part")] !== "tray";
          btn.setAttribute("aria-pressed", btn.getAttribute("data-part") === selected ? "true" : "false");
        });
      }
      Object.keys(placement).forEach(function (id) {
        var zone = placement[id];
        if (zone === "tray") return;
        var slot = qs('[data-zone-slots="' + zone + '"]', host);
        if (!slot || !partIndex[id]) return;
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "lm-part lm-part--placed";
        chip.setAttribute("data-part", id);
        chip.textContent = partIndex[id].label;
        chip.setAttribute("title", "Tap to return to the tray");
        slot.appendChild(chip);
      });
    }

    function responseAmp() {
      var stimVal = stim ? Number(stim.value) / 100 : 0.55;
      if (!assembled) return 0.04;
      if (fail.or || fail.orco || fail.gcamp) {
        if (fail.gcamp) return 0.05;
        return 0.08 + stimVal * 0.08;
      }
      return 0.12 + stimVal * 0.62;
    }

    function paintTrace() {
      var amp = responseAmp();
      var base = 88;
      var peak = 88 - amp * 70;
      var d =
        "M20 " +
        base +
        " H120 C140 " +
        base +
        ", 150 " +
        peak +
        ", 190 " +
        peak +
        " C230 " +
        peak +
        ", 260 " +
        (base - amp * 20) +
        ", 340 " +
        (base - amp * 8);
      if (pathEl) pathEl.setAttribute("d", d);
      if (stimLabel && stim) stimLabel.textContent = String(stim.value);
    }

    function paintFail() {
      if (!failNote) return;
      if (fail.gcamp) {
        failNote.textContent =
          "No GCaMP: receptor activation and a calcium change could still occur, but this optical reporter would no longer convert that Ca²⁺ response into the intended fluorescence readout.";
      } else if (fail.orco) {
        failNote.textContent =
          "No Orco: in this heterologous insect-OR plan, Orco is required to form a functional channel with OR. OR protein alone is not treated here as a complete sensor.";
      } else if (fail.or) {
        failNote.textContent =
          "No OR: this odorant-recognition protein is missing. Orco and GCaMP remain, but this receptor channel has nothing to bind the odorant in the planned way.";
      } else {
        failNote.textContent = "All three required molecular pieces are present in this teaching sketch.";
      }
    }

    function afterPlace() {
      paintSlots();
      if (live) live.textContent = coaching();
      assembled = coreComplete();
      if (failPanel) failPanel.hidden = !assembled;
      if (!assembled) {
        fail.or = fail.orco = fail.gcamp = false;
        Array.prototype.forEach.call(host.querySelectorAll("[data-fail]"), function (box) {
          box.checked = false;
        });
      }
      paintFail();
      paintTrace();
    }

    function place(id, zone) {
      if (!id || !partIndex[id]) return;
      placement[id] = zone;
      selected = null;
      afterPlace();
    }

    host.addEventListener("click", function (event) {
      var partBtn = event.target.closest("[data-part]");
      var zoneHit = event.target.closest("[data-zone-hit]");
      if (partBtn && host.contains(partBtn)) {
        var id = partBtn.getAttribute("data-part");
        if (partBtn.classList.contains("lm-part--placed")) {
          place(id, "tray");
          return;
        }
        selected = selected === id ? null : id;
        paintSlots();
        if (live && selected) live.textContent = partIndex[id].role + " Tap a zone to place it.";
        return;
      }
      if (zoneHit && selected) {
        place(selected, zoneHit.getAttribute("data-zone-hit"));
      }
    });

    host.addEventListener("dragstart", function (event) {
      var partBtn = event.target.closest("[data-part]");
      if (!partBtn) return;
      event.dataTransfer.setData("text/plain", partBtn.getAttribute("data-part"));
      event.dataTransfer.effectAllowed = "move";
    });
    host.addEventListener("dragover", function (event) {
      if (event.target.closest("[data-zone]")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    });
    host.addEventListener("drop", function (event) {
      var zone = event.target.closest("[data-zone]");
      if (!zone) return;
      event.preventDefault();
      var id = event.dataTransfer.getData("text/plain");
      place(id, zone.getAttribute("data-zone"));
    });

    host.addEventListener("change", function (event) {
      var t = event.target;
      if (t && t.getAttribute("data-fail")) {
        fail[t.getAttribute("data-fail")] = !!t.checked;
        paintFail();
        paintTrace();
      }
    });
    if (stim) {
      stim.addEventListener("input", paintTrace);
    }

    afterPlace();
  }

  function initPatternLab(rootEl, mod) {
    var host = qs("[data-pattern-lab]", rootEl);
    if (!host || !mod || !mod.teaching) return;
    var teach = mod.teaching;
    var receptors = teach.receptors || [];
    var samples = teach.samples || [];
    var sampleIndex = {};
    samples.forEach(function (s) {
      sampleIndex[s.id] = s;
    });
    var state = { sample: samples[0] ? samples[0].id : "A", mode: "sparse", noise: 8 };
    var heat = qs("[data-lab-heat]", host);
    var stages = qs("[data-lab-stages]", host);
    var out = qs("[data-lab-out]", host);
    var noiseLabel = qs("[data-lab-noise]", host);
    var qForm = qs("[data-lab-q]", host);
    var qLive = qs("[data-lab-q-live]", host);

    function noisy(id) {
      var s = sampleIndex[id];
      return applyNoise(s.values, state.noise / 100, (teach.noise && teach.noise[id]) || []);
    }

    function coded(id, mode) {
      return transformVector(noisy(id), mode || state.mode);
    }

    function classLabel(code) {
      if (code === "a-like") return "Closest teaching reference: Sample A-like";
      if (code === "b-like") return "Closest teaching reference: Sample B-like";
      return "Closest teaching reference: Ambiguous";
    }

    function bars(vec, mode) {
      return (
        '<div class="lm-finger__channels">' +
        receptors
          .map(function (name, i) {
            var v = vec[i] || 0;
            var kept = mode === "sparse" && v > 0.12 ? " is-kept" : "";
            return (
              '<div class="lm-chan' +
              kept +
              '"><span class="lm-chan__lab">' +
              escapeHtml(name) +
              '</span><span class="lm-chan__track"><span class="lm-chan__fill" style="width:' +
              Math.round(clamp01(v) * 100) +
              '%"></span></span></div>'
            );
          })
          .join("") +
        "</div>"
      );
    }

    function paintHeat() {
      var head =
        '<thead><tr><th scope="col">Receptor</th>' +
        samples
          .map(function (s) {
            return (
              '<th scope="col"><button type="button" class="lm-matrix__pick" data-lab-pick="' +
              escapeHtml(s.id) +
              '">' +
              escapeHtml(s.name) +
              "</button></th>"
            );
          })
          .join("") +
        "</tr></thead>";
      var body = receptors
        .map(function (name, r) {
          var cells = samples
            .map(function (s) {
              var v = coded(s.id)[r];
              var pct = Math.round(clamp01(v) * 100);
              return (
                '<td><button type="button" class="lm-matrix__cell" data-lab-pick="' +
                escapeHtml(s.id) +
                '" style="--fill:' +
                pct +
                '" aria-label="' +
                escapeHtml(name + " · " + s.name) +
                '"></button></td>'
              );
            })
            .join("");
          return '<tr><th scope="row">' + escapeHtml(name) + "</th>" + cells + "</tr>";
        })
        .join("");
      heat.innerHTML =
        '<caption class="visually-hidden">Teaching heatmap of receptors by sample</caption>' +
        head +
        "<tbody>" +
        body +
        "</tbody>";
      Array.prototype.forEach.call(host.querySelectorAll("[data-lab-pick]"), function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-lab-pick") === state.sample);
      });
    }

    function paintStages() {
      var raw = coded(state.sample, "raw");
      var con = coded(state.sample, "contrast");
      var spa = coded(state.sample, "sparse");
      var refA = transformVector(sampleIndex.A.values, state.mode);
      var refB = transformVector(sampleIndex.B.values, state.mode);
      var current = coded(state.sample, state.mode);
      var verdict = teachingClass(current, refA, refB);
      var active = {
        raw: state.mode === "raw",
        contrast: state.mode === "contrast",
        sparse: state.mode === "sparse",
      };
      stages.innerHTML =
        '<div class="lm-stage' +
        (active.raw ? " is-on" : "") +
        '"><p class="lm-stage__kicker">Input</p><h3>Raw response</h3>' +
        bars(raw, "raw") +
        '</div><div class="lm-stage' +
        (active.contrast || active.sparse ? " is-on" : "") +
        '"><p class="lm-stage__kicker">AL-like processing</p><h3>Contrast-enhanced</h3>' +
        bars(con, "contrast") +
        '</div><div class="lm-stage' +
        (active.sparse ? " is-on" : "") +
        '"><p class="lm-stage__kicker">MB-like processing</p><h3>Sparse representation</h3>' +
        bars(spa, "sparse") +
        '</div><div class="lm-stage is-on"><p class="lm-stage__kicker">Output</p><h3>Conceptual class similarity</h3>' +
        '<p class="lm-lab__class">' +
        escapeHtml(classLabel(verdict)) +
        "</p><p>Illustrative educational classifier. No accuracy percentage is reported.</p></div>";
      if (out) {
        out.textContent =
          sampleIndex[state.sample].name +
          " after " +
          (state.mode === "raw"
            ? "no preprocessing"
            : state.mode === "contrast"
              ? "contrast only"
              : "contrast + sparse") +
          ". " +
          classLabel(verdict) +
          ".";
      }
    }

    function paint() {
      if (noiseLabel) noiseLabel.textContent = String(state.noise);
      paintHeat();
      paintStages();
    }

    host.addEventListener("change", function (event) {
      var t = event.target;
      if (t.name === "lm-lab-sample") state.sample = t.value;
      if (t.name === "lm-lab-ablate") state.mode = t.value;
      if (t.id === "lm-lab-noise") state.noise = Number(t.value) || 0;
      paint();
    });
    host.addEventListener("input", function (event) {
      if (event.target.id !== "lm-lab-noise") return;
      state.noise = Number(event.target.value) || 0;
      paint();
    });
    host.addEventListener("click", function (event) {
      var pick = event.target.closest("[data-lab-pick]");
      if (!pick || !host.contains(pick)) return;
      state.sample = pick.getAttribute("data-lab-pick");
      var radio = host.querySelector('input[name="lm-lab-sample"][value="' + state.sample + '"]');
      if (radio) radio.checked = true;
      paint();
    });
    if (qForm) {
      qForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var selected = qForm.querySelector("input[name='lm-lab-which']:checked");
        if (!selected) {
          if (qLive) qLive.textContent = "Choose one representation.";
          return;
        }
        Array.prototype.forEach.call(qForm.querySelectorAll("input"), function (input) {
          input.disabled = true;
        });
        var submit = qs("button[type='submit']", qForm);
        if (submit) submit.disabled = true;
        if (selected.value === "sparse") {
          qLive.textContent =
            "In this teaching sketch, contrast plus a sparse view often leaves A and B on different active subsets, while the mixture stays harder to assign. That is a cartoon of distinguishability. Robustness in the real AeroSense model still has to be demonstrated empirically.";
        } else {
          qLive.textContent =
            "Raw rows for A and B overlap on several channels; contrast helps but can still leave a mixture in between. A later sparse step can make the remaining difference easier to see here. None of these pictures prove a real model’s robustness — that has to be measured.";
        }
      });
    }

    paint();
  }

  function initConfusion(rootEl, store, rec, mod) {
    var host = qs("[data-confusion]", rootEl);
    if (!host) return;

    var copy = {
      tn: {
        title: "True negative",
        body: "The screen did not flag a batch that did not need extra scrutiny. Routine flow can continue. That still is not a legal safety certificate.",
      },
      fp: {
        title: "False positive",
        body: "The screen flagged a batch that confirmatory testing would not support as a problem. Consequence: potential unnecessary testing, holds, intervention, or waste.",
      },
      fn: {
        title: "False negative",
        body: "The screen missed a batch that deserved more scrutiny. Consequence: potential missed risk if nobody confirms by another path.",
      },
      tp: {
        title: "True positive",
        body: "The screen correctly prompted follow-up on a batch that deserved it. Screening did its job by triggering the next action — it still did not finish the chemical or legal question.",
      },
    };

    var live = qs("[data-conf-live]", host);
    host.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-quad]");
      if (!btn || !host.contains(btn)) return;
      Array.prototype.forEach.call(host.querySelectorAll("[data-quad]"), function (el) {
        el.setAttribute("aria-pressed", el === btn ? "true" : "false");
      });
      var item = copy[btn.getAttribute("data-quad")];
      if (live && item) live.textContent = item.title + ": " + item.body;
    });

    var form = qs("[data-threshold-form]", host);
    var box = qs("#lm-threshold", host);
    var saved = store.state.feedback && store.state.feedback.ACT_THRESHOLD_NOTE;
    if (box && saved && saved.text) box.value = saved.text;
    if (form && box) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        store.saveThresholdNote(store.state, box.value);
        if (mod && rec) {
          rec = store.saveReflection(store.state, mod.id, box.value);
        }
        var reflectBox = qs("#lm-reflect-text", rootEl);
        if (reflectBox && !reflectBox.value) reflectBox.value = box.value;
        qs("[data-threshold-live]", form).textContent =
          "Saved in this browser only. There is no universal numeric threshold in this lesson.";
      });
    }
  }

  function initQcDesk(rootEl, mod, store) {
    var host = qs("[data-qc-desk]", rootEl);
    if (!host) return;
    var spec = mod.interaction || {};
    var batches = spec.batches || [];
    var form = qs("[data-qc-form]", host);
    var err = qs("[data-qc-error]", host);
    var review = qs("[data-qc-review]", host);
    var live = qs("[data-qc-live]", host);
    var prior = store.state.feedback && store.state.feedback.ACT_QC_DECISIONS;
    var priorBatches = prior && prior.batches ? prior.batches : {};

    function actionLabel(id) {
      var i;
      var actions = spec.actions || [];
      for (i = 0; i < actions.length; i += 1) {
        if (actions[i].id === id) return actions[i].label;
      }
      return id;
    }

    function has(list, id) {
      return list && list.indexOf(id) !== -1;
    }

    function coach(batch, actionId) {
      if (has(batch.defensible, actionId)) {
        return "Defensible next action for this teaching file.";
      }
      if (has(batch.stretch, actionId)) {
        return "Extra caution. That can be reasonable, but this file still has not finished confirmatory chemistry.";
      }
      if (has(batch.over, actionId)) {
        return "This over-reads the screen — as if it already measured a toxin or finished a legal question.";
      }
      if (has(batch.under, actionId)) {
        return "This under-responds. Screening should still change the next action, especially when quality is poor or the band is not low.";
      }
      return "Screening should guide a next action, not pretend to replace confirmatory analysis.";
    }

    batches.forEach(function (batch) {
      var saved = priorBatches[batch.id];
      if (!saved) return;
      var radio = host.querySelector(
        'input[name="qc-' + batch.id + '"][value="' + saved + '"]'
      );
      if (radio) radio.checked = true;
    });

    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var choices = {};
      var missing = [];
      batches.forEach(function (batch) {
        var picked = form.querySelector('input[name="qc-' + batch.id + '"]:checked');
        if (!picked) missing.push(batch.name);
        else choices[batch.id] = picked.value;
      });
      if (missing.length) {
        if (err) err.textContent = "Choose an action for " + missing.join(", ") + ".";
        return;
      }
      if (err) err.textContent = "";
      store.saveQcDesk(store.state, mod.id, choices);
      batches.forEach(function (batch) {
        var note = qs('[data-batch-note="' + batch.id + '"]', host);
        if (!note) return;
        note.hidden = false;
        note.textContent =
          coach(batch, choices[batch.id]) +
          " You chose “" +
          actionLabel(choices[batch.id]) +
          ".” " +
          batch.note;
      });
      if (review) review.hidden = false;
      if (live) {
        live.textContent =
          "Recorded in this browser. No single action is the only responsible stamp. Compare how signal quality and risk band should change what you do next.";
      }
    });
  }

  function initFeedback(rootEl, mod, store) {
    var form = qs("[data-feedback]", rootEl);
    if (!form || !mod.feedback) return;
    var spec = mod.feedback;
    var otherBox = qs("#lm-feedback-other", form);
    var saved = store.state.feedback && store.state.feedback[spec.id];
    if (saved && Array.isArray(saved.selected)) {
      saved.selected.forEach(function (id) {
        var box = form.querySelector('input[name="lm-trust"][value="' + id + '"]');
        if (box) box.checked = true;
      });
    }
    if (otherBox && saved && saved.other) otherBox.value = saved.other;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var selected = [];
      Array.prototype.forEach.call(form.querySelectorAll('input[name="lm-trust"]:checked'), function (input) {
        selected.push(input.value);
      });
      var other = otherBox ? otherBox.value : "";
      if (!selected.length) {
        qs("[data-feedback-live]", form).textContent = "Select at least one option, or choose Other.";
        return;
      }
      store.saveFeedback(store.state, spec.id, { selected: selected, other: other });
      qs("[data-feedback-live]", form).textContent =
        "Saved in this browser only. It is structured for a later approved backend and was not sent anywhere.";
    });
  }

  function initPatternMatch(rootEl) {
    var host = qs("[data-pattern-match]", rootEl);
    if (!host) return;

    var mystery = [1, 5, 2, 4, 3];
    var options = [
      { id: "a", name: "Pattern A", bars: [4, 1, 5, 2, 1], match: false },
      { id: "b", name: "Pattern B", bars: [1, 5, 2, 4, 3], match: true },
      { id: "c", name: "Pattern C", bars: [2, 2, 1, 1, 4], match: false },
    ];

    function barsHtml(arr) {
      return arr
        .map(function (n, i) {
          return (
            '<span class="lm-bar"><span class="lm-bar__fill" style="height:' +
            n * 18 +
            '%"></span><span class="visually-hidden">Channel ' +
            (i + 1) +
            " level " +
            n +
            "</span></span>"
          );
        })
        .join("");
    }

    qs("[data-mystery-bars]", host).innerHTML = barsHtml(mystery);
    qs("[data-mystery-label]", host).textContent =
      "Mystery illustrative pattern across five channels: " + mystery.join(", ");

    var box = qs("[data-pattern-options]", host);
    box.innerHTML = options
      .map(function (opt) {
        return (
          '<label class="lm-pattern">' +
          '<input type="radio" name="pattern" value="' +
          opt.id +
          '">' +
          "<span><strong>" +
          escapeHtml(opt.name) +
          '</strong><span class="lm-bars lm-bars--mini">' +
          barsHtml(opt.bars) +
          "</span></span></label>"
        );
      })
      .join("");

    var live = qs("[data-pattern-live]", host);
    box.addEventListener("change", function (event) {
      var picked = options.filter(function (opt) {
        return opt.id === event.target.value;
      })[0];
      if (!picked || !live) return;
      live.textContent = picked.match
        ? "That choice matches the whole row. The tallest bar also appears in another pattern, so it could not name the odor by itself."
        : "That template shares a high bar, but the rest of the row does not match. Read the combination, not the spike.";
    });
  }

  function initDrawer(rootEl) {
    var dock = qs("[data-learn-dock]", rootEl);
    var drawer = qs("#learn-modules-drawer", rootEl) || qs("#learn-modules-drawer");
    if (!dock || !drawer) return;

    function openDrawer() {
      if (typeof drawer.showModal === "function") {
        if (!drawer.open) drawer.showModal();
      } else drawer.setAttribute("open", "");
      dock.setAttribute("aria-expanded", "true");
    }
    function closeDrawer() {
      var restore = document.activeElement && drawer.contains(document.activeElement);
      if (typeof drawer.close === "function" && drawer.open) drawer.close();
      else drawer.removeAttribute("open");
      dock.setAttribute("aria-expanded", "false");
      if (restore) dock.focus();
    }

    dock.addEventListener("click", function () {
      if (drawer.open) closeDrawer();
      else openDrawer();
    });
    var closeBtn = qs("[data-learn-drawer-close]", drawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    drawer.addEventListener("click", function (event) {
      if (event.target === drawer) closeDrawer();
    });
    drawer.addEventListener("close", function () {
      dock.setAttribute("aria-expanded", "false");
    });
  }

  function paintGain(rootEl, rec) {
    var section = qs("#lm-gain", rootEl);
    if (!section) return;
    if (rec.preScore == null || rec.postScore == null) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var delta = rec.postScore - rec.preScore;
    var deltaText = (delta >= 0 ? "+" : "") + delta + " percentage points";
    qs("[data-gain-pre]", section).textContent = rec.preScore + "%";
    qs("[data-gain-post]", section).textContent = rec.postScore + "%";
    qs("[data-gain-delta]", section).textContent = deltaText;
  }

  var root = window;

  document.addEventListener("DOMContentLoaded", function () {
    var Learn = root.AerosenseLearn;
    if (!Learn || !Learn.getModule || !Learn.STORAGE) return;

    var id = document.body.getAttribute("data-learn-module");
    var mod = Learn.getModule(id);
    var mount = qs("[data-learn-root]");
    if (!mod || !mount) return;

    var store = Learn.STORAGE;
    store.state = store.read();
    store.markInProgress(store.state, mod.id);
    var rec = store.getModule(store.state, mod.id);

    mount.innerHTML = renderPage(mod, store);
    initDrawer(document);
    initPatternMatch(mount);
    initReceptorMatrix(mount, mod);
    initOdorFingerprint(mount, mod);
    initPathway(mount);
    initMythCases(mount);
    initFoodInvestigate(mount, mod);
    initSensorBench(mount, mod);
    initContainment(mount);
    initPatternLab(mount, mod);
    initConfusion(mount, store, rec, mod);
    initQcDesk(mount, mod, store);
    initFeedback(mount, mod, store);
    if (mod.theme === "casefile") document.body.classList.add("page-learn-module--casefile");
    if (mod.theme === "bench") document.body.classList.add("page-learn-module--bench");
    if (mod.theme === "decode") document.body.classList.add("page-learn-module--decode");
    if (mod.theme === "qc") document.body.classList.add("page-learn-module--qc");

    var preMount = qs('[data-quiz="pre"]', mount);
    var postMount = qs('[data-quiz="post"]', mount);

    function runPost() {
      if (!postMount) return;
      var preDone = quizComplete(mod.quiz, rec.preAnswers);
      var postDone = rec.completed || quizComplete(mod.quiz, rec.postAnswers);
      if (!preDone && !postDone) {
        postMount.innerHTML =
          '<p class="lm-recorded" role="status">Complete the starting questions first. This check comes after the lesson. Explanations appear only here, not on the pre-test.</p>';
        return;
      }
      paintQuiz(
        postMount,
        mod.quiz,
        "post",
        rec.completed ? rec.postAnswers : {},
        function (answers) {
          rec = store.savePost(store.state, mod.id, answers, scoreAnswers(mod.quiz, answers));
          paintGain(mount, rec);
        }
      );
    }

    paintQuiz(preMount, mod.quiz, "pre", rec.preAnswers, function (answers) {
      rec = store.savePre(store.state, mod.id, answers, scoreAnswers(mod.quiz, answers));
      paintGain(mount, rec);
      runPost();
    });

    runPost();

    paintGain(mount, rec);

    var reflectForm = qs("[data-reflect]", mount);
    var reflectBox = qs("#lm-reflect-text", mount);
    if (reflectBox && rec.reflection) reflectBox.value = rec.reflection;
    if (reflectForm) {
      reflectForm.addEventListener("submit", function (event) {
        event.preventDefault();
        rec = store.saveReflection(store.state, mod.id, reflectBox.value);
        qs("[data-reflect-live]", reflectForm).textContent =
          "Saved in this browser only. It was not sent anywhere.";
      });
    }

    document.title = mod.title + " · Learning Lab · AeroSense · NTHU iGEM 2026";
  });
})();
