/**
 * State — per-entity key-value state store.
 */

export class State {
  #store = new Map();   // entity → Map<key, value>

  #entity(entity) {
    if (!this.#store.has(entity)) this.#store.set(entity, new Map());
    return this.#store.get(entity);
  }

  set(entity, key, value) { this.#entity(entity).set(key, value); }
  get(entity, key, defaultValue = undefined) {
    const entityState = this.#store.get(entity);
    return entityState?.has(key) ? entityState.get(key) : defaultValue;
  }
  has(entity, key) { return this.#store.get(entity)?.has(key) ?? false; }
  delete(entity, key) { return this.#store.get(entity)?.delete(key) ?? false; }
  clearAll(entity) { return this.#store.delete(entity); }
  list(entity) { return [...(this.#store.get(entity)?.keys() ?? [])]; }
  listAll() { return [...this.#store.keys()]; }

  increment(entity, key, by = 1) { this.set(entity, key, (this.get(entity, key, 0)) + by); }
  decrement(entity, key, by = 1) { this.increment(entity, key, -by); }
  addDefault(entity, key, value) { if (!this.has(entity, key)) this.set(entity, key, value); }
  clamp(entity, key, min, max) {
    const v = this.get(entity, key, 0);
    this.set(entity, key, Math.min(max, Math.max(min, v)));
  }
  swap(entity, keyA, keyB) {
    const a = this.get(entity, keyA);
    const b = this.get(entity, keyB);
    this.set(entity, keyA, b);
    this.set(entity, keyB, a);
  }
  copy(srcEntity, srcKey, dstEntity, dstKey) { this.set(dstEntity, dstKey, this.get(srcEntity, srcKey)); }

  setFlag(entity, key, value = true) { this.set(entity, key, Boolean(value)); }
  unsetFlag(entity, key) { this.set(entity, key, false); }
  toggleFlag(entity, key) { this.setFlag(entity, key, !this.get(entity, key, false)); }
  getFlag(entity, key) { return Boolean(this.get(entity, key, false)); }

  is(entity, key, value) { return this.get(entity, key) === value; }

  toggle(entity, key, values) {
    if (!Array.isArray(values) || values.length === 0) throw new RangeError('toggle expects a non-empty array of values');
    const current = this.get(entity, key, values[0]);
    const idx = values.indexOf(current);
    this.set(entity, key, values[(idx + 1) % values.length]);
  }
}
