// ── COINS & STAGES ──
function getCurrentStage() {
  const stage = STATE.meta.stage || 0;
  return STAGES.find(s => s.stage === stage) || STAGES[0];
}
function checkMilestones() {
  MILESTONE_VALS.forEach(m => {
    if (state.coinsEarned >= m && !state.milestones[m]) {
      state.milestones[m] = true;
      log(`⏱️ ${STATE.meta.farmName || 'Bliss Farm'} reached ${coinHTML()}${formatNumber(m)}!`, 'earnings');
    }
  });
}
// Stages trigger on coins currently held (design decision). Stage only ever advances.
function checkStages() {
  for (const s of STAGES) {
    if (s.stage === 0 || s.stage <= STATE.meta.stage) continue;
    if ((state.coins || 0) >= s.threshold) {
      state.stagesSeen[s.stage] = true;
      STATE.meta.stage = s.stage;
      if (s.log) log(s.log, 'prestige');
      EventBus.emit('stage:advanced', { stage: s.stage, name: s.name });
      save();
    }
  }
}
function checkMaturity() {
  if (!state.mature && STATE.meta.stage >= 1) {
    state.mature = true;
    log('🌿 The farm has matured. Nature has taken notice...', 'prestige');
    showBanner('🌿 The farm has matured. Nature is watching.');
  }
}
function addCoins(amount) {
  state.coins += amount;
  state.coinsEarned = (state.coinsEarned || 0) + amount;
  checkMilestones();
  checkStages();
  checkMaturity();
  updateCoins();
  if (typeof checkAchievements === 'function') checkAchievements();
}
function updateCoins() {
  RenderHUD.renderCoin();
  RenderPanel.renderUpgrades();
  RenderPanel.renderItems();
  RenderPanel.renderSeeds();
  RenderPanel.renderBags();
  if (typeof RenderHUD.renderReputation === 'function') RenderHUD.renderReputation();
}

// ══════════════════════════════
// TILE ACTIONS
// Canonical home of the player's tile interactions (one copy each).
// ══════════════════════════════

// ── WATER / DROWN ──
// Growth speed comes from state.tilesWatered via getEffectiveSpeedMult; no timing fields to rebase here.
function applyWater(idx) {
  const td = state.tiles[idx];
  if (!td || isReady(td, idx)) return;
  if (state.tilesWatered && state.tilesWatered[idx]) { drownTile(idx); return; }
  td.sellBonus = 1.25;
  if (!state.tilesWatered) state.tilesWatered = {};
  state.tilesWatered[idx] = true;
  RenderFarm.renderTile(idx); RenderPanel.renderInventory(); RenderPanel.renderItems();
  log(`💧 ${SEEDS[td.seed].name} watered (+25% value, +25% speed)`, 'growth');
  EventBus.emit('crop:watered');
  save();
}

function drownTile(idx) {
  const td = state.tiles[idx];
  if (!td) return;
  td.drowned = true; td.sellBonus = 0.25;
  delete state.tilesWatered[idx];
  RenderFarm.renderTile(idx); RenderPanel.renderInventory(); RenderPanel.renderItems();
  log(`💀 ${SEEDS[td.seed].name} was drowned! Value severely reduced.`, 'growth');
  save();
}

// ── INVENTORY ──
function addInventory(seed) { state.inventory[seed] = (state.inventory[seed] || 0) + 1; }

// ── BAG OPENING ──
function openBag(bag) {
  if (!state.bagInventory) state.bagInventory = {};
  if ((state.bagInventory[bag.id] || 0) < 1) return;
  state.bagInventory[bag.id]--;
  if (!state.seedInventory) state.seedInventory = {};
  const received = [];
  for (let i = 0; i < 3; i++) {
    const roll = Math.random();
    let cum = 0, chosen = bag.seeds[bag.seeds.length - 1];
    for (let j = 0; j < bag.seeds.length; j++) {
      cum += bag.odds[j];
      if (roll < cum) { chosen = bag.seeds[j]; break; }
    }
    state.seedInventory[chosen] = (state.seedInventory[chosen] || 0) + 1;
    received.push((SEEDS[chosen].seedIcon || SEEDS[chosen].icon || '🌱') + ' ' + SEEDS[chosen].name);
  }
  log(`🎒 ${bag.name} opened: ${received.join(', ')}`, 'growth');
  RenderPanel.renderInventory(); save();
}

// ── SELECTION & TILE MENUS ──
function deselect() {
  if (selectedTile !== null) { const p = selectedTile; selectedTile = null; RenderFarm.renderTile(p); }
}

function hideTileMenu() { document.getElementById('tile-menu').style.display = 'none'; }

function showTileMenu(idx, x, y) {
  const isCaged     = state.cages && state.cages.includes(idx);
  const isFert      = !!(state.fertilizedTiles && state.fertilizedTiles[idx]);
  const isHiredHand = !!(state.hiredHandAssignments && state.hiredHandAssignments[idx]);
  if (!isCaged && !isFert && !isHiredHand) return;
  const menu = document.getElementById('tile-menu');
  menu.innerHTML = '';
  if (isCaged) {
    const btn = mk('button'); btn.className = 'tmenu-btn'; btn.textContent = '🔓 Remove Cage';
    btn.addEventListener('mousedown', e => {
      e.stopPropagation();
      const ci = state.cages.indexOf(idx);
      if (ci !== -1) { state.cages.splice(ci, 1); state.cageCount = (state.cageCount||0) + 1; }
      RenderFarm.renderTile(idx); RenderPanel.renderItems(); log('🔒 Cage removed, returned to inventory', 'system'); save(); hideTileMenu();
    });
    menu.appendChild(btn);
  }
  if (isFert) {
    const btn = mk('button'); btn.className = 'tmenu-btn'; btn.textContent = '🌿 Remove Fertilizer';
    btn.addEventListener('mousedown', e => {
      e.stopPropagation();
      delete state.fertilizedTiles[idx];
      RenderFarm.renderTile(idx); save(); hideTileMenu();
    });
    menu.appendChild(btn);
  }
  if (isHiredHand) {
    const btn = mk('button'); btn.className = 'tmenu-btn'; btn.textContent = '👨‍🌾 Remove Hired Hand';
    btn.addEventListener('mousedown', e => {
      e.stopPropagation();
      delete state.hiredHandAssignments[idx];
      state.hiredHandCount = (state.hiredHandCount || 0) + 1;
      RenderFarm.renderTile(idx); RenderPanel.renderInventory(); save(); hideTileMenu();
    });
    menu.appendChild(btn);
  }
  menu.style.left = Math.min(x, window.innerWidth  - 170) + 'px';
  menu.style.top  = Math.min(y, window.innerHeight - 90)  + 'px';
  menu.style.display = 'block';
}

// ── TILE CLICK ──
function onTileDown(e) {
  const idx = parseInt(e.currentTarget.dataset.idx);

  if (state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].deadAt !== undefined) {
    e.stopPropagation(); return;
  }
  if (state.voidRifts && state.voidRifts[idx] !== undefined) {
    e.stopPropagation();
    state.voidRifts[idx].clicks++;
    if (state.voidRifts[idx].clicks >= VOID_RIFT_CLICKS) {
      delete state.voidRifts[idx];
      log('🌀 Void rift sealed!', 'event');
      RenderFarm.renderTile(idx);
    } else {
      e.currentTarget.classList.add('tile-rift-hit');
      setTimeout(() => RenderFarm.renderTile(idx), 80);
    }
    save(); return;
  }
  if (state.claimedTiles && state.claimedTiles[idx]) {
    e.stopPropagation();
    const cl = state.claimedTiles[idx];
    if (cl.releasesAt !== undefined) return;
    showReclaimMenu(idx, cl.reclaimCost, e.clientX + 4, e.clientY + 4);
    return;
  }
  if (state.mounds && state.mounds[idx] !== undefined) {
    e.stopPropagation();
    state.mounds[idx] = Math.min(state.mounds[idx], Date.now() + 5000);
    RenderFarm.renderTile(idx); save(); return;
  }
  if (state.thornedWeeds && state.thornedWeeds[idx] !== undefined) {
    e.stopPropagation();
    sfx.weedClick();
    state.thornedWeeds[idx].clicks++;
    if (state.thornedWeeds[idx].clicks >= THORNED_WEED_CLICKS) {
      delete state.thornedWeeds[idx];
      state.stats.weedsCleared = (state.stats.weedsCleared || 0) + 1;
      if (typeof checkAchievements === 'function') checkAchievements();
      log('✅ Thorned weed cleared!', 'event');
      EventBus.emit('weed:cleared');
      RenderFarm.renderTile(idx);
    } else {
      e.currentTarget.classList.add('tile-weed-hit');
      setTimeout(() => RenderFarm.renderTile(idx), 80);
    }
    save(); return;
  }
  if (state.weeds && state.weeds[idx] !== undefined) {
    e.stopPropagation();
    sfx.weedClick();
    state.weeds[idx].clicks++;
    if (state.weeds[idx].clicks >= WEED_CLICKS) {
      delete state.weeds[idx];
      state.stats.weedsCleared = (state.stats.weedsCleared || 0) + 1;
      if (typeof checkAchievements === 'function') checkAchievements();
      log('✅ Weed cleared!', 'event');
      EventBus.emit('weed:cleared');
      RenderFarm.renderTile(idx);
    } else {
      e.currentTarget.classList.add('tile-weed-hit');
      setTimeout(() => RenderFarm.renderTile(idx), 80);
    }
    save(); return;
  }

  const td = state.tiles[idx];
  const _isFungal = !!(state.fungalTiles && state.fungalTiles[idx] !== undefined);

  if (!td) {
    deselect();
    const _caged  = state.cages && state.cages.includes(idx);
    const _fert   = !!(state.fertilizedTiles && state.fertilizedTiles[idx]);
    const _hhand  = !!(state.hiredHandAssignments && state.hiredHandAssignments[idx]);
    if (_caged || _fert || _hhand) showTileMenu(idx, e.clientX + 4, e.clientY + 4);
    else if (_isFungal)  showFungalCureMenu(idx, 50, e.clientX + 4, e.clientY + 4);
    return;
  }

  if (isReady(td, idx)) {
    e.stopPropagation();
    const seed     = td.seed;
    const tileRect = e.currentTarget.getBoundingClientRect();
    sfx.harvest();
    Particles.leafBurst(tileRect.left + tileRect.width / 2, tileRect.top + tileRect.height / 2);
    spawnHarvestPop(tileRect.left + tileRect.width / 2, tileRect.top + tileRect.height / 2, seed);
    const rotInf  = !!(state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].infectedAt !== undefined && state.rotTiles[idx].deadAt === undefined);
    const bonus   = rotInf ? 0.5 : (td.sellBonus || 1.0);
    const drowned = rotInf || (td.drowned || false);
    if (state.rotTiles) delete state.rotTiles[idx];
    state.tiles[idx] = null;
    if (state.tilesWatered) delete state.tilesWatered[idx];
    state.stats.totalHarvested = (state.stats.totalHarvested || 0) + 1;
    if (!state.stats.seedTypesPlanted) state.stats.seedTypesPlanted = {};
    state.stats.seedTypesPlanted[seed] = true;
    RenderFarm.renderTile(idx); save();
    log(`${SEEDS[seed].icon} ${SEEDS[seed].name} harvested${_isFungal ? ' (fungal — 0 coins)' : ''}`, 'growth');
    if (rotInf) log('🍂 Infected — sells for 50% base value', 'event');
    EventBus.emit('crop:harvested', { seed, idx });
    if (typeof checkAchievements === 'function') checkAchievements();
    startDrag(seed, 'tile', bonus, drowned, _isFungal); moveGhost(e.clientX, e.clientY);
    return;
  }

  e.stopPropagation();
  if (selectedTile === idx) deselect();
  else { deselect(); selectedTile = idx; RenderFarm.renderTile(idx); }

  if (state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].infectedAt !== undefined && state.rotTiles[idx].deadAt === undefined) {
    const baseCost = Math.ceil(SEEDS[td.seed].sell * 0.10);
    const cureCost = state.upgrades.fastCure ? Math.ceil(baseCost * 0.40) : baseCost;
    if (state.upgrades.fastCure) {
      if (state.coins >= cureCost) {
        state.coins -= cureCost;
        delete state.rotTiles[idx];
        state.stats.rotCured = (state.stats.rotCured || 0) + 1;
        if (typeof checkAchievements === 'function') checkAchievements();
        log('💊 Root rot cured.', 'event');
        updateCoins(); RenderFarm.renderTile(idx); save();
      } else {
        log(`💊 Need ${coinHTML()}${formatNumber(cureCost)} to cure root rot.`, 'event');
      }
    } else {
      showRotCureMenu(idx, cureCost, e.clientX + 4, e.clientY + 4);
    }
  } else if (_isFungal) {
    const clearCost = Math.ceil(SEEDS[td.seed].sell * 0.10);
    showFungalCureMenu(idx, clearCost, e.clientX + 4, e.clientY + 4);
  }
}

// ── Events namespace ───────────────────────────────────────────────────────
window.Events = {
  crowTick, hawkTick,
  weedTick, thornedWeedTick,
  moleTick, moundTick,
  rootRotSpawnTick, rotTick,
  locustTick, blightTick,
  fungalSpawnTick, fungalSpreadTick,
  masterFarmerTick,
  landDeveloperTick, claimedTileTick,
  plagueRatTick, diseasedTileTick,
  acidRainTick,
  voidRiftTick, voidRiftEffectTick,
  cosmicCrowTick,
  realityStormTick,
  addToSellQueue, tickSellBox, canTick,
};
