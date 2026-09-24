// ── ROT CURE MENU ─────────────────────────────────────────────────────────
function showRotCureMenu(idx, cost, x, y) {
  const menu = document.getElementById('tile-menu');
  menu.innerHTML = '';
  const header = mk('div');
  header.style.cssText = 'color:rgba(255,180,60,.8);font-size:10px;font-weight:700;padding:4px 8px 2px';
  header.textContent = '🍂 Root Rot — cure or harvest fast';
  menu.appendChild(header);
  const btn = mk('button'); btn.className = 'tmenu-btn';
  btn.innerHTML = `💊 Cure — ${coinHTML()}${formatNumber(cost)}`;
  if (state.coins < cost) { btn.disabled = true; btn.style.opacity = '0.4'; }
  btn.addEventListener('mousedown', e => {
    e.stopPropagation();
    const td = state.tiles[idx];
    if (!td || state.coins < cost) return;
    state.coins -= cost;
    delete state.rotTiles[idx];
    state.stats.rotCured = (state.stats.rotCured || 0) + 1;
    if (typeof checkAchievements === 'function') checkAchievements();
    log('💊 Root rot cured.', 'event');
    updateCoins(); RenderFarm.renderTile(idx); save(); hideTileMenu();
  });
  menu.appendChild(btn);
  menu.style.left = Math.min(x, window.innerWidth  - 200) + 'px';
  menu.style.top  = Math.min(y, window.innerHeight - 80)  + 'px';
  menu.style.display = 'block';
}

// ── ROOT ROT ──────────────────────────────────────────────────────────────
function rotTick() {
  if (!state.rotTiles) return;
  const now = Date.now();
  let changed = false;
  Object.keys(state.rotTiles).forEach(k => {
    const idx = parseInt(k);
    const rot = state.rotTiles[idx];
    if (rot.deadAt !== undefined) {
      if (now >= rot.deadAt) { delete state.rotTiles[idx]; RenderFarm.renderTile(idx); changed = true; }
    } else if (rot.infectedAt !== undefined) {
      const td = state.tiles[idx];
      if (!td) { delete state.rotTiles[idx]; changed = true; return; }
      if (isReady(td, idx)) return;
      if (now - rot.infectedAt >= 90000) {
        const cropName = SEEDS[td.seed].name;
        state.tiles[idx] = null;
        if (state.tilesWatered) delete state.tilesWatered[idx];
        state.rotTiles[idx] = { deadAt: now + 30000 };
        log(`💀 ${cropName} died from root rot.`, 'event');
        RenderFarm.renderTile(idx); changed = true;
      }
    }
  });
  if (changed) save();
}

function rootRotSpawnTick() {
  if (!state.mature || getCurrentStage().stage < 3) return;
  const chance = 0.10
    * (state.upgrades.soilTreatment  ? 0.60 : 1)
    * (state.upgrades.ironGreenhouse ? 0.80 : 1);
  if (Math.random() < chance) rootRotInfect();
}

function rootRotInfect() {
  const cands = [];
  for (let i = 0; i < tileCount(); i++) {
    const td = state.tiles[i];
    if (!td || isReady(td, i)) continue;
    const rot = state.rotTiles && state.rotTiles[i];
    if (rot && rot.infectedAt !== undefined) continue;
    cands.push(i);
  }
  if (!cands.length) return;

  if (!state.firstRotEver) {
    state.firstRotEver = true;
    showBanner('🍂 Root rot has reached your farm.');
  }

  const idx = cands[Math.floor(Math.random() * cands.length)];
  const td  = state.tiles[idx];
  STATE.session.debugCounts.rootRot++;
  if (!state.rotTiles) state.rotTiles = {};
  state.rotTiles[idx] = { infectedAt: Date.now() };
  log(`🍂 Root rot infected your ${SEEDS[td.seed].name}!`, 'event');
  EventBus.emit('event:rootRot');
  RenderFarm.renderTile(idx); save();
}

// ── LOCUST ────────────────────────────────────────────────────────────────
function locustTick() {
  if (!state.mature || getCurrentStage().stage < 3) return;
  const chance = 0.03
    * (state.upgrades.locustWard      ? 0.50 : 1)
    * (state.upgrades.ironGreenhouse  ? 0.80 : 1);
  if (Math.random() < chance) locustAttack();
}

function locustAttack() {
  STATE.session.debugCounts.locust++;
  if (!state.firstLocustEver) {
    state.firstLocustEver = true;
    showBanner('🪲 Locusts have descended on your farm.');
  }
  if (state.loose.length > 0) { state.loose = []; renderLoose(); }
  const setback = state.upgrades.cropShield ? 0.15 : 0.30;
  for (let i = 0; i < tileCount(); i++) {
    const td = state.tiles[i];
    if (!td || isReady(td, i)) continue;
    // Progress lives in burnedSeconds; never derive it from plantedAt.
    if (td.burnedSeconds === undefined) continue;
    td.burnedSeconds = Math.max(0, td.burnedSeconds * (1 - setback));
  }
  sfx.locust();
  state.stats.locustsSurvived = (state.stats.locustsSurvived || 0) + 1;
  if (typeof checkAchievements === 'function') checkAchievements();
  log('🪲 A locust swarm devastated the farm!', 'event');
  RenderFarm.renderGrid();
  animateLocust();
}

function animateLocust() {
  const { top: farmTop, height: farmH } = document.getElementById('game-area').getBoundingClientRect();
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const el = mk('div','locust-anim');
    el.textContent = '🪲';
    el.style.top = (farmTop + (r / (rows - 1)) * farmH * 0.85) + 'px';
    el.style.animationDelay = (r * 0.12) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    setTimeout(() => el.remove(), 5500);
  }
}

// ── BLIGHT ────────────────────────────────────────────────────────────────
function blightTick() {
  if (!state.mature || getCurrentStage().stage < 3) return;
  if (getCurrentStage().stage >= 4) return;
  const chance = 0.15
    * (state.upgrades.weathervane    ? 0.60 : 1)
    * (state.upgrades.ironGreenhouse ? 0.80 : 1);
  if (Math.random() < chance) blightAttack();
}

function blightAttack() {
  STATE.session.debugCounts.blight++;
  if (!state.firstBlightEver) {
    state.firstBlightEver = true;
    showBanner('🌪️ Blight storms are rolling in.');
  }
  if (state.tilesWatered) Object.keys(state.tilesWatered).forEach(k => { delete state.tilesWatered[k]; });
  if (state.fertilizedTiles && !state.upgrades.soilAnchor) {
    Object.keys(state.fertilizedTiles).forEach(k => {
      if (Math.random() < 0.25) delete state.fertilizedTiles[k];
    });
  }
  state.stats.blightsSurvived = (state.stats.blightsSurvived || 0) + 1;
  if (typeof checkAchievements === 'function') checkAchievements();
  log('🌪️ A blight storm stripped your soil!', 'event');
  EventBus.emit('event:blight');
  RenderFarm.renderGrid();
  animateBlight();
}

function animateBlight() {
  const el = mk('div','blight-cloud');
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 3200);
}
