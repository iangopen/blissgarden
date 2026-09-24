# Bliss Farm — Project Context

## What this is
A browser-based incremental farming game. Single HTML file (`index.html`) with all CSS and JS inline. Hosted on GitHub Pages.

## Stack
- Plain HTML/CSS/JS — no frameworks, no build tools
- `sprites.js` + `sprites.png` — crop sprite sheet (13 crops × 3 stages: seed, sprout, grown)
- `localStorage` for all save data

## File structure
```
index.html       ← entire game (HTML + CSS + JS)
sprites.js       ← sprite drawing logic (reference only)
sprites.png      ← sprite sheet used in-game
CLAUDE.md        ← this file
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
- **Items**: Watering Can (well in corner, waters one tile), Cage (crow protection), Common Fertilizer (permanent plot buff +25% speed), Uncommon Fertilizer (permanent +35% speed, unlocks after common placed)
- **Status log**: bottom-left, logs game events
- **Stage display**: top-center. Stage 0: Birth → Stage 1: Real World (1000 all-time coins)
- **Mature state**: unlocks at 1000 all-time coins. Enables crow attacks and weed spawning.
- **Crows**: 5% chance every 10s to steal a crop. Prioritize ground crops (highest value first).
- **Weeds**: 12% chance every 8s to spawn on empty tile. Click 20 times to clear.

## Palette
- Sky blue background: `#87CEEB`
- Brown tiles / panels: `#8B6343` range
- Green grass/outlines: `#5A8A3C`
- White text on dark panels

## Sprites
- Sheet: `sprites.png`, 384×1664px, 128×128 per cell
- 13 rows (crops), 3 cols (seed=0, sprout=1, grown=2)
- Row order: potato, carrot, wheat, sunflower, pumpkin, chard, moonbloom, starfruit, thornvine, glowshroom, voidbloom, aetherfern, solarspike
- Helper: `getSpriteStyle(cropId, stage)` returns CSS for background-image sprite cutout

## Conventions
- Never break existing save/load logic
- All timers update every 50ms (1/20th second)
- Growth speed upgrades apply proportionally to in-progress crops
- All speed/value upgrades are multiplicative and stack
- No hard minimum on grow time or sell interval (allow sub-second decimals)
- Log important events to status panel
- Show banner announcements for major world state changes

## Real (verified working)
_These were verified by reading the code on 2026-09-24, not by running the game. Full detail is in [docs/AUDIT.md](docs/AUDIT.md)._
- Crop growth uses `burnedSeconds` (`engine.js` display timer). Water, fertilizer, uncommon fertilizer and rot all change the speed through `getEffectiveSpeedMult` (`upgrades.js`), which reads the same `state.*` maps the game writes.
- Buying a speed upgrade recalculates modifiers straight away.
- Weeds and thorned weeds can be cleared by clicking. Mounds, void rifts and claimed-tile reclaim work (`render/farm.js` `onTileDown`).
- The sell box sells first-in, first-out, several items at once with capacity upgrades (after a reload), and the crank boost and decay work.
- Crafting queue timing, recipe unlocks (free, prestige and achievement) and crafted-item selling all work.
- Artifacts apply through `recalculateModifiers` → `applyArtifacts`.
- Seasons, weather (drought, rain, frost) and the day/night cycle work.
- The trading post rotates hourly, and purchases and the mystery box work.
- Minigames (Soil Mixer, Water Flow) pay out rewards and track play counts.
- Every `state` field is saved and loaded, except the items listed under Still open.
- The canonical copy of each duplicated function is the **later-loaded** file: `render/farm.js` beats `events/index.js`, `render/seeds.js` has the winning `openBag`, and `render/sellbox.js` has the winning `showPop`.

## Still open (known broken or unverified)
_Full list, file:line references and roadmap are in [docs/AUDIT.md](docs/AUDIT.md). Work happens on the `phase1` branch. GitHub Pages deploys from `main`, so never push unfinished work there._
- **Stage progress resets on reload.** `STATE.meta.allTimeGold` is never saved.
- **Non-speed upgrades don't apply until reload.** Value, sell speed, sell box, crank, workshop and Copper Spout don't trigger a modifier recalculation. On a brand-new game `STATE.upgrades` and `state.upgrades` are also separate objects.
- **Prestige perks don't work.** The code reads `prestige.<id>` but perks are stored in `prestige.perks[id]`. Head Start gives 500 per stack, not 2,000.
- **Possible freeze.** A crafted item in the sell queue loses its `crafted` flag on load, which makes `tickSellBox` throw. ⚠ Needs a runtime check.
- **Harvest, weed and rot-cure stats are never counted.** The duplicate functions in `render/farm.js` override the versions that tracked them, so those achievements and the Moon Shrine blueprint are unobtainable.
- ⚠ **Desktop can't drop crops into inventory.** The drop is gated on `panelExpanded`, which only mobile sets. This blocks crop-based crafting.
- **Locust can wipe all growth progress.** It uses the legacy `plantedAt` value.
- **Hired hands are lost on a failed drop.** The seed shop also shows grow time × speed instead of ÷ speed.
- **Only 3 of 14 events read `eventResistance`.** Ten hardcode their upgrade checks, and void rift has no mitigation at all.
- **The game runs on two clocks.** The 50 ms tick drives growth, selling and events, while `Date.now()` drives rot, claims, crafting and seasons, so they drift apart in background tabs. There is no offline progress: `applyOfflineProgress` is never called and `lastSeen` is never saved.
- **The save has no version field.** `migrate()` is dead code.
- **Dead code:** `STATE.plots/sellQueue/inventory/events/fallenCrops/milestones`, `STATE.meta.gold/matureState/gameStartTime`, `crankMult`, `DIRTY`, `logEntries`, `waterFactor/fertFactor/rotFactor/adjustGrowTimes`, and 11 function names declared twice.
- **Out-of-date statements at the top of this file:**
  - Stage 1 unlocks at **50,000** all-time coins, not 1,000.
  - There are 23 crops plus 3 ascension crops, not 13.
  - `sprites.png` is **192×1792** (28 rows of 64 px cells), not 384×1664 at 128 px.
  - The JavaScript now lives in `js/` and `css/`, not inline in `index.html`.
