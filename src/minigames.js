import { SEEDS } from './data.js';
import { STATE, coinHTML, formatNumber, mk, state } from './state.js';
import { EventBus } from './core/bus.js';

// ══════════════════════════════
// MINIGAMES
// ══════════════════════════════

// ── Reward formula ────────────────────────────────────────────────────────
export function calcMinigameReward(gameId, difficulty, won) {
  if (!won) return 0;
  const topSeedValue = Object.keys(state.seedInventory || {})
    .concat(Object.keys(state.inventory || {}))
    .reduce((max, id) => {
      const seed = SEEDS && SEEDS[id];
      return seed ? Math.max(max, seed.sell || 0) : max;
    }, 10);
  const stageMult    = [1, 1.5, 2.5, 4, 7, 12][STATE.meta.stage || 0] || 1;
  const diffMult     = { easy: 1, medium: 2.5, hard: 6 }[difficulty] || 1;
  const prestigeMult = 1 + ((STATE.prestige.count || 0) * 0.15);
  const coinFactor   = Math.max(1, Math.log10((state.coins || 0) + 1));
  const upgradeCount = Object.keys(state.upgrades || {}).filter(k => state.upgrades[k]).length;
  const upgradeFactor = 1 + (upgradeCount * 0.02);
  return Math.floor(topSeedValue * 0.15 * stageMult * diffMult * prestigeMult * coinFactor * upgradeFactor);
};

// ── Main module ────────────────────────────────────────────────────────────
export const Minigames = (() => {

  // ══════════════════════════════
  // SHARED CONSTANTS
  // ══════════════════════════════

  const SOIL_PALETTE = [
    { name: 'Sandy',    hex: '#D4A96A' },
    { name: 'Clay',     hex: '#A0522D' },
    { name: 'Dark',     hex: '#3B2A1A' },
    { name: 'Rich',     hex: '#5C3A1E' },
    { name: 'Volcanic', hex: '#2D1B00' },
  ];

  const SM_CFG = {
    easy:   { size: 3, numColors: 3, seconds: 60, cellPx: 62, prevPx: 20 },
    medium: { size: 4, numColors: 4, seconds: 75, cellPx: 52, prevPx: 16 },
    hard:   { size: 5, numColors: 5, seconds: 90, cellPx: 44, prevPx: 13 },
  };

  // Pipe connections base at rotation 0: [top, right, bottom, left]
  const PIPE_CONN0 = {
    straight: [0, 1, 0, 1],
    corner:   [0, 1, 1, 0],
    tee:      [1, 1, 1, 0],
    cross:    [1, 1, 1, 1],
  };

  const WF_CFG = {
    easy:   { size: 5, farmCount: 2, cellPx: 48, preRotFrac: 0.50 },
    medium: { size: 6, farmCount: 4, cellPx: 42, preRotFrac: 0.25 },
    hard:   { size: 7, farmCount: 6, cellPx: 36, preRotFrac: 0.00 },
  };

  // ── Timer management ───────────────────────────────────────────────────────

  let _timers = [];
  let _raf    = null;

  function _clearAll() {
    _timers.forEach(id => { clearTimeout(id); clearInterval(id); });
    _timers = [];
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
  }

  function _t(fn, ms) { const id = setTimeout(fn, ms); _timers.push(id); return id; }

  // ── DOM / util helpers ─────────────────────────────────────────────────────

  function _body()              { return document.getElementById('mg-modal-body'); }
  function _diffLabel(d)        { return { easy:'Easy', medium:'Medium', hard:'Hard' }[d] || d; }
  function _isUnlocked(gid, d)  {
    const mg = STATE.minigames;
    if (d === 'easy')   return true;
    if (d === 'medium') return (mg[gid]?.playsEasy   || 0) >= 10;
    if (d === 'hard')   return (mg[gid]?.playsMedium || 0) >= 10;
    return false;
  }
  function _bestDiff(gid) {
    const mg = STATE.minigames[gid] || {};
    if ((mg.playsHard   || 0) > 0) return 'Hard';
    if ((mg.playsMedium || 0) > 0) return 'Medium';
    if ((mg.playsEasy   || 0) > 0) return 'Easy';
    return '—';
  }
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Landing screen ─────────────────────────────────────────────────────────

  function _renderLanding() {
    _clearAll();
    const body = _body();
    if (!body) return;
    body.innerHTML = '';
    body.style.cssText = 'padding:16px;display:flex;gap:12px;flex:1;min-height:0;overflow-y:auto';

    const games = [
      { id:'soilMixer', emoji:'🪨', name:'Soil Mixer',
        desc:'Rearrange the colored soil tiles to match the target pattern. Click to select, click again to swap.' },
      { id:'waterFlow', emoji:'💧', name:'Water Flow',
        desc:'Click pipe segments to rotate them. Connect the well to all farm tiles to win. No timer — take your time!' },
    ];

    games.forEach(g => {
      const mg   = STATE.minigames[g.id] || {};
      const card = mk('div');
      card.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:14px';
      card.dataset.diff = 'easy';

      const title = mk('div');
      title.style.cssText = 'font-size:14px;font-weight:700;color:#f0d080';
      title.textContent = `${g.emoji} ${g.name}`;
      card.appendChild(title);

      const desc = mk('div');
      desc.style.cssText = 'font-size:11px;color:rgba(255,255,255,.58);line-height:1.45;flex:1';
      desc.textContent = g.desc;
      card.appendChild(desc);

      const diffRow = mk('div');
      diffRow.style.cssText = 'display:flex;gap:4px';
      ['easy','medium','hard'].forEach(d => {
        const unlocked = _isUnlocked(g.id, d);
        const btn = mk('button', 'ug-btn');
        btn.textContent  = unlocked ? _diffLabel(d) : '🔒';
        btn.title        = unlocked ? _diffLabel(d) : (d === 'medium' ? 'Play Easy 10× to unlock' : 'Play Medium 10× to unlock');
        btn.disabled     = !unlocked;
        btn.dataset.diff = d;
        btn.style.cssText = `flex:1;font-size:10px;padding:4px 2px;${d==='easy'?'background:#5a8a3c':''}`;
        btn.addEventListener('click', () => {
          diffRow.querySelectorAll('[data-diff]').forEach(b => { b.style.background = ''; });
          btn.style.background = '#5a8a3c';
          card.dataset.diff = d;
        });
        diffRow.appendChild(btn);
      });
      card.appendChild(diffRow);

      const total = (mg.playsEasy||0) + (mg.playsMedium||0) + (mg.playsHard||0);
      const stats = mk('div');
      stats.style.cssText = 'font-size:10px;color:rgba(255,255,255,.35)';
      stats.textContent = `Played: ${total}  ·  Best: ${_bestDiff(g.id)}`;
      card.appendChild(stats);

      const playBtn = mk('button', 'ug-btn');
      playBtn.textContent = '▶ Play';
      playBtn.style.cssText = 'width:100%;background:#5a8a3c;font-size:13px;padding:9px 0;font-weight:700';
      playBtn.addEventListener('click', () => _startGame(g.id, card.dataset.diff || 'easy'));
      card.appendChild(playBtn);
      body.appendChild(card);
    });
  }

  // ── Game screen wrapper ────────────────────────────────────────────────────

  function _startGame(gameId, difficulty) {
    _clearAll();
    const body = _body();
    if (!body) return;
    body.innerHTML = '';
    body.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden';

    const hdr = mk('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,0,0,.22);border-bottom:1px solid rgba(0,0,0,.3);flex-shrink:0';
    const backBtn = mk('button','ug-btn');
    backBtn.textContent = '← Back'; backBtn.style.cssText = 'font-size:11px;padding:4px 10px';
    backBtn.addEventListener('click', () => { _clearAll(); _renderLanding(); });
    const titleEl = mk('div');
    titleEl.style.cssText = 'font-size:13px;font-weight:700;color:#f0d080';
    titleEl.textContent = gameId === 'soilMixer' ? '🪨 Soil Mixer' : '💧 Water Flow';
    const badge = mk('div');
    badge.style.cssText = 'font-size:11px;font-weight:700;padding:3px 9px;border-radius:4px;background:rgba(255,255,255,.13);color:#fff';
    badge.textContent = _diffLabel(difficulty);
    hdr.appendChild(backBtn); hdr.appendChild(titleEl); hdr.appendChild(badge);
    body.appendChild(hdr);

    const reward = calcMinigameReward(gameId, difficulty, true);
    const hint = mk('div');
    hint.style.cssText = 'text-align:center;font-size:10px;color:rgba(255,255,255,.38);padding:5px 0;flex-shrink:0';
    hint.innerHTML = `Win reward: ${coinHTML()}${formatNumber(reward)}`;
    body.appendChild(hint);

    const area = mk('div');
    area.id = 'mg-game-area';
    area.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 16px;position:relative;overflow:auto;min-height:0';
    body.appendChild(area);

    if (gameId === 'soilMixer') _playSoilMixer(area, difficulty);
    else                        _playWaterFlow(area, difficulty);
  }

  // ── Result overlay ─────────────────────────────────────────────────────────

  function _showResult(gameId, difficulty, won) {
    _clearAll();
    const area = document.getElementById('mg-game-area');
    if (!area) return;
    const reward = calcMinigameReward(gameId, difficulty, won);
    const ov = mk('div');
    ov.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:50;padding:24px;text-align:center';
    const icon = mk('div'); icon.style.fontSize = '3rem'; icon.textContent = won ? '🎉' : '❌';
    const msg  = mk('div');
    msg.style.cssText = `font-size:15px;font-weight:700;color:${won?'#8de88d':'#ff8080'}`;
    if (won) msg.innerHTML = `You won! Earned ${coinHTML()}${formatNumber(reward)}`;
    else     msg.textContent = 'Better luck next time!';
    const btns = mk('div'); btns.style.cssText = 'display:flex;gap:10px;margin-top:6px';
    const again = mk('button','ug-btn'); again.textContent = 'Play Again';
    again.style.cssText = 'background:#5a8a3c;padding:7px 18px;font-size:12px;font-weight:600';
    again.addEventListener('click', () => _startGame(gameId, difficulty));
    const back = mk('button','ug-btn'); back.textContent = 'Back to Games';
    back.style.cssText = 'padding:7px 18px;font-size:12px';
    back.addEventListener('click', () => _renderLanding());
    btns.appendChild(again); btns.appendChild(back);
    ov.appendChild(icon); ov.appendChild(msg); ov.appendChild(btns);
    area.appendChild(ov);
    EventBus.emit('minigame:complete', { gameId, difficulty, won });
  }

  // ══════════════════════════════
  // SOIL MIXER — Color swap puzzle
  // ══════════════════════════════

  function _genSoilPuzzle(size, numColors) {
    const total = size * size;
    // Build target: equal counts of each color, then shuffle
    const pool = [];
    for (let c = 0; c < numColors; c++)
      for (let i = 0; i < total / numColors; i++) pool.push(c);
    const target = _shuffle(pool);
    // Build start: do many random swaps on target
    const start = [...target];
    const swaps = total * 4;
    for (let i = 0; i < swaps; i++) {
      const a = Math.floor(Math.random() * total);
      const b = Math.floor(Math.random() * total);
      [start[a], start[b]] = [start[b], start[a]];
    }
    return { target, start };
  }

  function _countMatches(grid, target) {
    return grid.reduce((n, v, i) => n + (v === target[i] ? 1 : 0), 0);
  }

  function _playSoilMixer(area, difficulty) {
    const cfg    = SM_CFG[difficulty];
    const { size, numColors, seconds, cellPx, prevPx } = cfg;
    const total  = size * size;
    const { target, start } = _genSoilPuzzle(size, numColors);

    let grid      = [...start];
    let selected  = null;
    let timeLeft  = seconds;
    let gameOver  = false;

    // ── Layout: status row / content row (main grid + preview) ───────────────
    const statusRow = mk('div');
    statusRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;width:100%;max-width:420px;margin-bottom:8px;flex-shrink:0';

    const matchEl = mk('div');
    matchEl.style.cssText = 'font-size:12px;color:rgba(255,255,255,.7);font-weight:600';

    const timerEl = mk('div');
    timerEl.style.cssText = 'font-size:12px;font-weight:700;color:#f0d080;font-variant-numeric:tabular-nums';

    statusRow.appendChild(matchEl);
    statusRow.appendChild(timerEl);
    area.appendChild(statusRow);

    // Timer bar
    const barWrap = mk('div');
    barWrap.style.cssText = 'width:100%;max-width:420px;height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;margin-bottom:14px;flex-shrink:0';
    const barFill = mk('div');
    barFill.style.cssText = `height:100%;width:100%;background:#5a8a3c;transition:width 1s linear`;
    barWrap.appendChild(barFill);
    area.appendChild(barWrap);

    // Content row: main grid + preview
    const contentRow = mk('div');
    contentRow.style.cssText = 'display:flex;align-items:flex-start;gap:18px;flex-shrink:0';
    area.appendChild(contentRow);

    // Main grid
    const mainGrid = mk('div');
    mainGrid.style.cssText = `display:grid;grid-template-columns:repeat(${size},${cellPx}px);gap:3px`;
    contentRow.appendChild(mainGrid);

    // Preview section
    const prevSection = mk('div');
    prevSection.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0';
    const prevLabel = mk('div');
    prevLabel.style.cssText = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.38)';
    prevLabel.textContent = 'Target';
    const prevGrid = mk('div');
    prevGrid.style.cssText = `display:grid;grid-template-columns:repeat(${size},${prevPx}px);gap:2px`;
    prevSection.appendChild(prevLabel);
    prevSection.appendChild(prevGrid);
    contentRow.appendChild(prevSection);

    // Build preview (static, target pattern)
    for (let i = 0; i < total; i++) {
      const cell = mk('div');
      cell.style.cssText = `width:${prevPx}px;height:${prevPx}px;border-radius:2px;background:${SOIL_PALETTE[target[i]].hex}`;
      prevGrid.appendChild(cell);
    }

    // Build interactive main grid tiles
    const tileDivs = [];
    function _renderTile(i) {
      const t = tileDivs[i];
      if (!t) return;
      const correct  = grid[i] === target[i];
      const isSel    = selected === i;
      t.style.background = SOIL_PALETTE[grid[i]].hex;
      t.style.border     = isSel ? '2px solid #ffffff' : correct ? '2px solid rgba(80,220,80,.55)' : '2px solid rgba(255,255,255,.1)';
      t.style.transform  = isSel ? 'scale(1.07)' : 'scale(1)';
      t.style.boxShadow  = isSel ? '0 0 10px rgba(255,255,255,.35)' : correct ? '0 0 6px rgba(80,220,80,.3)' : 'none';
      // Correct overlay
      let check = t.querySelector('.sm-check');
      if (correct && !check) {
        check = mk('div'); check.className = 'sm-check';
        check.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${cellPx*0.45}px;background:rgba(80,220,80,.18);border-radius:4px;pointer-events:none`;
        check.textContent = '✓';
        t.appendChild(check);
      } else if (!correct && check) {
        check.remove();
      }
    }

    function _renderAll() {
      for (let i = 0; i < total; i++) _renderTile(i);
      const matches = _countMatches(grid, target);
      matchEl.textContent = `Matches: ${matches} / ${total}`;
    }

    for (let i = 0; i < total; i++) {
      const tile = mk('div');
      tile.style.cssText = `width:${cellPx}px;height:${cellPx}px;border-radius:5px;cursor:pointer;position:relative;border:2px solid rgba(255,255,255,.1);transition:transform .1s,box-shadow .1s,border-color .1s;box-sizing:border-box`;
      const idx = i;
      tile.addEventListener('click', () => {
        if (gameOver) return;
        if (selected === null) {
          // Select this tile
          selected = idx;
        } else if (selected === idx) {
          // Deselect
          selected = null;
        } else {
          // Swap selected ↔ idx
          const a = selected, b = idx;
          [grid[a], grid[b]] = [grid[b], grid[a]];
          selected = null;
          _renderAll();
          if (_countMatches(grid, target) === total) {
            gameOver = true;
            _t(() => _showResult('soilMixer', difficulty, true), 350);
          }
          return;
        }
        _renderTile(idx);
        if (selected !== null && selected !== idx) {
          // Re-render previously selected
        } else if (selected === null) {
          // Deselected — re-render idx
        }
        // Just re-render all for simplicity
        for (let j = 0; j < total; j++) _renderTile(j);
      });
      mainGrid.appendChild(tile);
      tileDivs.push(tile);
    }

    _renderAll();

    // Countdown timer
    function _fmtTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
    timerEl.textContent = _fmtTime(timeLeft);

    const tickId = setInterval(() => {
      if (gameOver) return;
      timeLeft--;
      timerEl.textContent = _fmtTime(timeLeft);
      barFill.style.width = (timeLeft / seconds * 100) + '%';
      barFill.style.background = timeLeft <= 10 ? '#e74c3c' : timeLeft <= 20 ? '#e6c040' : '#5a8a3c';
      if (timeLeft <= 0) {
        clearInterval(tickId);
        gameOver = true;
        _showResult('soilMixer', difficulty, false);
      }
    }, 1000);
    _timers.push(tickId);
  }

  // ══════════════════════════════
  // WATER FLOW — Rotate pipes puzzle
  // ══════════════════════════════

  // Rotate connections 90° clockwise: [t,r,b,l] → [l,t,r,b]
  function _rotConn([t, r, b, l]) { return [l, t, r, b]; }

  function _getConn(pipe) {
    let c = [...PIPE_CONN0[pipe.type]];
    for (let i = 0; i < (pipe.rotation % 4); i++) c = _rotConn(c);
    return c;
  }

  // Determine pipe type and correct rotation for a set of required connections [t,r,b,l]
  function _pipeForConn(conn) {
    const count = conn.reduce((s, v) => s + v, 0);
    if (count === 4) return { type:'cross', rotation:0 };
    if (count === 0) return { type:'straight', rotation:0 }; // fallback

    if (count === 3) {
      const missing = conn.indexOf(0);
      // Base tee [1,1,1,0] missing left(3): rot=0; missing top(0)=rot1; right(1)=rot2; bottom(2)=rot3
      const rots = { 3:0, 0:1, 1:2, 2:3 };
      return { type:'tee', rotation: rots[missing] ?? 0 };
    }

    if (count === 2) {
      const idx = conn.map((v,i) => v ? i : -1).filter(i => i >= 0);
      const [a, b] = idx;
      if ((a === 0 && b === 2) || (a === 1 && b === 3)) {
        // Straight
        return { type:'straight', rotation: a === 0 ? 1 : 0 };
      }
      // Corner: base [0,1,1,0] = right+bottom → '12'
      const key = `${a}${b}`;
      const cornerRots = { '12':0, '23':1, '03':2, '01':3 };
      return { type:'corner', rotation: cornerRots[key] ?? 0 };
    }

    // count === 1: single-connection endpoint (shouldn't appear on path nodes)
    return { type:'straight', rotation: conn.indexOf(1) % 2 === 0 ? 1 : 0 };
  }

  function _computeConnected(pipes, size) {
    const total = size * size;
    const reachable = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const idx = queue.shift();
      const r = Math.floor(idx / size), c = idx % size;
      const myConn = pipes[idx].isSpecial ? [1,1,1,1] : _getConn(pipes[idx]);
      const dirs = [
        { offset: -size, sd: 0, nd: 2, valid: r > 0 },
        { offset: +1,    sd: 1, nd: 3, valid: c < size-1 },
        { offset: +size, sd: 2, nd: 0, valid: r < size-1 },
        { offset: -1,    sd: 3, nd: 1, valid: c > 0 },
      ];
      for (const { offset, sd, nd, valid } of dirs) {
        const n = idx + offset;
        if (!valid || reachable.has(n)) continue;
        if (!myConn[sd]) continue;
        const nc = pipes[n].isSpecial ? [1,1,1,1] : _getConn(pipes[n]);
        if (!nc[nd]) continue;
        reachable.add(n);
        queue.push(n);
      }
    }
    return reachable;
  }

  function _genWaterPuzzle(size, farmCount, preRotFrac) {
    const total = size * size;

    // Select farm positions: spread toward far corners/edges, never (0,0)
    const cands = [];
    for (let i = 1; i < total; i++) {
      const r = Math.floor(i / size), c = i % size;
      cands.push({ idx: i, dist: r + c });
    }
    cands.sort((a, b) => b.dist - a.dist);
    // Take top 2× candidates, shuffle, pick farmCount
    const farmPositions = _shuffle(cands.slice(0, farmCount * 3).map(x => x.idx)).slice(0, farmCount);

    // BFS from well to build spanning tree
    const parent  = new Array(total).fill(-1);
    const visited = new Set([0]);
    const bfsQ    = [0];
    while (bfsQ.length) {
      const idx = bfsQ.shift();
      const r = Math.floor(idx / size), c = idx % size;
      const nbrs = _shuffle([
        r > 0     ? idx - size : -1,
        c < size-1 ? idx + 1   : -1,
        r < size-1 ? idx + size : -1,
        c > 0     ? idx - 1   : -1,
      ].filter(n => n >= 0 && !visited.has(n)));
      for (const n of nbrs) { visited.add(n); parent[n] = idx; bfsQ.push(n); }
    }

    // Extract pathSet: union of paths from well to each farm tile
    const pathSet = new Set([0]);
    for (const fp of farmPositions) {
      let cur = fp;
      while (cur !== 0) { pathSet.add(cur); cur = parent[cur]; if (cur < 0) break; }
    }

    // Build pipes array
    const specials = new Set([0, ...farmPositions]);
    const pipes = new Array(total).fill(null).map((_, i) => {
      if (specials.has(i)) return { type:'cross', rotation:0, isSpecial:true };

      if (pathSet.has(i)) {
        const ri = Math.floor(i / size), ci = i % size;
        const conn = [
          ri > 0     && pathSet.has(i - size) ? 1 : 0,
          ci < size-1 && pathSet.has(i + 1)   ? 1 : 0,
          ri < size-1 && pathSet.has(i + size) ? 1 : 0,
          ci > 0     && pathSet.has(i - 1)   ? 1 : 0,
        ];
        const p = _pipeForConn(conn);
        return { ...p, correctRotation: p.rotation, isSpecial: false };
      }

      // Non-path filler pipe
      const types = ['straight','corner','corner','tee'];
      const type  = types[Math.floor(Math.random() * types.length)];
      const rot   = Math.floor(Math.random() * 4);
      return { type, rotation: rot, correctRotation: null, isSpecial: false };
    });

    // Apply scrambling: for each non-special pipe, randomize rotation if random() >= preRotFrac
    for (let i = 0; i < total; i++) {
      if (pipes[i].isSpecial) continue;
      if (Math.random() >= preRotFrac) {
        pipes[i].rotation = Math.floor(Math.random() * 4);
      }
    }

    return { pipes, farmPositions, wellPos: 0 };
  }

  // Render a single pipe cell div
  function _renderPipeDiv(pipe, connected, cellPx, isWell, isFarm) {
    const conn  = pipe.isSpecial ? [1,1,1,1] : _getConn(pipe);
    const pipeColor = connected ? '#4dc8f0' : '#4a6070';
    const bgColor   = connected ? 'rgba(40,150,200,.14)' : 'rgba(20,35,50,.55)';
    const aw = Math.max(4, Math.round(cellPx * 0.22)); // arm width

    const cell = mk('div');
    cell.style.cssText = `width:${cellPx}px;height:${cellPx}px;background:${bgColor};border-radius:3px;position:relative;cursor:pointer;box-sizing:border-box;overflow:hidden`;
    if (connected) cell.style.outline = '1px solid rgba(77,200,240,.22)';

    // Center dot
    const dotSz = aw + 2;
    const dot = mk('div');
    dot.style.cssText = `position:absolute;width:${dotSz}px;height:${dotSz}px;background:${pipeColor};border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%)`;
    cell.appendChild(dot);

    // Arms
    if (conn[0]) { // top
      const a = mk('div');
      a.style.cssText = `position:absolute;width:${aw}px;top:0;bottom:50%;left:50%;transform:translateX(-50%);background:${pipeColor}`;
      cell.appendChild(a);
    }
    if (conn[1]) { // right
      const a = mk('div');
      a.style.cssText = `position:absolute;height:${aw}px;left:50%;right:0;top:50%;transform:translateY(-50%);background:${pipeColor}`;
      cell.appendChild(a);
    }
    if (conn[2]) { // bottom
      const a = mk('div');
      a.style.cssText = `position:absolute;width:${aw}px;top:50%;bottom:0;left:50%;transform:translateX(-50%);background:${pipeColor}`;
      cell.appendChild(a);
    }
    if (conn[3]) { // left
      const a = mk('div');
      a.style.cssText = `position:absolute;height:${aw}px;right:50%;left:0;top:50%;transform:translateY(-50%);background:${pipeColor}`;
      cell.appendChild(a);
    }

    // Emoji overlay for special cells
    if (isWell || isFarm) {
      const em = mk('div');
      const farmConnected = isFarm && connected;
      em.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${cellPx*0.45}px;pointer-events:none;${farmConnected?'filter:drop-shadow(0 0 4px rgba(77,200,240,.8))':''}`;
      em.textContent = isWell ? '🪣' : '🌾';
      cell.appendChild(em);
    }

    return cell;
  }

  function _playWaterFlow(area, difficulty) {
    const cfg = WF_CFG[difficulty];
    const { size, farmCount, cellPx, preRotFrac } = cfg;
    const { pipes, farmPositions, wellPos } = _genWaterPuzzle(size, farmCount, preRotFrac);

    let connected = _computeConnected(pipes, size);
    let gameOver  = false;

    // Instructions
    const instrEl = mk('div');
    instrEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,.5);text-align:center;margin-bottom:10px;flex-shrink:0';
    instrEl.textContent = `Connect 🪣 to ${farmCount} farm tile${farmCount>1?'s':''} (🌾) by rotating pipes`;
    area.appendChild(instrEl);

    // Grid container
    const gridWrap = mk('div');
    gridWrap.style.cssText = `display:grid;grid-template-columns:repeat(${size},${cellPx}px);gap:2px;flex-shrink:0`;
    area.appendChild(gridWrap);

    // Status
    const statusEl = mk('div');
    statusEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,.45);text-align:center;margin-top:10px;flex-shrink:0';
    area.appendChild(statusEl);

    function _updateStatus() {
      const powered = farmPositions.filter(fp => connected.has(fp)).length;
      statusEl.innerHTML = `Powered: ${powered} / ${farmCount}`;
    }

    // Build and render grid
    const cellDivs = [];

    function _rebuildGrid() {
      gridWrap.innerHTML = '';
      cellDivs.length = 0;
      for (let i = 0; i < size * size; i++) {
        const isWell = i === wellPos;
        const isFarm = farmPositions.includes(i);
        const isConn = connected.has(i);
        const cell   = _renderPipeDiv(pipes[i], isConn, cellPx, isWell, isFarm);

        if (!pipes[i].isSpecial) {
          cell.addEventListener('click', () => {
            if (gameOver) return;
            pipes[i].rotation = (pipes[i].rotation + 1) % 4;
            connected = _computeConnected(pipes, size);
            _rebuildGrid();
            _updateStatus();
            if (farmPositions.every(fp => connected.has(fp))) {
              gameOver = true;
              _t(() => _showResult('waterFlow', difficulty, true), 400);
            }
          });
          cell.addEventListener('mouseenter', () => { if (!gameOver) cell.style.outline = '2px solid rgba(255,255,255,.28)'; });
          cell.addEventListener('mouseleave', () => { cell.style.outline = connected.has(i) ? '1px solid rgba(77,200,240,.22)' : ''; });
        }

        gridWrap.appendChild(cell);
        cellDivs.push(cell);
      }
    }

    _rebuildGrid();
    _updateStatus();
  }

  // ── Modal public API ───────────────────────────────────────────────────────

  function open() {
    const backdrop = document.getElementById('mg-backdrop');
    const modal    = document.getElementById('mg-modal');
    if (!modal) return;
    backdrop.style.display = 'block';
    modal.style.display    = 'flex';
    _renderLanding();
    EventBus.emit('modal:open');
  }

  function close() {
    _clearAll();
    const backdrop = document.getElementById('mg-backdrop');
    const modal    = document.getElementById('mg-modal');
    if (!modal) return;
    backdrop.style.display = 'none';
    modal.style.display    = 'none';
    EventBus.emit('modal:close');
  }

  return { open, close };
})();
