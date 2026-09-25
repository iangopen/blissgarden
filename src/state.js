import { COL_MAP, ROW_MAP } from './data.js';

export const STATE = {
  meta: {
    stage: 0,
    reputation: 0,
    farmName: 'Bliss Farm',
    seasonIndex: 0,
    seasonStartTime: Date.now(),
    tutorialDone: false,
    lastSeen: null,           // ms timestamp of the save this session loaded from (for offline progress)
  },
  modifiers: {
    growSpeed: 1,
    sellValue: 1,
    sellInterval: 10000,
    crankClickMultiplier: 1.015, // per-click factor; set by recalculateModifiers
    sellBoxCapacity: 1,
    craftSpeedMult: 1,
    craftSlots: 1,
    seasonGrowMult: 1,
    seasonSellMult: 1,
    seasonWeedMult: 1,
    seasonCrowMult: 1,
    eventResistance: {
      crow: 0, hawk: 0, mole: 0, thornedWeed: 0,
      rot: 0, locust: 0, blight: 0, fungal: 0,
    },
  },
  settings: {
    muted: false,
    debugMode: false,
    reducedMotion: false,
    showBanners: true,
    logFilters: {
      attack: true, earnings: true, growth: true, event: true,
      unlock: true, prestige: true, season: true, system: true,
    },
  },
  prestige: {
    count: 0,
    points: 0,
    spent: 0,
    perks: {},
    highestStage: 0,
    totalGoldEarned: 0,
  },
  artifacts: {},
  blueprints: {},
  recipeUnlocks: {},
  tradingPost: {
    lastReset: 0,
    deals: [],
    purchased: {},
    merchantIdx: 0,
  },
  minigames: {
    soilMixer: { playsEasy:0, playsMedium:0, playsHard:0, totalPlays:0 },
    waterFlow:  { playsEasy:0, playsMedium:0, playsHard:0, totalPlays:0 },
  },
  session: {
    dragItem: null,
    debugCounts: { crow:0, hawk:0, weed:0, mole:0, rootRot:0, locust:0, blight:0, fungal:0 },
    crankMultiplier: 1,
    timeOfDay: 'day',
    artifactDayBonus:   0,
    artifactNightSpeed: 0,
    artifactNoNightPen: false,
    seasonDayMult:   1.15,
    seasonNightMult: 0.85,
    droughtEndsAt: 0,
    rainEndsAt:    0,
    frostEndsAt:   0,
  },
  // ══════════════════════════════
  // RUN STATE — the farm itself, reset by prestige.
  // `state` below is this same object; both names reach the same data.
  // coinsEarned is the single all-time earnings counter (milestones, achievements, reputation, prestige).
  // ══════════════════════════════
  run: {
    coins: 10, coinsEarned: 0,
    milestones: {}, stagesSeen: {}, mature: false,
    tiles: Array(9).fill(null),
    inventory: {}, seedInventory: {}, bagInventory: {}, craftedInventory: {},
    achievements: {},
    stats: {
      totalHarvested: 0, totalPlanted: 0, totalCrafted: 0, craftedSold: 0,
      weedsCleared: 0, crowsSurvived: 0, locustsSurvived: 0, rotCured: 0,
      blightsSurvived: 0, bagsBought: 0,
      seedTypesPlanted: {}, recipesEverCrafted: {}, prestigeCount: 0,
    },
    sellQueue: [],
    craftQueue: [],
    upgrades: {}, loose: [],
    expanded: false, expandedBottom: false,
    expand2ndCol: false, expand2ndRow: false,
    expand3rdCol: false, expand3rdRow: false,
    items: {}, cageCount: 0, cages: [],
    canCharges: 0, canRefillAt: 0, tilesWatered: {},
    fertCharges: 0, uncommonFertCharges: 0,
    weeds: {}, fertilizedTiles: {}, uncommonFertilizedTiles: {},
    firstWeedEver: false, firstCrowEver: false, firstHawkEver: false,
    firstMoleEver: false, firstThornedEver: false,
    thornedWeeds: {}, mounds: {}, rotTiles: {},
    firstRotEver: false, firstLocustEver: false, firstBlightEver: false,
    fungalTiles: {}, firstFungalEver: false,
    claimedTiles: {}, diseasedTiles: {},
    firstDeveloperEver: false, firstRatEver: false, firstAcidRainEver: false,
    voidRifts: {}, firstVoidRiftEver: false, firstCosmicCrowEver: false, firstRealityStormEver: false,
    hiredHandCount: 0,
    hiredHandAssignments: {},
    hideBoughtUpgrades: false,
  },
};

// Purchased upgrades live in the run (prestige clears them). STATE.upgrades is kept as a view of them.
Object.defineProperty(STATE, 'upgrades', {
  get() { return STATE.run.upgrades; },
  set(v) { STATE.run.upgrades = v; },
  enumerable: false,
});

export const state = STATE.run;

// UI values that several modules write. Imported bindings are read-only, so they live on one shared object.
export const ui = { nextId: 0, selectedTile: null, panelExpanded: false, panelWidth: 280 };
export const prevReadyState = {};

// ══════════════════════════════
// GLOBAL DOM & FORMAT HELPERS
// ══════════════════════════════
export function mk(tag, cls) { const el = document.createElement(tag); if (cls) el.className = cls; return el; }
export function coinHTML() { return '<span class="coin"></span>'; }
export function fmt(s) {
  if (s <= 0) return '0s';
  if (s < 1)  return s.toFixed(1) + 's';
  if (s < 60) return Math.ceil(s) + 's';
  if (s < 3600) { const m = Math.floor(s/60), sec = Math.ceil(s%60); return `${m}m${sec>0?' '+sec+'s':''}`; }
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return `${h}h${m>0?' '+m+'m':''}`;
}
export function formatNumber(n) {
  if (n >= 1e12) return (n/1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9)  return (n/1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6)  return (n/1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e3)  return (n/1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
  return Math.floor(n).toString();
}
// (formatNumber is exported where it is declared)
export function getGridDims() {
  let cols = 3, rows = 3;
  if (state.expanded)       cols = 4;
  if (state.expandedBottom) rows = 4;
  if (state.expand2ndCol)   cols = 5;
  if (state.expand2ndRow)   rows = 5;
  if (state.expand3rdCol)   cols = 6;
  if (state.expand3rdRow)   rows = 6;
  return { cols, rows };
}
export function tileCount() { const { cols, rows } = getGridDims(); return cols * rows; }

// ══════════════════════════════
// SPRITE HELPERS
// ══════════════════════════════
// Sheet is 384px wide × (rows×128)px tall. Each cell is 128×128px native.
export const SHEET_ROWS = 28;
// Resolves under the deploy base (/blissgarden/) in dev and in the build.
export const SPRITE_URL = import.meta.env.BASE_URL + 'sprites.png';

export function getSpriteStyle(cropId, stage, size=64) {
  const col = COL_MAP[stage];
  const row = ROW_MAP[cropId];
  if (row === undefined || col === undefined) { console.error('getSpriteStyle unknown:', cropId, stage); return {}; }
  const totalRows = 28; // update if more rows added
  return {
    backgroundImage:    `url('${SPRITE_URL}')`,
    backgroundPosition: `${-(col * size)}px ${-(row * size)}px`,
    backgroundSize:     `${size * 3}px ${size * totalRows}px`,
    backgroundRepeat:   'no-repeat',
    width:  size + 'px',
    height: size + 'px',
    imageRendering:  'pixelated',
    display:         'inline-block',
    flexShrink:      '0',
  };
}
export function makeSpriteDiv(cropId, stage, size=64) {
  const el = document.createElement('div');
  Object.assign(el.style, getSpriteStyle(cropId, stage, size));
  el.style.pointerEvents = 'none';
  return el;
}
export function spriteHTML(cropId, stage, size=64) {
  const row = ROW_MAP[cropId], col = COL_MAP[stage];
  if (row === undefined || col === undefined) {
    console.error('spriteHTML: unknown cropId or stage', cropId, stage);
    return '';
  }
  return `<span style="display:inline-block;width:${size}px;height:${size}px;background:url('${SPRITE_URL}') no-repeat ${-(col*size)}px ${-(row*size)}px/${size*3}px ${size*SHEET_ROWS}px;image-rendering:pixelated;vertical-align:middle;flex-shrink:0;pointer-events:none"></span>`;
}
