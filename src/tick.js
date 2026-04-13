/**
 * TickLoop — tick pipeline with channel support.
 *
 * Browser-compatible. Optionally offloads the interval to a Worker thread
 * (via TickLoop.fromWorker) to avoid main-thread jank.
 */

export class TickLoop {
  #tickCtr = 0;
  #channels = new Map();   // name → { rate, offset, condition, enabled, fn }
  #paused = false;
  #intervalId = null;
  #msPerTick;

  constructor(msPerTick = 50) {
    const value = Number(msPerTick);
    if (!Number.isFinite(value) || value <= 0) throw new RangeError('msPerTick must be a positive number');
    this.#msPerTick = value;
  }

  /**
   * Create a TickLoop driven by a Worker thread instead of the main thread.
   * The Worker posts a message every msPerTick ms; the main thread dispatches
   * channels on each message. Falls back to regular setInterval if Workers
   * are unavailable (e.g. older browsers, some sandboxed environments).
   *
   * @param {number} msPerTick
   * @param {string} [workerUrl] — URL of tick-worker.js (default: auto-resolved)
   * @returns {{ loop: TickLoop, worker: Worker|null }}
   */
  static fromWorker(msPerTick = 50, workerUrl = null) {
    const loop = new TickLoop(msPerTick);

    if (typeof Worker === 'undefined') {
      // fallback — no Worker support
      return { loop, worker: null };
    }

    const url = workerUrl ?? new URL('./tick-worker.js', import.meta.url).href;
    const worker = new Worker(url);

    // Override start/stop to use Worker messages instead of setInterval
    loop.start = () => {
      worker.onmessage = () => loop.step();
      worker.postMessage({ type: 'start', msPerTick });
      return true;
    };
    loop.stop = () => {
      worker.postMessage({ type: 'stop' });
      worker.onmessage = null;
      return true;
    };

    return { loop, worker };
  }

  start() {
    if (this.#intervalId !== null) return false;
    this.#intervalId = setInterval(() => this.#tick(), this.#msPerTick);
    return true;
  }

  stop() {
    if (this.#intervalId === null) return false;
    clearInterval(this.#intervalId);
    this.#intervalId = null;
    return true;
  }

  pause() { this.#paused = true; }
  resume() { this.#paused = false; }
  get paused() { return this.#paused; }
  get tickCount() { return this.#tickCtr; }

  register(name, fn, { rate = 1, offset = 0, condition = null } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Channel name must be a non-empty string');
    if (typeof fn !== 'function') throw new TypeError('Tick channel fn must be a function');
    const normalizedRate = Math.max(1, Math.floor(Number(rate) || 1));
    const normalizedOffset = Math.floor(Number(offset) || 0);
    if (condition !== null && typeof condition !== 'function') throw new TypeError('condition must be a function or null');
    this.#channels.set(name, { rate: normalizedRate, offset: normalizedOffset, condition, enabled: true, fn });
  }

  unregister(name) { return this.#channels.delete(name); }
  enable(name)  { this.#ch(name).enabled = true; }
  disable(name) { this.#ch(name).enabled = false; }
  setRate(name, rate) { this.#ch(name).rate = Math.max(1, Math.floor(Number(rate) || 1)); }
  setOffset(name, offset) { this.#ch(name).offset = Math.floor(Number(offset) || 0); }
  setCondition(name, condition) {
    if (condition !== null && typeof condition !== 'function') throw new TypeError('condition must be a function or null');
    this.#ch(name).condition = condition;
  }

  list() {
    return [...this.#channels.entries()].map(([name, ch]) => ({
      name,
      rate: ch.rate,
      offset: ch.offset,
      enabled: ch.enabled,
    }));
  }

  step() {
    return this.#tick();
  }

  #tick() {
    if (this.#paused) return 0;
    this.#tickCtr++;
    let fired = 0;
    for (const [, ch] of this.#channels) {
      if (!ch.enabled) continue;
      if ((this.#tickCtr + ch.offset) % ch.rate !== 0) continue;
      if (ch.condition && !ch.condition()) continue;
      try {
        ch.fn(this.#tickCtr);
        fired++;
      } catch (error) {
        console.error('[TickLoop]', error);
      }
    }
    return fired;
  }

  #ch(name) {
    const ch = this.#channels.get(name);
    if (!ch) throw new Error(`TickLoop: channel "${name}" not found`);
    return ch;
  }
}
