# 03 — Scentbound Labyrinth rules (暗域嗅蹤)

**Product:** 暗域嗅蹤 / Scentbound Labyrinth  
**Scope of this document:** pure core + content + map validator (no full Canvas client, no NPC animation, no online networking).  
**Model flag:** `fictionalModel=true` — A–F are **fictional receptor gates**, not wet-lab OR affinities.

## MVP constraints

- 4–8 players, each with a **unique odor identity**.
- Exactly **one** player also carries the **phantom** role.
- **No kills, no eliminations, no free chat.**
- One **hand-authored** tile map (`mapVersion 1.0.0`); no procedural generation.
- Official offline cases must be **uniquely solvable** from full obtainable evidence. Multi-solution seeds are **rejected**, never silently disambiguated.

## Phase flow

```
briefing → explore → review1 → explore → review2 → finalVerdict → debrief
```

| Phase | Purpose |
|-------|---------|
| `briefing` | Private role / gate card |
| `explore` (×2) | Movement, tasks, phantom abilities |
| `review1` / `review2` | Inspect accumulated evidence |
| `finalVerdict` | Accuse phantom (optional full identity map) |
| `debrief` | Reveal truth + win side |

**Win:** Investigators win if the accused phantom (and optional identity map) matches truth; otherwise phantom wins. Timer expiry on `finalVerdict` without a submission counts as phantom escape.

## Odor identities (gate table)

| Identity | Gates | Notes |
|----------|-------|-------|
| Banana | A B D | Fictional triple |
| Lemon | A C F | Fictional triple |
| Rose | B C E | Fictional triple |
| Coffee | B D F | Fictional triple |
| Mint | A C E | Fictional triple |
| Garlic | D E F | Fictional triple |
| Peach | A E F | Fictional triple |
| Pine | B C D | Fictional triple |

Each identity has a **unique** unordered triple. Knowing a player's three gates identifies their odor.

## Map legend (`packages/core/src/labyrinth/map/map-v1.json`)

| Glyph / kind | Meaning |
|--------------|---------|
| `#` / `wall` | Collision blocked |
| `.` / `floor` | Walkable |
| `A`–`F` / `gate` | Receptor gate; requires authorized identity **or** active phantom `phaseShift` |
| `D` / `door` | Toggleable door (must not permanently trap) |
| `S` / `spawn` | Player spawn (Chebyshev distance \> `visionRadius` from other spawns) |
| `T` / `task` | Task node inside a gated room |
| `C` / `scanner` | Channel / scanner room marker |
| `R` / `review` | Review room |

Stable ids exist for every **tile**, **gate**, and **room**. Neutral corridor + central + ~10 rooms are present. Task rooms are sealed so the **only** legal entry is the matching gate.

### Reachability rules (validator)

For every odor identity and every spawn:

1. Can reach **central**.
2. Can reach **review room**.
3. Can reach at least **3 legal tasks** (tasks whose `requiredGateId` is in the identity's triple).

Additionally: every door open/closed mask must leave central + review reachable; gates A–F all appear; collision layer matches walls.

## Movement & authority

Pure functions in `@suite/core/labyrinth` decide every step:

- Walls / closed doors block.
- Gates call `canPassGate` — **clients cannot bypass by editing UI**.
- Unauthorized gate + non-phantom → rejected.
- Phantom without active `phaseShift` → rejected (`phase_shift_required`).
- Phantom with active `phaseShift` → allowed, **`artifactRequired: true`** (must call `leavePhaseShiftArtifact`).

## Phantom abilities

| Ability | Effect | Cooldown | Side effect |
|---------|--------|----------|-------------|
| `phaseShift` | Briefly pass unauthorized gates | **25 s** | **8 s** `artifactTrace` on the gate tile |
| `signalJam` | Corruption window on scanner/channel evidence | **45 s** | Evidence in window marked `reliability: 'corrupted'` (ignored by solver; **MVP does not random-lie**) |

Active window lengths live in `constants.ts` (`PHASE_SHIFT_DURATION_MS`, `SIGNAL_JAM_DURATION_MS`).

## Evidence types

Every event carries `source`, `timeWindow`, and `reliability` (`hard` \| `soft` \| `corrupted`):

| Type | Constraint on solutions |
|------|-------------------------|
| `observedGateUse` | Player's odor owns the gate **or** player is phantom |
| `doorLog` | Soft log; no odor constraint in MVP |
| `positiveChannel` | Player's odor owns the gate |
| `negativeChannel` | Player's odor does **not** own the gate |
| `artifactTrace` | Player **is** the phantom |
| `taskPresence` | Player owns required gate **or** is phantom |

## How evidence forms a unique solution

1. **Identity:** Full channel coverage (positive for the three owned gates + negative for the other three) pins each player to exactly one odor triple.
2. **Phantom:** An `artifactTrace` (or unauthorized passage only explainable by phantom) pins which player holds the phantom role.
3. **Solver:** `enumerateSolutions` lists **all** consistent assignments. Official generator requires `count === 1` and matching truth; otherwise it **rejects the seed** and retries — it never picks among ties.

Offline case schema fields: `seed`, player/NPC roles, phantom id, task placement, evidence events, truth, plus `contentVersion` / `gameVersion` / `mapVersion` / `schemaVersion`.

## What is fictional (science limits)

- Gates **A–F** are game tokens, not real olfactory receptor subtypes.
- Channel / scanner “readings” are **game evidence**, not AeroSense or wet-lab measurements.
- Phantom abilities are **mechanics**, not biological claims.
- See `@suite/content` `labyrinthContentCatalog.scienceLimits` and `modelDisclaimer`.

## Dev-only UI

`apps/wiki-client/games/labyrinth-validator/` — map validator page (tiles, rooms, gates, reachability overlay). **Not** the full game client.

## Package layout

| Path | Role |
|------|------|
| `packages/content/src/labyrinth` | Role schema, bilingual copy, science limits |
| `packages/core/src/labyrinth` | Types, state machine, map, movement, phantom, solver, case generator |
| `docs/03-labyrinth-rules.md` | This file |
