function setupEvents() {
  EventBus.on('crop:planted',     () => { if (typeof Tutorial !== 'undefined') Tutorial.onPlanted(); });
  EventBus.on('crop:sold',        () => { if (typeof Tutorial !== 'undefined') Tutorial.onSold(); });
  EventBus.on('minigame:complete', ({ gameId, difficulty, won }) => {
    const reward = calcMinigameReward(gameId, difficulty, won);
    if (won && reward > 0) {
      addCoins(reward);
      log(`🎮 ${gameId === 'soilMixer' ? 'Soil Mixer' : 'Water Flow'} — won ${coinHTML()}${formatNumber(reward)}!`, 'earnings');
      if (typeof Particles !== 'undefined') Particles.coinBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    const key = `plays${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    STATE.minigames[gameId][key]++;
    STATE.minigames[gameId].totalPlays++;
    if (typeof checkAchievements === 'function') checkAchievements();
    save();
  });
  EventBus.on('tradingpost:open', () => Audio.playTradingPostOpen());
  EventBus.on('deal:purchased',   () => Audio.playDealPurchase());
  EventBus.on('mystery:revealed', ({ outcome }) => {
    if (outcome === 'loss') Audio.playMysteryLoss();
    else Audio.playMysteryReveal();
    if (outcome === 'bigWin' || outcome === 'artifact' || outcome === 'prestige') Audio.playMysteryWin();
  });
  EventBus.on('upgrade:purchased', () => { RenderPanel.renderUpgrades(); sfx.upgrade(); });
  EventBus.on('artifact:crafted', ({ artifactId }) => {
    const art = (window.ARTIFACTS || []).find(a => a.id === artifactId);
    const name = art ? art.name : artifactId;
    log(`🏺 ${name} artifact activated!`, 'unlock');
    showBanner(`🏺 ${name} is now active.`);
    Audio.playArtifactCraft();
    if (typeof checkAchievements === 'function') checkAchievements();
  });
  EventBus.on('stage:advanced', ({ stage, name }) => {
    showBanner(`Stage ${stage}: ${name}`); sfx.stageAdvance(); RenderHUD.renderStage();
    RenderPanel.renderPrestige();
    RenderPanel.renderAscension();
    RenderHUD.renderReputation();
    RenderPanel.renderItems();
  });
  EventBus.on('achievement:unlocked', ({ id }) => {
    if (typeof checkAchievementUnlocks === 'function') checkAchievementUnlocks(id);
  });
  // ── Audio event wiring ────────────────────────────────────────────────────
  EventBus.on('crop:watered',      () => Audio.playWater());
  EventBus.on('tile:fertilized',   () => Audio.playFertilize());
  EventBus.on('cage:placed',       () => Audio.playCagePlace());
  EventBus.on('weed:cleared',      () => Audio.playWeedClear());
  EventBus.on('event:hawk',        () => Audio.playHawkAttack());
  EventBus.on('event:mole',        () => Audio.playMoleAttack());
  EventBus.on('event:rootRot',     () => Audio.playRootRot());
  EventBus.on('event:blight',      () => Audio.playBlightStorm());
  EventBus.on('event:fungal',      () => Audio.playFungalBloom());
  EventBus.on('event:acidRain',    () => Audio.playAcidRain());
  EventBus.on('event:voidRift',    () => Audio.playVoidRift());
  EventBus.on('event:cosmicCrow',  () => Audio.playCosmicCrow());
  EventBus.on('event:realityStorm',() => Audio.playRealityStorm());
  EventBus.on('craft:started',     () => Audio.playCraftStart());
  EventBus.on('item:crafted',      () => Audio.playCraftFinish());
  EventBus.on('blueprint:unlocked',() => Audio.playBlueprintUnlock());
  EventBus.on('seed:purchased',    () => Audio.playSeedPurchase());
  EventBus.on('bag:purchased',     () => Audio.playBagPurchase());
  EventBus.on('modal:open',        () => Audio.playModalOpen());
  EventBus.on('modal:close',       () => Audio.playModalClose());
  EventBus.on('season:changed', ({ season }) => {
    log(`${season.emoji} ${season.name} has begun.`, 'season');
    showBanner(`${season.emoji} ${season.name} has arrived.`);
    Audio.playSeasonChange();
  });
  EventBus.on('event:drought', () => Audio.playDrought());
  EventBus.on('event:rain',    () => Audio.playRain());
  EventBus.on('event:frost',   () => Audio.playFrost());

  EventBus.on('prestige:reset', () => {
    Audio.playPrestige();
    if (typeof checkPrestigeUnlocks === 'function') checkPrestigeUnlocks();
    RenderFarm.buildGrid();
    RenderFarm.renderGrid();
    if (typeof applyFarmScale === 'function') applyFarmScale();
    RenderSellbox.renderQueue();
    RenderSellbox.renderCrank();
    renderLoose();
    updateCoins();
    RenderHUD.renderStage();
    RenderPanel.renderInventory();
    RenderPanel.renderUpgrades();
    RenderPanel.renderItems();
    RenderPanel.renderSeeds();
    RenderPanel.renderBags();
    RenderPanel.renderPrestige();
    RenderPanel.renderAscension();
    RenderHUD.renderReputation();
    applyPanelState();
  });
}

function setupUI() {
  RenderEnv.init();

  const panelEl = document.getElementById('panel');

  document.getElementById('panel-resize-handle').addEventListener('mousedown', e => {
    resizing = true; resizeStartX = e.clientX; resizeStartW = panelWidth; resizeMoved = false;
    panelEl.classList.add('resizing'); e.preventDefault(); e.stopPropagation();
  });
  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const dx = resizeStartX - e.clientX;
    if (Math.abs(dx) > 4) resizeMoved = true;
    if (resizeMoved) {
      panelWidth = Math.max(200, Math.min(500, resizeStartW + dx));
      applyPanelState();
    }
  });
  document.addEventListener('mouseup', () => {
    if (!resizing) return;
    resizing = false; panelEl.classList.remove('resizing');
    save();
  });
  document.addEventListener('mousedown', () => { if (!drag && !resizing) deselect(); hideTileMenu(); });
  window.addEventListener('resize', () => { if (state.upgrades.windUpCrank) RenderSellbox.positionCrank(); });

  DebugPanel.setupUI();
  RenderSellbox.setupUI();
  Audio.setupMute();

  (function () {
    const btn                 = document.getElementById('settings-btn');
    const backdrop            = document.getElementById('settings-backdrop');
    const panel               = document.getElementById('settings-panel');
    const resetBtn            = document.getElementById('reset-btn');
    const hideBoughtToggle    = document.getElementById('hide-bought-toggle');
    const debugModeToggle     = document.getElementById('debug-mode-toggle');
    const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
    const showBannersToggle   = document.getElementById('show-banners-toggle');
    const muteSettingsToggle  = document.getElementById('mute-settings-toggle');
    const farmNameInput       = document.getElementById('farm-name-input');
    let confirmed = false;

    function applyFarmName() {
      const name = (farmNameInput ? farmNameInput.value.trim() : '') || 'Bliss Farm';
      STATE.meta.farmName = name;
      document.title = `${name} — Bliss Farm`;
      RenderHUD.renderStage();
      save();
    }
    if (farmNameInput) {
      farmNameInput.addEventListener('blur',    applyFarmName);
      farmNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') { applyFarmName(); farmNameInput.blur(); } });
    }

    function openSettings() {
      confirmed = false;
      resetBtn.textContent = 'Reset Data';
      saveIo.style.display = 'none'; saveIo.value = ''; ioMsg('');
      if (farmNameInput) farmNameInput.value = STATE.meta.farmName || 'Bliss Farm';
      hideBoughtToggle.checked    = !!state.hideBoughtUpgrades;
      debugModeToggle.checked     = !!STATE.settings.debugMode;
      reducedMotionToggle.checked = !!STATE.settings.reducedMotion;
      showBannersToggle.checked   = STATE.settings.showBanners !== false;
      muteSettingsToggle.checked  = !!STATE.settings.muted;
      backdrop.style.display = 'block';
      panel.style.display = 'block';
      EventBus.emit('modal:open');
    }
    function closeSettings() {
      confirmed = false;
      resetBtn.textContent = 'Reset Data';
      backdrop.style.display = 'none';
      panel.style.display = 'none';
      EventBus.emit('modal:close');
    }

    hideBoughtToggle.addEventListener('change', () => {
      state.hideBoughtUpgrades = hideBoughtToggle.checked;
      RenderPanel.renderUpgrades();
      save();
    });
    debugModeToggle.addEventListener('change', () => {
      STATE.settings.debugMode = debugModeToggle.checked;
      DebugPanel.applyDebugMode();
      save();
    });
    reducedMotionToggle.addEventListener('change', () => {
      STATE.settings.reducedMotion = reducedMotionToggle.checked;
      applyReducedMotion();
      save();
    });
    showBannersToggle.addEventListener('change', () => {
      STATE.settings.showBanners = showBannersToggle.checked;
      save();
    });
    muteSettingsToggle.addEventListener('change', () => {
      STATE.settings.muted = muteSettingsToggle.checked;
      localStorage.setItem('bliss_muted', muteSettingsToggle.checked ? '1' : '0');
      const muteBtn = document.getElementById('mute-btn');
      if (muteBtn) muteBtn.textContent = muteSettingsToggle.checked ? '🔇' : '🔊';
    });
    btn.addEventListener('click',      e => { e.stopPropagation(); openSettings(); });
    backdrop.addEventListener('click', closeSettings);
    panel.addEventListener('click',    e => e.stopPropagation());
    resetBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirmed) { confirmed = true; resetBtn.textContent = 'Are you sure?'; }
      else {
        // Only this game's keys: GitHub Pages projects on this account share one origin.
        ['blissfarm10', 'blissfarm9', 'bliss_muted'].forEach(k => localStorage.removeItem(k));
        reloadWithoutSaving();
      }
    });

    // ── Export / Import ──
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const saveIo    = document.getElementById('save-io');
    const saveMsg   = document.getElementById('save-io-msg');
    function ioMsg(text, isErr) { saveMsg.textContent = text; saveMsg.classList.toggle('err', !!isErr); }
    function reloadWithoutSaving() {
      TimerManager.timers = {};   // stop the autosave timer from re-writing the save before reload
      window.save = () => {};
      location.reload();
    }
    exportBtn.addEventListener('click', e => {
      e.stopPropagation();
      const text = exportSave();
      saveIo.style.display = ''; saveIo.value = text; saveIo.select();
      const copied = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject();
      copied.then(() => ioMsg('Save copied to clipboard.'), () => ioMsg('Copy the text above to keep your save.'));
    });
    importBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (saveIo.style.display === 'none' || !saveIo.value.trim()) {
        saveIo.style.display = ''; saveIo.value = ''; saveIo.focus();
        ioMsg('Paste a save, then press Import save again.');
        return;
      }
      try {
        importSave(saveIo.value);
        ioMsg('Save imported. Reloading…');
        reloadWithoutSaving();
      } catch (err) {
        ioMsg(err.message, true);
      }
    });
  }());

  (function () {
    const mgBtn     = document.getElementById('mg-btn');
    const mgClose   = document.getElementById('mg-close-btn');
    const mgBackdrop = document.getElementById('mg-backdrop');
    const mgModal   = document.getElementById('mg-modal');
    if (mgBtn)     mgBtn.addEventListener('click', e => { e.stopPropagation(); if (mgModal?.style.display === 'flex') Minigames.close(); else Minigames.open(); });
    if (mgClose)   mgClose.addEventListener('click', () => Minigames.close());
    if (mgBackdrop)mgBackdrop.addEventListener('click', () => Minigames.close());
    if (mgModal)   mgModal.addEventListener('click', e => e.stopPropagation());
  }());

  (function () {
    const tpBtn = document.getElementById('tp-btn');
    if (tpBtn) {
      tpBtn.addEventListener('click', e => {
        e.stopPropagation();
        const modal = document.getElementById('tp-modal');
        if (modal && modal.style.display === 'flex') TradingPost.close();
        else TradingPost.open();
      });
    }
    const tpBackdrop = document.getElementById('tp-backdrop');
    if (tpBackdrop) tpBackdrop.addEventListener('click', () => TradingPost.close());
    const tpClose = document.getElementById('tp-close-btn');
    if (tpClose) tpClose.addEventListener('click', () => TradingPost.close());
    const tpModal = document.getElementById('tp-modal');
    if (tpModal) tpModal.addEventListener('click', e => e.stopPropagation());
  }());

  (function () {
    const artifactsBtn = document.getElementById('artifacts-btn');
    artifactsBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (RenderArtifacts.isOpen()) { RenderArtifacts.close(); EventBus.emit('modal:close'); }
      else { RenderArtifacts.open(); EventBus.emit('modal:open'); }
    });
  }());

  (function () {
    const craftingBtn = document.getElementById('crafting-btn');
    const backdrop    = document.getElementById('crafting-backdrop');
    const modal       = document.getElementById('crafting-modal');
    const closeBtn    = document.getElementById('crafting-close-btn');

    function openCrafting() {
      backdrop.style.display = 'block';
      modal.style.display = 'flex';
      if (typeof RenderCrafting !== 'undefined') RenderCrafting.renderCraftingPanel();
      EventBus.emit('modal:open');
    }
    function closeCrafting() {
      backdrop.style.display = 'none';
      modal.style.display = 'none';
      EventBus.emit('modal:close');
    }

    craftingBtn.addEventListener('click', e => { e.stopPropagation(); openCrafting(); });
    backdrop.addEventListener('click', closeCrafting);
    modal.addEventListener('click', e => e.stopPropagation());
    closeBtn.addEventListener('click', closeCrafting);
  }());

  (function () {
    const prestigeBtn = document.getElementById('prestige-btn');
    const backdrop    = document.getElementById('prestige-backdrop');
    const modal       = document.getElementById('prestige-modal');
    const closeBtn    = document.getElementById('prestige-close-btn');

    function openPrestige() {
      backdrop.style.display = 'block';
      modal.style.display = 'flex';
      if (typeof RenderPanel !== 'undefined' && RenderPanel.renderPrestige) {
        RenderPanel.renderPrestige();
      }
      EventBus.emit('modal:open');
    }
    function closePrestige() {
      backdrop.style.display = 'none';
      modal.style.display = 'none';
      EventBus.emit('modal:close');
    }

    prestigeBtn.addEventListener('click', e => { e.stopPropagation(); openPrestige(); });
    backdrop.addEventListener('click', closePrestige);
    modal.addEventListener('click', e => e.stopPropagation());
    closeBtn.addEventListener('click', closePrestige);
  }());

  (function () {
    const achBtn   = document.getElementById('ach-btn');
    const backdrop = document.getElementById('ach-backdrop');
    const modal    = document.getElementById('ach-modal');
    const closeBtn = document.getElementById('ach-close-btn');

    function openAch() {
      backdrop.style.display = 'block';
      modal.style.display = 'flex';
      if (typeof RenderPanel !== 'undefined' && RenderPanel.renderAchievements) {
        RenderPanel.renderAchievements();
      }
      EventBus.emit('modal:open');
    }
    function closeAch() {
      backdrop.style.display = 'none';
      modal.style.display = 'none';
      EventBus.emit('modal:close');
    }

    achBtn.addEventListener('click',   e => { e.stopPropagation(); openAch(); });
    backdrop.addEventListener('click', closeAch);
    modal.addEventListener('click',    e => e.stopPropagation());
    closeBtn.addEventListener('click', closeAch);
  }());

  DebugPanel.applyDebugMode();
}

function renderInitial() {
  RenderLog.init();
  RenderFarm.renderGrid();
  RenderPanel.renderInventory();
  try { RenderPanel.renderSeeds(); } catch (e) { console.error('renderSeeds failed:', e); }
  RenderPanel.renderBags();
  RenderPanel.renderItems();
  RenderPanel.renderUpgrades();
  RenderSellbox.renderQueue();
  RenderSellbox.renderCrank();
  renderLoose();
  updateCoins();
  RenderHUD.renderStage();
  RenderPanel.renderAchievements();
  RenderPanel.renderPrestige();
  RenderPanel.renderAscension();
  RenderHUD.renderReputation();
  if (typeof checkAchievements === 'function') checkAchievements();
  applyPanelState();

  for (let i = 0; i < tileCount(); i++) {
    const td = state.tiles[i];
    prevReadyState[i] = td ? isReady(td, i) : false;
  }
}

// ── Mobile farm scaling ────────────────────────────────────────────────────
function applyFarmScale() {
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
window.addEventListener('resize', applyFarmScale);

// ── Mobile panel (bottom sheet) toggle ────────────────────────────────────
function setupMobilePanel() {
  const toggle   = document.getElementById('panel-mobile-toggle');
  const backdrop = document.getElementById('panel-mobile-backdrop');
  const panel    = document.getElementById('panel');
  if (!toggle || !panel) return;

  function openMobilePanel() {
    panel.classList.add('mobile-open');
    backdrop.classList.add('mobile-backdrop-visible');
    panelExpanded = true;
  }
  function closeMobilePanel() {
    panel.classList.remove('mobile-open');
    backdrop.classList.remove('mobile-backdrop-visible');
    panelExpanded = false;
  }

  toggle.addEventListener('click',   e => { e.stopPropagation(); openMobilePanel(); });
  toggle.addEventListener('touchend',e => { e.stopPropagation(); e.preventDefault(); openMobilePanel(); }, { passive: false });
  backdrop.addEventListener('click',   closeMobilePanel);
  backdrop.addEventListener('touchend', e => { e.preventDefault(); closeMobilePanel(); }, { passive: false });
}

function showFarmNameOverlay() {
  const overlay = document.getElementById('name-overlay');
  const input   = document.getElementById('name-overlay-input');
  const btn     = document.getElementById('name-overlay-btn');
  if (!overlay) return;
  overlay.style.display = 'flex';
  if (input) { input.focus(); input.select(); }

  function confirm() {
    const name = (input ? input.value.trim() : '') || 'Bliss Farm';
    STATE.meta.farmName = name;
    document.title = `${name} — Bliss Farm`;
    overlay.style.display = 'none';
    RenderHUD.renderStage();
    save();
  }
  if (btn)   btn.addEventListener('click', confirm, { once: true });
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') confirm(); });
}

function init() {
  const hadSave = load();
  applyReducedMotion();
  recalculateModifiers();
  if (typeof checkFreeRecipes === 'function') checkFreeRecipes();
  if (typeof checkPrestigeUnlocks === 'function') checkPrestigeUnlocks();
  RenderFarm.buildGrid();
  setupTimers();
  setupEvents();
  setupUI();
  setupMobilePanel();
  if (typeof Seasons !== 'undefined') Seasons.init();
  if (typeof Tooltip !== 'undefined') Tooltip.init();
  renderInitial();
  applyFarmScale();
  RenderFarm.probeSprites();
  document.title = `${STATE.meta.farmName || 'Bliss Farm'} — Bliss Farm`;
  if (!hadSave) showFarmNameOverlay();
  if (typeof TradingPost !== 'undefined') TradingPost.init();
  if (typeof Tutorial !== 'undefined') Tutorial.init();
}

init();
