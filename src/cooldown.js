/**
 * Cooldown — per-entity, per-key cooldown tracking.
 *
 * Equivalent of macro:cooldown/*
 *
 * Duration is expressed in milliseconds (tick-based callers can multiply by msPerTick).
 */

export class Cooldown {
  /** @type {Map<string, Map<string, { expiresAt: number, pausedAt?: number }>>} */
  #store = new Map();

  // ── internal helpers ─────────────────────────────────────────

  #entity(entity) {
    if (!this.#store.has(entity)) this.#store.set(entity, new Map());
    return this.#store.get(entity);
  }

  #now() { return Date.now(); }

  // ── API ──────────────────────────────────────────────────────

  /**
   * Set a cooldown.
   * @param {string} entity   Arbitrary entity id (player name, uuid, …)
   * @param {string} key      Cooldown key
   * @param {number} duration Milliseconds
   */
  set(entity, key, duration) {
    this.#entity(entity).set(key, { expiresAt: this.#now() + duration });
  }

  /**
   * Check remaining ms. Returns 0 if ready.
   */
  remaining(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry) return 0;
    if (entry.pausedAt != null) return entry.expiresAt - entry.pausedAt;
    return Math.max(0, entry.expiresAt - this.#now());
  }

  /**
   * Returns true if cooldown has expired (or never set).
   */
  isReady(entity, key) { return this.remaining(entity, key) === 0; }

  /**
   * Alias: returns 1 if on cooldown, 0 if ready (matches original output).
   */
  check(entity, key) { return this.remaining(entity, key) > 0 ? 1 : 0; }

  /** Extend by additional ms. */
  extend(entity, key, ms) {
    const entry = this.#entity(entity).get(key);
    if (!entry) return;
    entry.expiresAt += ms;
  }

  /** Pause cooldown countdown. */
  pause(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry || entry.pausedAt != null) return;
    entry.pausedAt = this.#now();
  }

  /** Resume a paused cooldown. */
  resume(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry || entry.pausedAt == null) return;
    const elapsed = this.#now() - entry.pausedAt;
    entry.expiresAt += elapsed;
    delete entry.pausedAt;
  }

  /** Clear a specific cooldown. */
  clear(entity, key) { this.#entity(entity).delete(key); }

  /** Clear all cooldowns for an entity. */
  clearAll(entity) { this.#store.delete(entity); }

  /** Debug: dump all cooldowns for an entity. */
  detail(entity) {
    const map = this.#entity(entity);
    return [...map.entries()].map(([key, entry]) => ({
      key,
      remaining: this.remaining(entity, key),
      paused: entry.pausedAt != null,
    }));
  }
}
