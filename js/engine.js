// ══════════════════════════════
// EVENT BUS
// ══════════════════════════════
window.EventBus = {
  listeners: {},
  on(e, fn)  { (this.listeners[e] ??= []).push(fn); },
  off(e, fn) { if (this.listeners[e]) this.listeners[e] = this.listeners[e].filter(f => f !== fn); },
  emit(e, data) { (this.listeners[e] ?? []).slice().forEach(fn => fn(data)); },
};

// ══════════════════════════════
// TIMER MANAGER
// ══════════════════════════════
// interval may be a number or a () => number function (for dynamic timers).
// restart(id) resets elapsed so the timer picks up the current interval fresh.
window.TimerManager = {
  timers: {},

  register(id, { interval, fn, condition }) {
    this.timers[id] = { interval, fn, condition, elapsed: 0 };
  },

  unregister(id) {
    delete this.timers[id];
  },

  restart(id) {
    if (this.timers[id]) this.timers[id].elapsed = 0;
  },

  getRemaining(id) {
    const t = this.timers[id];
    if (!t) return 0;
    const interval = typeof t.interval === 'function' ? t.interval() : t.interval;
    return Math.max(0, interval - t.elapsed);
  },

  tick() {
    for (const t of Object.values(this.timers)) {
      t.elapsed += 50;
      const interval = typeof t.interval === 'function' ? t.interval() : t.interval;
      if (t.elapsed >= interval && t.condition()) {
        t.fn();
        t.elapsed = 0;
      }
    }
  },
};

setInterval(() => TimerManager.tick(), 50);

// ══════════════════════════════
// TIMER REGISTRATIONS
// ══════════════════════════════
const _stage = n => () => STATE.meta.stage >= n;

TimerManager.register('crow',    { interval: 10000,  condition: _stage(1), fn: () => {} });
TimerManager.register('weed',    { interval: 8000,   condition: _stage(1), fn: () => {} });
TimerManager.register('hawk',    { interval: 15000,  condition: _stage(2), fn: () => {} });
TimerManager.register('mole',    { interval: 45000,  condition: _stage(2), fn: () => {} });
TimerManager.register('rootRot', { interval: 180000, condition: _stage(3), fn: () => {} });
TimerManager.register('locust',  { interval: 30000,  condition: _stage(3), fn: () => {} });
TimerManager.register('blight',  { interval: 300000, condition: _stage(3), fn: () => {} });
TimerManager.register('fungal',        { interval: 240000, condition: _stage(3), fn: () => {} });
TimerManager.register('landDeveloper', { interval: 180000, condition: _stage(4), fn: () => {} });
TimerManager.register('plagueRat',     { interval: 40000,  condition: _stage(4), fn: () => {} });
TimerManager.register('acidRain',      { interval: 300000, condition: _stage(4), fn: () => {} });
TimerManager.register('voidRift',      { interval: 240000, condition: _stage(5), fn: () => {} });
TimerManager.register('cosmicCrow',    { interval: 12000,  condition: _stage(5), fn: () => {} });
TimerManager.register('realityStorm',  { interval: 360000, condition: _stage(5), fn: () => {} });
TimerManager.register('save',          { interval: 10000,  condition: () => true, fn: () => {} });
TimerManager.register('craftTick',     { interval: 50,     condition: () => true, fn: () => {} });
TimerManager.register('seasonTick',    { interval: 50,     condition: () => true, fn: () => {} });

// ══════════════════════════════
// TIMER WIRING
// ══════════════════════════════
function setupTimers() {
  const cond = (minStage, checkMature = true) => () =>
    (!checkMature || state.mature) && getCurrentStage().stage >= minStage;

  TimerManager.timers['crow'].fn        = Events.crowTick;
  TimerManager.timers['crow'].condition = cond(0);
  TimerManager.timers['weed'].fn        = Events.weedTick;
  TimerManager.timers['weed'].condition = cond(0);
  TimerManager.timers['hawk'].fn        = Events.hawkTick;
  TimerManager.timers['hawk'].condition = cond(2);
  TimerManager.timers['hawk'].interval  = () => getCurrentStage().stage >= 3 ? 10000 : 15000;
  TimerManager.timers['mole'].fn        = Events.moleTick;
  TimerManager.timers['mole'].condition = cond(2);
  TimerManager.timers['rootRot'].fn        = Events.rootRotSpawnTick;
  TimerManager.timers['rootRot'].condition = cond(3);
  TimerManager.timers['locust'].fn      = Events.locustTick;
  TimerManager.timers['locust'].condition = cond(3);
  TimerManager.timers['blight'].fn      = Events.blightTick;
  TimerManager.timers['blight'].condition = cond(3);
  TimerManager.timers['fungal'].fn        = Events.fungalSpawnTick;
  TimerManager.timers['fungal'].condition = cond(3);
  TimerManager.timers['landDeveloper'].fn        = Events.landDeveloperTick;
  TimerManager.timers['landDeveloper'].condition = cond(4);
  TimerManager.timers['plagueRat'].fn        = Events.plagueRatTick;
  TimerManager.timers['plagueRat'].condition = cond(4);
  TimerManager.timers['acidRain'].fn        = Events.acidRainTick;
  TimerManager.timers['acidRain'].condition = cond(4);
  TimerManager.timers['voidRift'].fn        = Events.voidRiftTick;
  TimerManager.timers['voidRift'].condition = cond(5);
  TimerManager.timers['cosmicCrow'].fn      = Events.cosmicCrowTick;
  TimerManager.timers['cosmicCrow'].condition = cond(5);
  TimerManager.timers['realityStorm'].fn    = Events.realityStormTick;
  TimerManager.timers['realityStorm'].condition = cond(5);
  TimerManager.timers['save'].fn        = save;
  TimerManager.timers['save'].condition = () => true;
  TimerManager.timers['craftTick'].fn        = window.craftTick;
  TimerManager.timers['craftTick'].condition = () => true;
  TimerManager.timers['seasonTick'].fn        = () => { if (typeof Seasons !== 'undefined') Seasons.tick(); };
  TimerManager.timers['seasonTick'].condition = () => true;

  TimerManager.register('mound',        { interval: 1000, condition: () => true, fn: Events.moundTick });
  TimerManager.register('rot',          { interval: 1000, condition: () => true, fn: Events.rotTick });
  TimerManager.register('claimedTile',   { interval: 1000, condition: () => true, fn: Events.claimedTileTick });
  TimerManager.register('diseasedTile',  { interval: 1000, condition: () => true, fn: Events.diseasedTileTick });
  TimerManager.register('voidRiftEffect',{ interval: 5000, condition: () => true, fn: Events.voidRiftEffectTick });
  TimerManager.register('thornedWeed',  { interval: 1000,  condition: () => true, fn: Events.thornedWeedTick });
  TimerManager.register('fungalSpread', { interval: 30000, condition: () => true, fn: Events.fungalSpreadTick });
  TimerManager.register('masterFarmer', { interval: 1000,  condition: () => true, fn: Events.masterFarmerTick });
  TimerManager.register('hiredHand',    { interval: 1000,  condition: () => Object.keys(state.hiredHandAssignments || {}).length > 0, fn: () => {
    if (!state.hiredHandAssignments) return;
    let changed = false;
    Object.keys(state.hiredHandAssignments).forEach(k => {
      const idx = parseInt(k);
      const td = state.tiles[idx];
      if (!td || !isReady(td, idx)) return;
      const cx = window.innerWidth  / 2 + (Math.random() - 0.5) * 200;
      const cy = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
      const rotInf = !!(state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].infectedAt !== undefined && state.rotTiles[idx].deadAt === undefined);
      const bonus  = rotInf ? 0.5 : (td.sellBonus || 1.0);
      const drowned = rotInf || (td.drowned || false);
      if (state.rotTiles) delete state.rotTiles[idx];
      dropLoose(td.seed, cx, cy, bonus, drowned, false);
      state.tiles[idx] = null;
      if (state.tilesWatered) delete state.tilesWatered[idx];
      RenderFarm.renderTile(idx);
      log(`👨‍🌾 Hired hand harvested a ${SEEDS[td.seed].name}!`, 'growth');
      changed = true;
    });
    if (changed) { renderLoose(); save(); }
  }});
  TimerManager.register('crankDecay',   { interval: 1000,  condition: () => state.upgrades.windUpCrank, fn: () => {
    if (STATE.session.crankMultiplier > 1.0) {
      const cm = STATE.session.crankMultiplier;
      STATE.session.crankMultiplier = Math.max(1.0, cm / (1 + (cm - 1) * 0.08));
      RenderSellbox.updateCrankLabel();
    }
  }});

  TimerManager.register('display', { interval: 50, condition: () => true, fn: () => {
    if (state.sellQueue && state.sellQueue.length) {
      STATE.session.sellElapsed = (STATE.session.sellElapsed || 0) + 50;
      const effectiveInterval = STATE.modifiers.sellInterval / STATE.session.crankMultiplier;
      if (STATE.session.sellElapsed >= effectiveInterval) {
        tickSellBox();
        STATE.session.sellElapsed = 0;
      }
    }
    // Tick burnedSeconds for every growing tile (permanent — not undone by day/night shifts).
    const _frostActive = typeof Seasons !== 'undefined' && Seasons.isFrostActive();
    for (let i = 0; i < tileCount(); i++) {
      const td = state.tiles[i];
      if (!td || !td.seed) continue;
      if (state.claimedTiles && state.claimedTiles[i]) continue;
      if (state.voidRifts    && state.voidRifts[i]    !== undefined) continue;
      const base = window.SEEDS?.[td.seed]?.grow;
      if (!base) continue;
      if (td.burnedSeconds === undefined) {
        // Seed from plantedAt on first encounter (backward compat with existing saves).
        const gs      = STATE.modifiers.growSpeed || 1;
        const elapsed = Math.max(0, (Date.now() - td.plantedAt) / 1000);
        td.burnedSeconds = Math.min(base, elapsed / gs);
      }
      if (td.burnedSeconds < base) {
        // Frost freezes night-themed crops
        if (_frostActive && typeof Seasons !== 'undefined' && Seasons.isNightSeed(td.seed)) continue;
        td.burnedSeconds += 0.05 * getEffectiveSpeedMult(td.seed, i);
        if (td.burnedSeconds > base) td.burnedSeconds = base;
      }
    }
    if (typeof RenderCrafting !== 'undefined') RenderCrafting.tickQueue();
    updateTimers();
    RenderSellbox.updateSellTimer();
    RenderSellbox.updateCrankLabel();
    canTick();
    RenderEnv.updateSky();
  }});
}
