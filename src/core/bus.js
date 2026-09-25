// EventBus and TimerManager have no dependencies, so any module can import them without pulling in
// engine.js (which imports half the render layer).
// ══════════════════════════════
// EVENT BUS
// ══════════════════════════════
export const EventBus = {
  listeners: {},
  on(e, fn)  { (this.listeners[e] ??= []).push(fn); },
  off(e, fn) { if (this.listeners[e]) this.listeners[e] = this.listeners[e].filter(f => f !== fn); },
  emit(e, data) { (this.listeners[e] ?? []).slice().forEach(fn => fn(data)); },
};

// ══════════════════════════════
// TIMER MANAGER
// ══════════════════════════════
// interval may be a number or a () => number function (for dynamic timers).
// restart(id) resets elapsed so the timer picks up the current interval fresh.
export const TimerManager = {
  timers: {},

  register(id, { interval, fn, condition }) {
    this.timers[id] = { interval, fn, condition, elapsed: 0 };
  },

  unregister(id) {
    delete this.timers[id];
  },

  restart(id) {
    if (this.timers[id]) this.timers[id].elapsed = 0;
  },

  getRemaining(id) {
    const t = this.timers[id];
    if (!t) return 0;
    const interval = typeof t.interval === 'function' ? t.interval() : t.interval;
    return Math.max(0, interval - t.elapsed);
  },

  tick() {
    for (const t of Object.values(this.timers)) {
      t.elapsed += 50;
      const interval = typeof t.interval === 'function' ? t.interval() : t.interval;
      if (t.elapsed >= interval && t.condition()) {
        t.fn();
        t.elapsed = 0;
      }
    }
  },
};
