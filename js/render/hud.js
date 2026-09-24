function applyPanelState() {
  const panelEl = document.getElementById('panel');
  if (!panelEl) return;
  panelEl.style.width = panelWidth + 'px';
  const gameArea = document.getElementById('game-area');
  if (gameArea) gameArea.style.right = panelWidth + 'px';
  const topbarRight = document.getElementById('topbar-right');
  if (topbarRight) topbarRight.style.right = (panelWidth + 8) + 'px';
  if (state.upgrades.windUpCrank) RenderSellbox.positionCrank();
}

window.RenderHUD = (() => {
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
