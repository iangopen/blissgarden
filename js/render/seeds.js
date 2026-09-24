window.RenderSeeds = (() => {
  // ── BASIC SEEDS ───────────────────────────────────────────────────────────
  const _seedRows = new Map(); // key → { btn, metaSpan }
  let _seedsEl = null;

  function buildSeeds() {
    _seedsEl = document.getElementById('seeds-list');
    if (!_seedsEl) return;
    BASIC_SEEDS.forEach(key => {
      const seed     = SEEDS[key];
      const row      = mk('div', 'seed-row');
      const iconSpan = mk('span', 'sr-icon');
      iconSpan.innerHTML = spriteHTML(key, 'seed', 48);
      const infoDiv  = mk('div', 'sr-info');
      const nameSpan = mk('span', 'sr-name'); nameSpan.textContent = seed.name;
      const metaSpan = mk('span', 'sr-meta');
      infoDiv.appendChild(nameSpan); infoDiv.appendChild(metaSpan);
      const btn = mk('button', 'seed-buy-btn');
      btn.textContent = 'Buy';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (state.coins < seed.cost) return;
        state.coins -= seed.cost;
        if (!state.seedInventory) state.seedInventory = {};
        state.seedInventory[key] = (state.seedInventory[key] || 0) + 1;
        EventBus.emit('seed:purchased', { seed: key });
        updateCoins(); RenderInventory.renderInventory(); save();
        log(`🌱 Bought ${seed.name} seed`, 'growth');
      });
      row.appendChild(iconSpan); row.appendChild(infoDiv); row.appendChild(btn);
      _seedsEl.appendChild(row);
      _seedRows.set(key, { btn, metaSpan, row });
    });
  }

  function renderBasicSeeds() {
    if (!_seedsEl) buildSeeds();
    const mult = STATE.modifiers.growSpeed;
    _seedRows.forEach(({ btn, metaSpan, row }, key) => {
      const seed = SEEDS[key];
      btn.disabled = state.coins < seed.cost;
      metaSpan.innerHTML = `${coinHTML()}${formatNumber(seed.cost)} - ${fmt(seed.grow / mult)}`;
      if (row && typeof Tooltip !== 'undefined') row.dataset.tooltip = Tooltip.seedShopTip(key);
    });
  }

  // ── SEED BAGS ─────────────────────────────────────────────────────────────
  const _bagRows = new Map(); // bag.id → { btn, bag }
  let _bagsEl = null;

  function buildBags() {
    _bagsEl = document.getElementById('bags-list');
    if (!_bagsEl) return;
    SEED_BAGS.forEach(bag => {
      const card = mk('div', 'upgrade-card');
      const desc = bag.seeds.map((s, i) =>
        `${spriteHTML(s, 'seed', 20)} ${SEEDS[s].name} ${Math.round(bag.odds[i] * 100)}%`).join(' · ');
      card.innerHTML = `<div class="ug-name">${bag.icon} ${bag.name}</div><div class="ug-desc">Opens for 3 seeds: ${desc}</div><div class="ug-bottom"><span class="ug-cost">${coinHTML()}${formatNumber(bag.cost)}</span><button class="ug-btn">Buy</button></div>`;
      const btn = card.querySelector('.ug-btn');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (state.coins < bag.cost) return;
        state.coins -= bag.cost;
        if (!state.bagInventory) state.bagInventory = {};
        state.bagInventory[bag.id] = (state.bagInventory[bag.id] || 0) + 1;
        state.stats.bagsBought = (state.stats.bagsBought || 0) + 1;
        if (typeof checkAchievements === 'function') checkAchievements();
        EventBus.emit('bag:purchased', { bag: bag.id });
        updateCoins(); RenderInventory.renderInventory(); save();
        log(`🎒 Bought ${bag.name}`, 'growth');
      });
      if (typeof Tooltip !== 'undefined') card.dataset.tooltip = Tooltip.bagTip(bag);
      _bagsEl.appendChild(card);
      _bagRows.set(bag.id, { btn, bag, card });
    });
  }

  function renderSeedBags() {
    if (!_bagsEl) buildBags();
    _bagRows.forEach(({ btn, bag }) => { btn.disabled = state.coins < bag.cost; });
  }

  return { renderBasicSeeds, renderSeedBags };
})();
