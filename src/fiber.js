/**
 * Fiber — cooperative coroutines via async generators.
 *
 * Equivalent of macro:lib/fiber/*  (spawn/yield/resume/kill/is_alive)
 *
 * A fiber is an async generator function that can yield at any point.
 * The caller controls when execution resumes (resume() / auto-resume via TickLoop).
 *
 * Example:
 *
 *   async function* myFiber(fiber) {
 *     console.log('start');
 *     await fiber.yield();          // pause until resume()
 *     console.log('continued');
 *     await fiber.wait(500);        // pause for 500ms then auto-resume
 *     console.log('done');
 *   }
 *
 *   const fibers = new FiberManager();
 *   fibers.spawn('intro', myFiber);
 *   fibers.resume('intro');          // manual resume after a yield
 */

class FiberHandle {
  constructor(id) {
    this.id = id;
    this._alive = false;
    this._gen   = null;
    this._resolve = null;   // resolves the current yield promise
  }

  /** Yield from inside a fiber — suspends until resume() is called externally. */
  yield() {
    return new Promise(res => { this._resolve = res; });
  }

  /** Wait for ms then auto-resume — no external resume needed. */
  wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  get alive() { return this._alive; }
}

export class FiberManager {
  #fibers = new Map();   // id → FiberHandle

  /**
   * Spawn a fiber. If a fiber with the same id exists it is replaced.
   * @param {string}            id
   * @param {AsyncGeneratorFunction} generatorFn   (handle: FiberHandle) => AsyncGenerator
   */
  spawn(id, generatorFn) {
    this.kill(id);
    const handle = new FiberHandle(id);
    handle._alive = true;
    handle._gen   = generatorFn(handle);
    this.#fibers.set(id, handle);
    // Run to first yield point automatically
    this.#step(handle);
    return handle;
  }

  /** Resume a suspended fiber (resolves its current yield()). */
  resume(id) {
    const h = this.#fibers.get(id);
    if (!h || !h._alive) return;
    if (h._resolve) {
      const res = h._resolve;
      h._resolve = null;
      res();
    }
  }

  /** Kill a fiber — it stops at its next yield point. */
  kill(id) {
    const h = this.#fibers.get(id);
    if (!h) return;
    h._alive = false;
    if (h._resolve) { h._resolve(); h._resolve = null; }
    if (h._gen?.return) h._gen.return();
    this.#fibers.delete(id);
  }

  isAlive(id) { return this.#fibers.get(id)?._alive ?? false; }

  list() { return [...this.#fibers.keys()]; }

  // ── internal ─────────────────────────────────────────────────

  async #step(handle) {
    try {
      while (handle._alive) {
        const { done } = await handle._gen.next();
        if (done) break;
        // After each yield, wait for resume() to fire _resolve
        // (already handled inside FiberHandle.yield())
      }
    } catch (e) {
      console.error(`[Fiber:${handle.id}]`, e);
    } finally {
      handle._alive = false;
      this.#fibers.delete(handle.id);
    }
  }
}
