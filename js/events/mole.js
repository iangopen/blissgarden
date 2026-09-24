// ── MOLE ──────────────────────────────────────────────────────────────────
function moleTick() {
  if (!state.mature || getCurrentStage().stage < 2) return;
  if (getCurrentStage().stage >= 4) return;
  if (Math.random() < eventChance('mole')) moleAttack();
}

function moleAttack() {
  const cands = [];
  for (let i = 0; i < tileCount(); i++) {
    if (!state.tiles[i] || isReady(state.tiles[i], i)) continue;
    if (state.cages.includes(i) && Math.random() < 0.60) continue;
    cands.push(i);
  }
  if (!cands.length) return;

  if (!state.firstMoleEver) {
    state.firstMoleEver = true;
    showBanner('🐭 Moles have been spotted tunneling!');
  }

  const idx = cands[Math.floor(Math.random() * cands.length)];
  const td  = state.tiles[idx];
  STATE.session.debugCounts.mole++;
  const cx  = window.innerWidth  / 2 + (Math.random() - 0.5) * 200;
  const cy  = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
  dropLoose(td.seed, cx, cy, td.sellBonus || 1.0, td.drowned || false);
  state.tiles[idx] = null;
  if (state.tilesWatered) delete state.tilesWatered[idx];
  if (state.rotTiles)     delete state.rotTiles[idx];
  if (!state.mounds) state.mounds = {};
  state.mounds[idx] = Date.now() + (state.upgrades.quickSoil ? 5000 : 20000);
  log(`🐭 A mole uprooted a ${SEEDS[td.seed].name}! It fell loose nearby.`, 'attack');
  EventBus.emit('event:mole');
  RenderFarm.renderTile(idx); save();
}

function moundTick() {
  if (!state.mounds) return;
  let changed = false;
  const now = Date.now();
  Object.keys(state.mounds).forEach(k => {
    const idx = parseInt(k);
    if (now >= state.mounds[idx]) { delete state.mounds[idx]; RenderFarm.renderTile(idx); changed = true; }
  });
  if (changed) save();
}
