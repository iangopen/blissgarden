window.DebugPanel = (() => {
  let _coinEditActive   = false;
  let _debugPanelEl     = null;
  let _debugBodyEl      = null;
  let _debugPriceBodyEl = null;
  let _debugPriceOpen   = false;
  let _debugInterval    = null;

  function _startCoinEdit() {
    if (_coinEditActive) return;
    _coinEditActive = true;
    const display = document.getElementById('coin-count');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = state.coins;
    input.style.cssText = 'width:72px;font-size:13px;font-weight:700;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:4px;padding:1px 5px;outline:none';
    display.style.display = 'none';
    display.parentNode.insertBefore(input, display.nextSibling);
    input.focus(); input.select();
    function endEdit() {
      if (!_coinEditActive) return;
      _coinEditActive = false;
      const val = parseInt(input.value);
      if (!isNaN(val) && val >= 0) {
        state.coins = val;
        if (val > (state.coinsEarned || 0)) state.coinsEarned = val;
        checkStages(); checkMaturity();
      }
      input.remove();
      display.style.display = '';
      RenderHUD.renderCoin();
      updateCoins();
      save();
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); endEdit(); } });
    input.addEventListener('blur', endEdit);
  }

  function _buildDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = [
      'position:fixed;top:60px;right:240px',
      'background:rgba(8,8,18,.93)',
      'color:#b8c8d8;font-family:monospace;font-size:11px;line-height:1.65',
      'border:1px solid rgba(255,255,255,.13);border-radius:7px',
      'min-width:270px;z-index:9998;user-select:none',
    ].join(';');

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:rgba(255,255,255,.06);border-radius:7px 7px 0 0;cursor:move;font-weight:700;color:#fff;font-size:12px';
    bar.innerHTML = '🖥️&nbsp;Debug Console';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;color:#888;cursor:pointer;font-size:13px;padding:0 0 0 8px;line-height:1';
    closeBtn.addEventListener('click', e => { e.stopPropagation(); _closeDebugPanel(); });
    bar.appendChild(closeBtn);
    panel.appendChild(bar);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding:8px 12px 10px';
    panel.appendChild(wrapper);

    const body = document.createElement('div');
    wrapper.appendChild(body);

    const forcePrestigeBtn = document.createElement('button');
    forcePrestigeBtn.textContent = '✨ Force Prestige';
    forcePrestigeBtn.style.cssText = 'background:#b03020;color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;margin-top:6px;width:100%';
    forcePrestigeBtn.addEventListener('click', () => {
      state.coins = 1000000;
      prestige();
    });
    wrapper.appendChild(forcePrestigeBtn);

    const priceDivider = document.createElement('div');
    priceDivider.style.cssText = 'border-top:1px solid rgba(255,255,255,.08);margin-top:6px';
    wrapper.appendChild(priceDivider);

    const priceHeader = document.createElement('div');
    priceHeader.style.cssText = 'color:#6af;font-weight:700;cursor:pointer;padding:4px 0 2px;user-select:none';
    priceHeader.textContent = '▸ 📊 Price Comparison';
    priceHeader.addEventListener('click', () => {
      _debugPriceOpen = !_debugPriceOpen;
      priceHeader.textContent = (_debugPriceOpen ? '▾ ' : '▸ ') + '📊 Price Comparison';
      priceBody.style.display = _debugPriceOpen ? '' : 'none';
      if (_debugPriceOpen) _updatePriceTable();
    });
    wrapper.appendChild(priceHeader);

    const priceBody = document.createElement('div');
    priceBody.style.display = 'none';
    wrapper.appendChild(priceBody);
    _debugPriceBodyEl = priceBody;

    let dragDx = 0, dragDy = 0, dragging = false;
    bar.addEventListener('mousedown', e => {
      if (e.target === closeBtn) return;
      dragging = true; dragDx = e.clientX - panel.offsetLeft; dragDy = e.clientY - panel.offsetTop;
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left  = (e.clientX - dragDx) + 'px';
      panel.style.top   = (e.clientY - dragDy) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; });

    document.body.appendChild(panel);
    _debugPanelEl = panel;
    _debugBodyEl  = body;
    _debugPriceOpen = false;
  }

  function _updatePriceTable() {
    if (!_debugPriceBodyEl || !_debugPriceOpen) return;
    const sv = STATE.modifiers.sellValue;
    const entries = Object.entries(window.SEEDS || {}).sort((a, b) => {
      const ac = a[1].cost, bc = b[1].cost;
      if (ac !== undefined && bc !== undefined) return ac - bc;
      if (ac !== undefined) return -1;
      if (bc !== undefined) return 1;
      return a[1].sell - b[1].sell;
    });
    const cell = (content, align, color, bold) =>
      `<td style="padding:2px 5px;text-align:${align};${color ? 'color:' + color + ';' : ''}${bold ? 'font-weight:700;' : ''}">${content}</td>`;
    let html = '<table style="border-collapse:collapse;width:100%;font-size:10px;font-family:monospace">';
    html += '<tr style="color:#6af;border-bottom:1px solid rgba(255,255,255,.12)">';
    html += '<th style="padding:2px 5px;text-align:left;font-weight:700"></th>';
    html += '<th style="padding:2px 5px;text-align:left;font-weight:700">Name</th>';
    html += '<th style="padding:2px 5px;text-align:right;font-weight:700">Buy</th>';
    html += '<th style="padding:2px 5px;text-align:right;font-weight:700">Base</th>';
    html += '<th style="padding:2px 5px;text-align:right;font-weight:700">Eff.</th>';
    html += '<th style="padding:2px 5px;text-align:right;font-weight:700">Ratio</th>';
    html += '</tr>';
    entries.forEach(([id, s], i) => {
      const effSell  = Math.floor(s.sell * sv);
      const ratio    = (s.cost > 0) ? effSell / s.cost : null;
      const ratioStr = ratio === null ? '—' : ratio.toFixed(2) + 'x';
      const buyCost  = s.cost !== undefined ? formatNumber(s.cost) : '—';
      let effColor = '#b8c8d8';
      if (ratio !== null) {
        if (ratio >= 3) effColor = '#4d4';
        else if (ratio >= 1) effColor = '#cc4';
        else effColor = '#d44';
      }
      const rowBg = i % 2 === 0 ? '' : 'background:rgba(255,255,255,.04)';
      html += `<tr style="${rowBg}">`;
      html += cell(s.icon || '', 'left', '#ccc', false);
      html += cell(s.name, 'left', '#b8c8d8', false);
      html += cell(buyCost, 'right', '#556', false);
      html += cell(formatNumber(s.sell), 'right', '#556', false);
      html += cell(formatNumber(effSell), 'right', effColor, false);
      html += cell(ratioStr, 'right', effColor, true);
      html += '</tr>';
    });
    html += '</table>';
    _debugPriceBodyEl.innerHTML = html;
  }

  function _updateDebugPanel() {
    if (!_debugBodyEl) return;
    const m  = STATE.modifiers;
    const dc = STATE.session.debugCounts;
    const s  = getCurrentStage();
    const TIMERS = [
      { id:'crow',    label:'Crow',     stage:1 },
      { id:'weed',    label:'Weed',     stage:1 },
      { id:'hawk',    label:'Hawk',     stage:2 },
      { id:'mole',    label:'Mole',     stage:2 },
      { id:'rootRot', label:'Root Rot', stage:3 },
      { id:'locust',  label:'Locust',   stage:3 },
      { id:'blight',  label:'Blight',   stage:3 },
      { id:'fungal',  label:'Fungal',   stage:3 },
    ];
    const h   = (label, color) => `<div style="color:${color || '#6af'};font-weight:700;margin:6px 0 2px">${label}</div>`;
    const row = (k, v) => `<div><span style="color:#778">${k}:</span> ${v}</div>`;
    let html = '';
    html += h('TIMING');
    html += row('Sell interval',     Math.round(m.sellInterval) + 'ms');
    html += row('Crank multiplier',  STATE.session.crankMultiplier.toFixed(3) + 'x');
    html += row('Grow speed',        m.growSpeed.toFixed(3) + 'x');
    html += row('Sell value',        m.sellValue.toFixed(3) + 'x');
    html += row('Sell box capacity', m.sellBoxCapacity);
    const tod        = STATE.session.timeOfDay || 'day';
    const globalMult = { day:1.15, night:0.85, dawn:1.0, dusk:1.0 }[tod] ?? 1.0;
    html += h('DAY/NIGHT');
    html += row('Time of day', tod.toUpperCase());
    html += row('Global mult', globalMult.toFixed(2) + 'x');
    const _daySeeds = ['potato', 'carrot', 'moonbloom', 'voidbloom', 'chard'];
    _daySeeds.forEach(id => {
      const seed = window.SEEDS?.[id];
      if (!seed) return;
      const eff = window.RenderEnv?.getDayNightMult?.(id) ?? 1.0;
      html += row(seed.name + ' mult', eff.toFixed(2) + 'x');
    });
    html += h('STAGE &amp; STATE');
    html += row('Stage',         `${s.stage} — ${s.name}`);
    html += row('Mature',        String(!!state.mature));
    html += row('All-time gold', formatNumber(state.coinsEarned || 0));
    html += h('EVENT TIMERS');
    TIMERS.forEach(({ id, label, stage: req }) => {
      const rem = TimerManager.getRemaining(id);
      html += row(label, `${rem}ms <span style="color:#445">(stage ${req}+)</span>`);
    });
    html += h('EVENT CHANCES (per roll, now)');
    Object.keys(BALANCE.events).forEach(id => {
      const res = Math.min(BALANCE.eventResistanceCap, m.eventResistance[id] || 0);
      html += row(id, `${(eventChance(id) * 100).toFixed(2)}% <span style="color:#445">(resist ${(res * 100).toFixed(1)}%)</span>`);
    });
    html += h('OCCURRENCES');
    html += row('Crow attacks',  dc.crow);
    html += row('Hawk attacks',  dc.hawk);
    html += row('Weeds spawned', dc.weed);
    html += row('Moles',         dc.mole);
    html += row('Root rot',      dc.rootRot);
    html += row('Locust swarms', dc.locust);
    html += row('Blight storms', dc.blight);
    html += row('Fungal blooms', dc.fungal);
    _debugBodyEl.innerHTML = html;
    _updatePriceTable();
  }

  function _openDebugPanel() {
    if (!_debugPanelEl) _buildDebugPanel();
    _debugPanelEl.style.display = '';
    _updateDebugPanel();
    _debugInterval = setInterval(_updateDebugPanel, 50);
  }

  function _closeDebugPanel() {
    if (_debugPanelEl) _debugPanelEl.style.display = 'none';
    if (_debugInterval) { clearInterval(_debugInterval); _debugInterval = null; }
  }

  function _toggleDebugPanel() {
    if (_debugPanelEl && _debugPanelEl.style.display !== 'none') _closeDebugPanel();
    else _openDebugPanel();
  }

  function applyDebugMode() {
    const on  = STATE.settings.debugMode;
    const ico = document.getElementById('debug-console-icon');
    if (ico) ico.style.display = on ? '' : 'none';
    if (!on) _closeDebugPanel();
  }

  function setupUI() {
    const dbgIcon = document.createElement('span');
    dbgIcon.id = 'debug-console-icon';
    dbgIcon.textContent = '🖥️';
    dbgIcon.title = 'Debug Console';
    dbgIcon.style.cssText = 'margin-left:7px;cursor:pointer;font-size:14px;display:none;line-height:1;vertical-align:middle';
    document.getElementById('coins').appendChild(dbgIcon);
    dbgIcon.addEventListener('click', e => { e.stopPropagation(); _toggleDebugPanel(); });

    document.getElementById('coin-count').style.cursor = 'default';
    document.getElementById('coin-count').addEventListener('click', () => {
      if (STATE.settings.debugMode) _startCoinEdit();
    });
  }

  return { applyDebugMode, setupUI };
})();
