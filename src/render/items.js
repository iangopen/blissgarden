import { ITEMS } from '../data.js';
import { STATE, coinHTML, fmt, formatNumber, mk, state } from '../state.js';
import { applyUpgrade, canCapacity, canFillTime } from '../upgrades.js';
import { getCurrentStage, updateCoins } from '../events/index.js';
import { RenderHUD } from './hud.js';
import { RenderInventory } from './inventory.js';

export const RenderItems = (() => {
  let _itemsEl      = null;
  let _wcCard       = null, _wcBtn = null, _wcDescSpan = null, _wcStatusSpan = null;
  let _spoutCard    = null, _spoutBtn = null;
  let _cageCard     = null, _cageBtn = null;
  let _fertCard     = null, _fertBtn = null;
  let _ufertCard    = null, _ufertBtn = null;
  let _hhCard       = null, _hhBtn = null, _hhRepSpan = null;

  function buildItems() {
    _itemsEl = document.getElementById('items-list');
    if (!_itemsEl) return;

    // Watering Can
    _wcCard = mk('div', 'upgrade-card');
    const wcNameDiv = mk('div', 'ug-name'); wcNameDiv.textContent = '💧 Watering Can';
    const wcDescDiv = mk('div', 'ug-desc');
    _wcDescSpan = mk('span', ''); wcDescDiv.appendChild(_wcDescSpan);
    _wcStatusSpan = mk('span', ''); wcDescDiv.appendChild(_wcStatusSpan);
    const wcBotDiv = mk('div', 'ug-bottom');
    wcBotDiv.innerHTML = `<span class="ug-cost">${coinHTML()}${formatNumber(ITEMS.wateringCan.cost)}</span>`;
    _wcBtn = mk('button', 'ug-btn');
    _wcBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('wateringCan')) { updateCoins(); RenderInventory.renderInventory(); }
    });
    wcBotDiv.appendChild(_wcBtn);
    _wcCard.appendChild(wcNameDiv); _wcCard.appendChild(wcDescDiv); _wcCard.appendChild(wcBotDiv);
    _itemsEl.appendChild(_wcCard);

    // Copper Spout
    _spoutCard = mk('div', 'upgrade-card');
    _spoutCard.innerHTML = `<div class="ug-name">${coinHTML()} Copper Spout</div><div class="ug-desc">Upgrade the can: fill time reduced to 8s, capacity increases to 2 charges.</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(ITEMS.copperSpout.cost)}</span><button class="ug-btn">Buy</button></div>`;
    _spoutBtn = _spoutCard.querySelector('.ug-btn');
    _spoutBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('copperSpout')) { updateCoins(); RenderInventory.renderInventory(); }
    });
    _itemsEl.appendChild(_spoutCard);

    // Cage
    _cageCard = mk('div', 'upgrade-card');
    _cageCard.innerHTML = `<div class="ug-name">🔒 Cage</div><div class="ug-desc">Drag from inventory onto a tile for 75% crow resistance. Stays until removed.</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(ITEMS.cage.cost)}</span><button class="ug-btn">Buy</button></div>`;
    _cageBtn = _cageCard.querySelector('.ug-btn');
    _cageBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('cage')) { updateCoins(); RenderInventory.renderInventory(); }
    });
    _itemsEl.appendChild(_cageCard);

    // Common Fertilizer
    _fertCard = mk('div', 'upgrade-card');
    _fertCard.innerHTML = `<div class="ug-name">🌿 Common Fertilizer</div><div class="ug-desc">Drag from inventory onto any tile. Crops grown there are 25% faster permanently.</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(ITEMS.fertilizer.cost)}</span><button class="ug-btn">Buy</button></div>`;
    _fertBtn = _fertCard.querySelector('.ug-btn');
    _fertBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('fertilizer')) { updateCoins(); RenderInventory.renderInventory(); }
    });
    _itemsEl.appendChild(_fertCard);

    // Uncommon Fertilizer
    _ufertCard = mk('div', 'upgrade-card');
    _ufertCard.innerHTML = `<div class="ug-name">⚗️ Uncommon Fertilizer</div><div class="ug-desc">Drag from inventory onto any tile. Crops grown there are 40% faster permanently.</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(ITEMS.uncommonFert.cost)}</span><button class="ug-btn">Buy</button></div>`;
    _ufertBtn = _ufertCard.querySelector('.ug-btn');
    _ufertBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('uncommonFert')) { updateCoins(); RenderInventory.renderInventory(); }
    });
    _itemsEl.appendChild(_ufertCard);

    // Hired Hand
    _hhCard = mk('div', 'upgrade-card');
    _hhRepSpan = mk('span', ''); _hhRepSpan.style.cssText = 'font-size:10px;color:#f0d080';
    _hhCard.innerHTML = `<div class="ug-name">👨‍🌾 Hired Hand</div><div class="ug-desc">${ITEMS.hiredHand.desc}</div>`;
    _hhCard.appendChild(_hhRepSpan);
    const hhBotDiv = mk('div', 'ug-bottom'); hhBotDiv.style.marginTop = '4px';
    const hhCostSpan = mk('span', 'ug-cost'); hhCostSpan.textContent = `⭐${ITEMS.hiredHand.repCost} rep`;
    hhBotDiv.appendChild(hhCostSpan);
    _hhBtn = mk('button', 'ug-btn'); _hhBtn.textContent = 'Hire';
    _hhBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (applyUpgrade('hiredHand')) { RenderInventory.renderInventory(); RenderItems.renderItems(); RenderHUD.renderReputation(); }
    });
    hhBotDiv.appendChild(_hhBtn); _hhCard.appendChild(hhBotDiv);
    _itemsEl.appendChild(_hhCard);
  }

  function renderItems() {
    if (!_itemsEl) buildItems();
    const wcOwned    = !!(state.items && state.items.wateringCan);
    const spoutOwned = !!(state.upgrades && state.upgrades.copperSpout);

    _wcCard.classList.toggle('bought', wcOwned);
    _wcBtn.disabled = wcOwned || state.coins < ITEMS.wateringCan.cost;
    _wcBtn.textContent = wcOwned ? 'Owned' : 'Buy';
    const fillSecs = wcOwned ? canFillTime() / 1000 : 20;
    _wcDescSpan.textContent = `Click can in inventory to fill (${fillSecs}s). Drag charged can onto growing crop. +25% speed & value.`;
    if (wcOwned) {
      const ch = state.canCharges || 0, cap = canCapacity();
      let statusHtml = '';
      if (ch > 0) statusHtml += `<span style="color:#6cf;font-size:10px"> ● ${ch}/${cap} charge${ch > 1 ? 's' : ''} ready</span>`;
      if (state.canRefillAt) {
        const rem = Math.max(0, (state.canRefillAt - Date.now()) / 1000);
        statusHtml += `<span style="opacity:.5;font-size:10px"> Filling in ${fmt(rem)}</span>`;
      }
      _wcStatusSpan.innerHTML = statusHtml;
    } else {
      _wcStatusSpan.innerHTML = '';
    }

    _spoutCard.style.display = wcOwned ? '' : 'none';
    if (wcOwned) {
      _spoutCard.classList.toggle('bought', spoutOwned);
      _spoutBtn.disabled = spoutOwned || state.coins < ITEMS.copperSpout.cost;
      _spoutBtn.textContent = spoutOwned ? 'Owned' : 'Buy';
    }

    _cageBtn.disabled  = state.coins < ITEMS.cage.cost;
    _fertBtn.disabled  = state.coins < ITEMS.fertilizer.cost;
    _ufertBtn.disabled = state.coins < ITEMS.uncommonFert.cost;

    const stage = getCurrentStage().stage;
    _hhCard.style.display = stage >= 4 ? '' : 'none';
    if (stage >= 4) {
      const rep   = STATE.meta.reputation || 0;
      const total = (state.hiredHandCount || 0) + Object.keys(state.hiredHandAssignments || {}).length;
      _hhRepSpan.textContent = `⭐ ${rep} reputation`;
      const hh    = ITEMS.hiredHand;
      _hhBtn.disabled = total >= hh.maxOwned || rep < hh.repCost;
      _hhBtn.textContent = total >= hh.maxOwned ? `Max (${hh.maxOwned})` : 'Hire';
    }
  }

  return { renderItems };
})();
