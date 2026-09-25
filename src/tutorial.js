import { STATE, state } from './state.js';
import { save } from './save.js';
import { isReady } from './upgrades.js';
import { RenderFarm } from './render/farm.js';

// ══════════════════════════════
// TUTORIAL SYSTEM
// ══════════════════════════════
export const Tutorial = (() => {
  let _step      = 0;
  let _active    = false;
  let _pollTimer = null;
  let _spotlight = null;
  let _tooltip   = null;

  const STEPS = [
    {
      target:  () => document.getElementById('coins'),
      text:    'Welcome to Bliss Farm! 🌾 These are your coins. You start with 10. Spend them wisely.',
      side:    'below',
    },
    {
      target:  () => document.getElementById('seeds-list'),
      text:    'This is the seed shop. Click a seed to see what it costs and how long it takes to grow. Drag a seed onto a farm tile to plant it.',
      side:    'left',
    },
    {
      target:  () => document.getElementById('farm-grid'),
      text:    'These are your farm plots. Drag a seed from the shop onto any brown tile to plant your first crop!',
      side:    'above',
      wait:    'planted',
    },
    {
      target() {
        const idx = state.tiles.findIndex(t => t !== null);
        return idx !== -1 ? RenderFarm.tileNodes[idx] : null;
      },
      text:    "Your crop is growing! Watch the timer count down. When it's ready the tile glows green.",
      side:    'below',
      wait:    'ready',
    },
    {
      target:  () => document.getElementById('sell-box'),
      text:    "Harvest ready crops by clicking them — they'll attach to your mouse. Drag them to the SELL box to earn coins!",
      side:    'above',
      wait:    'sold',
    },
    {
      target:  () => document.getElementById('upgrades-list'),
      text:    "You're farming! Use your coins to buy upgrades, explore seed bags for rarer crops, and expand your farm. Good luck! 🌱",
      side:    'left',
      lastBtn: 'Start Farming!',
    },
  ];

  // ── Spotlight (fixed div whose box-shadow dims everything outside it) ──────

  function _buildSpotlight() {
    const d = document.createElement('div');
    d.style.cssText = [
      'position:fixed',
      'z-index:10000',
      'pointer-events:none',
      'border-radius:6px',
      'box-shadow:0 0 0 9999px rgba(0,0,0,0.72)',
      'outline:2px solid rgba(255,215,80,0.7)',
      'transition:left .18s,top .18s,width .18s,height .18s',
    ].join(';');
    document.body.appendChild(d);
    return d;
  }

  function _placeSpotlight(el) {
    const r = el.getBoundingClientRect();
    const p = 8;
    _spotlight.style.left   = (r.left   - p) + 'px';
    _spotlight.style.top    = (r.top    - p) + 'px';
    _spotlight.style.width  = (r.width  + p * 2) + 'px';
    _spotlight.style.height = (r.height + p * 2) + 'px';
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────

  function _arrowStyle(side) {
    const s = 9;
    const b = 'position:absolute;width:0;height:0;';
    if (side === 'below')
      return b + `border-left:${s}px solid transparent;border-right:${s}px solid transparent;border-bottom:${s}px solid #6b4a2a;top:${-s}px;left:50%;transform:translateX(-50%)`;
    if (side === 'above')
      return b + `border-left:${s}px solid transparent;border-right:${s}px solid transparent;border-top:${s}px solid #6b4a2a;bottom:${-s}px;left:50%;transform:translateX(-50%)`;
    if (side === 'left')
      return b + `border-top:${s}px solid transparent;border-bottom:${s}px solid transparent;border-left:${s}px solid #6b4a2a;right:${-s}px;top:50%;transform:translateY(-50%)`;
    return   b + `border-top:${s}px solid transparent;border-bottom:${s}px solid transparent;border-right:${s}px solid #6b4a2a;left:${-s}px;top:50%;transform:translateY(-50%)`;
  }

  function _nextCSS(active) {
    return [
      'padding:5px 16px',
      `background:${active ? '#5a8a3c' : 'rgba(255,255,255,.1)'}`,
      'border:none',
      'border-radius:4px',
      `color:${active ? '#fff' : 'rgba(255,255,255,.35)'}`,
      'font-size:12px',
      'font-weight:600',
      `cursor:${active ? 'pointer' : 'default'}`,
      'font-family:inherit',
    ].join(';');
  }

  function _buildTooltip(def) {
    if (_tooltip) { _tooltip.remove(); _tooltip = null; }

    const box = document.createElement('div');
    box.style.cssText = [
      'position:fixed',
      'background:#6b4a2a',
      'border:2px solid #a07040',
      'border-radius:8px',
      'padding:14px 16px 12px',
      'max-width:280px',
      'min-width:210px',
      'color:#fff',
      'font-size:13px',
      'line-height:1.5',
      'box-shadow:0 4px 20px rgba(0,0,0,.55)',
      'z-index:10001',
      'font-family:inherit',
    ].join(';');

    const arrow = document.createElement('div');
    arrow.style.cssText = _arrowStyle(def.side);
    box.appendChild(arrow);

    const txt = document.createElement('div');
    txt.style.marginBottom = '12px';
    txt.textContent = def.text;
    box.appendChild(txt);

    const stepLabel = document.createElement('div');
    stepLabel.style.cssText = 'font-size:10px;color:rgba(255,255,255,.38);margin-bottom:8px';
    stepLabel.textContent = `Step ${_step + 1} of ${STEPS.length}`;
    box.appendChild(stepLabel);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center';

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = 'padding:5px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.18);border-radius:4px;color:rgba(255,255,255,.6);font-size:11px;cursor:pointer;font-family:inherit';
    skipBtn.addEventListener('click', skip);

    const waiting = !def.lastBtn && !!def.wait;
    const nextBtn = document.createElement('button');
    nextBtn.textContent = def.lastBtn || (waiting ? 'Waiting…' : 'Next');
    nextBtn.disabled    = waiting;
    nextBtn.style.cssText = _nextCSS(!waiting);
    if (!waiting) nextBtn.addEventListener('click', next);

    row.appendChild(skipBtn);
    row.appendChild(nextBtn);
    box.appendChild(row);
    document.body.appendChild(box);
    _tooltip = box;
    return nextBtn;
  }

  function _placeTooltip(targetEl, side) {
    const r   = targetEl.getBoundingClientRect();
    const ttW = _tooltip.offsetWidth  || 250;
    const ttH = _tooltip.offsetHeight || 140;
    const gap = 16;
    let left, top;

    if (side === 'below') {
      left = r.left + r.width  / 2 - ttW / 2;
      top  = r.bottom + gap;
    } else if (side === 'above') {
      left = r.left + r.width  / 2 - ttW / 2;
      top  = r.top  - ttH - gap;
    } else if (side === 'left') {
      left = r.left - ttW - gap;
      top  = r.top  + r.height / 2 - ttH / 2;
    } else {
      left = r.right + gap;
      top  = r.top   + r.height / 2 - ttH / 2;
    }

    const vw = window.innerWidth, vh = window.innerHeight;
    left = Math.max(8, Math.min(left, vw - ttW - 8));
    top  = Math.max(8, Math.min(top,  vh - ttH - 8));

    _tooltip.style.left = left + 'px';
    _tooltip.style.top  = top  + 'px';
  }

  // ── Step runner ──────────────────────────────────────────────────────────

  function _showStep() {
    if (!_active) return;
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }

    const def = STEPS[_step];
    const el  = def.target();

    if (!el) {
      setTimeout(_showStep, 150);
      return;
    }

    if (!_spotlight) _spotlight = _buildSpotlight();
    _placeSpotlight(el);

    const nextBtn = _buildTooltip(def);

    requestAnimationFrame(() => {
      if (_tooltip && el) _placeTooltip(el, def.side);
    });

    if (def.wait === 'ready') {
      _pollTimer = setInterval(() => {
        const idx = state.tiles.findIndex(t => t !== null);
        if (idx !== -1 && isReady(state.tiles[idx], idx)) {
          clearInterval(_pollTimer);
          _pollTimer = null;
          _enableNext(nextBtn);
          const tileEl = RenderFarm.tileNodes[idx];
          if (tileEl && _spotlight) _placeSpotlight(tileEl);
        }
      }, 500);
    }
  }

  function _enableNext(nextBtn) {
    if (!nextBtn || !nextBtn.disabled) return;
    nextBtn.disabled    = false;
    nextBtn.textContent = 'Next';
    nextBtn.style.cssText = _nextCSS(true);
    nextBtn.addEventListener('click', next);
  }

  // ── Wait for farm-name overlay to close before starting ──────────────────

  function _waitForOverlay() {
    const nameOverlay = document.getElementById('name-overlay');
    if (nameOverlay && nameOverlay.style.display === 'flex') {
      setTimeout(_waitForOverlay, 300);
      return;
    }
    setTimeout(_showStep, 500);
  }

  // ── EventBus callbacks ───────────────────────────────────────────────────

  function onPlanted() {
    if (!_active || _step !== 2) return;
    const nextBtn = _tooltip && _tooltip.querySelector('button:last-child');
    _enableNext(nextBtn);
  }

  function onSold() {
    if (!_active || _step !== 4) return;
    const nextBtn = _tooltip && _tooltip.querySelector('button:last-child');
    _enableNext(nextBtn);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function init() {
    if (STATE.meta.tutorialDone) return;
    _active = true;
    _step   = 0;
    _waitForOverlay();
  }

  function next() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    _step++;
    if (_step >= STEPS.length) { skip(); return; }
    _showStep();
  }

  function skip() {
    if (!_active) return;
    _active = false;
    if (_pollTimer)   { clearInterval(_pollTimer); _pollTimer = null; }
    if (_tooltip)     { _tooltip.remove();   _tooltip   = null; }
    if (_spotlight)   { _spotlight.remove(); _spotlight = null; }
    STATE.meta.tutorialDone = true;
    if (typeof save === 'function') save();
  }

  return { init, next, skip, onPlanted, onSold };
})();
