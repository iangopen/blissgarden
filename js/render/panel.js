window.RenderPanel = (() => {
  // ── ACHIEVEMENTS ──────────────────────────────────────────────────────────
  let _achEl = null, _achSummaryEl = null;
  const _achTierSections = new Map();
  const _achCards        = new Map();

  function buildAchievements() {
    _achEl = document.getElementById('achievements-list');
    if (!_achEl) return;
    const achs = window.ACHIEVEMENTS || [];
    _achSummaryEl = mk('div', 'ach-summary');
    _achEl.appendChild(_achSummaryEl);
    const byStars = {};
    achs.forEach(a => { (byStars[a.stars] = byStars[a.stars] || []).push(a); });
    [1, 2, 3, 4, 5].forEach(stars => {
      const group = byStars[stars];
      if (!group || !group.length) return;
      const section = mk('div', 'ach-tier-section');
      const header  = mk('div', 'ach-tier-header');
      const countSpan = mk('span', 'ach-tier-count');
      header.appendChild(document.createTextNode('⭐'.repeat(stars) + ' '));
      header.appendChild(countSpan);
      const body = mk('div', 'ach-tier-body');
      header.addEventListener('click', () => {
        body.classList.toggle('ach-tier-collapsed');
        header.classList.toggle('ach-tier-header-collapsed');
      });
      [...group].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
        .forEach(ach => {
          const card   = mk('div', 'ach-card ach-locked');
          const starsEl = mk('div', 'ach-stars'); starsEl.textContent = '⭐'.repeat(ach.stars);
          const nameEl  = mk('div', 'ach-name');  nameEl.textContent  = ach.name;
          const descEl  = mk('div', 'ach-desc');  descEl.textContent  = ach.desc;
          const dateEl  = mk('div', 'ach-date');
          card.appendChild(starsEl); card.appendChild(nameEl);
          card.appendChild(descEl);  card.appendChild(dateEl);
          body.appendChild(card);
          _achCards.set(ach.id, { card, dateEl });
        });
      section.appendChild(header); section.appendChild(body);
      _achEl.appendChild(section);
      _achTierSections.set(stars, { header, body, countSpan, total: group.length });
    });
  }

  function renderAchievements() {
    if (!_achEl) buildAchievements();
    const achs = window.ACHIEVEMENTS || [], unlocked = state.achievements || {};
    let totalUnlocked = 0;
    _achTierSections.forEach(({ countSpan, total }, stars) => {
      const n = achs.filter(a => a.stars === stars && unlocked[a.id]).length;
      countSpan.textContent = `(${n}/${total} unlocked)`;
    });
    _achCards.forEach(({ card, dateEl }, id) => {
      const ok = !!unlocked[id];
      card.classList.toggle('ach-locked', !ok); card.classList.toggle('ach-unlocked', ok);
      if (ok) {
        totalUnlocked++;
        dateEl.textContent = unlocked[id].unlockedAt ? new Date(unlocked[id].unlockedAt).toLocaleDateString() : '';
      } else { dateEl.textContent = ''; }
    });
    if (_achSummaryEl) _achSummaryEl.textContent = `${totalUnlocked} / ${achs.length} achievements unlocked`;
  }

  // ── PRESTIGE ──────────────────────────────────────────────────────────────
  let _prestigeEl = null, _prestigeConfirming = false;
  let _pCountEl = null, _pPointsEl = null, _pBtn = null, _pBtnWrap = null, _pConfirmWrap = null, _pBreakdownEl = null;
  const _perkCards = new Map();

  function buildPrestige() {
    _prestigeEl = document.getElementById('prestige-section');
    if (!_prestigeEl) return;
    const statusRow = mk('div', '');
    statusRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 12px 4px;';
    _pCountEl  = mk('span', ''); _pCountEl.style.cssText  = 'font-size:12px;font-weight:700;color:rgba(255,255,255,.85)';
    _pPointsEl = mk('span', ''); _pPointsEl.style.cssText = 'font-size:11px;color:#f0d080;font-weight:700';
    statusRow.appendChild(_pCountEl); statusRow.appendChild(_pPointsEl);
    _prestigeEl.appendChild(statusRow);
    _pBreakdownEl = mk('div', '');
    _pBreakdownEl.style.cssText = 'padding:6px 12px 8px;font-size:11px;color:rgba(255,255,255,.7);line-height:1.65;border-bottom:1px solid rgba(255,255,255,.1)';
    _prestigeEl.appendChild(_pBreakdownEl);
    _pBtnWrap = mk('div', ''); _pBtnWrap.style.cssText = 'padding:2px 10px 6px;';
    _pBtn = mk('button', 'ug-btn'); _pBtn.style.cssText = 'width:100%;padding:7px 0;font-size:12px;';
    _pBtn.addEventListener('click', e => { e.stopPropagation(); if (!canPrestige().can) return; _prestigeConfirming = true; renderPrestige(); });
    _pBtnWrap.appendChild(_pBtn); _prestigeEl.appendChild(_pBtnWrap);
    _pConfirmWrap = mk('div', ''); _pConfirmWrap.style.cssText = 'padding:2px 10px 8px;display:none;align-items:center;gap:8px;';
    const lbl = mk('span', ''); lbl.style.cssText = 'font-size:11px;color:rgba(255,255,255,.7);flex:1'; lbl.textContent = 'Confirm reset?';
    const yesBtn = mk('button', 'ug-btn'); yesBtn.textContent = 'Yes'; yesBtn.style.background = '#b03020';
    yesBtn.addEventListener('click', e => { e.stopPropagation(); _prestigeConfirming = false; prestige(); });
    const noBtn  = mk('button', 'ug-btn'); noBtn.textContent  = 'No';
    noBtn.addEventListener('click',  e => { e.stopPropagation(); _prestigeConfirming = false; renderPrestige(); });
    _pConfirmWrap.appendChild(lbl); _pConfirmWrap.appendChild(yesBtn); _pConfirmWrap.appendChild(noBtn);
    _prestigeEl.appendChild(_pConfirmWrap);
    (window.PRESTIGE_PERKS || []).forEach(perk => {
      const card = mk('div', 'upgrade-card');
      const nameDiv = mk('div', 'ug-name'); nameDiv.textContent = perk.name;
      const descDiv = mk('div', 'ug-desc'); descDiv.textContent = perk.desc;
      const effectEl = mk('div', ''); effectEl.style.cssText = 'font-size:10px;color:#8de88d;margin:1px 0 5px;display:none';
      const botDiv = mk('div', 'ug-bottom');
      const stackEl = mk('span', 'ug-cost'); const btn = mk('button', 'ug-btn');
      btn.addEventListener('click', e => { e.stopPropagation(); buyPerk(perk.id); });
      botDiv.appendChild(stackEl); botDiv.appendChild(btn);
      card.appendChild(nameDiv); card.appendChild(descDiv); card.appendChild(effectEl); card.appendChild(botDiv);
      _prestigeEl.appendChild(card);
      _perkCards.set(perk.id, { stackEl, btn, effectEl, card });
    });
  }

  function renderPrestige() {
    if (!_prestigeEl) buildPrestige();
    if (!_prestigeEl) return;
    const pr = STATE.prestige || {}, points = pr.points || 0, count = pr.count || 0;
    const check = canPrestige(), earned = getPrestigePointsEarned();
    _pCountEl.textContent  = count > 0 ? `Prestige ${count}` : 'Not yet prestiged';
    _pPointsEl.textContent = `✨ ${points} pt${points !== 1 ? 's' : ''}`;
    if (_pBreakdownEl) {
      const coinPoints  = Math.floor(Math.log10(Math.max(state.coins, 10))) - 3;
      const upgCnt      = Object.keys(state.upgrades).filter(k => state.upgrades[k]).length;
      const upgScore    = Math.floor(upgCnt / 5);
      const total       = Math.max(1, coinPoints + upgScore);
      _pBreakdownEl.innerHTML =
        `<div>Coins: <span style="color:#f0d080">+${coinPoints}</span> pts</div>` +
        `<div>Upgrades: <span style="color:#f0d080">+${upgScore}</span> pts (${upgCnt} purchased)</div>` +
        `<div style="font-weight:700;color:#8de88d">Total: ${total} prestige pt${total !== 1 ? 's' : ''}</div>` +
        `<div style="color:rgba(255,255,255,.4);font-size:10px;margin-top:3px">Requires Stage 3 + 1M coins in hand</div>`;
    }
    if (_prestigeConfirming) {
      _pBtnWrap.style.display = 'none'; _pConfirmWrap.style.display = 'flex';
    } else {
      _pBtnWrap.style.display = ''; _pConfirmWrap.style.display = 'none';
      _pBtn.disabled = !check.can; _pBtn.style.background = check.can ? '#5A8A3C' : '';
      _pBtn.textContent = check.can ? `✨ Prestige (+${earned} pt${earned !== 1 ? 's' : ''})` : check.reason;
    }
    _perkCards.forEach(({ stackEl, btn, effectEl, card }, perkId) => {
      const perk = (window.PRESTIGE_PERKS || []).find(p => p.id === perkId); if (!perk) return;
      if (card && typeof Tooltip !== 'undefined') card.dataset.tooltip = Tooltip.perkTip(perk);
      const stacks = (pr.perks && pr.perks[perkId]) || 0, maxed = stacks >= perk.maxStack;
      stackEl.innerHTML = `<span style="color:#f0d080">✨${perk.cost}</span> · ${stacks}/${perk.maxStack}`;
      btn.disabled = maxed || points < perk.cost; btn.textContent = maxed ? 'Max' : 'Buy';
      if (stacks > 0) {
        const v = stacks * perk.valuePerStack; let txt = '';
        switch (perk.type) {
          case 'growSpeed':       txt = `+${Math.round(v*100)}% grow speed`; break;
          case 'sellValue':       txt = `+${Math.round(v*100)}% sell value`; break;
          case 'sellInterval':    txt = `-${Math.round(v*100)}% sell interval`; break;
          case 'startGold':       txt = `+${formatNumber(stacks*perk.valuePerStack)} starting coins`; break;
          case 'eventResistance': txt = `-${Math.round(v*100)}% event chance`; break;
          case 'plotCount':       txt = `${stacks} extra plot${stacks !== 1 ? 's' : ''} unlocked`; break;
        }
        effectEl.textContent = `Current: ${txt}`; effectEl.style.display = '';
      } else { effectEl.style.display = 'none'; }
    });
  }

  // ── ASCENSION ─────────────────────────────────────────────────────────────
  let _ascEl = null;
  const _ascCards = new Map();

  function buildAscension() {
    _ascEl = document.getElementById('ascension-section'); if (!_ascEl) return;
    Object.entries(SEEDS).filter(([, s]) => s.ascension).forEach(([key, seed]) => {
      const card = mk('div', 'upgrade-card');
      const nameDiv = mk('div', 'ug-name'); nameDiv.textContent = `${seed.icon} ${seed.name}`;
      const descDiv = mk('div', 'ug-desc'); descDiv.textContent = `Grows in ${fmt(seed.grow)} · Sells for 🪙${formatNumber(seed.sell)}`;
      const botDiv  = mk('div', 'ug-bottom');
      const costSpan = mk('span', 'ug-cost'); costSpan.style.color = '#f0d080'; costSpan.textContent = `✨${seed.ppCost}pp`;
      const btn = mk('button', 'ug-btn');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (buyAscensionSeed(key)) { RenderInventory.renderInventory(); renderAscension(); }
      });
      botDiv.appendChild(costSpan); botDiv.appendChild(btn);
      card.appendChild(nameDiv); card.appendChild(descDiv); card.appendChild(botDiv);
      _ascEl.appendChild(card); _ascCards.set(key, { card, btn, costSpan });
    });
  }

  function renderAscension() {
    const ascSection = document.getElementById('ascension-section');
    const ascLabel   = document.getElementById('ascension-label');
    const stage = getCurrentStage().stage;
    if (ascSection) ascSection.style.display = stage >= 5 ? '' : 'none';
    if (ascLabel)   ascLabel.style.display   = stage >= 5 ? '' : 'none';
    if (stage < 5) return;
    if (!_ascEl) buildAscension();
    const pts = (STATE.prestige || {}).points || 0;
    _ascCards.forEach(({ btn }, key) => {
      const seed = SEEDS[key];
      btn.disabled   = pts < seed.ppCost;
      btn.textContent = pts >= seed.ppCost ? 'Buy' : `Need ✨${seed.ppCost}`;
    });
  }

  // ── BACKWARD-COMPAT SHIM + ORCHESTRATOR ───────────────────────────────────
  return {
    renderSeeds:        () => RenderSeeds.renderBasicSeeds(),
    renderBags:         () => RenderSeeds.renderSeedBags(),
    renderItems:        () => RenderItems.renderItems(),
    renderUpgrades:     () => RenderUpgrades.renderUpgrades(),
    renderInventory:    () => RenderInventory.renderInventory(),
    renderAchievements,
    renderPrestige,
    renderAscension,
  };
})();
