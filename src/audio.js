import { STATE } from './state.js';

// ══════════════════════════════
// AUDIO SFX SHIM
// ══════════════════════════════
export var sfx = {
  plant()        { Sfx.playPlant(); },
  harvest()      { Sfx.playHarvest(); },
  drop()         { Sfx.playDrop(); },
  sell(v)        { Sfx.playSell(v); },
  sellAuto()     { Sfx.playAutoSell(); },
  attack()       { Sfx.playCrow(); },
  weedClick()    { Sfx.playWeedClick(); },
  upgrade()      { Sfx.playUpgrade(); },
  stageAdvance() { Sfx.playStage(); },
  locust()       { Sfx.playLocust(); },
};

// Sound effects. Named Sfx because window.Audio is the browser's own Audio constructor.
export const Sfx = (() => {
  let _ctx = null;

  function ctx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }

  // Browsers only allow audio after a user gesture: create the context on the first click/touch.
  function start() {
    document.addEventListener('click',      () => { if (!_ctx) ctx(); }, { once: true });
    document.addEventListener('touchstart', () => { if (!_ctx) ctx(); }, { once: true, passive: true });
  }

  function _play(setup) {
    if (STATE.settings.muted) return;
    try { setup(ctx()); } catch (_) {}
  }

  // White noise buffer helper
  function _noise(c, dur) {
    const frames = Math.ceil(c.sampleRate * dur);
    const buf    = c.createBuffer(1, frames, c.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  return {
    start,

    // ── FARMING ────────────────────────────────────────────────────────────────

    playPlant() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(180, c.currentTime);
        g.gain.setValueAtTime(0.35, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        o.start(); o.stop(c.currentTime + 0.08);
      });
    },

    playHarvest() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(520, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(260, c.currentTime + 0.12);
        g.gain.setValueAtTime(0.4, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
        o.start(); o.stop(c.currentTime + 0.12);
      });
    },

    playDrop() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(140, c.currentTime);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
        o.start(); o.stop(c.currentTime + 0.06);
      });
    },

    playWater() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        o.start(); o.stop(c.currentTime + 0.2);
      });
    },

    playFertilize() {
      _play(c => {
        const o1 = c.createOscillator(), g1 = c.createGain();
        o1.connect(g1); g1.connect(c.destination);
        o1.type = 'sine'; o1.frequency.setValueAtTime(150, c.currentTime);
        g1.gain.setValueAtTime(0.28, c.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o1.start(); o1.stop(c.currentTime + 0.1);

        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.connect(g2); g2.connect(c.destination);
        o2.type = 'sine'; o2.frequency.setValueAtTime(800, c.currentTime);
        g2.gain.setValueAtTime(0.12, c.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        o2.start(); o2.stop(c.currentTime + 0.08);
      });
    },

    playCagePlace() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(600, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.25, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      });
    },

    playWeedClick() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(300, c.currentTime);
        g.gain.setValueAtTime(0.18, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
        o.start(); o.stop(c.currentTime + 0.04);
      });
    },

    playWeedClear() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(520, c.currentTime);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o.start(); o.stop(c.currentTime + 0.1);

        const nb  = _noise(c, 0.08);
        const src = c.createBufferSource(), ng = c.createGain();
        const filt = c.createBiquadFilter();
        src.buffer = nb; filt.type = 'bandpass'; filt.frequency.value = 1200; filt.Q.value = 1;
        src.connect(filt); filt.connect(ng); ng.connect(c.destination);
        ng.gain.setValueAtTime(0.18, c.currentTime + 0.1);
        ng.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
        src.start(c.currentTime + 0.1); src.stop(c.currentTime + 0.18);
      });
    },

    // ── SELL ──────────────────────────────────────────────────────────────────

    playSell(vol = 1.0) {
      _play(c => {
        [880, 1100].forEach(freq => {
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
          g.gain.setValueAtTime(0.20 * vol, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
          o.start(); o.stop(c.currentTime + 0.3);
        });
      });
    },

    playAutoSell() { this.playSell(0.5); },

    // ── EVENTS ────────────────────────────────────────────────────────────────

    playCrow() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.25, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      });
    },

    playHawkAttack() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(600, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        o.start(); o.stop(c.currentTime + 0.2);
      });
    },

    playMoleAttack() {
      _play(c => {
        const lfo = c.createOscillator(), lfoG = c.createGain();
        const o   = c.createOscillator(), g    = c.createGain();
        lfo.frequency.value = 8; lfoG.gain.value = 12;
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(80, c.currentTime);
        g.gain.setValueAtTime(0.35, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        lfo.start(); lfo.stop(c.currentTime + 0.3);
        o.start(); o.stop(c.currentTime + 0.3);
      });
    },

    playRootRot() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(200, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        o.start(); o.stop(c.currentTime + 0.2);
      });
    },

    playLocust() {
      _play(c => {
        const o = c.createOscillator(), lfo = c.createOscillator();
        const lfoG = c.createGain(), g = c.createGain();
        lfo.frequency.setValueAtTime(18, c.currentTime);
        lfoG.gain.setValueAtTime(30, c.currentTime);
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        o.connect(g); g.connect(c.destination);
        o.type = 'sawtooth'; o.frequency.setValueAtTime(120, c.currentTime);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        lfo.start(); lfo.stop(c.currentTime + 0.6);
        o.start(); o.stop(c.currentTime + 0.6);
      });
    },

    playBlightStorm() {
      _play(c => {
        const buf  = _noise(c, 0.8);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 0.5;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.4);
        g.gain.linearRampToValueAtTime(0.001, c.currentTime + 0.8);
        src.start(); src.stop(c.currentTime + 0.8);
      });
    },

    playFungalBloom() {
      _play(c => {
        const lfo = c.createOscillator(), lfoG = c.createGain();
        const o   = c.createOscillator(), g    = c.createGain();
        lfo.frequency.value = 3; lfoG.gain.value = 5;
        lfo.connect(lfoG); lfoG.connect(o.frequency);
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(120, c.currentTime);
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        lfo.start(); lfo.stop(c.currentTime + 0.6);
        o.start(); o.stop(c.currentTime + 0.6);
      });
    },

    playAcidRain() {
      _play(c => {
        const buf  = _noise(c, 0.4);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 3000;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        src.start(); src.stop(c.currentTime + 0.4);
      });
    },

    playVoidRift() {
      _play(c => {
        [60, 90].forEach(freq => {
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
          g.gain.setValueAtTime(0.2, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0);
          o.start(); o.stop(c.currentTime + 1.0);
        });
      });
    },

    playCosmicCrow() {
      _play(c => {
        const o  = c.createOscillator(), ws = c.createWaveShaper(), g = c.createGain();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        ws.curve = curve;
        o.connect(ws); ws.connect(g); g.connect(c.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(300, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.25);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
        o.start(); o.stop(c.currentTime + 0.25);
      });
    },

    playRealityStorm() {
      _play(c => {
        const rumble = c.createOscillator(), rg = c.createGain();
        rumble.connect(rg); rg.connect(c.destination);
        rumble.type = 'sine'; rumble.frequency.setValueAtTime(60, c.currentTime);
        rg.gain.setValueAtTime(0.001, c.currentTime);
        rg.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.4);
        rg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
        rumble.start(); rumble.stop(c.currentTime + 1.2);

        const whine = c.createOscillator(), wg = c.createGain();
        whine.connect(wg); wg.connect(c.destination);
        whine.type = 'sawtooth'; whine.frequency.setValueAtTime(2000, c.currentTime);
        wg.gain.setValueAtTime(0.001, c.currentTime);
        wg.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.3);
        wg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
        whine.start(); whine.stop(c.currentTime + 1.2);
      });
    },

    // ── CRAFTING ──────────────────────────────────────────────────────────────

    playCraftStart() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(300, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      });
    },

    playCraftFinish() {
      _play(c => {
        [660, 880, 1100].forEach((freq, i) => {
          const t = c.currentTime + i * 0.08;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          o.start(t); o.stop(t + 0.08);
        });
      });
    },

    playBlueprintUnlock() {
      _play(c => {
        [523, 659, 784].forEach(freq => {
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
          g.gain.setValueAtTime(0.18, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
          o.start(); o.stop(c.currentTime + 0.6);
        });
      });
    },

    playArtifactCraft() {
      _play(c => {
        [440, 554, 659].forEach((freq, i) => {
          const t   = c.currentTime + i * 0.02;
          const o   = c.createOscillator(), g = c.createGain();
          const dly = c.createDelay(0.5), dlyG = c.createGain();
          dly.delayTime.value = 0.15; dlyG.gain.value = 0.28;
          o.connect(g); g.connect(c.destination);
          g.connect(dly); dly.connect(dlyG); dlyG.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.22, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
          o.start(t); o.stop(t + 1.2);
        });
      });
    },

    // ── SHOP ──────────────────────────────────────────────────────────────────

    playSeedPurchase() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(1200, c.currentTime);
        g.gain.setValueAtTime(0.18, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
        o.start(); o.stop(c.currentTime + 0.06);
      });
    },

    playBagPurchase() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        o.start(); o.stop(c.currentTime + 0.2);
      });
    },

    playUpgrade() {
      _play(c => {
        [440, 660, 880].forEach((freq, i) => {
          const t = c.currentTime + i * 0.08;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          o.start(t); o.stop(t + 0.08);
        });
      });
    },

    // ── PRESTIGE & STAGE ──────────────────────────────────────────────────────

    playPrestige() {
      _play(c => {
        [261, 329, 392, 523].forEach((freq, i) => {
          const t = c.currentTime + i * 0.05;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
          o.start(t); o.stop(t + 2.0);
        });
      });
    },

    playStage() {
      _play(c => {
        const stage = STATE.meta.stage || 0;
        [523, 659, 784].forEach(freq => {
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
          g.gain.setValueAtTime(0.20, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
          o.start(); o.stop(c.currentTime + 0.8);
        });
        if (stage >= 4) {
          const r = c.createOscillator(), rg = c.createGain();
          r.connect(rg); rg.connect(c.destination);
          r.type = 'sine'; r.frequency.setValueAtTime(60, c.currentTime);
          rg.gain.setValueAtTime(0.001, c.currentTime);
          rg.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.25);
          rg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
          r.start(); r.stop(c.currentTime + 1.2);
        }
      });
    },

    // ── UI ────────────────────────────────────────────────────────────────────

    playModalOpen() {
      _play(c => {
        const buf  = _noise(c, 0.1);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 2000; filt.Q.value = 2;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.12, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        src.start(); src.stop(c.currentTime + 0.1);
      });
    },

    playModalClose() {
      _play(c => {
        const buf  = _noise(c, 0.08);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 1500; filt.Q.value = 2;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        src.start(); src.stop(c.currentTime + 0.08);
      });
    },

    playTooltipShow() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(1400, c.currentTime);
        g.gain.setValueAtTime(0.05, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
        o.start(); o.stop(c.currentTime + 0.03);
      });
    },

    // ── SEASONS ───────────────────────────────────────────────────────────────

    playSeasonChange() {
      _play(c => {
        [392, 494, 587].forEach((freq, i) => {
          const t = c.currentTime + i * 0.06;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          o.start(t); o.stop(t + 0.8);
        });
      });
    },

    playDrought() {
      _play(c => {
        const buf  = _noise(c, 0.3);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'highpass'; filt.frequency.value = 2500;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.18, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        src.start(); src.stop(c.currentTime + 0.3);
      });
    },

    playRain() {
      _play(c => {
        const buf  = _noise(c, 1.0);
        const src  = c.createBufferSource();
        const filt = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 800; filt.Q.value = 0.6;
        src.connect(filt); filt.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.001, c.currentTime);
        g.gain.linearRampToValueAtTime(0.22, c.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0.001, c.currentTime + 1.0);
        src.start(); src.stop(c.currentTime + 1.0);
      });
    },

    playFrost() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(2000, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(1000, c.currentTime + 0.2);
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
        o.start(); o.stop(c.currentTime + 0.2);
      });
    },

    // ── TRADING POST ──────────────────────────────────────────────────────────

    playTradingPostOpen() {
      _play(c => {
        [300, 400, 500].forEach((freq, i) => {
          const t = c.currentTime + i * 0.04;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.14, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          o.start(t); o.stop(t + 0.4);
        });
      });
    },

    playDealPurchase() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(800, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.30, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      });
    },

    playMysteryReveal() {
      _play(c => {
        // Rapid noise bursts (drum-roll simulation)
        for (let i = 0; i < 8; i++) {
          const t   = c.currentTime + i * 0.045;
          const buf = _noise(c, 0.03);
          const src = c.createBufferSource(), ng = c.createGain();
          const filt = c.createBiquadFilter();
          src.buffer = buf; filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 2;
          src.connect(filt); filt.connect(ng); ng.connect(c.destination);
          ng.gain.setValueAtTime(0.18 + i * 0.015, t);
          ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          src.start(t); src.stop(t + 0.03);
        }
        // Resolution chord
        [330, 415, 494].forEach((freq, i) => {
          const t = c.currentTime + 0.42 + i * 0.02;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.22, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          o.start(t); o.stop(t + 0.35);
        });
      });
    },

    playMysteryWin() {
      _play(c => {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const t = c.currentTime + i * 0.07;
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.25, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          o.start(t); o.stop(t + 0.25);
        });
      });
    },

    playMysteryLoss() {
      _play(c => {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(300, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.4);
        g.gain.setValueAtTime(0.28, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        o.start(); o.stop(c.currentTime + 0.4);
      });
    },

    setupMute() {
      STATE.settings.muted = localStorage.getItem('bliss_muted') === '1';
      const muteBtn = document.getElementById('mute-btn');
      muteBtn.textContent = STATE.settings.muted ? '🔇' : '🔊';
      muteBtn.addEventListener('click', e => {
        e.stopPropagation();
        STATE.settings.muted = !STATE.settings.muted;
        localStorage.setItem('bliss_muted', STATE.settings.muted ? '1' : '0');
        muteBtn.textContent = STATE.settings.muted ? '🔇' : '🔊';
      });
    },
  };
})();
