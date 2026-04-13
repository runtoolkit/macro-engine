/**
 * Config — global key-value config store with defaults.
 *
 * Equivalent of macro:config/*  (get/set/has/delete/reset/set_default/list)
 */

export class Config {
  #store    = new Map();
  #defaults = new Map();

  // ── defaults ──────────────────────────────────────────────────

  setDefault(key, value) {
    this.#defaults.set(key, value);
    if (!this.#store.has(key)) this.#store.set(key, value);
  }

  // ── CRUD ─────────────────────────────────────────────────────

  set(key, value) { this.#store.set(key, value); }

  get(key) { return this.#store.get(key); }

  has(key) { return this.#store.has(key); }

  delete(key) { this.#store.delete(key); }

  /** Reset key to its default value (or delete if no default). */
  reset(key) {
    if (this.#defaults.has(key)) this.#store.set(key, this.#defaults.get(key));
    else this.#store.delete(key);
  }

  list() { return [...this.#store.entries()].map(([k, v]) => ({ key: k, value: v })); }
}
