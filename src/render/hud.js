import { STATE, formatNumber, getGridDims, state, ui } from '../state.js';
import { getCurrentStage } from '../events/index.js';
import { RenderSellbox } from './sellbox.js';

// ── Mobile farm scaling ────────────────────────────────────────────────────
export function applyFarmScale() {
  const grass = document.getElementById('grass');
  if (!grass) return;
  if (window.innerWidth > 768) { grass.style.transform = ''; return; }
  const { cols } = getGridDims();
  const farmPx = cols * 100 + (cols - 1) * 3 + 44; // tiles + gaps + grass padding
  const available = window.innerWidth * 0.9;
  const scale = Math.min(1, available / farmPx);
  grass.style.transformOrigin = 'center center';
  grass.style.transform = scale < 1 ? `scale(${scale})` : '';
}

export function applyPanelState() {
  const panelEl = document.getElementById('panel');
  if (!panelEl) return;
  panelEl.style.width = ui.panelWidth + 'px';
  const gameArea = document.getElementById('game-area');
  if (gameArea) gameArea.style.right = ui.panelWidth + 'px';
  const topbarRight = document.getElementById('topbar-right');
  if (topbarRight) topbarRight.style.right = (ui.panelWidth + 8) + 'px';
  if (state.upgrades.windUpCrank) RenderSellbox.positionCrank();
}

export const RenderHUD = (() => {
  function renderCoin() {
    const el = document.getElementById('coin-count');
    if (el) el.textContent = formatNumber(state.coins);
  }

  function renderStage() {
    const s    = getCurrentStage();
    const name = STATE.meta.farmName || 'Bliss Farm';
    const el   = document.getElementById('stage-display');
    el.innerHTML =
      `<span style="font-size:10px;font-weight:700;opacity:.65;letter-spacing:.5px">${name}</span>` +
      `<span style="font-size:12px;font-weight:600;letter-spacing:.3px">Stage ${s.stage}: ${s.name}</span>`;
  }

  function renderReputation() {
    const el = document.getElementById('rep-display');
    if (!el) return;
    const stage = getCurrentStage().stage;
    el.style.display = stage >= 4 ? '' : 'none';
    el.textContent = `⭐ ${STATE.meta.reputation || 0}`;
  }

  return { renderCoin, renderStage, renderReputation };
})();
