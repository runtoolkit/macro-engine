/**
 * EventBus — register/fire/unregister named events.
 *
 * Equivalent of macro:event/*
 *
 * Supports:
 *  - multiple handlers per event
 *  - fire with context payload
 *  - queued (deferred) fire
 *  - once-handlers
 */

export class EventBus {
  #events = new Map();   // name → handler[]
  #queue  = [];          // deferred { name, ctx }[]
  #debug  = false;

  setDebug(on) { this.#debug = on; }

  // ── registration ─────────────────────────────────────────────

  /**
   * Register a handler for an event.
   * @param {string}   name
   * @param {Function} fn    (ctx) => void | Promise<void>
   * @param {object}   [opts]
   * @param {boolean}  [opts.once]   Auto-unregister after first fire
   * @returns {Function} unregister function
   */
  register(name, fn, { once = false } = {}) {
    if (!this.#events.has(name)) this.#events.set(name, []);
    const entry = { fn, once };
    this.#events.get(name).push(entry);
    if (this.#debug) console.log(`[EventBus] register → ${name}`);
    return () => this.unregisterOne(name, fn);
  }

  unregister(name) {
    this.#events.delete(name);
  }

  unregisterOne(name, fn) {
    const handlers = this.#events.get(name);
    if (!handlers) return;
    const idx = handlers.findIndex(h => h.fn === fn);
    if (idx !== -1) handlers.splice(idx, 1);
    if (handlers.length === 0) this.#events.delete(name);
  }

  has(name) { return this.#events.has(name) && this.#events.get(name).length > 0; }

  count(name) { return this.#events.get(name)?.length ?? 0; }

  list() { return [...this.#events.keys()]; }

  // ── firing ───────────────────────────────────────────────────

  /**
   * Fire event synchronously.
   * @param {string} name
   * @param {*}      [ctx]   Arbitrary context passed to handlers
   */
  fire(name, ctx) {
    const handlers = this.#events.get(name);
    if (!handlers || handlers.length === 0) {
      if (this.#debug) console.log(`[EventBus] fire SKIP ${name} — no handlers`);
      return;
    }
    if (this.#debug) console.log(`[EventBus] fire → ${name}`);
    const snapshot = [...handlers];
    for (const entry of snapshot) {
      try { entry.fn(ctx); } catch (e) { console.error('[EventBus]', e); }
      if (entry.once) this.unregisterOne(name, entry.fn);
    }
  }

  /**
   * Fire event asynchronously (each handler awaited in order).
   */
  async fireAsync(name, ctx) {
    const handlers = this.#events.get(name);
    if (!handlers || handlers.length === 0) return;
    const snapshot = [...handlers];
    for (const entry of snapshot) {
      try { await entry.fn(ctx); } catch (e) { console.error('[EventBus]', e); }
      if (entry.once) this.unregisterOne(name, entry.fn);
    }
  }

  /**
   * Enqueue a fire — processed when flushQueue() is called.
   */
  fireQueued(name, ctx) {
    this.#queue.push({ name, ctx });
  }

  /**
   * Process all queued events.
   */
  flushQueue() {
    const items = this.#queue.splice(0);
    for (const { name, ctx } of items) this.fire(name, ctx);
  }

  clearQueue() { this.#queue.length = 0; }
}
