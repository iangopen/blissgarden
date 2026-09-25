import { ARTIFACTS, BAGS, BASIC_SEEDS, BLUEPRINTS, RECIPES, SEEDS } from './data.js';
import { STATE, coinHTML, formatNumber, mk, state } from './state.js';
import { save } from './save.js';
import { recalculateModifiers } from './upgrades.js';
import { EventBus } from './core/bus.js';
import { checkAchievements } from './achievements.js';
import { log } from './render/log.js';
import { addCoins, updateCoins } from './events/index.js';
import { Particles } from './particles.js';
import { RenderCrafting } from './render/crafting.js';
import { RenderPanel } from './render/panel.js';

// ══════════════════════════════
// TRADING POST
// ══════════════════════════════
export const TradingPost = (() => {
  const RESET_MS = 3600000;

  const MERCHANTS = [
    { name: 'Old Barnaby',      emoji: '👴', quote: 'Fresh deals, straight from the fields!'  },
    { name: 'Mira the Swift',   emoji: '👩', quote: "Today only! Don't miss out."              },
    { name: 'Gus Wanderer',     emoji: '🧙', quote: 'Rare finds from distant lands...'        },
    { name: 'Pip',              emoji: '🐿️', quote: 'Psst... good stuff today.'               },
    { name: 'Lady Thornwood',   emoji: '👸', quote: 'Only the finest for your farm.'           },
    { name: 'The Void Trader',  emoji: '🌑', quote: '...things from beyond.'                  },
  ];

  // ── Utilities ──────────────────────────────────────────────────────────────

  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function _weighted(opts) {
    const total = opts.reduce((s, o) => s + o.w, 0);
    let r = Math.random() * total;
    for (const o of opts) { r -= o.w; if (r <= 0) return o.v; }
    return opts[opts.length - 1].v;
  }

  function _ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

  function _cheapestBagForSeed(sid) {
    let best = null;
    for (const bag of (BAGS || [])) {
      if (bag.seeds.includes(sid) && (!best || bag.cost < best.cost)) best = bag;
    }
    return best;
  }

  function _stars(n) { return '⭐'.repeat(Math.max(1, Math.min(5, n))); }

  function _rColor(n) {
    return ['', 'rgba(255,255,255,.55)', '#c8d87c', '#6dd8e8', '#c08de8', '#f0d080'][n] || '#fff';
  }

  function _fmtMs(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(t / 60), s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Deal generators ────────────────────────────────────────────────────────

  function _genSeed() {
    const seeds = BASIC_SEEDS || ['potato','carrot','wheat','sunflower'];
    const sid   = _pick(seeds);
    const seed  = SEEDS[sid];
    const qty   = _ri(3, 8);
    const disc  = 0.40 + Math.random() * 0.20;
    const orig  = seed.cost * qty;
    return {
      id: `s1_${sid}_${Date.now()}`,
      slot: 1, label: 'Discounted Seed', rarity: 1,
      emoji: seed.seedIcon, name: `${seed.name} Seeds ×${qty}`,
      desc: `Get ${qty} ${seed.name} seeds`,
      cost: Math.max(1, Math.floor(orig * (1 - disc))), origCost: orig,
      canRepurchase: false, action: 'seeds', seedId: sid, qty,
    };
  }

  function _genBag() {
    const bid = _weighted([
      {v:'fieldBag',w:50},{v:'forestBag',w:25},{v:'celestialBag',w:15},{v:'abyssalBag',w:7},{v:'divineBag',w:3},
    ]);
    const bag  = (BAGS || []).find(b => b.id === bid);
    if (!bag) return _genSeed();
    const disc = 0.25 + Math.random() * 0.15;
    const rar  = {fieldBag:1,forestBag:2,celestialBag:3,abyssalBag:4,divineBag:5}[bid] || 2;
    return {
      id: `s2_${bid}_${Date.now()}`,
      slot: 2, label: 'Discounted Bag', rarity: rar,
      emoji: bag.icon, name: bag.name,
      desc: `1 bag — opens ${bag.seedsPerOpen} seeds`,
      cost: Math.max(1, Math.floor(bag.cost * (1 - disc))), origCost: bag.cost,
      canRepurchase: false, action: 'bag', bagId: bid,
    };
  }

  function _genBlueprint() {
    const allBps  = (BLUEPRINTS || []).filter(b => b.source === 'shop');
    const locked  = allBps.filter(b => !STATE.blueprints[b.id]);
    let bp, disc;
    if (locked.length) { bp = _pick(locked);  disc = 0.30 + Math.random() * 0.20; }
    else               { bp = _pick(allBps);   disc = 0.10; }
    if (!bp) return _genSeed();
    const art = (ARTIFACTS || []).find(a => a.id === bp.artifactId);
    return {
      id: `s3_${bp.id}_${Date.now()}`,
      slot: 3, label: 'Discounted Blueprint', rarity: 2,
      emoji: art ? art.emoji : '📜', name: bp.name,
      desc: art ? art.desc : 'Unlocks a blueprint',
      cost: Math.max(1, Math.floor(bp.cost * (1 - disc))), origCost: bp.cost,
      canRepurchase: false, action: 'blueprint', blueprintId: bp.id,
    };
  }

  function _genExclusive() {
    const type = _weighted([{v:'rareSeedBundle',w:50},{v:'merchantBag',w:35},{v:'ancientBlueprint',w:15}]);

    if (type === 'rareSeedBundle') {
      const pool = [];
      for (const bag of (BAGS || [])) for (const sid of bag.seeds) if (!pool.includes(sid)) pool.push(sid);
      if (!pool.length) return _genMerchantBag();
      const sid  = _pick(pool);
      const seed = SEEDS[sid];
      const cb   = _cheapestBagForSeed(sid);
      const cost = cb ? Math.max(10, Math.floor(cb.cost * 0.60)) : Math.floor(seed.sell * 5 * 0.6);
      return {
        id: `s4_bundle_${sid}_${Date.now()}`,
        slot: 4, label: 'Exclusive Item', rarity: 3,
        emoji: seed.seedIcon, name: `${seed.name} Bundle ×5`,
        desc: `5 rare ${seed.name} seeds — exclusive!`,
        cost, origCost: null, canRepurchase: false,
        action: 'rareSeedBundle', seedId: sid, qty: 5,
      };
    }

    if (type === 'merchantBag') return _genMerchantBag();

    // ancientBlueprint
    const locked = (RECIPES || []).filter(r => !STATE.recipeUnlocks[r.id]);
    if (!locked.length) return _genMerchantBag();
    const recipe = _pick(locked);
    return {
      id: `s4_ancient_${recipe.id}_${Date.now()}`,
      slot: 4, label: 'Exclusive Item', rarity: 4,
      emoji: '📜', name: 'Ancient Blueprint',
      desc: `Unlocks: ${recipe.emoji} ${recipe.name}`,
      cost: Math.max(500, recipe.tier * 15000), origCost: null,
      canRepurchase: false, action: 'ancientBlueprint', recipeId: recipe.id,
    };
  }

  function _genMerchantBag() {
    return {
      id: `s4_mbag_${Date.now()}`,
      slot: 4, label: 'Exclusive Item', rarity: 4,
      emoji: '🎁', name: "Merchant's Bag",
      desc: '3 seeds from any pool — anything possible!',
      cost: 5000, origCost: null, canRepurchase: false,
      action: 'merchantBag', qty: 3,
    };
  }

  function _genArtifact() {
    const unowned = (ARTIFACTS || []).filter(a => !STATE.artifacts[a.id]);
    if (!unowned.length) {
      return {
        id: `s5_pp_${Date.now()}`,
        slot: 5, label: 'Artifact Deal', rarity: 5,
        emoji: '✨', name: 'Prestige Point',
        desc: 'Instantly gain 1 prestige point',
        cost: 500000, origCost: null, canRepurchase: false, action: 'prestigePoint',
      };
    }

    if (_weighted([{v:'bundle',w:70},{v:'direct',w:30}]) === 'bundle') {
      const art   = _pick(unowned);
      const ings  = Object.entries(art.ingredients);
      if (!ings.length) return _genArtifact();
      const [ingId] = _pick(ings);
      const recipe  = (RECIPES || []).find(r => r.id === ingId);
      if (!recipe) return _genArtifact();
      const qty  = 20;
      const orig = recipe.sellValue * qty;
      return {
        id: `s5_ing_${ingId}_${Date.now()}`,
        slot: 5, label: 'Artifact Deal', rarity: 4,
        emoji: recipe.emoji, name: `${recipe.name} ×${qty}`,
        desc: `Crafted ingredient for ${art.name}`,
        cost: Math.max(100, Math.floor(orig * 0.70)), origCost: orig,
        canRepurchase: false, action: 'ingredientBundle', recipeId: ingId, qty,
      };
    }

    const art      = _pick(unowned);
    const ingTotal = Object.entries(art.ingredients).reduce((s, [id, n]) => {
      const r = (RECIPES || []).find(r => r.id === id);
      return s + (r ? r.sellValue * n : 0);
    }, 0);
    return {
      id: `s5_art_${art.id}_${Date.now()}`,
      slot: 5, label: 'Artifact Deal', rarity: 5,
      emoji: art.emoji, name: art.name,
      desc: `Unlocks the ${art.name} artifact directly!`,
      cost: Math.max(1000, Math.floor(ingTotal * 3)), origCost: ingTotal || null,
      canRepurchase: false, action: 'directArtifact', artifactId: art.id,
    };
  }

  function _genMystery() {
    const cost = 10000 * Math.max(1, (STATE.prestige.count || 0) + 1);
    return {
      id: 'slot6_mystery',
      slot: 6, label: 'Mystery Box', rarity: 3,
      emoji: '🎁', name: 'Mystery Box',
      desc: 'Volatile outcome — could be amazing or terrible!',
      cost, origCost: null, canRepurchase: true, action: 'mystery',
    };
  }

  // ── Rotation ───────────────────────────────────────────────────────────────

  function _generateDeals() {
    return [_genSeed(), _genBag(), _genBlueprint(), _genExclusive(), _genArtifact(), _genMystery()];
  }

  function checkReset() {
    const tp  = STATE.tradingPost;
    const now = Date.now();
    if (!tp.lastReset || now - tp.lastReset >= RESET_MS) {
      tp.deals       = _generateDeals();
      tp.purchased   = {};
      tp.lastReset   = now;
      tp.merchantIdx = Math.floor(Math.random() * MERCHANTS.length);
      if (typeof save === 'function') save();
    }
  }

  function _msUntilReset() {
    return Math.max(0, RESET_MS - (Date.now() - (STATE.tradingPost.lastReset || 0)));
  }

  // ── Purchase execution ────────────────────────────────────────────────────

  function _execPurchase(deal) {
    switch (deal.action) {
      case 'seeds':
        if (!state.seedInventory) state.seedInventory = {};
        state.seedInventory[deal.seedId] = (state.seedInventory[deal.seedId] || 0) + deal.qty;
        log(`🌱 Purchased ${deal.qty}× ${SEEDS[deal.seedId].name} seeds from trading post`, 'growth');
        break;

      case 'bag':
        if (!state.bagInventory) state.bagInventory = {};
        state.bagInventory[deal.bagId] = (state.bagInventory[deal.bagId] || 0) + 1;
        log(`🎒 Purchased ${deal.name} from trading post`, 'growth');
        break;

      case 'blueprint':
        if (STATE.blueprints[deal.blueprintId]) break;
        STATE.blueprints[deal.blueprintId] = true;
        EventBus.emit('blueprint:unlocked', { blueprintId: deal.blueprintId });
        log(`📜 Blueprint unlocked: ${deal.name}`, 'unlock');
        break;

      case 'rareSeedBundle':
        if (!state.seedInventory) state.seedInventory = {};
        state.seedInventory[deal.seedId] = (state.seedInventory[deal.seedId] || 0) + deal.qty;
        log(`🌱 Received ${deal.qty}× ${SEEDS[deal.seedId].name} seeds from trading post`, 'growth');
        break;

      case 'merchantBag': {
        if (!state.seedInventory) state.seedInventory = {};
        const allSids = Object.keys(SEEDS || {});
        const received = [];
        for (let i = 0; i < (deal.qty || 3); i++) {
          const sid = _pick(allSids);
          state.seedInventory[sid] = (state.seedInventory[sid] || 0) + 1;
          received.push(SEEDS[sid].name);
        }
        log(`🎁 Merchant's Bag opened: ${received.join(', ')}`, 'growth');
        break;
      }

      case 'ancientBlueprint': {
        STATE.recipeUnlocks[deal.recipeId] = true;
        const r = (RECIPES || []).find(r => r.id === deal.recipeId);
        log(`📜 Ancient Blueprint: ${r ? r.emoji + ' ' + r.name : deal.recipeId} unlocked!`, 'unlock');
        if (typeof RenderCrafting !== 'undefined') RenderCrafting.renderCraftingPanel();
        break;
      }

      case 'ingredientBundle':
        if (!state.craftedInventory) state.craftedInventory = {};
        state.craftedInventory[deal.recipeId] = (state.craftedInventory[deal.recipeId] || 0) + deal.qty;
        log(`🎁 Received ${deal.qty}× ${deal.name.replace(` ×${deal.qty}`,'')} from trading post`, 'unlock');
        break;

      case 'directArtifact':
        if (STATE.artifacts[deal.artifactId]) break;
        STATE.artifacts[deal.artifactId] = true;
        recalculateModifiers();
        EventBus.emit('artifact:crafted', { artifactId: deal.artifactId });
        log(`🏺 Artifact unlocked: ${deal.name}!`, 'unlock');
        break;

      case 'prestigePoint':
        STATE.prestige.points = (STATE.prestige.points || 0) + 1;
        log('✨ Gained 1 prestige point from trading post', 'prestige');
        if (typeof RenderPanel !== 'undefined') RenderPanel.renderPrestige();
        break;

      case 'mystery':
        return _execMystery(deal);
    }
    return null;
  }

  function _execMystery(deal) {
    const cost = deal.cost;
    const outcome = _weighted([
      {v:'loss',w:40},{v:'smallWin',w:25},{v:'bigWin',w:15},
      {v:'bag',w:10},{v:'blueprint',w:5},{v:'prestige',w:3},{v:'artifact',w:2},
    ]);

    let emoji = '📦', text = '', coins = 0;

    if (outcome === 'loss') {
      coins = Math.floor(cost * 0.5);
      addCoins(coins);
      emoji = '😢'; text = `Lost half… got back ${coinHTML()}${formatNumber(coins)}`;
      log(`🎁 Mystery Box: lost half, returned ${coinHTML()}${formatNumber(coins)}`, 'earnings');
      EventBus.emit('mystery:revealed', { outcome: 'loss' });

    } else if (outcome === 'smallWin') {
      coins = Math.floor(cost * 1.5);
      addCoins(coins);
      emoji = '😊'; text = `Small win! +${coinHTML()}${formatNumber(coins)}`;
      log(`🎁 Mystery Box: small win! +${coinHTML()}${formatNumber(coins)}`, 'earnings');
      EventBus.emit('mystery:revealed', { outcome: 'win', coins });

    } else if (outcome === 'bigWin') {
      coins = Math.floor(cost * 3);
      addCoins(coins);
      emoji = '🎉'; text = `Big win! +${coinHTML()}${formatNumber(coins)}`;
      log(`🎁 Mystery Box: big win! +${coinHTML()}${formatNumber(coins)}`, 'earnings');
      EventBus.emit('mystery:revealed', { outcome: 'bigWin', coins });
      if (typeof Particles !== 'undefined') Particles.coinBurst(window.innerWidth / 2, window.innerHeight / 2);

    } else if (outcome === 'bag') {
      const bag = _pick(BAGS || []);
      if (bag) {
        if (!state.bagInventory) state.bagInventory = {};
        state.bagInventory[bag.id] = (state.bagInventory[bag.id] || 0) + 1;
        emoji = bag.icon; text = `Got a ${bag.name}!`;
        log(`🎁 Mystery Box: received a ${bag.name}!`, 'growth');
      }
      EventBus.emit('mystery:revealed', { outcome: 'bag' });

    } else if (outcome === 'blueprint') {
      const unownedBps = (BLUEPRINTS || []).filter(b => !STATE.blueprints[b.id] && b.source === 'shop');
      const bp = unownedBps.length ? _pick(unownedBps) : null;
      if (bp) {
        STATE.blueprints[bp.id] = true;
        EventBus.emit('blueprint:unlocked', { blueprintId: bp.id });
        emoji = '📜'; text = `Blueprint unlocked: ${bp.name}!`;
        log(`🎁 Mystery Box: blueprint ${bp.name} unlocked!`, 'unlock');
      } else {
        coins = cost * 2;
        addCoins(coins);
        emoji = '🪙'; text = `+${coinHTML()}${formatNumber(coins)} (no blueprints left)`;
      }
      EventBus.emit('mystery:revealed', { outcome: 'blueprint' });

    } else if (outcome === 'prestige') {
      STATE.prestige.points = (STATE.prestige.points || 0) + 1;
      emoji = '✨'; text = 'Prestige point gained!';
      log('🎁 Mystery Box: gained a prestige point!', 'prestige');
      EventBus.emit('mystery:revealed', { outcome: 'prestige' });
      if (typeof RenderPanel !== 'undefined') RenderPanel.renderPrestige();

    } else if (outcome === 'artifact') {
      const unownedArts = (ARTIFACTS || []).filter(a => !STATE.artifacts[a.id]);
      if (unownedArts.length) {
        const art = _pick(unownedArts);
        STATE.artifacts[art.id] = true;
        recalculateModifiers();
        EventBus.emit('artifact:crafted', { artifactId: art.id });
        emoji = art.emoji; text = `Artifact unlocked: ${art.name}!`;
        log(`🎁 Mystery Box: artifact ${art.name} unlocked!`, 'unlock');
      } else {
        coins = cost * 5;
        addCoins(coins);
        emoji = '🌟'; text = `+${coinHTML()}${formatNumber(coins)} (all artifacts owned)`;
      }
      EventBus.emit('mystery:revealed', { outcome: 'artifact' });
    }

    updateCoins();
    if (typeof checkAchievements === 'function') checkAchievements();
    save();
    return { outcome, emoji, text };
  }

  function purchaseDeal(dealId) {
    const tp   = STATE.tradingPost;
    const deal = (tp.deals || []).find(d => d.id === dealId);
    if (!deal) return null;
    if (!deal.canRepurchase && tp.purchased[dealId]) return null;
    if (state.coins < deal.cost) return null;

    state.coins -= deal.cost;
    if (!deal.canRepurchase) tp.purchased[dealId] = true;

    const mysteryResult = _execPurchase(deal);
    EventBus.emit('deal:purchased', { dealId, deal });

    if (typeof RenderPanel !== 'undefined') {
      RenderPanel.renderInventory();
      RenderPanel.renderSeeds();
      RenderPanel.renderBags();
    }
    save();
    return mysteryResult;
  }

  // ── Inject animation keyframes ────────────────────────────────────────────

  let _stylesInjected = false;
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      @keyframes tp-shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-7px)}30%{transform:translateX(7px)}50%{transform:translateX(-5px)}70%{transform:translateX(5px)}90%{transform:translateX(-2px)}}
      @keyframes tp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    `;
    document.head.appendChild(s);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  let _cdTimer = null;

  function _buildMerchant(parent) {
    const tp = STATE.tradingPost;
    const m  = MERCHANTS[tp.merchantIdx % MERCHANTS.length] || MERCHANTS[0];
    const sec = mk('div');
    sec.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 18px 12px;background:rgba(0,0,0,.18);border-bottom:1px solid rgba(0,0,0,.3);flex-shrink:0';

    const em = mk('div'); em.style.cssText = 'font-size:48px;line-height:1;flex-shrink:0';
    em.textContent = m.emoji;

    const info = mk('div'); info.style.cssText = 'flex:1;min-width:0';
    const nm = mk('div'); nm.style.cssText = 'font-weight:700;font-size:15px;color:#f0d080;margin-bottom:2px';
    nm.textContent = m.name;
    const qt = mk('div'); qt.style.cssText = 'font-size:12px;color:rgba(255,255,255,.6);font-style:italic';
    qt.textContent = `"${m.quote}"`;
    const cd = mk('div'); cd.id = 'tp-cd'; cd.style.cssText = 'font-size:11px;color:rgba(255,255,255,.38);margin-top:5px';
    cd.textContent = `Next deals in ${_fmtMs(_msUntilReset())}`;

    info.appendChild(nm); info.appendChild(qt); info.appendChild(cd);
    sec.appendChild(em); sec.appendChild(info);
    parent.appendChild(sec);
  }

  function _buildCard(deal) {
    const tp       = STATE.tradingPost;
    const sold     = !deal.canRepurchase && !!tp.purchased[deal.id];
    const afford   = state.coins >= deal.cost;
    const mystery  = deal.action === 'mystery';

    const card = mk('div');
    card.style.cssText = [
      'display:flex;flex-direction:column;gap:5px;padding:11px 12px',
      'border-radius:8px;position:relative;overflow:hidden',
      mystery
        ? 'background:linear-gradient(135deg,rgba(100,50,160,.35),rgba(40,70,180,.35),rgba(100,50,160,.35));border:1px solid rgba(160,100,255,.4)'
        : `background:${sold ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.06)'};border:1px solid ${sold ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.13)'}`,
    ].join(';');

    if (mystery) {
      const sh = mk('div');
      sh.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.07) 50%,transparent 100%);background-size:200% 100%;animation:tp-shimmer 2.2s linear infinite';
      card.appendChild(sh);
    }

    // Slot label
    const lbl = mk('div'); lbl.style.cssText = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.32)';
    lbl.textContent = deal.label;
    card.appendChild(lbl);

    // Emoji + name
    const nr = mk('div'); nr.style.cssText = 'display:flex;align-items:center;gap:7px';
    const em = mk('span'); em.style.cssText = `font-size:1.7rem;line-height:1;flex-shrink:0${sold?';opacity:.3':''}`;
    em.textContent = deal.emoji;
    const nm = mk('div'); nm.style.cssText = `font-size:13px;font-weight:700;color:${sold?'rgba(255,255,255,.3)':'#fff'};line-height:1.2`;
    nm.textContent = deal.name;
    nr.appendChild(em); nr.appendChild(nm);
    card.appendChild(nr);

    // Description
    const dc = mk('div'); dc.style.cssText = 'font-size:10px;color:rgba(255,255,255,.48);line-height:1.35;flex:1';
    dc.textContent = deal.desc;
    card.appendChild(dc);

    // Price row
    const pr = mk('div'); pr.style.cssText = 'display:flex;align-items:baseline;gap:6px;flex-wrap:wrap';
    if (deal.origCost !== null && deal.origCost !== undefined && deal.origCost > deal.cost) {
      const oc = mk('span'); oc.style.cssText = 'font-size:10px;color:rgba(255,255,255,.28);text-decoration:line-through';
      oc.innerHTML = `${coinHTML()}${formatNumber(deal.origCost)}`;
      pr.appendChild(oc);
    }
    const pc = mk('span'); pc.style.cssText = `font-size:13px;font-weight:700;color:${sold?'rgba(255,255,255,.25)':afford?'#8de88d':'#ff9090'}`;
    pc.innerHTML = `${coinHTML()}${formatNumber(deal.cost)}`;
    pr.appendChild(pc);
    card.appendChild(pr);

    // Bottom row: rarity + buy button
    const br = mk('div'); br.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:1px';
    const ra = mk('span'); ra.style.cssText = `font-size:9px;color:${_rColor(deal.rarity)}`;
    ra.textContent = _stars(deal.rarity);
    br.appendChild(ra);

    const btn = mk('button', 'ug-btn');
    if (sold) {
      btn.textContent = 'Sold'; btn.disabled = true;
      btn.style.cssText = 'font-size:11px;padding:4px 10px;opacity:.35;cursor:default';
    } else {
      btn.textContent = 'Buy'; btn.disabled = !afford;
      btn.style.cssText = `font-size:11px;padding:4px 10px;${afford?'background:#5a8a3c':''}`;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (state.coins < deal.cost) return;
        const result = purchaseDeal(deal.id);
        if (deal.action === 'mystery' && result) {
          _showReveal(card, result);
        } else {
          // Re-render body to reflect purchase and updated coin affordability
          const body = document.getElementById('tp-modal-body');
          if (body) _renderBody(body);
        }
        updateCoins();
      });
    }

    br.appendChild(btn);
    card.appendChild(br);
    return card;
  }

  function _showReveal(card, result) {
    card.style.animation = 'tp-shake 0.5s ease';
    setTimeout(() => {
      card.style.animation = '';
      const ov = mk('div');
      ov.style.cssText = 'position:absolute;inset:0;border-radius:8px;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:10px;text-align:center;z-index:5';
      const em = mk('div'); em.style.cssText = 'font-size:2.2rem;line-height:1';
      em.textContent = result.emoji;
      const tx = mk('div'); tx.style.cssText = 'font-size:11px;font-weight:600;color:#fff;line-height:1.4';
      tx.innerHTML = result.text;
      const ok = mk('button', 'ug-btn');
      ok.textContent = 'OK'; ok.style.cssText = 'font-size:11px;padding:3px 16px;margin-top:3px;background:#5a8a3c';
      ok.addEventListener('click', e => {
        e.stopPropagation(); ov.remove();
        const body = document.getElementById('tp-modal-body');
        if (body) _renderBody(body);
      });
      ov.appendChild(em); ov.appendChild(tx); ov.appendChild(ok);
      card.appendChild(ov);
    }, 500);
  }

  function _renderBody(body) {
    if (!body) return;
    body.innerHTML = '';
    _buildMerchant(body);

    const grid = mk('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px;overflow-y:auto;flex:1;min-height:0';
    body.appendChild(grid);

    for (const deal of (STATE.tradingPost.deals || [])) {
      grid.appendChild(_buildCard(deal));
    }
  }

  function _startCd() {
    if (_cdTimer) clearInterval(_cdTimer);
    _cdTimer = setInterval(() => {
      const el = document.getElementById('tp-cd');
      if (el) el.textContent = `Next deals in ${_fmtMs(_msUntilReset())}`;
      if (_msUntilReset() <= 0) {
        clearInterval(_cdTimer); _cdTimer = null;
        checkReset();
        const body = document.getElementById('tp-modal-body');
        if (body) _renderBody(body);
      }
    }, 1000);
  }

  function _stopCd() { if (_cdTimer) { clearInterval(_cdTimer); _cdTimer = null; } }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    _injectStyles();
    checkReset();
  }

  function open() {
    checkReset();
    const backdrop = document.getElementById('tp-backdrop');
    const modal    = document.getElementById('tp-modal');
    const body     = document.getElementById('tp-modal-body');
    if (!modal) return;
    backdrop.style.display = 'block';
    modal.style.display    = 'flex';
    _renderBody(body);
    _startCd();
    EventBus.emit('tradingpost:open');
    EventBus.emit('modal:open');
  }

  function close() {
    const backdrop = document.getElementById('tp-backdrop');
    const modal    = document.getElementById('tp-modal');
    if (!modal) return;
    backdrop.style.display = 'none';
    modal.style.display    = 'none';
    _stopCd();
    EventBus.emit('modal:close');
  }

  return { init, open, close, checkReset, purchaseDeal };
})();
