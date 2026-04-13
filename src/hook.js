/**
 * HookSystem — bind/unbind named lifecycle hooks.
 *
 * Equivalent of macro:hook/*
 *
 * Hooks are named action points that external code can bind handlers to.
 * Unlike EventBus which is driven by fire(), HookSystem hooks are
 * dispatch-driven — the host calls dispatch(name, ctx) at the right moment.
 *
 * Built-in hooks mirror the original hook names:
 *   on_break_block, on_placed_block, on_eat, on_player_death,
 *   on_player_join, on_player_respawn, on_entity_kill, on_fish_caught,
 *   on_trade, on_item_use, on_dimension_change, on_sneak_start,
 *   on_sneak_stop, on_sprint_start, on_sprint_stop, on_jump,
 *   on_elytra_start, on_elytra_stop, on_interact_anvil,
 *   on_interact_shulker_box, on_level_up, on_target_hit,
 *   on_open_chest, on_using_item, on_killed_by_arrow,
 *   on_hero_of_the_village, on_drop
 */

export const HOOKS = Object.freeze([
  'on_break_block', 'on_placed_block', 'on_eat', 'on_player_death',
  'on_player_join', 'on_player_respawn', 'on_entity_kill', 'on_fish_caught',
  'on_trade', 'on_item_use', 'on_dimension_change', 'on_sneak_start',
  'on_sneak_stop', 'on_sprint_start', 'on_sprint_stop', 'on_jump',
  'on_elytra_start', 'on_elytra_stop', 'on_interact_anvil',
  'on_interact_shulker_box', 'on_level_up', 'on_target_hit',
  'on_open_chest', 'on_using_item', 'on_killed_by_arrow',
  'on_hero_of_the_village', 'on_drop',
]);

export class HookSystem {
  #bindings = new Map();   // hookName → [ { id, fn, filter? } ]
  #debug = false;

  setDebug(on) { this.#debug = on; }

  /**
   * Bind a handler to a hook.
   * @param {string}   hookName
   * @param {string}   id         Unique binding id (for unbind)
   * @param {Function} fn         (ctx) => void
   * @param {object}   [opts]
   * @param {Function} [opts.filter]  (ctx) => bool — skip if false
   */
  bind(hookName, id, fn, { filter = null } = {}) {
    if (!this.#bindings.has(hookName)) this.#bindings.set(hookName, []);
    const list = this.#bindings.get(hookName);
    const existing = list.findIndex(b => b.id === id);
    if (existing !== -1) list.splice(existing, 1);
    list.push({ id, fn, filter });
    if (this.#debug) console.log(`[HookSystem] bind ${hookName} → ${id}`);
  }

  /**
   * Unbind by id (removes from all hooks if hookName omitted).
   */
  unbind(id, hookName = null) {
    const targets = hookName
      ? [this.#bindings.get(hookName)].filter(Boolean)
      : [...this.#bindings.values()];
    for (const list of targets) {
      const idx = list.findIndex(b => b.id === id);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  unbindAll(hookName) { this.#bindings.delete(hookName); }

  /**
   * Dispatch a hook — calls all bound handlers.
   * @param {string} hookName
   * @param {*}      ctx
   */
  dispatch(hookName, ctx) {
    const list = this.#bindings.get(hookName);
    if (!list || list.length === 0) return;
    if (this.#debug) console.log(`[HookSystem] dispatch ${hookName}`);
    for (const { fn, filter } of list) {
      if (filter && !filter(ctx)) continue;
      try { fn(ctx); } catch (e) { console.error('[HookSystem]', e); }
    }
  }

  list(hookName = null) {
    if (hookName) return (this.#bindings.get(hookName) ?? []).map(b => b.id);
    return [...this.#bindings.entries()].flatMap(([h, list]) =>
      list.map(b => ({ hook: h, id: b.id }))
    );
  }
}
