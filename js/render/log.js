// ══════════════════════════════
// LOG PANEL
// ══════════════════════════════
window.RenderLog = (() => {
  const CATS = {
    attack:   { label: '⚔️',  color: '#e74c3c', title: 'Attacks'  },
    earnings: { label: '💰',  color: '#2ecc71', title: 'Earnings' },
    growth:   { label: '🌱',  color: '#a8e063', title: 'Growth'   },
    event:    { label: '⚠️',  color: '#e67e22', title: 'Events'   },
    unlock:   { label: '🔓',  color: '#3498db', title: 'Unlocks'  },
    prestige: { label: '✨',  color: '#9b59b6', title: 'Prestige' },
    season:   { label: '🌤️', color: '#1abc9c', title: 'Season'   },
    system:   { label: '⚙️',  color: '#95a5a6', title: 'System'   },
  };

  let _inner = null, _filterRow = null, _ready = false, _userScrolled = false;

  function _fmtTs(ts) {
    const d = new Date(ts);
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => n.toString().padStart(2, '0')).join(':');
  }

  function _shown(cat) {
    return (STATE.settings.logFilters || {})[cat] !== false;
  }

  function _makeLine(entry) {
    const c = CATS[entry.category] || CATS.system;
    const el = document.createElement('div');
    el.className = 'log-line';
    el.dataset.cat = entry.category;
    el.style.borderLeft = `3px solid ${c.color}`;
    if (!_shown(entry.category)) el.style.display = 'none';

    const ts = document.createElement('span');
    ts.className = 'log-ts';
    ts.textContent = _fmtTs(entry.timestamp);

    const msg = document.createElement('span');
    msg.className = 'log-msg';
    msg.innerHTML = ' ' + entry.message;

    el.appendChild(ts);
    el.appendChild(msg);
    return el;
  }

  function _applyFilters() {
    if (!_inner) return;
    const f = STATE.settings.logFilters || {};
    _inner.querySelectorAll('.log-line').forEach(el => {
      el.style.display = (f[el.dataset.cat] === false) ? 'none' : '';
    });
  }

  function _updateBtns() {
    if (!_filterRow) return;
    const f = STATE.settings.logFilters || {};
    const allClear = !Object.values(f).some(v => v === false);
    _filterRow.querySelectorAll('.log-fbtn').forEach(btn => {
      const fc = btn.dataset.fc;
      btn.classList.toggle('log-fbtn-on',
        fc === 'all' ? allClear : f[fc] !== false);
    });
  }

  function _buildFilters(panel) {
    const row = document.createElement('div');
    row.id = 'log-filter-row';

    const allBtn = document.createElement('button');
    allBtn.className = 'log-fbtn';
    allBtn.dataset.fc = 'all';
    allBtn.textContent = 'All';
    allBtn.title = 'Show all';
    allBtn.addEventListener('click', () => {
      STATE.settings.logFilters = {};
      _applyFilters(); _updateBtns();
      if (typeof save === 'function') save();
    });
    row.appendChild(allBtn);

    Object.entries(CATS).forEach(([cat, data]) => {
      const btn = document.createElement('button');
      btn.className = 'log-fbtn';
      btn.dataset.fc = cat;
      btn.textContent = data.label;
      btn.title = data.title;
      btn.style.setProperty('--fc', data.color);
      btn.addEventListener('click', () => {
        if (!STATE.settings.logFilters) STATE.settings.logFilters = {};
        const f = STATE.settings.logFilters;
        if (f[cat] === false) {
          delete f[cat];
        } else {
          f[cat] = false;
        }
        if (!Object.values(f).some(v => v === false)) STATE.settings.logFilters = {};
        _applyFilters(); _updateBtns();
        if (typeof save === 'function') save();
      });
      row.appendChild(btn);
    });

    _filterRow = row;
    panel.insertBefore(row, _inner);
  }

  function init() {
    if (_ready) return;
    const panel = document.getElementById('log-panel');
    _inner = document.getElementById('log-inner');
    if (!panel || !_inner) return;
    _buildFilters(panel);
    _updateBtns();
    _inner.addEventListener('scroll', () => {
      _userScrolled = _inner.scrollTop + _inner.clientHeight < _inner.scrollHeight - 30;
    });
    _ready = true;
  }

  function renderLog(entry) {
    if (!_ready) init();
    if (!_inner) return;
    _inner.appendChild(_makeLine(entry));
    if (!_userScrolled) {
      requestAnimationFrame(() => { if (_inner) _inner.scrollTop = _inner.scrollHeight; });
    }
  }

  return { init, renderLog, applyFilters: _applyFilters };
})();

// ══════════════════════════════
// LOG FUNCTION
// ══════════════════════════════
function log(msg, category = 'system') {
  RenderLog.renderLog({ message: msg, category, timestamp: Date.now() });
}

function showBanner(text) {
  if (!STATE.settings.showBanners) return;
  const existing = document.querySelector('.world-banner');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'world-banner';
  el.textContent = text;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
  setTimeout(() => el.remove(), 4200);
}

function applyReducedMotion() {
  document.body.classList.toggle('reduced-motion', !!STATE.settings.reducedMotion);
}
