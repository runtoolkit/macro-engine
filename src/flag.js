/**
 * FlagStore — boolean flags and named toggles.
 *
 * A lightweight, standalone replacement for the missing flag.js export.
 */

export class FlagStore {
  #store = new Map(); // entity → Map<key, boolean>

  #entity(entity) {
    if (!this.#store.has(entity)) this.#store.set(entity, new Map());
    return this.#store.get(entity);
  }

  set(entity, key, value = true) {
    this.#entity(entity).set(key, Boolean(value));
  }

  get(entity, key, defaultValue = false) {
    const entityFlags = this.#store.get(entity);
    if (!entityFlags || !entityFlags.has(key)) return defaultValue;
    return entityFlags.get(key);
  }

  has(entity, key) {
    return this.#store.get(entity)?.has(key) ?? false;
  }

  delete(entity, key) {
    this.#store.get(entity)?.delete(key);
  }

  toggle(entity, key) {
    const next = !this.get(entity, key, false);
    this.set(entity, key, next);
    return next;
  }

  clear(entity, key) {
    if (typeof key === 'undefined') this.#store.delete(entity);
    else this.delete(entity, key);
  }

  list(entity) {
    return [...(this.#store.get(entity)?.entries() ?? [])].map(([key, value]) => ({ key, value }));
  }

  listEntities() {
    return [...this.#store.keys()];
  }
}

export const Flag = FlagStore;
