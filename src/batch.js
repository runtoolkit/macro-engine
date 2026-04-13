/**
 * Batch — collect operations then flush all at once.
 *
 * Equivalent of macro:lib/batch/*  (begin/add/flush/cancel)
 *
 * Useful for grouping side-effects that should be applied atomically.
 */

export class Batch {
  #batches = new Map();   // name → fn[]

  /**
   * Start (or reset) a named batch.
   */
  begin(name) { this.#batches.set(name, []); }

  /**
   * Add a function to the batch.
   */
  add(name, fn) {
    if (!this.#batches.has(name)) this.begin(name);
    this.#batches.get(name).push(fn);
  }

  /**
   * Execute all functions in the batch then clear it.
   */
  flush(name) {
    const fns = this.#batches.get(name);
    if (!fns) return;
    for (const fn of fns) {
      try { fn(); } catch (e) { console.error('[Batch]', e); }
    }
    this.#batches.delete(name);
  }

  /**
   * Cancel a batch without running it.
   */
  cancel(name) { this.#batches.delete(name); }

  size(name) { return this.#batches.get(name)?.length ?? 0; }

  list() { return [...this.#batches.keys()]; }
}
