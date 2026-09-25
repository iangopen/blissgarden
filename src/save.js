import { RECIPES, SEEDS } from './data.js';
import { STATE, state, ui } from './state.js';

// ── SAVE FORMAT ──────────────────────────────────────────────────────────
// Version 2 keeps the flat blissfarm10 layout (so older builds can still read it) and adds
// `version` and `lastSeen` (ms timestamp of the save; offline progress will read it).
// Saves without a `version` field are version 1; migrate() brings them up to date.
export const KEY          = 'blissfarm10';
export const KEY_OLD      = 'blissfarm9';
export const SAVE_VERSION = 2;

export function serializeSave() {
  return { version: SAVE_VERSION, lastSeen: Date.now(), ...state, stage: STATE.meta.stage, nextId: ui.nextId, panelExpanded: ui.panelExpanded, panelWidth: ui.panelWidth, debugMode: STATE.settings.debugMode, reducedMotion: STATE.settings.reducedMotion, showBanners: STATE.settings.showBanners, dayOffset: STATE.meta.dayOffset, prestige: STATE.prestige, reputation: STATE.meta.reputation, artifacts: STATE.artifacts, blueprints: STATE.blueprints, recipeUnlocks: STATE.recipeUnlocks, farmName: STATE.meta.farmName, seasonIndex: STATE.meta.seasonIndex, seasonStartTime: STATE.meta.seasonStartTime, tutorialDone: STATE.meta.tutorialDone, tradingPost: STATE.tradingPost, logFilters: STATE.settings.logFilters, minigames: { soilMixer: STATE.minigames.soilMixer, waterFlow: STATE.minigames.waterFlow } };
}

let _savingDisabled = false;

export function save() {
  if (_savingDisabled) return;
  localStorage.setItem(KEY, JSON.stringify(serializeSave()));
}

// Used right before a reload that must not be overwritten by one last save (Reset Data, Import save).
export function disableSaving() { _savingDisabled = true; }

export function load() {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) raw = localStorage.getItem(KEY_OLD);
    const parsed = JSON.parse(raw || 'null');
    if (!parsed) return false;
    const d = migrate(parsed);
    STATE.meta.lastSeen   = d.lastSeen        ?? null;
    state.coins           = d.coins           ?? 10;
    state.coinsEarned     = d.coinsEarned     ?? 0;
    STATE.meta.dayOffset      = d.dayOffset            ?? null;
    state.milestones      = d.milestones      ?? {};
    state.stagesSeen      = d.stagesSeen      ?? {};
    STATE.meta.stage      = d.stage           ?? 0;
    state.mature          = d.mature          ?? false;
    state.tiles           = d.tiles           ?? Array(9).fill(null);
    state.inventory       = d.inventory       ?? {};
    state.seedInventory   = d.seedInventory   ?? {};
    state.bagInventory    = d.bagInventory    ?? {};
    state.sellQueue       = (d.sellQueue || []).map(item => ({
      seed: item.seed, bonus: item.bonus ?? 1, drowned: item.drowned ?? false, fungal: item.fungal ?? false,
      crafted: item.crafted ?? false }));
    state.upgrades                = d.upgrades                ?? {};
    state.loose           = (d.loose || []).map(item => ({
      seed: item.seed, id: item.id, x: item.x, y: item.y,
      bonus: item.bonus ?? 1.0, drowned: item.drowned ?? false, fungal: item.fungal ?? false }));
    state.expanded        = d.expanded        ?? false;
    state.expandedBottom  = d.expandedBottom  ?? false;
    state.expand2ndCol    = d.expand2ndCol    ?? false;
    state.expand2ndRow    = d.expand2ndRow    ?? false;
    state.expand3rdCol    = d.expand3rdCol    ?? false;
    state.expand3rdRow    = d.expand3rdRow    ?? false;
    state.items           = d.items           ?? {};
    state.cageCount       = d.cageCount       ?? 0;
    state.cages           = d.cages           ?? [];
    state.canCharges      = d.canCharges      ?? 0;
    state.canRefillAt     = d.canRefillAt     ?? 0;
    state.tilesWatered            = d.tilesWatered            ?? {};
    state.fertCharges             = d.fertCharges             ?? 0;
    state.uncommonFertCharges     = d.uncommonFertCharges     ?? 0;
    state.weeds                   = d.weeds                   ?? {};
    state.fertilizedTiles         = d.fertilizedTiles         ?? {};
    state.uncommonFertilizedTiles = d.uncommonFertilizedTiles ?? {};
    state.firstWeedEver           = d.firstWeedEver           ?? false;
    state.firstCrowEver           = d.firstCrowEver           ?? false;
    state.firstHawkEver           = d.firstHawkEver           ?? false;
    state.firstMoleEver           = d.firstMoleEver           ?? false;
    state.firstThornedEver        = d.firstThornedEver        ?? false;
    state.thornedWeeds            = d.thornedWeeds            ?? {};
    state.mounds                  = d.mounds                  ?? {};
    state.rotTiles                = d.rotTiles                ?? {};
    state.firstRotEver            = d.firstRotEver            ?? false;
    state.firstLocustEver         = d.firstLocustEver         ?? false;
    state.firstBlightEver         = d.firstBlightEver         ?? false;
    state.fungalTiles             = d.fungalTiles             ?? {};
    state.firstFungalEver         = d.firstFungalEver         ?? false;
    state.craftedInventory         = d.craftedInventory         ?? {};
    state.claimedTiles             = d.claimedTiles             ?? {};
    state.diseasedTiles            = d.diseasedTiles            ?? {};
    state.firstDeveloperEver       = d.firstDeveloperEver       ?? false;
    state.firstRatEver             = d.firstRatEver             ?? false;
    state.firstAcidRainEver        = d.firstAcidRainEver        ?? false;
    state.voidRifts                = d.voidRifts                ?? {};
    state.firstVoidRiftEver        = d.firstVoidRiftEver        ?? false;
    state.firstCosmicCrowEver      = d.firstCosmicCrowEver      ?? false;
    state.firstRealityStormEver    = d.firstRealityStormEver    ?? false;
    state.hiredHandCount           = d.hiredHandCount           ?? 0;
    state.hiredHandAssignments     = d.hiredHandAssignments     ?? {};
    STATE.meta.reputation          = d.reputation               ?? 0;
    state.achievements             = d.achievements             ?? {};
    const _ds = d.stats || {};
    state.stats = {
      totalHarvested:     _ds.totalHarvested     ?? 0,
      totalPlanted:       _ds.totalPlanted       ?? 0,
      totalCrafted:       _ds.totalCrafted       ?? 0,
      craftedSold:        _ds.craftedSold        ?? 0,
      weedsCleared:       _ds.weedsCleared       ?? 0,
      crowsSurvived:      _ds.crowsSurvived      ?? 0,
      locustsSurvived:    _ds.locustsSurvived    ?? 0,
      rotCured:           _ds.rotCured           ?? 0,
      blightsSurvived:    _ds.blightsSurvived    ?? 0,
      bagsBought:         _ds.bagsBought         ?? 0,
      seedTypesPlanted:   _ds.seedTypesPlanted   ?? {},
      recipesEverCrafted: _ds.recipesEverCrafted ?? {},
      prestigeCount:      _ds.prestigeCount      ?? 0,
    };
    state.hideBoughtUpgrades      = d.hideBoughtUpgrades      ?? false;
    STATE.settings.debugMode      = d.debugMode               ?? false;
    ui.nextId        = d.nextId        ?? 0;
    ui.panelExpanded = d.panelExpanded ?? false;
    ui.panelWidth    = Math.max(200, Math.min(500, d.panelWidth ?? 280));
    const _dp = d.prestige || {};
    STATE.prestige = {
      count:           _dp.count           ?? 0,
      points:          _dp.points          ?? 0,
      spent:           _dp.spent           ?? 0,
      perks:           _dp.perks           ?? {},
      highestStage:    _dp.highestStage    ?? 0,
      totalGoldEarned: _dp.totalGoldEarned ?? 0,
    };
    state.stats.prestigeCount = STATE.prestige.count;
    STATE.artifacts    = d.artifacts    ?? {};
    STATE.blueprints   = d.blueprints   ?? {};
    STATE.recipeUnlocks = d.recipeUnlocks ?? {};
    state.craftQueue   = (d.craftQueue || []).filter(q => q && q.recipeId);
    STATE.meta.farmName        = d.farmName        ?? 'Bliss Farm';
    STATE.meta.seasonIndex     = d.seasonIndex     ?? 0;
    STATE.meta.seasonStartTime = d.seasonStartTime ?? Date.now();
    STATE.meta.tutorialDone    = d.tutorialDone    ?? false;
    STATE.settings.logFilters    = d.logFilters      ?? {};
    STATE.settings.reducedMotion = d.reducedMotion  ?? false;
    STATE.settings.showBanners   = d.showBanners    ?? true;
    if (d.minigames) {
      ['soilMixer','waterFlow'].forEach(g => {
        if (d.minigames[g]) Object.assign(STATE.minigames[g], d.minigames[g]);
      });
    }
    if (d.tradingPost) {
      STATE.tradingPost.lastReset   = d.tradingPost.lastReset   ?? 0;
      STATE.tradingPost.deals       = d.tradingPost.deals       ?? [];
      STATE.tradingPost.purchased   = d.tradingPost.purchased   ?? {};
      STATE.tradingPost.merchantIdx = d.tradingPost.merchantIdx ?? 0;
    }
    return true;
  } catch (_) { return false; }
};

// ── MIGRATION ────────────────────────────────────────────────────────────
// Brings a parsed save up to SAVE_VERSION. Pure: returns a new object and never touches the game.
// Throws on anything that is not a save this build understands.
export function migrate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not a save object');
  let d = JSON.parse(JSON.stringify(data));
  const from = d.version ?? 1;
  if (!Number.isInteger(from) || from < 1) throw new Error(`unknown save version: ${d.version}`);
  if (from > SAVE_VERSION) throw new Error(`save is version ${from}; this build reads up to ${SAVE_VERSION}`);
  if (from < 2) d = _migrate1to2(d);
  return d;
}

// Version 1 = every unversioned blissfarm10 / blissfarm9 save.
export function _migrate1to2(d) {
  // One all-time counter. Builds between the audit and phase 1b also wrote a separate allTimeGold; keep the larger.
  d.coinsEarned = Math.max(d.coinsEarned ?? 0, d.allTimeGold ?? 0);
  delete d.allTimeGold;
  // Highest stage ever reached: never lower than what stagesSeen or a saved stage says.
  d.stagesSeen = d.stagesSeen ?? {};
  d.stage = Math.max(d.stage ?? 0, Object.keys(d.stagesSeen).reduce((m, s) => Math.max(m, parseInt(s)), 0));
  for (let s = 1; s <= d.stage; s++) d.stagesSeen[s] = true;
  // Renamed upgrade.
  if (d.upgrades && d.upgrades.crankUpI && !d.upgrades.ironCrank) d.upgrades.ironCrank = true;
  // Queue entries were once plain seed ids, and older loads dropped `crafted`; restore it for recipe ids.
  const isRecipeId = id => !SEEDS[id] && !!(RECIPES || []).find(r => r.id === id);
  d.sellQueue = (d.sellQueue || []).map(item =>
    typeof item === 'string'
      ? { seed: item, bonus: 1, drowned: false, fungal: false, crafted: isRecipeId(item) }
      : { seed: item.seed, bonus: item.bonus ?? 1, drowned: item.drowned ?? false, fungal: item.fungal ?? false,
          crafted: item.crafted ?? isRecipeId(item.seed) });
  // The old well became watering-can charges.
  d.canCharges  = d.canCharges  ?? (d.wellFull ? 1 : 0);
  d.canRefillAt = d.canRefillAt ?? ((!d.wellFull && d.wellRefillAt) ? d.wellRefillAt : 0);
  delete d.wellFull; delete d.wellRefillAt;
  // Saved but never read.
  delete d.gameStartTime; delete d.sellNextAt;
  d.version = 2;
  return d;
}

// ── EXPORT / IMPORT (Settings > Data) ────────────────────────────────────
// Export is base64 of the save JSON. Import accepts that, or the raw JSON from localStorage.
export function exportSave() {
  const bytes = new TextEncoder().encode(JSON.stringify(serializeSave()));
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Parses, migrates and checks an export string. Returns the v2 save object or throws with a readable message.
export function parseSaveString(text) {
  const t = String(text || '').trim();
  if (!t) throw new Error('Paste a save first.');
  let parsed;
  try {
    const json = t.startsWith('{') ? t
      : new TextDecoder().decode(Uint8Array.from(atob(t.replace(/\s+/g, '')), c => c.charCodeAt(0)));
    parsed = JSON.parse(json);
  } catch (_) { throw new Error('That is not a Bliss Farm save.'); }
  const d = migrate(parsed);
  if (typeof d.coins !== 'number' || !isFinite(d.coins) || !Array.isArray(d.tiles) ||
      (d.upgrades !== undefined && (typeof d.upgrades !== 'object' || d.upgrades === null))) {
    throw new Error('That save is missing coins or tiles.');
  }
  return d;
}

// Replaces the stored save. The caller reloads the page so load() starts from it.
export function importSave(text) {
  const d = parseSaveString(text);
  localStorage.setItem(KEY, JSON.stringify(d));
  return d;
}
