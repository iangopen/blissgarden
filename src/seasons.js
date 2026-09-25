import { SEASONS } from './data.js';
import { STATE } from './state.js';
import { save } from './save.js';
import { EventBus } from './core/bus.js';
import { log, showBanner } from './render/log.js';

// ══════════════════════════════
// SEASONS SYSTEM
// ══════════════════════════════
export const Seasons = (() => {
  // Night-themed seeds that are affected by frost
  const NIGHT_SEEDS = new Set([
    'moonbloom', 'voidbloom', 'eclipseLotus', 'netherfruit', 'genesisSeed',
    'stardustFern', 'celestialPod', 'auricBloom', 'prismaticRoot', 'voidLotus',
  ]);

  let _displayEl = null;
  let _weatherEl = null;
  let _particleEl = null;
  let _lastDroughtCheck = 0;
  let _lastRainCheck    = 0;
  let _lastFrostCheck   = 0;
  let _firstDrought = false;
  let _firstRain    = false;

  // ── Season advancement ────────────────────────────────────────────────────

  function getCurrentSeason() {
    if (!SEASONS) return null;
    const si = STATE.meta.seasonIndex || 0;
    const season = SEASONS[si] || SEASONS[0];
    const elapsed = (Date.now() - (STATE.meta.seasonStartTime || Date.now())) / 1000;
    if (elapsed >= season.duration) {
      advanceSeason();
      return SEASONS[STATE.meta.seasonIndex || 0];
    }
    return season;
  }

  function advanceSeason() {
    if (!SEASONS) return;
    // Clear active weather when season changes
    STATE.session.droughtEndsAt = 0;
    STATE.session.rainEndsAt    = 0;
    STATE.session.frostEndsAt   = 0;
    _hideWeatherOverlay();

    STATE.meta.seasonIndex     = ((STATE.meta.seasonIndex || 0) + 1) % SEASONS.length;
    STATE.meta.seasonStartTime = Date.now();
    const season = SEASONS[STATE.meta.seasonIndex];
    applySeasonEffects();
    _updateParticles(season);
    EventBus.emit('season:changed', { season });
    save();
  }

  function applySeasonEffects() {
    const season = SEASONS && SEASONS[STATE.meta.seasonIndex || 0];
    if (!season) return;
    STATE.modifiers.seasonGrowMult = season.effects.growSpeed;
    STATE.modifiers.seasonSellMult = season.effects.sellValue;
    STATE.modifiers.seasonWeedMult = season.effects.weedChance;
    STATE.modifiers.seasonCrowMult = season.effects.crowChance;
    STATE.session.seasonDayMult    = season.dayNightMult.day;
    STATE.session.seasonNightMult  = season.dayNightMult.night;
  }

  // ── Weather event state ───────────────────────────────────────────────────

  function isNightSeed(seedId)  { return NIGHT_SEEDS.has(seedId); }
  function isFrostActive()  { return !!(STATE.session.frostEndsAt   && Date.now() < STATE.session.frostEndsAt); }
  function isDroughtActive(){ return !!(STATE.session.droughtEndsAt && Date.now() < STATE.session.droughtEndsAt); }
  function isRainActive()   { return !!(STATE.session.rainEndsAt    && Date.now() < STATE.session.rainEndsAt); }

  // ── Weather event triggers ────────────────────────────────────────────────

  function _startDrought() {
    STATE.session.droughtEndsAt = Date.now() + 60000;
    if (!_firstDrought) { _firstDrought = true; showBanner('☀️ The summer heat is intense.'); }
    log('☀️ A drought has struck the farm!', 'season');
    EventBus.emit('event:drought');
    _showWeatherOverlay('drought');
  }
  function _endDrought() {
    STATE.session.droughtEndsAt = 0;
    _hideWeatherOverlay();
    log('☀️ The drought has passed.', 'season');
  }

  function _startRain() {
    STATE.session.rainEndsAt = Date.now() + 90000;
    if (!_firstRain) { _firstRain = true; showBanner('🌧️ The rains have come.'); }
    log('🌧️ Rain is falling — crops thrive!', 'season');
    EventBus.emit('event:rain');
    _showWeatherOverlay('rain');
  }
  function _endRain() {
    STATE.session.rainEndsAt = 0;
    _hideWeatherOverlay();
    log('🌧️ The rain has stopped.', 'season');
  }

  function _startFrost() {
    STATE.session.frostEndsAt = Date.now() + 30000;
    log('❄️ Frost struck the farm!', 'season');
    EventBus.emit('event:frost');
    _showWeatherOverlay('frost');
  }
  function _endFrost() {
    STATE.session.frostEndsAt = 0;
    _hideWeatherOverlay();
  }

  // ── Weather overlay visuals ───────────────────────────────────────────────

  function _showWeatherOverlay(type) {
    if (!_weatherEl) {
      _weatherEl = document.createElement('div');
      _weatherEl.id = 'weather-overlay';
      _weatherEl.style.cssText = 'position:fixed;inset:0;z-index:8;pointer-events:none;transition:opacity .6s';
      document.body.appendChild(_weatherEl);
    }
    _weatherEl.style.opacity = '0';
    _weatherEl.style.display = 'block';

    if (type === 'drought') {
      _weatherEl.style.background = 'rgba(255,140,0,.11)';
      _weatherEl.innerHTML = '<div style="position:absolute;top:12%;left:50%;transform:translateX(-50%);font-size:52px;opacity:.22;pointer-events:none">☀️</div>';
    } else if (type === 'rain') {
      _weatherEl.style.background = 'rgba(50,80,200,.09)';
      let drops = '';
      for (let i = 0; i < 25; i++) {
        const l = Math.random() * 100, delay = Math.random() * 1.5, dur = 0.55 + Math.random() * 0.35;
        drops += `<div class="rain-drop" style="left:${l}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
      }
      _weatherEl.innerHTML = drops;
    } else if (type === 'frost') {
      _weatherEl.style.background = 'rgba(210,235,255,.14)';
      _weatherEl.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;opacity:.2;letter-spacing:24px;pointer-events:none">❄️ ❄️ ❄️ ❄️</div>';
    }

    requestAnimationFrame(() => { _weatherEl.style.opacity = '1'; });
  }

  function _hideWeatherOverlay() {
    if (!_weatherEl) return;
    _weatherEl.style.opacity = '0';
    setTimeout(() => { if (_weatherEl) _weatherEl.style.display = 'none'; }, 600);
  }

  // ── Seasonal particle decorations ─────────────────────────────────────────

  function _updateParticles(season) {
    if (_particleEl) { _particleEl.remove(); _particleEl = null; }
    if (!season) return;

    _particleEl = document.createElement('div');
    _particleEl.id = 'season-particles';
    _particleEl.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden';

    let html = '';
    if (season.id === 'autumn') {
      const leafEmojis = ['🍂', '🍁'];
      for (let i = 0; i < 9; i++) {
        const l = Math.random() * 100, delay = Math.random() * 10, dur = 5 + Math.random() * 5;
        html += `<div class="season-leaf" style="left:${l.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${dur.toFixed(1)}s">${leafEmojis[i % 2]}</div>`;
      }
    } else if (season.id === 'winter') {
      for (let i = 0; i < 14; i++) {
        const l = Math.random() * 100, delay = Math.random() * 12, dur = 6 + Math.random() * 7;
        html += `<div class="season-snow" style="left:${l.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${dur.toFixed(1)}s">❄</div>`;
      }
    } else if (season.id === 'spring') {
      for (let i = 0; i < 8; i++) {
        const l = Math.random() * 100, delay = Math.random() * 8, dur = 5 + Math.random() * 5;
        html += `<div class="season-petal" style="left:${l.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${dur.toFixed(1)}s">🌸</div>`;
      }
    }
    _particleEl.innerHTML = html;
    document.body.appendChild(_particleEl);
  }

  // ── Season display (top-center, below topbar) ─────────────────────────────

  function _updateSeasonDisplay() {
    if (!_displayEl) return;
    const season = SEASONS && SEASONS[STATE.meta.seasonIndex || 0];
    if (!season) return;
    const elapsed   = (Date.now() - (STATE.meta.seasonStartTime || Date.now())) / 1000;
    const remaining = Math.max(0, season.duration - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    _displayEl.textContent = `${season.emoji} ${season.name} ${mins}:${String(secs).padStart(2, '0')}`;
  }

  // ── 50ms tick ─────────────────────────────────────────────────────────────

  function tick() {
    const season = getCurrentSeason();
    _updateSeasonDisplay();

    if (!season) return;
    const now = Date.now();

    // Drought — summer only
    if (season.id === 'summer') {
      if (!isDroughtActive() && now - _lastDroughtCheck >= 120000) {
        _lastDroughtCheck = now;
        if (Math.random() < 0.05) _startDrought();
      }
      if (isDroughtActive() && now >= STATE.session.droughtEndsAt) _endDrought();
    } else if (isDroughtActive()) {
      _endDrought();
    }

    // Rain — spring/autumn only
    if (season.id === 'spring' || season.id === 'autumn') {
      if (!isRainActive() && now - _lastRainCheck >= 180000) {
        _lastRainCheck = now;
        if (Math.random() < 0.08) _startRain();
      }
      if (isRainActive() && now >= STATE.session.rainEndsAt) _endRain();
    } else if (isRainActive()) {
      _endRain();
    }

    // Frost — winter only
    if (season.id === 'winter') {
      if (!isFrostActive() && now - _lastFrostCheck >= 120000) {
        _lastFrostCheck = now;
        if (Math.random() < 0.06) _startFrost();
      }
      if (isFrostActive() && now >= STATE.session.frostEndsAt) _endFrost();
    } else if (isFrostActive()) {
      _endFrost();
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // Season display element below the topbar
    _displayEl = document.createElement('div');
    _displayEl.id = 'season-display';
    _displayEl.style.cssText = [
      'position:fixed', 'top:44px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:299', 'font-size:11px', 'font-weight:700',
      'color:rgba(255,255,255,.82)', 'pointer-events:none',
      'white-space:nowrap', 'text-shadow:0 1px 4px rgba(0,0,0,.6)',
      'background:rgba(0,0,0,.18)', 'padding:2px 10px',
      'border-radius:0 0 8px 8px',
    ].join(';');
    document.body.appendChild(_displayEl);

    applySeasonEffects();
    const season = SEASONS && SEASONS[STATE.meta.seasonIndex || 0];
    _updateParticles(season);
  }

  return {
    init, tick,
    getCurrentSeason, advanceSeason, applySeasonEffects,
    isNightSeed, isFrostActive, isDroughtActive, isRainActive,
  };
})();
