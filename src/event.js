/**
 * EventBus — register/fire/unregister named events.
 *
 * Supports:
 *  - multiple handlers per event
 *  - sync and async dispatch
 *  - queued (deferred) fire
 *  - once-handlers
 */

export class EventBus {
  #events = new Map();   // name → handler[]
  #queue  = [];          // deferred { name, ctx }[]
  #debug  = false;

  setDebug(on) { this.#debug = Boolean(on); }

  register(name, fn, { once = false } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Event name must be a non-empty string');
    if (typeof fn !== 'function') throw new TypeError('Event handler must be a function');

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
    const idx = handlers.findIndex((h) => h.fn === fn);
    if (idx !== -1) handlers.splice(idx, 1);
    if (handlers.length === 0) this.#events.delete(name);
  }

  clear() {
    this.#events.clear();
    this.#queue.length = 0;
  }

  has(name) { return this.#events.has(name) && this.#events.get(name).length > 0; }
  count(name) { return this.#events.get(name)?.length ?? 0; }
  list() { return [...this.#events.keys()]; }

  fire(name, ctx) {
    const handlers = this.#events.get(name);
    if (!handlers || handlers.length === 0) {
      if (this.#debug) console.log(`[EventBus] fire SKIP ${name} — no handlers`);
      return { ok: true, count: 0 };
    }
    if (this.#debug) console.log(`[EventBus] fire → ${name}`);
    const snapshot = [...handlers];
    let count = 0;
    for (const entry of snapshot) {
      try {
        entry.fn(ctx);
        count++;
      } catch (error) {
        console.error('[EventBus]', error);
      }
      if (entry.once) this.unregisterOne(name, entry.fn);
    }
    return { ok: true, count };
  }

  async fireAsync(name, ctx) {
    const handlers = this.#events.get(name);
    if (!handlers || handlers.length === 0) return { ok: true, count: 0 };
    const snapshot = [...handlers];
    let count = 0;
    for (const entry of snapshot) {
      try {
        await entry.fn(ctx);
        count++;
      } catch (error) {
        console.error('[EventBus]', error);
      }
      if (entry.once) this.unregisterOne(name, entry.fn);
    }
    return { ok: true, count };
  }

  fireQueued(name, ctx) {
    this.#queue.push({ name, ctx });
  }

  flushQueue() {
    const items = this.#queue.splice(0);
    let count = 0;
    for (const { name, ctx } of items) {
      const result = this.fire(name, ctx);
      count += result.count;
    }
    return count;
  }

  async flushQueueAsync() {
    const items = this.#queue.splice(0);
    let count = 0;
    for (const { name, ctx } of items) {
      const result = await this.fireAsync(name, ctx);
      count += result.count;
    }
    return count;
  }

  clearQueue() { this.#queue.length = 0; }
}
