/**
 * TickLoop — tick pipeline with channel support.
 *
 * Equivalent of macro:tick / macro:tick/channel/*
 *
 * Channels are named sub-loops with configurable:
 *   - rate    : fire every N ticks
 *   - offset  : start offset within the rate window
 *   - condition : () => bool — channel skips tick if false
 */

export class TickLoop {
  #tickCtr = 0;
  #channels = new Map();   // name → { rate, offset, condition, enabled, fn }
  #paused = false;
  #intervalId = null;
  #msPerTick;

  /**
   * @param {number} msPerTick  Milliseconds per tick (default 50 = 20 TPS)
   */
  constructor(msPerTick = 50) {
    this.#msPerTick = msPerTick;
  }

  // ── lifecycle ────────────────────────────────────────────────

  start() {
    if (this.#intervalId !== null) return;
    this.#intervalId = setInterval(() => this.#tick(), this.#msPerTick);
  }

  stop() {
    if (this.#intervalId === null) return;
    clearInterval(this.#intervalId);
    this.#intervalId = null;
  }

  pause() { this.#paused = true; }
  resume() { this.#paused = false; }
  get paused() { return this.#paused; }
  get tickCount() { return this.#tickCtr; }

  // ── channel API ──────────────────────────────────────────────

  /**
   * Register a tick channel.
   * @param {string}   name
   * @param {Function} fn          Called each time channel fires
   * @param {object}   [opts]
   * @param {number}   [opts.rate=1]
   * @param {number}   [opts.offset=0]
   * @param {Function} [opts.condition]   () => bool
   */
  register(name, fn, { rate = 1, offset = 0, condition = null } = {}) {
    this.#channels.set(name, { rate, offset, condition, enabled: true, fn });
  }

  unregister(name) { this.#channels.delete(name); }

  enable(name)  { this.#ch(name).enabled = true; }
  disable(name) { this.#ch(name).enabled = false; }

  setRate(name, rate)           { this.#ch(name).rate = rate; }
  setOffset(name, offset)       { this.#ch(name).offset = offset; }
  setCondition(name, condition) { this.#ch(name).condition = condition; }

  list() {
    return [...this.#channels.entries()].map(([name, ch]) => ({
      name,
      rate: ch.rate,
      offset: ch.offset,
      enabled: ch.enabled,
    }));
  }

  // ── internal ─────────────────────────────────────────────────

  #tick() {
    if (this.#paused) return;
    this.#tickCtr++;
    for (const [, ch] of this.#channels) {
      if (!ch.enabled) continue;
      if ((this.#tickCtr + ch.offset) % ch.rate !== 0) continue;
      if (ch.condition && !ch.condition()) continue;
      try { ch.fn(this.#tickCtr); } catch (e) { console.error('[TickLoop]', e); }
    }
  }

  #ch(name) {
    const ch = this.#channels.get(name);
    if (!ch) throw new Error(`TickLoop: channel "${name}" not found`);
    return ch;
  }
}
