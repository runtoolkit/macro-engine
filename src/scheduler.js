/**
 * Scheduler — delayed / repeated execution primitives.
 */

export class Scheduler {
  #schedules = new Map();
  #usedOnce  = new Set();

  schedule(key, fn, delay, interval = 0) {
    if (typeof key !== 'string' || !key.trim()) throw new TypeError('Schedule key must be a non-empty string');
    if (typeof fn !== 'function') throw new TypeError('Scheduled fn must be a function');
    const wait = Math.max(0, Number(delay) || 0);
    const repeat = Math.max(0, Number(interval) || 0);

    this.cancel(key);
    const run = () => {
      try { fn(); } catch (error) { console.error('[Scheduler]', error); }
      if (repeat > 0) {
        const id = setInterval(() => {
          try { fn(); } catch (error) { console.error('[Scheduler]', error); }
        }, repeat);
        this.#schedules.set(key, { timerId: id, fn, interval: repeat, repeated: true });
      } else {
        this.#schedules.delete(key);
      }
    };

    const id = setTimeout(run, wait);
    this.#schedules.set(key, { timerId: id, fn, interval: repeat, repeated: false });
  }

  scheduleEvery(key, fn, interval) {
    this.schedule(key, fn, 0, interval);
  }

  cancel(key) {
    const entry = this.#schedules.get(key);
    if (!entry) return false;
    (entry.repeated ? clearInterval : clearTimeout)(entry.timerId);
    this.#schedules.delete(key);
    return true;
  }

  cancelAll() {
    for (const key of [...this.#schedules.keys()]) this.cancel(key);
  }

  list() { return [...this.#schedules.keys()]; }

  repeat(fn, n, interval) {
    if (typeof fn !== 'function') throw new TypeError('repeat fn must be a function');
    let count = 0;
    const id = setInterval(() => {
      try { fn(count); } catch (error) { console.error('[Scheduler]', error); }
      if (++count >= n) clearInterval(id);
    }, Math.max(0, Number(interval) || 0));
    return () => clearInterval(id);
  }

  wait(ms) { return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0))); }

  debounce(fn, delay) {
    if (typeof fn !== 'function') throw new TypeError('debounce fn must be a function');
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { timer = null; fn(...args); }, Math.max(0, Number(delay) || 0));
    };
  }

  throttle(fn, interval) {
    if (typeof fn !== 'function') throw new TypeError('throttle fn must be a function');
    let last = Number.NEGATIVE_INFINITY;
    const wait = Math.max(0, Number(interval) || 0);
    return (...args) => {
      const now = Date.now();
      if (now - last < wait) return;
      last = now;
      fn(...args);
    };
  }

  once(key, fn) {
    if (this.#usedOnce.has(key)) return false;
    this.#usedOnce.add(key);
    try { fn(); } catch (error) { console.error('[Scheduler]', error); }
    return true;
  }

  resetOnce(key) { this.#usedOnce.delete(key); }

  tickGuard(key, tickId, fn) {
    const guard = `${key}::${tickId}`;
    if (this.#usedOnce.has(guard)) return false;
    this.#usedOnce.add(guard);
    try { fn(); } catch (error) { console.error('[Scheduler]', error); }
    return true;
  }

  clearTickGuard(key) {
    for (const guard of [...this.#usedOnce]) {
      if (guard.startsWith(`${key}::`)) this.#usedOnce.delete(guard);
    }
  }
}
