import { ARTIFACTS, BLUEPRINTS, RECIPES, SEEDS, SEED_SELL_PRICES, UPGRADES } from './data.js';
import { STATE, fmt, formatNumber, state } from './state.js';
import { isReady, remSec } from './upgrades.js';
import { Sfx } from './audio.js';

// ══════════════════════════════
// TOOLTIP ENGINE
// ══════════════════════════════
export const Tooltip = (() => {
  let _box = null, _visible = false, _currentEl = null;

  function _getBox() {
    if (!_box) _box = document.getElementById('tooltip-box');
    return _box;
  }

  function _pos(x, y) {
    const box = _getBox();
    const ox = 14, oy = 14;
    let left = x + ox, top = y + oy;
    const W  = window.innerWidth, H = window.innerHeight;
    const bw = box.offsetWidth || 220, bh = box.offsetHeight || 80;
    if (left + bw > W - 8) left = x - bw - ox;
    if (top  + bh > H - 8) top  = y - bh - oy;
    box.style.left = Math.max(4, left) + 'px';
    box.style.top  = Math.max(4, top)  + 'px';
  }

  function _show(el, x, y) {
    const html = el.dataset.tooltip;
    if (!html) return;
    const box = _getBox();
    box.innerHTML = html;
    box.style.opacity = '0';
    box.style.display = 'block';
    requestAnimationFrame(() => { box.style.opacity = '1'; });
    _pos(x, y);
    _visible = true;
    _currentEl = el;
    if (typeof Sfx !== 'undefined' && typeof Sfx.playTooltipShow === 'function') {
      Sfx.playTooltipShow();
    }
  }

  function _hide() {
    const box = _getBox();
    box.style.display = 'none';
    box.style.opacity = '0';
    _visible = false;
    _currentEl = null;
  }

  function init() {
    const box = _getBox();
    if (!box) return;

    // Apply base styles once
    box.style.cssText = [
      'display:none', 'position:fixed', 'z-index:9999',
      'background:#2a1a0e', 'color:#f0e8d8',
      'font-size:11px', 'line-height:1.5',
      'padding:8px 12px', 'border-radius:6px',
      'max-width:220px', 'pointer-events:none',
      'border:1px solid rgba(255,255,255,.12)',
      'box-shadow:0 4px 16px rgba(0,0,0,.55)',
      'transition:opacity 0.1s ease',
      'white-space:normal', 'word-break:break-word',
    ].join(';');

    // ── Mouse: event delegation ──────────────────────────────────────────────
    document.addEventListener('mouseover', e => {
      const el = e.target.closest('[data-tooltip]');
      if (!el) return;
      if (el === _currentEl) return;
      _show(el, e.clientX, e.clientY);
    });

    document.addEventListener('mouseout', e => {
      if (!_currentEl) return;
      const rel = e.relatedTarget;
      if (rel && _currentEl.contains(rel)) return;
      _hide();
    });

    document.addEventListener('mousemove', e => {
      if (_visible) _pos(e.clientX, e.clientY);
    });

    // ── Mobile: tap to show, tap elsewhere to hide ───────────────────────────
    document.addEventListener('touchstart', e => {
      const el = e.target.closest('[data-tooltip]');
      if (el) {
        if (_currentEl === el) { _hide(); return; }
        const t = e.touches[0];
        _show(el, t.clientX, t.clientY);
      } else if (_visible) {
        _hide();
      }
    }, { passive: true });

    // Hide when scrolling panel
    const panel = document.getElementById('panel-content');
    if (panel) panel.addEventListener('scroll', _hide, { passive: true });
  }

  // ══════════════════════════════
  // CONTENT HELPERS
  // ══════════════════════════════

  function _c() { return '<span style="display:inline-block;width:13px;height:13px;background:radial-gradient(circle at 35% 35%,#F5C518,#D4A017);border:1.5px solid #A07800;border-radius:50%;vertical-align:middle;margin-right:1px;position:relative;top:-1px"></span>'; }

  function seedShopTip(key) {
    const seed = SEEDS[key];
    if (!seed) return '';
    const growMult = STATE.modifiers.growSpeed || 1;
    const sellMult = STATE.modifiers.sellValue || 1;
    const growTime = fmt(seed.grow / growMult);
    const sellVal  = Math.round(seed.sell * sellMult);
    const ratio    = seed.cost > 0 ? (sellVal / seed.cost).toFixed(1) + 'x' : '∞';
    return `<b>${seed.name}</b><br>Cost: ${_c()}${formatNumber(seed.cost)}<br>Grow: ${growTime}<br>Sell: ${_c()}${formatNumber(sellVal)}<br>Profit ratio: ${ratio}`;
  }

  function bagTip(bag) {
    const lines = bag.seeds.map((s, i) => {
      const sd = SEEDS[s];
      return `${sd ? (sd.seedIcon || sd.icon) : '?'} ${sd ? sd.name : s} &mdash; ${Math.round(bag.odds[i] * 100)}%`;
    }).join('<br>');
    return `<b>${bag.name}</b><br>Cost: ${_c()}${formatNumber(bag.cost)}<br>Opens: 3 seeds<br><br><span style="color:rgba(255,255,255,.6)">Possible seeds:</span><br>${lines}`;
  }

  function invSeedTip(key, qty) {
    const seed = SEEDS[key];
    if (!seed) return '';
    const growMult = STATE.modifiers.growSpeed || 1;
    const sellMult = STATE.modifiers.sellValue || 1;
    const seedSell = (SEED_SELL_PRICES && SEED_SELL_PRICES[key]) || 0;
    return `<b>${seed.name} Seed</b><br>Quantity: ${qty}<br>Grow: ${fmt(seed.grow / growMult)}<br>Sell when grown: ${_c()}${formatNumber(Math.round(seed.sell * sellMult))}<br>Sell seed: ${_c()}${formatNumber(seedSell)}`;
  }

  function invCraftedTip(recipeId, qty) {
    const recipe = (RECIPES || []).find(r => r.id === recipeId);
    if (!recipe) return '';
    const artUsedIn = (ARTIFACTS || []).find(a => Object.prototype.hasOwnProperty.call(a.ingredients, recipeId));
    let tip = `<b>${recipe.emoji} ${recipe.name}</b><br>Quantity: ${qty}<br>Sell: ${_c()}${formatNumber(recipe.sellValue)}`;
    if (artUsedIn) tip += `<br><small style="color:rgba(255,255,255,.55)">Used in: ${artUsedIn.name}</small>`;
    return tip;
  }

  function tileTip(idx) {
    const td = state.tiles[idx];
    if (!td) return '';
    const seed = SEEDS[td.seed];
    if (!seed) return '';
    const rdy         = isReady(td, idx);
    const sellMult    = STATE.modifiers.sellValue || 1;
    const bonusFactor = td.drowned ? 0.25 : (td.sellBonus || 1);
    const sellVal     = Math.round(seed.sell * sellMult * bonusFactor);
    const isWatered   = !!(state.tilesWatered && state.tilesWatered[idx]);
    const isFert      = !!(state.fertilizedTiles && state.fertilizedTiles[idx]);
    const isUFert     = !!(state.uncommonFertilizedTiles && state.uncommonFertilizedTiles[idx]);
    const isCaged     = !!(state.cages && state.cages.includes(idx));
    const isRot       = !!(state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].infectedAt !== undefined && state.rotTiles[idx].deadAt === undefined);
    const isFungal    = !!(state.fungalTiles && state.fungalTiles[idx]);

    let tip = `<b>${seed.name}</b><br>`;
    tip += `Status: ${rdy ? '<span style="color:#8de88d">Ready!</span>' : 'Growing'}`;
    if (!rdy) tip += `<br>Time: ${fmt(remSec(td, idx))}`;
    tip += `<br>Sell: ${_c()}${formatNumber(sellVal)}`;
    if (isWatered && !td.drowned) tip += `<br>Watered 💧`;
    if (isUFert)       tip += `<br>Uncommon Fertilized ⚗️`;
    else if (isFert)   tip += `<br>Fertilized 🌿`;
    if (isCaged)       tip += `<br>Caged 🔒`;
    if (isRot)         tip += `<br><span style="color:#ffaa70">Root Rot 🍂</span>`;
    if (td.drowned)    tip += `<br><span style="color:#88aaff">Drowned 💀</span>`;
    if (isFungal)      tip += `<br><span style="color:#d080ff">Fungal 🍄</span>`;
    return tip;
  }

  function upgradeTip(u) {
    let tip = `<b>${u.name}</b><br><span style="color:rgba(255,255,255,.65)">${u.desc}</span><br>Cost: ${_c()}${formatNumber(u.cost)}`;
    if (u.chain) {
      const prev = (UPGRADES || []).find(up => up.id === u.chain);
      if (prev) tip += `<br><small style="color:rgba(255,255,255,.4)">Requires: ${prev.name}</small>`;
    }
    return tip;
  }

  function artifactTip(art) {
    const active   = !!STATE.artifacts[art.id];
    const bp       = (BLUEPRINTS || []).find(b => b.artifactId === art.id);
    const bpUnlocked = !bp || !!STATE.blueprints[bp.id];
    let tip = `<b>${art.emoji} ${art.name}</b><br><span style="color:rgba(255,255,255,.65)">${art.desc}</span>`;
    if (!bpUnlocked) tip += `<br><span style="color:rgba(255,200,80,.7)">🔒 Blueprint required</span>`;
    tip += `<br>Status: ${active ? '<span style="color:#c8a820">Active ✅</span>' : 'Craft to activate'}`;
    return tip;
  }

  function perkTip(perk) {
    const pr     = STATE.prestige || {};
    const stacks = (pr.perks && pr.perks[perk.id]) || 0;
    const v      = stacks * perk.valuePerStack;
    const points = pr.points || 0;
    let effectTxt = 'None yet';
    if (stacks > 0) {
      switch (perk.type) {
        case 'growSpeed':       effectTxt = `+${Math.round(v * 100)}% grow speed`; break;
        case 'sellValue':       effectTxt = `+${Math.round(v * 100)}% sell value`; break;
        case 'sellInterval':    effectTxt = `-${Math.round(v * 100)}% sell interval`; break;
        case 'startGold':       effectTxt = `+${formatNumber(stacks * perk.valuePerStack)} starting coins`; break;
        case 'eventResistance': effectTxt = `-${Math.round(v * 100)}% event chance`; break;
        case 'plotCount':       effectTxt = `${stacks} extra plot${stacks !== 1 ? 's' : ''}`; break;
      }
    }
    return `<b>${perk.name}</b><br><span style="color:rgba(255,255,255,.65)">${perk.desc}</span><br>Stacks: ${stacks}/${perk.maxStack}<br>Effect: ${effectTxt}<br>Cost: ✨${perk.cost} pt${perk.cost !== 1 ? 's' : ''}`;
  }

  function sellboxTip() {
    const queue    = (state.sellQueue || []).length;
    const cap      = STATE.modifiers.sellBoxCapacity || 1;
    const ms       = STATE.modifiers.sellInterval || 10000;
    const crank    = STATE.session.crankMultiplier || 1;
    const interval = (ms / crank / 1000).toFixed(2);
    return `<b>Sell Box</b><br>Queue: ${queue} item${queue !== 1 ? 's' : ''}<br>Sells: ${cap} per interval<br>Interval: ${interval}s<br>Crank: ${crank.toFixed(2)}x`;
  }

  return { init, seedShopTip, bagTip, invSeedTip, invCraftedTip, tileTip, upgradeTip, artifactTip, perkTip, sellboxTip };
})();
