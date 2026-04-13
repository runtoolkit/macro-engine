/**
 * Cooldown — per-entity, per-key cooldown tracking.
 */

export class Cooldown {
  #store = new Map();

  #entity(entity) {
    if (!this.#store.has(entity)) this.#store.set(entity, new Map());
    return this.#store.get(entity);
  }

  #now() { return Date.now(); }

  set(entity, key, duration) {
    const ms = Math.max(0, Number(duration) || 0);
    this.#entity(entity).set(key, { expiresAt: this.#now() + ms });
  }

  remaining(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry) return 0;
    if (entry.pausedAt != null) return Math.max(0, entry.expiresAt - entry.pausedAt);
    return Math.max(0, entry.expiresAt - this.#now());
  }

  isReady(entity, key) { return this.remaining(entity, key) === 0; }
  check(entity, key) { return this.remaining(entity, key) > 0 ? 1 : 0; }

  extend(entity, key, ms) {
    const entry = this.#entity(entity).get(key);
    if (!entry) return false;
    entry.expiresAt += Math.max(0, Number(ms) || 0);
    return true;
  }

  pause(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry || entry.pausedAt != null) return false;
    entry.pausedAt = this.#now();
    return true;
  }

  resume(entity, key) {
    const entry = this.#entity(entity).get(key);
    if (!entry || entry.pausedAt == null) return false;
    const elapsed = this.#now() - entry.pausedAt;
    entry.expiresAt += elapsed;
    delete entry.pausedAt;
    return true;
  }

  clear(entity, key) { return this.#entity(entity).delete(key); }
  clearAll(entity) { return this.#store.delete(entity); }

  detail(entity) {
    const map = this.#entity(entity);
    return [...map.entries()].map(([key, entry]) => ({
      key,
      remaining: this.remaining(entity, key),
      paused: entry.pausedAt != null,
    }));
  }
}
