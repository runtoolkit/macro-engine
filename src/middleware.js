/**
 * MiddlewareStack — tiny async middleware pipeline.
 *
 * Middlewares receive (state, next) and may mutate the shared state object.
 * The final handler receives the same state and returns the final result.
 */

export class MiddlewareStack {
  #items = [];

  use(fn, { name = fn?.name || 'middleware' } = {}) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be a function');
    const entry = { fn, name };
    this.#items.push(entry);
    return () => this.remove(entry);
  }

  remove(target) {
    const index = this.#items.findIndex((entry) => entry === target || entry.fn === target || entry.name === target);
    if (index === -1) return false;
    this.#items.splice(index, 1);
    return true;
  }

  clear() {
    this.#items.length = 0;
  }

  list() {
    return this.#items.map(({ name }, index) => ({ index, name }));
  }

  async run(state, terminal) {
    if (typeof terminal !== 'function') throw new TypeError('terminal must be a function');

    const stack = [...this.#items];
    let index = -1;

    const dispatch = async (i, nextState = state) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      const entry = stack[i];
      if (!entry) return terminal(nextState);

      return entry.fn(nextState, (updatedState = nextState) => dispatch(i + 1, updatedState));
    };

    return dispatch(0, state);
  }
}
