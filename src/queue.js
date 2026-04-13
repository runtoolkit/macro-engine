/**
 * Queue — FIFO function queue with configurable and adaptive drain rate.
 *
 * Adaptive mode: automatically scales the drain rate between min and max
 * based on queue depth. Useful under bursty or high-frequency load.
 */

export class Queue {
  #items = [];
  #rate  = 1;

  // adaptive drain
  #adaptive    = false;
  #adaptiveMin = 1;
  #adaptiveMax = 1;

  constructor({ rate = 1 } = {}) {
    this.setRate(rate);
  }

  setRate(rate) {
    const value = Number(rate);
    if (!Number.isFinite(value) || value < 1) throw new RangeError('Queue rate must be a positive number');
    this.#rate = Math.floor(value);
    this.#adaptive = false;
  }

  /**
   * Enable adaptive drain.
   * Rate scales linearly from min (empty queue) to max (queue >= max items).
   */
  setAdaptiveRate(min, max) {
    const lo = Math.floor(Number(min));
    const hi = Math.floor(Number(max));
    if (!Number.isFinite(lo) || lo < 1) throw new RangeError('adaptiveMin must be >= 1');
    if (!Number.isFinite(hi) || hi < lo) throw new RangeError('adaptiveMax must be >= adaptiveMin');
    this.#adaptiveMin = lo;
    this.#adaptiveMax = hi;
    this.#rate = lo;
    this.#adaptive = true;
  }

  get adaptiveEnabled() { return this.#adaptive; }

  push(fn) {
    if (typeof fn !== 'function') throw new TypeError('Queue items must be functions');
    this.#items.push(fn);
  }

  pushMany(items) {
    for (const item of items) this.push(item);
  }

  pushAs(fn, ctx) {
    if (typeof fn !== 'function') throw new TypeError('Queue items must be functions');
    this.#items.push(() => fn(ctx));
  }

  size() { return this.#items.length; }
  clear() { this.#items.length = 0; }

  flush() {
    const rate = this.#adaptive ? this.#resolveAdaptiveRate() : this.#rate;
    const count = Math.min(rate, this.#items.length);
    for (let i = 0; i < count; i++) {
      const fn = this.#items.shift();
      try { fn(); } catch (error) { console.error('[Queue]', error); }
    }
    return count;
  }

  flushAll() {
    const items = this.#items.splice(0);
    for (const fn of items) {
      try { fn(); } catch (error) { console.error('[Queue]', error); }
    }
    return items.length;
  }

  #resolveAdaptiveRate() {
    const depth = this.#items.length;
    if (depth === 0) return this.#adaptiveMin;
    if (depth >= this.#adaptiveMax) return this.#adaptiveMax;
    // linear scale between min and max
    const t = depth / this.#adaptiveMax;
    return Math.max(this.#adaptiveMin, Math.round(
      this.#adaptiveMin + t * (this.#adaptiveMax - this.#adaptiveMin)
    ));
  }
}
