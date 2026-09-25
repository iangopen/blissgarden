// Functions that run INSIDE the game page (passed to page.evaluate), so each must be self-contained.
// They reach game internals only through window.__bliss (present while debug mode is on).

// Everything the save file persists, read back from live memory.
export function snapshot() {
  const B = window.__bliss;
  const clone = o => JSON.parse(JSON.stringify(o === undefined ? null : o));
  return {
    state: clone(B.state),
    upgradesShared: B.STATE.upgrades === B.state.upgrades,
    meta: clone({ ...B.STATE.meta }),
    prestige: clone(B.STATE.prestige),
    artifacts: clone(B.STATE.artifacts),
    blueprints: clone(B.STATE.blueprints),
    recipeUnlocks: clone(B.STATE.recipeUnlocks),
    tradingPost: clone(B.STATE.tradingPost),
    minigames: clone(B.STATE.minigames),
    settings: clone(B.STATE.settings),
    modifiers: clone(B.STATE.modifiers),
    ui: { nextId: B.ui.nextId, panelExpanded: B.ui.panelExpanded, panelWidth: B.ui.panelWidth },
  };
}

// Effective per-roll chance of every event at the stages where it is active, for three upgrade setups.
export function eventChances() {
  const B = window.__bliss;
  const PAIRS = [['crow', [1, 2]], ['weed', [1, 3]], ['thornedWeed', [2]], ['hawk', [2, 3]], ['mole', [2]], ['rot', [3]],
                 ['locust', [3]], ['blight', [3]], ['fungal', [3]], ['developer', [4]], ['plagueRat', [4]], ['acidRain', [4]],
                 ['voidRift', [5]], ['cosmicCrow', [5]], ['realityStorm', [5]]];
  const MIT = ['scarecrowCoat', 'groundMesh', 'herbicideI', 'soilTreatment', 'locustWard', 'weathervane', 'antifungalSpray',
               'ironGreenhouse', 'developerBribe', 'ratPoison', 'cosmicRepellent'];
  const SCEN = { none: [[], 0], allMitigation: [MIT, 0], greenhouseScarecrow: [['ironGreenhouse', 'scarecrowCoat'], 0],
                 thickSkin2: [MIT, 2] };
  const out = {};
  for (const [name, [upg, thick]] of Object.entries(SCEN)) {
    for (const k of Object.keys(B.state.upgrades)) delete B.state.upgrades[k];
    upg.forEach(u => { B.state.upgrades[u] = true; });
    B.STATE.prestige.perks = thick ? { thickSkin: thick } : {};
    B.recalculateModifiers();
    B.STATE.modifiers.seasonCrowMult = 1.25; B.STATE.modifiers.seasonWeedMult = 1.3;
    out[name] = {};
    for (const [id, stages] of PAIRS) for (const st of stages) { B.STATE.meta.stage = st; out[name][`${id}@${st}`] = B.eventChance(id); }
  }
  return out;
}

// Clicks every shop button once (plus refusals) and records the outcome after each click.
export function buyEverything() {
  const B = window.__bliss;
  const S = B.Sfx || B.Audio;
  const sounds = [];
  for (const k of Object.keys(S)) if (k.startsWith('play') && typeof S[k] === 'function') S[k] = () => { sounds.push(k); };
  const logLines = () => [...document.querySelectorAll('#log-inner > *')].map(e => e.textContent.trim());
  const logStart = logLines().length;
  const clickUpgrade = name => [...document.querySelectorAll('#upgrades-list .upgrade-card')]
    .find(c => c.querySelector('.ug-name').textContent === name).querySelector('.ug-btn').click();
  const clickItem = name => [...document.querySelectorAll('#items-list .upgrade-card')]
    .find(c => c.textContent.includes(name)).querySelector('button').click();
  const steps = [
    ['up', 'Expand Plot'], ['up', 'Bottom Row Expansion'], ['up', 'Iron Sell Box'], ['up', 'Wind-Up Crank'], ['up', 'Iron Crank'],
    ['up', 'Workshop Area 🔨'], ['up', 'Quick Roots'], ['up', 'Swift Market I'], ['up', 'Quick Roots'],
    ['item', 'Watering Can'], ['item', 'Copper Spout'], ['item', 'Cage'], ['item', 'Cage'], ['item', 'Common Fertilizer'],
    ['item', 'Uncommon Fertilizer'], ['item', 'Hired Hand'], ['item', 'Hired Hand'], ['item', 'Hired Hand'],
  ];
  const trace = steps.map(([kind, name]) => {
    (kind === 'up' ? clickUpgrade : clickItem)(name);
    const m = B.STATE.modifiers;
    return { step: name, coins: B.state.coins, rep: B.STATE.meta.reputation, upgrades: Object.keys(B.state.upgrades).sort().join(','),
             mods: [m.growSpeed, m.sellValue, m.sellInterval, m.sellBoxCapacity, m.crankClickMultiplier] };
  });
  const s = B.state;
  return {
    trace, sounds, log: logLines().slice(logStart),
    state: { items: s.items, cageCount: s.cageCount, fertCharges: s.fertCharges, uncommonFertCharges: s.uncommonFertCharges,
             hiredHandCount: s.hiredHandCount, expanded: s.expanded, expandedBottom: s.expandedBottom, tiles: s.tiles.length,
             recipeUnlocks: Object.keys(B.STATE.recipeUnlocks).sort(), achievements: Object.keys(s.achievements).sort() },
    dom: { tiles: document.querySelectorAll('#farm-grid .tile').length, sellbox: document.getElementById('sell-box').className,
           crank: document.getElementById('crank-box').style.display + ' ' + document.getElementById('crank-box').className,
           itemButtons: [...document.querySelectorAll('#items-list .ug-btn')].map(b => b.textContent + (b.disabled ? '(off)' : '')).join('|'),
           itemCosts: [...document.querySelectorAll('#items-list .ug-cost')].map(b => b.textContent).join('|') },
  };
}

// Stand-in for window.__bliss on the pre-module build (classic scripts, globals), used only to record goldens.
export function installLegacyShim() {
  const g = k => (0, eval)(k);
  window.__bliss = new Proxy({}, {
    get(_, k) {
      if (typeof k !== 'string') return undefined;
      if (k === 'ui') return { get nextId() { return g('nextId'); }, get panelExpanded() { return g('panelExpanded'); },
                               get panelWidth() { return g('panelWidth'); }, get selectedTile() { return g('selectedTile'); } };
      if (k === 'Sfx') return g('Audio');
      try { return g(k); } catch (_) { return undefined; }
    },
  });
}
