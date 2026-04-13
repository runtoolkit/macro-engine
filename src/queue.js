/**
 * Queue — FIFO command queue with configurable drain rate.
 *
 * Equivalent of macro:queue/*
 *
 * Each tick (or flush call) processes up to `rate` items.
 * Items are arbitrary functions or objects.
 */

export class Queue {
  #items = [];
  #rate  = 1;       // items processed per flush

  constructor({ rate = 1 } = {}) {
    this.#rate = rate;
  }

  // ── configuration ─────────────────────────────────────────────

  setRate(rate) { this.#rate = Math.max(1, rate); }

  // ── push ─────────────────────────────────────────────────────

  /**
   * Push a function to the queue.
   */
  push(fn) { this.#items.push(fn); }

  /** Push with a context object — fn(ctx) will be called. */
  pushAs(fn, ctx) { this.#items.push(() => fn(ctx)); }

  size() { return this.#items.length; }

  clear() { this.#items.length = 0; }

  // ── drain ─────────────────────────────────────────────────────

  /**
   * Process up to `rate` items from the queue.
   * Call this from a TickLoop channel or setInterval.
   * @returns {number} number of items processed
   */
  flush() {
    const count = Math.min(this.#rate, this.#items.length);
    for (let i = 0; i < count; i++) {
      const fn = this.#items.shift();
      try { fn(); } catch (e) { console.error('[Queue]', e); }
    }
    return count;
  }

  /**
   * Flush ALL items immediately (ignores rate).
   */
  flushAll() {
    const items = this.#items.splice(0);
    for (const fn of items) {
      try { fn(); } catch (e) { console.error('[Queue]', e); }
    }
  }
}
