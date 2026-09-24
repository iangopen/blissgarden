# Bliss Farm — Codebase Audit & Roadmap

_Audit date: 2026-09-24. Read-only audit; no game code was changed. Everything was verified by reading the code, not by running the game; items marked ⚠ need a runtime check._

## Scope & method
Goal: an accurate map of what is real before any refactor, covering state integrity, dead/duplicate code, sim-vs-render coupling, clocks, balance data location, save schema, migration readiness, and a bug list. No game code was changed.

**Method.** Every file was read in full: `index.html`, all 43 files under `js/` (including `js/render/*` and `js/events/*`), and all 4 files under `css/`. Counts come from ripgrep over `js/` (commands are in the Verification section). The game was **not run in a browser**. Every finding below comes from reading the code. Items marked ⚠ should be confirmed at runtime.

**Headline correction to the starting hypothesis** (that water, fertilizer and rot silently do nothing). `getEffectiveSpeedMult` (`js/upgrades.js:23-40`) reads `state.tilesWatered`, `state.fertilizedTiles`, `state.uncommonFertilizedTiles` and `state.rotTiles`. Those are the same maps the game writes (`render/farm.js:15`, `drag.js:330,352`, `blight.js:103`). So **water, fertilizer and rot DO change growth speed.** The part that silently does nothing is the *other* set of helpers: `waterFactor`, `fertFactor`, `rotFactor` and `adjustGrowTimes` (`upgrades.js:4-19,64-78`). They read `STATE.plots`, and nothing ever assigns to it, so they always return 1.0 or do nothing. Their only effect is to rebase `td.plantedAt`, which is legacy data.

---

## A. Findings

### Exact counts
| Metric | Count |
|---|---|
| lowercase `state.` occurrences | **1,180** (859 lines, 35 files). Top files: `render/farm.js` 156, `drag.js` 115, `events/index.js` 89, `events/stage5.js` 78, `events/stage4.js` 77 |
| `window.state.` occurrences | 20. All are in `engine.js` inside `applyOfflineProgress`, which is dead code |
| `STATE.` occurrences | 377 |
| Explicit `window.X =` globals | **52**, plus 1 `Object.defineProperty(window,'drag')` (`drag.js:4`) = **53** |
| Implicit globals: top-level `function` declarations | 135 declarations, **124 unique names** (11 names are declared twice) |
| Implicit globals: top-level `var` | 14 names (`state, nextId, selectedTile, panelExpanded, panelWidth, crankMult, crankAngle, prevReadyState, resizing, resizeStartX, resizeStartW, resizeMoved, sfx, logEntries`) |
| Top-level `const` shared across scripts (these are not on `window`) | 17 (`ROW_MAP, COL_MAP, ITEM_ROW_MAP, ITEM_COL_MAP, ITEM_ICONS, MILESTONE_VALS, STAGES, WEED_CLICKS, THORNED_WEED_CLICKS, _stage, VOID_RIFT_CLICKS, KEY, KEY_OLD, SAVE_VERSION, SAVE_KEY, OLD_KEY, SHEET_ROWS`) |
| `setInterval(` | **5**: `engine.js:50`, `debug.js:228`, `minigames.js:389`, `tradingPost.js:579`, `tutorial.js:215` |
| `setTimeout(` | **26** across 14 files |
| `Date.now()` | **101** across 23 files |
| `Math.random()` | 91 (none of it is seeded) |
| `requestAnimationFrame` / `performance.now` | 7 / 2 (visual only) |
| TimerManager timers | 28: 17 registered at load (`engine.js:57-73`) and 11 in `setupTimers` (`engine.js:277-316`), all driven by one 50 ms interval |
| `save()` occurrences | 110 |

### D1. State integrity — two parallel stores
`state` (`state.js:111`) is the real source of truth for gameplay. `STATE` (`state.js:1`) holds modifiers, meta, settings and prestige, plus many shadow fields that nothing uses.

| Item | Class | Evidence |
|---|---|---|
| `state` (the whole flat object) | **BRIDGE** | Holds all live farm data; saved by spreading it (`save.js:6`) |
| `STATE.plots` | **DEAD, and a LIVE BUG in its consumers** | Never assigned. `waterFactor/fertFactor/rotFactor` (`upgrades.js:4-19`) always return 1. `adjustGrowTimes` (`upgrades.js:64-78`, called at `render/upgrades.js:19`) does nothing. The offline crop count (`engine.js:107`) is always 0 |
| `STATE.meta.allTimeGold` vs `state.coinsEarned` | **LIVE BUG** | Two separate counters. `checkStages` uses `allTimeGold` (`events/index.js:31`), but it is **never saved or loaded** (`save.js:6`, `save.js:9-137`), so it resets to 0 on every reload. Achievements, overlays and reputation use `coinsEarned` |
| `STATE.upgrades` vs `state.upgrades` | **BRIDGE with a LIVE BUG** | The two are the same object only after `load()` (`save.js:34`) or `prestige()` (`prestige.js:115`). On a brand-new game they are separate objects (`state.js:22` vs `state.js:125`), so `recalculateModifiers`, `canCapacity`, `checkFreeRecipes` and `craftItem` never see purchases made during the first session |
| `STATE.meta.gold` | DEAD mirror | Written in `prestige.js:52,125`, `debug.js:25,75`, `engine.js:146`. Never read. `state.coins` is the live balance |
| `STATE.meta.matureState` | DEAD mirror | `events/index.js:43`, `prestige.js:55`. `state.mature` is the live flag |
| `STATE.meta.gameStartTime`, `state.gameStartTime` | DEAD | Saved and loaded, never read |
| `STATE.meta.lastSeen` | DEAD | Read at `engine.js:83`, never written |
| `STATE.sellQueue`, `STATE.inventory.{seeds,crops,items}`, `STATE.fallenCrops` | DEAD | Used only by the dead offline path, or not at all |
| `STATE.milestones` | DEAD | Offline path only (`engine.js:166-169`). `state.milestones` is live |
| `STATE.events.*` | DEAD | Reset in `prestige.js:109`, never read. `state.first*Ever` is live |
| `STATE.settings.hidePurchased` | DEAD | `state.hideBoughtUpgrades` is live (`render/upgrades.js:58`) |
| `STATE.stats` | DEAD junk | Created at `prestige.js:33`. `state.stats` is live |
| `crankMult` (`state.js:147`) | DEAD | Written at `engine.js:194,311`, `sellbox.js:93`, `prestige.js:120`. Read only by `getSellInterval` (`upgrades.js:58`), which is never called. `STATE.session.crankMultiplier` is live |
| `STATE.modifiers.crankMultiplier` | DEAD | Never read |
| `state.sellNextAt` | DEAD | Sell timing actually uses `STATE.session.sellElapsed` (`engine.js:318`) |
| `DIRTY.*` (`state.js:101`) | DEAD | Written 15 times, read 0 times |
| `logEntries`, `STATE.session.log` | DEAD | Written in `render/log.js:141-146`, never read |
| `window.drag` | BRIDGE | Getter/setter over `STATE.session.dragItem` (`drag.js:4-7`) |
| `sfx` | BRIDGE (declared twice) | Identical copies at `events/index.js:2` and `audio.js:4` |
| `panelExpanded` | **LIVE BUG** | Only set true when the mobile panel opens (`main.js:383`), yet it gates drop-to-inventory (`drag.js:106,132,191`). ⚠ On desktop, harvested crops can never be stored in inventory, so crop-based crafting is effectively blocked |
| `selectedTile`, `prevReadyState`, `resizing*`, `crankAngle`, `nextId`, `panelWidth` | Live UI/session state | — |
| Module-private logic state | Not saved | `Seasons._firstDrought/_firstRain/_last*Check` (`seasons.js:14-18`) and `RenderEnv.prevTod` (`environment.js:26`) |

### D2. Dead and duplicate code
**Functions declared twice.** Each name below is declared as a global function in two classic scripts, so the one loaded later wins (load order is `index.html:230-269`):

| Function | Loser | **Runtime winner** | Consequence |
|---|---|---|---|
| `onTileDown` | `events/index.js:161` | `render/farm.js:188` | The winner never increments `stats.totalHarvested`, `weedsCleared` or `rotCured`. The loser handled those (`index.js:178,194,230,264`) |
| `applyWater` / `drownTile` | `events/index.js:68,84` | `render/farm.js:4,22` | Only the winner emits `crop:watered` |
| `showRotCureMenu` | `events/blight.js:2` | `render/farm.js:123` | The winner never increments `rotCured` |
| `showFungalCureMenu` | `events/fungal.js:2` | `render/farm.js:159` | identical |
| `showTileMenu` | `events/index.js:131` | `render/farm.js:82` | The winner adds hired-hand removal |
| `deselect`, `hideTileMenu`, `addInventory` | `events/index.js` | `render/farm.js` | identical |
| `openBag` | `events/index.js:105` | `render/seeds.js:2` | Same logic |
| `showPop` | `render/farm.js:332` | `render/sellbox.js:104` | identical |

**Never called:** `applyOfflineProgress` and `_showOfflineModal` (`engine.js:78,356`), `migrate` and `normalizeQueueItem` (`save.js:144,214`), `applyUpgrade` (`upgrades.js:193`), `getSellInterval`, `getCrankClickMult`, `getSellAtOnce` (`upgrades.js:58,61,62`), `getItemSpriteStyle` (`state.js:213`), `fmtElapsed` (`state.js:163`), `RenderHUD.renderTimeOfDay` (`hud.js:27`). Constants `SAVE_KEY` and `ITEMS` are never used. `migrate()` reads `window.STAGES` (`save.js:161`), which is always undefined because `STAGES` is a `const`.

**Legacy `plantedAt` paths.** Growth now runs on `burnedSeconds` (`engine.js:325-346`, `upgrades.js:46-56`), but these places still rebase `plantedAt`, which has no effect except where noted:
- `adjustGrowTimes` (`upgrades.js:64-78`)
- `applyWater` / `drownTile` (`render/farm.js:8-12,25-31`)
- the cosmic well (`drag.js:295-299`)
- fertilizer drops (`drag.js:333-341,355-363`)
- rot cure (`render/farm.js:141-149,297-305`)
- rot infect (`blight.js:93-100`)
- **locust** (`blight.js:129-137`). This one is live: it derives `burnedSeconds` *from* `plantedAt`, which is a bug (see D8).

The only other remaining use of `plantedAt` is seeding `burnedSeconds` for old saves (`engine.js:334-339`).

**No-op calls.** `TimerManager.restart('sell')` (`upgrades.js:188`, `render/upgrades.js:33`) targets a timer that does not exist. The `crop:harvested` and `crop:sold` listeners at `main.js:2-3` are empty.

**Unused DOM/CSS:** `#mode-ind` (`index.html:225`), the `#well` SVG and label (always hidden, `sellbox.js:84-87`), and `var(--pw)`, which is never defined (`effects.css:24`).

### D3. Simulation vs render boundary
**Game logic inside render functions or DOM handlers:**
- `render/farm.js`:
  - harvest, weed and void-rift clicks, and paid cures (`onTileDown` 188-318)
  - cage, fertilizer and hired-hand removal (`showTileMenu` 82-121)
  - the uproot ✕ button and cage removal *inside `renderTile`* (505-526)
  - water and drown (4-37)
  - `dropLoose` (44-52), which stores **screen coordinates** in state
- `render/upgrades.js:13-40`: the entire upgrade purchase flow, including grid expansion.
- `render/items.js:23-103`: all item purchases and hired-hand hiring.
- `render/seeds.js`: seed buy (41-50), bag buy (81-92), `openBag` (2-20).
- `render/inventory.js`: can fill (46-58); seed selling via `addCoins` (156-164); inventory decrements on drag start (33-38, 69-73, 111-116, 144-151, 176-183).
- `render/panel.js:168-176`: buying ascension seeds.
- `render/sellbox.js`: crank click changes `crankMultiplier` (90-97); removing items from the queue (29-31).
- `render/crafting.js:389-399`: crafted-inventory decrement on drag.
- `render/environment.js`: `updateSky` sets `STATE.session.timeOfDay` (159), which **controls growth speed**, and `init` seeds `STATE.meta.dayOffset` (73-75). Growth therefore depends on a render function running.
- `drag.js:142-197,275-398`: planting, item placement and the diseased-soil infection.
- `tradingPost.js:233-414`, `debug.js:20-37`: purchases and coin edits inside UI modules.

**Rendering inside logic:**
- `engine.js`:
  - the display timer (316-353) calls `RenderCrafting.tickQueue`, `updateTimers`, `RenderSellbox.*` and `RenderEnv.updateSky`
  - the hired-hand timer (285-306) calls `renderTile`, `dropLoose` and `renderLoose`, and reads `window.innerWidth`
  - crank decay (312) calls `updateCrankLabel`
- Every `events/*.js` file calls `RenderFarm.renderTile`/`renderGrid`, `showBanner`, `animate*` (DOM), `sfx` and `log`. `mole.js:27` and `stage4.js:79,120` read `window.innerWidth` to position loose crops.
- `events/sellTick.js`: `addToSellQueue` bounces the DOM (6-7); `tickSellBox` measures the DOM, spawns particles, shows pops and plays sound (36-41); `canTick` writes to the DOM (54-55).
- `events/index.js`:
  - `addCoins` → `updateCoins` redraws 5 panels on every coin gain (48-65)
  - `checkMaturity` shows a banner
  - `applyWater` renders
- `crafting.js:45-46,73-74,87`; `achievements.js:90-95` plus the toast; `seasons.js:40,46` (overlays and particles inside `advanceSeason`).
- `render/inventory.js:264` rebuilds the whole crafting modal on every inventory render, even when the modal is closed.

### D4. Time sources (two clocks that drift apart)
1. **Tick clock.** One `setInterval(…, 50)` (`engine.js:50`), with every timer assuming exactly 50 ms has passed (`engine.js:40`, `engine.js:318`, `engine.js:343`). It drives all event spawn rolls, the sell box (`sellElapsed`), crop growth (`burnedSeconds += 0.05×mult`), crank decay, and the craft, season, hired-hand and save ticks.
2. **Wall clock (`Date.now()`)** drives game logic in:
   - craft completion (`crafting.js:38-41,53-57`)
   - can refill (`sellTick.js:49`, `inventory.js:54`)
   - mound expiry (`mole.js:34,43`)
   - rot death at 90 s and dead-tile expiry (`blight.js:43-58`)
   - claimed and diseased tile deadlines (`stage4.js:60,66-90,129,136`)
   - thorned-weed spread (`weeds.js:59-63`) and master farmer (`weeds.js:96-110`)
   - seasons (`seasons.js:26,43`) and weather (`seasons.js:65-67,72-105`)
   - day/night (`environment.js:74,112`)
   - drought and rain multipliers inside growth (`upgrades.js:36-38`)
   - trading post reset (`tradingPost.js:217-228`)
   - `burnedSeconds` seeding (`engine.js:337`)
3. **Other `setInterval`s:**
   - `tradingPost.js:579` calls `checkReset` (logic)
   - `minigames.js:389` is a self-contained countdown (logic)
   - `debug.js:228` and `tutorial.js:215` are UI only
4. **`setTimeout`:** mostly visual cleanup. Logic-bearing ones are `engine.js:223` (dead code), `minigames.js:69` (result screen), and `tutorial.js:201,241,244`.
5. **Consequences:**
   - ⚠ Browsers throttle background tabs to about 1 tick per second or slower. Tick-driven systems (growth, selling, events) then slow down about 20×, while wall-clock systems (rot death, claim deadlines, crafting, seasons) keep running at full speed.
   - When the game is closed, crops simply pause, because `burnedSeconds` is saved and there is **no offline progress**: `applyOfflineProgress` is never called and `lastSeen` is never saved.

### D5. Balance numbers hardcoded outside `data.js`
- **upgrades.js**
  - Tier tables `SPEED_TIERS` (90-102), `VALUE_TIERS` (108-120) and `SELL_SPEED_TIERS` (126-137). These **duplicate the `mult` fields in `data.js` with different values** (e.g. `quickRoots` is `mult:0.87` in `data.js:136` but 1.15 here); the `data.js` values are read only by the dead offline path.
  - Base sell interval 10000 (142); sell-box capacities (145-149); crank click factors (153-157); resistances (161-175); craft speed and slots (178-186); per-stack prestige values (105, 123, 141, 162), which duplicate `PRESTIGE_PERKS.valuePerStack`.
  - Tile factors 0.75/0.60/0.30 and weather 0.75/1.20 (4-19, 29-38); can capacity and fill time (59-60).
- **engine.js:** event intervals (57-73, 247), sub-tick intervals (277-316), crank decay 0.08 (310), offline cap of 8 h (79).
- **events:**
  - crowHawk.js 6-9, 14, 80-82, 91, 100
  - mole.js 5-6, 14, 34
  - blight.js 54, 58, 69-71, 94, 112-114, 132, 165-167, 180
  - fungal.js 34-36, 67, 74
  - weeds.js 4-6, 23, 27, 58, 96
  - stage4.js 35, 58, 60, 86, 99, 107, 127, 129, 153-155, 170
  - stage5.js 5, 21, 55-57, 76, 96, 140, 151, 156, 160, 171
- **Cure and clear costs, water bonus:** `render/farm.js:12-13, 32, 216, 259, 289-290, 315`, duplicated in `events/index.js`.
- **Item costs:** `render/items.js:21, 25-26, 37, 41-42, 52-57, 64-69, 76-81, 92-98` duplicate the `ITEMS` costs in `data.js:73-98`. The hired-hand cap of 3 and cost of 5 rep appear only here.
- **Bag seeds per open:** hardcoded as 3 in `render/seeds.js:8` and `events/index.js:111`, ignoring `seedsPerOpen`.
- **Minigames:** reward formula (`minigames.js:14-20`), `SM_CFG` and `WF_CFG` (38-56), unlock after 10 plays (78-79).
- **Trading post:** `tradingPost.js:5, 55-56, 69-75, 90-91, 105, 114, 136, 147, 159, 171-178, 193, 199, 309-312` (mystery odds and payout multipliers).
- **Day/night:** `render/environment.js:14-15, 27, 56-67`. The day and night seed sets differ from `NIGHT_SEEDS` in `seasons.js:6-9`.
- **Weather:** durations, check intervals and chances in `seasons.js:72, 85, 98, 201-225`.
- **Prestige:**
  - points formula `prestige.js:6-9`, duplicated for display in `render/panel.js:117-125`
  - requirements (13-16), reputation formula (38-39)
  - headStart `×500` (123), while `data.js:376` says 2000
- **Achievement thresholds:** `achievements.js:14-75` (`data.js` has only the descriptions).
- **Starting gold 10:** `state.js:3, 112`, `prestige.js:52, 58`.

### D6. Save schema
- **Key** `blissfarm10`, with fallback read of `blissfarm9` (`save.js:2-3, 11-12`). **There is no version field.**
- **Shape written** (`save.js:6`):
  - all of `state` (every field in `state.js:111-144`)
  - plus `nextId, panelExpanded, panelWidth, debugMode, reducedMotion, showBanners, dayOffset, prestige{count,points,spent,perks,highestStage,totalGoldEarned}, reputation, artifacts, blueprints, recipeUnlocks, farmName, seasonIndex, seasonStartTime, tutorialDone, tradingPost{lastReset,deals,purchased,merchantIdx}, logFilters, minigames{soilMixer,waterFlow}`
  - Mute is stored separately in `localStorage['bliss_muted']` (`main.js:201`, `audio.js:658`).
- **`migrate()`** (`save.js:144-212`) is never called. It would convert the legacy `littleFarm` key into a nested v1 shape that no code reads.
- **`load()` also:**
  - derives `STATE.meta.stage` from `stagesSeen` (`save.js:21`)
  - backfills the `crankUpI`→`ironCrank` rename (33)
  - converts string queue items (27-30)
  - converts the old `wellFull`/`wellRefillAt` fields into can charges (47-48)
  - resets `logFilters` to `{}` when missing
- **Never saved:**
  - `STATE.meta.allTimeGold` (**bug**)
  - `lastSeen` (offline progress impossible)
  - `STATE.session.*`: crank boost, `sellElapsed`, and active drought/rain/frost timers
  - the Seasons module's first-time flags
- **Saved but stripped on load:** the `crafted` flag on sell-queue items (`save.js:27-30`). That leads to a crash (see D8 #4).
- **Saved and loaded but never used:** `gameStartTime`, `sellNextAt`.
- **Reset Data** calls `localStorage.clear()` (`main.js:211`), which wipes every key on the origin. ⚠ On a shared `*.github.io` origin that includes other projects' data. Whether other projects share this origin can't be determined from the repo.

### D7. Migration readiness (Vite + TypeScript + ES modules)
- **Globals to replace with imports:** the 53 `window.*` globals, 124 global functions, 14 `var` names and 17 cross-script `const`s listed above.
- **Global name clashes:** `window.Audio` (`audio.js:17`) **shadows the browser's `Audio` constructor**. `drag` is a window accessor property. `log`, `save`, `load`, `fmt` and `mk` are generic global names.
- **Code that runs at load time and depends on script order:**
  - `engine.js:50` starts ticking before `init`
  - `events/index.js:281` captures function references from 8 earlier files
  - `achievements.js:101,142` subscribes to `EventBus` from `engine.js`
  - `drag.js:201-207,275-398` attaches document listeners and registers handlers at load
  - `audio.js:26-27` attaches listeners at load
  - `main.js:439` runs `init()` at load
  - The duplicate-function "last file wins" behaviour disappears under ES modules, and the duplicates would become import conflicts, so D2 must be resolved first.
- **Circular dependencies once converted to modules:**
  - `events/*` ↔ `render/farm` (renderTile ↔ `showReclaimMenu`, `VOID_RIFT_CLICKS`)
  - `crafting` ↔ `render/crafting`
  - `artifacts` ↔ `render/artifacts`
  - `prestige` ↔ `render/panel`
  - `render/inventory` ↔ `render/crafting`
  - `render/inventory` ↔ `render/seeds` (`openBag`)
  - `drag` ↔ `render/farm`
  - `seasons` ↔ `render/environment`
  - `save` ↔ everything
  - All of these are late-bound (called at runtime, not at load), so they are ESM-safe once load-time side effects move into an explicit `init()`.
- **Effort per file (S = <1 h, M = 1–4 h, L = >4 h):**
  - **S:** data, crafting, artifacts, achievements, render/log, events/sellTick, events/mole, events/fungal, events/weeds, audio, particles, render/hud, render/seeds, render/items, render/artifacts, render/sellbox, debug, tooltip, tutorial, index.html, css (4)
  - **M:** state, save, upgrades, events/crowHawk, events/blight, events/stage4, events/stage5, drag, render/crafting, render/inventory, render/upgrades, render/panel, render/environment, prestige, seasons, minigames, tradingPost, main
  - **L:** engine, events/index, render/farm

### D8. Bug list (ranked by player impact)
1. **Stage progress lost on reload.** `allTimeGold` isn't saved (`save.js:6`), and `checkStages` uses it (`events/index.js:31`), so after every reload the player must earn a stage's full threshold again from 0.
2. **Most upgrades don't apply when bought.** The non-speed purchase path never calls `recalculateModifiers` (`render/upgrades.js:20-21`). On a brand-new game the upgrades are also written to a different object than the one the modifiers read (`state.js:22` vs `125`). This affects value, sell speed, sell box, crank, workshop speed/slots, the Workshop itself (free recipes), and Copper Spout (`render/items.js:44`). They take effect only after a reload or a later speed-upgrade purchase.
3. **Prestige perks mostly don't work.** `recalculateModifiers` reads `prestige.fertileLegacy` and similar top-level fields (`upgrades.js:105,123,141,162`), but perks are stored in `prestige.perks[id]` (`prestige.js:151`). Fertile Legacy, Golden Memory, Swift Return and Thick Skin do nothing. Head Start gives 500 per stack instead of the advertised 2,000 (`prestige.js:123` vs `data.js:376`).
4. **The game freezes if a crafted item is in the sell queue when saved.** `load()` strips the `crafted` flag (`save.js:27-30`), so `tickSellBox` hits `SEEDS['bread']` (undefined) and throws (`sellTick.js:29-30`). The display timer then throws every 50 ms and growth stops (`engine.js:321`). ⚠ Confirm in browser.
5. **Harvest, weed and rot achievements can never unlock**, because the winning `onTileDown` and cure menus in `render/farm.js` don't track stats (D2). This blocks firstHarvest, harvest100/1000/10000, clearWeed, clear50Weeds and cureRot, and with them the Moon Shrine blueprint (`data.js:365`, which requires harvest1000).
6. ⚠ **Crops can't be stored in inventory on desktop**, because `panelExpanded` is false there (`drag.js:191`, `main.js:383`). Crafting needs crops in `state.inventory` (`crafting.js:9-12`), and nothing else adds them there.
7. **Locust wipes far more progress than the 30% it advertises.** It rebuilds `burnedSeconds` from real time since `plantedAt` divided by `grow × growSpeed` (`blight.js:129-137`). With high speed upgrades, progress resets to about 0.
8. **Background tabs and offline** (D4): the two clocks drift apart when the tab is backgrounded, and there is no offline progress.
9. **A hired hand is lost when dropped off a tile.** The fallback refunds water and cages but not hired hands (`drag.js:142-147`).
10. **The seed shop shows the wrong grow time.** It shows `grow × speed` instead of `grow ÷ speed` (`render/seeds.js:63`), so the displayed time gets longer as the player buys speed upgrades.
11. **Event resistance is applied inconsistently.** Only developer, plague rat and cosmic crow read `eventResistance` (`stage4.js:34,98`, `stage5.js:74`). The other 10 events hardcode their upgrade checks, so Thick Skin (even once fixed) wouldn't affect them. Void rift has no mitigation entry.
12. **Plot expansion shifts crop positions.** Tiles are stored in one flat array whose index is calculated from the column count (`state.js:178-187`, `fungal.js:79`), so adding a column moves existing crops on screen and changes which tiles count as neighbours for spread effects. Separately, the prestige extraPlot perk sets the expansion flags but not the upgrade, so Expand Plot can be bought again for no effect (`prestige.js:44-49`).
13. **Mystery Box earnings are inflated.** The "loss" refund and all payouts go through `addCoins`, so they count toward all-time earnings, stages and achievements (`tradingPost.js:318`).
14. **Merchant's Bag can give ascension seeds** (`tradingPost.js:262`).
15. **Minor issues:**
    - Two different lists of night-themed seeds (`environment.js:15` vs `seasons.js:6-9`).
    - Water description says +25% speed but gives +33% (÷0.75). Fertilizer descriptions say 25%/40% but give +33%/+67%.
    - `localStorage.clear()` on reset (`main.js:211`).
    - `window.Audio` clobbers the browser's constructor.
    - `var(--pw)` is undefined.
    - Crafting modal is rebuilt on every inventory render (`inventory.js:264`).
    - `save()` runs on every weed click.
    - Hired-hand harvests don't count toward stats (`engine.js:285-306`).
16. **CLAUDE.md is out of date:**
    - Stage 1 is at 50,000 all-time coins (`data.js:122`), not 1,000.
    - The sprite sheet is 192×1792 (3×28 cells of 64 px), not 384×1664 at 128 px.
    - There are 23 crops plus 3 ascension crops, not 13.
    - The file structure section is out of date (JS is no longer inline in `index.html`).

**Could not determine:**
- Actual runtime behaviour (no browser run this session).
- Whether the GitHub Pages origin is shared with other apps.
- The contents of `sprites.js` and `Crop Sprite Sheet.html`. They are outside the `js/`/`css/` audit scope and were not read.

---

## B. Phased roadmap

### Phase 1 — Stabilize (single STATE, no restructure)
- **Files:** `state.js`, `save.js`, `upgrades.js`, `events/index.js`, `render/farm.js`, `render/upgrades.js`, `render/items.js`, `render/seeds.js`, `prestige.js`, `events/blight.js`, `events/fungal.js`, `events/sellTick.js`, `drag.js`, `engine.js`.
- **Steps:**
  1. Fix D8 bugs #1–7 and #9–10 in place.
  2. Delete the losing duplicate of each function. Merge the stats tracking from `events/index.js` into the canonical versions, and move those into one logic file.
  3. Collapse to one root: make `state` an alias of `STATE.run` (keeping the same shape, so no mass rename yet).
  4. Delete the DEAD shadows listed in D1. Make `allTimeGold` a single counter.
  5. Route every upgrade and perk purchase through `applyUpgrade` → `recalculateModifiers`.
  6. Add `version: 2` to the save and a real `migrate()` from the unversioned `blissfarm10` format, keeping the same key and reading the old shape.
- **Risks:** breaking existing saves (CLAUDE.md forbids this). Behaviour changes for players who were relying on bugs, e.g. stage re-earn and inflated perks.
- **How to verify:**
  - Export a current save JSON before starting.
  - Load it in the patched build and compare it field by field.
  - Manual checklist:
    - buy a value upgrade and see sell price change immediately
    - reload and keep your stage
    - put a crafted item in the queue, reload, and check nothing freezes
    - harvest and check the achievement counter
    - desktop drop-to-inventory works
    - buy a perk and see the modifier change in the debug panel

### Phase 2 — Vite + TypeScript + ES modules
- **Files:** everything. New files: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`, `public/sprites.png`, and a GitHub Actions Pages workflow. Build output must not go in `docs/`, because `docs/AUDIT.md` will live there.
- **Steps:**
  1. Convert files to ESM in the current load order: `export`/`import` replaces `window.*`.
  2. Move load-time side effects (the `setInterval`, document listeners, `init()`) into explicit `start()` calls.
  3. Rename `Audio` → `Sfx`.
  4. Turn the global `const`s into module exports.
  5. Rename `.js` → `.ts` with `// @ts-nocheck`, then tighten file by file, starting with a `GameState` type.
  6. Codemod `state.` → `STATE.run.` once the types exist.
- **Risks:** load-order assumptions, the Pages `base` path, the sprite URL, and `window.*` lookups that silently return undefined (like `window.STAGES`).
- **How to verify:**
  - `npm run build` and `tsc --noEmit` pass.
  - The deployed preview loads a Phase 1 save.
  - Repeat the Phase 1 manual checklist.

### Phase 3 — Pure sim core, headless balance simulator, Vitest
- **New:**
  - `src/sim/`:
    - `tick(state, dtMs, rng)`: no DOM, no `Date.now`, no `Math.random`.
    - `applyAction(state, action)`: planting, harvest, purchases, cures, extracted from the DOM handlers listed in D3.
    - `state.time.nowMs` becomes the single clock; all Date.now deadlines from D4 are rebased onto it.
    - A seeded RNG whose seed is stored in state.
    - `tick` returns an event list that the render and audio layers consume.
  - `src/balance.ts`: every number from D5 in one place.
- **Driver:** a `requestAnimationFrame`/`setInterval` loop that measures real elapsed time with `performance.now()` and feeds it to `tick`. This fixes the throttling drift. Offline progress = run `tick` in large capped steps from a saved `lastSeen`.
- **Headless simulator:** `scripts/sim.ts` runs a strategy bot for N sim-hours with a given seed and outputs time-to-stage, coins-per-minute and upgrade timing as CSV.
- **Tests (Vitest):**
  - `recalculateModifiers` tier and perk math
  - `migrate()` fixtures (unversioned → v2)
  - determinism: same seed gives the same state
  - one regression test per Top-10 fix
  - growth invariants for water, fertilizer, rot, locust and acid rain
- **Risks:** subtle balance drift when switching clocks. Offline catch-up needs chunking for performance.
- **How to verify:**
  - The simulator reproduces current time-to-stage ±10% before any tuning.
  - Vitest is green in CI.
  - A browser session matches the simulator's coins after 10 minutes on a fixed seed.

---

## C. Top 10 fixes (impact ÷ effort)
| # | Fix | Impact | Effort |
|---|---|---|---|
| 1 | Save and load `allTimeGold` (or derive it from `coinsEarned`) | Critical | S |
| 2 | Recalculate modifiers after every purchase, and alias `STATE.upgrades` to `state.upgrades` at startup | Critical | S |
| 3 | Keep the `crafted` flag when loading the sell queue, and guard against unknown seed IDs in `tickSellBox` | Critical (freeze) | S |
| 4 | Read perks from `prestige.perks[id]`, and make Head Start match its description | High | S |
| 5 | Delete duplicate functions and restore stats tracking (harvest, weed, rot achievements and the Moon Shrine blueprint) | High | S–M |
| 6 | Let desktop drops reach inventory (remove the `panelExpanded` gate or set it on desktop) ⚠ | High | S |
| 7 | Compute locust setback from `burnedSeconds` | Med-High | S |
| 8 | Refund hired hands on a failed drop; fix the seed-shop grow-time display | Medium | S |
| 9 | Route all event chances through `eventResistance` | Medium | M |
| 10 | Single clock and offline progress (Phase 3 foundation) | High | L |

---

## Verification
- Every file:line reference above comes from files read in full this session.
- Counts were produced with: `grep -roP '(?<![A-Za-z0-9_$.])state\.' js`, `grep -rn 'setInterval(' js`, `grep -rn 'setTimeout(' js`, `grep -rno 'Date\.now()' js`, `grep -rnoP '^\s*window\.[A-Za-z_$]+\s*=' js`, and `^function` duplicate detection across `js/`.
- Runtime-only claims are marked ⚠.
