/**
 * Fiber — cooperative coroutines via async generators.
 */

class FiberHandle {
  constructor(id) {
    this.id = id;
    this._alive = false;
    this._gen = null;
    this._resolve = null;
    this._pendingResumes = 0;
  }

  yield() {
    if (this._pendingResumes > 0) {
      this._pendingResumes--;
      return Promise.resolve();
    }
    return new Promise((resolve) => { this._resolve = resolve; });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }

  get alive() { return this._alive; }
}

export class FiberManager {
  #fibers = new Map();

  spawn(id, generatorFn) {
    if (typeof id !== 'string' || !id.trim()) throw new TypeError('Fiber id must be a non-empty string');
    if (typeof generatorFn !== 'function') throw new TypeError('Fiber generator must be a function');

    this.kill(id);
    const handle = new FiberHandle(id);
    handle._alive = true;
    handle._gen = generatorFn(handle);
    if (!handle._gen || typeof handle._gen.next !== 'function') {
      handle._alive = false;
      throw new TypeError('Fiber generatorFn must return an async generator');
    }
    this.#fibers.set(id, handle);
    void this.#step(handle);
    return handle;
  }

  resume(id) {
    const handle = this.#fibers.get(id);
    if (!handle || !handle._alive) return false;
    if (handle._resolve) {
      const resolve = handle._resolve;
      handle._resolve = null;
      resolve();
    } else {
      handle._pendingResumes++;
    }
    return true;
  }

  kill(id) {
    const handle = this.#fibers.get(id);
    if (!handle) return false;
    handle._alive = false;
    if (handle._resolve) {
      const resolve = handle._resolve;
      handle._resolve = null;
      resolve();
    }
    if (handle._gen?.return) {
      try { void handle._gen.return(); } catch (_) {}
    }
    this.#fibers.delete(id);
    return true;
  }

  isAlive(id) { return this.#fibers.get(id)?._alive ?? false; }
  list() { return [...this.#fibers.keys()]; }

  async #step(handle) {
    try {
      while (handle._alive) {
        const { done } = await handle._gen.next();
        if (done) break;
      }
    } catch (error) {
      console.error(`[Fiber:${handle.id}]`, error);
    } finally {
      handle._alive = false;
      this.#fibers.delete(handle.id);
    }
  }
}
