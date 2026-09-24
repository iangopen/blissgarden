// ══════════════════════════════
// CRAFTING SYSTEM
// ══════════════════════════════

function _craftIngSource(id) {
  return (window.RECIPES || []).find(r => r.id === id) ? 'crafted' : 'crop';
}

function _craftIngHeld(id) {
  if (_craftIngSource(id) === 'crafted') return (state.craftedInventory || {})[id] || 0;
  return (state.inventory || {})[id] || 0;
}

window.craftItem = function craftItem(recipeId) {
  if (!STATE.upgrades.workshop) return;
  const recipe = (window.RECIPES || []).find(r => r.id === recipeId);
  if (!recipe) return;
  if (!STATE.recipeUnlocks[recipeId]) return;

  const slotsUsed = (state.craftQueue || []).length;
  if (slotsUsed >= (STATE.modifiers.craftSlots || 1)) return;

  for (const [ingId, needed] of Object.entries(recipe.ingredients)) {
    if (_craftIngHeld(ingId) < needed) return;
  }

  if (!state.craftedInventory) state.craftedInventory = {};
  for (const [ingId, needed] of Object.entries(recipe.ingredients)) {
    if (_craftIngSource(ingId) === 'crafted') {
      state.craftedInventory[ingId] = (state.craftedInventory[ingId] || 0) - needed;
      if (state.craftedInventory[ingId] <= 0) delete state.craftedInventory[ingId];
    } else {
      state.inventory[ingId] = (state.inventory[ingId] || 0) - needed;
      if (state.inventory[ingId] <= 0) delete state.inventory[ingId];
    }
  }

  const now = Date.now();
  const craftMs = Math.ceil((recipe.craftTime * 1000) / (STATE.modifiers.craftSpeedMult || 1));
  if (!state.craftQueue) state.craftQueue = [];
  state.craftQueue.push({ recipeId, startedAt: now, finishAt: now + craftMs });
  EventBus.emit('craft:started', { recipeId });

  if (typeof RenderCrafting !== 'undefined' && RenderCrafting.isOpen()) RenderCrafting.renderCraftingPanel();
  if (typeof RenderPanel !== 'undefined') RenderPanel.renderInventory();
  save();
};

// Called every 50ms via TimerManager
window.craftTick = function craftTick() {
  if (!state.craftQueue || !state.craftQueue.length) return;
  const now = Date.now();
  let anyDone = false;

  state.craftQueue = state.craftQueue.filter(q => {
    if (now < q.finishAt) return true;
    if (!state.craftedInventory) state.craftedInventory = {};
    state.craftedInventory[q.recipeId] = (state.craftedInventory[q.recipeId] || 0) + 1;
    state.stats.totalCrafted = (state.stats.totalCrafted || 0) + 1;
    if (!state.stats.recipesEverCrafted) state.stats.recipesEverCrafted = {};
    state.stats.recipesEverCrafted[q.recipeId] = true;
    const recipe = (window.RECIPES || []).find(r => r.id === q.recipeId);
    if (recipe) log(`${recipe.emoji} ${recipe.name} finished crafting!`, 'unlock');
    EventBus.emit('item:crafted', { recipeId: q.recipeId });
    anyDone = true;
    return false;
  });

  if (anyDone) {
    if (typeof checkAchievements === 'function') checkAchievements();
    if (typeof RenderCrafting !== 'undefined' && RenderCrafting.isOpen()) RenderCrafting.renderCraftingPanel();
    if (typeof RenderPanel !== 'undefined') RenderPanel.renderInventory();
    save();
  }
};

window.unlockRecipe = function unlockRecipe(recipeId) {
  const recipe = (window.RECIPES || []).find(r => r.id === recipeId);
  if (!recipe || recipe.unlockType !== 'purchase') return;
  if (STATE.recipeUnlocks[recipeId]) return;
  if (state.coins < recipe.unlockCost) return;
  state.coins -= recipe.unlockCost;
  STATE.recipeUnlocks[recipeId] = true;
  if (typeof RenderCrafting !== 'undefined') RenderCrafting.renderCraftingPanel();
  if (typeof updateCoins === 'function') updateCoins();
  log(`📜 Recipe unlocked: ${recipe.emoji} ${recipe.name}!`, 'unlock');
  save();
};

window.checkFreeRecipes = function checkFreeRecipes() {
  if (!STATE.upgrades.workshop) return;
  (window.RECIPES || []).filter(r => r.unlockType === 'free').forEach(r => {
    STATE.recipeUnlocks[r.id] = true;
  });
};

window.checkPrestigeUnlocks = function checkPrestigeUnlocks() {
  const count = STATE.prestige.count || 0;
  let any = false;
  (window.RECIPES || []).forEach(r => {
    if (STATE.recipeUnlocks[r.id]) return;
    if (r.unlockType === 'prestige' && count >= r.unlockPrestige) {
      STATE.recipeUnlocks[r.id] = true;
      log(`📜 Recipe unlocked: ${r.emoji} ${r.name}!`, 'unlock');
      any = true;
    }
  });
  if (any) {
    if (typeof RenderCrafting !== 'undefined') RenderCrafting.renderCraftingPanel();
  }
};

window.checkAchievementUnlocks = function checkAchievementUnlocks(achievementId) {
  let any = false;
  (window.RECIPES || []).forEach(r => {
    if (STATE.recipeUnlocks[r.id]) return;
    if (r.unlockType === 'achievement' && r.unlockAchievementId === achievementId) {
      STATE.recipeUnlocks[r.id] = true;
      log(`📜 Recipe unlocked: ${r.emoji} ${r.name}!`, 'unlock');
      any = true;
    }
  });
  if (any) {
    if (typeof RenderCrafting !== 'undefined') RenderCrafting.renderCraftingPanel();
  }
};
