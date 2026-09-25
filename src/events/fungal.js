import { STATE, coinHTML, formatNumber, getGridDims, mk, state, tileCount } from '../state.js';
import { save } from '../save.js';
import { eventChance } from '../upgrades.js';
import { EventBus } from '../core/bus.js';
import { log, showBanner } from '../render/log.js';
import { getCurrentStage, hideTileMenu, updateCoins } from './index.js';

// ── FUNGAL CURE MENU ──────────────────────────────────────────────────────
export function showFungalCureMenu(idx, cost, x, y) {
  const menu = document.getElementById('tile-menu');
  menu.innerHTML = '';
  const header = mk('div');
  header.style.cssText = 'color:rgba(190,100,255,.9);font-size:10px;font-weight:700;padding:4px 8px 2px';
  header.textContent = '🍄 Fungal Bloom';
  menu.appendChild(header);
  const btn = mk('button'); btn.className = 'tmenu-btn';
  btn.innerHTML = `🧹 Clear — ${coinHTML()}${formatNumber(cost)}`;
  if (state.coins < cost) { btn.disabled = true; btn.style.opacity = '0.4'; }
  btn.addEventListener('mousedown', e => {
    e.stopPropagation();
    if (state.coins < cost) return;
    state.coins -= cost;
    if (state.fungalTiles) delete state.fungalTiles[idx];
    if (state.tiles[idx]) {
      state.tiles[idx] = null;
      if (state.tilesWatered) delete state.tilesWatered[idx];
      if (state.rotTiles)     delete state.rotTiles[idx];
    }
    log('✅ Fungal tile cleared.', 'event');
    updateCoins(); EventBus.emit('tile:changed', idx); save(); hideTileMenu();
  });
  menu.appendChild(btn);
  menu.style.left = Math.min(x, window.innerWidth  - 200) + 'px';
  menu.style.top  = Math.min(y, window.innerHeight - 80)  + 'px';
  menu.style.display = 'block';
}

// ── FUNGAL ────────────────────────────────────────────────────────────────
export function fungalSpawnTick() {
  if (!state.mature || getCurrentStage().stage < 3) return;
  if (Math.random() < eventChance('fungal')) fungalBloom();
}

export function fungalBloom() {
  const cands = [];
  for (let i = 0; i < tileCount(); i++) {
    if (state.fungalTiles    && state.fungalTiles[i]    !== undefined) continue;
    if (state.weeds          && state.weeds[i]          !== undefined) continue;
    if (state.thornedWeeds   && state.thornedWeeds[i]   !== undefined) continue;
    if (state.mounds         && state.mounds[i]         !== undefined) continue;
    if (state.rotTiles       && state.rotTiles[i]       && state.rotTiles[i].deadAt !== undefined) continue;
    cands.push(i);
  }
  if (!cands.length) return;
  if (!state.firstFungalEver) {
    state.firstFungalEver = true;
    showBanner('🍄 A fungal bloom has taken root.');
  }
  STATE.session.debugCounts.fungal++;
  if (!state.fungalTiles) state.fungalTiles = {};
  const idx = cands[Math.floor(Math.random() * cands.length)];
  state.fungalTiles[idx] = { spawnedAt: Date.now() };
  log('🍄 Fungal bloom appeared!', 'event');
  EventBus.emit('event:fungal');
  EventBus.emit('tile:changed', idx); save();
}

export function fungalSpreadTick() {
  if (!state.fungalTiles || state.upgrades.containment) return;
  const total = Object.keys(state.fungalTiles).length;
  if (total === 0 || total >= 4) return;
  fungalSpread();
}

export function fungalSpread() {
  if (!state.fungalTiles) return;
  const fungalIdxs = Object.keys(state.fungalTiles).map(Number);
  if (fungalIdxs.length >= 4) return;
  const { cols } = getGridDims();
  const tc       = tileCount();
  const adjSet   = new Set();
  fungalIdxs.forEach(idx => {
    const r = Math.floor(idx / cols), c = idx % cols;
    [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => {
      if (nr < 0 || nc < 0 || nc >= cols) return;
      const ni = nr * cols + nc;
      if (ni >= tc) return;
      if (state.fungalTiles[ni]  !== undefined) return;
      if (state.weeds        && state.weeds[ni]        !== undefined) return;
      if (state.thornedWeeds && state.thornedWeeds[ni] !== undefined) return;
      if (state.mounds       && state.mounds[ni]       !== undefined) return;
      if (state.rotTiles     && state.rotTiles[ni]     && state.rotTiles[ni].deadAt !== undefined) return;
      adjSet.add(ni);
    });
  });
  if (!adjSet.size) return;
  const adjArr = [...adjSet];
  const target = adjArr[Math.floor(Math.random() * adjArr.length)];
  state.fungalTiles[target] = { spawnedAt: Date.now() };
  log('🍄 Fungal bloom spread.', 'event');
  EventBus.emit('tile:changed', target); save();
}
