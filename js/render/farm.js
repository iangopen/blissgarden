// ══════════════════════════════
// LOOSE CROPS
// ══════════════════════════════
function dropLoose(seed, x, y, bonus = 1.0, drowned = false, fungal = false) {
  const id = nextId++;
  state.loose.push({ seed, id, x, y, bonus, drowned, fungal });
  sfx.drop();
  renderLoose();
  const el = document.querySelector(`.loose-crop[data-id="${id}"]`);
  if (el) el.classList.add('loose-land');
  save();
}

function renderLoose() {
  document.querySelectorAll('.loose-crop').forEach(el => el.remove());
  state.loose.forEach(item => {
    const el = mk('div','loose-crop');
    el.appendChild(makeSpriteDiv(item.seed, 'grown', 48));
    el.style.left = item.x + 'px'; el.style.top = item.y + 'px';
    el.dataset.id = item.id;
    DragSystem.touch(el, e => {
      e.stopPropagation();
      const i = state.loose.findIndex(g => g.id === item.id);
      if (i === -1) return;
      const { seed: s, bonus: b = 1.0, drowned: dr = false, fungal: fg = false } = state.loose[i];
      state.loose.splice(i, 1); renderLoose(); save();
      startDrag(s, 'loose', b, dr, fg); moveGhost(e.clientX, e.clientY);
    });
    document.body.appendChild(el);
  });
}

// ══════════════════════════════
// VISUAL HELPERS
// ══════════════════════════════
function spawnHarvestPop(x, y, seed) {
  const el = mk('div','harvest-pop');
  el.style.left = x + 'px'; el.style.top = y + 'px';
  el.appendChild(makeSpriteDiv(seed, 'grown', 56));
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 200);
}

// ══════════════════════════════
// TIMER DISPLAY
// ══════════════════════════════
function updateTimers() {
  const nodes = RenderFarm.tileNodes;
  for (let i = 0; i < nodes.length; i++) {
    const td = state.tiles[i];
    if (!td) continue;
    const wasReady = prevReadyState[i] || false;
    const nowReady = isReady(td, i);
    if (!wasReady && nowReady) {
      prevReadyState[i] = true;
      RenderFarm.renderTile(i);
    } else if (!nowReady) {
      const el = nodes[i]; if (!el) continue;
      const timerEl = el.querySelector('.t-timer');
      if (timerEl) timerEl.textContent = fmt(remSec(td, i));
      prevReadyState[i] = false;
    }
  }
  document.querySelectorAll('.t-mound-timer').forEach(timerEl => {
    const mIdx = parseInt(timerEl.dataset.moundIdx);
    if (state.mounds && state.mounds[mIdx] !== undefined)
      timerEl.textContent = fmt(Math.max(0, (state.mounds[mIdx] - Date.now()) / 1000));
  });
  document.querySelectorAll('.t-claimed-timer').forEach(timerEl => {
    const cIdx = parseInt(timerEl.dataset.claimedIdx);
    const cl = state.claimedTiles && state.claimedTiles[cIdx];
    if (cl) {
      const deadline = cl.releasesAt !== undefined ? cl.releasesAt : cl.deadlineAt;
      timerEl.textContent = fmt(Math.max(0, (deadline - Date.now()) / 1000));
    }
  });
  document.querySelectorAll('.t-rot-timer').forEach(timerEl => {
    const rIdx = parseInt(timerEl.dataset.rotTimerIdx);
    const rot  = state.rotTiles && state.rotTiles[rIdx];
    if (rot && rot.infectedAt !== undefined)
      timerEl.textContent = fmt(Math.max(0, 90 - (Date.now() - rot.infectedAt) / 1000));
  });
  document.querySelectorAll('.t-rotdead-timer').forEach(timerEl => {
    const rIdx = parseInt(timerEl.dataset.rotDeadIdx);
    const rot  = state.rotTiles && state.rotTiles[rIdx];
    if (rot && rot.deadAt !== undefined)
      timerEl.textContent = fmt(Math.max(0, (rot.deadAt - Date.now()) / 1000));
  });
}

window.RenderFarm = (() => {
  const tileNodes = []; // indexed by tile idx; rebuilt only on buildGrid()

  function renderTile(idx) {
    const el = tileNodes[idx];
    if (!el) return;

    while (el.firstChild) el.removeChild(el.firstChild);
    el.className = 'tile';

    // ── Dead rot tile ──
    if (state.rotTiles && state.rotTiles[idx] && state.rotTiles[idx].deadAt !== undefined) {
      el.classList.add('tile-rotdead');
      const rdIcon = mk('div','t-rotdead-icon'); rdIcon.textContent = '💀'; el.appendChild(rdIcon);
      const rem = Math.max(0, (state.rotTiles[idx].deadAt - Date.now()) / 1000);
      const rdTimer = mk('div','t-rotdead-timer');
      rdTimer.dataset.rotDeadIdx = idx; rdTimer.textContent = fmt(rem); el.appendChild(rdTimer);
      return;
    }

    // ── Void rift tile ──
    if (state.voidRifts && state.voidRifts[idx] !== undefined) {
      el.classList.add('tile-rift');
      const rIcon = mk('div','t-rift-icon'); rIcon.textContent = '🌀'; el.appendChild(rIcon);
      const rCount = mk('div','t-rift-count');
      rCount.textContent = `${state.voidRifts[idx].clicks}/${VOID_RIFT_CLICKS}`; el.appendChild(rCount);
      return;
    }

    // ── Mound tile ──
    if (state.mounds && state.mounds[idx] !== undefined) {
      el.classList.add('tile-mound');
      const mIcon = mk('div','t-mound-icon'); mIcon.textContent = '🐭'; el.appendChild(mIcon);
      const rem = Math.max(0, (state.mounds[idx] - Date.now()) / 1000);
      const mTimer = mk('div','t-mound-timer');
      mTimer.dataset.moundIdx = idx; mTimer.textContent = fmt(rem); el.appendChild(mTimer);
      return;
    }

    // ── Claimed tile ──
    if (state.claimedTiles && state.claimedTiles[idx]) {
      const cl = state.claimedTiles[idx];
      if (cl.releasesAt !== undefined) {
        el.classList.add('tile-claimed-locked');
      } else {
        el.classList.add('tile-claimed');
      }
      const cIcon = mk('div','t-claimed-icon'); cIcon.textContent = '🏗️'; el.appendChild(cIcon);
      const deadline = cl.releasesAt !== undefined ? cl.releasesAt : cl.deadlineAt;
      const rem = Math.max(0, (deadline - Date.now()) / 1000);
      const cTimer = mk('div','t-claimed-timer');
      cTimer.dataset.claimedIdx = idx; cTimer.textContent = fmt(rem); el.appendChild(cTimer);
      return;
    }

    // ── Thorned weed tile ──
    if (state.thornedWeeds && state.thornedWeeds[idx] !== undefined) {
      el.classList.add('tile-thorned');
      const twIcon  = mk('div','t-thorned-icon'); twIcon.textContent = '🌵'; el.appendChild(twIcon);
      const twCount = mk('div','t-thorned-count');
      twCount.textContent = `${state.thornedWeeds[idx].clicks}/${THORNED_WEED_CLICKS}`; el.appendChild(twCount);
      return;
    }

    // ── Weed tile ──
    if (state.weeds && state.weeds[idx] !== undefined) {
      el.classList.add('tile-weed');
      const wIcon  = mk('div','t-weed-icon'); wIcon.textContent = '🌿'; el.appendChild(wIcon);
      const wCount = mk('div','t-weed-count');
      wCount.textContent = `${state.weeds[idx].clicks}/${WEED_CLICKS}`; el.appendChild(wCount);
      return;
    }

    // ── Normal tile ──
    const td            = state.tiles[idx];
    const isCaged       = state.cages && state.cages.includes(idx);
    const isWatered     = !!(state.tilesWatered && state.tilesWatered[idx]);
    const isFertilized  = !!(state.fertilizedTiles && state.fertilizedTiles[idx]);
    const isUFertilized = !!(state.uncommonFertilizedTiles && state.uncommonFertilizedTiles[idx]);
    const isRotInfected = !!(state.rotTiles && state.rotTiles[idx] &&
                             state.rotTiles[idx].infectedAt !== undefined &&
                             state.rotTiles[idx].deadAt === undefined);
    const isFungal      = !!(state.fungalTiles && state.fungalTiles[idx] !== undefined);
    const isDiseased    = !!(state.diseasedTiles && state.diseasedTiles[idx]);

    if (isRotInfected) el.classList.add('tile-rot');
    if (isCaged)       el.classList.add('tile-caged');
    if (isUFertilized) el.classList.add('tile-ufertilized');
    else if (isFertilized) el.classList.add('tile-fertilized');
    if (isFungal)      el.classList.add('tile-fungal');
    if (isDiseased)    el.classList.add('tile-diseased');

    if (!td) {
      if (isCaged)           { const c = mk('div','t-cage-icon');  c.textContent='🔒'; el.appendChild(c); }
      if (isUFertilized)     { const f = mk('div','t-ufert-icon'); f.textContent='⚗️'; el.appendChild(f); }
      else if (isFertilized) { const f = mk('div','t-fert-icon');  f.textContent='🌿'; el.appendChild(f); }
      if (isFungal)          { const fi = mk('div','t-fungal-icon'); fi.textContent='🍄'; el.appendChild(fi); }
      if (isDiseased)        { const di = mk('div','t-diseased-icon'); di.textContent='☣️'; el.appendChild(di); }
      return;
    }

    const rdy = isReady(td, idx);
    if (rdy) {
      el.classList.add('ready');
    } else {
      if (isWatered)  el.classList.add('tile-watered');
      if (td.drowned) el.classList.add('tile-drowned');
    }

    const icon = mk('div','t-icon');
    icon.appendChild(makeSpriteDiv(td.seed, rdy ? 'grown' : 'sprout', 56));
    el.appendChild(icon);

    if (!rdy) {
      const timer = mk('div','t-timer'); timer.textContent = fmt(remSec(td, idx)); el.appendChild(timer);
      if (isWatered && !td.drowned) { const w = mk('div','t-water-icon'); w.textContent='💧'; el.appendChild(w); }
      if (td.drowned) { const d = mk('div','t-drown-icon'); d.textContent='💀'; el.appendChild(d); }

      if (selectedTile === idx) {
        const xb = mk('div','t-xbtn'); xb.textContent = '✕';
        xb.addEventListener('mousedown', e => {
          e.stopPropagation();
          state.tiles[idx] = null;
          if (state.tilesWatered) delete state.tilesWatered[idx];
          if (state.rotTiles)     delete state.rotTiles[idx];
          deselect(); renderTile(idx); save();
        });
        el.appendChild(xb);

        if (isCaged) {
          const cb = mk('div','t-cage-rm'); cb.textContent = '🔒'; cb.title = 'Remove cage';
          cb.addEventListener('mousedown', e => {
            e.stopPropagation();
            const ci = state.cages.indexOf(idx);
            if (ci !== -1) { state.cages.splice(ci, 1); state.cageCount = (state.cageCount||0) + 1; }
            renderTile(idx); RenderPanel.renderItems(); log('🔒 Cage removed, returned to inventory', 'system'); save();
          });
          el.appendChild(cb);
        }
      }
    }

    if (isUFertilized)     { const f = mk('div','t-ufert-icon'); f.textContent='⚗️'; el.appendChild(f); }
    else if (isFertilized) { const f = mk('div','t-fert-icon');  f.textContent='🌿'; el.appendChild(f); }
    if (isCaged) { const c = mk('div','t-cage-icon'); c.textContent='🔒'; el.appendChild(c); }
    if (isRotInfected) {
      const ri = mk('div','t-rot-icon'); ri.textContent = '🍂'; el.appendChild(ri);
      if (!rdy) {
        const rem = Math.max(0, 90 - (Date.now() - state.rotTiles[idx].infectedAt) / 1000);
        const rt  = mk('div','t-rot-timer');
        rt.dataset.rotTimerIdx = idx; rt.textContent = fmt(rem); el.appendChild(rt);
      }
    }
    if (isFungal) { const fi = mk('div','t-fungal-icon'); fi.textContent='🍄'; el.appendChild(fi); }
    if (state.hiredHandAssignments?.[idx]) {
      const hh = mk('div','t-diseased-icon'); hh.textContent='👨‍🌾'; hh.title='Hired hand assigned'; el.appendChild(hh);
    }

    if (td && typeof Tooltip !== 'undefined') {
      el.dataset.tooltip = Tooltip.tileTip(idx);
    } else {
      delete el.dataset.tooltip;
    }
  }

  function renderGrid() {
    for (let i = 0; i < tileNodes.length; i++) renderTile(i);
  }

  // Only called on init and expansion upgrades — innerHTML on grid container is allowed here.
  function buildGrid() {
    const grid = document.getElementById('farm-grid');
    const { cols, rows } = getGridDims();
    grid.style.gridTemplateColumns = `repeat(${cols}, 100px)`;
    grid.style.gridTemplateRows    = `repeat(${rows}, 100px)`;
    while (state.tiles.length < tileCount()) state.tiles.push(null);
    grid.innerHTML = '';
    tileNodes.length = 0;
    for (let i = 0; i < tileCount(); i++) {
      const el = document.createElement('div');
      el.className = 'tile'; el.dataset.idx = i;
      DragSystem.touch(el, onTileDown);
      grid.appendChild(el);
      tileNodes.push(el);
    }
  }

  function probeSprites() {
    const img = new Image();
    img.onerror = () => console.error('sprites.png not found at ./sprites.png');
    img.src = './sprites.png';
  }

  return { renderTile, renderGrid, buildGrid, probeSprites, tileNodes };
})();
