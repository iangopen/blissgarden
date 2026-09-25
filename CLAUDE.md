# Bliss Farm — Project Context

## What this is
A browser-based incremental farming game, built with Vite from plain JavaScript ES modules. Hosted on GitHub Pages at `/blissgarden/`.

## Stack
- Plain JS (ES modules) + CSS, bundled by Vite. No frameworks. TypeScript is the next step (Phase 2b).
- `public/sprites.png` — crop sprite sheet (23 crops + 3 ascension crops × 3 stages: seed, sprout, grown)
- `localStorage` for all save data (key `blissfarm10`)

## Commands
```
npm install              # once
npm run dev              # dev server   → http://localhost:5173/blissgarden/
npm run build            # production build → dist/  (never docs/)
npm run preview          # serve dist/  → http://localhost:4173/blissgarden/
npm run smoke            # build + headless-Chrome regression test — run before every commit
npm run smoke -- --dev   # same checks against the dev server
```
- **Browser:** the smoke test drives your installed Chrome through puppeteer-core. Set `CHROME_PATH` if it isn't found.
- **Fails on:** any assertion, console error, page error or failed request.
- **Covers:**
  - loading `tests/fixtures/legacy-v1.json` (an unversioned blissfarm10 save) and `v2.json`
  - the full Phase 1 checklist with real clicks
  - every shop button, every event chance, and export/import
- **Goldens:** the `*.expected.json` files were recorded from the last classic-script build (phase1 `e1dbf73`) with `node scripts/smoke/run.mjs --static <old checkout> --legacy --record`. Re-record only for an intentional behaviour change.

## File structure
```
index.html            ← markup; loads /src/css/*.css in <head> and one module, /src/main.js
vite.config.js        ← base '/blissgarden/', build → dist/
src/main.js           ← entry: start() runs every load-time side effect in order, then init()
src/core/bus.js       ← EventBus, TimerManager (no dependencies)
src/data.js           ← balance data: seeds, bags, items, upgrades, stages, recipes, perks, blueprints, BALANCE.events
src/state.js          ← STATE root (`state` is STATE.run), `ui` (nextId, selectedTile, panelExpanded, panelWidth), sprite helpers
src/save.js           ← save() / load(), migrate(), export / import, disableSaving()
src/upgrades.js       ← recalculateModifiers, growth speed, eventChance(), applyUpgrade() (the purchase path)
src/daynight.js       ← day/night growth multiplier (logic; RenderEnv only draws the sky)
src/engine.js         ← startEngine() (timer registrations + 50 ms tick), setupTimers(), the display tick
src/events/index.js   ← coins/stages, tile actions (onTileDown, water, tile menus, openBag, dropLoose)
src/events/*.js       ← event logic per threat (crow/hawk, mole, blight+rot cure, fungal, weeds, stage 4, stage 5, sell box)
src/render/*.js       ← DOM rendering (farm, panel, seeds, items, upgrades, sellbox, crafting, …)
src/*.js              ← crafting, artifacts, achievements, prestige, seasons, trading post, minigames, tutorial, audio (Sfx), debug
src/consoleApi.js     ← all exports in one object; published as window.__bliss only while debug mode is on
src/css/              ← base, effects, farm, ui
public/sprites.png    ← served at /blissgarden/sprites.png (use SPRITE_URL from state.js, never a literal path)
scripts/smoke/        ← smoke test (run.mjs, pageFns.mjs, chrome.mjs)
tests/fixtures/       ← fixture saves + golden expectations for the smoke test
tools/                ← sprites.js, Crop Sprite Sheet.html (reference only, not bundled)
.github/workflows/pages.yml ← on push to main: npm ci, build, deploy dist/ to Pages
docs/AUDIT.md         ← codebase audit and phased roadmap
CLAUDE.md             ← this file
```

## Core systems
- **Farm grid**: starts 3×3, expandable via upgrades. Brown tiles with thin green outline.
- **Seeds**: bought from shop → go to inventory → dragged onto tile to plant
- **Seed bags**: purchasable bags that randomly give 3 seeds with weighted odds
- **Crops**: grow over time on tiles (sprout sprite while growing, grown sprite when ready)
- **Harvesting**: click ready tile → crop attaches to mouse → drag to sell box or inventory
- **Sell box**: wooden crate, bottom-center. Queues crops, auto-sells 1 per interval (FIFO). Upgradeable to iron/steel/titanium/diamond (sells multiple at once).
- **Crank**: optional mechanical crank next to sell box. Each click multiplies sell speed by a factor. Decays over time.
- **Inventory**: right panel. Shows seeds (draggable to tiles) and harvested crops (draggable to sell box). Items also stored here.
- **Right panel**: resizable, collapsible. Sections: Seeds → Seed Bags → Items → Upgrades → Inventory
- **Upgrades**: chained (next hidden until previous bought). Chains: speed, value, sell speed, crank, plot expansion, sell box tier.
- **Items**: Watering Can (click can in inventory to fill, waters one tile), Cage (crow protection), Common Fertilizer (permanent plot buff), Uncommon Fertilizer (stronger permanent plot buff)
- **Status log**: bottom-left, logs game events
- **Stage display**: top-center. Stage 0: Birth → Stage 1: Awakening at **50,000 coins held** (stages trigger on coins currently held and never go back down; thresholds in `STAGES`, `data.js`)
- **Mature state**: turns on when Stage 1 is reached. Enables crow attacks and weed spawning.
- **Crows**: 5% chance every 10s to steal a crop. Prioritize ground crops (highest value first).
- **Weeds**: 12% chance every 8s to spawn on empty tile. Click 20 times to clear.

## Palette
- Sky blue background: `#87CEEB`
- Brown tiles / panels: `#8B6343` range
- Green grass/outlines: `#5A8A3C`
- White text on dark panels

## Sprites
- Sheet: `sprites.png`, 192×1792px, 64×64 per cell (28 rows × 3 cols)
- Crop rows 0–22, 3 cols (seed=0, sprout=1, grown=2); ascension crops reuse rows 2, 4, 6
- Row order starts: potato, carrot, wheat, sunflower, pumpkin, chard, moonbloom, starfruit, thornvine, glowshroom, voidbloom, aetherfern, solarspike (full map: `ROW_MAP`, `data.js`)
- Helper: `getSpriteStyle(cropId, stage)` returns CSS for background-image sprite cutout

## Conventions
- Never break existing save/load logic
- All timers update every 50ms (1/20th second)
- Growth speed upgrades apply proportionally to in-progress crops
- All speed/value upgrades are multiplicative and stack
- No hard minimum on grow time or sell interval (allow sub-second decimals)
- Log important events to status panel
- Show banner announcements for major world state changes
- ES modules only: every cross-file name is an explicit `export`/`import`. No game code on `window`; the one exception is `window.__bliss`, set by DebugPanel while debug mode is on.
- **No import-time side effects.** A module's top level only declares things. Timers, document listeners, EventBus subscriptions and init all run from `start()` in `src/main.js`, in this order:
  1. `startEngine`
  2. `startAchievements`
  3. `startDragSystem`
  4. `Sfx.start`
  5. the resize listener
  6. `RenderFarm.start`, `RenderCrafting.start`, `RenderPanel.start` (subscriptions)
  7. `DebugPanel.setConsoleApi`
  8. `init()`

  Listeners run in registration order, so put new ones in the right place.
- Imported bindings are read-only. Shared mutable values live on an object (`ui.nextId++`, not `nextId++`).
- Logic modules must not start importing render modules. Emit an EventBus event and subscribe in the render module's `start()` (see "Module boundaries").
- Asset URLs go through `import.meta.env.BASE_URL` (`SPRITE_URL`), so they work under `/blissgarden/` in dev and build.
- Sound effects are `Sfx` (`audio.js`). `window.Audio` is the browser's constructor and is left alone.
- Upgrade and item purchases go through `applyUpgrade(id)`, perks through `buyPerk(id)`, ascension seeds through `buyAscensionSeed(key)`. They recalculate modifiers and save. Render files call them and redraw; they never write upgrades, items or perks themselves.
- Event spawn rolls use `Math.random() < eventChance(id)`. Base chances, intervals and mitigation values live in `BALANCE.events` (`data.js`).
- Save format changes bump `SAVE_VERSION` and add a step to `migrate()` (`save.js`). The key stays `blissfarm10`.

## Module boundaries (AUDIT D7 cycle breaks)
Each break replaces a direct call with a synchronous EventBus emit at the same point, so behaviour and ordering are unchanged.

| D7 cycle | How it was broken |
|---|---|
| events/* ↔ render/farm | events/* emit `tile:changed` (idx), `grid:changed`, `loose:changed` and `harvest:pop` ({x,y,seed}); `RenderFarm.start()` subscribes. `dropLoose` (a state change) moved to events/index.js and emits `loose:dropped` (id). `VOID_RIFT_CLICKS` moved to data.js. |
| drag ↔ render/farm | drag emits `tile:changed`, and finds tiles with `document.querySelectorAll('#farm-grid .tile')` instead of `RenderFarm.tileNodes`. |
| crafting ↔ render/crafting | crafting.js emits `crafting:changed` ({onlyIfOpen}) and `inventory:changed`; `RenderCrafting.start()` and `RenderPanel.start()` subscribe. |
| prestige ↔ render/panel | `buyPerk` emits `perk:purchased`; `RenderPanel.start()` re-renders the prestige panel. |
| render/inventory ↔ render/crafting | `renderInventory` emits `inventory:rendered`; `RenderCrafting.start()` refreshes its panel. |
| seasons ↔ render/environment | `getDayNightMult` (growth logic) moved from render/environment.js to src/daynight.js. upgrades.js and debug.js import it from there. |
| render/inventory ↔ render/seeds, artifacts ↔ render/artifacts | Already gone after phase 1b/1c (verified by the import-graph scan). |
| save ↔ everything | save.js imports only state.js and data.js. |

An import-graph scan confirms no D7 pair has a logic→render edge left.

**Remaining cycle (not in D7, left for Phase 3):** 24 modules still form one import cycle through these logic→render imports:
- `events/index` → RenderHUD, RenderPanel (`updateCoins`)
- `achievements` → RenderPanel
- `events/sellTick` → RenderPanel, RenderSellbox, showPop
- `drag` → RenderPanel, RenderSellbox
- `engine` display tick → RenderFarm, RenderCrafting, RenderSellbox, RenderEnv
- `tradingPost` → RenderCrafting, RenderPanel

They are safe because nothing runs at import time (every call happens after `start()`), and the smoke test would catch a load-time error.

## Real (verified working)
_Items marked ▶ are checked by `npm run smoke` (headless Chrome, module build, 2026-09-24). The rest were verified by reading the code. Detail in [docs/AUDIT.md](docs/AUDIT.md)._
- ▶ Vite + ES modules (phase 2a):
  - A legacy v1 save and a v2 save load to exactly the same state as in the last classic-script build (every saved field compared).
  - The Phase 1 checklist, every buy button, every event chance and export/import all match that build.
  - Sprites load under `/blissgarden/` in dev and build.
- ▶ `window.__bliss` exists only while debug mode is on.
- Crop growth uses `burnedSeconds` (`engine.js` display timer). Water, fertilizer, uncommon fertilizer and rot all change the speed through `getEffectiveSpeedMult` (`upgrades.js`), which reads the same `state.*` maps the game writes. `plantedAt` only seeds `burnedSeconds` for tiles from old saves.
- ▶ One state root: `state` is `STATE.run`, and `STATE.upgrades` is a view of `STATE.run.upgrades`, so they are always the same object.
- ▶ `state.coinsEarned` is the single all-time earnings counter (milestones, achievements, reputation, prestige). Loading also accepts the short-lived `allTimeGold` save key.
- ▶ Stage survives a reload (saved as `stage`; `stagesSeen` backfilled).
- ▶ Buying any upgrade, item or perk recalculates modifiers straight away (e.g. a value upgrade changes sell value at once). All of them go through `applyUpgrade` / `buyPerk`.
- ▶ Save version 2: saves carry `version: 2` and `lastSeen`. `migrate()` upgrades unversioned `blissfarm10`/`blissfarm9` saves with no loss, and v2 keeps the flat layout so older builds can still read it.
- ▶ Settings > Data has Export save (base64, copied to clipboard) and Import save (accepts base64 or the raw localStorage JSON, validates, migrates, reloads). Export → import round-trips to an identical state.
- ▶ Every event roll reads `STATE.modifiers.eventResistance` through `eventChance()`. Thick Skin lowers all 15 rolls, and the debug panel shows each event's live chance. Without Thick Skin every chance is unchanged from before.
- ▶ Prestige perks read `prestige.perks[id] × valuePerStack`; Head Start gives 2,000 per stack.
- ▶ A crafted item in the sell queue keeps its `crafted` flag through a reload and sells; unknown sell-queue ids are skipped and logged instead of freezing the tick.
- ▶ Harvest, weed/thorned-weed clear and rot cure (menu and Fast Cure) increment `stats.totalHarvested`, `weedsCleared` and `rotCured`, so those achievements and the Moon Shrine blueprint unlock.
- ▶ Desktop can drop harvested crops into the inventory panel.
- ▶ Locust sets back 30% (15% with Crop Shield) of `burnedSeconds`. Hired hands are refunded on a failed drop. The seed shop shows grow time ÷ speed.
- ▶ Watering emits `crop:watered`, gives +33% speed and ×1.25 value; watering twice drowns the crop.
- Weeds and thorned weeds can be cleared by clicking. Mounds, void rifts and claimed-tile reclaim work (`events/index.js` `onTileDown`).
- The sell box sells first-in, first-out, several items at once with capacity upgrades, and the crank boost and decay work.
- Crafting queue timing, recipe unlocks (free, prestige and achievement) and crafted-item selling all work.
- Artifacts apply through `recalculateModifiers` → `applyArtifacts`.
- Seasons, weather (drought, rain, frost) and the day/night cycle work.
- The trading post rotates hourly, and purchases and the mystery box work.
- Minigames (Soil Mixer, Water Flow) pay out rewards and track play counts.
- Reset Data removes only this game's localStorage keys.
- Every `state` field is saved and loaded, except the items listed under Still open.

## Phase status
**Phase 1 (Stabilize) is complete** on the `phase1` branch (1a bug fixes, 1b dedupe/dead code/single root, 1c save v2/purchase routing/event resistance).
**Phase 2a (Vite + ES modules) is done** on the `phase2` branch. Next is 2b, TypeScript.

Nothing gets merged to `main` until it has been play-tested. At merge time, switch Settings → Pages → Source to "GitHub Actions" so pages.yml deploys `dist/`.

Phase 1 leftovers, deliberately not changed:
- Stages trigger on **coins held**, a decision made in session 1a. The roadmap's "one counter for stages, achievements and reputation" would switch stages to `coinsEarned`, which is a one-line change in `checkStages` if wanted.
- Void rift has an `eventResistance` entry, but only Thick Skin lowers it. No upgrade reduces its spawn chance (Time Dilation, Rift Stabilizer and Void Seal act on drain and count).
- Seed and bag purchases (`render/seeds.js`) and trading-post deals still run inside UI code. They spend coins but touch no upgrades or perks.
- Other balance numbers from AUDIT D5 are still spread across files: cure costs, cage block rolls, weather, trading post, prestige formula and achievement thresholds.

## Still open (known broken or unverified)
_Full list and roadmap are in [docs/AUDIT.md](docs/AUDIT.md); its file:line references predate the move from js/ to src/. Work happens on phase branches. GitHub Pages deploys from `main`, so never push unfinished work there._
- **New players never see the "name your farm" prompt.** `#name-overlay` came after the classic `<script>` tags, so `init()` never found it. The module move would have made the prompt appear, so the call was removed to keep behaviour identical. `showFarmNameOverlay` is still in main.js, just unreachable; the fix is to call it again for new games.
- **`lastSeen` is saved but nothing reads it yet.** Offline progress is Phase 3.
- **The game runs on two clocks.** The 50 ms tick drives growth, selling and events, while `Date.now()` drives rot, claims, crafting and seasons, so they drift apart in background tabs. There is no offline progress.
- **Plot expansion shifts crop positions** (flat tile array indexed by column count). The prestige Extra Plot perk sets expansion flags without the upgrade, so Expand Plot can be re-bought for nothing.
- **Mystery Box payouts count toward all-time earnings.** Merchant's Bag can give ascension seeds.
- **Minor:** hired-hand harvests don't count toward stats; water and fertilizer descriptions understate their effect; `var(--pw)` is undefined (`effects.css`); the crafting modal is rebuilt on every inventory render; every weed click saves.
