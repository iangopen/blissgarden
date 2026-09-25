export const Particles = (() => {
  function _particle(x, y, w, h, css, dx, dy, gravity, duration, scaleEnd, fadeStart) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;pointer-events:none;z-index:9997;width:${w}px;height:${h}px;left:${x}px;top:${y}px;${css}`;
    document.body.appendChild(el);
    const start = performance.now();
    (function tick(now) {
      const t  = Math.min(1, (now - start) / duration);
      const e  = 1 - Math.pow(1 - t, 2);
      const tx = dx * e, ty = dy * e + gravity * t * t;
      const sc = 1 + (scaleEnd - 1) * t;
      const op = t < fadeStart ? 1 : 1 - (t - fadeStart) / (1 - fadeStart);
      el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${sc})`;
      el.style.opacity = op;
      if (t < 1) requestAnimationFrame(tick); else el.remove();
    })(start);
  }

  return {
    coinBurst(x, y) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i / 8) + (Math.random() - 0.5) * 0.7;
        const dist  = 40 + Math.random() * 40;
        _particle(x, y, 9, 9,
          'border-radius:50%;background:radial-gradient(circle at 35% 35%,#F5C518,#D4A017);border:1px solid #A07800;',
          Math.cos(angle) * dist, Math.sin(angle) * dist,
          22 + Math.random() * 12, 500 + Math.random() * 120, 0.5, 0.55);
      }
    },

    leafBurst(x, y) {
      for (let i = 0; i < 5; i++) {
        const angle = (-Math.PI * 5 / 6) + Math.random() * (Math.PI * 2 / 3);
        const dist  = 28 + Math.random() * 32;
        const size  = 5 + Math.random() * 4;
        const hue   = 95 + Math.floor(Math.random() * 35);
        const rot   = (Math.random() - 0.5) * 300;
        const el    = document.createElement('div');
        el.style.cssText = `position:fixed;pointer-events:none;z-index:9997;width:${size}px;height:${size * 1.7}px;left:${x}px;top:${y}px;border-radius:50% 50% 50% 8%;background:hsl(${hue},62%,36%);`;
        document.body.appendChild(el);
        const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
        const dur = 350 + Math.random() * 80;
        const start = performance.now();
        (function tick(now) {
          const t = Math.min(1, (now - start) / dur);
          const e = 1 - Math.pow(1 - t, 2);
          el.style.transform = `translate(calc(-50% + ${dx * e}px), calc(-50% + ${dy * e + 14 * t * t}px)) rotate(${rot * t}deg)`;
          el.style.opacity = t < 0.45 ? 1 : 1 - (t - 0.45) / 0.55;
          if (t < 1) requestAnimationFrame(tick); else el.remove();
        })(start);
      }
    },

    dirtPuff(x, y) {
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i / 4) + (Math.random() - 0.5) * 0.8;
        const dist  = 14 + Math.random() * 16;
        const size  = 5 + Math.random() * 5;
        _particle(x, y, size, size,
          'border-radius:50%;background:rgba(88,55,28,0.7);',
          Math.cos(angle) * dist, Math.sin(angle) * dist,
          0, 260 + Math.random() * 60, 1.5, 0.25);
      }
    },
  };
})();
