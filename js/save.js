// ── ACTIVE SAVE KEY (flat state) ─────────────────────────────────────────
const KEY     = 'blissfarm10';
const KEY_OLD = 'blissfarm9';

window.save = function save() {
  localStorage.setItem(KEY, JSON.stringify({ ...state, stage: STATE.meta.stage, nextId, panelExpanded, panelWidth, debugMode: STATE.settings.debugMode, reducedMotion: STATE.settings.reducedMotion, showBanners: STATE.settings.showBanners, dayOffset: STATE.meta.dayOffset, prestige: STATE.prestige, reputation: STATE.meta.reputation, artifacts: STATE.artifacts, blueprints: STATE.blueprints, recipeUnlocks: STATE.recipeUnlocks, farmName: STATE.meta.farmName, seasonIndex: STATE.meta.seasonIndex, seasonStartTime: STATE.meta.seasonStartTime, tutorialDone: STATE.meta.tutorialDone, tradingPost: STATE.tradingPost, logFilters: STATE.settings.logFilters, minigames: { soilMixer: STATE.minigames.soilMixer, waterFlow: STATE.minigames.waterFlow } }));
};

window.load = function load() {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) raw = localStorage.getItem(KEY_OLD);
    const d = JSON.parse(raw || 'null');
    if (!d) return false;
    state.coins           = d.coins           ?? 10;
    // One all-time counter. Builds between the audit and phase 1b also wrote a separate allTimeGold; keep the larger.
    state.coinsEarned     = Math.max(d.coinsEarned ?? 0, d.allTimeGold ?? 0);
    STATE.meta.dayOffset      = d.dayOffset            ?? null;
    state.milestones      = d.milestones      ?? {};
    state.stagesSeen      = d.stagesSeen      ?? {};
    // Highest stage ever reached: never lower than what stagesSeen or a saved stage says.
    STATE.meta.stage      = Math.max(d.stage ?? 0, Object.keys(state.stagesSeen).reduce((m, s) => Math.max(m, parseInt(s)), 0));
    for (let s = 1; s <= STATE.meta.stage; s++) state.stagesSeen[s] = true;
    state.mature          = d.mature          ?? false;
    state.tiles           = d.tiles           ?? Array(9).fill(null);
    state.inventory       = d.inventory       ?? {};
    state.seedInventory   = d.seedInventory   ?? {};
    state.bagInventory    = d.bagInventory    ?? {};
    // Older builds stripped `crafted` on load; restore it for queue items whose id is a recipe, not a seed.
    const _isRecipeId = id => !SEEDS[id] && !!(window.RECIPES || []).find(r => r.id === id);
    state.sellQueue       = (d.sellQueue || []).map(item =>
      typeof item === 'string'
        ? { seed: item, bonus: 1, drowned: false, fungal: false, crafted: _isRecipeId(item) }
        : { seed: item.seed, bonus: item.bonus ?? 1, drowned: item.drowned ?? false, fungal: item.fungal ?? false,
            crafted: item.crafted ?? _isRecipeId(item.seed) });
    state.upgrades                = d.upgrades                ?? {};
    if (state.upgrades.crankUpI && !state.upgrades.ironCrank) state.upgrades.ironCrank = true;
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
    state.canCharges      = d.canCharges  ?? (d.wellFull ? 1 : 0);
    state.canRefillAt     = d.canRefillAt ?? ((!d.wellFull && d.wellRefillAt) ? d.wellRefillAt : 0);
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
    nextId        = d.nextId        ?? 0;
    panelExpanded = d.panelExpanded ?? false;
    panelWidth    = Math.max(200, Math.min(500, d.panelWidth ?? 280));
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
