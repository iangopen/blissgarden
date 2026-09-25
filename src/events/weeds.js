import { STATE, getGridDims, state, tileCount } from '../state.js';
import { save } from '../save.js';
import { eventChance } from '../upgrades.js';
import { log, showBanner } from '../render/log.js';
import { getCurrentStage } from './index.js';
import { EventBus } from '../core/bus.js';

// ── WEEDS ─────────────────────────────────────────────────────────────────
export function weedTick() {
  if (!state.mature) return;
  if (Math.random() < eventChance('weed')) weedSpawn();
}

export function weedSpawn() {
  const tc    = tileCount();
  const empty = [];
  for (let i = 0; i < tc; i++) {
    if (!state.tiles[i] &&
        !(state.weeds        && state.weeds[i]        !== undefined) &&
        !(state.thornedWeeds && state.thornedWeeds[i] !== undefined) &&
        !(state.mounds       && state.mounds[i]       !== undefined) &&
        !(state.fungalTiles  && state.fungalTiles[i]  !== undefined)) empty.push(i);
  }
  if (!empty.length) return;

  const stage = getCurrentStage().stage;
  const spawnThorned = stage >= 3 || (stage >= 2 && Math.random() < eventChance('thornedWeed'));

  if (spawnThorned) {
    const cands = empty.filter(i => !state.cages.includes(i) || Math.random() > 0.60);
    if (!cands.length) return;
    const idx = cands[Math.floor(Math.random() * cands.length)];
    if (!state.thornedWeeds) state.thornedWeeds = {};
    state.thornedWeeds[idx] = { clicks: 0, spawnedAt: Date.now() };
    STATE.session.debugCounts.weed++;
    if (!state.firstThornedEver) {
      state.firstThornedEver = true;
      showBanner('🌵 Thorned weeds are appearing!');
    }
    log('🌵 A thorned weed sprouted! (50 clicks to clear)', 'event');
    EventBus.emit('tile:changed', idx); save();
  } else {
    const idx = empty[Math.floor(Math.random() * empty.length)];
    if (!state.weeds) state.weeds = {};
    state.weeds[idx] = { clicks: 0, spawnedAt: Date.now() };
    STATE.session.debugCounts.weed++;
    if (!state.firstWeedEver) {
      state.firstWeedEver = true;
      showBanner('🌿 Weeds are beginning to appear.');
    }
    log('🌿 A weed sprouted!', 'event');
    EventBus.emit('tile:changed', idx); save();
  }
}

// ── THORNED WEED SPREAD ───────────────────────────────────────────────────
export function thornedWeedTick() {
  if (!state.thornedWeeds || state.upgrades.herbicideII) return;
  const stage    = getCurrentStage().stage;
  if (stage < 2) return;
  const spreadMs = stage >= 3 ? 30000 : 60000;
  const now      = Date.now();
  const toSpread = [];
  Object.keys(state.thornedWeeds).forEach(k => {
    const idx = parseInt(k);
    if (now - state.thornedWeeds[idx].spawnedAt >= spreadMs) toSpread.push(idx);
  });
  if (!toSpread.length) return;
  toSpread.forEach(idx => {
    delete state.thornedWeeds[idx];
    EventBus.emit('tile:changed', idx);
    const { cols } = getGridDims();
    const tc = tileCount();
    const r  = Math.floor(idx / cols), c = idx % cols;
    const adj = [];
    [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => {
      if (nr < 0 || nc < 0 || nc >= cols) return;
      const ni = nr * cols + nc;
      if (ni >= tc) return;
      if (!state.tiles[ni] &&
          !(state.weeds        && state.weeds[ni]        !== undefined) &&
          !(state.thornedWeeds && state.thornedWeeds[ni] !== undefined) &&
          !(state.mounds       && state.mounds[ni]       !== undefined)) adj.push(ni);
    });
    if (adj.length) {
      const target = adj[Math.floor(Math.random() * adj.length)];
      if (!state.weeds) state.weeds = {};
      state.weeds[target] = { clicks: 0 };
      log('🌿 A thorned weed spread to an adjacent tile!', 'event');
      EventBus.emit('tile:changed', target);
    }
  });
  save();
}

// ── MASTER FARMER ─────────────────────────────────────────────────────────
export function masterFarmerTick() {
  if (!state.upgrades.masterFarmer) return;
  const now = Date.now(), MS = 10000;
  let changed = false;
  if (state.weeds) {
    Object.keys(state.weeds).forEach(k => {
      const idx = parseInt(k);
      if (now - (state.weeds[idx].spawnedAt || now - MS) >= MS) {
        delete state.weeds[idx]; EventBus.emit('tile:changed', idx); changed = true;
      }
    });
  }
  if (state.thornedWeeds) {
    Object.keys(state.thornedWeeds).forEach(k => {
      const idx = parseInt(k);
      if (now - (state.thornedWeeds[idx].spawnedAt || now - MS) >= MS) {
        delete state.thornedWeeds[idx]; EventBus.emit('tile:changed', idx); changed = true;
      }
    });
  }
  if (changed) save();
}
