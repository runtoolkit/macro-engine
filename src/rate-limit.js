/**
 * RateLimit — sliding window rate limiter.
 *
 * Uses performance.now() for sub-millisecond precision where available,
 * falls back to Date.now().
 */

const now = (typeof performance !== 'undefined' && typeof performance.now === 'function')
  ? () => performance.now()
  : () => Date.now();

export class RateLimit {
  #rules = new Map();
  #hits  = new Map();

  config(key, maxHits, windowMs) {
    if (typeof key !== 'string' || !key.trim()) throw new TypeError('Rate limit key must be a non-empty string');
    const hits = Number(maxHits);
    const window = Number(windowMs);
    if (!Number.isFinite(hits) || hits < 1) throw new RangeError('maxHits must be a positive number');
    if (!Number.isFinite(window) || window < 1) throw new RangeError('windowMs must be a positive number');
    this.#rules.set(key, { maxHits: Math.floor(hits), windowMs: Math.floor(window) });
  }

  hasRule(key) { return this.#rules.has(key); }

  check(key) {
    const rule = this.#resolveRule(key);
    if (!rule) return true;

    const t = now();
    const hits = this.#getHits(key);
    const window = rule.windowMs;

    while (hits.length > 0 && t - hits[0] > window) hits.shift();
    if (hits.length >= rule.maxHits) return false;

    hits.push(t);
    return true;
  }

  peek(key) {
    const rule = this.#resolveRule(key);
    if (!rule) return true;
    const t = now();
    const hits = this.#getHits(key).filter((ts) => t - ts <= rule.windowMs);
    return hits.length < rule.maxHits;
  }

  remaining(key) {
    const rule = this.#resolveRule(key);
    if (!rule) return Infinity;
    const hits = this.#getHits(key);
    if (hits.length < rule.maxHits) return 0;
    const t = now();
    return Math.max(0, rule.windowMs - (t - hits[0]));
  }

  reset(key) { this.#hits.delete(key); }

  cleanup() {
    const t = now();
    for (const [key, hits] of this.#hits.entries()) {
      const rule = this.#resolveRule(key);
      if (!rule) continue;
      const filtered = hits.filter((ts) => t - ts <= rule.windowMs);
      if (filtered.length === 0) this.#hits.delete(key);
      else this.#hits.set(key, filtered);
    }
  }

  #getHits(key) {
    if (!this.#hits.has(key)) this.#hits.set(key, []);
    return this.#hits.get(key);
  }

  #resolveRule(key) {
    if (this.#rules.has(key)) return this.#rules.get(key);
    const parts = String(key).split(':');
    if (parts.length >= 3) {
      const template = parts.slice(0, -1).join(':');
      if (this.#rules.has(template)) return this.#rules.get(template);
    }
    return null;
  }
}
