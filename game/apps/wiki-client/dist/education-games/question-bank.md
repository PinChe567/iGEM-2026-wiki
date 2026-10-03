# Question bank

Stable IDs live in `packages/core/src/education/items.ts`. Prompts measure **concepts**, not AeroSense brand trivia.

Correct option for every scored item is **`b`**. Feedback / preference items are unscored (`correct` = null).

Pre items are reused after play as **post** (same ID, `phase: post`).

## Game 1 — Pixel

### G1-COMB-01 (pre / post)

**Measures:** Odor identity is a multi-receptor pattern, not a single receptor.

- EN: How is an odor’s identity shown in this game?
- ZH: 在這個遊戲裡，氣味的「身分」是怎麼表示的？

| Option | EN | ZH |
|--------|----|----|
| a | One receptor stands for one odor. | 一個受體代表一種氣味。 |
| b (correct) | A pattern across several receptors. | 幾個受體一起組成的圖案。 |
| c | The English name of the smell. | 氣味的英文名稱。 |
| d | How bright a single light is. | 一顆燈有多亮。 |

### G1-NOISE-01 (pre / post)

**Measures:** Noise can distract, but identity remains the overall pattern.

- EN: Some extra lights may flicker. What does that mean?
- ZH: 有些額外的燈可能會閃。這代表什麼？

| Option | EN | ZH |
|--------|----|----|
| a | The odor has changed into a new smell. | 氣味已經變成另一種。 |
| b (correct) | Noise can distract, but identity is still the overall pattern. | 雜訊可能干擾，但身分仍是整體圖案。 |
| c | Look only at the single brightest cell. | 只看最亮的那一格。 |
| d | The game is broken. | 遊戲壞了。 |

### G1-TRANSFER-01 (transfer)

**Measures:** Apply pattern comparison when two odors look similar.

- EN: Two smells look similar, but a few receptors differ. What should you compare first?
- ZH: 兩種氣味看起來很像，但少數受體不一樣。你應該先比什麼？

Correct: **b** — the full receptor patterns (not the strongest single receptor, not the brand name).

### G1-FEED-01 (feedback, optional, unscored)

What was most confusing or most useful? Options: visuals / instructions / idea / skip.

## Game 2 — QC Shift

### G2-SCREEN-01 (pre / post)

**Measures:** Screening is an early warning, not confirmatory diagnosis.

- EN: A screening alert means:
- ZH: 篩檢警報的意思是：

Correct: **b** — an early warning that may need follow-up, not a final confirmation.

### G2-QC-01 (pre / post)

**Measures:** Invalid or uncertain measurements need appropriate follow-up.

- EN: If a reading is invalid or very uncertain, what is appropriate?
- ZH: 若讀數無效或很不確定，怎麼做才合適？

Correct: **b** — follow up (retest or confirmation) instead of trusting it.

### G2-TRANSFER-01 (transfer)

**Measures:** Apply screening-vs-diagnosis to an invalid follow-up reading.

Correct: **b** — use follow-up because screening is not diagnosis.

### G2-FEED-01 / G2-ALERT-01 (optional, unscored)

Feedback; plus preferred alert information (risk / confidence / quality / next step / skip).

## Game 3 — Scent Mixer

### G3-MIX-01 (pre / post)

**Measures:** Mixtures can create overlapping receptor-response patterns.

- EN: When two odors mix, receptor-response patterns:
- ZH: 兩種氣味混在一起時，受體反應圖案會：

Correct: **b** — can overlap, so the mix is not a simple single-odor fingerprint.

### G3-DECODE-01 (pre / post)

**Measures:** Computational decoding helps separate similar overlapping patterns.

- EN: Why is computational decoding useful here?
- ZH: 為什麼計算解碼在這裡有用？

Correct: **b** — it helps separate similar overlapping patterns.  
Wrong options include “proves real warehouse gas concentrations” (do not treat as sensor validation).

### G3-TRANSFER-01 (transfer)

**Measures:** Compare mixture candidates and ratios, not a single peak.

Correct: **b**.

### G3-FEED-01 (optional, unscored)

What was most confusing or most useful?

## Scoring rule

`scoreEducationAnswer(id, answer)` returns `true` / `false` for scored items and `null` for optional feedback. Do not recode answers to invent improvement.
