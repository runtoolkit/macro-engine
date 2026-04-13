/**
 * CommandSystem — safe, general-purpose single and multi command execution.
 *
 * Security goals:
 * - No eval / no shell execution
 * - Prototype-pollution resistant cloning
 * - Optional permissions / timeout checks
 * - Concurrency-aware multi command runner
 */

import { splitScript } from './script.js';

const DEFAULT_MODE = 'series';
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

<<<<<<< HEAD
=======
function ownEnumerableDataEntries(value) {
  if (value === null || typeof value !== 'object') return [];
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const entries = [];

  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable) continue;
    if (DANGEROUS_KEYS.has(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) continue;
    entries.push([key, descriptor.value]);
  }

  return entries;
}

>>>>>>> 5bd5b7a (Fix #1)
function cloneValue(value, seen = new WeakMap()) {
  if (value == null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const item of value) out.push(cloneValue(item, seen));
    return out;
  }

  if (!isPlainObject(value)) return value;

  const out = Object.create(null);
  seen.set(value, out);
<<<<<<< HEAD
  for (const [key, nested] of Object.entries(value)) {
    if (DANGEROUS_KEYS.has(key)) continue;
=======
  for (const [key, nested] of ownEnumerableDataEntries(value)) {
>>>>>>> 5bd5b7a (Fix #1)
    out[key] = cloneValue(nested, seen);
  }
  return out;
}

function safeAssign(target, source) {
  if (!source || typeof source !== 'object') return target;
<<<<<<< HEAD
  for (const [key, value] of Object.entries(source)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    target[key] = value;
=======
  for (const [key, value] of ownEnumerableDataEntries(source)) {
    target[key] = cloneValue(value);
>>>>>>> 5bd5b7a (Fix #1)
  }
  return target;
}

<<<<<<< HEAD
=======
function readOwnDataProperty(source, key) {
  if (!source || typeof source !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(source, key);
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined;
}

>>>>>>> 5bd5b7a (Fix #1)
function normalizePermissionSet(value) {
  if (value == null) return new Set();
  if (value instanceof Set) return new Set([...value].map(String).map((item) => item.trim()).filter(Boolean));
  if (Array.isArray(value)) return new Set(value.map(String).map((item) => item.trim()).filter(Boolean));
<<<<<<< HEAD
  if (typeof value === 'string') return new Set(value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean));
=======
  if (typeof value === 'string') return new Set(value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean));
>>>>>>> 5bd5b7a (Fix #1)
  return new Set();
}

function normalizeRequires(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value instanceof Set) return [...value].map(String).map((item) => item.trim()).filter(Boolean);
<<<<<<< HEAD
  if (typeof value === 'string') return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
=======
  if (typeof value === 'string') return value.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
>>>>>>> 5bd5b7a (Fix #1)
  return [String(value).trim()].filter(Boolean);
}

function timeoutError(ms, name = 'Command') {
  const error = new Error(`${name} timed out after ${ms}ms`);
  error.name = 'TimeoutError';
  error.code = 'ETIMEDOUT';
  error.timeoutMs = ms;
  return error;
}

async function withTimeout(task, ms, name) {
  if (!Number.isFinite(ms) || ms <= 0) return task;
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(timeoutError(ms, name)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
    return { kind: 'batch', items: input.map((item) => cloneValue(item)) };
  }

  if (input && typeof input === 'object') {
<<<<<<< HEAD
    const name = input.name ?? input.cmd ?? input.command ?? '';
    const contextSource = input.context ?? input.ctx ?? null;
=======
    const name = readOwnDataProperty(input, 'name')
      ?? readOwnDataProperty(input, 'cmd')
      ?? readOwnDataProperty(input, 'command')
      ?? '';
    const contextSource = readOwnDataProperty(input, 'context')
      ?? readOwnDataProperty(input, 'ctx')
      ?? null;
    const rawArgs = readOwnDataProperty(input, 'args');
    const rawMeta = readOwnDataProperty(input, 'meta');
    const kind = readOwnDataProperty(input, 'kind') ?? (name ? 'command' : 'object');

>>>>>>> 5bd5b7a (Fix #1)
    return {
      kind,
      name,
<<<<<<< HEAD
      args: Array.isArray(input.args)
        ? input.args.map((arg) => cloneValue(arg))
        : input.args == null ? [] : [cloneValue(input.args)],
      context: contextSource && typeof contextSource === 'object' ? cloneValue(contextSource) : null,
      meta: input.meta ? cloneValue(input.meta) : undefined,
      raw: input,
=======
      args: Array.isArray(rawArgs)
        ? rawArgs.map((arg) => cloneValue(arg))
        : rawArgs == null ? [] : [cloneValue(rawArgs)],
      context: contextSource && typeof contextSource === 'object' ? cloneValue(contextSource) : null,
      meta: rawMeta === undefined ? undefined : cloneValue(rawMeta),
      raw: cloneValue(input),
>>>>>>> 5bd5b7a (Fix #1)
    };
  }

  throw new TypeError('Unsupported command input');
}

export class CommandRegistry {
  #commands = new Map();
  #aliases = new Map();

  register(name, handler, { aliases = [], description = '', meta = {}, requires = [], timeoutMs = 0 } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Command name must be a non-empty string');
    if (typeof handler !== 'function') throw new TypeError(`Handler for command "${name}" must be a function`);

    const record = {
      name,
      handler,
      description,
      meta: cloneValue(meta),
      requires: normalizeRequires(requires),
      timeoutMs: Math.max(0, Number(timeoutMs) || 0),
    };
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
    if (typeof name !== 'string' || !name.trim()) return null;
    return this.#commands.get(this.#aliases.get(name) ?? name) ?? null;
  }

  has(name) {
    return this.resolve(name) !== null;
  }

  list() {
    return [...this.#commands.values()].map(({ name, description, meta, requires, timeoutMs }) => ({
      name,
      description,
      meta: cloneValue(meta),
      requires: [...requires],
      timeoutMs,
    }));
  }
}

export class SingleCommandRunner {
  constructor(registry, { allowUnknown = false } = {}) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('SingleCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.allowUnknown = allowUnknown;
  }

  async run(input, context = {}, options = {}) {
    const normalized = normalizeCommand(input);
    const startedAt = Date.now();

    try {
      if (normalized.kind === 'batch') {
        const batch = new MultiCommandRunner(this.registry, options);
        return await batch.run(normalized.items, context, options);
      }

      if (normalized.kind === 'function') {
        const commandContext = Object.create(null);
        safeAssign(commandContext, cloneValue(context));
        if (normalized.context) safeAssign(commandContext, normalized.context);
        commandContext.command = normalized;
        commandContext.registry = this.registry;

        const timeoutMs = Math.max(0, Number(options.timeoutMs ?? context.timeoutMs ?? 0) || 0);
        const value = await withTimeout(
          normalized.fn(commandContext),
          timeoutMs,
          'Inline command',
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

      const commandContext = Object.create(null);
      safeAssign(commandContext, cloneValue(context));
      if (normalized.context) safeAssign(commandContext, normalized.context);
      commandContext.args = normalized.args;
      commandContext.command = normalized;
      commandContext.registry = this.registry;

      const required = record.requires;
      const granted = normalizePermissionSet(commandContext.permissions ?? commandContext.scopes ?? commandContext.roles);
      const missing = required.filter((permission) => !granted.has(permission));
      if (missing.length > 0) {
        const error = new Error(`Permission denied for command: ${name}`);
        error.code = 'EACCES';
        error.missingPermissions = missing;
        throw error;
      }

      const timeoutMs = Math.max(0, Number(options.timeoutMs ?? context.timeoutMs ?? record.timeoutMs ?? 0) || 0);
      const value = await withTimeout(
        record.handler(commandContext),
        timeoutMs,
        `Command "${name}"`,
      );
      return { ok: true, value, command: normalized, durationMs: Date.now() - startedAt };
    } catch (error) {
      return { ok: false, error, command: normalized, durationMs: Date.now() - startedAt };
    }
  }
}

export class MultiCommandRunner {
  constructor(registry, { mode = DEFAULT_MODE, concurrency = 4, stopOnError = false } = {}) {
    if (!(registry instanceof CommandRegistry)) throw new TypeError('MultiCommandRunner requires a CommandRegistry');
    this.registry = registry;
    this.mode = mode;
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.stopOnError = Boolean(stopOnError);
  }

  async run(inputs, context = {}, options = {}) {
    const mode = options.mode ?? this.mode;
    const runner = new SingleCommandRunner(this.registry, { allowUnknown: options.allowUnknown ?? false });
    const list = Array.isArray(inputs) ? inputs : [inputs];
    const startedAt = Date.now();

    if (mode === 'parallel') {
      const results = Array.from({ length: list.length });
      let index = 0;
      let shouldStop = false;

      const worker = async () => {
        while (true) {
          if (shouldStop) return;
          const current = index++;
          if (current >= list.length) return;
          const result = await runner.run(list[current], context, options);
          results[current] = result;
          if (!result.ok && this.stopOnError) {
            shouldStop = true;
          }
        }
      };

      const workerCount = Math.min(this.concurrency, list.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      for (let i = 0; i < results.length; i += 1) {
        if (!results[i]) {
          results[i] = { ok: false, skipped: true, durationMs: 0 };
        }
      }

      return this.#summarize(results, startedAt);
    }

    const results = [];
    for (const item of list) {
      const result = await runner.run(item, context, options);
      results.push(result);
      if (!result.ok && this.stopOnError) break;
    }
    return this.#summarize(results, startedAt);
  }

  async enqueue(inputs, context = {}, options = {}) {
    return this.run(inputs, context, options);
  }

  #summarize(results, startedAt) {
    const success = results.filter((result) => result.ok).length;
    const skipped = results.filter((result) => result.skipped).length;
    const failed = results.filter((result) => !result.ok && !result.skipped).length;
    return {
      ok: failed === 0 && skipped === 0,
      total: results.length,
      success,
      failed,
      skipped,
      results,
      durationMs: Date.now() - startedAt,
    };
  }
}

export class CommandSystem {
  #queue = [];

  constructor(options = {}) {
    const { mode = DEFAULT_MODE, concurrency = 4, stopOnError = false } = options;
    this.registry = new CommandRegistry();
    this.single = new SingleCommandRunner(this.registry, options);
    this.multi = new MultiCommandRunner(this.registry, { mode, concurrency, stopOnError });
  }

  register(name, handler, options) {
    return this.registry.register(name, handler, options);
  }

  unregister(name) { this.registry.unregister(name); }
  has(name) { return this.registry.has(name); }
  list() { return this.registry.list(); }

  async run(input, context = {}, options = {}) { return this.single.run(input, context, options); }
  async runMany(inputs, context = {}, options = {}) { return this.multi.run(inputs, context, options); }

  async runScript(script, context = {}, options = {}) {
<<<<<<< HEAD
    return this.runMany(splitScript(script), context, options);
=======
    return this.runMany(Array.isArray(script) ? script : splitScript(script), context, options);
>>>>>>> 5bd5b7a (Fix #1)
  }

  enqueue(input, context = {}) {
    this.#queue.push({ input, context: cloneValue(context) });
    return this.#queue.length;
  }

  clearQueue() {
    this.#queue.length = 0;
  }

  pending() {
    return this.#queue.length;
  }

  clearQueue() {
    this.#queue.length = 0;
  }

  pending() {
    return this.#queue.length;
  }

  async flush(options = {}) {
    const items = this.#queue.splice(0);
    if (items.length === 0) return { ok: true, total: 0, success: 0, failed: 0, skipped: 0, results: [], durationMs: 0 };

    const startedAt = Date.now();
    const results = [];
    for (const { input, context } of items) {
      const result = await this.run(input, context, options);
      results.push(result);
      if (!result.ok && options.stopOnError) break;
    }

    const success = results.filter((result) => result.ok).length;
    const skipped = results.filter((result) => result.skipped).length;
    const failed = results.filter((result) => !result.ok && !result.skipped).length;
    return {
      ok: failed === 0 && skipped === 0,
      total: results.length,
      success,
      failed,
      skipped,
      results,
      durationMs: Date.now() - startedAt,
    };
  }
}
