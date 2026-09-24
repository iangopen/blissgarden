# Bliss Farm — Project Context

## What this is
A browser-based incremental farming game. `index.html` holds the markup and loads the CSS from `css/` and plain classic scripts from `js/` in a fixed order. Hosted on GitHub Pages.

## Stack
- Plain HTML/CSS/JS — no frameworks, no build tools
- `sprites.png` — crop sprite sheet (23 crops + 3 ascension crops × 3 stages: seed, sprout, grown); `sprites.js` is reference only
- `localStorage` for all save data (key `blissfarm10`)

## File structure
```
index.html          ← markup; <script> order at the bottom is the load order
css/                ← base, effects, farm, ui
js/data.js          ← balance data: seeds, bags, items, upgrades, stages, recipes, perks, blueprints
js/state.js         ← STATE root. `state` is the same object as STATE.run (the farm run)
js/save.js          ← save() / load()
js/upgrades.js      ← recalculateModifiers, growth speed, EventBus, TimerManager
js/engine.js        ← timer registrations and the 50 ms display tick (growth + selling)
js/events/index.js  ← coins/stages, tile actions (onTileDown, water, tile menus, openBag)
js/events/*.js      ← event logic per threat (crow/hawk, mole, blight+rot cure, fungal, weeds, stage 4, stage 5, sell box)
js/render/*.js      ← DOM rendering (farm, panel, seeds, items, upgrades, sellbox, crafting, …)
js/*.js             ← crafting, artifacts, achievements, prestige, seasons, trading post, minigames, tutorial, audio, debug
sprites.png         ← sprite sheet used in-game
docs/AUDIT.md       ← codebase audit and phased roadmap
CLAUDE.md           ← this file
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
- Every function name is declared once across `js/` (Phase 2 turns these files into ES modules, where duplicates become import conflicts)

## Real (verified working)
_Items marked ▶ were checked by running the game in headless Chrome on 2026-09-24 (phase 1a/1b checklist). The rest were verified by reading the code. Detail in [docs/AUDIT.md](docs/AUDIT.md)._
- Crop growth uses `burnedSeconds` (`engine.js` display timer). Water, fertilizer, uncommon fertilizer and rot all change the speed through `getEffectiveSpeedMult` (`upgrades.js`), which reads the same `state.*` maps the game writes. `plantedAt` only seeds `burnedSeconds` for tiles from old saves.
- ▶ One state root: `state` is `STATE.run`, and `STATE.upgrades` is a view of `STATE.run.upgrades`, so they are always the same object.
- ▶ `state.coinsEarned` is the single all-time earnings counter (milestones, achievements, reputation, prestige). Loading also accepts the short-lived `allTimeGold` save key.
- ▶ Stage survives a reload (saved as `stage`; `stagesSeen` backfilled).
- ▶ Buying any upgrade, item or perk recalculates modifiers straight away (e.g. a value upgrade changes sell value at once).
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

## Still open (known broken or unverified)
_Full list, file:line references and roadmap are in [docs/AUDIT.md](docs/AUDIT.md). Work happens on the `phase1` branch. GitHub Pages deploys from `main`, so never push unfinished work there._
- **Purchases are spread across render files.** `render/upgrades.js`, `render/items.js`, `render/seeds.js`, `render/panel.js` and `tradingPost.js` change coins and upgrades directly instead of going through one logic function (`applyUpgrade` exists but is unused).
- **Only 3 of 14 events read `eventResistance`.** Ten hardcode their upgrade checks, and void rift has no mitigation at all. Base event chances live in the event files, not `data.js`.
- **The save has no version field** and no real `migrate()`. `lastSeen` is never saved.
- **The game runs on two clocks.** The 50 ms tick drives growth, selling and events, while `Date.now()` drives rot, claims, crafting and seasons, so they drift apart in background tabs. There is no offline progress.
- **Plot expansion shifts crop positions** (flat tile array indexed by column count). The prestige Extra Plot perk sets expansion flags without the upgrade, so Expand Plot can be re-bought for nothing.
- **Mystery Box payouts count toward all-time earnings.** Merchant's Bag can give ascension seeds.
- **Minor:** hired-hand harvests don't count toward stats; water and fertilizer descriptions understate their effect; `window.Audio` shadows the browser's `Audio`; `var(--pw)` is undefined (`effects.css`); the crafting modal is rebuilt on every inventory render; every weed click saves.
