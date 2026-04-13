/**
 * HookSystem — bind/unbind named lifecycle hooks.
 */

export const HOOKS = Object.freeze([
  'on_start', 'on_stop', 'on_connect', 'on_disconnect',
  'on_join', 'on_leave', 'on_error', 'on_ready',
  'on_message', 'on_command', 'on_tick', 'on_update',
  'on_state_change', 'on_config_change', 'on_event',
  'on_before_flush', 'on_after_flush',
]);

export class HookSystem {
  #bindings = new Map();   // hookName → [ { id, fn, filter? } ]
  #debug = false;

  setDebug(on) { this.#debug = Boolean(on); }

  bind(hookName, id, fn, { filter = null } = {}) {
    if (typeof hookName !== 'string' || !hookName.trim()) throw new TypeError('Hook name must be a non-empty string');
    if (typeof id !== 'string' || !id.trim()) throw new TypeError('Binding id must be a non-empty string');
    if (typeof fn !== 'function') throw new TypeError('Hook handler must be a function');

    if (!this.#bindings.has(hookName)) this.#bindings.set(hookName, []);
    const list = this.#bindings.get(hookName);
    const existing = list.findIndex((b) => b.id === id);
    if (existing !== -1) list.splice(existing, 1);
    list.push({ id, fn, filter });
    if (this.#debug) console.log(`[HookSystem] bind ${hookName} → ${id}`);
  }

  unbind(id, hookName = null) {
    if (typeof id !== 'string' || !id.trim()) return;
    const targets = hookName === null
      ? [...this.#bindings.values()]
      : [this.#bindings.get(hookName)].filter(Boolean);

    for (const list of targets) {
      const idx = list.findIndex((b) => b.id === id);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  unbindAll(hookName) { this.#bindings.delete(hookName); }

  dispatch(hookName, ctx) {
    const list = this.#bindings.get(hookName);
    if (!list || list.length === 0) return 0;
    if (this.#debug) console.log(`[HookSystem] dispatch ${hookName}`);
    let count = 0;
    for (const { fn, filter } of [...list]) {
      if (filter && !filter(ctx)) continue;
      try {
        fn(ctx);
        count++;
      } catch (error) {
        console.error('[HookSystem]', error);
      }
    }
    return count;
  }

  list(hookName = null) {
    if (hookName) return (this.#bindings.get(hookName) ?? []).map((b) => b.id);
    return [...this.#bindings.entries()].flatMap(([hook, list]) => list.map((b) => ({ hook, id: b.id })));
  }
}
