// ══════════════════════════════
// MULTIPLIERS & TILE MODIFIERS
// ══════════════════════════════
// Returns the total effective speed multiplier for a growing crop.
// growSpeed is treated as a speed factor (higher = faster accumulation of burnedSeconds).
// Tile factors (water, fert, rot) convert time-mults to speed contributions.
function getEffectiveSpeedMult(seedId, idx) {
  const gs       = STATE.modifiers.growSpeed    || 1;
  const season   = STATE.modifiers.seasonGrowMult || 1;
  const dayNight = window.RenderEnv?.getDayNightMult?.(seedId) ?? 1.0;
  let tile = 1.0;
  if (idx !== undefined) {
    if (state.tilesWatered?.[idx])            tile /= 0.75;
    if (state.fertilizedTiles?.[idx])         tile /= 0.75;
    if (state.uncommonFertilizedTiles?.[idx]) tile /= 0.60;
    const rot = state.rotTiles?.[idx];
    if (rot?.infectedAt !== undefined && rot?.deadAt === undefined) tile *= 0.30;
  }
  let weather = 1.0;
  const now = Date.now();
  if (STATE.session.droughtEndsAt && now < STATE.session.droughtEndsAt) weather *= 0.75;
  if (STATE.session.rainEndsAt    && now < STATE.session.rainEndsAt)    weather *= 1.20;
  return gs * season * dayNight * tile * weather;
}

// Remaining real seconds until crop is ready, based on burnedSeconds progress.
function remSec(td, idx) {
  const base   = SEEDS[td.seed].grow;
  const burned = td.burnedSeconds ?? 0;
  if (burned >= base) return 0;
  return (base - burned) / getEffectiveSpeedMult(td.seed, idx);
}

// isReady uses burnedSeconds so day/night shifts don't undo accumulated progress.
function isReady(td, idx) {
  return (td.burnedSeconds ?? 0) >= SEEDS[td.seed].grow;
}

function canCapacity()       { return STATE.upgrades.copperSpout ? 2 : 1; }
function canFillTime()       { return STATE.upgrades.copperSpout ? 8000 : 20000; }

// Recomputes STATE.modifiers from STATE.upgrades + STATE.prestige.
// Speed/value chains: highest purchased tier wins — tiers do NOT stack.
// Sell-speed chain: same (lowest multiplier = fastest = wins).
// Tile-level modifiers (fertilizer, water) remain per-crop at grow/sell time.
function recalculateModifiers() {
  const mods     = STATE.modifiers;
  const bought   = STATE.upgrades;
  const prestige = STATE.prestige || {};
  // Prestige perk total = stacks bought (prestige.perks[id]) × valuePerStack from PRESTIGE_PERKS (data.js).
  const perkTotal = id => {
    const perk = (window.PRESTIGE_PERKS || []).find(p => p.id === id);
    return ((prestige.perks && prestige.perks[id]) || 0) * (perk ? perk.valuePerStack : 0);
  };

  // ── growSpeed: highest tier value wins, no stacking ───────────────────────
  const SPEED_TIERS = [
    ['quickRoots',     1.15],
    ['fertilizerI',    1.30],
    ['fertilizerII',   1.50],
    ['fertilizerIII',  1.75],
    ['fertilizerIV',   2.10],
    ['fertilizerV',    2.60],
    ['fertilizerVI',   3.20],
    ['fertilizerVII',  4.00],
    ['fertilizerVIII', 5.00],
    ['fertilizerIX',   6.50],
    ['fertilizerX',    8.50],
  ];
  let growSpeed = 1;
  for (const [id, val] of SPEED_TIERS) { if (bought[id]) growSpeed = val; }
  mods.growSpeed = growSpeed * (1 + perkTotal('fertileLegacy'));

  // ── sellValue: highest tier value wins, no stacking ───────────────────────
  const VALUE_TIERS = [
    ['goldenHarvest',    1.30],
    ['marketEye',        1.70],
    ['merchantTouch',    2.20],
    ['marketMastery',    3.00],
    ['marketPinnacle',   4.00],
    ['goldenEmpire',     5.50],
    ['diamondTrade',     7.50],
    ['platinumExchange', 10.00],
    ['celestialMarket',  14.00],
    ['infiniteHarvest',  20.00],
    ['godlyYield',       30.00],
  ];
  let sellValue = 1;
  for (const [id, val] of VALUE_TIERS) { if (bought[id]) sellValue = val; }
  mods.sellValue = sellValue * (1 + perkTotal('goldenMemory'));

  // ── sellInterval: highest tier (lowest multiplier) wins, then prestige ─────
  const SELL_SPEED_TIERS = [
    ['swiftMarketI',    0.80],
    ['swiftMarketII',   0.65],
    ['swiftMarketIII',  0.52],
    ['swiftMarketIV',   0.42],
    ['swiftMarketV',    0.33],
    ['swiftMarketVI',   0.26],
    ['swiftMarketVII',  0.20],
    ['swiftMarketVIII', 0.15],
    ['swiftMarketIX',   0.11],
    ['swiftMarketX',    0.08],
  ];
  let sellSpeedMult = 1;
  for (const [id, val] of SELL_SPEED_TIERS) { if (bought[id]) sellSpeedMult = val; }
  // Swift Return: each stack shaves 15% off the interval (additive, no floor).
  const swiftReturnFactor = 1 - perkTotal('swiftReturn');
  mods.sellInterval = 10000 * sellSpeedMult * swiftReturnFactor;

  // ── sellBoxCapacity ────────────────────────────────────────────────────────
  if      (bought.diamondSellBox)   mods.sellBoxCapacity = 8;
  else if (bought.titaniumSellBox)  mods.sellBoxCapacity = 5;
  else if (bought.steelSellBox)     mods.sellBoxCapacity = 3;
  else if (bought.ironSellBox)      mods.sellBoxCapacity = 2;
  else                              mods.sellBoxCapacity = 1;

  // ── crankClickMultiplier: per-click boost factor ───────────────────────────
  // (the accumulated boost lives in STATE.session.crankMultiplier)
  if      (bought.diamondCrank)   mods.crankClickMultiplier = 1.085;
  else if (bought.titaniumCrank)  mods.crankClickMultiplier = 1.060;
  else if (bought.steelCrank)     mods.crankClickMultiplier = 1.040;
  else if (bought.ironCrank)      mods.crankClickMultiplier = 1.025;
  else                            mods.crankClickMultiplier = 1.015;

  // ── eventResistance: per-event reduction from mitigation upgrades (BALANCE.events) plus Thick Skin ──
  // hawkNet and herbicideII are flag-only (reduce quantity/spread, not spawn chance).
  const tsk = perkTotal('thickSkin');             // per prestige stack, applies to every event
  mods.eventResistance = {};
  for (const [id, ev] of Object.entries(BALANCE.events)) {
    const owned = Object.entries(ev.resist || {}).filter(([upg]) => bought[upg]).map(([, r]) => r);
    const fromUpgrades = ev.stack === 'add'
      ? owned.reduce((sum, r) => sum + r, 0)
      : 1 - owned.reduce((keep, r) => keep * (1 - r), 1);
    mods.eventResistance[id] = fromUpgrades + tsk;
  }

  // ── craftSpeedMult: highest tier wins ────────────────────────────────────
  if      (bought.masterWorkshop)  mods.craftSpeedMult = 1.60;
  else if (bought.journeymanForge) mods.craftSpeedMult = 1.40;
  else if (bought.apprenticeBench) mods.craftSpeedMult = 1.25;
  else                             mods.craftSpeedMult = 1.0;

  // ── craftSlots ────────────────────────────────────────────────────────────
  if      (bought.tripleCraftSlot) mods.craftSlots = 3;
  else if (bought.dualCraftSlot)   mods.craftSlots = 2;
  else                             mods.craftSlots = 1;

  if (typeof applyArtifacts === 'function') applyArtifacts();
  if (typeof Seasons !== 'undefined') Seasons.applySeasonEffects();
}

// ══════════════════════════════
// EVENT CHANCES
// ══════════════════════════════
// Reads a BALANCE value that may be a { stage: value } map (entry for the highest stage reached).
function stageValue(v, stage) {
  if (typeof v !== 'object') return v;
  let out;
  for (const k of Object.keys(v).map(Number).sort((a, b) => a - b)) if (stage >= k) out = v[k];
  return out;
}
// Probability for one roll of event `id` right now: base chance × season × (1 − resistance).
function eventChance(id) {
  const ev    = BALANCE.events[id];
  const base  = stageValue(ev.chance, getCurrentStage().stage);
  const sMult = ev.season ? (STATE.modifiers[ev.season] || 1) : 1;
  const res   = Math.min(BALANCE.eventResistanceCap, STATE.modifiers.eventResistance[id] || 0);
  return base * sMult * (1 - res);
}
function eventInterval(id) { return stageValue(BALANCE.events[id].interval, getCurrentStage().stage); }

// ══════════════════════════════
// PURCHASES
// ══════════════════════════════
// The one purchase path for upgrades (UPGRADES) and shop items (ITEMS). Returns true when bought.
// Always recalculates modifiers and saves. Render code calls this, then redraws.
const EXPANSION_FLAGS = {
  expand:'expanded', expandBottom:'expandedBottom', expand2ndCol:'expand2ndCol',
  expand2ndRow:'expand2ndRow', expand3rdCol:'expand3rdCol', expand3rdRow:'expand3rdRow',
};
function applyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (u) {
    if (state.upgrades[id] || state.coins < u.cost) return false;
    state.coins -= u.cost;
    state.upgrades[id] = true;
    if (EXPANSION_FLAGS[u.type]) {
      state[EXPANSION_FLAGS[u.type]] = true;
      while (state.tiles.length < tileCount()) state.tiles.push(null);
    }
  } else if (!_buyItem(id)) {
    return false;
  }
  recalculateModifiers();
  if (u) {
    if (u.id === 'workshop' && typeof checkFreeRecipes === 'function') checkFreeRecipes();
    log(`⬆️ ${u.name} purchased`, 'unlock');
    EventBus.emit('upgrade:purchased', { id });
    if (typeof checkAchievements === 'function') checkAchievements();
  }
  save();
  return true;
}

// Item half of applyUpgrade: checks the price and grants the item. Only applyUpgrade calls this.
function _buyItem(id) {
  const it = ITEMS[id];
  if (!it) return false;
  if (id === 'hiredHand') {
    const total = (state.hiredHandCount || 0) + Object.keys(state.hiredHandAssignments || {}).length;
    if (total >= it.maxOwned || (STATE.meta.reputation || 0) < it.repCost) return false;
    STATE.meta.reputation -= it.repCost;
    state.hiredHandCount = (state.hiredHandCount || 0) + 1;
    log('👨‍🌾 Hired hand hired!', 'system');
    return true;
  }
  if (state.coins < it.cost) return false;
  if (id === 'wateringCan' && state.items && state.items.wateringCan) return false;
  if (id === 'copperSpout' && state.upgrades.copperSpout) return false;
  state.coins -= it.cost;
  switch (id) {
    case 'wateringCan':
      if (!state.items) state.items = {};
      state.items.wateringCan = true; state.canCharges = 0;
      break;
    case 'copperSpout':
      state.upgrades.copperSpout = true;
      log(`${coinHTML()} Copper Spout installed — fill time 8s, capacity 2`, 'unlock');
      break;
    case 'cage':         state.cageCount           = (state.cageCount           || 0) + 1; break;
    case 'fertilizer':   state.fertCharges         = (state.fertCharges         || 0) + 1; break;
    case 'uncommonFert': state.uncommonFertCharges = (state.uncommonFertCharges || 0) + 1; break;
  }
  return true;
}
