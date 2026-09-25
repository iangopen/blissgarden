import { RECIPES, SEEDS } from '../data.js';
import { STATE, coinHTML, fmt, formatNumber, state } from '../state.js';
import { save } from '../save.js';
import { canCapacity } from '../upgrades.js';
import { EventBus } from '../core/bus.js';
import { log } from '../render/log.js';
import { addCoins } from './index.js';
import { sfx } from '../audio.js';
import { Particles } from '../particles.js';
import { RenderPanel } from '../render/panel.js';
import { RenderSellbox, showPop } from '../render/sellbox.js';

// ── SELL QUEUE ─────────────────────────────────────────────────────────────
export function addToSellQueue(seed, bonus = 1.0, drowned = false, fungal = false) {
  const wasEmpty = state.sellQueue.length === 0;
  state.sellQueue.push({ seed, bonus, drowned, fungal });
  if (wasEmpty) STATE.session.sellElapsed = 0;
  const sb = document.getElementById('sell-box');
  if (sb) { sb.classList.remove('sell-bounce'); void sb.offsetWidth; sb.classList.add('sell-bounce'); }
  RenderSellbox.renderQueue(); save();
}

export function tickSellBox() {
  if (!state.sellQueue.length) return;
  const maxSell = STATE.modifiers.sellBoxCapacity;
  let totalCoins = 0, sold = 0;
  for (let s = 0; s < maxSell && state.sellQueue.length > 0; s++) {
    const item = state.sellQueue.shift();
    // Unknown ids are skipped and logged — an exception here would freeze the whole tick loop.
    const recipe = item && RECIPES && RECIPES.find(r => r.id === item.seed);
    if (!item || (item.crafted ? !recipe : !SEEDS[item.seed])) {
      console.warn('tickSellBox: skipping unknown sell-queue item', item);
      log(`⚠️ Skipped unknown item in sell box (${item ? item.seed : '?'})`, 'system');
      continue;
    }
    let coins;
    if (item.crafted) {
      coins = recipe.sellValue;
      state.stats.craftedSold = (state.stats.craftedSold || 0) + 1;
      log(`${recipe.emoji} ${recipe.name} sold for ${coinHTML()}${formatNumber(coins)}`, 'earnings');
    } else if (item.fungal) {
      coins = 0;
      log(`${SEEDS[item.seed].icon} ${SEEDS[item.seed].name} sold for ${coinHTML()}${formatNumber(coins)} (fungal)`, 'earnings');
    } else if (item.drowned) {
      coins = Math.round(SEEDS[item.seed].sell * (item.bonus || 1));
      log(`${SEEDS[item.seed].icon} ${SEEDS[item.seed].name} sold for ${coinHTML()}${formatNumber(coins)}`, 'earnings');
    } else {
      coins = Math.round(SEEDS[item.seed].sell * STATE.modifiers.sellValue * (STATE.modifiers.seasonSellMult || 1) * (item.bonus || 1));
      log(`${SEEDS[item.seed].icon} ${SEEDS[item.seed].name} sold for ${coinHTML()}${formatNumber(coins)}`, 'earnings');
    }
    totalCoins += coins; sold++;
  }
  if (sold > 0) {
    if (sold === 1) sfx.sell(); else sfx.sellAuto();
    const sb = document.getElementById('sell-box');
    const r  = sb.getBoundingClientRect();
    Particles.coinBurst(r.left + r.width / 2, r.top + r.height / 2);
    showPop(`+${coinHTML()}${formatNumber(totalCoins)}`, r.left + r.width / 2, r.top - 6);
    addCoins(totalCoins);
    EventBus.emit('crop:sold', { coins: totalCoins });
  }
  RenderSellbox.renderQueue(); save();
}

export function canTick() {
  if (!state.items || !state.items.wateringCan || !state.canRefillAt) return;
  if (Date.now() >= state.canRefillAt) {
    state.canCharges  = Math.min(canCapacity(), (state.canCharges || 0) + 1);
    state.canRefillAt = 0;
    RenderPanel.renderInventory(); RenderPanel.renderItems(); save();
  } else {
    const el = document.getElementById('can-fill-timer');
    if (el) el.textContent = fmt(Math.max(0, (state.canRefillAt - Date.now()) / 1000));
  }
}
