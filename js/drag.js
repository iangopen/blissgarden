// ══════════════════════════════
// DRAG ENTRY-POINTS
// ══════════════════════════════
Object.defineProperty(window, 'drag', {
  get() { return STATE.session.dragItem; },
  set(v) { STATE.session.dragItem = v; },
});

function startDrag(seed, source, bonus = 1.0, drowned = false, fungal = false) {
  deselect();
  DragSystem.start({ seed, source, bonus, drowned, fungal },
    makeSpriteDiv(seed, source === 'seedInventory' ? 'seed' : 'grown', 64));
}
function startCraftedDrag(recipeId, emoji) {
  deselect();
  const sp = document.createElement('span');
  sp.style.cssText = 'font-size:38px;line-height:1;display:block;pointer-events:none';
  sp.textContent = emoji;
  DragSystem.start({ seed: recipeId, source: 'craftedInventory', bonus: 1, drowned: false, fungal: false, crafted: true }, sp);
}

function startItemDrag(itemType) {
  deselect();
  const sp = document.createElement('span');
  sp.style.cssText = 'font-size:38px;line-height:1;display:block;pointer-events:none';
  sp.textContent = ITEM_ICONS[itemType] || '❓';
  DragSystem.start({ itemType, source: 'inventory-item', seed: null, bonus: 1, drowned: false }, sp);
}
function endDrag() { DragSystem.end(); }
function moveGhost(x, y) {
  const g = document.getElementById('ghost');
  if (g) { g.style.left = x + 'px'; g.style.top = y + 'px'; }
}

// DragSystem owns the ghost element, active drag state (STATE.session.dragItem),
// and all document-level drag events. Game code calls DragSystem.start() to
// begin a drag and DragSystem.register() to declare drop handlers.
window.DragSystem = (() => {
  // handlers[sourceType][targetType] = fn(dragItem, targetEl, event)
  const handlers = {};
  let _lastTX = 0, _lastTY = 0;

  function ghost() { return document.getElementById('ghost'); }
  function tileEls() { return RenderFarm.tileNodes; }
  function hit(x, y, el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function clearHighlights() {
    tileEls().forEach(t => t.classList.remove('drop-hi'));
    const panel   = document.getElementById('panel');
    const sellBox = document.getElementById('sell-box');
    if (panel)   panel.classList.remove('drop-hi');
    if (sellBox) sellBox.classList.remove('drop-hi');
  }

  // ── Shared move handler (used by both mousemove and touchmove) ─────────────
  function onMove(clientX, clientY) {
    const item = STATE.session.dragItem;
    if (!item) return;
    const g = ghost();
    g.style.left = clientX + 'px';
    g.style.top  = clientY + 'px';
    clearHighlights();

    const panel   = document.getElementById('panel');
    const sellBox = document.getElementById('sell-box');

    if (item.source === 'shop' || item.source === 'seedInventory') {
      tileEls().forEach(t => {
        const i = parseInt(t.dataset.idx);
        if (!state.tiles[i]
          && !(state.weeds        && state.weeds[i]        !== undefined)
          && !(state.thornedWeeds && state.thornedWeeds[i] !== undefined)
          && !(state.mounds       && state.mounds[i]       !== undefined)
          && !(state.rotTiles     && state.rotTiles[i]     && state.rotTiles[i].deadAt !== undefined)
          && !(state.claimedTiles && state.claimedTiles[i])
          && !(state.voidRifts    && state.voidRifts[i]    !== undefined)
          && hit(clientX, clientY, t))
          t.classList.add('drop-hi');
      });

    } else if (item.source === 'inventory-item') {
      tileEls().forEach(t => {
        if (!hit(clientX, clientY, t)) return;
        const i = parseInt(t.dataset.idx);
        const blocked = (state.weeds && state.weeds[i] !== undefined)
          || (state.thornedWeeds && state.thornedWeeds[i] !== undefined)
          || (state.mounds       && state.mounds[i]       !== undefined)
          || (state.rotTiles     && state.rotTiles[i]     && state.rotTiles[i].deadAt !== undefined);
        if (blocked) return;
        const td = state.tiles[i];
        const it = item.itemType;
        let valid = false;
        if (it === 'water')        valid = !!(td && !isReady(td, i));
        if (it === 'cage')         valid = !state.cages.includes(i);
        if (it === 'fertilizer')   valid = !(state.fertilizedTiles?.[i]) && !(state.uncommonFertilizedTiles?.[i]);
        if (it === 'uncommonFert') valid = !(state.uncommonFertilizedTiles?.[i]);
        if (it === 'hiredHand')    valid = !blocked && !(state.hiredHandAssignments?.[i]);
        if (valid) t.classList.add('drop-hi');
      });

    } else {
      if (hit(clientX, clientY, sellBox))                          sellBox.classList.add('drop-hi');
      else if (hit(clientX, clientY, panel))                       panel.classList.add('drop-hi');
    }
  }

  // ── Shared drop handler (used by both mouseup and touchend) ────────────────
  function handleDrop(clientX, clientY) {
    const item = STATE.session.dragItem;
    if (!item) return;

    const panel   = document.getElementById('panel');
    const sellBox = document.getElementById('sell-box');
    const { seed, source, bonus, drowned } = item;

    let handled = false;
    if (handlers[source]) {
      tileEls().forEach(t => {
        if (handled) return;
        if (hit(clientX, clientY, t) && handlers[source].tile) {
          handlers[source].tile(item, t, { clientX, clientY });
          handled = true;
        }
      });
      if (!handled && hit(clientX, clientY, sellBox) && handlers[source]['sell-box']) {
        handlers[source]['sell-box'](item, sellBox, { clientX, clientY });
        handled = true;
      }
      if (!handled && hit(clientX, clientY, panel) && handlers[source].panel) {
        handlers[source].panel(item, panel, { clientX, clientY });
        handled = true;
      }
      if (!handled && handlers[source].body) {
        handlers[source].body(item, null, { clientX, clientY });
        handled = true;
      }
    }

    if (!handled) {
      if (source === 'inventory-item') {
        const it = item.itemType;
        if (it === 'water')          state.canCharges++;
        else if (it === 'cage')      state.cageCount++;
        else if (it === 'hiredHand') state.hiredHandCount = (state.hiredHandCount || 0) + 1;
        RenderPanel.renderInventory(); RenderPanel.renderItems();

      } else if (source === 'seedInventory') {
        let planted = false;
        tileEls().forEach(t => {
          if (planted) return;
          const i = parseInt(t.dataset.idx);
          if (!state.tiles[i]
            && !(state.weeds        && state.weeds[i]        !== undefined)
            && !(state.thornedWeeds && state.thornedWeeds[i] !== undefined)
            && !(state.mounds       && state.mounds[i]       !== undefined)
            && !(state.rotTiles     && state.rotTiles[i]     && state.rotTiles[i].deadAt !== undefined)
            && !(state.claimedTiles && state.claimedTiles[i])
            && !(state.voidRifts   && state.voidRifts[i]   !== undefined)
            && hit(clientX, clientY, t)) {
            state.tiles[i] = { seed, plantedAt: Date.now(), burnedSeconds: 0 };
            state.stats.totalPlanted = (state.stats.totalPlanted || 0) + 1;
            if (!state.stats.seedTypesPlanted) state.stats.seedTypesPlanted = {};
            state.stats.seedTypesPlanted[seed] = true;
            if (typeof checkAchievements === 'function') checkAchievements();
            Audio.playPlant();
            const tr = t.getBoundingClientRect();
            Particles.dirtPuff(tr.left + tr.width / 2, tr.top + tr.height / 2);
            if (state.diseasedTiles && state.diseasedTiles[i]) {
              if (!state.rotTiles) state.rotTiles = {};
              state.rotTiles[i] = { infectedAt: Date.now() };
              delete state.diseasedTiles[i];
              log(`🐀 Diseased soil infected the ${SEEDS[seed].name}!`, 'event');
            }
            RenderFarm.renderTile(i); save();
            log(`🌱 Planted ${SEEDS[seed].name}`, 'growth');
            EventBus.emit('crop:planted', { idx: i, seed });
            planted = true;
          }
        });
        if (!planted) {
          if (!state.seedInventory) state.seedInventory = {};
          state.seedInventory[seed] = (state.seedInventory[seed] || 0) + 1;
          RenderPanel.renderInventory(); save();
        }

      } else {
        if (hit(clientX, clientY, sellBox)) {
          addToSellQueue(seed, bonus || 1.0, drowned || false, item.fungal || false);
        } else if (hit(clientX, clientY, panel)) {
          addInventory(seed); RenderPanel.renderInventory(); save();
        } else {
          dropLoose(seed, clientX, clientY, bonus || 1.0, drowned || false, item.fungal || false);
        }
      }
    }
  }

  // ── Document-level mouse events ────────────────────────────────────────────
  document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));

  document.addEventListener('mouseup', e => {
    if (!STATE.session.dragItem) return;
    handleDrop(e.clientX, e.clientY);
    DragSystem.end();
  });

  // ── Document-level touch events (registered dynamically in start/end) ──────
  function onTouchMove(e) {
    if (!STATE.session.dragItem) return;
    e.preventDefault();
    const t = e.touches[0];
    _lastTX = t.clientX;
    _lastTY = t.clientY;
    onMove(t.clientX, t.clientY);
  }

  function onTouchEnd(e) {
    if (!STATE.session.dragItem) return;
    e.preventDefault();
    const t = e.changedTouches[0];
    const cx = t ? t.clientX : _lastTX;
    const cy = t ? t.clientY : _lastTY;
    handleDrop(cx, cy);
    DragSystem.end();
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    start(dragItem, ghostContent) {
      STATE.session.dragItem = dragItem;
      const g = ghost();
      g.innerHTML = '';
      if (ghostContent) g.appendChild(ghostContent);
      g.style.display = 'block';
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend',  onTouchEnd,  { passive: false });
    },

    end() {
      STATE.session.dragItem = null;
      ghost().style.display = 'none';
      clearHighlights();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend',  onTouchEnd);
    },

    register(sourceType, targetType, handler) {
      if (!handlers[sourceType]) handlers[sourceType] = {};
      handlers[sourceType][targetType] = handler;
    },

    // Registers both mousedown and touchstart on el, normalising to {clientX, clientY, currentTarget, stopPropagation}
    touch(el, fn) {
      el.addEventListener('mousedown', fn);
      el.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        fn.call(e.currentTarget, {
          clientX:        t.clientX,
          clientY:        t.clientY,
          currentTarget:  e.currentTarget,
          target:         e.target,
          stopPropagation() { e.stopPropagation(); },
          preventDefault() {},
        });
      }, { passive: false });
    },
  };
})();

// ── Inventory-item → farm tile handler ──────────────────────────────────────
DragSystem.register('inventory-item', 'tile', (item, tileEl) => {
  const it = item.itemType;
  const i  = parseInt(tileEl.dataset.idx);
  const td = state.tiles[i];

  const blocked = (state.weeds && state.weeds[i] !== undefined)
    || (state.thornedWeeds && state.thornedWeeds[i] !== undefined)
    || (state.mounds       && state.mounds[i]       !== undefined)
    || (state.rotTiles     && state.rotTiles[i]     && state.rotTiles[i].deadAt !== undefined)
    || (state.claimedTiles && state.claimedTiles[i])
    || (state.voidRifts    && state.voidRifts[i]    !== undefined);

  if (it === 'water' && td && !isReady(td, i) && !blocked) {
    applyWater(i);
    if (state.upgrades.cosmicWell) {
      let extra = 0;
      for (const ai of getAdjacentIdxs(i)) {
        if (extra >= 2) break;
        const atd = state.tiles[ai];
        if (!atd || isReady(atd, ai) || state.tilesWatered?.[ai]) continue;
        atd.sellBonus = 1.25;
        if (!state.tilesWatered) state.tilesWatered = {};
        state.tilesWatered[ai] = true;
        RenderFarm.renderTile(ai);
        log(`💫 Cosmic well watered ${SEEDS[atd.seed].name}`, 'growth');
        extra++;
      }
      if (extra > 0) save();
    }

  } else if (it === 'hiredHand' && !blocked && !(state.hiredHandAssignments?.[i])) {
    if (!state.hiredHandAssignments) state.hiredHandAssignments = {};
    state.hiredHandAssignments[i] = true;
    state.hiredHandCount = Math.max(0, (state.hiredHandCount || 0) - 1);
    log(`👨‍🌾 Hired hand assigned to plot ${i + 1}`, 'system');
    RenderFarm.renderTile(i); RenderPanel.renderInventory(); save();

  } else if (it === 'cage' && !state.cages.includes(i) && !blocked) {
    state.cages.push(i);
    log('🔒 Cage placed on tile', 'system');
    EventBus.emit('cage:placed');
    RenderFarm.renderTile(i); RenderPanel.renderInventory(); RenderPanel.renderItems(); save();

  } else if (it === 'fertilizer'
    && !(state.fertilizedTiles?.[i])
    && !(state.uncommonFertilizedTiles?.[i])
    && !blocked
    && (state.fertCharges || 0) >= 1) {
    if (!state.fertilizedTiles) state.fertilizedTiles = {};
    state.fertilizedTiles[i] = true;
    state.fertCharges--;
    log('🌿 Plot fertilized — crops grow 25% faster here', 'growth');
    EventBus.emit('tile:fertilized');
    RenderFarm.renderTile(i); RenderPanel.renderInventory(); RenderPanel.renderItems(); save();

  } else if (it === 'uncommonFert'
    && !(state.uncommonFertilizedTiles?.[i])
    && !blocked
    && (state.uncommonFertCharges || 0) >= 1) {
    if (!state.uncommonFertilizedTiles) state.uncommonFertilizedTiles = {};
    state.uncommonFertilizedTiles[i] = true;
    state.uncommonFertCharges--;
    log('⚗️ Plot uncommon fertilized — crops grow 40% faster here', 'growth');
    EventBus.emit('tile:fertilized');
    RenderFarm.renderTile(i); RenderPanel.renderInventory(); RenderPanel.renderItems(); save();

  } else {
    if (it === 'water')          state.canCharges++;
    else if (it === 'cage')      state.cageCount++;
    else if (it === 'hiredHand') state.hiredHandCount++;
    RenderPanel.renderInventory(); RenderPanel.renderItems();
  }
});

// ── Crafted item → sell box ──────────────────────────────────────────────────
DragSystem.register('craftedInventory', 'sell-box', (item) => {
  const wasEmpty = state.sellQueue.length === 0;
  state.sellQueue.push({ seed: item.seed, bonus: 1, drowned: false, fungal: false, crafted: true });
  if (wasEmpty) STATE.session.sellElapsed = 0;
  const sb = document.getElementById('sell-box');
  if (sb) { sb.classList.remove('sell-bounce'); void sb.offsetWidth; sb.classList.add('sell-bounce'); }
  RenderSellbox.renderQueue(); save();
});

// ── Crafted item → panel (return to inventory) ───────────────────────────────
DragSystem.register('craftedInventory', 'panel', (item) => {
  if (!state.craftedInventory) state.craftedInventory = {};
  state.craftedInventory[item.seed] = (state.craftedInventory[item.seed] || 0) + 1;
  RenderPanel.renderInventory(); save();
});

// ── Crafted item → anywhere else (return to inventory) ───────────────────────
DragSystem.register('craftedInventory', 'body', (item) => {
  if (!state.craftedInventory) state.craftedInventory = {};
  state.craftedInventory[item.seed] = (state.craftedInventory[item.seed] || 0) + 1;
  RenderPanel.renderInventory(); save();
});
