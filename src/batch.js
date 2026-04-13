/**
 * Batch — collect operations then flush all at once.
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
    if (typeof fn !== 'function') throw new TypeError('Batch items must be functions');
    if (!this.#batches.has(name)) this.begin(name);
    this.#batches.get(name).push(fn);
  }

  /**
   * Execute all functions in the batch then clear it.
   */
  flush(name) {
    const fns = this.#batches.get(name);
    if (!fns) return 0;
    let count = 0;
    for (const fn of fns) {
      try {
        fn();
        count++;
      } catch (e) {
        console.error('[Batch]', e);
      }
    }
    this.#batches.delete(name);
    return count;
  }

  /**
   * Execute all functions in the batch and await any returned promises.
   */
  async flushAsync(name) {
    const fns = this.#batches.get(name);
    if (!fns) return 0;
    let count = 0;
    for (const fn of fns) {
      try {
        await fn();
        count++;
      } catch (e) {
        console.error('[Batch]', e);
      }
    }
    this.#batches.delete(name);
    return count;
  }

  /**
   * Cancel a batch without running it.
   */
  cancel(name) { this.#batches.delete(name); }

  size(name) { return this.#batches.get(name)?.length ?? 0; }

  list() { return [...this.#batches.keys()]; }
}
