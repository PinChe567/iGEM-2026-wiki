# 04 — Labyrinth rendering (exploration shell)

**Product:** 暗域嗅蹤 / Scentbound Labyrinth — playable exploration shell  
**Rule source:** Prompt 03 map/core (`@suite/core/labyrinth`, `map-v1`)  
**Scope:** Canvas 2D client + vision pure functions; **no** Phaser/Pixi, **no** full NPC AI, **no** online networking.

## Coordinate systems

| Space | Units | Origin / notes |
|-------|-------|----------------|
| **Tile / world** | Continuous floats in tile units | Integer tile `(tx, ty)` covers `[tx, tx+1) × [ty, ty+1)`. Actor centers spawn at `spawn + 0.5`. +x east, +y south (row-major map). |
| **Facing** | Radians | `0` = +x (east), increases clockwise in screen space (canvas y grows downward). |
| **Screen** | CSS pixels | Camera centers on interpolated player; `screen = (world - camera) * TILE_SIZE * zoom + viewCenter`. |
| **Backing store** | Device pixels | `canvas.width/height = cssSize * min(devicePixelRatio, 2)`. Drawing uses `setTransform(dpr,…)`. |

`TILE_SIZE = 48` CSS px per tile at `zoom = 1`.

## Simulation timestep

- **Fixed step:** `1/60 s` (`FIXED_DT`).
- **Accumulator:** frame Δt clamped to `≤ 0.25 s`; while `acc ≥ DT`, call `tickExploration(session, intent, DT)`.
- **Render interpolation:** `alpha = acc / DT`; draw lerps `prevPosition → position`.
- **Authority:** UI never writes `player.position`. Input builds `ExplorationIntent`; core `tryContinuousMove` / `canPassGate` enforce walls, doors, and gates.

## Lighting / vision algorithm

Constants (core):

- Local halo radius **0.8** tiles (360°).
- Flashlight range **6** tiles, FOV **70°**.

Implementation: **grid ray marching** (`castRay` / `castVisibility` in `packages/core/src/labyrinth/vision.ts`).

1. Step along the ray in small increments (`0.05` tiles).
2. Stop at `collision === true` (walls) or max range.
3. Cone rays sample the flashlight wedge; halo rays sample a short omnidirectional ring.
4. Renderer fills a darkness overlay, then punches visibility with `destination-out` polygons from ray endpoints (**not** a CSS radial gradient that follows the sprite through walls).
5. `isPointLit` re-casts toward a point for actor visibility tests.
6. **Low-darkness** only lowers overlay alpha; actors behind walls / outside lit regions stay hidden.

Unit tests: `packages/core/src/labyrinth/vision.test.ts`.

## Gate presentation

Each gate draws **letter A–F** plus a distinct **shape** (circle / square / triangle / diamond / hex / cross). Pulse scales with time unless reduced-motion is on.

## Input map

| Desktop | Action |
|---------|--------|
| WASD / arrows | Move |
| Mouse aim / Q·R (or `,` `.`) | Facing |
| E / Space | Interact (doors, prompts) |
| Esc | Pause |

| Mobile | Action |
|--------|--------|
| Left virtual joystick | Move |
| Right aim pad drag | Facing |
| Interact button | Interact |

Controls use `env(safe-area-inset-*)`. Portrait shows “landscape recommended” but does **not** lock orientation.

## Accessibility

- Settings: low-darkness, high contrast, reduced motion (persisted in `suite.labyrinth.v1`).
- Live text summary outside canvas: current room, nearby exits, interactable.
- Keyboard-only path covers move, turn, interact, pause.

## Dev overlay

In `import.meta.env.DEV` only: FPS, ray count, room id, gate permission, position. Production builds omit it.

## Pause / resume

Leaving the tab (`visibilitychange`) or window blur auto-pauses. Resume shows a **3–2–1** countdown before sim continues.

## Performance measurement (how we measure)

| Check | Method | Status |
|-------|--------|--------|
| DPR / resize | Canvas CSS size vs backing store; visual no-stretch | Implemented in renderer |
| Desktop / mobile layout | Playwright viewport 1280×720 and 390×844 | Smoke covered |
| Flashlight occlusion | Vision unit tests + manual play | Unit tests pass |
| Keyboard-only | Manual / Playwright Esc + WASD | Smoke covered |
| **60 fps / 30 fps on mid-tier phones** | Needs device or remote browser profiling | **Not measured on real hardware this phase — do not claim fps targets as verified** |

Suggested future measurement: Chrome Performance panel or `requestAnimationFrame` frame-time histogram on a mid-tier Android + a recent desktop GPU, recording p50/p95 frame ms for 30 s of walking with default ray counts (48 cone + 24 halo).

## Package / app layout

| Path | Role |
|------|------|
| `packages/core/src/labyrinth/vision.ts` | Ray casting |
| `packages/core/src/labyrinth/exploration.ts` | Continuous move + session tick |
| `packages/core/src/labyrinth/storage.ts` | Local prefs |
| `apps/wiki-client/games/labyrinth/` | Canvas exploration shell |
| `apps/wiki-client/e2e/labyrinth-smoke.spec.ts` | Viewport / pause / hub smoke |

## Out of scope (explicit)

- Full NPC deliberation / animation systems  
- Online multiplayer  
- Procedural maps  
- Phaser / Pixi runtimes  
