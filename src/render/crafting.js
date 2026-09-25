import { ACHIEVEMENTS, RECIPES, SEEDS } from '../data.js';
import { STATE, coinHTML, fmt, formatNumber, mk, state } from '../state.js';
import { save } from '../save.js';
import { craftItem, unlockRecipe } from '../crafting.js';
import { DragSystem, moveGhost, startCraftedDrag } from '../drag.js';
import { RenderInventory } from './inventory.js';
import { Tooltip } from '../tooltip.js';
import { EventBus } from '../core/bus.js';

// ══════════════════════════════
// CRAFTING MODAL RENDER
// ══════════════════════════════
export const RenderCrafting = (() => {
  let _bodyEl = null;
  let _activeTab = 'recipes';
  const _collapsed = new Set(); // tier numbers currently collapsed

  function _init() {
    _bodyEl = document.getElementById('crafting-modal-body');
    if (!_bodyEl) return;
    // Make the body a flex column so we can stick queue+tabs and scroll content
    _bodyEl.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;padding:0;flex:1;min-height:0';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _isRecipeIng(id) {
    return !!(RECIPES || []).find(r => r.id === id);
  }

  function _ingHeld(id) {
    if (_isRecipeIng(id)) return (state.craftedInventory || {})[id] || 0;
    return (state.inventory || {})[id] || 0;
  }

  function _ingLabel(id) {
    const r = (RECIPES || []).find(r => r.id === id);
    if (r) return `${r.emoji} ${r.name}`;
    const s = SEEDS[id];
    return s ? `${s.icon} ${s.name}` : id;
  }

  // Ingredient is a crafted item whose recipe the player hasn't unlocked yet
  function _ingUnknown(id) {
    return _isRecipeIng(id) && !STATE.recipeUnlocks[id];
  }

  // ── Tier metadata ──────────────────────────────────────────────────────────
  const T_STARS  = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
  const T_NAMES  = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const T_COLORS = ['', 'rgba(255,255,255,.6)', '#c8d87c', '#6dd8e8', '#c08de8', '#f0d080'];

  // ── Queue section (sticky top) ─────────────────────────────────────────────
  function _buildQueue(parent) {
    const queue    = state.craftQueue || [];
    const maxSlots = STATE.modifiers.craftSlots || 1;
    const now      = Date.now();

    const sec = mk('div');
    sec.id = 'cq-section';
    sec.style.cssText = 'flex-shrink:0;padding:10px 14px 8px;border-bottom:1px solid rgba(0,0,0,.35);background:rgba(0,0,0,.12)';

    const hdr = mk('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:7px';
    const hdrL = mk('span'); hdrL.style.cssText = 'font-size:12px;font-weight:700;color:#f0d080';
    hdrL.textContent = '⚒️ Active Queue';
    const hdrR = mk('span'); hdrR.style.cssText = 'font-size:11px;color:rgba(255,255,255,.4)';
    hdrR.textContent = `${queue.length} / ${maxSlots} slot${maxSlots !== 1 ? 's' : ''}`;
    hdr.appendChild(hdrL); hdr.appendChild(hdrR);
    sec.appendChild(hdr);

    for (let i = 0; i < maxSlots; i++) {
      const q      = queue[i];
      const slot   = mk('div');
      const active = !!q;
      slot.style.cssText =
        `display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:6px;margin-bottom:${i < maxSlots - 1 ? 4 : 0}px;` +
        `background:${active ? 'rgba(0,0,0,.22)' : 'rgba(0,0,0,.08)'};` +
        `border:1px solid ${active ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)'}`;

      if (active) {
        const recipe  = (RECIPES || []).find(r => r.id === q.recipeId);
        const total   = Math.max(1, q.finishAt - q.startedAt);
        const elapsed = Math.min(now - q.startedAt, total);
        const pct     = Math.min(100, (elapsed / total) * 100);
        const remSecs = Math.max(0, Math.ceil((q.finishAt - now) / 1000));

        const info = mk('div'); info.style.cssText = 'flex:1;min-width:0';

        const top = mk('div'); top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px';
        const nm = mk('span'); nm.style.cssText = 'font-size:11px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        nm.textContent = recipe ? `${recipe.emoji} ${recipe.name}` : q.recipeId;
        const tm = mk('span'); tm.style.cssText = 'font-size:11px;color:#f0c060;font-weight:600;flex-shrink:0;margin-left:6px';
        tm.textContent = fmt(remSecs);
        top.appendChild(nm); top.appendChild(tm);
        info.appendChild(top);

        const bar  = mk('div'); bar.style.cssText  = 'height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden';
        const fill = mk('div'); fill.id = `cq-fill-${i}`; fill.style.cssText = `height:100%;width:${pct.toFixed(1)}%;background:linear-gradient(90deg,#3a7a3a,#68bb50);border-radius:2px`;
        bar.appendChild(fill); info.appendChild(bar);
        tm.id = `cq-time-${i}`;

        slot.appendChild(info);
      } else {
        const empty = mk('span'); empty.style.cssText = 'font-size:10px;color:rgba(255,255,255,.22);font-style:italic';
        empty.textContent = `Slot ${i + 1} — empty`;
        slot.appendChild(empty);
      }

      sec.appendChild(slot);
    }

    parent.appendChild(sec);
  }

  // ── Tab bar (sticky below queue) ──────────────────────────────────────────
  function _buildTabBar(parent) {
    const craftedInv  = state.craftedInventory || {};
    const invTotal    = Object.values(craftedInv).reduce((s, n) => s + n, 0);
    const shopRecipes = (RECIPES || []).filter(r => r.unlockType === 'purchase');
    const shopBought  = shopRecipes.filter(r => STATE.recipeUnlocks[r.id]).length;

    const bar = mk('div');
    bar.style.cssText = 'display:flex;flex-shrink:0;border-bottom:2px solid rgba(0,0,0,.35);background:rgba(0,0,0,.15)';

    [
      ['recipes',   '📜 Recipes'],
      ['shop',      `🛒 Shop${shopBought < shopRecipes.length ? ` (${shopRecipes.length - shopBought})` : ' ✅'}`],
      ['inventory', `🎒 Inventory${invTotal > 0 ? ` (${invTotal})` : ''}`],
    ].forEach(([id, label]) => {
      const active = _activeTab === id;
      const btn = mk('button');
      btn.style.cssText =
        `flex:1;padding:8px 4px;border:none;border-bottom:2px solid ${active ? '#f0d080' : 'transparent'};` +
        `margin-bottom:-2px;cursor:pointer;font-size:10px;font-weight:700;letter-spacing:.2px;` +
        `background:${active ? 'rgba(255,255,255,.08)' : 'transparent'};` +
        `color:${active ? '#f0d080' : 'rgba(255,255,255,.45)'};transition:color .15s,background .15s`;
      btn.textContent = label;
      btn.addEventListener('click', () => { _activeTab = id; renderCraftingPanel(); });
      bar.appendChild(btn);
    });

    parent.appendChild(bar);
  }

  // ── Recipes tab ────────────────────────────────────────────────────────────
  function _buildRecipesTab(scroll) {
    if (!STATE.upgrades.workshop) {
      const msg = mk('div');
      msg.style.cssText = 'padding:36px 20px;text-align:center';
      msg.innerHTML =
        `<div style="font-size:2.4rem;margin-bottom:12px">🔨</div>` +
        `<div style="font-size:13px;font-weight:600;color:#fff">Purchase the Workshop upgrade to unlock crafting.</div>` +
        `<div style="margin-top:8px;font-size:12px;color:#f0d080">${coinHTML()}5,000 in the Upgrades panel</div>`;
      scroll.appendChild(msg);
      return;
    }

    const queue      = state.craftQueue || [];
    const slotsUsed  = queue.length;
    const maxSlots   = STATE.modifiers.craftSlots || 1;
    const queueFull  = slotsUsed >= maxSlots;
    const speedMult  = STATE.modifiers.craftSpeedMult || 1;

    [1, 2, 3, 4, 5].forEach(tier => {
      const recipes = (RECIPES || []).filter(r => r.tier === tier);
      if (!recipes.length) return;

      const unlockedCount = recipes.filter(r => STATE.recipeUnlocks[r.id]).length;
      const collapsed     = _collapsed.has(tier);

      // ── Tier header ──────────────────────────────────────────────────────
      const tierHdr = mk('div');
      tierHdr.style.cssText =
        `display:flex;align-items:center;justify-content:space-between;` +
        `padding:9px 14px;cursor:pointer;user-select:none;` +
        `background:rgba(0,0,0,.18);border-top:1px solid rgba(0,0,0,.28)`;
      tierHdr.addEventListener('click', () => {
        if (_collapsed.has(tier)) _collapsed.delete(tier); else _collapsed.add(tier);
        renderCraftingPanel();
      });

      const left = mk('div'); left.style.cssText = 'display:flex;align-items:center;gap:7px';
      const starsEl = mk('span'); starsEl.style.cssText = `font-size:10px;color:${T_COLORS[tier]}`;
      starsEl.textContent = T_STARS[tier];
      const nameEl  = mk('span'); nameEl.style.cssText  = `font-size:12px;font-weight:700;color:${T_COLORS[tier]}`;
      nameEl.textContent = T_NAMES[tier];
      left.appendChild(starsEl); left.appendChild(nameEl);

      const right = mk('div'); right.style.cssText = 'display:flex;align-items:center;gap:8px';
      const cntEl = mk('span'); cntEl.style.cssText = 'font-size:10px;color:rgba(255,255,255,.38)';
      cntEl.textContent = `${unlockedCount}/${recipes.length} unlocked`;
      const chevEl = mk('span'); chevEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,.3)';
      chevEl.textContent = collapsed ? '▶' : '▼';
      right.appendChild(cntEl); right.appendChild(chevEl);

      tierHdr.appendChild(left); tierHdr.appendChild(right);
      scroll.appendChild(tierHdr);

      if (collapsed) return;

      // ── Recipe cards ─────────────────────────────────────────────────────
      const wrap = mk('div'); wrap.style.cssText = 'padding:6px 10px 8px';

      recipes.forEach(recipe => {
        const unlocked = !!STATE.recipeUnlocks[recipe.id];
        const card = mk('div');
        card.style.cssText =
          `margin-bottom:6px;padding:10px 11px;border-radius:7px;` +
          `background:${unlocked ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.18)'};` +
          `border:1px solid ${unlocked ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)'}`;

        // Header row: emoji + name + stars
        const cardHdr = mk('div'); cardHdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:5px';
        const nameWrap = mk('div'); nameWrap.style.cssText = 'display:flex;align-items:center;gap:6px';
        const emEl = mk('span'); emEl.style.cssText = `font-size:1.35rem;line-height:1;${!unlocked ? 'filter:grayscale(1);opacity:.45' : ''}`;
        emEl.textContent = recipe.emoji;
        const nmEl = mk('div'); nmEl.style.cssText = `font-weight:700;font-size:12px;color:${unlocked ? '#fff' : 'rgba(255,255,255,.4)'}`;
        nmEl.textContent = recipe.name;
        nameWrap.appendChild(emEl); nameWrap.appendChild(nmEl);
        const stEl = mk('span'); stEl.style.cssText = `font-size:9px;opacity:.55;color:${T_COLORS[tier]}`;
        stEl.textContent = T_STARS[tier];
        cardHdr.appendChild(nameWrap); cardHdr.appendChild(stEl);
        card.appendChild(cardHdr);

        if (unlocked) {
          // Craft time + sell value
          const meta = mk('div'); meta.style.cssText = 'display:flex;gap:12px;font-size:10px;color:rgba(255,255,255,.42);margin-bottom:6px';
          const tEl = mk('span'); tEl.textContent = `⏱ ${fmt(recipe.craftTime / speedMult)}`;
          const vEl = mk('span'); vEl.innerHTML = `${coinHTML()}${formatNumber(recipe.sellValue)} / item`;
          meta.appendChild(tEl); meta.appendChild(vEl);
          card.appendChild(meta);

          // Ingredients
          const ings = mk('div'); ings.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px';
          let allMet = true;
          Object.entries(recipe.ingredients).forEach(([id, needed]) => {
            const tag = mk('span');
            tag.style.cssText = 'font-size:10px;padding:2px 6px;border-radius:3px;white-space:nowrap;font-weight:500';
            if (_ingUnknown(id)) {
              tag.style.cssText += ';background:rgba(0,0,0,.35);color:rgba(255,255,255,.3)';
              tag.textContent = '🔒 Unknown';
              allMet = false;
            } else {
              const held = _ingHeld(id);
              const met  = held >= needed;
              if (!met) allMet = false;
              tag.style.cssText += met
                ? ';background:rgba(50,110,40,.45);color:#9ef09e'
                : ';background:rgba(160,50,30,.4);color:#ffaa90';
              tag.textContent = `${_ingLabel(id)}: ${held}/${needed}`;
            }
            ings.appendChild(tag);
          });
          card.appendChild(ings);

          // Status button
          const btn = mk('button', 'ug-btn');
          btn.style.cssText = 'width:100%;font-size:11px;padding:5px 0;border-radius:5px';
          if (!STATE.upgrades.workshop) {
            btn.textContent = 'Workshop Required'; btn.disabled = true;
          } else if (queueFull) {
            btn.textContent = 'Queue full'; btn.disabled = true;
          } else if (!allMet) {
            btn.textContent = 'Queue'; btn.disabled = true;
          } else {
            btn.textContent = 'Queue'; btn.disabled = false; btn.style.background = '#3a7a3a';
          }
          btn.addEventListener('click', e => { e.stopPropagation(); craftItem(recipe.id); renderCraftingPanel(); });
          card.appendChild(btn);
        } else {
          // Locked card — show unlock hint
          const lockRow = mk('div'); lockRow.style.cssText = 'font-size:11px;color:rgba(255,190,70,.7);line-height:1.4';
          if (recipe.unlockType === 'purchase') {
            lockRow.innerHTML = `🔒 Purchase for ${coinHTML()}${formatNumber(recipe.unlockCost)} — see <em>Shop</em> tab`;
          } else if (recipe.unlockType === 'prestige') {
            lockRow.textContent = `🔒 Prestige ${recipe.unlockPrestige} required`;
          } else if (recipe.unlockType === 'achievement') {
            const ach = (ACHIEVEMENTS || []).find(a => a.id === recipe.unlockAchievementId);
            lockRow.textContent = `🏆 Achievement: ${ach ? ach.name : recipe.unlockAchievementId}`;
          }
          card.appendChild(lockRow);
        }

        wrap.appendChild(card);
      });

      scroll.appendChild(wrap);
    });
  }

  // ── Blueprint Shop tab ─────────────────────────────────────────────────────
  function _buildShopTab(scroll) {
    const shopRecipes = (RECIPES || []).filter(r => r.unlockType === 'purchase');

    const hdr = mk('div'); hdr.style.cssText = 'padding:12px 14px 3px;font-size:12px;font-weight:700;color:#f0d080';
    hdr.textContent = '🛒 Blueprint Shop';
    scroll.appendChild(hdr);

    const sub = mk('div'); sub.style.cssText = 'padding:0 14px 10px;font-size:10px;color:rgba(255,255,255,.38)';
    sub.textContent = 'Buy recipe unlocks to craft them in the Recipes tab.';
    scroll.appendChild(sub);

    // Sort: unowned first, then by tier
    const sorted = [...shopRecipes].sort((a, b) => {
      const aOwned = STATE.recipeUnlocks[a.id] ? 1 : 0;
      const bOwned = STATE.recipeUnlocks[b.id] ? 1 : 0;
      return aOwned - bOwned || a.tier - b.tier;
    });

    sorted.forEach(recipe => {
      const owned     = !!STATE.recipeUnlocks[recipe.id];
      const canAfford = !owned && state.coins >= recipe.unlockCost;
      const color     = T_COLORS[recipe.tier] || 'rgba(255,255,255,.4)';

      const row = mk('div');
      row.style.cssText =
        `display:flex;align-items:center;gap:10px;margin:3px 12px;padding:9px 11px;border-radius:7px;` +
        `background:${owned ? 'rgba(60,110,40,.18)' : 'rgba(255,255,255,.05)'};` +
        `border:1px solid ${owned ? '#4a7a30' : 'rgba(255,255,255,.1)'}`;

      const emEl = mk('span'); emEl.style.cssText = 'font-size:1.5rem;line-height:1;flex-shrink:0';
      emEl.textContent = recipe.emoji;

      const info = mk('div'); info.style.cssText = 'flex:1;min-width:0';
      const nmEl = mk('div'); nmEl.style.cssText = 'font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      nmEl.textContent = recipe.name;
      const mtEl = mk('div'); mtEl.style.cssText = `font-size:10px;color:${color};margin-top:2px`;
      mtEl.innerHTML = `${T_STARS[recipe.tier]} ${T_NAMES[recipe.tier]} · sells ${coinHTML()}${formatNumber(recipe.sellValue)} / item`;
      info.appendChild(nmEl); info.appendChild(mtEl);

      if (owned) {
        const badge = mk('span');
        badge.style.cssText = 'flex-shrink:0;font-size:10px;font-weight:700;color:#6ec46e;padding:3px 8px;background:rgba(80,160,50,.15);border-radius:4px;white-space:nowrap';
        badge.textContent = '✅ Unlocked';
        row.appendChild(emEl); row.appendChild(info); row.appendChild(badge);
      } else {
        const btn = mk('button', 'ug-btn');
        btn.style.cssText = `flex-shrink:0;font-size:11px;padding:4px 10px;${canAfford ? 'background:#7a5a2a' : ''}`;
        btn.disabled = !canAfford;
        btn.innerHTML = `${coinHTML()}${formatNumber(recipe.unlockCost)}`;
        btn.addEventListener('click', e => { e.stopPropagation(); unlockRecipe(recipe.id); renderCraftingPanel(); });
        row.appendChild(emEl); row.appendChild(info); row.appendChild(btn);
      }

      scroll.appendChild(row);
    });

    // Spacer
    const sp = mk('div'); sp.style.cssText = 'height:12px';
    scroll.appendChild(sp);
  }

  // ── Inventory tab ──────────────────────────────────────────────────────────
  function _buildInventoryTab(scroll) {
    const craftedInv = state.craftedInventory || {};
    const items = (RECIPES || []).filter(r => (craftedInv[r.id] || 0) > 0);

    const hdr = mk('div'); hdr.style.cssText = 'padding:12px 14px 3px;font-size:12px;font-weight:700;color:#f0d080';
    hdr.textContent = '🎒 Crafted Items';
    scroll.appendChild(hdr);

    const sub = mk('div'); sub.style.cssText = 'padding:0 14px 10px;font-size:10px;color:rgba(255,255,255,.38)';
    sub.textContent = 'Drag items to the sell box to sell them.';
    scroll.appendChild(sub);

    if (!items.length) {
      const empty = mk('div');
      empty.style.cssText = 'padding:20px 14px;font-size:11px;color:rgba(255,255,255,.3);font-style:italic;text-align:center';
      empty.textContent = 'No crafted items yet — queue a recipe above.';
      scroll.appendChild(empty);
      return;
    }

    const grid = mk('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:0 12px 14px';

    items.forEach(recipe => {
      const qty  = craftedInv[recipe.id] || 0;
      const card = mk('div');
      card.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;' +
        'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);cursor:grab';
      card.title = `Drag ${recipe.name} to sell box`;
      if (typeof Tooltip !== 'undefined') card.dataset.tooltip = Tooltip.invCraftedTip(recipe.id, qty);

      const emEl = mk('span'); emEl.style.cssText = 'font-size:1.5rem;line-height:1;flex-shrink:0;pointer-events:none';
      emEl.textContent = recipe.emoji;

      const info = mk('div'); info.style.cssText = 'flex:1;min-width:0;pointer-events:none;overflow:hidden';
      const nmEl = mk('div'); nmEl.style.cssText = 'font-size:11px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      nmEl.textContent = recipe.name;
      const mtEl = mk('div'); mtEl.style.cssText = 'font-size:10px;color:rgba(255,255,255,.45);margin-top:1px';
      mtEl.innerHTML = `×${qty} ${coinHTML()}${formatNumber(recipe.sellValue)}`;
      info.appendChild(nmEl); info.appendChild(mtEl);

      card.appendChild(emEl); card.appendChild(info);
      DragSystem.touch(card, e => {
        e.stopPropagation();
        if (!state.craftedInventory) state.craftedInventory = {};
        if ((state.craftedInventory[recipe.id] || 0) < 1) return;
        state.craftedInventory[recipe.id]--;
        if (state.craftedInventory[recipe.id] <= 0) delete state.craftedInventory[recipe.id];
        RenderInventory.renderInventory(); save();
        startCraftedDrag(recipe.id, recipe.emoji);
        moveGhost(e.clientX, e.clientY);
        renderCraftingPanel();
      });
      grid.appendChild(card);
    });

    scroll.appendChild(grid);
  }

  // ── Public ────────────────────────────────────────────────────────────────
  function renderCraftingPanel() {
    if (!_bodyEl) _init();
    if (!_bodyEl) return;

    _bodyEl.innerHTML = '';
    _bodyEl.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;padding:0;flex:1;min-height:0';

    if (!STATE.upgrades.workshop) {
      const msg = mk('div');
      msg.style.cssText = 'padding:36px 20px;text-align:center;overflow-y:auto;flex:1';
      msg.innerHTML =
        `<div style="font-size:2.4rem;margin-bottom:12px">🔨</div>` +
        `<div style="font-size:13px;font-weight:600;color:#fff">Purchase the Workshop upgrade to unlock crafting.</div>` +
        `<div style="margin-top:8px;font-size:12px;color:#f0d080">${coinHTML()}5,000 in the Upgrades panel</div>`;
      _bodyEl.appendChild(msg);
      return;
    }

    _buildQueue(_bodyEl);
    _buildTabBar(_bodyEl);

    const scroll = mk('div');
    scroll.style.cssText = 'overflow-y:auto;flex:1;min-height:0';
    scroll.id = 'crafting-scroll';
    _bodyEl.appendChild(scroll);

    if (_activeTab === 'recipes')        _buildRecipesTab(scroll);
    else if (_activeTab === 'shop')      _buildShopTab(scroll);
    else                                 _buildInventoryTab(scroll);
  }

  // Lightweight tick — updates progress bar widths + time labels in-place
  // without rebuilding the entire DOM. Called every 50ms from the display loop.
  function tickQueue() {
    if (!isOpen()) return;
    const sec = document.getElementById('cq-section');
    if (!sec) return;
    const queue = state.craftQueue || [];
    const now   = Date.now();
    queue.forEach((q, i) => {
      const fill = document.getElementById(`cq-fill-${i}`);
      const tm   = document.getElementById(`cq-time-${i}`);
      if (!fill && !tm) return;
      const total   = Math.max(1, q.finishAt - q.startedAt);
      const elapsed = Math.min(now - q.startedAt, total);
      const pct     = Math.min(100, (elapsed / total) * 100);
      const remSecs = Math.max(0, Math.ceil((q.finishAt - now) / 1000));
      if (fill) fill.style.width = pct.toFixed(1) + '%';
      if (tm)   tm.textContent   = fmt(remSecs);
    });
  }

  function isOpen() {
    const m = document.getElementById('crafting-modal');
    return !!(m && m.style.display === 'flex');
  }

  // Subscriptions that replaced direct calls (breaks crafting ↔ render/crafting and render/inventory ↔ render/crafting).
  function start() {
    EventBus.on('crafting:changed', ({ onlyIfOpen }) => { if (!onlyIfOpen || isOpen()) renderCraftingPanel(); });
    EventBus.on('inventory:rendered', () => renderCraftingPanel());
  }

  return { renderCraftingPanel, tickQueue, isOpen, start };
})();
