/**
 * Scheduler — delayed / repeated execution primitives.
 *
 * Equivalent of macro:lib/schedule, macro:lib/repeat,
 * macro:lib/wait, macro:lib/debounce, macro:lib/throttle,
 * macro:lib/once, macro:lib/once_per_player, macro:lib/sync_tick
 *
 * All durations are in milliseconds.
 */

export class Scheduler {
  #schedules = new Map();   // key → { timerId, fn, interval }
  #usedOnce  = new Set();   // keys for once()

  // ── schedule / cancel ────────────────────────────────────────

  /**
   * Schedule fn to run after `delay` ms, then every `interval` ms if given.
   * @param {string}   key       Unique name (cancellable)
   * @param {Function} fn
   * @param {number}   delay     ms until first call
   * @param {number}   [interval]  ms between repeats (omit for one-shot)
   */
  schedule(key, fn, delay, interval = 0) {
    this.cancel(key);
    const run = () => {
      try { fn(); } catch (e) { console.error('[Scheduler]', e); }
      if (interval > 0) {
        const id = setInterval(() => {
          try { fn(); } catch (e) { console.error('[Scheduler]', e); }
        }, interval);
        this.#schedules.set(key, { timerId: id, fn, interval, repeated: true });
      } else {
        this.#schedules.delete(key);
      }
    };
    const id = setTimeout(run, delay);
    this.#schedules.set(key, { timerId: id, fn, interval, repeated: false });
  }

  /** Cancel a scheduled task by key. */
  cancel(key) {
    const entry = this.#schedules.get(key);
    if (!entry) return;
    (entry.repeated ? clearInterval : clearTimeout)(entry.timerId);
    this.#schedules.delete(key);
  }

  /** List all active schedule keys. */
  list() { return [...this.#schedules.keys()]; }

  // ── repeat ───────────────────────────────────────────────────

  /**
   * Repeat fn N times with `interval` ms between calls.
   * @param {Function} fn
   * @param {number}   n          Number of times
   * @param {number}   interval   ms between calls
   * @returns {Function}          cancel()
   */
  repeat(fn, n, interval) {
    let count = 0;
    const id = setInterval(() => {
      try { fn(count); } catch (e) { console.error('[Scheduler]', e); }
      if (++count >= n) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }

  // ── wait ─────────────────────────────────────────────────────

  /**
   * Returns a Promise that resolves after `ms` milliseconds.
   */
  wait(ms) { return new Promise(res => setTimeout(res, ms)); }

  // ── debounce ─────────────────────────────────────────────────

  /**
   * Returns a debounced version of fn.
   * Only fires after `delay` ms of silence.
   */
  debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { timer = null; fn(...args); }, delay);
    };
  }

  // ── throttle ─────────────────────────────────────────────────

  /**
   * Returns a throttled version of fn.
   * Fires at most once per `interval` ms.
   */
  throttle(fn, interval) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last < interval) return;
      last = now;
      fn(...args);
    };
  }

  // ── once ─────────────────────────────────────────────────────

  /**
   * Run fn only the first time this key is seen.
   */
  once(key, fn) {
    if (this.#usedOnce.has(key)) return;
    this.#usedOnce.add(key);
    try { fn(); } catch (e) { console.error('[Scheduler]', e); }
  }

  resetOnce(key) { this.#usedOnce.delete(key); }

  // ── tick guard ───────────────────────────────────────────────

  /**
   * Run fn only once per unique (key, tickId) combination.
   * Useful when multiple code paths could trigger the same effect in one tick.
   */
  tickGuard(key, tickId, fn) {
    const guard = `${key}::${tickId}`;
    if (this.#usedOnce.has(guard)) return;
    this.#usedOnce.add(guard);
    try { fn(); } catch (e) { console.error('[Scheduler]', e); }
  }

  clearTickGuard(key) {
    for (const g of this.#usedOnce) {
      if (g.startsWith(`${key}::`)) this.#usedOnce.delete(g);
    }
  }
}
