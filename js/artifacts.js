// ══════════════════════════════
// ARTIFACT LOGIC
// ══════════════════════════════

function applyArtifacts() {
  if (!window.ARTIFACTS) return;
  const sess = STATE.session;
  sess.artifactDayBonus   = 0;
  sess.artifactNightSpeed = 0;
  sess.artifactNoNightPen = false;

  for (const art of window.ARTIFACTS) {
    if (!STATE.artifacts[art.id]) continue;
    const v = art.effect.value;
    switch (art.effect.type) {
      case 'growSpeed':          STATE.modifiers.growSpeed    *= (1 + v); break;
      case 'sellValue':          STATE.modifiers.sellValue    *= (1 + v); break;
      case 'sellInterval':       STATE.modifiers.sellInterval *= (1 - v); break;
      case 'dayBonus':           sess.artifactDayBonus   = v;    break;
      case 'nightCropSpeed':     sess.artifactNightSpeed = v;    break;
      case 'removeNightPenalty': sess.artifactNoNightPen = true; break;
    }
  }
}

window.purchaseBlueprint = function purchaseBlueprint(blueprintId) {
  const bp = (window.BLUEPRINTS || []).find(b => b.id === blueprintId);
  if (!bp || bp.source !== 'shop') return;
  if (STATE.blueprints[blueprintId]) return;
  if (state.coins < bp.cost) return;
  state.coins -= bp.cost;
  STATE.blueprints[blueprintId] = true;
  EventBus.emit('blueprint:unlocked', { blueprintId });
  save();
};

window.craftArtifact = function craftArtifact(artifactId) {
  if (!STATE.upgrades.workshop) return;
  const art = (window.ARTIFACTS || []).find(a => a.id === artifactId);
  if (!art) return;
  if (STATE.artifacts[artifactId]) return;
  if (!state.craftedInventory) state.craftedInventory = {};
  for (const [ingId, needed] of Object.entries(art.ingredients)) {
    if ((state.craftedInventory[ingId] || 0) < needed) return;
  }
  for (const [ingId, needed] of Object.entries(art.ingredients)) {
    state.craftedInventory[ingId] -= needed;
    if (state.craftedInventory[ingId] <= 0) delete state.craftedInventory[ingId];
  }
  STATE.artifacts[artifactId] = true;
  recalculateModifiers();
  EventBus.emit('artifact:crafted', { artifactId });
  save();
};
