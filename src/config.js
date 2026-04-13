/**
 * Config — global key-value config store with defaults.
 */

export class Config {
  #store = new Map();
  #defaults = new Map();

  setDefault(key, value) {
    this.#defaults.set(key, value);
    if (!this.#store.has(key)) this.#store.set(key, value);
    return this;
  }

  set(key, value) { this.#store.set(key, value); return this; }
  get(key, defaultValue = undefined) { return this.#store.has(key) ? this.#store.get(key) : defaultValue; }
  has(key) { return this.#store.has(key); }
  delete(key) { return this.#store.delete(key); }

  reset(key) {
    if (this.#defaults.has(key)) this.#store.set(key, this.#defaults.get(key));
    else this.#store.delete(key);
  }

  clear() { this.#store.clear(); }
  list() { return [...this.#store.entries()].map(([key, value]) => ({ key, value })); }
  entries() { return [...this.#store.entries()]; }
  merge(entries) { for (const [key, value] of entries) this.set(key, value); return this; }
}
