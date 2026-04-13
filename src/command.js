/**
 * CommandSystem — safe, general-purpose single and multi command execution.
 *
 * No eval, no shell execution, no platform-specific dependency.
 * Commands are registered functions; strings are parsed as command lines.
 */

import { splitCommandScript } from './script.js';

const DEFAULT_MODE = 'series';
const DEFAULT_TIMEOUT_MS = 0;

function cloneValue(value, seen = new WeakMap()) {
  if (value == null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const list = [];
    seen.set(value, list);
    for (const item of value) list.push(cloneValue(item, seen));
    return list;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;

  const copy = {};
  seen.set(value, copy);
  for (const [key, entry] of Object.entries(value)) {
    copy[key] = cloneValue(entry, seen);
  }
  return copy;
}

function normalizeStringList(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (input == null) return [];
  return [String(input).trim()].filter(Boolean);
}

function hasPermissionSource(source, name) {
  if (source == null) return false;
  const key = String(name);

  if (source instanceof Set) return source.has(key) || source.has('*') || source.has('all');
  if (Array.isArray(source)) return source.includes(key) || source.includes('*') || source.includes('all');
  if (source instanceof Map) {
    if (source.has(key)) return Boolean(source.get(key));
    if (source.has('*')) return Boolean(source.get('*'));
    if (source.has('all')) return Boolean(source.get('all'));
    return false;
  }
  if (typeof source === 'object') {
    return Boolean(source[key] || source['*'] || source.all);
  }
  return false;
}

function hasAllPermissions(context, required) {
  const requirements = normalizeStringList(required);
  if (requirements.length === 0) return true;

  const source = context?.permissions ?? context?.permission ?? context?.perms ?? null;
  if (source == null) return false;

  return requirements.every((permission) => hasPermissionSource(source, permission));
}

function withTimeout(promiseLike, timeoutMs, label = 'command') {
  const ms = Math.max(0, Number(timeoutMs) || 0);
  if (!ms) return Promise.resolve(promiseLike);

  let timerId = null;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const error = new Error(`${label} timed out after ${ms}ms`);
      error.code = 'ERR_COMMAND_TIMEOUT';
      reject(error);
    }, ms);
  });

  return Promise.race([
    Promise.resolve(promiseLike).finally(() => {
      if (timerId !== null) clearTimeout(timerId);
    }),
    timeout,
  ]);
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
    const [name = '', ...args] = tokenizeCommandLine(input);
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

  register(name, handler, { aliases = [], description = '', meta = {}, requires = [] } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Command name must be a non-empty string');
    if (typeof handler !== 'function') throw new TypeError(`Handler for command "${name}" must be a function`);

    const normalizedAliases = normalizeStringList(aliases).filter((alias) => alias !== name);
    const normalizedRequires = normalizeStringList(requires);

    const record = {
      name,
      handler,
      description,
      meta: cloneValue(meta),
      aliases: normalizedAliases,
      requires: normalizedRequires,
    };

    this.#commands.set(name, record);

    for (const alias of normalizedAliases) {
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

  get(name) {
    return this.resolve(name);
  }

  has(name) {
    return this.resolve(name) !== null;
  }

  list() {
    return [...this.#commands.values()].map(({ name, description, meta, aliases, requires }) => ({
      name,
      description,
      meta: cloneValue(meta),
      aliases: [...aliases],
      requires: [...requires],
    }));
  }
}

export class SingleCommandRunner {
  constructor(registry, { allowUnknown = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('SingleCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.allowUnknown = allowUnknown;
    this.timeoutMs = Math.max(0, Number(timeoutMs) || 0);
  }

  async run(input, context = {}) {
    const normalized = normalizeCommand(input);
    const startedAt = Date.now();

    try {
      if (normalized.kind === 'batch') {
        const batch = new MultiCommandRunner(this.registry, {
          mode: 'series',
          allowUnknown: this.allowUnknown,
          timeoutMs: this.timeoutMs,
        });
        return await batch.run(normalized.items, context);
      }

      if (normalized.kind === 'function') {
        const value = await withTimeout(
          normalized.fn({ ...cloneValue(context), command: normalized }),
          context?.timeoutMs ?? this.timeoutMs,
          'function command'
        );
        return { ok: true, value, command: normalized, durationMs: Date.now() - startedAt };
      }

      const name = normalized.name;
      const record = this.registry.resolve(name);
      if (!record) {
        if (this.allowUnknown) {
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

      if (!hasAllPermissions(commandContext, record.requires)) {
        const error = new Error(`Permission denied for command "${record.name}"`);
        error.code = 'ERR_COMMAND_PERMISSION';
        return { ok: false, error, command: normalized, durationMs: Date.now() - startedAt };
      }

      const timeoutMs = context?.timeoutMs ?? this.timeoutMs;
      const value = await withTimeout(
        record.handler(commandContext),
        timeoutMs,
        `command "${record.name}"`
      );
      return { ok: true, value, command: normalized, durationMs: Date.now() - startedAt };
    } catch (error) {
      return { ok: false, error, command: normalized, durationMs: Date.now() - startedAt };
    }
  }
}

async function runParallelLimited(list, limit, runner, stopOnError = false) {
  const results = new Array(list.length);
  let cursor = 0;
  let failed = false;

  const workers = Array.from(
    { length: Math.min(Math.max(1, limit), list.length) },
    async () => {
      while (true) {
        if (stopOnError && failed) break;
        const index = cursor++;
        if (index >= list.length) break;

        const result = await runner(list[index], index);
        results[index] = result;
        if (stopOnError && !result.ok) failed = true;
      }
    }
  );

  await Promise.all(workers);
  return results;
}

export class MultiCommandRunner {
  constructor(
    registry,
    {
      mode = DEFAULT_MODE,
      concurrency = 4,
      stopOnError = false,
      allowUnknown = false,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = {}
  ) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('MultiCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.mode = mode;
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.stopOnError = Boolean(stopOnError);
    this.allowUnknown = Boolean(allowUnknown);
    this.timeoutMs = Math.max(0, Number(timeoutMs) || 0);
  }

  async run(inputs, context = {}, options = {}) {
    const mode = options.mode ?? this.mode;
    const concurrency = options.concurrency ?? this.concurrency;
    const stopOnError = Boolean(options.stopOnError ?? this.stopOnError);
    const allowUnknown = Boolean(options.allowUnknown ?? this.allowUnknown);
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;

    const runner = new SingleCommandRunner(this.registry, { allowUnknown, timeoutMs });
    const list = Array.isArray(inputs) ? inputs : [inputs];
    const startedAt = Date.now();

    if (mode === 'parallel' && !stopOnError) {
      const results = await runParallelLimited(
        list,
        concurrency,
        (item) => runner.run(item, context),
        false
      );
      return this.#summarize(results, startedAt);
    }

    const results = [];
    for (const item of list) {
      const result = await runner.run(item, context);
      results.push(result);
      if (!result.ok && stopOnError) break;
    }
    return this.#summarize(results, startedAt);
  }

  async enqueue(inputs, context = {}, options = {}) {
    return this.run(inputs, context, options);
  }

  #summarize(results, startedAt) {
    const ok = results.filter((result) => result?.ok).length;
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
    const { mode = DEFAULT_MODE, concurrency = 4, stopOnError = false, allowUnknown = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
    this.registry = new CommandRegistry();
    this.single = new SingleCommandRunner(this.registry, { allowUnknown, timeoutMs });
    this.multi = new MultiCommandRunner(this.registry, { mode, concurrency, stopOnError, allowUnknown, timeoutMs });
  }

  register(name, handler, options) {
    return this.registry.register(name, handler, options);
  }

  unregister(name) { this.registry.unregister(name); }
  has(name) { return this.registry.has(name); }
  get(name) { return this.registry.get(name); }
  list() { return this.registry.list(); }

  async run(input, context = {}) { return this.single.run(input, context); }
  async runMany(inputs, context = {}, options = {}) { return this.multi.run(inputs, context, options); }

  async runScript(script, context = {}, options = {}) {
    const inputs = Array.isArray(script) ? script : splitCommandScript(String(script), options);
    return this.runMany(inputs, context, { mode: 'series', ...options });
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
      const result = await this.run(input, context);
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
