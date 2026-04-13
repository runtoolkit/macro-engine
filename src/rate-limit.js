/**
 * RateLimit — sliding window rate limiter.
 *
 * Equivalent of macro:rate_limit/*
 *
 * Rules are registered with a key, max hits, and window duration.
 * check(key) returns true if the hit is allowed, false if denied.
 *
 * Supports:
 *   - global rules  (key: "global:eventName")
 *   - per-entity    (key: "player:eventName:entityId")
 *   - auto-template (register template "player:eventName", checked per entity)
 */

export class RateLimit {
  #rules = new Map();    // key → { maxHits, windowMs }
  #hits  = new Map();    // key → number[]  (timestamps of allowed hits)

  // ── rule registration ─────────────────────────────────────────

  /**
   * Register a rate limit rule.
   * @param {string} key        e.g. "global:my_event" or "player:shop"
   * @param {number} maxHits    Max hits allowed in window
   * @param {number} windowMs   Window duration in milliseconds
   */
  config(key, maxHits, windowMs) {
    this.#rules.set(key, { maxHits, windowMs });
  }

  hasRule(key) { return this.#rules.has(key); }

  // ── check / consume ───────────────────────────────────────────

  /**
   * Check and consume one hit.
   * @param {string} key   Full key (may be per-entity: "player:shop:alice")
   * @returns {boolean}    true = ALLOWED, false = DENIED
   */
  check(key) {
    const rule = this.#resolveRule(key);
    if (!rule) return true;   // fail-open if no rule

    const now  = Date.now();
    const hits = this.#getHits(key);

    // Prune old hits outside the window
    const window = rule.windowMs;
    while (hits.length > 0 && now - hits[0] > window) hits.shift();

    if (hits.length >= rule.maxHits) return false;   // DENIED

    hits.push(now);
    return true;   // ALLOWED
  }

  /**
   * Check without consuming (peek).
   */
  peek(key) {
    const rule = this.#resolveRule(key);
    if (!rule) return true;
    const now  = Date.now();
    const hits = this.#getHits(key).filter(t => now - t <= rule.windowMs);
    return hits.length < rule.maxHits;
  }

  /** Reset hit history for a key. */
  reset(key) { this.#hits.delete(key); }

  // ── internal ─────────────────────────────────────────────────

  #getHits(key) {
    if (!this.#hits.has(key)) this.#hits.set(key, []);
    return this.#hits.get(key);
  }

  /**
   * Resolve rule for key — supports per-entity keys by looking up template.
   * "player:shop:alice" → checks "player:shop:alice" then "player:shop"
   */
  #resolveRule(key) {
    if (this.#rules.has(key)) return this.#rules.get(key);
    // Try template (drop last segment)
    const parts = key.split(':');
    if (parts.length >= 3) {
      const template = parts.slice(0, -1).join(':');
      if (this.#rules.has(template)) return this.#rules.get(template);
    }
    return null;
  }
}
