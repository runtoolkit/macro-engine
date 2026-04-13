/**
 * CommandSystem — safe, general-purpose single and multi command execution.
 *
 * No eval, no shell execution, no platform-specific dependency.
 * Commands are registered functions; strings are parsed as command lines.
 */

import { parseScript, splitScript } from './script.js';
import { MiddlewareStack } from './middleware.js';

const DEFAULT_MODE = 'series';

function cloneValue(value) {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)]));
}

function withTimeout(promise, timeoutMs, label = 'command') {
  const ms = Number(timeoutMs) || 0;
  if (ms <= 0) return Promise.resolve(promise);

  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timerId));
}

export function tokenizeCommandLine(input) {
  if (typeof input !== 'string') throw new TypeError('Command line must be a string');

  const tokens = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const ch of input.trim()) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current.length) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }

  if (escaped) current += '\\';
  if (quote) throw new SyntaxError('Unclosed quote in command line');
  if (current.length) tokens.push(current);
  return tokens;
}

export function normalizeCommand(input) {
  if (typeof input === 'function') {
    return { kind: 'function', fn: input, args: [] };
  }

  if (typeof input === 'string') {
    const scriptParts = splitScript(input);
    if (scriptParts.length > 1) {
      return { kind: 'batch', items: scriptParts };
    }

    const [name = '', ...args] = tokenizeCommandLine(scriptParts[0] ?? input);
    return { kind: 'command', name, args, raw: input };
  }

  if (Array.isArray(input)) {
    return { kind: 'batch', items: input };
  }

  if (input && typeof input === 'object') {
    const name = input.name ?? input.cmd ?? input.command ?? '';
    const args = Array.isArray(input.args)
      ? [...input.args]
      : input.args == null ? [] : [input.args];
    return {
      kind: input.kind ?? (name ? 'command' : 'object'),
      name,
      args,
      context: input.context ?? input.ctx ?? null,
      meta: input.meta ? cloneValue(input.meta) : undefined,
      raw: input,
    };
  }

  throw new TypeError('Unsupported command input');
}

export class CommandRegistry {
  #commands = new Map();
  #aliases = new Map();

  register(name, handler, { aliases = [], description = '', meta = {} } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Command name must be a non-empty string');
    if (typeof handler !== 'function') throw new TypeError(`Handler for command "${name}" must be a function`);

    const record = { name, handler, description, meta: cloneValue(meta) };
    this.#commands.set(name, record);

    for (const alias of aliases) {
      if (typeof alias !== 'string' || !alias.trim()) continue;
      this.#aliases.set(alias, name);
    }

    return () => this.unregister(name);
  }

  unregister(name) {
    this.#commands.delete(name);
    for (const [alias, target] of [...this.#aliases.entries()]) {
      if (target === name) this.#aliases.delete(alias);
    }
  }

  resolve(name) {
    return this.#commands.get(this.#aliases.get(name) ?? name) ?? null;
  }

  has(name) {
    return this.resolve(name) !== null;
  }

  list() {
    return [...this.#commands.values()].map(({ name, description, meta }) => ({
      name,
      description,
      meta: cloneValue(meta),
    }));
  }
}

export class SingleCommandRunner {
  constructor(registry, { allowUnknown = false, timeoutMs = 0 } = {}) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('SingleCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.allowUnknown = allowUnknown;
    this.timeoutMs = Math.max(0, Number(timeoutMs) || 0);
  }

  async run(input, context = {}, options = {}) {
    const normalized = normalizeCommand(input);
    const startedAt = Date.now();
    const timeoutMs = Math.max(0, Number(options.timeoutMs ?? context.timeoutMs ?? this.timeoutMs) || 0);

    try {
      if (normalized.kind === 'batch') {
        const batch = new MultiCommandRunner(this.registry, {
          mode: 'series',
          timeoutMs,
          allowUnknown: options.allowUnknown ?? this.allowUnknown,
        });
        return await batch.run(normalized.items, context, options);
      }

      if (normalized.kind === 'function') {
        const value = await withTimeout(
          normalized.fn({ ...cloneValue(context), command: normalized }),
          timeoutMs,
          'function command',
        );
        return { ok: true, value, command: normalized, durationMs: Date.now() - startedAt };
      }

      const name = normalized.name;
      const record = this.registry.resolve(name);
      if (!record) {
        if (this.allowUnknown || options.allowUnknown) {
          return { ok: true, skipped: true, command: normalized, durationMs: Date.now() - startedAt };
        }
        throw new Error(`Unknown command: ${name}`);
      }

      const commandContext = {
        ...cloneValue(context),
        args: normalized.args,
        command: normalized,
        registry: this.registry,
      };
      if (normalized.context && typeof normalized.context === 'object') {
        Object.assign(commandContext, cloneValue(normalized.context));
      }

      const value = await withTimeout(
        record.handler(commandContext),
        timeoutMs,
        `command "${name}"`,
      );
      return { ok: true, value, command: normalized, durationMs: Date.now() - startedAt };
    } catch (error) {
      return { ok: false, error, command: normalized, durationMs: Date.now() - startedAt };
    }
  }
}

export class MultiCommandRunner {
  constructor(registry, { mode = DEFAULT_MODE, concurrency = 4, stopOnError = false, timeoutMs = 0, allowUnknown = false } = {}) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('MultiCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.mode = mode;
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.stopOnError = Boolean(stopOnError);
    this.timeoutMs = Math.max(0, Number(timeoutMs) || 0);
    this.allowUnknown = Boolean(allowUnknown);
  }

  async run(inputs, context = {}, options = {}) {
    const mode = options.mode ?? this.mode;
    const runner = new SingleCommandRunner(this.registry, {
      allowUnknown: options.allowUnknown ?? this.allowUnknown,
      timeoutMs: options.timeoutMs ?? this.timeoutMs,
    });
    const list = Array.isArray(inputs) ? inputs : [inputs];
    const startedAt = Date.now();

    if (mode === 'parallel') {
      const results = await this.#runParallel(list, runner, context, options);
      return this.#summarize(results, startedAt);
    }

    const results = [];
    for (const item of list) {
      const result = await runner.run(item, context, options);
      results.push(result);
      if (!result.ok && (options.stopOnError ?? this.stopOnError)) break;
    }
    return this.#summarize(results, startedAt);
  }

  async enqueue(inputs, context = {}, options = {}) {
    return this.run(inputs, context, options);
  }

  async #runParallel(list, runner, context, options) {
    const results = new Array(list.length);
    let nextIndex = 0;
    let aborted = false;
    const limit = Math.min(this.concurrency, list.length);
    const stopOnError = options.stopOnError ?? this.stopOnError;

    const workers = Array.from({ length: limit }, async () => {
      while (true) {
        if (aborted) return;
        const index = nextIndex++;
        if (index >= list.length) return;
        const result = await runner.run(list[index], context, options);
        results[index] = result;
        if (!result.ok && stopOnError) {
          aborted = true;
          return;
        }
      }
    });

    await Promise.all(workers);

    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        results[i] = {
          ok: false,
          skipped: true,
          error: new Error('Command was skipped due to stopOnError'),
          durationMs: 0,
        };
      }
    }

    return results;
  }

  #summarize(results, startedAt) {
    const ok = results.filter((result) => result.ok).length;
    const failed = results.length - ok;
    return {
      ok: failed === 0,
      total: results.length,
      success: ok,
      failed,
      results,
      durationMs: Date.now() - startedAt,
    };
  }
}

export class CommandSystem {
  #queue = [];

  constructor(options = {}) {
    const { mode = DEFAULT_MODE, concurrency = 4, stopOnError = false, timeoutMs = 0 } = options;
    this.registry = new CommandRegistry();
    this.single = new SingleCommandRunner(this.registry, { allowUnknown: options.allowUnknown ?? false, timeoutMs });
    this.multi = new MultiCommandRunner(this.registry, { mode, concurrency, stopOnError, timeoutMs, allowUnknown: options.allowUnknown ?? false });
    this.middleware = new MiddlewareStack();
  }

  use(fn, meta) {
    return this.middleware.use(fn, meta);
  }

  clearMiddleware() {
    this.middleware.clear();
  }

  listMiddleware() {
    return this.middleware.list();
  }

  register(name, handler, options) {
    return this.registry.register(name, handler, options);
  }

  unregister(name) { this.registry.unregister(name); }
  has(name) { return this.registry.has(name); }
  list() { return this.registry.list(); }

  async run(input, context = {}, options = {}) {
    const state = { input, context, options, system: this };
    return this.middleware.run(state, async (nextState) => this.single.run(nextState.input, nextState.context, nextState.options ?? options));
  }

  async runMany(inputs, context = {}, options = {}) { return this.multi.run(inputs, context, options); }

  async runScript(source, context = {}, options = {}) {
    const script = parseScript(source, options.script ?? {});
    if (script.length === 0) {
      return { ok: true, total: 0, success: 0, failed: 0, results: [], durationMs: 0 };
    }
    if (script.length === 1) return this.run(script[0], context, options);
    return this.runMany(script, context, options);
  }

  enqueue(input, context = {}) {
    this.#queue.push({ input, context });
    return this.#queue.length;
  }

  async flush(options = {}) {
    const items = this.#queue.splice(0);
    if (items.length === 0) return { ok: true, total: 0, success: 0, failed: 0, results: [], durationMs: 0 };

    const startedAt = Date.now();
    const results = [];
    for (const { input, context } of items) {
      const result = await this.run(input, context, options);
      results.push(result);
      if (!result.ok && options.stopOnError) break;
    }

    const success = results.filter((result) => result.ok).length;
    return {
      ok: success === results.length,
      total: results.length,
      success,
      failed: results.length - success,
      results,
      durationMs: Date.now() - startedAt,
    };
  }
}
