/**
 * Queue — FIFO command queue with configurable drain rate.
 */

export class Queue {
  #items = [];
  #rate  = 1;       // items processed per flush

  constructor({ rate = 1 } = {}) {
    this.setRate(rate);
  }

  setRate(rate) {
    const value = Number(rate);
    if (!Number.isFinite(value) || value < 1) throw new RangeError('Queue rate must be a positive number');
    this.#rate = Math.floor(value);
  }

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
    const count = Math.min(this.#rate, this.#items.length);
    for (let i = 0; i < count; i++) {
      const fn = this.#items.shift();
      try {
        fn();
      } catch (error) {
        console.error('[Queue]', error);
      }
    }
    return count;
  }

  flushAll() {
    const items = this.#items.splice(0);
    for (const fn of items) {
      try {
        fn();
      } catch (error) {
        console.error('[Queue]', error);
      }
    }
    return items.length;
  }
}
