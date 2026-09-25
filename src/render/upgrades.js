import { UPGRADES } from '../data.js';
import { coinHTML, formatNumber, mk, state } from '../state.js';
import { EXPANSION_FLAGS, applyUpgrade } from '../upgrades.js';
import { showBanner } from './log.js';
import { getCurrentStage, updateCoins } from '../events/index.js';
import { RenderFarm } from './farm.js';
import { RenderSellbox } from './sellbox.js';
import { Tooltip } from '../tooltip.js';
import { applyFarmScale } from './hud.js';

export const RenderUpgrades = (() => {
  const _upgradeCards = new Map(); // id → { card, btn, u }
  let _upgradesEl = null;

  function buildUpgrades() {
    _upgradesEl = document.getElementById('upgrades-list');
    if (!_upgradesEl) return;
    const sorted = [...UPGRADES].sort((a, b) => a.cost - b.cost);
    sorted.forEach(u => {
      const card = mk('div', 'upgrade-card');
      card.innerHTML = `<div class="ug-name">${u.name}</div><div class="ug-desc">${u.desc}</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(u.cost)}</span><button class="ug-btn">Buy</button></div>`;
      const btn = card.querySelector('.ug-btn');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!applyUpgrade(u.id)) return;
        if (EXPANSION_FLAGS[u.type]) { RenderFarm.buildGrid(); RenderFarm.renderGrid(); showBanner('🌱 The farm has expanded.'); if (typeof applyFarmScale === 'function') applyFarmScale(); }
        if (u.type === 'ironSellBox' || u.type === 'steelSellBox' || u.type === 'titaniumSellBox' || u.type === 'diamondSellBox') {
          RenderSellbox.updateBoxStyle(); showBanner(`⚙️ ${u.name} activated.`);
        }
        if (u.type === 'crank' || u.type === 'crankUp') RenderSellbox.renderCrank();
        updateCoins(); RenderFarm.renderGrid();
      });
      if (typeof Tooltip !== 'undefined') card.dataset.tooltip = Tooltip.upgradeTip(u);
      _upgradesEl.appendChild(card);
      _upgradeCards.set(u.id, { card, btn, u });
    });
  }

  function renderUpgrades() {
    if (!_upgradesEl) buildUpgrades();
    const currentStage = getCurrentStage().stage;
    _upgradeCards.forEach(({ card, btn, u }) => {
      const bought = !!state.upgrades[u.id];
      const visible =
        (!u.stage2 || currentStage >= 2) &&
        (!u.stage3 || currentStage >= 3) &&
        (!u.stage4 || currentStage >= 4) &&
        (!u.stage5 || currentStage >= 5) &&
        (u.chain === null || u.chain === undefined || !!state.upgrades[u.chain]) &&
        !(bought && state.hideBoughtUpgrades);
      card.style.display = visible ? '' : 'none';
      if (!visible) return;
      card.classList.toggle('bought', bought);
      btn.disabled = bought || state.coins < u.cost;
      btn.textContent = bought ? 'Owned' : 'Buy';
    });
  }

  return { renderUpgrades };
})();
