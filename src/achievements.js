import { ACHIEVEMENTS, ARTIFACTS, BASIC_SEEDS, BLUEPRINTS, RECIPES, SEEDS } from './data.js';
import { STATE, state, tileCount } from './state.js';
import { save } from './save.js';
import { EventBus } from './core/bus.js';
import { RenderPanel } from './render/panel.js';

// ══════════════════════════════
// ACHIEVEMENT CHECKER
// ══════════════════════════════
export function checkAchievements() {
  if (!ACHIEVEMENTS) return;
  if (!state.achievements) state.achievements = {};
  if (!state.stats) state.stats = {};
  const s = state;

  function stageReached(n) { return !!(s.stagesSeen && s.stagesSeen[n]); }

  const CONDITIONS = {
    // FARMING
    firstPlant:     () => (s.stats.totalPlanted     || 0) >= 1,
    firstHarvest:   () => (s.stats.totalHarvested   || 0) >= 1,
    harvest100:     () => (s.stats.totalHarvested   || 0) >= 100,
    harvest1000:    () => (s.stats.totalHarvested   || 0) >= 1000,
    harvest10000:   () => (s.stats.totalHarvested   || 0) >= 10000,
    allBasicSeeds:  () => (BASIC_SEEDS || []).every(k => s.stats.seedTypesPlanted && s.stats.seedTypesPlanted[k]),
    allSeeds:       () => Object.keys(SEEDS || {}).every(k => s.stats.seedTypesPlanted && s.stats.seedTypesPlanted[k]),
    fertilizeAll: () => {
      const tc = (typeof tileCount === 'function') ? tileCount() : 0;
      if (tc === 0) return false;
      let hasOccupied = false;
      for (let i = 0; i < tc; i++) {
        if (s.tiles[i]) {
          hasOccupied = true;
          if (!s.fertilizedTiles?.[i] && !s.uncommonFertilizedTiles?.[i]) return false;
        }
      }
      return hasOccupied;
    },
    // TRADING
    first100:       () => (s.coinsEarned || 0) >= 100,
    first1k:        () => (s.coinsEarned || 0) >= 1000,
    first10k:       () => (s.coinsEarned || 0) >= 10000,
    first100k:      () => (s.coinsEarned || 0) >= 100000,
    first1m:        () => (s.coinsEarned || 0) >= 1000000,
    first10m:       () => (s.coinsEarned || 0) >= 10000000,
    first1b:        () => (s.coinsEarned || 0) >= 1000000000,
    sellCrafted10:  () => (s.stats.craftedSold      || 0) >= 10,
    // SURVIVAL
    firstCrow:      () => (s.stats.crowsSurvived    || 0) >= 1,
    survive10Crows: () => (s.stats.crowsSurvived    || 0) >= 10,
    clearWeed:      () => (s.stats.weedsCleared     || 0) >= 1,
    clear50Weeds:   () => (s.stats.weedsCleared     || 0) >= 50,
    surviveLocust:  () => (s.stats.locustsSurvived  || 0) >= 1,
    cureRot:        () => (s.stats.rotCured         || 0) >= 1,
    surviveStage3:  () => (s.stats.blightsSurvived  || 0) >= 1 && stageReached(3),
    // CRAFTING
    firstCraft:     () => (s.stats.totalCrafted     || 0) >= 1,
    craft10:        () => (s.stats.totalCrafted     || 0) >= 10,
    craft100:       () => (s.stats.totalCrafted     || 0) >= 100,
    craftAll:       () => (RECIPES || []).every(r => s.stats.recipesEverCrafted && s.stats.recipesEverCrafted[r.id]),
    firstArtifact:  () => Object.keys(STATE.artifacts || {}).some(k => STATE.artifacts[k]),
    allArtifacts:   () => (ARTIFACTS || []).length > 0 && (ARTIFACTS || []).every(a => STATE.artifacts[a.id]),
    // PRESTIGE
    firstPrestige:  () => (s.stats.prestigeCount    || 0) >= 1,
    prestige5:      () => (s.stats.prestigeCount    || 0) >= 5,
    prestige10:     () => (s.stats.prestigeCount    || 0) >= 10,
    // EXPLORATION
    stage1:         () => stageReached(1),
    stage2:         () => stageReached(2),
    stage3:         () => stageReached(3),
    stage4:         () => stageReached(4),
    stage5:         () => stageReached(5),
    expandPlot:     () => !!(s.expanded),
    buyBag:         () => (s.stats.bagsBought       || 0) >= 1,
    // MINIGAMES
    soilMixerEasy10:   () => (STATE.minigames?.soilMixer?.playsEasy   || 0) >= 10,
    soilMixerMedium10: () => (STATE.minigames?.soilMixer?.playsMedium || 0) >= 10,
    waterFlowEasy10:   () => (STATE.minigames?.waterFlow?.playsEasy   || 0) >= 10,
    waterFlowMedium10: () => (STATE.minigames?.waterFlow?.playsMedium || 0) >= 10,
    minigame50:  () => ((STATE.minigames?.soilMixer?.totalPlays || 0) + (STATE.minigames?.waterFlow?.totalPlays || 0)) >= 50,
    minigame200: () => ((STATE.minigames?.soilMixer?.totalPlays || 0) + (STATE.minigames?.waterFlow?.totalPlays || 0)) >= 200,
  };

  let anyNew = false;
  for (const ach of ACHIEVEMENTS) {
    if (s.achievements[ach.id]) continue;
    const checker = CONDITIONS[ach.id];
    if (!checker) continue;
    if (checker()) {
      s.achievements[ach.id] = { unlockedAt: Date.now() };
      anyNew = true;
      EventBus.emit('achievement:unlocked', { id: ach.id });
    }
  }

  if (anyNew) {
    save();
    if (typeof RenderPanel !== 'undefined' && RenderPanel.renderAchievements) {
      RenderPanel.renderAchievements();
    }
  }
};

// ══════════════════════════════
// BLUEPRINT AUTO-UNLOCK
// ══════════════════════════════
function unlockAchievementBlueprints({ id }) {
  (BLUEPRINTS || [])
    .filter(b => b.source === 'achievement' && b.achievementId === id)
    .forEach(b => {
      STATE.blueprints[b.id] = true;
      EventBus.emit('blueprint:unlocked', { blueprintId: b.id });
    });
}

// ══════════════════════════════
// ACHIEVEMENT TOAST
// ══════════════════════════════
const AchievementToast = (function () {
  const queue = [];
  let showing = false;

  function showNext() {
    if (!queue.length) { showing = false; return; }
    showing = true;
    const { id } = queue.shift();
    const ach = (ACHIEVEMENTS || []).find(a => a.id === id);
    if (!ach) { showNext(); return; }

    const toast = document.createElement('div');
    toast.className = 'ach-toast';
    const stars = '⭐'.repeat(ach.stars);
    toast.innerHTML =
      `<span class="ach-toast-stars">${stars}</span>` +
      `<div class="ach-toast-body"><div class="ach-toast-label">Achievement Unlocked</div>` +
      `<div class="ach-toast-name">${ach.name}</div></div>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('ach-toast-in'));

    const outTimer = setTimeout(() => {
      toast.classList.add('ach-toast-out');
      toast.addEventListener('animationend', () => { toast.remove(); showNext(); }, { once: true });
    }, 3000);
    toast.dataset.timer = outTimer;
  }

  function onUnlocked({ id }) {
    queue.push({ id });
    if (!showing) showNext();
  }

  return { onUnlocked };
}());

// Subscribes the blueprint unlock, then the toast (this order matters: listeners run in registration order).
export function startAchievements() {
  EventBus.on('achievement:unlocked', unlockAchievementBlueprints);
  EventBus.on('achievement:unlocked', AchievementToast.onUnlocked);
}
