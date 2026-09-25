import { SEEDS } from '../data.js';
import { getGridDims, mk, state, tileCount } from '../state.js';
import { save } from '../save.js';
import { eventChance, isReady } from '../upgrades.js';
import { EventBus } from '../core/bus.js';
import { checkAchievements } from '../achievements.js';
import { log, showBanner } from '../render/log.js';
import { getCurrentStage } from './index.js';

// ══════════════════════════════════════════════════════════════════════════
// STAGE 5 EVENTS
// ══════════════════════════════════════════════════════════════════════════


export function getAdjacentIdxs(idx) {
  const { cols } = getGridDims();
  const total = tileCount();
  const result = [];
  if (idx >= cols)             result.push(idx - cols);
  if (idx + cols < total)      result.push(idx + cols);
  if (idx % cols !== 0)        result.push(idx - 1);
  if ((idx + 1) % cols !== 0)  result.push(idx + 1);
  return result;
}

// ── VOID RIFTS ─────────────────────────────────────────────────────────────
export function voidRiftTick() {
  if (!state.mature || getCurrentStage().stage < 5) return;
  if (Math.random() < eventChance('voidRift')) voidRiftOpen();
}

export function voidRiftOpen() {
  if (state.upgrades.voidSeal && Object.keys(state.voidRifts || {}).length >= 1) return;
  const cands = [];
  for (let i = 0; i < tileCount(); i++) {
    if (state.voidRifts     && state.voidRifts[i]     !== undefined) continue;
    if (state.mounds        && state.mounds[i]        !== undefined) continue;
    if (state.weeds         && state.weeds[i]         !== undefined) continue;
    if (state.thornedWeeds  && state.thornedWeeds[i]  !== undefined) continue;
    if (state.claimedTiles  && state.claimedTiles[i])                continue;
    if (state.rotTiles      && state.rotTiles[i]      && state.rotTiles[i].deadAt !== undefined) continue;
    cands.push(i);
  }
  if (!cands.length) return;

  if (!state.firstVoidRiftEver) {
    state.firstVoidRiftEver = true;
    showBanner('🌀 Reality is fracturing.');
  }

  const idx = cands[Math.floor(Math.random() * cands.length)];
  if (!state.voidRifts) state.voidRifts = {};
  state.voidRifts[idx] = { openedAt: Date.now(), clicks: 0 };
  log('🌀 A void rift opened!', 'event');
  EventBus.emit('event:voidRift');
  EventBus.emit('tile:changed', idx); save();
}

export function voidRiftEffectTick() {
  if (!state.voidRifts) return;
  const keys = Object.keys(state.voidRifts);
  if (!keys.length) return;
  let dilationFactor = 0.10;
  if (state.upgrades.timeDilation)   dilationFactor *= 0.50;
  if (state.upgrades.riftStabilizer) dilationFactor *= 0.70;
  keys.forEach(k => {
    const idx = parseInt(k);
    getAdjacentIdxs(idx).forEach(adj => {
      const td = state.tiles[adj];
      if (!td || !td.seed || isReady(td, adj)) return;
      if (td.burnedSeconds !== undefined && td.burnedSeconds > 0) {
        td.burnedSeconds = Math.max(0, td.burnedSeconds * (1 - dilationFactor));
      }
    });
  });
  EventBus.emit('grid:changed');
}

// ── COSMIC CROWS ───────────────────────────────────────────────────────────
export function cosmicCrowTick() {
  if (!state.mature || getCurrentStage().stage < 5) return;
  if (Math.random() < eventChance('cosmicCrow')) cosmicCrowAttack();
}

export function cosmicCrowAttack() {
  if (!state.firstCosmicCrowEver) {
    state.firstCosmicCrowEver = true;
    showBanner('👾 Cosmic crows have arrived.');
  }

  const targets = [];
  state.loose.forEach(item => targets.push({ type:'loose', item, val: SEEDS[item.seed].sell }));
  for (let i = 0; i < tileCount(); i++) {
    if (!state.tiles[i] || !isReady(state.tiles[i], i)) continue;
    targets.push({ type:'tile', idx:i, val: SEEDS[state.tiles[i].seed].sell });
  }
  for (let i = 0; i < tileCount(); i++) {
    if (!state.tiles[i] || isReady(state.tiles[i], i)) continue;
    targets.push({ type:'tile', idx:i, val: SEEDS[state.tiles[i].seed].sell });
  }
  targets.sort((a, b) => b.val - a.val);
  const toSteal = targets.slice(0, 3);
  if (!toSteal.length) return;

  let stolen = 0;
  toSteal.forEach(t => {
    if (t.type === 'loose') {
      const i = state.loose.findIndex(l => l.id === t.item.id);
      if (i !== -1) {
        log(`👾 A cosmic crow snatched a ${SEEDS[t.item.seed].name}!`, 'attack');
        state.loose.splice(i, 1); stolen++;
      }
    } else {
      if (state.tiles[t.idx]) {
        log(`👾 A cosmic crow snatched a ${SEEDS[state.tiles[t.idx].seed].name}!`, 'attack');
        state.tiles[t.idx] = null;
        if (state.tilesWatered) delete state.tilesWatered[t.idx];
        if (state.rotTiles)     delete state.rotTiles[t.idx];
        EventBus.emit('tile:changed', t.idx); stolen++;
      }
    }
  });
  if (stolen > 0) {
    EventBus.emit('event:cosmicCrow');
    state.stats.crowsSurvived = (state.stats.crowsSurvived || 0) + 1;
    if (typeof checkAchievements === 'function') checkAchievements();
    EventBus.emit('loose:changed'); animateCosmicCrow(); save();
  }
}

export function animateCosmicCrow() {
  for (let i = 0; i < 3; i++) {
    const el = mk('div','cosmic-crow-anim');
    el.textContent = '👾';
    el.style.top          = (5 + Math.random() * 60) + 'vh';
    el.style.animationDelay = (i * 0.15) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 2800);
  }
}

// ── REALITY STORMS ─────────────────────────────────────────────────────────
export function realityStormTick() {
  if (!state.mature || getCurrentStage().stage < 5) return;
  if (Math.random() < eventChance('realityStorm')) realityStormAttack();
}

export function realityStormAttack() {
  if (!state.firstRealityStormEver) {
    state.firstRealityStormEver = true;
    showBanner('🌌 Reality storms are tearing through.');
  }
  if (state.fertilizedTiles) {
    Object.keys(state.fertilizedTiles).forEach(k => {
      if (Math.random() < 0.40) delete state.fertilizedTiles[k];
    });
  }
  if (state.uncommonFertilizedTiles) {
    Object.keys(state.uncommonFertilizedTiles).forEach(k => {
      if (Math.random() < 0.40) delete state.uncommonFertilizedTiles[k];
    });
  }
  if (state.cages && state.cages.length && !(state.upgrades.realityAnchor || state.upgrades.quantumCage)) {
    const survived = state.cages.filter(() => Math.random() >= 0.40);
    const removed  = state.cages.length - survived.length;
    state.cages      = survived;
    state.cageCount  = (state.cageCount || 0) + removed;
  }
  if (state.tilesWatered) Object.keys(state.tilesWatered).forEach(k => { delete state.tilesWatered[k]; });
  if (!state.upgrades.stormShelter) {
    for (let i = 0; i < tileCount(); i++) {
      const td = state.tiles[i];
      if (!td || isReady(td, i)) continue;
      if (state.rotTiles && state.rotTiles[i] && state.rotTiles[i].infectedAt !== undefined) continue;
      if (Math.random() < 0.15) {
        if (!state.rotTiles) state.rotTiles = {};
        state.rotTiles[i] = { infectedAt: Date.now() };
      }
    }
  }
  log('🌌 A reality storm tore through the farm!', 'event');
  EventBus.emit('event:realityStorm');
  EventBus.emit('grid:changed');
  animateRealityStorm();
  save();
}

export function animateRealityStorm() {
  const el = mk('div','reality-storm-cloud');
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 5200);
  for (let i = 0; i < 12; i++) {
    const star = mk('div');
    star.textContent = '✦';
    star.style.cssText = `position:fixed;pointer-events:none;z-index:9986;color:rgba(200,150,255,.9);font-size:${10+Math.random()*16}px;left:${Math.random()*100}vw;top:${Math.random()*100}vh;animation:stormStarFade 1.5s ease-out ${Math.random()*2}s forwards`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 4000);
  }
}
