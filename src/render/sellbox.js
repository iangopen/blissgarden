import { RECIPES } from '../data.js';
import { STATE, makeSpriteDiv, mk, state } from '../state.js';

let crankAngle = 0;   // crank handle rotation (visual only)
import { save } from '../save.js';
import { moveGhost, startDrag } from '../drag.js';
import { Tooltip } from '../tooltip.js';

export const RenderSellbox = (() => {
  function updateBoxStyle() {
    const sb = document.getElementById('sell-box');
    if (!sb) return;
    sb.classList.remove('iron','steel','titanium','diamond');
    if (state.upgrades.diamondSellBox)       sb.classList.add('diamond');
    else if (state.upgrades.titaniumSellBox) sb.classList.add('titanium');
    else if (state.upgrades.steelSellBox)    sb.classList.add('steel');
    else if (state.upgrades.ironSellBox)     sb.classList.add('iron');
  }

  function renderQueue() {
    const qRow = document.getElementById('sell-queue-row');
    if (!qRow) return;
    qRow.innerHTML = '';
    state.sellQueue.forEach((item, idx) => {
      const s = mk('span','sq-icon');
      if (item.crafted) {
        const recipe = RECIPES && RECIPES.find(r => r.id === item.seed);
        const span = document.createElement('span');
        span.style.cssText = 'font-size:16px;line-height:1;pointer-events:none';
        span.textContent = recipe ? recipe.emoji : '?';
        s.appendChild(span);
      } else {
        s.appendChild(makeSpriteDiv(item.seed, 'grown', 24));
        s.addEventListener('mousedown', e => {
          if (STATE.session.dragItem) return;
          e.stopPropagation();
          state.sellQueue.splice(idx, 1);
          if (idx === 0 && state.sellQueue.length > 0) STATE.session.sellElapsed = 0;
          renderQueue(); save();
          startDrag(item.seed, 'sell-queue', item.bonus || 1.0, item.drowned || false);
          moveGhost(e.clientX, e.clientY);
        });
      }
      qRow.appendChild(s);
    });
    updateSellTimer();
    updateBoxStyle();
    const sb = document.getElementById('sell-box');
    if (sb && typeof Tooltip !== 'undefined') sb.dataset.tooltip = Tooltip.sellboxTip();
  }

  function updateSellTimer() {
    const cd = document.getElementById('sell-cd');
    if (!cd) return;
    if (!state.sellQueue || !state.sellQueue.length) {
      cd.textContent = '—';
      return;
    }
    const effectiveInterval = STATE.modifiers.sellInterval / STATE.session.crankMultiplier;
    const remaining = Math.max(0, effectiveInterval - (STATE.session.sellElapsed || 0));
    cd.textContent = (remaining / 1000).toFixed(2) + 's';
  }

  function positionCrank() {
    const box = document.getElementById('crank-box');
    const sb  = document.getElementById('sell-box');
    if (!box || !sb) return;
    const r = sb.getBoundingClientRect();
    box.style.left = (r.right + 10) + 'px';
  }

  function renderCrank() {
    const box = document.getElementById('crank-box');
    if (!box) return;
    if (!state.upgrades.windUpCrank) { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    document.getElementById('crank-label').textContent = '⚙️ ' + STATE.session.crankMultiplier.toFixed(2) + 'x';
    box.classList.remove('iron','steel','titanium','diamond');
    if (state.upgrades.diamondCrank)       box.classList.add('diamond');
    else if (state.upgrades.titaniumCrank) box.classList.add('titanium');
    else if (state.upgrades.steelCrank)    box.classList.add('steel');
    else if (state.upgrades.ironCrank)     box.classList.add('iron');
    positionCrank();
  }

  function updateCrankLabel() {
    if (!state.upgrades.windUpCrank) return;
    const lbl = document.getElementById('crank-label');
    if (lbl) lbl.textContent = '⚙️ ' + STATE.session.crankMultiplier.toFixed(2) + 'x';
  }

  function setupUI() {
    document.getElementById('crank-svg').addEventListener('click', () => {
      if (!state.upgrades.windUpCrank) return;
      STATE.session.crankMultiplier = STATE.session.crankMultiplier * STATE.modifiers.crankClickMultiplier;
      crankAngle = (crankAngle + 30) % 3600;
      document.getElementById('crank-svg').style.transform = `rotate(${crankAngle}deg)`;
      RenderSellbox.updateCrankLabel();
    });
  }

  return { renderQueue, renderCrank, updateBoxStyle, positionCrank, updateSellTimer, updateCrankLabel, setupUI };
})();

export function showPop(text, x, y) {
  const el = mk('div','fpop'); el.innerHTML = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 1250);
}
