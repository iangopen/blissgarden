import { SEEDS, SEED_BAGS, SEED_SELL_PRICES } from '../data.js';
import { STATE, coinHTML, fmt, formatNumber, makeSpriteDiv, mk, state } from '../state.js';
import { save } from '../save.js';
import { canCapacity, canFillTime } from '../upgrades.js';
import { log } from './log.js';
import { addCoins, openBag } from '../events/index.js';
import { DragSystem, moveGhost, startDrag, startItemDrag } from '../drag.js';
import { EventBus } from '../core/bus.js';
import { RenderItems } from './items.js';
import { Tooltip } from '../tooltip.js';

export const RenderInventory = (() => {
  let _invEl = null;

  // Watering Can slot refs
  let _wcSlot = null, _wcInvIcon = null, _wcInvIconSpan = null, _wcInvBadge = null;
  let _wcFillTimer = null, _wcFillBtn = null;

  // Item slot refs
  let _cageEl = null, _cageBadge = null;
  let _fertEl = null, _fertBadge = null;
  let _ufertEl = null, _ufertBadge = null;
  let _hhEl = null, _hhBadge = null;

  // Collection slot Maps
  const _bagSlots  = new Map(); // bagId  → { slot, badge }
  const _seedSlots = new Map(); // cropId → { slot, badge }
  const _cropSlots = new Map(); // cropId → { el,   badge }
  let _emptyEl = null;

  function buildInventory() {
    _invEl = document.getElementById('inv-grid');
    if (!_invEl) return;

    // ── Watering Can ──────────────────────────────────────────────────────
    _wcSlot = mk('div', 'inv-seed-slot');
    _wcInvIcon = mk('div', 'inv-seed-icon');
    _wcInvIconSpan = document.createElement('span');
    _wcInvIconSpan.style.cssText = 'font-size:22px;line-height:1;pointer-events:none';
    _wcInvIconSpan.textContent = '💧';
    _wcInvIcon.appendChild(_wcInvIconSpan);
    _wcInvBadge = mk('span', 'inv-badge');
    _wcInvIcon.appendChild(_wcInvBadge);
    DragSystem.touch(_wcInvIcon, e => {
      e.stopPropagation();
      if ((state.canCharges || 0) < 1) return;
      state.canCharges--;
      renderInventory(); startItemDrag('water'); moveGhost(e.clientX, e.clientY);
    });
    _wcSlot.appendChild(_wcInvIcon);
    _wcFillTimer = mk('div', 'inv-seed-sell');
    _wcFillTimer.id = 'can-fill-timer';
    _wcFillTimer.style.cssText = 'background:rgba(0,0,0,.18);cursor:default;color:rgba(255,255,255,.6)';
    _wcSlot.appendChild(_wcFillTimer);
    _wcFillBtn = mk('button', 'inv-seed-sell');
    _wcFillBtn.textContent = 'Fill'; _wcFillBtn.style.background = '#3a6aac';
    _wcFillBtn.addEventListener('click', e => {
      e.stopPropagation();
      if ((state.canCharges || 0) >= canCapacity() || state.canRefillAt) return;
      if (state.upgrades.cosmicWell) {
        state.canCharges = Math.min(canCapacity(), (state.canCharges || 0) + 1);
        renderInventory(); RenderItems.renderItems(); save();
        log('💫 Cosmic well filled the can instantly!', 'growth');
      } else {
        state.canRefillAt = Date.now() + canFillTime();
        renderInventory(); RenderItems.renderItems(); save();
        log('💧 Watering can filling…', 'growth');
      }
    });
    _wcSlot.appendChild(_wcFillBtn);
    _invEl.appendChild(_wcSlot);

    // ── Cage ──────────────────────────────────────────────────────────────
    _cageEl = mk('div', 'inv-icon');
    _cageEl.dataset.name = 'Cage — drag onto a tile to place'; _cageEl.style.cursor = 'grab';
    const cageSpan = document.createElement('span');
    cageSpan.style.cssText = 'pointer-events:none;font-size:22px;line-height:1'; cageSpan.textContent = '🔒';
    _cageEl.appendChild(cageSpan);
    _cageBadge = mk('span', 'inv-badge'); _cageEl.appendChild(_cageBadge);
    DragSystem.touch(_cageEl, e => {
      e.stopPropagation();
      state.cageCount--; renderInventory(); RenderItems.renderItems();
      startItemDrag('cage'); moveGhost(e.clientX, e.clientY);
    });
    _invEl.appendChild(_cageEl);

    // ── Common Fertilizer ─────────────────────────────────────────────────
    _fertEl = mk('div', 'inv-icon');
    _fertEl.dataset.name = 'Common Fertilizer — drag onto a tile'; _fertEl.style.cursor = 'grab';
    const fertSpan = document.createElement('span');
    fertSpan.style.cssText = 'pointer-events:none;font-size:22px;line-height:1'; fertSpan.textContent = '🌿';
    _fertEl.appendChild(fertSpan);
    _fertBadge = mk('span', 'inv-badge'); _fertEl.appendChild(_fertBadge);
    DragSystem.touch(_fertEl, e => {
      e.stopPropagation();
      if ((state.fertCharges || 0) < 1) return;
      startItemDrag('fertilizer'); moveGhost(e.clientX, e.clientY);
    });
    _invEl.appendChild(_fertEl);

    // ── Uncommon Fertilizer ───────────────────────────────────────────────
    _ufertEl = mk('div', 'inv-icon');
    _ufertEl.dataset.name = 'Uncommon Fertilizer — drag onto a tile'; _ufertEl.style.cursor = 'grab';
    const ufertSpan = document.createElement('span');
    ufertSpan.style.cssText = 'pointer-events:none;font-size:22px;line-height:1'; ufertSpan.textContent = '⚗️';
    _ufertEl.appendChild(ufertSpan);
    _ufertBadge = mk('span', 'inv-badge'); _ufertEl.appendChild(_ufertBadge);
    DragSystem.touch(_ufertEl, e => {
      e.stopPropagation();
      if ((state.uncommonFertCharges || 0) < 1) return;
      startItemDrag('uncommonFert'); moveGhost(e.clientX, e.clientY);
    });
    _invEl.appendChild(_ufertEl);

    // ── Hired Hand ────────────────────────────────────────────────────────
    _hhEl = mk('div', 'inv-icon');
    _hhEl.dataset.name = 'Hired Hand — drag onto a plot to assign'; _hhEl.style.cursor = 'grab';
    const hhSpan = document.createElement('span');
    hhSpan.style.cssText = 'pointer-events:none;font-size:22px;line-height:1'; hhSpan.textContent = '👨‍🌾';
    _hhEl.appendChild(hhSpan);
    _hhBadge = mk('span', 'inv-badge'); _hhEl.appendChild(_hhBadge);
    DragSystem.touch(_hhEl, e => {
      e.stopPropagation();
      if ((state.hiredHandCount || 0) < 1) return;
      state.hiredHandCount--;
      renderInventory(); startItemDrag('hiredHand'); moveGhost(e.clientX, e.clientY);
    });
    _invEl.appendChild(_hhEl);

    // ── Bag slots ─────────────────────────────────────────────────────────
    SEED_BAGS.forEach(bag => {
      const slot = mk('div', 'inv-bag-slot');
      const icon = mk('div', 'inv-bag-icon');
      icon.dataset.name = `${bag.name} — click to open`;
      const iconSpan = document.createElement('span');
      iconSpan.style.pointerEvents = 'none'; iconSpan.textContent = bag.icon;
      icon.appendChild(iconSpan);
      const badge = mk('span', 'inv-badge'); icon.appendChild(badge);
      const openBtn = mk('button', 'inv-bag-open'); openBtn.textContent = 'Open';
      openBtn.addEventListener('click', e => { e.stopPropagation(); openBag(bag); });
      slot.appendChild(icon); slot.appendChild(openBtn);
      _invEl.appendChild(slot);
      _bagSlots.set(bag.id, { slot, badge });
    });

    // ── Seed slots ────────────────────────────────────────────────────────
    Object.keys(SEEDS).forEach(key => {
      if (SEEDS[key].ascension) return;
      const seed = SEEDS[key];
      const slot = mk('div', 'inv-seed-slot');
      const icon = mk('div', 'inv-seed-icon');
      icon.dataset.name = `${seed.name} seed — drag to plant`;
      icon.appendChild(makeSpriteDiv(key, 'seed', 40));
      const badge = mk('span', 'inv-badge'); icon.appendChild(badge);
      DragSystem.touch(icon, e => {
        e.stopPropagation();
        if ((state.seedInventory[key] || 0) < 1) return;
        state.seedInventory[key]--;
        if (state.seedInventory[key] <= 0) delete state.seedInventory[key];
        renderInventory(); save();
        startDrag(key, 'seedInventory'); moveGhost(e.clientX, e.clientY);
      });
      const price   = SEED_SELL_PRICES[key] || 0;
      const sellBtn = mk('button', 'inv-seed-sell');
      sellBtn.innerHTML = `Sell ${coinHTML()}${formatNumber(price)}`;
      sellBtn.title = `Sell ${seed.name} seed for ${price} coins`;
      sellBtn.addEventListener('click', e => {
        e.stopPropagation();
        if ((state.seedInventory[key] || 0) < 1) return;
        state.seedInventory[key]--;
        if (state.seedInventory[key] <= 0) delete state.seedInventory[key];
        addCoins(price);
        log(`🌱 Sold ${seed.name} seed for ${coinHTML()}${price}`, 'earnings');
        renderInventory(); save();
      });
      slot.appendChild(icon); slot.appendChild(sellBtn);
      _invEl.appendChild(slot);
      _seedSlots.set(key, { slot, badge, icon });
    });

    // ── Crop slots ────────────────────────────────────────────────────────
    Object.keys(SEEDS).forEach(key => {
      const el = mk('div', 'inv-icon');
      el.dataset.name = SEEDS[key].name;
      el.appendChild(makeSpriteDiv(key, 'grown', 40));
      const badge = mk('span', 'inv-badge'); el.appendChild(badge);
      DragSystem.touch(el, e => {
        e.stopPropagation();
        if ((state.inventory[key] || 0) < 1) return;
        state.inventory[key]--;
        if (state.inventory[key] <= 0) delete state.inventory[key];
        renderInventory(); save();
        startDrag(key, 'inventory'); moveGhost(e.clientX, e.clientY);
      });
      _invEl.appendChild(el);
      _cropSlots.set(key, { el, badge, key });
    });

    // ── Empty placeholder ─────────────────────────────────────────────────
    _emptyEl = mk('div'); _emptyEl.id = 'inv-empty'; _emptyEl.textContent = 'Empty';
    _invEl.appendChild(_emptyEl);
  }

  function renderInventory() {
    if (!_invEl) buildInventory();
    let count = 0;

    const wcOwned = !!(state.items && state.items.wateringCan);
    _wcSlot.style.display = wcOwned ? '' : 'none';
    if (wcOwned) {
      count++;
      const charges = state.canCharges || 0, capacity = canCapacity();
      const filling = !!(state.canRefillAt), canFill = charges < capacity && !filling;
      _wcInvIcon.style.cursor = charges > 0 ? 'grab' : 'default';
      _wcInvIcon.dataset.name = charges > 0
        ? `Watering Can (${charges}/${capacity}) — drag onto a growing crop`
        : filling ? 'Watering Can — filling…' : 'Watering Can — empty, click Fill';
      _wcInvIconSpan.style.opacity = charges > 0 ? '1' : '0.3';
      _wcInvBadge.style.display = charges > 0 ? '' : 'none';
      if (charges > 0) _wcInvBadge.textContent = charges;
      _wcFillTimer.style.display = filling ? '' : 'none';
      if (filling) _wcFillTimer.textContent = fmt(Math.max(0, (state.canRefillAt - Date.now()) / 1000));
      _wcFillBtn.style.display = canFill ? '' : 'none';
    }

    const cageHeld = state.cageCount || 0;
    _cageEl.style.display = cageHeld > 0 ? '' : 'none';
    if (cageHeld > 0) { count++; _cageBadge.textContent = cageHeld; }

    const fertHeld = state.fertCharges || 0;
    _fertEl.style.display = fertHeld > 0 ? '' : 'none';
    if (fertHeld > 0) { count++; _fertBadge.textContent = fertHeld; }

    const ufertHeld = state.uncommonFertCharges || 0;
    _ufertEl.style.display = ufertHeld > 0 ? '' : 'none';
    if (ufertHeld > 0) { count++; _ufertBadge.textContent = ufertHeld; }

    const hhHeld = state.hiredHandCount || 0;
    _hhEl.style.display = hhHeld > 0 ? '' : 'none';
    if (hhHeld > 0) { count++; _hhBadge.textContent = hhHeld; }

    const bagInv = state.bagInventory || {};
    _bagSlots.forEach(({ slot, badge }, id) => {
      const qty = bagInv[id] || 0;
      slot.style.display = qty > 0 ? '' : 'none';
      if (qty > 0) { count++; badge.textContent = qty; }
    });

    const seedInv = state.seedInventory || {};
    _seedSlots.forEach(({ slot, badge, icon }, key) => {
      const qty = seedInv[key] || 0;
      slot.style.display = qty > 0 ? '' : 'none';
      if (qty > 0) {
        count++;
        badge.textContent = qty;
        if (icon && typeof Tooltip !== 'undefined') icon.dataset.tooltip = Tooltip.invSeedTip(key, qty);
      }
    });

    _cropSlots.forEach(({ el, badge }, key) => {
      const qty = state.inventory[key] || 0;
      el.style.display = qty > 0 ? '' : 'none';
      if (qty > 0) {
        count++;
        badge.textContent = qty;
        if (typeof Tooltip !== 'undefined') {
          const seed = SEEDS[key];
          const sellVal = seed ? Math.round(seed.sell * (STATE.modifiers.sellValue || 1)) : 0;
          el.dataset.tooltip = `<b>${seed ? seed.name : key}</b><br>Quantity: ${qty}<br>Sell: ${seed ? formatNumber(sellVal) : '?'}`;
        }
      }
    });

    _emptyEl.style.display = count === 0 ? '' : 'none';
    EventBus.emit('inventory:rendered');   // render/crafting refreshes its panel
  }

  return { renderInventory };
})();
